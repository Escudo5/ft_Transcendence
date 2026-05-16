from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Card
from .serializers import CardSerializer


class HealthCheckView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class CardListCreateView(generics.ListCreateAPIView):
    queryset = Card.objects.all().order_by("-created_at")
    serializer_class = CardSerializer
