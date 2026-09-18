from django.contrib import admin
from .models import Card, Intercambio, UserCard, UserPack


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    # 🎓 Nacho, 18/09: añadidos nivel, grade y es_staff (lo demás, igual).
    # Sin ellos el panel enseña la rareza pero no de dónde sale, y eso es
    # justo lo que hay que poder comprobar: la rareza se calcula con el
    # grade Y el nivel (ver cards/rarezas.py), así que si una carta parece
    # mal puesta, aquí se ve el porqué sin abrir la base de datos a mano.
    list_display = ('id', 'login', 'title', 'tier', 'cursus_lvl','eval_point','altarians','coalition')
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
    # 1. Añadimos los métodos personalizados a list_display
    list_display = (
        'id', 
        'user_id_display',  # Muestra la ID del usuario
        'user', 
        'card_id_display',  # Muestra la ID de la carta
        'card', 
        'cantidad', 
        'fecha_obtencion'
    )
    
    list_filter = ('card__tier', 'card__coalition')
    search_fields = ('user__username', 'card__login', 'user__id', 'card__id')
    raw_id_fields = ('user', 'card')

    # 2. Método para la ID del usuario
    @admin.display(ordering='user__id', description='User ID')
    def user_id_display(self, obj):
        return obj.user.id if obj.user else '-'

    # 3. Método para la ID de la carta
    @admin.display(ordering='card__id', description='Card ID')
    def card_id_display(self, obj):
        return obj.card.id if obj.card else '-'
@admin.register(Intercambio)
class IntercambioAdmin(admin.ModelAdmin):
    """
    Las propuestas de cambio entre alumnos. (Nacho, 18/09: faltaba por
    registrar, era el único modelo de cards que no salía en el panel.)

    ⚠️ Cuidado al tocar el estado desde aquí: las reglas del intercambio se
    comprueban en la vista al ACEPTAR, no en el modelo. Si se pone un
    intercambio a ACEPTADO a mano, las cartas NO cambian de dueño: queda una
    propuesta que dice que se hizo y una base de datos que dice que no. Para
    mirar está bien; para resolver, desde la web.
    """

    list_display = ('id', 'de', 'para', 'carta_ofrecida', 'carta_pedida', 'estado', 'created_at')
    list_filter = ('estado', 'created_at')
    search_fields = (
        'de__username', 'para__username',
        'carta_ofrecida__login', 'carta_pedida__login',
    )
    # Cuatro desplegables (dos de usuarios y dos de 800+ cartas) en cada
    # formulario: con raw_id se queda en cuatro cajitas con lupa.
    raw_id_fields = ('de', 'para', 'carta_ofrecida', 'carta_pedida')
    date_hierarchy = 'created_at'