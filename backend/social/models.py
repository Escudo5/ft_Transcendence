from django.db import models
from django.conf import settings

class FriendRequest(models.Model):
    class StatusChoice(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        ACCEPTED = 'ACCEPTED', 'Aceptada'
        DECLINED = 'DECLINED', 'Rechazada'

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='send_friend_request'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recive_friend_request'
    )
    status = models.CharField(
        max_length=10,
        choices=StatusChoice.choices,
        default=StatusChoice.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('sender', 'receiver')

    def __str__(self):
        return f"{self.sender} -> {self.receiver} [{self.status}]"


class Bloqueo(models.Model):
    """
    Alguien ha bloqueado a alguien.

    Es una relación de UNA dirección: que yo te bloquee no significa que tú
    me hayas bloqueado a mí. Por eso hay dos campos distintos en la lista de
    amigos ('bloqueado' y 'me_ha_bloqueado'): son dos cosas diferentes y el
    front tiene que poder enseñarlas por separado.

    Bloquear NO deshace la amistad, igual que en WhatsApp: la persona sigue
    en tu lista, marcada. Así se puede desbloquear sin volver a pedir
    amistad.

    Lo que sí impide es ESCRIBIR, y en los dos sentidos: si cualquiera de
    los dos ha bloqueado al otro, no hay mensajes en ninguna dirección. Los
    mensajes antiguos se quedan: bloquear no borra lo ya hablado.
    """

    de = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='bloqueos_hechos',
    )
    a = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='bloqueos_recibidos',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Una sola vez por pareja y dirección: bloquear dos veces no hace nada
        unique_together = ('de', 'a')
        indexes = [
            models.Index(fields=['de', 'a']),
        ]

    def __str__(self):
        return f'{self.de} ha bloqueado a {self.a}'
