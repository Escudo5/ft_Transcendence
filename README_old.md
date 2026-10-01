# ft_Transcendence

Proyecto fullstack para crear un juego de cartas tipo Virus usando datos de la API de 42.

Este repo ya trae una base para arrancar:
- **Backend** con Django + Django REST Framework
- **Frontend web** con React (Vite)
- **Base de datos** PostgreSQL
- Todo levantado con **Docker Compose**

---

## 1) Idea general del proyecto (teoría simple)

Pensad el sistema en 3 capas:

1. **Datos** (PostgreSQL): donde se guardan cartas, usuarios, colecciones, partidas.
2. **Lógica** (Django): reglas, validaciones, API para frontend y juego.
3. **Interfaz** (React/Godot): lo que ve el usuario.

Separar así os da ventajas:
- podéis cambiar la interfaz (React/Godot) sin romper la lógica.
- evitáis trampas porque las reglas viven en el servidor.
- trabajáis en paralelo los 5 sin pisaros demasiado.

---

## 2) ¿Por qué Docker? (teoría simple)

Un contenedor es como una "mini máquina" para cada servicio.

En este proyecto:
- **db**: PostgreSQL
- **backend**: Django
- **frontend**: React

Ventajas:
- mismo entorno para todo el equipo (en mi PC = en la tuya).
- onboarding rápido.
- menos "a mí me funciona y a ti no".

---

## 3) Estructura actual

```text
.
├── backend/
│   ├── app/                 # configuración Django
│   ├── cards/               # app inicial de cartas
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .env.example
└── docker-compose.yml
```

---

## 4) Primer arranque paso a paso (desde cero)

### Requisitos
- Docker
- Docker Compose (plugin moderno)
- Git

### 1. Copiar variables de entorno

```bash
cp .env.example .env
```

### 2. Levantar todo

```bash
docker compose up --build
```

Si tu máquina usa el comando clásico:

```bash
docker-compose up --build
```

### 3. Abrir en navegador

- Frontend React: http://localhost:5173
- Backend Django API: http://localhost:8000/api/health/
- Admin Django: http://localhost:8000/admin/

### 4. (Opcional) crear superusuario para admin

En otra terminal:

```bash
docker compose exec backend python manage.py createsuperuser
```

Con comando clásico:

```bash
docker-compose exec backend python manage.py createsuperuser
```

---

## 5) Endpoints iniciales

- `GET /api/health/` → comprobar si backend está vivo.
- `GET /api/cards/` → lista de cartas.
- `POST /api/cards/` → crear carta.

Ejemplo rápido para crear una carta:

```bash
curl -X POST http://localhost:8000/api/cards/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cadet",
    "description": "Carta inicial",
    "attack": 4,
    "defense": 3,
    "rarity": "common"
  }'
```

---

## 6) Cómo trabajar en equipo (5 personas)

Reparto recomendado para empezar:

1. **Backend Core**: modelos, API, auth, conexión API 42.
2. **Game Rules**: balance, efectos, turnos, validación servidor.
3. **Frontend Web**: álbum, filtros, deck builder.
4. **Infra/DevOps**: Docker, CI, variables, observabilidad.
5. **QA + Integración**: tests, contratos API, documentación.

Regla de oro:
- rama por tarea (`feature/cards-endpoint`, `feature/react-album`).
- PR corta + review de 1 compañero.
- merge frecuente para evitar conflictos enormes.

---

## 7) Siguiente fase recomendada

Orden para avanzar sin bloquearos:

1. Login con OAuth 42 (Django).
2. Modelo de usuario y colección de cartas.
3. Sincronizar datos de la API de 42 (jobs).
4. Deck builder en React.
5. Reglas de partida en backend.
6. Integrar cliente de juego (Godot WASM) contra la misma API.

---

## 8) Godot WASM en esta arquitectura (teoría)

Godot será **otro cliente**, igual que React:
- pide datos al backend por HTTP/WebSocket.
- no debe tener reglas críticas en cliente.
- backend valida cada jugada.

Esto permite:
- web álbum en React.
- partida con Godot.
- una sola fuente de verdad en el servidor.

---

## 9) Comandos útiles

Parar servicios:

```bash
docker compose down
```

```bash
docker-compose down
```

Parar y borrar volúmenes (reinicio limpio de DB):

```bash
docker compose down -v
```

```bash
docker-compose down -v
```

Logs backend:

```bash
docker compose logs -f backend
```

```bash
docker-compose logs -f backend
```

Entrar al contenedor backend:

```bash
docker compose exec backend sh
```

```bash
docker-compose exec backend sh
```

---

## 10) Nota importante para producción

Esta base está pensada para **desarrollo**.

Para producción habrá que añadir como mínimo:
- secretos seguros
- `DEBUG=0`
- servidor ASGI/WSGI de producción
- HTTPS + dominio
- estrategia de despliegue y backups
