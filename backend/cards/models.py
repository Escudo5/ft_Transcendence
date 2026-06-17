from django.db import models
from django.conf import settings


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
    is_alumni = models.BooleanField(default=False)
    is_blackhole = models.BooleanField(default=False)
    
    # 📸 ARREGLADO: max_length=500 para evitar que el CDN de 42 rompa el límite de caracteres
    photo = models.URLField(max_length=500, blank=True, null=True)
    

    # ==========================================
    # PARTE NO VISIBLE
    # ==========================================
    tier = models.CharField(max_length=50, default="Bronce") # Un valor por defecto para empezar
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
        return f"{self.user.username} tiene {self.cantidad}x {self.card.nombre}"
