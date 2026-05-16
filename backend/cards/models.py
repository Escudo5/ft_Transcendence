from django.db import models


class Card(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    attack = models.PositiveSmallIntegerField(default=0)
    defense = models.PositiveSmallIntegerField(default=0)
    rarity = models.CharField(max_length=20, default="common")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name
