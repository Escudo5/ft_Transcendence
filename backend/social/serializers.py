from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import FriendRequest

# ⚠️ Ojo con la mayúscula: antes esto ponía 'user' en minúscula y luego se
# usaba 'User', así que el fichero ni siquiera se podía importar y las vistas
# de amigos no llegaban a cargarse nunca.
User = get_user_model()


class UserMinSerializer(serializers.ModelSerializer):
    """
    La ficha corta de una persona, la que se enseña en la lista de amigos y
    en las solicitudes. Solo datos públicos: ni correo ni id de la Intra.
    """
    # No se manda el campo profile_image tal cual, sino la foto ya decidida
    # (avatar propio > foto de la Intra > avatar por defecto). Si no, los
    # amigos saldrían con la foto de 42 aunque se hubieran puesto otra.
    # El nombre para enseñar: el que se haya puesto en su perfil, si no su
    # nombre real de la Intra, y si tampoco, el login.
    nombre = serializers.SerializerMethodField()
    profile_image = serializers.CharField(source='foto', read_only=True)
    # Lo mismo con el estado: 'estado_real' tiene en cuenta cuándo se le vio
    # por última vez, así que no se queda nadie "en línea" para siempre por
    # haber cerrado la pestaña sin cerrar sesión.
    estado = serializers.CharField(source='estado_real', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'nombre', 'profile_image', 'estado']

    def get_nombre(self, obj):
        return obj.nombre_mostrado or obj.get_full_name() or obj.username


class FriendRequestSerializer(serializers.ModelSerializer):
    """
    Una solicitud de amistad.

    Al leer devuelve las fichas completas de quien envía y quien recibe.
    Al escribir solo hace falta mandar 'receiver_id': quién la envía se saca
    de la sesión, nunca de lo que diga el navegador.
    """
    sender = UserMinSerializer(read_only=True)
    receiver = UserMinSerializer(read_only=True)
    receiver_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'status', 'created_at']
        read_only_fields = ['id', 'sender', 'receiver', 'status', 'created_at']

    def validate(self, attrs):
        sender = self.context['request'].user
        receiver_id = attrs.get('receiver_id')

        # 1. ¿Existe esa persona?
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("El usuario especificado no existe.")

        # 2. Uno no puede pedirse amistad a sí mismo
        if sender == receiver:
            raise serializers.ValidationError("No puedes enviarte una solicitud de amistad a ti mismo.")

        # 3. ¿Ya hay algo entre estos dos? Se mira en LOS DOS SENTIDOS: da igual
        #    quién la mandara, si él ya te la mandó a ti no toca mandar otra.
        existente = FriendRequest.objects.filter(
            sender__in=[sender, receiver],
            receiver__in=[sender, receiver],
        ).first()

        if existente:
            if existente.status == FriendRequest.StatusChoice.ACCEPTED:
                raise serializers.ValidationError("Ya sois amigos.")
            if existente.status == FriendRequest.StatusChoice.PENDING:
                if existente.receiver == sender:
                    raise serializers.ValidationError(
                        "Esa persona ya te ha enviado una solicitud: acéptala en vez de mandar otra."
                    )
                raise serializers.ValidationError("Ya existe una solicitud de amistad pendiente entre vosotros.")

            # Si estaba RECHAZADA se puede volver a intentar, pero hay que
            # REAPROVECHAR esa fila. Si se creara otra chocaría contra la regla
            # de "una sola solicitud por pareja" y saldría un error 500.
            attrs['_solicitud_previa'] = existente

        attrs['receiver'] = receiver
        return attrs

    def create(self, validated_data):
        validated_data.pop('receiver_id', None)
        previa = validated_data.pop('_solicitud_previa', None)

        if previa is not None:
            # Se reutiliza la solicitud rechazada: vuelve a estar pendiente y
            # con la dirección correcta (puede que ahora la mande el otro)
            previa.sender = validated_data['sender']
            previa.receiver = validated_data['receiver']
            previa.status = FriendRequest.StatusChoice.PENDING
            previa.save()
            return previa

        return FriendRequest.objects.create(**validated_data)
