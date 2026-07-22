from rest_framework import serializers
from .models import Card
from .models import UserCard


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = [ 
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
        fields = ["id","card"]
