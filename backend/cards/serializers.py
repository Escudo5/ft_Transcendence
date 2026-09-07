from rest_framework import serializers
from .models import Card
from .models import UserCard


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = [
            "id" ,
            "login", 
            "coalition", 
            "title", 
            "altarians", 
            "cursus_lvl", 
            "eval_point", 
            "photo", 
            "tier", 
        ]
        read_only_fields = ["id", "created_at"]
class UserCardSerializer(serializers.ModelSerializer):
    
    card = CardSerializer(read_only=True)
    
    class Meta:
        model = UserCard
        # 'cantidad' es cuantas copias tiene el usuario de esa carta. Sin esto
        # el album no puede mostrar las repetidas, que es media gracia de
        # coleccionar (y hace falta para los contratos: se cambian 4 repetidas).
        fields = ["id", "card", "cantidad", "fecha_obtencion"]
