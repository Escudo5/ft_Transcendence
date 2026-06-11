from django.db import models
from django.conf import settings


class Card(models.Model):
   # parte visible  
    login = models.CharField(max_length=10)
    coalition = models.CharField(max_length=50)
    coalition_points = models.IntegerField()
    title = models.CharField(max_length=100)
    altarians = models.IntegerField()
    cursus_lvl = models.FloatField()
    eval_point = models.IntegerField()
    #photo = models.ImageField()
    

#part no visible
    tier = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self) -> str:
        return self.name

class UserCard(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='album')

    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='poseedores')

    cantidad = models.PositiveIntegerField(default=1)

    fecha_obtencion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} tiene {self.cantidad}x {self.card.nombre}"
