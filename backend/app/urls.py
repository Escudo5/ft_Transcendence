from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from cards.views import login_alumno

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

    # 🔑 API PÚBLICA: la ventanilla para programas de fuera, que entran
    # con una clave en vez de con la cookie del navegador.
    path('api/publica/', include('publicapi.urls')),

    # 🗑️ AQUÍ HABÍA TRES RUTAS DE ANTES DE REACT, y se han quitado (5/10).
    #
    #     path('home/',     home,          name='home')
    #     path('crear/',    crear_carta,   name='crear_carta')
    #     path('catalogo/', lista_cartas,  name='lista_cartas')
    #
    # Eran las pantallas que Django pintaba solo, al principio del proyecto,
    # antes de que el front fuera React. Llevaban a tres plantillas HTML que
    # Pablo borró el 5/10 (commit cbe78d8) junto con los comentarios, pero las
    # rutas se quedaron: las tres respondían 500 (TemplateDoesNotExist).
    #
    # Se quitan en vez de devolver las plantillas porque no las usaba NADIE:
    # ni el front (comprobado) ni el resto del backend. Y `crear_carta` encima
    # llamaba a `redirect` sin importarlo, así que su POST ya estaba roto
    # desde siempre.
    #
    # ⚠️ Las direcciones /catalogo y /crear SIGUEN EXISTIENDO, pero son del
    # front (React las enruta en App.jsx). Lo que se ha quitado son las de
    # Django, en el puerto 8000.
]

# 🖼️ Para que se vean los avatares que sube la gente.
#
# Esto solo funciona en modo desarrollo (DEBUG), que es como trabajáis y como
# se hace la evaluación. En un servidor de verdad estas fotos las serviría
# nginx directamente, porque Django sirviendo ficheros es lento.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)