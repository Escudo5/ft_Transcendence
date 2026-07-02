from django.urls import path
from .views import CardListCreateView, HealthCheckView,abrir_sobre_endpoint
from . import views
urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("cards/", CardListCreateView.as_view(), name="cards-list-create"),
    path('sobres/abrir/<str:tipo_sobre>/', views.abrir_sobre_endpoint, name='abrir_sobre'),
]
