from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render
from .models import Card
from .forms import CardForm
from .serializers import CardSerializer


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