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
    El catálogo entero. Solo lectura y solo con sesión.

    ⚠️ ARREGLO (Nacho, 5/10): esto era `CardListCreateView(ListCreateAPIView)`
    y NO declaraba permisos, así que DRF le ponía AllowAny. Resultado:
    CUALQUIERA, sin estar registrado, podía mandar un POST aquí y METER UNA
    CARTA en el catálogo. Comprobado antes de arreglarlo: el POST sin sesión
    llegaba al serializador y solo fallaba por la longitud del login.
    Y el GET enseñaba las 824 cartas a cualquiera.
    Son dos cambios:
      - ListCreateAPIView -> ListAPIView: ya no admite POST. Nadie lo usaba
        (el front no llama a /api/cards/; las cartas las crea `fill_db`).
      - permission_classes explícito, no heredado.
    """
    queryset = Card.objects.all().order_by("-created_at")
    serializer_class = CardSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Exige que el usuario esté autenticado
def album_usuario(request):
    """
    Devuelve las cartas del usuario que tiene la sesión activa (request.user).
    """
    # 1. Django obtiene el usuario directamente de la sesión/token
    usuario = request.user

    # 2. Obtenemos todas sus cartas optimizando la consulta SQL
    album_cartas = UserCard.objects.filter(user=usuario).select_related('card')

    # 3. Serializamos la lista completa
    serializer = UserCardSerializer(album_cartas, many=True)

    # 4. Devolvemos la respuesta
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])  # Decorador necesario para Django REST Framework
# ⚠️ ARREGLO (Nacho, 5/10): le faltaba el permiso, así que DRF le ponía
# AllowAny y la carta de cualquier alumno (login, coalición, nivel, puntos de
# evaluación y saldo) se podía pedir sin estar registrado.
#
# Ponerlo NO rompe nada: el único sitio que lo llama es Home.jsx, y a la
# portada no se llega sin sesión (RUTAS_PUBLICAS en App.jsx son solo
# /privacidad y /terminos). Comprobado.
@permission_classes([IsAuthenticated])
def login_alumno(request, login):
    try:
        # 1. Busca la carta del alumno en PostgreSQL por su login
        card = Card.objects.get(login=login)
        
        # 2. Transforma el objeto de PostgreSQL a formato JSON
        serializer = CardSerializer(card)
        
        # 3. Retorna la respuesta con los datos serializados
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Card.DoesNotExist:
        return Response(
            {"error": f"No se encontró ninguna carta para el login: {login}"}, 
            status=status.HTTP_404_NOT_FOUND
        )


# 🗑️ AQUÍ ESTABAN crear_carta, lista_cartas Y home, y se han quitado (5/10).
#
# Eran las tres pantallas que Django pintaba solo al principio del proyecto,
# antes de que el front fuera React. Pintaban tres plantillas HTML que Pablo
# borró el 5/10 (commit cbe78d8), pero las vistas y sus rutas se quedaron, así
# que /home/, /crear/ y /catalogo/ del puerto 8000 respondían 500.
#
# Comprobado antes de borrarlas: no las llamaba el front, no las llamaba el
# resto del backend, no las tocaba ningún test, y no queda ninguna plantilla
# .html en el proyecto. `crear_carta` además usaba `redirect` sin importarlo,
# o sea que su POST llevaba roto desde siempre.
#
# Con ellas se han ido dos imports que ya no usaba nadie: `render` y
# `get_object_or_404` (este último ya estaba sin usar), y `CardForm`. Eso deja
# cards/forms.py sin usar: se deja en su sitio, que lo decida el equipo en la
# limpieza.

CONFIGURACION_SOBRES = {
    tipo: {"probabilidades": dict(probabilidades),
           "cartas_por_sobre": CARTAS_POR_SOBRE}
    for tipo, probabilidades in PROBABILIDADES_SOBRE.items()
}

# 🗑️ AQUÍ ESTABAN make_contract Y TIER_ORDER, y se han quitado (6/10).
#
# Era la versión de Pablo del contrato (4 repetidas de la misma rareza -> 1 de
# la siguiente), colgando de /api/cards/contract/. Hacía LA MISMA REGLA que
# cards/contratos.py, que es la que usa la pantalla (Contratos.jsx) y la única
# que se ha llamado nunca.
#
# No eran intercambiables, aunque lo pareciera: la suya esperaba el campo
# `card` en el cuerpo y la nueva espera `carta`. Y el front manda `carta`.
#
# Se quitan ahora porque Pablo ya está de vuelta y lo ha decidido el equipo
# (antes se dejaron a propósito: él estaba ausente desde el 7/09 y no se le
# podía consultar). Tener dos endpoints para lo mismo es justo lo que se
# pregunta en una evaluación.
#
# Comprobado antes de borrarlas: no las llamaba el front, ni el resto del
# backend, ni ningún test. TIER_ORDER solo lo usaba make_contract.
#
# Si hiciera falta recuperarlas, están en el historial: antes del commit de
# este cambio, en este mismo fichero.

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
        # DEVOLVEMOS EL OBJETO CARD DIRECTAMENTE (sin instanciar Serializer aquí)
        cartas_seleccionadas.append(carta_aleatoria)
        
    return cartas_seleccionadas


# =====================================================================
# 🎁 REGALO DIARIO
# Cada persona recibe 3 sobres comunes al día. NO se acumulan: si pasas
# tres días sin entrar, al volver recibes 2, no seis. Así entrar cada día
# tiene sentido.
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

      ?orden=coleccion  (por defecto)  quién lleva más cartas distintas
      ?orden=puntos                    quién tiene las cartas más raras

    Se pueden ir muy lejos la una de la otra, y esa es la gracia: alguien con
    200 comunes va por delante en colección, y alguien con 30 legendarias por
    delante en puntos. Lo que valen las cartas está en cards/rarezas.py.

    Antes había un campo 'elo' que no ordenaba nada porque era 1000 para todo
    el mundo. Se borró del proyecto el 18/09: no hay juego, y los puntos ya
    hacían su trabajo mejor.

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


# Usamos los decoradores de Django REST Framework para asegurar autenticación
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
        
    # EL USUARIO CONECTADO SE OBTIENE DIRECTAMENTE CON request.user
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

            # Se ordenan por id antes de guardar. Parece un detalle tonto y no
            # lo es: si dos peticiones tocan las mismas dos cartas en orden
            # distinto, cada una puede quedarse esperando a la fila que tiene
            # la otra, y PostgreSQL corta una con un error de interbloqueo.
            # Yendo todas en el mismo orden, eso no puede pasar.
            for carta in sorted(cartas_tocadas, key=lambda c: c.id):
                fila, creada = UserCard.objects.get_or_create(
                    user=user, card=carta, defaults={'cantidad': 1})
                if not creada:
                    # F('cantidad') + 1 NO lee el valor aquí: manda a la base
                    # de datos un "suma uno a lo que haya" en una sola orden.
                    # Por eso no se puede perder un incremento: no hay ningún
                    # momento en que tengamos el número viejo en la mano.
                    UserCard.objects.filter(pk=fila.pk).update(
                        cantidad=F('cantidad') + 1)
    except Exception as e:
        return Response(
            {"error": f"No se ha podido abrir el sobre: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


    # 5. Formatear la respuesta JSON para React
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
