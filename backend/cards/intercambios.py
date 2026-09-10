"""
🔄 INTERCAMBIO DE CARTAS ENTRE ALUMNOS

Va en un fichero aparte y no en views.py porque views.py ya tiene 400 líneas
con los sobres, los contratos y el ranking. Las rutas siguen colgando de
/api/cards/ como el resto.

LAS SEIS REGLAS, y por qué cada una:

  1. Solo entre amigos. Igual que el chat: si no puedes escribirle,
     tampoco deberías poder proponerle un trato.

  2. Los DOS tienen que tener la carta REPETIDA (cantidad > 1). Así nadie
     se queda sin una carta que solo tenía una vez. Es la regla que hace
     que el intercambio sea seguro y no una forma de perder tu colección.

  3. No puedes pedir la misma carta que ofreces. No tendría sentido.

  4. No puedes tener dos propuestas iguales a la vez a la misma persona.
     Evita llenarle la bandeja de lo mismo.

  5. Todo se comprueba AL ACEPTAR, no solo al proponer. Entre una cosa y
     otra pueden pasar días, y en ese tiempo cualquiera de los dos puede
     haber gastado esa carta en un contrato. Sin esto, aceptas un
     intercambio y recibes una carta que el otro ya no tenía.

  6. Las dos cartas cambian de dueño A LA VEZ O NINGUNA. Con transacción
     atómica y bloqueo de filas, igual que la apertura de sobres.
"""

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import get_user_model
from social.models import FriendRequest

from .models import Card, Intercambio, UserCard

User = get_user_model()


def _son_amigos(a, b):
    return FriendRequest.objects.filter(
        Q(sender=a, receiver=b) | Q(sender=b, receiver=a),
        status=FriendRequest.StatusChoice.ACCEPTED,
    ).exists()


def _tiene_repetida(usuario, carta):
    """¿Tiene esta carta MÁS DE UNA VEZ? Solo así puede darla."""
    return UserCard.objects.filter(user=usuario, card=carta, cantidad__gt=1).exists()


def _carta_json(c):
    return {
        'id': c.id,
        'login': c.login,
        'titulo': c.title or c.login,
        'foto': c.photo,
        'tier': c.tier,
        'coalicion': c.coalition,
    }


def _intercambio_json(i, yo):
    return {
        'id': i.id,
        'de': i.de.username,
        'para': i.para.username,
        'ofrece': _carta_json(i.carta_ofrecida),
        'pide': _carta_json(i.carta_pedida),
        'estado': i.estado,
        'fecha': i.created_at.isoformat(),
        # Para que el front sepa qué botones enseñar sin comparar nombres
        'mio': i.de_id == yo.pk,
    }


class RepetidasView(APIView):
    """
    GET /api/cards/intercambios/repetidas/<username>/

    Lo que necesita la pantalla para montar una propuesta: qué puedo
    ofrecer yo y qué me puede dar esa persona. Las dos listas son solo de
    cartas REPETIDAS, porque son las únicas que se pueden intercambiar.

    Existe para que el front no ofrezca cartas que luego el servidor va a
    rechazar: mejor no enseñar lo que no se puede elegir.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, username):
        otro = User.objects.filter(username=username).first()
        if otro is None:
            return Response({'detail': f'No existe ningún usuario llamado {username}.'},
                            status=status.HTTP_404_NOT_FOUND)
        if otro.pk == request.user.pk:
            return Response({'detail': 'No puedes intercambiar contigo mismo.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not _son_amigos(request.user, otro):
            return Response({'detail': 'Solo puedes intercambiar con tus amigos.'},
                            status=status.HTTP_403_FORBIDDEN)

        def repetidas_de(u):
            return [
                {**_carta_json(uc.card), 'copias': uc.cantidad}
                for uc in UserCard.objects.filter(user=u, cantidad__gt=1)
                                          .select_related('card')
                                          .order_by('card__login')
            ]

        return Response({
            'mias': repetidas_de(request.user),
            'suyas': repetidas_de(otro),
        }, status=status.HTTP_200_OK)


class IntercambiosView(APIView):
    """
    GET  /api/cards/intercambios/   -> mis propuestas, recibidas y enviadas
    POST /api/cards/intercambios/   -> proponer un cambio
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        yo = request.user
        pendientes = (
            Intercambio.objects
            .filter(Q(de=yo) | Q(para=yo), estado=Intercambio.Estado.PENDIENTE)
            .select_related('de', 'para', 'carta_ofrecida', 'carta_pedida')
        )
        return Response({
            'recibidos': [_intercambio_json(i, yo) for i in pendientes if i.para_id == yo.pk],
            'enviados': [_intercambio_json(i, yo) for i in pendientes if i.de_id == yo.pk],
        }, status=status.HTTP_200_OK)

    def post(self, request):
        yo = request.user
        username = request.data.get('para')
        id_ofrecida = request.data.get('carta_ofrecida')
        id_pedida = request.data.get('carta_pedida')

        otro = User.objects.filter(username=username).first()
        if otro is None:
            return Response({'detail': 'Esa persona no existe.'}, status=status.HTTP_400_BAD_REQUEST)
        if otro.pk == yo.pk:
            return Response({'detail': 'No puedes intercambiar contigo mismo.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not _son_amigos(yo, otro):
            return Response({'detail': 'Solo puedes intercambiar con tus amigos.'},
                            status=status.HTTP_403_FORBIDDEN)

        ofrecida = Card.objects.filter(pk=id_ofrecida).first()
        pedida = Card.objects.filter(pk=id_pedida).first()
        if ofrecida is None or pedida is None:
            return Response({'detail': 'Alguna de las cartas no existe.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if ofrecida.pk == pedida.pk:
            return Response({'detail': 'No puedes pedir la misma carta que ofreces.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not _tiene_repetida(yo, ofrecida):
            return Response({'detail': f'No tienes {ofrecida.login} repetida, así que no puedes darla.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not _tiene_repetida(otro, pedida):
            return Response({'detail': f'{otro.username} no tiene {pedida.login} repetida.'},
                            status=status.HTTP_400_BAD_REQUEST)

        ya_existe = Intercambio.objects.filter(
            de=yo, para=otro, carta_ofrecida=ofrecida, carta_pedida=pedida,
            estado=Intercambio.Estado.PENDIENTE,
        ).exists()
        if ya_existe:
            return Response({'detail': 'Ya le has propuesto ese mismo cambio.'},
                            status=status.HTTP_400_BAD_REQUEST)

        i = Intercambio.objects.create(
            de=yo, para=otro, carta_ofrecida=ofrecida, carta_pedida=pedida,
        )
        return Response(_intercambio_json(i, yo), status=status.HTTP_201_CREATED)


class ResponderIntercambioView(APIView):
    """
    PATCH  /api/cards/intercambios/<id>/  con {"accion": "aceptar"|"rechazar"}
    DELETE /api/cards/intercambios/<id>/  -> lo retira quien lo propuso
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        accion = request.data.get('accion')
        if accion not in ('aceptar', 'rechazar'):
            return Response({'detail': 'Acción no válida. Usa "aceptar" o "rechazar".'},
                            status=status.HTTP_400_BAD_REQUEST)

        yo = request.user

        # Todo dentro de una transacción: o cambian las dos cartas, o ninguna.
        with transaction.atomic():
            # select_for_update bloquea la fila: si llegan dos peticiones a la
            # vez (doble clic), la segunda espera y luego ve que ya no está
            # pendiente, en vez de ejecutar el intercambio dos veces.
            i = (Intercambio.objects
                 .select_for_update()
                 .filter(pk=pk, para=yo, estado=Intercambio.Estado.PENDIENTE)
                 .select_related('de', 'para', 'carta_ofrecida', 'carta_pedida')
                 .first())
            if i is None:
                return Response({'detail': 'Esa propuesta no existe o ya está resuelta.'},
                                status=status.HTTP_404_NOT_FOUND)

            if accion == 'rechazar':
                i.estado = Intercambio.Estado.RECHAZADO
                i.resuelto_en = timezone.now()
                i.save(update_fields=['estado', 'resuelto_en'])
                return Response({'detail': 'Propuesta rechazada.',
                                 **_intercambio_json(i, yo)}, status=status.HTTP_200_OK)

            # ---- Aceptar ----
            # Se vuelve a comprobar TODO, porque desde que se propuso pueden
            # haber pasado días y cualquiera puede haber gastado su carta.
            if not _son_amigos(i.de, i.para):
                return Response({'detail': 'Ya no sois amigos.'},
                                status=status.HTTP_400_BAD_REQUEST)

            suya = (UserCard.objects.select_for_update()
                    .filter(user=i.de, card=i.carta_ofrecida, cantidad__gt=1).first())
            mia = (UserCard.objects.select_for_update()
                   .filter(user=i.para, card=i.carta_pedida, cantidad__gt=1).first())

            if suya is None:
                return Response(
                    {'detail': f'{i.de.username} ya no tiene {i.carta_ofrecida.login} repetida.'},
                    status=status.HTTP_400_BAD_REQUEST)
            if mia is None:
                return Response(
                    {'detail': f'Ya no tienes {i.carta_pedida.login} repetida.'},
                    status=status.HTTP_400_BAD_REQUEST)

            # Cada uno entrega una copia
            suya.cantidad -= 1
            suya.save(update_fields=['cantidad'])
            mia.cantidad -= 1
            mia.save(update_fields=['cantidad'])

            # Y recibe la del otro
            for quien, carta in ((i.de, i.carta_pedida), (i.para, i.carta_ofrecida)):
                fila, creada = UserCard.objects.get_or_create(
                    user=quien, card=carta, defaults={'cantidad': 1})
                if not creada:
                    fila.cantidad += 1
                    fila.save(update_fields=['cantidad'])

            i.estado = Intercambio.Estado.ACEPTADO
            i.resuelto_en = timezone.now()
            i.save(update_fields=['estado', 'resuelto_en'])

        return Response({
            'detail': f'¡Hecho! Le has dado {i.carta_pedida.login} y has recibido {i.carta_ofrecida.login}.',
            **_intercambio_json(i, yo),
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """Retirar una propuesta. Solo puede hacerlo quien la envió."""
        i = Intercambio.objects.filter(
            pk=pk, de=request.user, estado=Intercambio.Estado.PENDIENTE).first()
        if i is None:
            return Response({'detail': 'Esa propuesta no existe o ya está resuelta.'},
                            status=status.HTTP_404_NOT_FOUND)
        i.estado = Intercambio.Estado.CANCELADO
        i.resuelto_en = timezone.now()
        i.save(update_fields=['estado', 'resuelto_en'])
        return Response({'detail': 'Propuesta retirada.'}, status=status.HTTP_200_OK)


# =====================================================================
# 🎴 DESCARTE: 4 copias de la MISMA carta -> 1 sobre de su calidad
#
# Es distinto del contrato de Pablo, no lo pisa:
#   Contrato: 4 cartas DISTINTAS de la misma rareza -> 1 carta mejor
#   Descarte: 4 copias de la MISMA carta            -> 1 sobre de su calidad
#
# Resuelve dos cosas de golpe:
#   - Las cartas de las que tienes 10 copias dejan de ser basura
#   - Los sobres RAROS existían con sus probabilidades y nadie los
#     repartía nunca. Esta es la primera forma de conseguir uno.
#
# No desequilibra el juego: entregas 4 y recibes 5 (ganancia de 1, y
# aleatoria), y juntar 4 copias de la MISMA carta es raro de por sí.
# =====================================================================

COPIAS_PARA_DESCARTAR = 4
SOBRES_POR_TIER = {
    'comun': {'Junior', 'Blackhole'},
    'raro': {'Senior'},
    'epico': {'Alumni', 'Transcender'},
}
SOBRE_DEL_DESCARTE = 'raro'  # Compatibilidad con clientes antiguos.


class DescartarView(APIView):
    """
    GET  /api/cards/descartar/   -> qué cartas puedes descartar ya
    POST /api/cards/descartar/   -> hacerlo, con {"tipo_sobre": "comun", "cartas": [{"carta": <id>, "grupos": 1}]}
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Las cartas de las que tienes 4 copias o más. Existe para que el
        álbum pueda enseñar el botón solo donde se puede pulsar.
        """
        filas = (UserCard.objects
                 .filter(user=request.user, cantidad__gte=COPIAS_PARA_DESCARTAR)
                 .select_related('card')
                 .order_by('-cantidad'))
        return Response({
            'copias_necesarias': COPIAS_PARA_DESCARTAR,
            'sobres_por_calidad': {
                tipo: sorted(tiers) for tipo, tiers in SOBRES_POR_TIER.items()
            },
            'descartables': [
                {**_carta_json(f.card), 'copias': f.cantidad,
                 'sobres_posibles': f.cantidad // COPIAS_PARA_DESCARTAR}
                for f in filas
            ],
        }, status=status.HTTP_200_OK)

    def post(self, request):
        from .models import UserPack   # aquí para no cargarlo si no hace falta

        tipo_sobre = request.data.get('tipo_sobre', SOBRE_DEL_DESCARTE)
        if tipo_sobre not in SOBRES_POR_TIER:
            return Response({'detail': 'El tipo de sobre no es válido.'},
                            status=status.HTTP_400_BAD_REQUEST)

        entradas = request.data.get('cartas')
        if entradas is None:
            entradas = [{'carta': request.data.get('carta'), 'grupos': 1}]
        if not isinstance(entradas, list) or not entradas:
            return Response({'detail': 'Debes seleccionar al menos una carta.'},
                            status=status.HTTP_400_BAD_REQUEST)

        grupos_por_carta = {}
        try:
            for entrada in entradas:
                id_carta = int(entrada.get('carta'))
                grupos = int(entrada.get('grupos', 1))
                if id_carta < 1 or grupos < 1:
                    raise ValueError
                grupos_por_carta[id_carta] = grupos_por_carta.get(id_carta, 0) + grupos
        except (AttributeError, TypeError, ValueError):
            return Response({'detail': 'La selección de cartas no es válida.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Todo junto o nada: primero se bloquean y validan todas las filas;
        # solo después se descuenta y se entregan los sobres.
        with transaction.atomic():
            filas = list(UserCard.objects.select_for_update()
                         .filter(user=request.user, card_id__in=grupos_por_carta)
                         .select_related('card'))
            filas_por_carta = {fila.card_id: fila for fila in filas}

            for id_carta, grupos in grupos_por_carta.items():
                fila = filas_por_carta.get(id_carta)
                copias_necesarias = COPIAS_PARA_DESCARTAR * grupos
                if fila is None:
                    return Response({'detail': 'No tienes una de las cartas seleccionadas.'},
                                    status=status.HTTP_400_BAD_REQUEST)
                if fila.cantidad < copias_necesarias:
                    return Response(
                        {'detail': f'Necesitas {copias_necesarias} copias de '
                                   f'{fila.card.login} y solo tienes {fila.cantidad}.'},
                        status=status.HTTP_400_BAD_REQUEST)
                if fila.card.tier not in SOBRES_POR_TIER[tipo_sobre]:
                    return Response(
                        {'detail': f'La carta {fila.card.login} no pertenece a la calidad '
                                   f'del sobre {tipo_sobre}.'},
                        status=status.HTTP_400_BAD_REQUEST)

            for fila in filas:
                fila.cantidad -= COPIAS_PARA_DESCARTAR * grupos_por_carta[fila.card_id]
                if fila.cantidad == 0:
                    fila.delete()
                else:
                    fila.save(update_fields=['cantidad'])

            pack, _ = UserPack.objects.select_for_update().get_or_create(
                user=request.user, tipo_sobre=tipo_sobre)
            sobres_creados = sum(grupos_por_carta.values())
            pack.cantidad += sobres_creados
            pack.save(update_fields=['cantidad'])

        return Response({
            'mensaje': f'Has descartado {COPIAS_PARA_DESCARTAR * sobres_creados} copias '
                       f'y te has llevado {sobres_creados} sobres {tipo_sobre}.',
            'sobres_creados': sobres_creados,
            'tipo_sobre': tipo_sobre,
            'sobres_disponibles': pack.cantidad,
        }, status=status.HTTP_200_OK)
