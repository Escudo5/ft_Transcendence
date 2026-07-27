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
def album_usuario(request, id_user):
    try:
        # 1. Verificamos que el usuario exista en PostgreSQL
        usuario = CustomUser.objects.get(id=id_user)
        
        # 2. Obtenemos todas sus cartas optimizando la consulta SQL
        album_cartas = UserCard.objects.filter(user=usuario).select_related('card')
        
        # 3. Serializamos la lista completa
        serializer = UserCardSerializer(album_cartas, many=True)
        
        # 4. Devolvemos la respuesta
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except CustomUser.DoesNotExist:
        return Response(
            {"error": f"El usuario con id {id_user} no existe."},
            status=status.HTTP_404_NOT_FOUND
        )

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