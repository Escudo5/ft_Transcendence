"""Rutas de la API pública. Todas cuelgan de /api/publica/."""

from django.urls import path

from . import views

urlpatterns = [
    path('catalogo/', views.CatalogoView.as_view(), name='api-catalogo'),
    path('mi-album/', views.MiAlbumView.as_view(), name='api-mi-album'),
    path('alumnos/<str:login>/', views.AlumnoView.as_view(), name='api-alumno'),
]
