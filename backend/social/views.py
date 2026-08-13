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