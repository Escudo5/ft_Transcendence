import os
import time
import requests
from django.core.management.base import BaseCommand
from cards.models import Card
from cards.management.commands.fill_db import _obtener_headers_auth
from cards.rarezas import rareza_de          # 🎴 Nacho, 10/09 y 15/09
from cards.intra import datos_del_alumno     # 🔌 Nacho, 15/09
import json

class Command(BaseCommand):
    help = 'este comando inserta en la base de datos de las cartas creadas la carta del login que se le mande por argumentos'

    def add_arguments(self, parser):
        parser.add_argument('login', type=str)

    def handle(self, *args, **options):
        login_arg = options['login']
        
        headers = _obtener_headers_auth()
        if not headers:
            self.stdout.write(self.style.ERROR("❌ Error: No se pudieron obtener los headers de autenticación."))
            return

        # 1. Petición de usuario a la API
        url_user = f"{os.environ.get('BASE_API')}/users/{login_arg}"
        try:
            res_user = requests.get(url_user, headers=headers)
            
            # Si el usuario no existe (404) u otro error HTTP
            if res_user.status_code == 404:
                self.stdout.write(self.style.ERROR(f"❌ El login '{login_arg}' no existe en la API de 42."))
                return
            res_user.raise_for_status() # Lanza error para otros códigos (500, 403, etc.)
            
            user = res_user.json()
            ##print(json.dumps(user, indent=4, ensure_ascii=False))
        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f"❌ Error de conexión al consultar el usuario: {e}"))
            return

        # Extraer datos básicos
        login = user.get("login")
        user_id = user.get("id")
        photo = user.get("image", {}).get("versions", {}).get("medium")
        correction_point = user.get("correction_point")
        wallet = user.get("wallet")
        cursus = user.get("cursus_users", [])
        
        # 🔌 CAMBIO (Nacho, 15/09): el bucle de buscar el 42cursus a mano se
        # ha ido a cards/intra.py, porque fill_db necesitaba exactamente el
        # mismo trabajo pero con un JSON de otra forma. Ahora los dos
        # comandos llaman a la misma función y dejan de importarles de qué
        # ruta de la API venía el dato.
        d = datos_del_alumno(user)
        lvl = d["nivel"]
        grade = d["grade"]
        blackhole = d["fin"] is not None

        # 🎴 CAMBIO (Nacho, 15/09): la rareza sale del grade Y del nivel.
        # Antes salía solo del nivel, y había cadetes de nivel 11 saliendo
        # como Transcender sin haber pasado el tronco común (acastrov). El
        # porqué entero está en cards/rarezas.py.
        tier = rareza_de(grade, lvl, d["staff"])
        if grade not in ("Cadet", "Transcender", "Alumni"):
            self.stdout.write(self.style.WARNING(
                f"⚠️ Advertencia: Grado '{grade}' desconocido o no pertenece a 42cursus para {login}."))

        # Gestión de Títulos
        title = login
        title_selected = ""
        titles_users = user.get("titles_users", [])
        titles = user.get("titles", [])
        
        for it in titles_users:
            if it.get("selected") is True:
                title_selected = it.get("title_id")
                break
        
        for it in titles:
            if it.get("id") == title_selected:
                title = it.get("name").replace("%login", login)
                break

        # 2. Petición de Coaliciones a la API
        url_coalition = f"{os.environ.get('BASE_API')}/users/{user_id}/coalitions"
        coalition = ""
        try:
            url_res = requests.get(url_coalition, headers=headers)
            url_res.raise_for_status()
            coal_json = url_res.json()
            
            # Controlamos si coal_json es una lista válida
            if isinstance(coal_json, list):
                for t in coal_json:
                    if t.get("name") in ["Zefiria", "Marventis", "Tiamant", "Ignisaria"]:
                        coalition = t.get("name")
                        break
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Estructura de coaliciones inesperada para {login}."))
        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.WARNING(f"⚠️ No se pudieron obtener las coaliciones de {login}: {e}"))

        # 3. Guardado en Base de Datos (Mantenemos tu lógica Upsert)
        try:
            carta, creada = Card.objects.get_or_create(
                login=login,
                defaults={
                    'photo': photo,
                    'coalition': coalition,
                    'title': title,
                    'altarians': wallet,
                    'cursus_lvl': lvl,
                    'eval_point': correction_point,
                    'tier': tier,
                    # 🎓 Nacho, 15/09: se guardan para que recalcular_rarezas
                    # pueda rehacer la rareza sin volver a la API.
                    'grade': grade or '',
                    'es_staff': d["staff"],
                }
            )

            if creada:
                self.stdout.write(self.style.SUCCESS(f"     🃏 Cromo Creado: {login} -> {coalition} | Título: {title}"))
            else:
                carta.photo = photo
                carta.altarians = wallet
                carta.coalition = coalition
                carta.cursus_lvl = lvl
                carta.eval_point = correction_point
                carta.title = title
                carta.tier = tier
                carta.grade = grade or ''
                carta.es_staff = d["staff"]
                carta.save()
                self.stdout.write(self.style.SUCCESS(f"     🔄 Cromo Actualizado: {login}"))
                
        except Exception as database_error:
            self.stdout.write(self.style.ERROR(f"❌ Error crítico al escribir en la Base de Datos: {database_error}"))