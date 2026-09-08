from django.conf import settings
from django.db import models


class Message(models.Model):
    """
    Un mensaje de una persona a otra.

    Es la pieza que faltaba: hasta ahora el chat era solo pantalla, se escribía
    algo y no se guardaba en ningún sitio ni le llegaba a nadie.

    No hay tabla de "conversaciones" a propósito. Una conversación no es un
    objeto que haya que crear y mantener: es simplemente todos los mensajes
    entre dos personas. Con una tabla menos hay una cosa menos que se pueda
    quedar desincronizada.
    """

    LARGO_MAXIMO = 1000  # el mismo número lo comprueba la vista y el navegador

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mensajes_enviados',
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mensajes_recibidos',
    )
    texto = models.TextField(max_length=LARGO_MAXIMO)
    created_at = models.DateTimeField(auto_now_add=True)

    # Lo marca como leído quien lo recibe al abrir la conversación. Sirve para
    # el contador de "mensajes sin leer".
    leido = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']  # del más antiguo al más nuevo, como se lee
        indexes = [
            # La consulta que más se repite con diferencia es "dame la
            # conversación entre estos dos", y el front la va a pedir cada
            # pocos segundos. Sin este índice, PostgreSQL tendría que recorrer
            # la tabla entera de mensajes cada vez.
            models.Index(fields=['sender', 'receiver', 'created_at']),
        ]

    def __str__(self):
        return f'{self.sender} -> {self.receiver}: {self.texto[:30]}'
