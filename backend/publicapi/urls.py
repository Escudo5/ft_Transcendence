"""Rutas de la API pública. Todas cuelgan de /api/publica/."""

from django.urls import path

from . import documentacion, escritura, views

urlpatterns = [
    # --- La documentación, y la única ruta que no pide clave ---
    path('', documentacion.PortadaView.as_view(), name='api-portada'),

    # --- Consultar ---
    path('catalogo/', views.CatalogoView.as_view(), name='api-catalogo'),
    path('mi-album/', views.MiAlbumView.as_view(), name='api-mi-album'),
    path('alumnos/<str:login>/', views.AlumnoView.as_view(), name='api-alumno'),

    # --- Jugar ---
    path('intercambios/', escritura.IntercambiosApiView.as_view(),
         name='api-intercambios'),
    path('intercambios/<int:pk>/', escritura.IntercambioApiView.as_view(),
         name='api-intercambio'),
    path('descartar/', escritura.DescartarApiView.as_view(),
         name='api-descartar'),

    # --- Tus propias claves ---
    path('claves/', escritura.ClavesView.as_view(), name='api-claves'),
    path('claves/<int:pk>/', escritura.ClaveView.as_view(), name='api-clave'),
]
