from django.urls import path   
from .views import login_42_callback  # 👈 Importamos tu nueva función del login

urlpatterns = [
    # Cuando alguien entre a /api/users/auth/callback/, se ejecuta tu lógica
    path('auth/callback/', login_42_callback, name='login_42_callback'),
]