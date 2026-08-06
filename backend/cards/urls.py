from django.urls import path
from .views import CardListCreateView, HealthCheckView, abrir_sobre_endpoint, album_usuario, make_contract
from . import views

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("", CardListCreateView.as_view(), name="cards-list-create"), # Corresponde a /api/cards/
    path('sobres/abrir/<str:tipo_sobre>/', views.abrir_sobre_endpoint, name='abrir_sobre'),
    path("album/", views.album_usuario, name='album_usuario'),

    # ✅ CORRECTO: Sin 'cards/' delante y colocado ANTES de <str:login>/
    path('contract/', views.make_contract, name='make_contract'),

    # ⚠️ <str:login>/ DEBE SER LA ÚLTIMA RUTA porque atrapa cualquier texto
    path('<str:login>/', views.login_alumno, name='login_alumno'),
]