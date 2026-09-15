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
from cards.rarezas import TODAS, rareza_de


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
        sin_grade = []
        for carta in cartas:
            # ⚠️ Nacho, 15/09: ahora la rareza necesita el grade, no solo el
            # nivel. Por eso el modelo lo guarda: así este comando sigue
            # siendo gratis y no hay que volver a bajarse 800 alumnos de la
            # Intra cada vez que se mueva un corte.
            #
            # Y POR ESO ESTA RED: si una carta no tiene grade guardado (las
            # que ya estaban en la base antes de que el campo existiera), NO
            # se toca. Sin grade, `rareza_de` las manda a todas a Junior o
            # Senior, así que este comando las habría degradado en bloque sin
            # dar ningún error: una carta de nivel 16 se habría quedado en
            # Senior. Se avisa y se dejan como están hasta que fill_db o
            # login_card les rellenen el grade.
            if not carta.grade and not carta.es_staff:
                sin_grade.append(carta)
                continue
            nueva = rareza_de(carta.grade, carta.cursus_lvl, carta.es_staff)
            if carta.tier != nueva:
                cambios.append((carta, carta.tier, nueva))
                carta.tier = nueva

        self.stdout.write(f'\n{len(cartas)} cartas · {len(cambios)} cambian de rareza\n')

        if sin_grade:
            self.stdout.write(self.style.WARNING(
                f'⚠️  {len(sin_grade)} cartas SIN TOCAR porque no tienen grade guardado.\n'
                f'    Son de antes de que existiera el campo. Sin grade no se puede\n'
                f'    saber su rareza, y tocarlas las degradaría todas a Junior/Senior.\n'
                f'    Se arregla solo en cuanto pase fill_db o login_card por ellas.\n'))

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
