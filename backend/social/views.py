from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import FriendRequest
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
        return Response(serializer.data, status=status.HTTP_200_OK)


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

    LIMITE = 30  # no tiene sentido volcar el campus entero en una ventanita

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