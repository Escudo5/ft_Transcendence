"""
Recalcula la rareza de las cartas que YA están en la base, a partir del
nivel que tienen guardado.

Hace falta porque las cartas cargadas antes tienen las rarezas viejas
(Junior, Senior, Alumni, Blackhole) y esas ya no existen. Sin esto, el
álbum enseñaría una mezcla de las de antes y las de ahora.

⚠️ NO BORRA NINGUNA CARTA, Y ES A PROPÓSITO.

Hay cartas de alumnos que ya cayeron (las de rareza "Blackhole") que con
el filtro nuevo no volverían a entrar en el catálogo. Pero hay gente que
YA LAS TIENE en su álbum: borrarlas sería quitarle cromos a alguien sin
avisar. Aquí solo se les pone la rareza que les toca por su nivel, y se
quedan como reliquias de las primeras cargas.

Si algún día se decide quitarlas de verdad, es otra decisión y otro
comando: hay que pensar antes qué pasa con quien las tenga.

    docker compose exec backend python manage.py recalcular_rarezas
    docker compose exec backend python manage.py recalcular_rarezas --ensayo
"""

from collections import Counter

from django.core.management.base import BaseCommand
from django.db import transaction

from cards.models import Card
from cards.rarezas import TODAS, rareza_por_nivel


class Command(BaseCommand):
    help = 'Pone al día la rareza de todas las cartas según su nivel.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--ensayo', action='store_true',
            help='Enseña lo que haría, sin tocar la base de datos.',
        )

    def handle(self, *args, **opciones):
        ensayo = opciones['ensayo']
        cartas = list(Card.objects.all().order_by('login'))

        if not cartas:
            self.stdout.write(self.style.WARNING('No hay ninguna carta en la base.'))
            return

        antes = Counter(c.tier for c in cartas)
        cambios = []
        for carta in cartas:
            nueva = rareza_por_nivel(carta.cursus_lvl)
            if carta.tier != nueva:
                cambios.append((carta, carta.tier, nueva))
                carta.tier = nueva

        self.stdout.write(f'\n{len(cartas)} cartas · {len(cambios)} cambian de rareza\n')

        self.stdout.write(self.style.HTTP_INFO('ANTES:'))
        for tier, n in antes.most_common():
            self.stdout.write(f'   {tier or "(vacío)":<14} {n:>4}')

        despues = Counter(c.tier for c in cartas)
        self.stdout.write(self.style.HTTP_INFO('\nDESPUÉS:'))
        total = len(cartas)
        for tier in TODAS:
            n = despues.get(tier, 0)
            self.stdout.write(f'   {tier:<14} {n:>4}   {n * 100 / total:>4.0f}%')
        # Por si quedara alguna rareza que no esté en la lista: se avisa en
        # vez de esconderla, que es como se descubren los fallos tarde.
        for tier, n in despues.items():
            if tier not in TODAS:
                self.stdout.write(self.style.ERROR(f'   ⚠️  {tier:<11} {n:>4}   (rareza desconocida)'))

        if cambios:
            self.stdout.write(self.style.HTTP_INFO('\nEjemplos:'))
            for carta, viejo, nuevo in cambios[:10]:
                self.stdout.write(
                    f'   {carta.login:<12} nivel {carta.cursus_lvl:<6} '
                    f'{viejo or "(vacío)"} → {nuevo}')
            if len(cambios) > 10:
                self.stdout.write(f'   … y {len(cambios) - 10} más')

        if ensayo:
            self.stdout.write(self.style.WARNING('\n🔎 Ensayo: no se ha tocado nada.'))
            return

        if not cambios:
            self.stdout.write(self.style.SUCCESS('\n✅ Ya estaban todas bien.'))
            return

        # Todo de una vez: si algo falla a mitad, no queremos medio catálogo
        # con las rarezas nuevas y medio con las viejas.
        with transaction.atomic():
            Card.objects.bulk_update([c for c, _, _ in cambios], ['tier'])

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ {len(cambios)} cartas actualizadas.'))
