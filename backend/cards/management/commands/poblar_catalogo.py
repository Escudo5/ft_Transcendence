import time
import requests
from django.core.management.base import BaseCommand
from cards.models import Card
import os

class Command(BaseCommand):
    help = 'Puebla el catálogo de forma masiva filtrando los 10.000 usuarios históricos'

    def handle(self, *args, **options):
        # 🔑 1. CREDENCIALES
        CLIENT_ID = os.environ.get('CLIENT_ID_PABLO')
        CLIENT_SECRET = os.environ.get('CLIENT_SECRET_PABLO')

        self.stdout.write(self.style.SUCCESS("🔑 Solicitando token de acceso..."))
        url_token = os.environ.get('URL_TOKEN')
        payload_token = {
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET
        }
        
        response_token = requests.post(url_token, data=payload_token)
        if response_token.status_code != 200:
            self.stdout.write(self.style.ERROR(f"❌ Error Token: {response_token.text}"))
            return

        token = response_token.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        # 🏴 FASE 1: MAPEO PAGINADO DE COALICIONES EN MEMORIA
        self.stdout.write(self.style.SUCCESS("\n⚡ Pre-cargando mapa de coaliciones de Madrid..."))
        mapa_coaliciones = {}
        
        # ⚠️ REEMPLAZA ESTOS RECIÉN DESCUBIERTOS IDs DE TU CAMPUS
        coaliciones_madrid = {
            401: "Zefiria",
            400: "Marventis",
            399: "Tiamant",
            398: "Ignisaria"
        }

        for coal_id, coal_name in coaliciones_madrid.items():
            page_coal = 1
            descargando_coal = True
            self.stdout.write(f"📥 Mapeando miembros de {coal_name} (ID: {coal_id})...")                        
            while descargando_coal:
                url_coal_users = f"{os.environ.get('BASE_API')}/coalitions/{coal_id}/coalitions_users?page[size]=100&page[number]={page_coal}"

                res_coal = requests.get(url_coal_users, headers=headers)
                
                if res_coal.status_code != 200:
                    self.stdout.write(self.style.ERROR(f"   ❌ Error en {coal_name} pág {page_coal}"))
                    break
                
                usuarios_coal = res_coal.json()
                if not usuarios_coal:
                    descargando_coal = False
                    break
                
                for registro in usuarios_coal:
                    user_id = registro.get("user_id")
                    if user_id:
                        # Guardamos en el mapa: { 12345: "Zefiria" }
                        mapa_coaliciones[user_id] = coal_name
                
                page_coal += 1
                time.sleep(0.5)

        self.stdout.write(self.style.SUCCESS(f"✅ Filtro de carbón activo: {len(mapa_coaliciones)} estudiantes reales indexados."))

        pagina_actual = 1
        por_pagina = 100
        continuar_descargando = True

        self.stdout.write(self.style.WARNING("\n🚀 Descargando perfiles oficiales de 42 Madrid (Filtrando piscinas)..."))

        while continuar_descargando:
            self.stdout.write(self.style.WARNING(f"📥 Solicitando página {pagina_actual} de la lista de usuarios..."))
            
            # 🎯 Endpoint oficial de cursus_users filtrando Madrid (campus 22) y el cursus principal (21)
            url_madrid = f"{os.environ.get('BASE_API')}/cursus_users?filter[cursus_id]=21&filter[campus_id]=22&page[size]={por_pagina}&page[number]={pagina_actual}&sort=id"
            response = requests.get(url_madrid, headers=headers)
            
            if response.status_code == 429:
                self.stdout.write(self.style.ERROR("🚨 Límite superado. Esperando 5 segundos..."))
                time.sleep(5)
                continue

            if response.status_code != 200:
                self.stdout.write(self.style.ERROR(f"❌ Error en página general {pagina_actual}: {response.text}"))
                break

            usuarios_pagina = response.json()

            if not usuarios_pagina:
                self.stdout.write(self.style.SUCCESS("\n🏁 ¡Catálogo masivo sincronizado! Ya no quedan más alumnos oficiales."))
                break

            for registro in usuarios_pagina:
                alumno_basico = registro.get("user", {})
                login_alumno = alumno_basico.get("login")
                id_alumno = alumno_basico.get("id")
                
                if not login_alumno or "bot" in login_alumno:
                    continue
                bl_flag = alumno_basico.get("blackholed_at")
                # 🛡️ FILTRO COALICIÓN: Si no está en Madrid, nos lo saltamos
                coalition = mapa_coaliciones.get(id_alumno)
                if not coalition:
                    continue
                if alumno_basico.get("staff?"):
                    self.stdout.write(self.style.WARNING(f"   ⏩ Saltando a {login_alumno} (Es miembro del Staff)"))
                    continue
                # -----------------------------------------------------------------
                # 📡 SUB-PETICIÓN: Vamos a por el perfil Full para sacar los títulos
                # -----------------------------------------------------------------
                self.stdout.write(f"   🕵️‍♂️ Consultando perfil extendido de: {login_alumno}...")
                url_perfil_completo = f"{os.environ.get('BASE_API')}/users/{id_alumno}"
                
                # Bucle de reintento por si la API nos frena por velocidad
                perfil_completo = {}
                while True:
                    res_perfil = requests.get(url_perfil_completo, headers=headers)
                    if res_perfil.status_code == 429:
                        self.stdout.write(self.style.ERROR("      🚨 Límite de velocidad alcanzado. Esperando 3 segundos..."))
                        time.sleep(3)
                        continue
                    if res_perfil.status_code == 200:
                        perfil_completo = res_perfil.json()
                    break
                url_foto = alumno_basico.get("image", {}).get("versions", {}).get("medium")
                puntos_eval = alumno_basico.get("correction_point", 0)
                wallets = alumno_basico.get("wallet", 0)
                
                nivel_cursus = alumno_basico.get("level", 0.0)
                grade = alumno_basico.get("grade", "")
                
                if grade == "Cadet":
                    tier = "Junior" if nivel_cursus < 5 else "Senior"
                else:
                    tier = "Transcender"

                alumni = alumno_basico.get("alumni?", False)
                black_date = alumno_basico.get("blackholed_at")
                if black_date is None:
                    blackhole = False
                else:
                    blackhole = True
                if blackhole and fecha_bh is not None and fecha_bh < "2023-06-17":
                    self.stdout.write(self.style.WARNING(f"   ⏩ Saltando a {login_alumno} (Inactivo/Blackhole desde {fecha_bh[:10]})"))
                    continue
                # 📚 Parseo inteligente de títulos (¡Ahora sí que vienen!)
                titulo = "Recruit"
                title_id = 0
                for t in perfil_completo.get("titles_users", []):
                    if t.get("selected"): 
                        title_id = t.get("title_id")
                        break
                
                if title_id and title_id != 0:
                    for t in perfil_completo.get("titles", []):
                        if t.get("id") == title_id:
                            raw_titulo = t.get("name", "Recruit")
                            titulo = raw_titulo.replace("%login", login_alumno)
                            break
                # -----------------------------------------------------------------

                # 🗂️ Extraemos el resto de datos básicos (puedes sacarlos de perfil_completo o de registro)
                # 🃏 GUARDAR O ACTUALIZAR EN DJANGO
                carta, creada = Card.objects.get_or_create(
                    login=login_alumno,
                    defaults={
                        'photo': url_foto,
                        'coalition': coalition,
                        'title': titulo,  # ¡Ahora sí se guardará con su título real!
                        'altarians': wallets,
                        'cursus_lvl': nivel_cursus,
                        'eval_point': puntos_eval,
                        'is_alumni': alumni,
                        'is_blackhole': blackhole,
                        'tier': tier
                    }
                )

                if creada:
                    self.stdout.write(self.style.SUCCESS(f"      🃏 Cromo Creado: {login_alumno} -> {coalition} | Título: {titulo}"))
                else:
                    carta.photo = url_foto
                    carta.altarians = wallets
                    carta.coalition = coalition
                    carta.cursus_lvl = nivel_cursus
                    carta.eval_point = puntos_eval
                    carta.title = titulo  # Actualizamos el título por si ha cambiado en la Intra
                    carta.tier = tier
                    carta.is_alumni = alumni
                    carta.is_blackhole = blackhole
                    carta.save()

                # ⏱️ Pausa obligatoria de seguridad entre alumno y alumno para no quemar la API
                time.sleep(0.5)

            # 🛑 MODO PRUEBA: Procesa los 100 primeros y frena para comprobar el resultado.
            # Cuando veas los títulos bonitos en tu terminal, borra este break para poblar todo el campus.
            break
            
            pagina_actual += 1
            time.sleep(0.5)