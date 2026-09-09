from django.urls import path
from .views import CardListCreateView, HealthCheckView, abrir_sobre_endpoint, album_usuario, make_contract
from . import views
from .intercambios import IntercambiosView, RepetidasView, ResponderIntercambioView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("", CardListCreateView.as_view(), name="cards-list-create"), # Corresponde a /api/cards/
    path('ranking/', views.ranking, name='ranking'),
    path('sobres/', views.mis_sobres, name='mis_sobres'),
    path('sobres/reclamar/', views.reclamar_regalo_diario, name='reclamar_regalo_diario'),
    path('sobres/abrir/<str:tipo_sobre>/', views.abrir_sobre_endpoint, name='abrir_sobre'),
    path("album/", views.album_usuario, name='album_usuario'),

    # ✅ CORRECTO: Sin 'cards/' delante y colocado ANTES de <str:login>/
    path('contract/', views.make_contract, name='make_contract'),

    # 🔄 INTERCAMBIO DE CARTAS ENTRE ALUMNOS
    # Las tres van ANTES de <str:login>/, que atrapa cualquier texto: si se
    # pusieran después, 'intercambios' se tomaría por el login de un alumno.
    path('intercambios/', IntercambiosView.as_view(), name='intercambios'),
    path('intercambios/repetidas/<str:username>/', RepetidasView.as_view(), name='repetidas_intercambio'),
    path('intercambios/<int:pk>/', ResponderIntercambioView.as_view(), name='responder_intercambio'),

    # ⚠️ <str:login>/ DEBE SER LA ÚLTIMA RUTA porque atrapa cualquier texto
    path('<str:login>/', views.login_alumno, name='login_alumno'),
]