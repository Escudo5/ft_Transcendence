from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view,permission_classes
from rest_framework import status
from django.shortcuts import render,get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from .models import Card
from .forms import CardForm
from users.models import CustomUser
from .serializers import CardSerializer, UserCardSerializer
import random
from django.contrib.auth import get_user_model
from .models import Card, UserCard, UserPack
from django.http import JsonResponse
import json
from django.db import transaction
from django.db.models import Case, Count, IntegerField, Sum, Value, When
from django.db.models.functions import Coalesce
from .rarezas import CARTAS_POR_SOBRE, PROBABILIDADES_SOBRE, PUNTOS, TODAS
from django.utils import timezone

class HealthCheckView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class CardListCreateView(generics.ListCreateAPIView):
    queryset = Card.objects.all().order_by("-created_at")
    serializer_class = CardSerializer

def crear_carta(request):
    if request.method == 'POST':
        form = CardForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('crear_carta')
    else:
        form = CardForm()
    return render(request,'cards/crear_carta.html',{'form':form})

# Create your views here.
def lista_cartas(request):
    cartas = Card.objects.all()
    return render(request,'cards/lista_cartas.html',{'cartas':cartas})

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
def home(request):
    return render(request,'cards/home.html')

# 🎁 Los sobres. Los números ya no están aquí: viven en cards/rarezas.py,
# junto a las rarezas, porque estaban escritos a mano y al cambiar las
# rarezas se quedaron viejos sin que nadie se enterara (el sorteo tiene un
# "si no hay de esa rareza, coge cualquiera" y se lo tragaba en silencio).
#
# Se mantiene la MISMA FORMA de siempre para no tocar nada de lo que la usa.
CONFIGURACION_SOBRES = {
    tipo: {"probabilidades": dict(probabilidades),
           "cartas_por_sobre": CARTAS_POR_SOBRE}
    for tipo, probabilidades in PROBABILIDADES_SOBRE.items()
}

# 🤝 El orden de los contratos de Pablo: 4 cartas distintas de la misma
# rareza -> 1 de la rareza siguiente. De menos a más rara, y sale de
# rarezas.py para que no se pueda desincronizar otra vez.
TIER_ORDER = list(TODAS)
@api_view(['POST'])
@csrf_exempt  # Permite recibir peticiones POST sin error 403 CSRF durante pruebas
def make_contract(request):
    # 1. Validar autenticación
    if not request.user.is_authenticated:  # <-- Corregido (is_authenticated)
        return JsonResponse({'error': 'Usuario no logueado.'}, status=401)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido.'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido.'}, status=400)

    cartas = data.get('cartas', [])
    cartas_len = sum(item.get('cantidad', 0) for item in cartas)
    
    # 2. Validar que la suma total de cartas a usar sea exactamente 4
    if cartas_len != 4:
        return JsonResponse({'error': 'Número de cartas inválido.'}, status=400)

    # 3. Agrupar cantidades por card_id (evita fallos si mandan la misma carta dos veces)
    cartas_agrupadas = {}
    for item in cartas:
        c_id = item.get('card')
        c_cant = item.get('cantidad', 0)
        cartas_agrupadas[c_id] = cartas_agrupadas.get(c_id, 0) + c_cant

    tier_base = None

    # 4. Validar inventario, regla del resguardo y coherencia de tiers
    for card_id, card_cuantity in cartas_agrupadas.items():
        user_card = UserCard.objects.filter(user=request.user, card_id=card_id).first()
        
        if not user_card:
            return JsonResponse({'error': f'La carta con ID {card_id} no se encuentra en el álbum.'}, status=400)
        
        if (user_card.cantidad - card_cuantity) < 1:
            return JsonResponse({'error': 'No te puedes quedar con menos de 1 carta en tu inventario.'}, status=400)
        
        card_tier = user_card.card.tier
        if tier_base is None:
            tier_base = card_tier
        elif card_tier != tier_base:
            return JsonResponse({'error': 'Los tier de las cartas deben ser todos iguales.'}, status=400)

    # 5. Calcular el siguiente tier
    actual_index = TIER_ORDER.index(tier_base)
    if actual_index == len(TIER_ORDER) - 1:
        return JsonResponse({'error': 'No se puede hacer un contrato con el tier más alto.'}, status=400)
    
    result_tier = TIER_ORDER[actual_index + 1]

    # 6. Transacción atómica: restar cartas viejas y otorgar la nueva
    with transaction.atomic():
        for card_id, card_cuantity in cartas_agrupadas.items():
            user_card = UserCard.objects.get(user=request.user, card_id=card_id)
            user_card.cantidad -= card_cuantity
            user_card.save()

        tier_cards = list(Card.objects.filter(tier=result_tier))
        if not tier_cards:
            return JsonResponse({'error': f'No hay cartas disponibles en el tier {result_tier}.'}, status=400)  # <-- Corregido (f-string)

        result_card = random.choice(tier_cards)

        # <-- Corregido (UserCard.objects.get_or_create)
        new_user_card, created = UserCard.objects.get_or_create(
            user=request.user,
            card=result_card,
            defaults={'cantidad': 1}
        )
        if not created:
            new_user_card.cantidad += 1
            new_user_card.save()

    return JsonResponse({
        'mensaje': '¡Contrato realizado con éxito!',
        'carta_obtenida': CardSerializer(result_card).data
    }, status=200)
        
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
        pack.last_daily = timezone.now()
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
    el mundo. Ya no se usa aquí.

    ⚠️ TODO en UNA consulta, con anotaciones. Calcular los puntos en Python
    obligaría a recorrer el álbum de cada usuario: 50 consultas en vez de una.
    """
    total_catalogo = Card.objects.count() or 1
    orden = request.query_params.get('orden', 'coleccion')

    # Traduce la rareza de cada carta a sus puntos DENTRO de la consulta, para
    # que sume la base de datos y no nosotros. Los pares salen del diccionario
    # de rarezas, así que añadir una rareza nueva no obliga a tocar esto.
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
            # Suma sobre las filas de UserCard, que hay una por carta distinta:
            # tener 10 copias de la misma no suma diez veces.
            puntos=Coalesce(Sum(puntos_de_la_carta), 0),
        )
    )

    if orden == 'puntos':
        usuarios = usuarios.order_by('-puntos', '-distintas', 'username')[:50]
    else:
        usuarios = usuarios.order_by('-distintas', '-copias', 'username')[:50]

    clasificacion = []
    for posicion, u in enumerate(usuarios, start=1):
        clasificacion.append({
            'posicion': posicion,
            'username': u.username,
            'nombre': u.nombre_mostrado or u.get_full_name() or u.username,
            # .foto: enseña el avatar que haya subido y, si no tiene, el de la Intra
            'profile_image': u.foto,
            'estado': u.estado_real,
            'cartas_distintas': u.distintas,
            'cartas_con_repetidas': u.copias,
            'porcentaje': round(u.distintas / total_catalogo * 100, 1),
            'puntos': u.puntos,
            'elo': u.elo,
            'soy_yo': u.pk == request.user.pk,
        })

    return Response({
        'cartas_en_catalogo': total_catalogo,
        'orden': orden,
        'clasificacion': clasificacion,
    })


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
    
    # 1. Comprobar si el usuario conectado tiene el sobre en su inventario
    try:
        sobre_inventario = UserPack.objects.get(user=user, tipo_sobre=tipo_sobre)
        if sobre_inventario.cantidad < 1:
            return Response(
                {"error": f"No tienes sobres {tipo_sobre} disponibles."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except UserPack.DoesNotExist:
        return Response(
            {"error": f"No tienes sobres {tipo_sobre} en tu inventario."}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    # 2. Restar el sobre consumido
    sobre_inventario.cantidad -= 1
    sobre_inventario.save()
    
    # 3. Generar las 5 cartas
    try:
        cartas_tocadas = open_pack(tipo_sobre)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    # 4. Registrar o actualizar las cartas en el álbum del usuario conectado
    try:
        for carta in cartas_tocadas:
            user_card, created = UserCard.objects.get_or_create(
                user=user,
                card=carta
            )
            if not created:
                user_card.cantidad += 1
            user_card.save()
            
    except Exception as e:
        return Response(
            {"error": f"Fallo al guardar en el álbum: {str(e)}"}, 
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
