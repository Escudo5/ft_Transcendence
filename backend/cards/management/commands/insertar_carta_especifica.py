import os
import time
import requests
from django.core.management.base import BaseCommand
from cards.models import Card
from cards.management.commands.poblar_catalogo import _obtener_headers_auth
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
        
        # Inicializamos variables por si el usuario no tiene el 42cursus (ej. Piscineros)
        blackhole = False
        lvl = 0.0
        grade = None
        tier = "Desconocido"

        # Buscar el 42cursus
        for it in cursus:
            if it.get("cursus", {}).get("name") == "42cursus":
                bh_date = it.get("end_at")
                blackhole = bh_date is not None
                lvl = it.get("level", 0.0)
                grade = it.get("grade")
                break # Encontrado, salimos del bucle

        # Calcular Tier según el grado
        if grade == "Cadet":
            tier = "Junior" if lvl < 5 else "Senior"
        elif grade == "Transcender":
            tier = "Transcender"
        elif grade == "Alumni":
            tier = "Alumni"
        else:
            self.stdout.write(self.style.WARNING(f"⚠️ Advertencia: Grado '{grade}' desconocido o no pertenece a 42cursus para {login}."))

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
                    'is_blackhole': blackhole,
                    'tier': tier
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
                carta.is_blackhole = blackhole
                carta.save()
                self.stdout.write(self.style.SUCCESS(f"     🔄 Cromo Actualizado: {login}"))
                
        except Exception as database_error:
            self.stdout.write(self.style.ERROR(f"❌ Error crítico al escribir en la Base de Datos: {database_error}"))