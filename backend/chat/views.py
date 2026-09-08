from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from social.models import FriendRequest

from .models import Message

User = get_user_model()


# =====================================================================
# 💬 EL ALMACÉN DE MENSAJES
#
# Hasta ahora el chat era solo pantalla: escribías algo, se veía en tu
# navegador, y al recargar desaparecía sin haberle llegado a nadie.
#
# QUIÉN PUEDE ESCRIBIR A QUIÉN: solo entre amigos. No es un capricho:
# la lista de la izquierda del chat ES la lista de amigos, así que dejar
# escribir a desconocidos sería una puerta que la pantalla no enseña. Y
# de paso evita que cualquiera pueda escribirle a cualquiera sin permiso.
#
# El formato de un mensaje se acordó con Konrad antes de escribir nada:
#   { id, de, para, texto, fecha, mio }
# El 'mio' lo calcula el servidor (true si lo escribiste tú) para que el
# front pinte el globo a un lado o a otro sin comparar nombres.
# =====================================================================


def _son_amigos(a, b):
    """¿Estas dos personas son amigas? Da igual quién mandara la solicitud."""
    return FriendRequest.objects.filter(
        Q(sender=a, receiver=b) | Q(sender=b, receiver=a),
        status=FriendRequest.StatusChoice.ACCEPTED,
    ).exists()


def _mensaje_json(m, yo):
    return {
        'id': m.id,
        'de': m.sender.username,
        'para': m.receiver.username,
        'texto': m.texto,
        'fecha': m.created_at.isoformat(),
        'mio': m.sender_id == yo.pk,
    }


class ConversacionView(APIView):
    """
    GET  /api/chat/<username>/   -> los mensajes con esa persona
    POST /api/chat/<username>/   -> escribirle, con {"texto": "..."}

    En el GET se admite ?desde=<id> para pedir solo lo nuevo. El front
    pregunta cada pocos segundos, y sin eso estaría descargando la
    conversación entera una y otra vez.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _buscar_otro(self, request, username):
        """Devuelve (usuario, respuesta_de_error). Solo una de las dos."""
        otro = User.objects.filter(username=username).first()
        if otro is None:
            return None, Response({'detail': f'No existe ningún usuario llamado {username}.'},
                                  status=status.HTTP_404_NOT_FOUND)
        if otro.pk == request.user.pk:
            return None, Response({'detail': 'No puedes escribirte a ti mismo.'},
                                  status=status.HTTP_400_BAD_REQUEST)
        if not _son_amigos(request.user, otro):
            return None, Response({'detail': 'Solo puedes escribir a tus amigos.'},
                                  status=status.HTTP_403_FORBIDDEN)
        return otro, None

    def get(self, request, username):
        otro, error = self._buscar_otro(request, username)
        if error:
            return error

        yo = request.user
        # Los mensajes en los dos sentidos: la conversación son ambos
        mensajes = Message.objects.filter(
            Q(sender=yo, receiver=otro) | Q(sender=otro, receiver=yo)
        ).select_related('sender', 'receiver')

        desde = request.query_params.get('desde')
        if desde:
            try:
                mensajes = mensajes.filter(id__gt=int(desde))
            except (TypeError, ValueError):
                pass  # si llega basura en ?desde, se devuelve todo

        mensajes = list(mensajes)

        # Al abrir la conversación se dan por leídos los que me mandó él.
        # Se hace en una sola consulta y solo sobre los que faltan.
        Message.objects.filter(sender=otro, receiver=yo, leido=False).update(leido=True)

        return Response({'mensajes': [_mensaje_json(m, yo) for m in mensajes]},
                        status=status.HTTP_200_OK)

    def post(self, request, username):
        otro, error = self._buscar_otro(request, username)
        if error:
            return error

        texto = (request.data.get('texto') or '').strip()

        # Validación en el servidor. El navegador comprueba lo mismo, pero
        # esas comprobaciones se las salta cualquiera: las que mandan son estas.
        if not texto:
            return Response({'detail': 'El mensaje está vacío.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if len(texto) > Message.LARGO_MAXIMO:
            return Response(
                {'detail': f'El mensaje no puede pasar de {Message.LARGO_MAXIMO} caracteres.'},
                status=status.HTTP_400_BAD_REQUEST)

        mensaje = Message.objects.create(sender=request.user, receiver=otro, texto=texto)
        return Response(_mensaje_json(mensaje, request.user), status=status.HTTP_201_CREATED)


class SinLeerView(APIView):
    """
    GET /api/chat/sin-leer/

    Cuántos mensajes tienes sin leer y de quién. Es el aviso de "tienes
    mensajes nuevos" que flota por encima de todas las pantallas.

    Va aparte de /conversaciones/ a propósito: esto se pregunta cada pocos
    segundos desde cualquier página, así que tiene que ser barato. Son dos
    consultas de contar, sin traerse ni un mensaje ni una foto.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pendientes = (
            Message.objects
            .filter(receiver=request.user, leido=False)
            .values('sender__username')
            .annotate(n=Count('id'))
        )
        por_persona = {p['sender__username']: p['n'] for p in pendientes}
        return Response({
            'total': sum(por_persona.values()),
            'por_persona': por_persona,
        }, status=status.HTTP_200_OK)


class ConversacionesView(APIView):
    """
    GET /api/chat/conversaciones/

    Con quién puedes hablar, con el último mensaje de cada uno y cuántos
    tienes sin leer. Es lo que necesita la columna izquierda del chat para
    enseñar el resumen y el puntito de "tienes mensajes nuevos".
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        yo = request.user

        # 1. Mis amigos (una consulta)
        amistades = FriendRequest.objects.filter(
            Q(sender=yo) | Q(receiver=yo),
            status=FriendRequest.StatusChoice.ACCEPTED,
        ).select_related('sender', 'receiver')
        amigos = [a.receiver if a.sender_id == yo.pk else a.sender for a in amistades]
        if not amigos:
            return Response({'conversaciones': []}, status=status.HTTP_200_OK)

        ids_amigos = [a.pk for a in amigos]

        # 2. Todos los mensajes con ellos, del más nuevo al más viejo. Se
        #    recorre una vez y nos quedamos con el primero de cada persona:
        #    ese es el último mensaje de esa conversación.
        mensajes = (
            Message.objects
            .filter(Q(sender=yo, receiver_id__in=ids_amigos)
                    | Q(sender_id__in=ids_amigos, receiver=yo))
            .order_by('-created_at')
            .select_related('sender', 'receiver')
        )
        ultimo_de = {}
        for m in mensajes:
            otro_id = m.receiver_id if m.sender_id == yo.pk else m.sender_id
            if otro_id not in ultimo_de:
                ultimo_de[otro_id] = m
            if len(ultimo_de) == len(ids_amigos):
                break  # ya tenemos el último de cada uno

        # 3. Sin leer, agrupados por quien los mandó (una consulta)
        sin_leer = dict(
            Message.objects
            .filter(receiver=yo, leido=False, sender_id__in=ids_amigos)
            .values_list('sender')
            .annotate(n=Count('id'))
        )

        conversaciones = []
        for amigo in amigos:
            ultimo = ultimo_de.get(amigo.pk)
            conversaciones.append({
                'username': amigo.username,
                'nombre': amigo.nombre_mostrado or amigo.get_full_name() or amigo.username,
                'profile_image': amigo.foto,
                'estado': amigo.estado_real,
                'sin_leer': sin_leer.get(amigo.pk, 0),
                'ultimo_mensaje': _mensaje_json(ultimo, yo) if ultimo else None,
            })

        # Arriba las conversaciones con actividad más reciente; los amigos con
        # los que aún no has hablado, al final y por orden alfabético.
        con_mensajes = [c for c in conversaciones if c['ultimo_mensaje']]
        sin_mensajes = [c for c in conversaciones if not c['ultimo_mensaje']]
        con_mensajes.sort(key=lambda c: c['ultimo_mensaje']['fecha'], reverse=True)
        sin_mensajes.sort(key=lambda c: c['username'].lower())

        return Response({'conversaciones': con_mensajes + sin_mensajes},
                        status=status.HTTP_200_OK)
