from django.contrib import admin
from django import forms
from .models import Card, Intercambio, UserCard, UserPack


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('id', 'login', 'title', 'tier', 'cursus_lvl','eval_point','altarians','coalition')
    list_filter = ('tier', 'coalition')
    search_fields = ('login', 'title') # Añade buscador por login y título


@admin.register(UserPack)
class UserPackAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'tipo_sobre', 'cantidad')
    list_filter = ('tipo_sobre',)
    search_fields = ('user__username', 'user__email') # Busca por nombre o email de usuario
    list_editable = ('cantidad',) # Permite cambiar el número de sobres directamente desde la lista


class UserCardAdminForm(forms.ModelForm):
    class Meta:
        model = UserCard
        fields = '__all__'

    def validate_unique(self):
        if self.instance.pk:
            super().validate_unique()


# 2. DESPUÉS REGISTRAS Y CONFIGURAS EL ADMIN
@admin.register(UserCard)
class UserCardAdmin(admin.ModelAdmin):
    form = UserCardAdminForm  # Ahora Python ya reconoce la clase

    list_display = (
        'id', 
        'user_id_display', 
        'user', 
        'card_id_display', 
        'card', 
        'cantidad', 
        'fecha_obtencion'
    )
    
    list_editable = ('cantidad',)  # Permite editar la cantidad directamente en la tabla
    list_filter = ('card__tier', 'card__coalition')
    search_fields = ('user__username', 'card__login', 'user__id', 'card__id')
    raw_id_fields = ('user', 'card')

    def save_model(self, request, obj, form, change):
        if not change:
            existente = UserCard.objects.filter(user=obj.user, card=obj.card).first()
            if existente:
                existente.cantidad += obj.cantidad
                existente.save()
                return

        super().save_model(request, obj, form, change)

    @admin.display(ordering='user__id', description='User ID')
    def user_id_display(self, obj):
        return obj.user.id if obj.user else '-'

    @admin.display(ordering='card__id', description='Card ID')
    def card_id_display(self, obj):
        return obj.card.id if obj.card else '-'
@admin.register(Intercambio)
class IntercambioAdmin(admin.ModelAdmin):
    # ⚠️ Poner un intercambio en ACEPTADO desde aquí NO mueve las cartas: eso
    # se hace en la vista. Para mirar vale; para resolver, desde la web.
    list_display = ('id', 'de', 'para', 'carta_ofrecida', 'carta_pedida', 'estado', 'created_at')
    list_filter = ('estado', 'created_at')
    search_fields = (
        'de__username', 'para__username',
        'carta_ofrecida__login', 'carta_pedida__login',
    )
    raw_id_fields = ('de', 'para', 'carta_ofrecida', 'carta_pedida')
    date_hierarchy = 'created_at'