from django.contrib import admin

from .models import Bloqueo, FriendRequest


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    """
    Las peticiones de amistad, en los tres estados por los que pasan.

    Mirar aquí es la forma más rápida de entender por qué dos personas no se
    ven como amigas: casi siempre es una petición que se quedó en PENDING.
    """

    list_display = ('id', 'sender', 'receiver', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('sender__username', 'receiver__username')
    raw_id_fields = ('sender', 'receiver')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)


@admin.register(Bloqueo)
class BloqueoAdmin(admin.ModelAdmin):
    """
    Quién ha bloqueado a quién.

    ⚠️ Es de UNA dirección: que aparezca "ana bloqueó a luis" no significa que
    exista la fila contraria. Si se busca por un login saldrán las dos cosas
    mezcladas, así que hay que mirar la columna: 'de' es quien bloquea.
    """

    list_display = ('id', 'de', 'a', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('de__username', 'a__username')
    raw_id_fields = ('de', 'a')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
