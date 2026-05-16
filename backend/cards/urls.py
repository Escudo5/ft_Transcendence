from django.urls import path
from .views import CardListCreateView, HealthCheckView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("cards/", CardListCreateView.as_view(), name="cards-list-create"),
]
