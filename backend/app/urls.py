from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from cards.views import crear_carta, lista_cartas, home, login_alumno

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # 🃏 RUTAS DE LAS CARTAS (Todo lo que empiece por api/cards/)
    path("api/cards/", include("cards.urls")),
    path("api/cards/<str:login>",login_alumno,name="login_alumno"),
    # 👥 RUTAS DE LOS USUARIOS (Todo lo que empiece por api/users/)
    path('api/users/', include('users.urls')),

    # 🤝 RUTAS DE AMISTADES (solicitudes y lista de amigos)
    path('api/social/', include('social.urls')),

    # 💬 RUTAS DEL CHAT (conversaciones y mensajes)
    path('api/chat/', include('chat.urls')),

    # 🖥️ Vistas directas que teníais para pruebas en el navegador
    path('home/', home, name='home'),
    path('crear/', crear_carta, name='crear_carta'),
    path('catalogo/', lista_cartas, name='lista_cartas'),
]

# 🖼️ Para que se vean los avatares que sube la gente.
#
# Esto solo funciona en modo desarrollo (DEBUG), que es como trabajáis y como
# se hace la evaluación. En un servidor de verdad estas fotos las serviría
# nginx directamente, porque Django sirviendo ficheros es lento.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)