from datetime import timedelta
from urllib.parse import quote

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone 

class CustomUser(AbstractUser):
    id_42 = models.IntegerField(unique=True, null=True, blank=True)

    # 📧 El email es la llave para entrar con contraseña, asi que no puede
    # repetirse. Admite vacio (null) por si 42 no devuelve correo de alguien:
    # en PostgreSQL varios vacios NO chocan entre si, pero dos correos iguales si.
    email = models.EmailField(unique=True, null=True, blank=True)
    profile_image = models.URLField(max_length=500, blank=True, null=True)
    is_alumni = models.BooleanField(default=False)

    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]
    estado = models.CharField(max_length=10, choices=STATUS_CHOICES, default='offline')


    bio = models.TextField(max_length=500, blank=True, default='')
    nombre_mostrado = models.CharField(max_length=50, blank=True, default='')

    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    ultima_actividad = models.DateTimeField(null=True, blank=True)

    # 🎁 Día en que recogió por última vez el regalo diario de sobres.
    # Vacío = todavía no lo ha recogido nunca. Se compara con la fecha de hoy
    # (hora de Madrid) para saber si le toca otra vez.
    ultimo_regalo_diario = models.DateField(null=True, blank=True)


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

    # Cuánto tiempo sin dar señales de vida hay que estar para contar como
    # desconectado. 5 minutos: suficiente para que no parpadee mientras alguien
    # lee una página, y poco para que no se quede nadie "en línea" fantasma.
    MINUTOS_PARA_DESCONECTAR = 5

    @property
    def estado_real(self):
        """
        El estado que hay que enseñar, comprobado contra el reloj.

        El campo 'estado' dice lo último que la persona hizo a propósito
        (entrar, ponerse a jugar, salir), pero nadie cierra sesión: cierran la
        pestaña. Así que si hace más de 5 minutos que no se le ve, se le da por
        desconectado aunque en la base ponga que sigue dentro.
        """
        if self.estado == 'offline':
            return 'offline'
        if self.ultima_actividad is None:
            return 'offline'
        inactivo = timezone.now() - self.ultima_actividad
        if inactivo > timedelta(minutes=self.MINUTOS_PARA_DESCONECTAR):
            return 'offline'
        return self.estado  # aquí ya solo puede ser 'online'

    @property
    def avatar_por_defecto(self):
        """
        Avatar de reserva para quien no tiene ninguna foto: un círculo de color
        con su inicial, como hacen Gmail o Slack.

        El subject lo pide expresamente ("with a default avatar if none
        provided"), y hace falta sobre todo para las cuentas de correo y
        contraseña, que no traen foto de la Intra.

        Es un dibujo (SVG) metido en la propia dirección, así que no hay que
        guardar ninguna imagen en el servidor ni añadir rutas nuevas: el
        navegador lo pinta directamente.

        El color sale del nombre de usuario, así que cada persona tiene siempre
        el mismo y dos personas distintas rara vez coinciden.
        """
        nombre = self.nombre_mostrado or self.username or '?'
        inicial = nombre.strip()[:1].upper() or '?'
        tono = sum(ord(c) for c in (self.username or '?')) % 360

        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
            f'<rect width="100" height="100" fill="hsl({tono},45%,42%)"/>'
            '<text x="50" y="50" fill="#ffffff" font-size="46" '
            'font-family="Helvetica,Arial,sans-serif" font-weight="bold" '
            f'text-anchor="middle" dominant-baseline="central">{inicial}</text>'
            '</svg>'
        )
        # quote() escapa los caracteres que romperian la direccion (<, >, #, comillas)
        return 'data:image/svg+xml;charset=utf-8,' + quote(svg)

    @property
    def foto(self):
        """
        La foto que hay que enseñar de esta persona, ya decidida. Tres escalones:

            1. el avatar que haya subido       (manda siempre)
            2. la foto de la Intra             (si entró con 42)
            3. el avatar por defecto           (nunca se queda sin foto)

        Todas las respuestas del backend usan ESTO en vez de profile_image, así
        que al subir un avatar cambia la foto en el perfil, en el ranking y en
        la portada a la vez, sin tocar nada más.
        """
        if self.avatar:
            return self.avatar.url
        if self.profile_image:
            return self.profile_image
        return self.avatar_por_defecto

    def __str__(self):
        return self.username