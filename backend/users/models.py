from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone  # Requerido para capturar la fecha actual

class CustomUser(AbstractUser):
    id_42 = models.IntegerField(unique=True, null=True, blank=True)
    profile_image = models.URLField(max_length=500, blank=True, null=True)
    elo = models.IntegerField(default=1000)  # Para emparejar jugadores en el juego de cartas
    is_alumni = models.BooleanField(default=False)
    
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('ingame', 'Jugando'),
    ]
    estado = models.CharField(max_length=10, choices=STATUS_CHOICES, default='offline')

    # 🎰 VARIABLES PARA EL ÁLBUM: Control de sobres diarios gratis
    last_login_date = models.DateField(default=timezone.now)  # Guarda el último día que se conectó
    daily_packs_claimed = models.IntegerField(default=0)      # Contador de sobres abiertos hoy (0, 1 o 2)

    # 🛠️ Parche de seguridad obligatorio para que Django no choque consigo mismo
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions_set',
        blank=True
    )

    def __str__(self):
        return self.username