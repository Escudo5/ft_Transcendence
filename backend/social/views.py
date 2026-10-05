from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import Bloqueo, FriendRequest
from .serializers import FriendRequestSerializer, UserMinSerializer

User = get_user_model()


class SendFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serial = FriendRequestSerializer(data=request.data, context={'request': request})
        if serial.is_valid():
            serial.save(sender=request.user)
            return Response(serial.data, status=status.HTTP_201_CREATED)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)


class PendingFriendRequestsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        received_requests = FriendRequest.objects.filter(
            receiver=request.user, 
            status=FriendRequest.StatusChoice.PENDING
        )
        sent_requests = FriendRequest.objects.filter(
            sender=request.user, 
            status=FriendRequest.StatusChoice.PENDING
        )

        return Response({
            "received": FriendRequestSerializer(received_requests, many=True).data,
            "sent": FriendRequestSerializer(sent_requests, many=True).data
        }, status=status.HTTP_200_OK)


class RespondFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        friend_request = get_object_or_404(
            FriendRequest, 
            pk=pk, 
            receiver=request.user, 
            status=FriendRequest.StatusChoice.PENDING
        )

        action = request.data.get('action')

        if action == 'accept':
            friend_request.status = FriendRequest.StatusChoice.ACCEPTED
            friend_request.save()
            return Response({"detail": "Solicitud de amistad aceptada."}, status=status.HTTP_200_OK)

        elif action == 'decline':
            friend_request.status = FriendRequest.StatusChoice.DECLINED
            friend_request.save()
            return Response({"detail": "Solicitud de amistad rechazada."}, status=status.HTTP_200_OK)

        return Response(
            {"error": "Acción no válida. Usa 'accept' o 'decline'."}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class FriendsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        accepted_requests = FriendRequest.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user),
            status=FriendRequest.StatusChoice.ACCEPTED
        )

        friends = []
        for req in accepted_requests:
            if req.sender == request.user:
                friends.append(req.receiver)
            else:
                friends.append(req.sender)

        serializer = UserMinSerializer(friends, many=True)

        # 🚫 Añadimos el estado de bloqueo de cada amigo. Son DOS campos
        # distintos porque son dos cosas distintas: que yo bloquee a alguien
        # no significa que él me haya bloqueado a mí, y la pantalla enseña
        # una cosa u otra según el caso.
        #
        # Se sacan en dos consultas para toda la lista, no una por amigo.
        bloqueados_por_mi = set(
            Bloqueo.objects.filter(de=request.user).values_list('a_id', flat=True))
        me_han_bloqueado = set(
            Bloqueo.objects.filter(a=request.user).values_list('de_id', flat=True))

        datos = serializer.data
        for ficha, amigo in zip(datos, friends):
            ficha['bloqueado'] = amigo.pk in bloqueados_por_mi
            ficha['me_ha_bloqueado'] = amigo.pk in me_han_bloqueado
        return Response(datos, status=status.HTTP_200_OK)


def hay_bloqueo(a, b):
    """
    ¿Hay un bloqueo entre estos dos, en cualquier dirección?

    Se mira en los dos sentidos a propósito: si yo te he bloqueado, no
    quiero que me escribas; y si tú me has bloqueado a mí, tampoco tiene
    sentido que yo te escriba. En los dos casos la conversación se corta.

    Lo usa el chat para rechazar mensajes (ver chat/views.py).
    """
    return Bloqueo.objects.filter(
        Q(de=a, a=b) | Q(de=b, a=a)
    ).exists()


class BloquearView(APIView):
    """
    POST   /api/social/bloquear/<username>/   -> bloquear a esa persona
    DELETE /api/social/bloquear/<username>/   -> desbloquearla

    Bloquear NO deshace la amistad: la persona sigue en tu lista, marcada,
    para que puedas desbloquearla sin volver a pedirle amistad.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _buscar(self, request, username):
        otro = User.objects.filter(username=username).first()
        if otro is None:
            return None, Response({'detail': f'No existe ningún usuario llamado {username}.'},
                                  status=status.HTTP_404_NOT_FOUND)
        if otro.pk == request.user.pk:
            return None, Response({'detail': 'No puedes bloquearte a ti mismo.'},
                                  status=status.HTTP_400_BAD_REQUEST)
        return otro, None

    def post(self, request, username):
        otro, error = self._buscar(request, username)
        if error:
            return error

        _, creado = Bloqueo.objects.get_or_create(de=request.user, a=otro)
        return Response({
            'detail': f'Has bloqueado a {otro.username}.' if creado
                      else f'{otro.username} ya estaba bloqueado.',
            'bloqueado': True,
        }, status=status.HTTP_200_OK)

    def delete(self, request, username):
        otro, error = self._buscar(request, username)
        if error:
            return error
        borrados, _ = Bloqueo.objects.filter(de=request.user, a=otro).delete()
        if not borrados:
            return Response({'detail': f'{otro.username} no estaba bloqueado.'},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': f'Has desbloqueado a {otro.username}.',
                         'bloqueado': False}, status=status.HTTP_200_OK)


class BuscarUsuariosView(APIView):
    """
    Gente a la que SÍ le puedes pedir amistad, ya filtrada.

    Existe para que el buscador del front no tenga que pensar: si le
    diéramos la lista de todos los usuarios, saldría uno mismo y también
    los que ya son amigos, y al pulsar "añadir" el servidor respondería
    "ya sois amigos". Mejor no ofrecer lo que no se puede hacer.

    Se quitan de la lista:
      - uno mismo
      - los que ya son amigos
      - aquellos con una solicitud pendiente, la mandara quien la mandara

    Los que rechazaron una solicitud SÍ vuelven a salir: rechazar no es
    bloquear, y se puede volver a intentar.

    Acepta ?q= para filtrar por login o por nombre.
    """
    permission_classes = [permissions.IsAuthenticated]

    LIMITE = 30  

    def get(self, request):
        yo = request.user

        # Con quién tengo ya algo en marcha (amistad o solicitud sin responder)
        en_marcha = FriendRequest.objects.filter(
            Q(sender=yo) | Q(receiver=yo),
            status__in=[
                FriendRequest.StatusChoice.ACCEPTED,
                FriendRequest.StatusChoice.PENDING,
            ],
        )
        ocupados = set()
        for r in en_marcha:
            ocupados.add(r.sender_id)
            ocupados.add(r.receiver_id)
        ocupados.add(yo.pk)

        usuarios = User.objects.exclude(pk__in=ocupados)

        texto = (request.query_params.get('q') or '').strip()
        if texto:
            usuarios = usuarios.filter(
                Q(username__icontains=texto)
                | Q(first_name__icontains=texto)
                | Q(last_name__icontains=texto)
                | Q(nombre_mostrado__icontains=texto)
            )

        usuarios = usuarios.order_by('username')[:self.LIMITE]
        return Response(UserMinSerializer(usuarios, many=True).data,
                        status=status.HTTP_200_OK)


class RemoveFriendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, friend_id):
        friend_request = FriendRequest.objects.filter(
            Q(sender=request.user, receiver_id=friend_id) | Q(sender_id=friend_id, receiver=request.user),
            status=FriendRequest.StatusChoice.ACCEPTED
        ).first()

        if not friend_request:
            return Response({"error": "No existe una relación de amistad con este usuario."}, status=status.HTTP_404_NOT_FOUND)

        friend_request.delete()
        return Response({"detail": "Amigo eliminado correctamente."}, status=status.HTTP_200_OK)