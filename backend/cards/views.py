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