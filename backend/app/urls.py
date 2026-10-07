from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # 🃏 RUTAS DE LAS CARTAS (Todo lo que empiece por api/cards/)
    path("api/cards/", include("cards.urls")),

    # 👥 RUTAS DE LOS USUARIOS (Todo lo que empiece por api/users/)
    path('api/users/', include('users.urls')),

    # 🤝 RUTAS DE AMISTADES (solicitudes y lista de amigos)
    path('api/social/', include('social.urls')),

    # 💬 RUTAS DEL CHAT (conversaciones y mensajes)
    path('api/chat/', include('chat.urls')),

    # 🔑 API PÚBLICA: la ventanilla para programas de fuera, que entran
    # con una clave en vez de con la cookie del navegador.
    path('api/publica/', include('publicapi.urls')),
]

# 🖼️ Las fotos de perfil que sube la gente. Solo en DEBUG (desarrollo y
# evaluación); en un servidor de verdad las serviría nginx.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)