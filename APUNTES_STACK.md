# Apuntes detallados del stack (Docker + Django + React) desde 0

Este documento explica **qué hace cada archivo del proyecto**, cómo se relaciona con el resto y qué conceptos de teoría hay detrás.

> Objetivo: que una persona que nunca usó este stack pueda abrir el repo y entender el flujo completo.

---

## 1) Visión global: qué estáis construyendo

Tenéis una app fullstack con 3 servicios:

1. **db (PostgreSQL)**: guarda datos persistentes (cartas, usuarios, partidas, etc.).
2. **backend (Django + DRF)**: lógica de negocio y API HTTP.
3. **frontend (React + Vite)**: interfaz web.

Estos 3 servicios se arrancan con Docker Compose y se comunican entre sí en una red interna.

---

## 2) Árbol actual del proyecto

```text
.
├── .env.example
├── .gitignore
├── APUNTES_STACK.md
├── README.md
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── manage.py
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── cards/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── urls.py
│       ├── views.py
│       └── migrations/
│           ├── __init__.py
│           └── 0001_initial.py
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

---

## 3) Archivos de raíz (root)

### `docker-compose.yml`
Es el archivo más importante para desarrollo local. Define servicios, red, volúmenes y variables.

- **service `db`**:
  - imagen `postgres:16-alpine`
  - puerto host `5432:5432`
  - volumen `postgres_data` para no perder datos al reiniciar contenedor
  - `healthcheck` para comprobar que PostgreSQL está listo
- **service `backend`**:
  - build desde `./backend`
  - comando: `python manage.py migrate && python manage.py runserver 0.0.0.0:8000`
  - monta `./backend:/app` (hot reload de código)
  - expone `8000:8000`
  - depende de `db` (espera a que esté healthy)
- **service `frontend`**:
  - build desde `./frontend`
  - comando: `npm install && npm run dev -- --host 0.0.0.0 --port 5173`
  - expone `5173:5173`
  - monta `./frontend:/app` y volumen para `node_modules`
  - depende de backend

**Relación clave**:
- El backend habla con la DB usando host `db` (nombre del servicio de compose).
- El frontend llama al backend usando `VITE_API_URL`.

---

### `.env.example`
Plantilla de variables de entorno. Se copia a `.env`.

- Variables de PostgreSQL: nombre DB, usuario, contraseña.
- Variables de Django: secret key, debug, hosts, CORS.
- Variable de frontend: URL base de API.

**Teoría**: variables de entorno separan configuración de código. Así no hardcodeáis secretos ni URLs por entorno.

---

### `.gitignore`
Evita subir archivos que no deben ir a Git:
- caches de Python (`__pycache__`, etc.)
- dependencias front (`node_modules`, `dist`)
- ficheros de entorno (`.env`)
- configuración local del editor

---

### `README.md`
Guía rápida de arranque, arquitectura base y comandos útiles.

**Relación**: `README.md` es onboarding rápido; `APUNTES_STACK.md` (este archivo) es la referencia profunda.

---

## 4) Carpeta `backend/` (Django)

### Teoría rápida de Django

Django organiza el backend en:
- **Proyecto**: configuración global (`app/`).
- **Apps**: módulos funcionales (`cards/`).
- **ORM**: clases Python (`models.py`) que representan tablas SQL.
- **Migrations**: historial versionado de cambios de esquema.

DRF (Django REST Framework) añade:
- **Serializers**: traducen modelos <-> JSON.
- **Views/APIViews/Generics**: lógica de endpoints HTTP.

---

### `backend/Dockerfile`
Construye imagen Python para backend.

1. `FROM python:3.12-slim`
2. Variables para Python (no `.pyc`, logs directos)
3. `WORKDIR /app`
4. copia `requirements.txt` e instala dependencias
5. copia código del backend

**Relación**: Docker Compose usa este Dockerfile para levantar el servicio `backend`.

---

### `backend/requirements.txt`
Dependencias Python:
- `Django`: framework web.
- `djangorestframework`: API REST.
- `django-cors-headers`: permitir origen de frontend.
- `psycopg2-binary`: driver PostgreSQL.

---

### `backend/manage.py`
Entrypoint de comandos Django.

Ejemplos:
- `python manage.py migrate`
- `python manage.py runserver`
- `python manage.py createsuperuser`

Internamente configura `DJANGO_SETTINGS_MODULE = app.settings` y ejecuta comandos del core de Django.

---

## 5) `backend/app/` (configuración global del proyecto Django)

### `backend/app/__init__.py`
Archivo de paquete Python. Permite importar `app` como módulo.
Ahora mismo está vacío (normal).

---

### `backend/app/settings.py`
Configuración central de Django.

Partes importantes:
- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` desde variables de entorno.
- `INSTALLED_APPS`: apps nativas + `corsheaders` + `rest_framework` + `cards`.
- `MIDDLEWARE`: cadena de middlewares por cada request.
- `ROOT_URLCONF = "app.urls"`: mapa raíz de rutas.
- `DATABASES`: conexión PostgreSQL con datos de `.env`.
- zona horaria/idioma.
- `CORS_ALLOWED_ORIGINS`: permite peticiones desde frontend React.

**Relación crítica**:
- si `cards` no está en `INSTALLED_APPS`, modelos/migraciones/views no se cargan.
- si DB está mal aquí, ningún endpoint que toque datos funcionará.

---

### `backend/app/urls.py`
Router raíz de Django.

Define:
- `/admin/` -> panel admin Django.
- `/api/` -> delega en `cards.urls`.

**Relación**:
- `cards.urls` añade subrutas (`health/`, `cards/`).
- Resultado final: `/api/health/` y `/api/cards/`.

---

### `backend/app/asgi.py`
Punto de entrada ASGI.

Se usa para servidores asíncronos (WebSocket, long-lived connections, etc.).
Ahora mismo inicializa la app Django con settings.

**Teoría**:
- ASGI = interfaz moderna para async (útil cuando metáis realtime).

---

### `backend/app/wsgi.py`
Punto de entrada WSGI.

Se usa en despliegues HTTP clásicos síncronos.

**Teoría**:
- WSGI = estándar tradicional de Python web.
- En dev usáis `runserver`, pero en producción normalmente hay gunicorn/uvicorn + proxy.

---

## 6) `backend/cards/` (app de dominio de cartas)

### `backend/cards/__init__.py`
Marca `cards` como paquete Python. Vacío por diseño.

---

### `backend/cards/apps.py`
Config declarativa de la app (`CardsConfig`).

`name = "cards"` identifica la app ante Django.

---

### `backend/cards/models.py`
Define el modelo `Card` (ORM):
- `name`, `description`, `attack`, `defense`, `rarity`, `created_at`

**Teoría ORM**:
- Cada clase `models.Model` = tabla SQL.
- Cada atributo = columna.
- Django crea/actualiza esquema con migrations.

---

### `backend/cards/migrations/0001_initial.py`
Primera migración de la app:
- crea tabla `Card` con sus columnas.

**Teoría**:
- Una migration es “un commit de base de datos”.
- `migrate` aplica migrations pendientes en orden.

---

### `backend/cards/migrations/__init__.py`
Archivo de paquete para que Django detecte el módulo `migrations`.

---

### `backend/cards/serializers.py`
`CardSerializer` convierte:
- modelo `Card` -> JSON (respuesta API)
- JSON -> modelo validado (creación/actualización)

`read_only_fields = ["id", "created_at"]` evita que cliente escriba esos campos.

**Relación**: las views API usan este serializer para validar y serializar.

---

### `backend/cards/views.py`
Lógica HTTP de endpoints.

- `HealthCheckView(APIView)`:
  - `GET` devuelve `{"status": "ok"}`
- `CardListCreateView(ListCreateAPIView)`:
  - `GET` lista cartas ordenadas por fecha
  - `POST` crea una carta usando serializer

**Relación**:
- usa `Card` (modelo) + `CardSerializer`.
- `cards/urls.py` expone estas views por ruta.

---

### `backend/cards/urls.py`
Rutas de la app:
- `health/` -> `HealthCheckView`
- `cards/` -> `CardListCreateView`

Se monta bajo `/api/` desde `app/urls.py`.

---

### `backend/cards/admin.py`
Registra `Card` en panel admin de Django:
- columnas visibles
- filtros por rareza
- buscador por nombre/rareza

**Relación**: os permite gestionar cartas rápido sin interfaz custom.

---

## 7) Carpeta `frontend/` (React + Vite)

### Teoría rápida de React + Vite

- **React**: librería para UI basada en componentes y estado.
- **Vite**: dev server + bundler moderno (arranque rápido, HMR).
- `import.meta.env` permite usar variables de entorno prefijadas con `VITE_`.

---

### `frontend/Dockerfile`
Imagen Node para frontend.

1. base `node:20-alpine`
2. `WORKDIR /app`
3. copia package files
4. `npm install`
5. copia código

**Relación**: compose usa esta imagen para ejecutar `npm run dev`.

---

### `frontend/package.json`
Metadatos, scripts y dependencias JS.

- scripts:
  - `dev` -> levanta Vite
  - `build` -> build producción
  - `preview` -> sirve build
- deps:
  - `react`, `react-dom`
  - plugin de Vite para React

---

### `frontend/vite.config.js`
Config de Vite. Activa plugin React.

---

### `frontend/index.html`
Plantilla HTML base.

- Tiene `<div id="root"></div>` donde React monta la app.
- Carga `/src/main.jsx` como entrypoint.

---

### `frontend/src/main.jsx`
Bootstrap de React:
- importa React/ReactDOM
- importa `App`
- renderiza `<App />` dentro de `#root`

`React.StrictMode` ayuda en desarrollo detectando prácticas peligrosas.

---

### `frontend/src/App.jsx`
Componente principal:

- lee `VITE_API_URL`
- al montar (`useEffect`) hace 2 requests:
  1. `/health/` para estado backend
  2. `/cards/` para listar cartas
- muestra error si falla una petición
- renderiza lista de cartas o mensaje vacío

**Relación crítica**:
- depende de backend vivo en `http://localhost:8000/api` (por defecto).
- consume exactamente los endpoints definidos en Django.

---

### `frontend/src/styles.css`
Estilos globales básicos para layout y colores.

---

## 8) Cómo se relaciona todo (flujo completo)

### Flujo de arranque

1. Ejecutas `docker compose up --build`.
2. Compose crea red y levanta `db`.
3. Cuando DB está healthy, arranca `backend`.
4. Backend ejecuta `migrate` (crea/actualiza tablas).
5. Arranca server Django en `:8000`.
6. Arranca `frontend` (Vite) en `:5173`.
7. En navegador cargas React; React llama a API Django.

---

### Flujo de una petición real (`GET /api/cards/`)

1. `App.jsx` ejecuta `fetch("${VITE_API_URL}/cards/")`.
2. La request llega a `app/urls.py` (`/api/`).
3. Django delega en `cards/urls.py` (`cards/`).
4. Se ejecuta `CardListCreateView`.
5. La view consulta modelo `Card` (ORM -> PostgreSQL).
6. `CardSerializer` transforma queryset a JSON.
7. Django responde al frontend.
8. React guarda en estado y renderiza lista.

---

## 9) Conceptos de teoría que os conviene dominar ya

1. **Cliente/Servidor**: frontend nunca toca DB directa; siempre pasa por API.
2. **ORM**: escribes Python, Django traduce a SQL.
3. **Migrations**: historial reproducible del esquema DB.
4. **Serialización**: frontera entre objetos Python y JSON HTTP.
5. **CORS**: navegador bloquea cross-origin si backend no lo permite.
6. **Variables de entorno**: config fuera del código.
7. **Contenedores**: entorno reproducible por servicio.
8. **Volúmenes Docker**: datos persistentes (DB, node_modules).

---

## 10) Dónde encaja Godot WASM después

Cuando metáis juego:
- Godot será **otro cliente** (como React), no el dueño de las reglas.
- reglas críticas y validación: backend.
- Godot/React: presentación y UX.

Así mantenéis una sola fuente de verdad y evitáis desincronización entre clientes.

---

## 11) Mapa rápido "archivo -> impacto"

- Si tocáis **`docker-compose.yml`**: puede romper arranque global.
- Si tocáis **`settings.py`**: afecta seguridad, DB, CORS, apps cargadas.
- Si tocáis **`models.py`**: requiere nueva migration.
- Si tocáis **`serializers.py`**: cambia formato/validación JSON.
- Si tocáis **`views.py` o `urls.py`**: cambian endpoints.
- Si tocáis **`App.jsx`**: cambia comportamiento de UI y consumo de API.
- Si tocáis **`.env`**: cambia configuración por entorno sin cambiar código.

---

## 12) Resumen mental para el equipo

- **Compose** orquesta.
- **Django** decide reglas y acceso a datos.
- **PostgreSQL** persiste.
- **React** pinta y consume API.
- **Migrations** mantienen sincronizada la DB con el código.

Si entendéis esa cadena, podéis crecer el proyecto sin caos.
