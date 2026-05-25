from django.contrib import admin
from django.urls import include, path
from cards.views import crear_carta, lista_cartas, home
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("cards.urls")),
    path('home/',home,name='home'),
    path('crear/',crear_carta, name='crear_carta'),
    path('catalogo/',lista_cartas,name='lista_cartas'),

]
