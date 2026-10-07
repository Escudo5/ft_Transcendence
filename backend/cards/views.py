from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view,permission_classes
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Card
from users.models import CustomUser
from .serializers import CardSerializer, UserCardSerializer
import random
from .models import Card, UserCard, UserPack
from django.db import transaction
from django.db.models import Case, Count, F, IntegerField, Sum, Value, When
from django.db.models.functions import Coalesce
from .rarezas import CARTAS_POR_SOBRE, PROBABILIDADES_SOBRE, PUNTOS, TODAS
from django.utils import timezone

class HealthCheckView(APIView):
    """
    Dice si el backend está vivo. No devuelve ningún dato.

    ⚠️ ES LA ÚNICA VISTA DE ESTE FICHERO QUE SE QUEDA ABIERTA, y a propósito:
    una comprobación de salud que exige sesión no sirve para comprobar nada.
    No expone nada: solo responde {"status": "ok"}.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class CardListView(generics.ListAPIView):
    """
    El catálogo entero, solo lectura y solo con sesión. Lo usa la portada
    (Home.jsx) para sacar las cartas de los creadores.

    ⚠️ permission_classes va explícito: sin él DRF pone AllowAny, y cuando esto
    admitía POST cualquiera, sin registrarse, podía meter cartas.
    """
    queryset = Card.objects.all().order_by("-created_at")
    serializer_class = CardSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def album_usuario(request):
    """
    Devuelve las cartas del usuario que tiene la sesión activa (request.user).
    """
    usuario = request.user

    album_cartas = UserCard.objects.filter(user=usuario).select_related('card')

    serializer = UserCardSerializer(album_cartas, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
# ⚠️ Con sesión: sin esto DRF la deja abierta y cualquiera, sin registrarse,
# veía la carta (nivel, puntos, saldo) de cualquier alumno.
@permission_classes([IsAuthenticated])
def login_alumno(request, login):
    try:
        card = Card.objects.get(login=login)

        serializer = CardSerializer(card)

        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Card.DoesNotExist:
        return Response(
            {"error": f"No se encontró ninguna carta para el login: {login}"}, 
            status=status.HTTP_404_NOT_FOUND
        )


CONFIGURACION_SOBRES = {
    tipo: {"probabilidades": dict(probabilidades),
           "cartas_por_sobre": CARTAS_POR_SOBRE}
    for tipo, probabilidades in PROBABILIDADES_SOBRE.items()
}

def open_pack(tipo_sobre):
    """
    Selecciona 5 cartas aleatorias de la base de datos basándose 
    en las probabilidades del tipo de sobre.
    Retorna directamente las instancias de los objetos Card.
    """
    config = CONFIGURACION_SOBRES.get(tipo_sobre)
    probabilidades = config["probabilidades"]
    num_cartas = config["cartas_por_sobre"]
    
    tiers = list(probabilidades.keys())
    percent = list(probabilidades.values())
    
    cartas_seleccionadas = []
    
    for _ in range(num_cartas):
        selected_tier = random.choices(tiers, weights=percent, k=1)[0]
        cartas_del_tier = Card.objects.filter(tier=selected_tier)
        
        if not cartas_del_tier.exists():
            cartas_del_tier = Card.objects.all()
            
        if not cartas_del_tier.exists():
            raise ValueError("No hay cartas registradas en la base de datos.")
            
        carta_aleatoria = random.choice(cartas_del_tier)
        cartas_seleccionadas.append(carta_aleatoria)
        
    return cartas_seleccionadas


# =====================================================================
# 🎁 REGALO DIARIO
# Cada persona recibe 3 sobres comunes al día. NO se acumulan: si pasas
# tres días sin entrar, al volver recibes 3, no nueve.
# El día cambia a medianoche, hora de Madrid (la zona horaria del proyecto).
# =====================================================================
SOBRES_REGALO_DIARIO = 3
TIPO_SOBRE_REGALO = 'comun'


def _puede_recoger_regalo(usuario):
    """¿Le toca regalo hoy? Le toca si nunca lo recogió o si fue otro día."""
    hoy = timezone.localdate()
    return usuario.ultimo_regalo_diario is None or usuario.ultimo_regalo_diario < hoy


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reclamar_regalo_diario(request):
    """
    Entrega los sobres del día al usuario conectado.
    Va aparte de la consulta a propósito: consultar no debe cambiar nada, y
    entregar sí. Así recargar la página nunca regala sobres por accidente.
    """
    usuario = request.user

    if not _puede_recoger_regalo(usuario):
        return Response(
            {'error': 'Ya has recogido tu regalo de hoy. Vuelve mañana.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Todo junto o nada: o se apunta la fecha y se dan los sobres, o no pasa
    # nada. Si fallara a la mitad, alguien podría llevarse sobres cada vez.
    with transaction.atomic():
        # Bloqueamos la fila del usuario mientras tanto: si llegan dos
        # peticiones a la vez (doble clic), la segunda espera y ya verá la
        # fecha apuntada, así que no cobra dos veces.
        usuario_bloqueado = CustomUser.objects.select_for_update().get(pk=usuario.pk)
        if not _puede_recoger_regalo(usuario_bloqueado):
            return Response(
                {'error': 'Ya has recogido tu regalo de hoy. Vuelve mañana.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pack, _ = UserPack.objects.select_for_update().get_or_create(
            user=usuario_bloqueado, tipo_sobre=TIPO_SOBRE_REGALO
        )
        pack.cantidad += SOBRES_REGALO_DIARIO
        pack.save()

        usuario_bloqueado.ultimo_regalo_diario = timezone.localdate()
        usuario_bloqueado.save(update_fields=['ultimo_regalo_diario'])

    return Response({
        'mensaje': f'¡Has recibido {SOBRES_REGALO_DIARIO} sobres comunes!',
        'sobres_recibidos': SOBRES_REGALO_DIARIO,
        'sobres_totales': pack.cantidad,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ranking(request):
    """
    Clasificación de coleccionistas.

    Dos formas de mirarla, y las dos dicen algo distinto:

      ?orden=puntos     (por defecto)  quién tiene las cartas más raras
      ?orden=coleccion                 quién lleva más cartas distintas

    Lo que valen las cartas está en cards/rarezas.py.

    ⚠️ TODO en UNA consulta, con anotaciones. Calcular los puntos en Python
    obligaría a recorrer el álbum de cada usuario: 50 consultas en vez de una.
    """
    total_catalogo = Card.objects.count() or 1
    orden = request.query_params.get('orden', 'puntos')

    puntos_de_la_carta = Case(
        *[When(album__card__tier=rareza, then=Value(valor))
          for rareza, valor in PUNTOS.items()],
        default=Value(0),
        output_field=IntegerField(),
    )

    usuarios = (
        CustomUser.objects
        .annotate(
            distintas=Count('album', distinct=True),
            copias=Coalesce(Sum('album__cantidad'), 0),
            puntos=Coalesce(Sum(puntos_de_la_carta), 0),
        )
    )

    if orden == 'coleccion':
        usuarios = usuarios.order_by('-distintas', '-copias', 'username')[:50]
    else:
        usuarios = usuarios.order_by('-puntos', '-distintas', 'username')[:50]

    clasificacion = []
    for posicion, u in enumerate(usuarios, start=1):
        clasificacion.append({
            'posicion': posicion,
            'username': u.username,
            'nombre': u.nombre_mostrado or u.get_full_name() or u.username,
            'profile_image': u.foto,
            'estado': u.estado_real,
            'cartas_distintas': u.distintas,
            'cartas_con_repetidas': u.copias,
            'porcentaje': round(u.distintas / total_catalogo * 100, 1),
            'puntos': u.puntos,
            'soy_yo': u.pk == request.user.pk,
        })

    return Response({
        'cartas_en_catalogo': total_catalogo,
        'orden': orden,
        'clasificacion': clasificacion,
        'carta_mas_alta': _mejor_carta_del_catalogo(),
    })


def _mejor_carta_del_catalogo():
    """
    La carta más rara de todo el catálogo, con el nivel como desempate.

    Devuelve None si el catálogo está vacío: la portada tiene que aguantar
    una base recién creada sin reventar.
    """
    nota_por_rareza = Case(
        *[When(tier=rareza, then=Value(posicion))
          for posicion, rareza in enumerate(TODAS)],
        default=Value(-1),
        output_field=IntegerField(),
    )

    carta = (Card.objects
             .annotate(nota=nota_por_rareza)
             .order_by('-cursus_lvl', '-nota', 'login')
             .first())
    if carta is None:
        return None

    return {
        'login': carta.login,
        'tier': carta.tier,
        'nivel': carta.cursus_lvl,
        'photo': carta.photo,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_sobres(request):
    """
    Cuántos sobres tiene el usuario conectado, por tipo.
    El front lo consulta ANTES de dejar tocar el sobre: así, si no te queda
    ninguno, se avisa de entrada en vez de dejarte romper el sobre para nada.
    Devuelve todos los tipos, aunque sea con 0, para que el front no tenga que
    adivinar cuáles existen.
    """
    inventario = {tipo: 0 for tipo in CONFIGURACION_SOBRES}
    for pack in UserPack.objects.filter(user=request.user):
        if pack.tipo_sobre in inventario:
            inventario[pack.tipo_sobre] = pack.cantidad
    return Response({'sobres': inventario, 'total': sum(inventario.values())})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def abrir_sobre_endpoint(request, tipo_sobre):
    """
    Endpoint HTTP para abrir un sobre utilizando el usuario conectado (request.user).
    """
    if tipo_sobre not in CONFIGURACION_SOBRES:
        return Response(
            {"error": "El tipo de sobre solicitado no es válido."}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    user = request.user

    try:
        with transaction.atomic():
            # select_for_update: la fila queda bloqueada hasta el final de la
            # transacción. La segunda petición se queda esperando aquí y,
            # cuando entra, ya ve el inventario descontado.
            sobre_inventario = (UserPack.objects.select_for_update()
                                .filter(user=user, tipo_sobre=tipo_sobre).first())

            if sobre_inventario is None:
                return Response(
                    {"error": f"No tienes sobres {tipo_sobre} en tu inventario."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if sobre_inventario.cantidad < 1:
                return Response(
                    {"error": f"No tienes sobres {tipo_sobre} disponibles."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            sobre_inventario.cantidad -= 1
            sobre_inventario.save(update_fields=['cantidad'])

            cartas_tocadas = open_pack(tipo_sobre)

            # ⚠️ Por id, y no es un detalle: si dos peticiones bloquean las
            # mismas cartas en orden distinto, PostgreSQL corta una por
            # interbloqueo. En el mismo orden eso no puede pasar.
            for carta in sorted(cartas_tocadas, key=lambda c: c.id):
                fila, creada = UserCard.objects.get_or_create(
                    user=user, card=carta, defaults={'cantidad': 1})
                if not creada:
                    # F() suma en la propia base de datos, sin leer el valor
                    # antes: así no se puede perder un incremento.
                    UserCard.objects.filter(pk=fila.pk).update(
                        cantidad=F('cantidad') + 1)
    except Exception as e:
        return Response(
            {"error": f"No se ha podido abrir el sobre: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


    datos_cartas = []
    for c in cartas_tocadas:
        datos_cartas.append({
            "id": c.id,
            "login": c.login,
            "tier": c.tier,
            "coalition": c.coalition,
            "title": c.title,
            "altarians": c.altarians,
            "cursus_lvl": c.cursus_lvl,
            "eval_point": c.eval_point,
            "photo": c.photo
        })
        
    return Response({
        "success": True,
        "sobre_abierto": tipo_sobre,
        "sobres_restantes": sobre_inventario.cantidad,
        "cartas": datos_cartas
    }, status=status.HTTP_200_OK)
