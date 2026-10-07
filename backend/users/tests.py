"""
Pruebas del cierre de sesión: cerrar sesión en un navegador la cierra en todos.

Se ejecutan con:   docker compose exec backend python manage.py test users
Usan una base de datos aparte: no tocan ni un dato de la de verdad.
"""

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

User = get_user_model()

ME = '/api/users/me/'
LOGOUT = '/api/users/logout/'


class CerrarSesionEnTodosLosNavegadores(TestCase):

    def setUp(self):
        self.ana = User.objects.create_user(username='ana', email='ana@x.com', password='x')
        self.beto = User.objects.create_user(username='beto', email='beto@x.com', password='x')

        # Cada Client es un navegador distinto, con su propia cookie de sesión
        self.chrome = Client()
        self.firefox = Client()
        self.navegador_de_beto = Client()
        self.chrome.force_login(self.ana)
        self.firefox.force_login(self.ana)
        self.navegador_de_beto.force_login(self.beto)

    def test_al_salir_en_uno_se_cierra_tambien_el_otro(self):
        self.assertEqual(self.firefox.get(ME).status_code, 200)

        self.chrome.post(LOGOUT)

        self.assertEqual(self.chrome.get(ME).status_code, 401)
        self.assertEqual(self.firefox.get(ME).status_code, 401)

    def test_no_toca_las_sesiones_de_otra_persona(self):
        self.chrome.post(LOGOUT)

        self.assertEqual(self.navegador_de_beto.get(ME).status_code, 200)

    def test_queda_desconectado(self):
        User.objects.filter(pk=self.ana.pk).update(estado='online')

        self.chrome.post(LOGOUT)

        self.ana.refresh_from_db()
        self.assertEqual(self.ana.estado, 'offline')

    def test_salir_sin_sesion_no_falla(self):
        respuesta = Client().post(LOGOUT)

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(self.firefox.get(ME).status_code, 200)
