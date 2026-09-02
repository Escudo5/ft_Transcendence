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

    # 🖥️ Vistas directas que teníais para pruebas en el navegador
    path('home/', home, name='home'),
    path('crear/', crear_carta, name='crear_carta'),
    path('catalogo/', lista_cartas, name='lista_cartas'),
]