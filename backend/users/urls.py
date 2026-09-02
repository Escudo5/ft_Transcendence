from django.urls import path
from .views import (
    login_42_callback, list_users, me, logout_view, csrf_token_view,
    register, login_email,
)

urlpatterns = [
    # Cuando alguien entra a /api/users/auth/callback/, se ejecuta la lógica del login
    path('auth/callback/', login_42_callback, name='login_42_callback'),
    # 🔐 La otra puerta: registro e inicio de sesión con email y contraseña
    path('register/', register, name='register'),
    path('login/', login_email, name='login_email'),
    # Token CSRF para peticiones POST desde el frontend
    path('csrf/', csrf_token_view, name='csrf_token'),
    # ¿Quién soy? El front lo usa para saber si hay una sesión abierta
    path('me/', me, name='me'),
    # Lista de usuarios para mostrar fotos y datos en el front
    path('list/', list_users, name='list_users'),
    # Cerrar sesión y pasar a 'offline'
    path('logout/', logout_view, name='logout'),
]
