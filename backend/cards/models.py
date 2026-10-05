from django.db import models
from django.conf import settings

from .rarezas import JUNIOR


class Card(models.Model):
    # ==========================================
    # PARTE VISIBLE
    # ==========================================
    login = models.CharField(max_length=10, unique=True) # ¡Añadido unique=True para que no haya dos cartas de 'tomas'!
    coalition = models.CharField(max_length=50, blank=True, null=True) # Por si no tiene coalición
    title = models.CharField(max_length=100, blank=True, null=True)      # Por si no tiene título seleccionado
    altarians = models.IntegerField(default=0)                            # Tus wallets de la intra
    cursus_lvl = models.FloatField(default=0.0)
    eval_point = models.IntegerField(default=0)
    photo = models.URLField(max_length=500, blank=True, null=True)
    
    

    # ==========================================
    # PARTE NO VISIBLE
    # ==========================================
    tier = models.CharField(max_length=50, default=JUNIOR)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Carta de {self.login}"

class UserCard(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='album')

    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='poseedores')

    cantidad = models.PositiveIntegerField(default=1)

    fecha_obtencion = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'card')
        verbose_name = 'Carta de usuario'
        verbose_name_plural = 'Álbumes (Cartas de usuarios)'

    def __str__(self):
        return f"{self.user.username} tiene {self.cantidad}x {self.card.login}"
class UserPack(models.Model):
    TIPOS_SOBRE = [
        ('comun', 'Sobre Común'),
        ('raro', 'Sobre Raro'),
        ('epico', 'Sobre Épico'),
    ]

    # Apunta al usuario usando settings, igual que en tu UserCard
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='inventario_sobres'
    )

    tipo_sobre = models.CharField(max_length=20, choices=TIPOS_SOBRE)
    cantidad = models.PositiveIntegerField(default=0)


    class Meta:
        unique_together = ('user', 'tipo_sobre')

    def __str__(self):
        return f"{self.user.username} - {self.cantidad}x {self.tipo_sobre}"


class Intercambio(models.Model):
    """
    Una propuesta de cambio de cartas entre dos alumnos.

    La idea: tienes a Konrad repetido y te falta Pablo. Le propones a
    alguien "te doy mi Konrad por tu Pablo", y si acepta, las dos cartas
    cambian de dueño a la vez.

    Es la única parte del proyecto que aprovecha que la gente está
    físicamente junta en el campus: da un motivo para girarse y hablar con
    quien tienes al lado.

    ⚠️ Las reglas NO viven aquí, viven en la vista, y a propósito: hay que
    comprobarlas al ACEPTAR, no al proponer. Entre que propones y te
    aceptan pueden pasar días, y en ese tiempo cualquiera de los dos puede
    haber gastado esa carta en un contrato.
    """

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ACEPTADO = 'ACEPTADO', 'Aceptado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'
        CANCELADO = 'CANCELADO', 'Cancelado'   # lo retira quien lo propuso

    de = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='intercambios_propuestos',
    )
    para = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='intercambios_recibidos',
    )

    # Lo que ofrece quien propone
    carta_ofrecida = models.ForeignKey(
        Card, on_delete=models.CASCADE, related_name='ofrecida_en',
    )
    # Lo que pide a cambio
    carta_pedida = models.ForeignKey(
        Card, on_delete=models.CASCADE, related_name='pedida_en',
    )

    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PENDIENTE)
    created_at = models.DateTimeField(auto_now_add=True)
    resuelto_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']   # lo más reciente arriba
        indexes = [
            # Las dos consultas que hace el front: "mis propuestas recibidas"
            # y "las que he enviado", las dos filtrando por estado.
            models.Index(fields=['para', 'estado']),
            models.Index(fields=['de', 'estado']),
        ]

    def __str__(self):
        return (f'{self.de} ofrece {self.carta_ofrecida.login} '
                f'por {self.carta_pedida.login} de {self.para} [{self.estado}]')
