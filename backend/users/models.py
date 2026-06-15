from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class CustomUser(AbstractUser):
    id_42 = models.IntegerField(unique=True, null=True, blank=True)
    profile_image = models.URLField(max_length=500, blank=True, null=True)
    elo= models.IntegerField(default=1000)
    is_alumni = models.BooleanField(default=False)
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('ingame', 'Jugando'),
    ]
    estado = models.CharField(max_length=10, choices=STATUS_CHOICES, default='offline')

    # 🛠️ ¡AÑADE ESTAS DOS LÍNEAS AQUÍ ABAJO PARA SOLUCIONAR EL CHOQUE!
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',  # Un apodo único
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions_set',  # Otro apodo único
        blank=True
    )

    def __str__(self):
        return self.username