from django.contrib import admin
from .models import Card


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "attack", "defense", "rarity", "created_at")
    search_fields = ("name", "rarity")
    list_filter = ("rarity",)
