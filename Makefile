# ==============================================================================
# CONFIGURACIÓN Y VARIABLES
# ==============================================================================
DC       = docker compose

# 🔧 ARREGLO (Nacho, 24/09): antes esto era `SERVICE = backend`, y esa MISMA
# variable la usaban dentro `logs` y `recreate` para decidir "todos los
# servicios o uno solo". Al tener siempre valor, el `if [ -z "$(SERVICE)" ]` de
# esos dos NUNCA se cumplía: `make logs` mostraba solo el backend aunque la
# ayuda prometiera todos, y el mensaje de error de `recreate` era código al que
# no se podía llegar.
#
# Ahora son dos cosas distintas: BACKEND es fijo, porque es el contenedor donde
# vive manage.py; SERVICE lo pone quien llama y por defecto está vacío.
BACKEND  = backend
EXEC     = $(DC) exec $(BACKEND)
MANAGE   = $(EXEC) python3 manage.py
SERVICE ?=

ESPECIFIC_LOGINS = pablalva nmagro-r smarquez osmunoz- ksudyn

# 🔧 ARREGLO (Nacho, 24/09): declaraba `test`, que no existe, y le faltaban 9
# targets. Sin declarar, el día que aparezca en el repo un fichero o una carpeta
# con el nombre de un target, `make` dice "nothing to be done" y no explica nada.
.PHONY: help build up up_silent start start_full down down_clean recreate \
        restart logs migrations migrate shell superuser wait_backend \
        sync-quick sync-full insert_login pwa

# Comando por defecto si solo escribes 'make'
.DEFAULT_GOAL := help

help:
	@echo "======================================================================================================"
	@echo "                      COMANDOS DISPONIBLES                                                            "
	@echo "======================================================================================================"
	@echo "  make build        - Construye los contenedores"
	@echo "  make up           - Levanta los contenedores"
	@echo "  make up_silent    - Levanta los contenedores en segundo plano"
	@echo "  make start        - Crea y levanta los contenedores ademas de un mapeo basico de la base de datos"
	@echo "  make start_full   - Crea y levanta los contenedores ademas de mapear completa la base de datos"
	@echo "  make down         - Detiene y elimina los contenedores"
	@echo "  make down_clean   - Detiene y elimina los contenedores ademas de borrar los volumenes"
	@echo "  make recreate     - Recrea un servicio:   make recreate SERVICE=frontend"
	@echo "  make restart      - Reinicia los contenedores"
	@echo "  make logs         - Logs de todos, o de uno: make logs SERVICE=backend"
	@echo "------------------------------------------------------------------------------------------------------"
	@echo "  make migrate      - Aplica las migraciones pendientes"
	@echo "  make migrations   - Crea nuevas migraciones a partir de los modelos"
	@echo "  make shell        - Abre la consola interactiva de Django"
	@echo "  make superuser    - Crea un superusuario de Django"
	@echo "------------------------------------------------------------------------------------------------------"
	@echo "  make sync-quick   - Mapeo y actualización basica de la base de datos"
	@echo "  make sync-full    - Mapeo y actualización completa de la base de datos"
	@echo "  make insert_login - Crea o actualiza el login designado en la base de datos"
	@echo "------------------------------------------------------------------------------------------------------"
	@echo "  make pwa          - Compila y sirve la PWA en http://localhost:4173 (para poder ensenarla)"
	@echo "======================================================================================================"

# ==============================================================================
# DOCKER & SERVICIOS
# ==============================================================================
build:
	$(DC) build

up:
	$(DC) up

up_silent:
	$(DC) up -d

# 🔧 ARREGLO (Nacho, 24/09): se ha metido `wait_backend` en medio.
# `up -d` vuelve en cuanto el contenedor ARRANCA, no cuando Django ha acabado de
# migrar: el `migrate` va dentro del `command:` del docker-compose (línea 23).
# Sin esperar, el `exec` de sync-quick podía caer a mitad de las migraciones y
# fallar con "relation does not exist". Era una carrera: unas veces salía bien y
# otras no, que es justo el tipo de fallo que cuesta una tarde encontrar.
start: build up_silent wait_backend sync-quick
start_full: build up_silent wait_backend sync-full

# Espera a que el backend responda Y no le queden migraciones pendientes.
# `migrate --check` sale con código 0 solo si está todo aplicado, así que sirve
# de las dos cosas: que Postgres acepte conexiones y que el migrate haya acabado.
wait_backend:
	@echo "⏳ Esperando a que el backend acabe de migrar..."
	@for i in $$(seq 1 30); do \
		if $(DC) exec -T $(BACKEND) python3 manage.py migrate --check >/dev/null 2>&1; then \
			echo "✅ Backend listo."; \
			exit 0; \
		fi; \
		sleep 2; \
	done; \
	echo "❌ El backend no ha respondido en 60s. Mira 'make logs SERVICE=backend'."; \
	exit 1

down:
	$(DC) down

down_clean:
	$(DC) down -v

recreate:
	@if [ -z "$(SERVICE)" ]; then \
		echo "❌ Error: Falta especificar el servicio."; \
		echo "💡 Uso correcto: make recreate SERVICE=nombre_del_servicio"; \
		exit 1; \
	fi
	$(DC) up -d --force-recreate $(SERVICE)

restart:
	$(DC) restart

logs:
	@if [ -z "$(SERVICE)" ]; then \
		echo "📋 Mostrando logs de todos los servicios..."; \
		$(DC) logs -f; \
	else \
		echo "📋 Mostrando logs del servicio: $(SERVICE)"; \
		$(DC) logs -f $(SERVICE); \
	fi

# ==============================================================================
# DJANGO ESTÁNDAR
# ==============================================================================
migrations:
	$(MANAGE) makemigrations

migrate:
	$(MANAGE) migrate

shell:
	$(MANAGE) shell

superuser:
	$(MANAGE) createsuperuser


# ==============================================================================
# COMANDOS PERSONALIZADOS (Añade los tuyos aquí abajo)
# ==============================================================================
sync-quick:
	$(MANAGE) fill_db --quick
	@for login in $(ESPECIFIC_LOGINS); do \
		echo "📥 Procesando login: $$login"; \
		$(MANAGE) login_card $$login; \
	done
	@echo "✨ ¡Lote de logins procesado con éxito!"

insert_login:
	@if [ -z "$(LOGIN)" ]; then \
		echo "❌ Error: Falta el argumento obligatorio."; \
		echo "💡 Uso correcto: make insert_login LOGIN=login_del_usuario"; \
		exit 1; \
	fi
	$(MANAGE) login_card  $(LOGIN)

sync-full:
	$(MANAGE) fill_db

# ==============================================================================
# 📱 LA PWA
# ==============================================================================
#
# `npm run dev` NO sirve para ensenar la PWA. El service worker solo se
# registra en la compilacion de produccion (main.jsx mira import.meta.env.PROD,
# que en el modo dev es false), y sin el no hay ni instalacion ni modo sin
# conexion: justo las dos cosas que pide el modulo.
#
# Esto compila y sirve esa version. El dev server del 3000 se queda donde
# estaba, no se pisan.
#
# ⚠️ HAY QUE ABRIRLO COMO http://localhost:4173, en la maquina que lo lanza.
# Un service worker necesita "contexto seguro": http://localhost SIEMPRE lo es,
# pero http://10.19.x.x NO. Y por https tampoco valdria, porque nuestro
# certificado es autofirmado y Chrome se niega a registrar el service worker
# cuando el certificado da error. El porque esta en frontend/vite.config.js.
pwa:
	@echo "🔨 Compilando el frontend..."
	$(DC) exec -T frontend npm run build
	@echo ""
	@echo "=================================================================="
	@echo "  📱 Abre  http://localhost:4173  en Chrome"
	@echo ""
	@echo "  Para comprobar que la PWA va:"
	@echo "    1. En la barra de direcciones sale el icono de instalar"
	@echo "    2. F12 > Application > Service Workers: 'activated and running'"
	@echo "    3. F12 > Network > Offline, y recarga: la web sigue abriendo"
	@echo ""
	@echo "  Ctrl+C para parar."
	@echo "=================================================================="
	@echo ""
	$(DC) exec frontend npm run preview -- --host 0.0.0.0 --port 4173

