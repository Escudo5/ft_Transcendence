from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render,get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from .models import Card
from .forms import CardForm
from .serializers import CardSerializer
import random
from django.contrib.auth import get_user_model
from .models import Card, UserCard, UserPack
from django.http import JsonResponse

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
def login_alumno(request,str):
    try:
        # Busca en PostgreSQL: SELECT * FROM alumnos WHERE login = '...' LIMIT 1;
        alumno = Card.objects.get(login=login)
        
        # Devuelve los datos en un formato JSON que React pueda entender
        return JsonResponse({
            "urlphoto": Card.photo,
        })
        
    except Alumno.DoesNotExist:
        # Si el alumno no existe en la BD, devuelve un error 404
        return JsonResponse({"error": "Alumno no encontrado"}, status=404)
def home(request):
    return render(request,'cards/home.html')

CONFIGURACION_SOBRES = {
    "comun": {
        "probabilidades": {
            "Blackhole": 40,
            "Junior": 35,
            "Senior": 18,
            "Alumni": 5,
            "Transcender": 2
        },
        "cartas_por_sobre": 5
    },
    "raro": {
        "probabilidades": {
            "Blackhole": 15,
            "Junior": 25,
            "Senior": 40,
            "Alumni": 12,
            "Transcender": 8
        },
        "cartas_por_sobre": 5
    },
    "epico": {
        "probabilidades": {
            "Blackhole": 2,
            "Junior": 8,
            "Senior": 25,
            "Alumni": 30,
            "Transcender": 35
        },
        "cartas_por_sobre": 5
    }
}
def open_pack(pack_type):
    config_pack = CONFIGURACION_SOBRES.get(pack_type)
    chances = config_pack["probabilidades"]
    cards_nbr = config_pack["cartas_por_sobre"]
    tiers = list(chances.keys())
    percent = list(chances.values())

    selected_cards = []

    for it in range(cards_nbr):
        selected_tier = random.choices(tiers,weights=percent,k=1)[0]
        cards_of_tier = Card.objects.filter(tier=selected_tier)
        if not cards_of_tier.exists():
            cards_of_tier = Card.objects.all()
        if not cards_of_tier.exists():
            raise ValueError("No hay cartas cargadas en la base de datos de cartas.")
        random_card = random.choice(cards_of_tier)
        selected_cards.append(random_card)
        
    return selected_cards

def open_pack(tipo_sobre):
    """
    Selecciona 5 cartas aleatorias de la base de datos basándose 
    en las probabilidades del tipo de sobre.
    """
    config = CONFIGURACION_SOBRES.get(tipo_sobre)
    probabilidades = config["probabilidades"]
    num_cartas = config["cartas_por_sobre"]
    
    tiers = list(probabilidades.keys())
    percent = list(probabilidades.values())
    
    cartas_seleccionadas = []
    
    for _ in range(num_cartas):
        # 1. Elegimos qué rareza (Tier) toca en este hueco del sobre
        selected_tier = random.choices(tiers, weights=percent, k=1)[0]
        
        # 2. Filtramos las cartas de la base de datos que pertenecen a ese Tier
        cartas_del_tier = Card.objects.filter(tier=selected_tier)
        
        # Salvaguarda por si acaso un Tier está vacío en la base de datos de pruebas
        if not cartas_del_tier.exists():
            cartas_del_tier = Card.objects.all()
            
        if not cartas_del_tier.exists():
            raise ValueError("No hay cartas registradas en la base de datos.")
            
        # 3. Elegimos un alumno al azar de ese grupo
        carta_aleatoria = random.choice(cartas_del_tier)
        cartas_seleccionadas.append(carta_aleatoria)
        
    return cartas_seleccionadas


# =====================================================================
# 3. ENDPOINT: PROCESAR APERTURA Y GUARDAR EN ÁLBUM
# =====================================================================
@csrf_exempt
def abrir_sobre_endpoint(request, tipo_sobre):
    """
    Endpoint HTTP que maneja la lógica de negocio completa: verifica inventario,
    resta el sobre, ejecuta el gacha, guarda en el álbum y responde a React.
    """
    if tipo_sobre not in CONFIGURACION_SOBRES:
        return JsonResponse({"error": "El tipo de sobre solicitado no es válido."}, status=400)
        
    # Usuario real de la sesión; si el front todavía no envía la cookie
    # (credentials: 'include'), caemos al primer usuario de la BD como
    # apaño temporal para poder seguir probando
    User = get_user_model()
    if request.user.is_authenticated:
        user_test = request.user
    else:
        user_test = User.objects.first()
    if not user_test:
        return JsonResponse({"error": "No hay usuarios creados en la base de datos."}, status=500)
    
    # 1. Comprobar si el usuario tiene este sobre en su inventario
    try:
        sobre_inventario = UserPack.objects.get(user=user_test, tipo_sobre=tipo_sobre)
        if sobre_inventario.cantidad < 1:
            return JsonResponse({"error": f"No tienes sobres {tipo_sobre} disponibles."}, status=400)
    except UserPack.DoesNotExist:
        return JsonResponse({"error": f"No tienes sobres {tipo_sobre} en tu inventario."}, status=400)
        
    # 2. Restar el sobre consumido
    sobre_inventario.cantidad -= 1
    sobre_inventario.save()
    
    # 3. Llamar al motor gacha para generar las 5 cartas
    try:
        cartas_tocadas = open_pack(tipo_sobre)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
        
    # 4. Registrar/Actualizar las cartas en el álbum del usuario (UserCard)
    try:
        for carta in cartas_tocadas:
            user_card, created = UserCard.objects.get_or_create(
                user=user_test,
                card=carta
            )
            # Si la carta ya existía en su álbum, aumentamos el contador de repetidas
            if not created:
                user_card.cantidad += 1
            
            # Guardamos siempre, perfectamente alineado (8 espacios dentro del for)
            user_card.save()
            
    except Exception as e:
        return JsonResponse({"error": f"Fallo al guardar en el álbum: {str(e)}"}, status=500)
        
    # 5. Estructurar la respuesta JSON adaptada al modelo Card definitivo
    datos_cartas = []
    for c in cartas_tocadas:
        datos_cartas.append({
            "id": c.id,
            "login": c.login,        # REFACTORIZADO: cambiado de 'nombre' a 'login'
            "tier": c.tier,
            "coalition": c.coalition,
            "title": c.title,
            "altarians": c.altarians,
            "cursus_lvl": c.cursus_lvl,
            "eval_point": c.eval_point,
            "photo": c.photo         # Ideal para pintar la cara del alumno en React
        })
        
    return JsonResponse({
        "success": True,
        "sobre_abierto": tipo_sobre,
        "sobres_restantes": sobre_inventario.cantidad,
        "cartas": datos_cartas
    })