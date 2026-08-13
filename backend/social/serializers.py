from rest_framework import serializers
from .models import FriendRequest
from django.contrib.auth import get_user_model

user = get_user_model()

class UserMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_image', 'estado']
class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserMinSerializer(read_only=True)
    receiver_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'status', 'created_at']
        read_only_fields = ['id', 'sender', 'status', 'created_at']

    def validate(self, attrs):
        sender = self.context['request'].user
        receiver_id = attrs.get('receiver_id')

        # 1. Comprobar existencia del receptor
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("El usuario especificado no existe.")

        # 2. Evitar auto-petición
        if sender == receiver:
            raise serializers.ValidationError("No puedes enviarte una solicitud de amistad a ti mismo.")

        # 3. Comprobar duplicados o relaciones existentes
        existing_request = FriendRequest.objects.filter(
            sender__in=[sender, receiver],
            receiver__in=[sender, receiver]
        ).first()

        if existing_request:
            if existing_request.status == FriendRequest.StatusChoice.ACCEPTED:
                raise serializers.ValidationError("Ya sois amigos.")
            elif existing_request.status == FriendRequest.StatusChoice.PENDING:
                raise serializers.ValidationError("Ya existe una solicitud de amistad pendiente entre vosotros.")

        attrs['receiver'] = receiver
        return attrs