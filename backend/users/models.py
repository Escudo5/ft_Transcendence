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

    # 👤 CAMPOS DEL PERFIL QUE ESCRIBE EL PROPIO USUARIO.
    # Van aparte a propósito: el login con 42 refresca en cada entrada el
    # nombre, los apellidos, el email y la foto con lo que diga la Intra. Si
    # dejáramos editar esos, se borraría lo escrito en el siguiente login.
    # Estos dos son nuestros y la Intra no los toca nunca.
    bio = models.TextField(max_length=500, blank=True, default='')
    nombre_mostrado = models.CharField(max_length=50, blank=True, default='')

    # 🖼️ Avatar propio. Ojo a la diferencia con profile_image de arriba:
    #   profile_image -> una URL que apunta a la Intra, la refresca cada login
    #   avatar        -> un FICHERO que sube el usuario y vive en backend/media
    # Por eso son dos campos y no uno: si los mezclásemos, el siguiente login
    # con 42 borraría la foto que acaba de subir.
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

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

    @property
    def foto(self):
        """
        La foto que hay que enseñar de esta persona, ya decidida.

        Manda el avatar que haya subido; si no ha subido ninguno, se usa el de
        la Intra; y si tampoco tiene, None y el front pinta el muñequito.

        Todas las respuestas del backend usan ESTO en vez de profile_image, así
        que al subir un avatar cambia la foto en el perfil, en el ranking y en
        la portada a la vez, sin tocar nada más.
        """
        if self.avatar:
            return self.avatar.url
        return self.profile_image

    def __str__(self):
        return self.username