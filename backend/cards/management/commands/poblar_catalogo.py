import os
import time
import requests
from django.core.management.base import BaseCommand
from cards.models import Card

class Command(BaseCommand):
    help = 'Puebla el catálogo únicamente con mi carta personal de 42'
    def handle(self, *args, **options):
        CLIENT_ID = 'u-s4t2ud-2ca0585bb0ecbf9397bde57f369447e7bb9a9da2aa35c1aea492a9f7b1c58694'
        CLIENT_SECRET = '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'
        
        # 👤 ¡PON AQUÍ TU LOGIN DE 42! (Ejemplo: 'tomas')
        MI_LOGIN = "ksudyn"

        self.stdout.write(self.style.SUCCESS("🔑 Solicitando token de acceso..."))

        # 📡 2. PETICIÓN DEL TOKEN
        url_token = "https://api.intra.42.fr/oauth/token"
        payload_token = {
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET
        }
        
        response_token = requests.post(url_token, data=payload_token)
        response_token = requests.post(url_token, data=payload_token)
        if response_token.status_code != 200:
            self.stdout.write(self.style.ERROR(f"❌ Error Token: {response_token.text}"))
            return

        token = response_token.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        url_mi_perfil = f"https://api.intra.42.fr/v2/users/{MI_LOGIN}"

        self.stdout.write(self.style.WARNING(f"📡 Descargando los datos de {MI_LOGIN}..."))
        response_user = requests.get(url_mi_perfil, headers=headers)

        if response_user.status_code != 200:
            self.stdout.write(self.style.ERROR(f"❌ Error al buscar tu perfil: {response_user.text}"))
            return
        datos_perfil = response_user.json()
        url_foto = datos_perfil.get("image", {}).get("versions", {}).get("medium")
        puntos_eval = datos_perfil.get("correction_point", 0)
        wallets = datos_perfil.get("wallet", 0)
        
        # Sacamos tu título principal (si tienes uno seleccionado)
        titulo = "Recruit"
        title_id = 0
        for t in datos_perfil.get("titles_users", []):
            if t.get("selected", True):
                title_id = t.get("title_id")
                break
        if title_id != 0:
            for t in datos_perfil.get("titles",[]):
                if t.get("id") == title_id:
                    raw_titulo = t.get("name")
                    titulo = raw_titulo.replace("%login",MI_LOGIN)
                    break


        # Sacamos tu nivel de Cursus con el bucle
        nivel_cursus = 0.0
        for item in datos_perfil.get("cursus_users", []):
            print(item.get("cursus", {}).get("name"))
            if item.get("cursus", {}).get("name") == "42cursus":
                nivel_cursus = item.get("level")
                break
        url_mi_perfil_coali = f"https://api.intra.42.fr/v2/users/{MI_LOGIN}/coalitions"
        response_coali = requests.get(url_mi_perfil_coali,headers=headers)
        if response_coali.status_code != 200:
            self.stdout.write(self.style.ERROR(f"❌ Error al buscar tu perfil: {response_coali.text}"))
            return
        datos_coali = response_coali.json()
        coalition = datos_coali[0].get("name")
        # print(coalition)
        # import json
        # print(json.dumps(datos_coali, indent=4, ensure_ascii=False))
        
        # return
        # 🃏 5. GUARDAR O ACTUALIZAR TU CARTA EN LA BASE DE DATOS
        carta, creada = Card.objects.get_or_create(
            login=MI_LOGIN,
            defaults={
                'photo': url_foto,
                'coalition': coalition, # Esto lo automatizaremos luego si quieres
                'coalition_points': 1000,
                'title': titulo,
                'altarians': wallets,
                'cursus_lvl': nivel_cursus,
                'eval_point': puntos_eval,
                'tier': "Oro" # Te ponemos en Tier Oro por ser el desarrollador
            }
        )

        if creada:
            self.stdout.write(self.style.SUCCESS(f"🎉 ¡Éxito! Tu cromo maestro ({MI_LOGIN}) ha sido creado en el catálogo."))
        else:
            # Si ya existía, actualizamos tus datos por si has subido de nivel en la intra
            carta.photo = url_foto
            carta.altarians = wallets
            carta.cursus_lvl = nivel_cursus
            carta.eval_point = puntos_eval
            carta.title = titulo
            carta.save()
            self.stdout.write(self.style.SUCCESS(f"🔄 Tu cromo ya existía, ¡pero hemos actualizado tus stats de la intra!"))