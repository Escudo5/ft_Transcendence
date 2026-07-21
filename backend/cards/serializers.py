from rest_framework import serializers
from .models import Card


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
