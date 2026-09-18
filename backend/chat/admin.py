from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """
    Los mensajes del chat, para poder mirarlos desde el panel.

    Es la tabla que más crece del proyecto: cada conversación son todos sus
    mensajes, no hay tabla de conversaciones. Por eso aquí todo está pensado
    para que la lista siga siendo usable cuando haya miles.
    """

    list_display = ('id', 'sender', 'receiver', 'vista_previa', 'leido', 'created_at')
    list_filter = ('leido', 'created_at')
    search_fields = ('sender__username', 'receiver__username', 'texto')

    # 🔎 El desplegable de usuario cargaría la lista entera de alumnos en cada
    # mensaje. Con raw_id se escribe el id y se busca con la lupa.
    raw_id_fields = ('sender', 'receiver')

    date_hierarchy = 'created_at'
    ordering = ('-created_at',)   # aquí interesa lo último, al revés que en el chat

    @admin.display(description='Mensaje')
    def vista_previa(self, mensaje):
        """
        El texto puede llegar a 1000 caracteres y reventaría el ancho de la
        lista. Aquí solo se asoma el principio; el completo está al abrirlo.
        """
        if len(mensaje.texto) <= 60:
            return mensaje.texto
        return mensaje.texto[:60] + '…'
