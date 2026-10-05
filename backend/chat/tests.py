"""
🧪 PRUEBAS DEL CHAT (Nacho, 5/10)

Estas pruebas nacen de dos preguntas que hizo Pablo, y las dos merecían una
respuesta medida y no una opinión:

  1. "Si los dos escribimos a la vez se pierden mensajes." -> ERA VERDAD. El
     fallo estaba en el front y aquí se fija el comportamiento del servidor en
     el que se apoya el arreglo, para que nadie lo cambie sin darse cuenta.

  2. "¿Y si alguien mete <script>alert('Hacked')</script>?" -> NO es un
     agujero, y aquí queda demostrado por qué: el servidor guarda y devuelve el
     texto TAL CUAL (que es lo correcto, no hay que mutilar lo que escribe
     nadie) y lo entrega como JSON, nunca como HTML. Quien lo pinta es React,
     que convierte el '<' en '&lt;' antes de que llegue al navegador.

⚠️ POR QUÉ NO HAY NINGÚN "SANEADO" DE HTML, Y NO SE DEBE AÑADIR:
   filtrar o escapar el texto al guardarlo rompería mensajes legítimos — quien
   escriba "2 < 3" o "pan & circo" vería su mensaje mutilado — y nos daría una
   falsa sensación de seguridad. Lo que protege es cómo se PINTA, no cómo se
   guarda. Si algún día alguien usa dangerouslySetInnerHTML en el front, esa
   línea es el agujero, no esto.

Se ejecutan con:   docker compose exec backend python manage.py test chat
Usan una base de datos aparte: no tocan ni un dato de la de verdad.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model

from social.models import Bloqueo, FriendRequest

from .models import Message

User = get_user_model()

# El mensaje que preguntó Pablo, tal cual.
PAYLOAD_XSS = "<script>alert('Hacked')</script>"


class BaseChat(TestCase):
    """Tres usuarios: ana y bruno son amigos, carla no tiene nada que ver."""

    def setUp(self):
        self.ana = User.objects.create_user(
            username='ana', email='ana@test.local', password='Prueba.1234')
        self.bruno = User.objects.create_user(
            username='bruno', email='bruno@test.local', password='Prueba.1234')
        self.carla = User.objects.create_user(
            username='carla', email='carla@test.local', password='Prueba.1234')

        FriendRequest.objects.create(
            sender=self.ana, receiver=self.bruno,
            status=FriendRequest.StatusChoice.ACCEPTED)

        self.como_ana = APIClient()
        self.como_ana.force_authenticate(self.ana)
        self.como_bruno = APIClient()
        self.como_bruno.force_authenticate(self.bruno)
        self.como_carla = APIClient()
        self.como_carla.force_authenticate(self.carla)

    def url(self, username, desde=None):
        u = f'/api/chat/{username}/'
        return f'{u}?desde={desde}' if desde is not None else u


class MensajeMalicioso(BaseChat):
    """La pregunta de Pablo: ¿y si alguien mete un <script>?"""

    def test_se_guarda_tal_cual_sin_mutilar(self):
        r = self.como_ana.post(self.url('bruno'), {'texto': PAYLOAD_XSS}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

        guardado = Message.objects.get()
        self.assertEqual(guardado.texto, PAYLOAD_XSS)

    def test_la_api_lo_devuelve_tal_cual_y_como_json_no_como_html(self):
        self.como_ana.post(self.url('bruno'), {'texto': PAYLOAD_XSS}, format='json')

        r = self.como_bruno.get(self.url('ana'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json()['mensajes'][-1]['texto'], PAYLOAD_XSS)

        # Lo decisivo: el navegador solo ejecuta un <script> cuando está
        # leyendo un documento HTML. Una respuesta JSON no se lee así nunca.
        self.assertIn('application/json', r['Content-Type'])
        self.assertNotIn('html', r['Content-Type'].lower())

    def test_otras_cargas_tipicas_tampoco_rompen_nada(self):
        cargas = [
            '<img src=x onerror=alert(1)>',
            '"><svg/onload=alert(1)>',
            "javascript:alert('x')",
            '{{7*7}}',                       # plantillas
            "'; DROP TABLE chat_message; --",  # inyección SQL
            '2 < 3 && 4 > 1',                # ⬅️ texto legítimo: NO se toca
        ]
        for carga in cargas:
            with self.subTest(carga=carga):
                r = self.como_ana.post(self.url('bruno'), {'texto': carga}, format='json')
                self.assertEqual(r.status_code, status.HTTP_201_CREATED)
                self.assertEqual(Message.objects.latest('id').texto, carga)

        # Y la tabla sigue ahí después del intento de SQL.
        self.assertEqual(Message.objects.count(), len(cargas))


class ConcurrenciaDelRefresco(BaseChat):
    """
    El fallo que encontró Pablo. El front pide ?desde=<id> y el servidor
    filtra id > desde, así que la referencia que guarde el front tiene que ser
    el id más alto RECIBIDO, nunca el del mensaje que acaba de enviar.
    """

    def test_desde_filtra_por_id_estrictamente_mayor(self):
        m1 = Message.objects.create(sender=self.ana, receiver=self.bruno, texto='uno')
        m2 = Message.objects.create(sender=self.bruno, receiver=self.ana, texto='dos')

        r = self.como_ana.get(self.url('bruno', desde=m1.id))
        ids = [m['id'] for m in r.json()['mensajes']]
        self.assertEqual(ids, [m2.id], 'desde=N debe devolver solo lo posterior a N')

    def test_el_fallo_de_verdad_guardar_el_id_propio_se_come_el_del_otro(self):
        """Reproduce el escenario exacto: lo que NO debe hacer el front."""
        viejo = Message.objects.create(sender=self.ana, receiver=self.bruno, texto='vamos por aqui')

        # Bruno escribe dentro de los 3 segundos del refresco de Ana
        del_otro = Message.objects.create(sender=self.bruno, receiver=self.ana, texto='HOLA')

        # Y ahora escribe Ana: su mensaje tiene id MAYOR que el de Bruno
        mio = self.como_ana.post(self.url('bruno'), {'texto': 'hola yo'}, format='json').json()
        self.assertGreater(mio['id'], del_otro.id)

        # ❌ Lo que hacía el front: guardar el id propio
        r = self.como_ana.get(self.url('bruno', desde=mio['id']))
        ids_mal = [m['id'] for m in r.json()['mensajes']]
        self.assertNotIn(del_otro.id, ids_mal,
                         'si el front guarda su propio id, el mensaje del otro NO vuelve')

        # ✅ Lo que hace ahora: guardar el último RECIBIDO
        r = self.como_ana.get(self.url('bruno', desde=viejo.id))
        ids_bien = [m['id'] for m in r.json()['mensajes']]
        self.assertIn(del_otro.id, ids_bien)
        self.assertIn(mio['id'], ids_bien)
        self.assertEqual(ids_bien, sorted(ids_bien), 'y vienen en orden')

        # El mensaje nunca se perdió: estaba guardado, solo no se pintaba.
        self.assertTrue(Message.objects.filter(id=del_otro.id).exists())


class QuienPuedeLeerQue(BaseChat):
    """Lo que de verdad importa en un chat: que nadie lea lo que no es suyo."""

    def setUp(self):
        super().setUp()
        FriendRequest.objects.create(
            sender=self.bruno, receiver=self.carla,
            status=FriendRequest.StatusChoice.ACCEPTED)
        self.secreto = Message.objects.create(
            sender=self.bruno, receiver=self.carla, texto='SECRETO DE BRUNO Y CARLA')

    def test_ana_no_puede_leer_la_conversacion_de_bruno_con_carla(self):
        # Por la puerta de carla: no son amigas
        r = self.como_ana.get(self.url('carla'))
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn('SECRETO', r.content.decode())

        # Por la puerta de bruno, que SÍ es su amigo: solo ve lo suyo con él
        r = self.como_ana.get(self.url('bruno'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertNotIn('SECRETO', r.content.decode())

    def test_ni_forzando_que_devuelva_el_historico_entero(self):
        r = self.como_ana.get(self.url('bruno', desde=0))
        self.assertNotIn('SECRETO', r.content.decode())

    def test_sin_sesion_no_se_lee_nada(self):
        r = APIClient().get(self.url('bruno'))
        self.assertIn(r.status_code,
                      (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.assertNotIn('SECRETO', r.content.decode())

    def test_los_dueños_si_lo_ven(self):
        """Si esto falla, las pruebas de arriba no demostrarían nada."""
        for cliente, otro in ((self.como_bruno, 'carla'), (self.como_carla, 'bruno')):
            r = cliente.get(self.url(otro))
            self.assertIn('SECRETO', r.content.decode())


class ValidacionAlEscribir(BaseChat):

    def test_no_se_puede_escribir_a_quien_no_es_amigo(self):
        r = self.como_ana.post(self.url('carla'), {'texto': 'hola'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Message.objects.count(), 0)

    def test_mensaje_vacio_o_solo_espacios(self):
        for texto in ('', '   ', '\n\t '):
            with self.subTest(texto=repr(texto)):
                r = self.como_ana.post(self.url('bruno'), {'texto': texto}, format='json')
                self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Message.objects.count(), 0)

    def test_mas_largo_del_maximo(self):
        r = self.como_ana.post(
            self.url('bruno'), {'texto': 'x' * (Message.LARGO_MAXIMO + 1)}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Message.objects.count(), 0)

        # Justo el máximo sí entra
        r = self.como_ana.post(
            self.url('bruno'), {'texto': 'x' * Message.LARGO_MAXIMO}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_no_se_puede_escribir_si_hay_bloqueo(self):
        Bloqueo.objects.create(de=self.bruno, a=self.ana)
        r = self.como_ana.post(self.url('bruno'), {'texto': 'hola'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Message.objects.count(), 0)

    def test_no_se_puede_escribir_a_uno_mismo(self):
        FriendRequest.objects.filter(sender=self.ana, receiver=self.ana).delete()
        r = self.como_ana.post(self.url('ana'), {'texto': 'hola'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


class LimiteDeEnvio(BaseChat):
    """
    El tope de mensajes por minuto. La cuenta vive en la caché de Django, así
    que hay que vaciarla entre pruebas o se arrastra de una a otra.
    """

    def setUp(self):
        super().setUp()
        from django.core.cache import cache
        cache.clear()

    def tearDown(self):
        from django.core.cache import cache
        cache.clear()

    def test_el_limite_corta_al_pasarse(self):
        from django.core.cache import cache

        enviados, cortado = 0, False
        for i in range(70):
            r = self.como_ana.post(self.url('bruno'), {'texto': f'm{i}'}, format='json')
            if r.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                cortado = True
                self.assertIn('demasiado rápido', r.json()['detail'])
                break
            enviados += 1

        self.assertTrue(cortado, 'el límite tiene que cortar antes de 70 mensajes')
        self.assertGreaterEqual(enviados, 50, 'y no puede cortar a una persona normal')
        cache.clear()

    def test_el_limite_NO_cuenta_las_lecturas(self):
        """
        Lo importante: el front pide la conversación cada 3 segundos. Si los GET
        gastaran cupo, a quien tuviera el chat abierto le quedarían menos
        mensajes de los que dice el límite.
        """
        for _ in range(80):
            r = self.como_ana.get(self.url('bruno'))
            self.assertEqual(r.status_code, status.HTTP_200_OK)

        # Y después de 80 lecturas todavía puede escribir
        r = self.como_ana.post(self.url('bruno'), {'texto': 'sigo pudiendo'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
