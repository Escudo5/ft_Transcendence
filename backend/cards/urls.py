from django.urls import path
from .views import CardListView, HealthCheckView, abrir_sobre_endpoint, album_usuario
from . import views
from .intercambios import (
    IntercambiosView, RepetidasView, ResponderIntercambioView, DescartarView,
)
from .contratos import ContratosView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    # Corresponde a /api/cards/. Solo lectura desde el 5/10: ver CardListView.
    path("", CardListView.as_view(), name="cards-list"),
    path('ranking/', views.ranking, name='ranking'),
    path('sobres/', views.mis_sobres, name='mis_sobres'),
    path('sobres/reclamar/', views.reclamar_regalo_diario, name='reclamar_regalo_diario'),
    path('sobres/abrir/<str:tipo_sobre>/', views.abrir_sobre_endpoint, name='abrir_sobre'),
    path("album/", views.album_usuario, name='album_usuario'),

    # 🤝 CONTRATOS (nuestra version, cards/contratos.py)
    path('contratos/', ContratosView.as_view(), name='contratos'),

    # 🔄 INTERCAMBIO DE CARTAS ENTRE ALUMNOS
    # Las tres van ANTES de <str:login>/, que atrapa cualquier texto: si se
    # pusieran después, 'intercambios' se tomaría por el login de un alumno.
    path('intercambios/', IntercambiosView.as_view(), name='intercambios'),
    path('intercambios/repetidas/<str:username>/', RepetidasView.as_view(), name='repetidas_intercambio'),
    path('intercambios/<int:pk>/', ResponderIntercambioView.as_view(), name='responder_intercambio'),

    # 🎴 Descarte: 4 copias de la misma carta -> 1 sobre raro
    path('descartar/', DescartarView.as_view(), name='descartar'),

    # ⚠️ <str:login>/ DEBE SER LA ÚLTIMA RUTA porque atrapa cualquier texto
    path('<str:login>/', views.login_alumno, name='login_alumno'),
]