from django.contrib import admin
from .models import Card, UserCard, UserPack


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('id', 'login', 'title', 'tier', 'coalition') 
    list_filter = ('tier', 'coalition')
    search_fields = ('login', 'title') # Añade buscador por login y título


@admin.register(UserPack)
class UserPackAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'tipo_sobre', 'cantidad')
    list_filter = ('tipo_sobre',)
    search_fields = ('user__username', 'user__email') # Busca por nombre o email de usuario
    list_editable = ('cantidad',) # Permite cambiar el número de sobres directamente desde la lista


@admin.register(UserCard)
class UserCardAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'card', 'cantidad', 'fecha_obtencion')
    list_filter = ('card__tier', 'card__coalition')
    search_fields = ('user__username', 'card__login')
    raw_id_fields = ('user', 'card') # Útil para seleccionar usuario y carta rápidamente si la BD es grande