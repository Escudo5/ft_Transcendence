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
    
    # 📸 ARREGLADO: max_length=500 para evitar que el CDN de 42 rompa el límite de caracteres
    photo = models.URLField(max_length=500, blank=True, null=True)
    

    # ==========================================
    # PARTE NO VISIBLE
    # ==========================================
    # ⚠️ Nacho, 15/09: el valor por defecto era "Bronce", una rareza que no
    # existe desde hace días. Nunca dio error porque nadie lo comprobaba.
    tier = models.CharField(max_length=50, default=JUNIOR)

    # 🎓 Nacho, 15/09: EL GRADE Y EL STAFF HAY QUE GUARDARLOS.
    #
    # Desde que la rareza depende del grade y no solo del nivel, no basta
    # con guardar `cursus_lvl`: sin el grade no se puede volver a calcular
    # la rareza de una carta que ya está en la base.
    #
    # Y eso importa porque `recalcular_rarezas` existe justo para eso:
    # poner al día las cartas guardadas SIN gastar peticiones de la API.
    # Si el grade no estuviera aquí, cada vez que se toque un corte habría
    # que volver a bajarse los 800 alumnos de la Intra.
    #
    # `grade` va vacío y no nulo para no tener que preguntar por None en
    # todas partes: un piscinero o un dato incompleto se queda en "".
    grade = models.CharField(max_length=30, blank=True, default='')
    es_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    # 🛠️ ARREGLADO: Cambiado 'self.name' por 'self.login' para evitar que explote Django
    def __str__(self) -> str:
        return f"Carta de {self.login}"

class UserCard(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='album')

    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='poseedores')

    cantidad = models.PositiveIntegerField(default=1)

    fecha_obtencion = models.DateTimeField(auto_now_add=True)

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

    # 🗑️ Aquí había `last_daily`, quitado el 18/09. Se escribía al entregar
    # el regalo y NO lo leía nadie: quien decide si te toca regalo es
    # `CustomUser.ultimo_regalo_diario` (ver cards/views.py). Dos campos
    # para lo mismo, y uno de ellos solo escribía.

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
