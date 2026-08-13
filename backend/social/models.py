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
