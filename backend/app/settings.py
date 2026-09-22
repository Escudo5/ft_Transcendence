from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent.parent


def parse_bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = parse_bool(os.environ.get("DJANGO_DEBUG", "1"), default=True)

allowed_hosts = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,10.19.247.102")
ALLOWED_HOSTS = [host.strip() for host in allowed_hosts.split(",") if host.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'django_extensions',
    "corsheaders",
    "rest_framework",
    "cards",
    "users",
    "social",
    "chat"
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    # 🟢 Anota que el usuario sigue vivo (para el estado en línea de los
    # amigos). VA DESPUÉS de AuthenticationMiddleware a propósito: es quien
    # pone request.user, y sin él este no sabría de quién hablamos.
    "users.middleware.SenalDeVidaMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "app.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "app.wsgi.application"
ASGI_APPLICATION = "app.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "transcendence"),
        "USER": os.environ.get("POSTGRES_USER", "transcendence"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "transcendence"),
        "HOST": os.environ.get("POSTGRES_HOST", "db"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-es"
TIME_ZONE = "Europe/Madrid"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

# 🖼️ FICHEROS QUE SUBEN LOS USUARIOS (de momento, solo los avatares)
#
# MEDIA_ROOT es la carpeta REAL del disco donde se guardan. Cae dentro de
# backend/, que en docker-compose está montada contra vuestro ordenador, así
# que las fotos NO se pierden al reiniciar los contenedores.
#
# MEDIA_URL es la dirección por la que el navegador las pide, y va con /api/ a
# propósito: el proxy de Vite ya manda a Django todo lo que empieza por /api,
# así que las fotos viajan por el camino que ya funciona y no hace falta tocar
# ni vite.config.js ni el docker-compose.
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "/api/media/"

# 🛡️ Límites del avatar. Quien los hace cumplir es la vista (users/views.py),
# que rechaza el fichero antes de guardar nada; aquí solo están los números
# para tenerlos todos juntos y que se cambien en un sitio.
AVATAR_MAX_BYTES = 2 * 1024 * 1024   # 2 MB
AVATAR_LADO_MAX = 512                # se reduce a 512x512 como mucho

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

cors_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173")
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
# Permite que el navegador envíe/reciba la cookie de sesión en las peticiones
# del frontend (los fetch tienen que llevar credentials: 'include')
CORS_ALLOW_CREDENTIALS = True

csrf_origins = os.environ.get("CSRF_TRUSTED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173")
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in csrf_origins.split(",") if origin.strip()]
AUTH_USER_MODEL = "users.CustomUser"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SAMESITE = 'None'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')

DEFAULT_FROM_EMAIL = f'Transcendence <{EMAIL_HOST_USER}>'
