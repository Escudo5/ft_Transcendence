from django.contrib import admin
from .models import Card


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'login', 'tier', 'coalition') 
    list_filter = ('tier', 'coalition')
