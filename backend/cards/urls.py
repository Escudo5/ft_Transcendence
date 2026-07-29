from django.urls import path
from .views import CardListCreateView, HealthCheckView,abrir_sobre_endpoint,album_usuario
from . import views
urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("cards/", CardListCreateView.as_view(), name="cards-list-create"),
    path('sobres/abrir/<str:tipo_sobre>/', views.abrir_sobre_endpoint, name='abrir_sobre'),
    path("album/",views.album_usuario,name='album_usuario'),
    path('<str:login>/', views.login_alumno, name='login_alumno'),
]
