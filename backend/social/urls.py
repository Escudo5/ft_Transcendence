from django.urls import path

from .views import (
    SendFriendRequestView,
    PendingFriendRequestsView,
    RespondFriendRequestView,
    FriendsListView,
    RemoveFriendView,
    BuscarUsuariosView,
)

# 🤝 RUTAS DE AMISTADES
#
# Este fichero FALTABA. Las cinco vistas estaban escritas desde agosto pero no
# había forma de llegar a ellas: en Django, una vista sin ruta es código
# muerto. Por eso el sistema de amigos "no funcionaba" aunque estuviera hecho.
#
# Todo cuelga de /api/social/ (ver backend/app/urls.py).

urlpatterns = [
    # --- Solicitudes ---
    # Mandar una: POST con {"receiver_id": 7}
    path('solicitudes/', SendFriendRequestView.as_view(), name='enviar_solicitud'),
    # Las mías, en los dos sentidos: las que me han mandado y las que mandé yo.
    # ⚠️ Va ANTES que la de abajo para que 'pendientes' no se confunda con un número.
    path('solicitudes/pendientes/', PendingFriendRequestsView.as_view(), name='solicitudes_pendientes'),
    # Responder a una: PATCH con {"action": "accept"} o {"action": "decline"}
    path('solicitudes/<int:pk>/', RespondFriendRequestView.as_view(), name='responder_solicitud'),

    # Gente a la que puedes pedir amistad (sin ti, sin tus amigos y sin
    # los que tienen una solicitud a medias). Admite ?q= para filtrar.
    path('buscar/', BuscarUsuariosView.as_view(), name='buscar_usuarios'),

    # --- Amigos ---
    # Mi lista de amigos, con su foto y si están en línea
    path('amigos/', FriendsListView.as_view(), name='lista_amigos'),
    # Dejar de ser amigo de alguien: DELETE
    path('amigos/<int:friend_id>/', RemoveFriendView.as_view(), name='eliminar_amigo'),
]
