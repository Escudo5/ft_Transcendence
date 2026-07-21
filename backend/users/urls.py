from django.urls import path
from .views import login_42_callback, me, logout_view

urlpatterns = [
    # Cuando alguien entra a /api/users/auth/callback/, se ejecuta la lógica del login
    path('auth/callback/', login_42_callback, name='login_42_callback'),
    # ¿Quién soy? El front lo usa para saber si hay una sesión abierta
    path('me/', me, name='me'),
    # Cerrar sesión y pasar a 'offline'
    path('logout/', logout_view, name='logout'),
]
