# ==============================================================================
# CONFIGURACIÓN Y VARIABLES
# ==============================================================================
DC       = docker compose
SERVICE  = backend
EXEC     = $(DC) exec $(SERVICE)
MANAGE   = $(EXEC) python3 manage.py
ESPECIFIC_LOGINS = pablalva nmagro-r smarquez osmunoz- ksudyn

.PHONY: help up down build restart logs shell migrations migrate test

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
	@echo "  make recreate     - Recrea y levanta el contenedor designado"
	@echo "  make restart      - Reinicia los contenedores"
	@echo "  make logs         - Muestra los logs de los servicios o del servicio definido"
	@echo "------------------------------------------------------------------------------------------------------"
	@echo "  make migrate      - Aplica las migraciones pendientes"
	@echo "  make migrations   - Crea nuevas migraciones a partir de los modelos"
	@echo "  make shell        - Abre la consola interactiva de Django"
	@echo "  make superuser    - Crea un superusuario de Django"
	@echo "------------------------------------------------------------------------------------------------------"
	@echo "  make sync-quick   - Mapeo y actualización basica de la base de datos"
	@echo "  make sync-full    - Mapeo y actualización completa de la base de datos"
	@echo "  make insert_login - Crea o actualiza el login designado en la base de datos"
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

start: build up_silent sync-quick
start_full: build up_silent sync-full

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

