from django.urls import path

from .views import ConversacionView, ConversacionesView, SinLeerView

# 💬 RUTAS DEL CHAT. Todo cuelga de /api/chat/ (ver backend/app/urls.py).

urlpatterns = [
    # El resumen para la columna izquierda: con quién hablas, el último
    # mensaje de cada uno y cuántos tienes sin leer.
    # ⚠️ Va ANTES que la de abajo: si no, 'conversaciones' se tomaría por
    # el nombre de un usuario y esta ruta no se alcanzaría nunca.
    path('conversaciones/', ConversacionesView.as_view(), name='conversaciones'),

    # Cuántos mensajes tienes sin leer. Barato a propósito: se pregunta cada
    # pocos segundos desde cualquier pantalla.
    path('sin-leer/', SinLeerView.as_view(), name='sin_leer'),

    # Una conversación concreta:
    #   GET  -> los mensajes (admite ?desde=<id> para pedir solo lo nuevo)
    #   POST -> escribir, con {"texto": "..."}
    path('<str:username>/', ConversacionView.as_view(), name='conversacion'),
]
