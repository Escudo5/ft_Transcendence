"""
🤝 CONTRATOS: 4 cartas de la misma rareza -> 1 carta de la rareza siguiente

═══════════════════════════════════════════════════════════════════════
ESTA ES LA ÚNICA VERSIÓN. LA DE PABLO SE QUITÓ EL 6/10.
═══════════════════════════════════════════════════════════════════════

Durante un mes hubo DOS: `make_contract` en cards/views.py, colgando de
/api/cards/contract/, y esta. Se hizo así porque Pablo estaba ausente
desde el 7 de septiembre y no se le podía consultar, y no queríamos
borrarle su trabajo a sus espaldas.

El 6 de octubre, con Pablo de vuelta, el equipo decidió quitar la suya:
hacían LA MISMA REGLA, la pantalla (Contratos.jsx) solo ha llamado nunca
a esta, y tener dos endpoints para lo mismo es justo lo que se pregunta
en una evaluación. Lo que arregla esta respecto a la suya está más abajo.

Si hiciera falta recuperarla, está en el historial de cards/views.py,
antes del commit que la quitó.

═══════════════════════════════════════════════════════════════════════
QUÉ SE ARREGLA RESPECTO A LA SUYA (todo comprobado, no supuesto)
═══════════════════════════════════════════════════════════════════════

1. ⚠️ LA SUYA REVIENTA CON UN 500 DESDE EL NAVEGADOR. Y no es un fallo
   raro: pasa SIEMPRE. Hace `json.loads(request.body)`, y el cuerpo de
   una petición solo se puede leer una vez. Cuando llega de un navegador
   con sesión, DRF ya lo ha leído para comprobar el CSRF, así que al
   intentar leerlo otra vez salta:

       RawPostDataException: You cannot access body after reading
       from request's data stream

   Nunca se noto porque NUNCA HUBO PANTALLA que lo llamara. Aquí se usa
   `request.data`, que es lo que DRF ya ha dejado preparado.

2. Se puede hacer trampa con un doble clic. La suya lee la cantidad,
   resta y guarda, sin bloquear la fila; y además valida FUERA de la
   transacción. Con dos peticiones a la vez, las dos leen 5, las dos
   guardan 1, y te llevas DOS cartas habiendo pagado por una. Es el
   mismo fallo que nos hizo perder cartas al abrir sobres.

3. Te podía dar una carta que YA tienes. `random.choice` sorteaba entre
   todas las de esa rareza. Aquí se prefiere una que te falte, y solo si
   ya las tienes todas se sortea entre las repetidas.

   Esto no es solo comodidad: es lo que DIFERENCIA el contrato del
   descarte. Un sobre, cuando llevas 600 cartas, te da sobre todo
   repetidas. El contrato, no: es progreso seguro en el álbum. Por eso
   merece la pena que existan los dos.

═══════════════════════════════════════════════════════════════════════
LAS REGLAS (las de Pablo, respetadas tal cual)
═══════════════════════════════════════════════════════════════════════

  1. Exactamente 4 cartas. Pueden ser 4 distintas, o varias copias de la
     misma, o una mezcla: lo que cuenta es que sumen 4.

  2. Todas de la MISMA rareza.

  3. De cada carta te quedas al menos UNA. Nunca pierdes una carta del
     álbum: solo entregas sobrantes. Esta regla es de Pablo y es la
     mejor idea de las tres.

  4. Con la rareza más alta no se puede: no hay ninguna por encima.
"""

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

import random

from .models import Card, UserCard
from .rarezas import TODAS

CARTAS_POR_CONTRATO = 4


def _carta_json(c):
    return {
        'id': c.id,
        'login': c.login,
        'titulo': c.title or c.login,
        'foto': c.photo,
        'rareza': c.tier,
        'coalicion': c.coalition,
    }


def _siguiente_rareza(rareza):
    """La rareza justo por encima, o None si ya es la más alta."""
    if rareza not in TODAS:
        return None
    i = TODAS.index(rareza)
    return TODAS[i + 1] if i + 1 < len(TODAS) else None


class ContratosView(APIView):
    """
    GET  /api/cards/contratos/   -> qué contratos puedes hacer ahora mismo
    POST /api/cards/contratos/   -> hacer uno
    """
    permission_classes = [permissions.IsAuthenticated]

    # ------------------------------------------------------------------
    def get(self, request):
        """
        Lo que necesita la pantalla, ya masticado: por cada rareza, qué
        cartas puedes entregar y cuántas copias de cada una te sobran.

        Se manda "sobrantes" (copias - 1) y no "copias" a propósito: es
        el número que de verdad puede usar la persona, y así la pantalla
        no tiene que saberse la regla de quedarse con una.
        """
        filas = (UserCard.objects.filter(user=request.user, cantidad__gt=1)
                 .select_related('card').order_by('card__login'))

        por_rareza = {}
        for f in filas:
            por_rareza.setdefault(f.card.tier, []).append(
                {**_carta_json(f.card), 'copias': f.cantidad,
                 'sobrantes': f.cantidad - 1}
            )

        rarezas = []
        for rareza in TODAS:
            cartas = por_rareza.get(rareza, [])
            sobrantes = sum(c['sobrantes'] for c in cartas)
            arriba = _siguiente_rareza(rareza)
            rarezas.append({
                'rareza': rareza,
                'sube_a': arriba,
                'cartas': cartas,
                'sobrantes': sobrantes,
                # Para que la pantalla sepa si encender el botón sin
                # tener que echar cuentas
                'se_puede': bool(arriba) and sobrantes >= CARTAS_POR_CONTRATO,
            })

        return Response({
            'cartas_por_contrato': CARTAS_POR_CONTRATO,
            'rarezas': rarezas,
        }, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    def post(self, request):
        """
        Body: {"cartas": [{"carta": <id>, "cantidad": <n>}, ...]}

        Se admite también la forma de Pablo, con la clave "card", para
        que su pantalla (si algún día la hace) siga valiendo.
        """
        # request.data, NO json.loads(request.body). Ver el punto 1 de
        # arriba: leer el cuerpo dos veces revienta con un 500.
        entradas = request.data.get('cartas')
        if not isinstance(entradas, list) or not entradas:
            return Response({'detail': 'No has elegido ninguna carta.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Se agrupan por carta: así da igual que manden la misma dos veces
        pedido = {}
        try:
            for e in entradas:
                id_carta = int(e.get('carta', e.get('card')))
                cuantas = int(e.get('cantidad', 1))
                if id_carta < 1 or cuantas < 1:
                    raise ValueError
                pedido[id_carta] = pedido.get(id_carta, 0) + cuantas
        except (AttributeError, TypeError, ValueError):
            return Response({'detail': 'La selección de cartas no es válida.'},
                            status=status.HTTP_400_BAD_REQUEST)

        total = sum(pedido.values())
        if total != CARTAS_POR_CONTRATO:
            return Response(
                {'detail': f'Un contrato son exactamente {CARTAS_POR_CONTRATO} '
                           f'cartas, y has elegido {total}.'},
                status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            filas = list(
                UserCard.objects.select_for_update()
                .filter(user=request.user, card_id__in=pedido)
                .select_related('card')
                .order_by('card_id')
            )
            por_id = {f.card_id: f for f in filas}

            rareza = None
            for id_carta, cuantas in pedido.items():
                fila = por_id.get(id_carta)
                if fila is None:
                    return Response({'detail': 'Alguna de esas cartas no está en tu álbum.'},
                                    status=status.HTTP_400_BAD_REQUEST)
                if fila.cantidad - cuantas < 1:
                    return Response(
                        {'detail': f'De {fila.card.login} tienes {fila.cantidad} '
                                   f'copias y quieres dar {cuantas}. Tienes que '
                                   f'quedarte al menos con una.'},
                        status=status.HTTP_400_BAD_REQUEST)
                if rareza is None:
                    rareza = fila.card.tier
                elif fila.card.tier != rareza:
                    return Response(
                        {'detail': 'Todas las cartas del contrato tienen que ser '
                                   'de la misma rareza.'},
                        status=status.HTTP_400_BAD_REQUEST)

            sube_a = _siguiente_rareza(rareza)
            if sube_a is None:
                return Response(
                    {'detail': f'{rareza} ya es la rareza más alta: no hay ninguna '
                               f'por encima a la que subir.'},
                    status=status.HTTP_400_BAD_REQUEST)

            premio = self._elegir_premio(request.user, sube_a)
            if premio is None:
                return Response({'detail': f'No hay ninguna carta {sube_a} en el catálogo.'},
                                status=status.HTTP_400_BAD_REQUEST)

            for id_carta, cuantas in pedido.items():
                UserCard.objects.filter(pk=por_id[id_carta].pk).update(
                    cantidad=F('cantidad') - cuantas)

            fila_premio, creada = UserCard.objects.get_or_create(
                user=request.user, card=premio, defaults={'cantidad': 1})
            if not creada:
                UserCard.objects.filter(pk=fila_premio.pk).update(
                    cantidad=F('cantidad') + 1)

        return Response({
            'mensaje': f'¡Contrato hecho! Has entregado {CARTAS_POR_CONTRATO} '
                       f'cartas {rareza} y te llevas {premio.login} ({sube_a}).',
            'rareza_entregada': rareza,
            'rareza_recibida': sube_a,
            'carta': _carta_json(premio),
            'era_nueva': creada,
        }, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    @staticmethod
    def _elegir_premio(usuario, rareza):
        """
        Una carta de esa rareza, PREFERIBLEMENTE una que no tenga.

        Es lo que le da sentido al contrato frente al descarte: un sobre
        te da 5 cartas al azar, que cuando llevas medio álbum son casi
        todas repetidas. Esto es progreso seguro.

        Si ya las tiene todas, se sortea entre ellas: la carta suma una
        copia más, que sirve para intercambiar. Mejor eso que un error.
        """
        todas = list(Card.objects.filter(tier=rareza).values_list('id', flat=True))
        if not todas:
            return None

        suyas = set(UserCard.objects.filter(user=usuario, card_id__in=todas)
                    .values_list('card_id', flat=True))
        faltan = [i for i in todas if i not in suyas]

        elegida = random.choice(faltan if faltan else todas)
        return Card.objects.get(pk=elegida)
