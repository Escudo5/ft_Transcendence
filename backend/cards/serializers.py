from rest_framework import serializers
from .models import Card


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = [
            "id", 
            "login", 
            "coalition", 
            "title", 
            "altarians", 
            "cursus_lvl", 
            "eval_point", 
            "is_alumni", 
            "is_blackhole", 
            "photo", 
            "tier", 
            "created_at"
        ]
        read_only_fields = ["id", "created_at"]
