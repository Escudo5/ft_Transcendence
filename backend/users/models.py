from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone  # Requerido para capturar la fecha actual

class CustomUser(AbstractUser):
    id_42 = models.IntegerField(unique=True, null=True, blank=True)

    # 📧 El email es la llave para entrar con contraseña, asi que no puede
    # repetirse. Admite vacio (null) por si 42 no devuelve correo de alguien:
    # en PostgreSQL varios vacios NO chocan entre si, pero dos correos iguales si.
    email = models.EmailField(unique=True, null=True, blank=True)
    profile_image = models.URLField(max_length=500, blank=True, null=True)
    elo = models.IntegerField(default=1000)  # Para emparejar jugadores en el juego de cartas
    is_alumni = models.BooleanField(default=False)
    
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('ingame', 'Jugando'),
    ]
    estado = models.CharField(max_length=10, choices=STATUS_CHOICES, default='offline')

    # 🎰 Último día que se conectó (para el ciclo diario del álbum).
    # El contador de sobres diarios ya NO vive aquí: se lleva en cards.UserPack
    last_login_date = models.DateField(default=timezone.now)

    # 🎁 Día en que recogió por última vez el regalo diario de sobres.
    # Vacío = todavía no lo ha recogido nunca. Se compara con la fecha de hoy
    # (hora de Madrid) para saber si le toca otra vez.
    ultimo_regalo_diario = models.DateField(null=True, blank=True)

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