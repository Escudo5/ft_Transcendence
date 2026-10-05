import os
import time
import requests
from django.core.management.base import BaseCommand
from cards.models import Card
from cards.rarezas import rareza_de         
from cards.intra import datos_del_alumno, es_alumno_del_staff  

    # =========================================================================
    # 🛠️ FUNCIONES AUXILIARES COMPARTIDAS (Misma lógica, cero redundancia)
    # =========================================================================
def _obtener_headers_auth():  
    """Gestiona las credenciales y devuelve los cabeceros con el Token."""
    CLIENT_ID = os.environ.get('CLIENT_ID_PABLO')
    CLIENT_SECRET = os.environ.get('CLIENT_SECRET_PABLO')
    url_token = os.environ.get('URL_TOKEN')

    print("🔑 Solicitando token de acceso...")
    
    payload_token = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    
    response_token = requests.post(url_token, data=payload_token)
    if response_token.status_code != 200:
        print(f"❌ Error Token: {response_token.text}")
        return None

    token = response_token.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}

class Command(BaseCommand):
    help = 'Puebla el catálogo de forma masiva filtrando los 10.000 usuarios históricos o actualiza solo a los creadores'

    def add_arguments(self, parser):
        parser.add_argument(
            '--quick',
            action='store_true',
            help='Ejecutar solo la primera página de prueba (100 usuarios)',
        )

    def handle(self, *args, **options):
        # 🔑 1. OBTENER TOKEN DE ACCESO
        headers = _obtener_headers_auth()
        if not headers:
            return

        mapa_coaliciones = self._pre_cargar_mapa_coaliciones(headers)
        
        self.stdout.write(self.style.WARNING("\n🚀 Descargando perfiles oficiales de 42 Madrid (Filtrando piscinas)..."))
        
        pagina_actual = 1
        por_pagina = 100
        banned_logins = []
        if os.path.exists("ignore_logins.txt"):
            with open("ignore_logins.txt","r", encoding="utf-8") as archivo:
                banned_logins = archivo.read().splitlines()


        while True:
            
            # Endpoint oficial de cursus_users filtrando Madrid (campus 22) y el cursus principal (21)
            url_madrid = f"{os.environ.get('BASE_API')}/cursus_users?filter[cursus_id]=21&filter[campus_id]=22&page[size]={por_pagina}&page[number]={pagina_actual}&sort=id"
            response = requests.get(url_madrid, headers=headers)
            
            
            if response.status_code == 429:
                self.stdout.write(self.style.ERROR("🚨 Límite superado. Esperando 5 segundos..."))
                time.sleep(5)
                continue

            if response.status_code != 200:
                self.stdout.write(self.style.ERROR(f"❌ Error en página general {pagina_actual}: {response.text}"))
                break
            import json
            usuarios_pagina = response.json()


            if not usuarios_pagina:
                self.stdout.write(self.style.SUCCESS("\n🏁 ¡Catálogo masivo sincronizado! Ya no quedan más alumnos oficiales."))
                break

            for registro in usuarios_pagina:
                self._procesar_registro_usuario(registro, mapa_coaliciones, headers,banned_logins)

            if options.get('quick'):
                self.stdout.write(self.style.WARNING("\n⚡ Modo rápido activado: Finalizando tras la página 1."))
                break
            pagina_actual += 1
            time.sleep(0.5)


    def _procesar_registro_usuario(self, registro, mapa_coaliciones, headers,banned_logins):
        """Filtra, extrae y procesa un usuario proveniente del volcado masivo paginado."""
        login_alumno = registro.get("user", {}).get("login")
        id_alumno = registro.get("user", {}).get("id")
        
        if not login_alumno or "bot" in login_alumno:
            return
        if login_alumno in banned_logins:
            self.stdout.write(self.style.ERROR(f"   ⏩ Saltando a {login_alumno} (no quiere esta en la aplicacion)"))
            return

        # 🛡️ FILTRO COALICIÓN: Si no está en el mapa indexado de Madrid, nos lo saltamos
        coalition = mapa_coaliciones.get(id_alumno)
        if not coalition:
            return

        if registro.get("user",{}).get("staff?"):
            self.stdout.write(self.style.WARNING(f"   ⏩ Saltando a {login_alumno} (cuenta de servicio del staff)"))
            return
        
        d = datos_del_alumno(registro)
        fin_del_cursus = d["fin"]
        nivel_cursus = round(d["nivel"], 2)

        if fin_del_cursus:
            self.stdout.write(self.style.WARNING(
                f"   ⏩ Saltando a {login_alumno} (su cursus terminó el {fin_del_cursus[:10]})"))

            carta = Card.objects.filter(login=login_alumno).first()
            if carta:
                cuantos = carta.poseedores.count()
                carta.delete()
                self.stdout.write(self.style.ERROR(
                    f"    🗑️  Se ha eliminado la carta previa de {login_alumno} "
                    f"de la base de datos"
                    + (f" · la tenían {cuantos} personas" if cuantos else "")))
            return

        if nivel_cursus <= 0:
            self.stdout.write(self.style.WARNING(
                f"   ⏩ Saltando a {login_alumno} (nivel 0: aún no ha empezado "
                f"o es una cuenta de pruebas)"))

            carta = Card.objects.filter(login=login_alumno).first()
            if carta:
                cuantos = carta.poseedores.count()
                carta.delete()
                self.stdout.write(self.style.ERROR(
                    f"    🗑️  Se ha eliminado la carta previa de {login_alumno} "
                    f"de la base de datos"
                    + (f" · la tenían {cuantos} personas" if cuantos else "")))
            return

        url_foto = d["foto"]
        puntos_eval = d["puntos"]
        wallets = d["wallet"]
        perfil_completo = self._consultar_perfil_extendido(id_alumno, login_alumno, headers)
        if not perfil_completo:
            return

        del_staff = es_alumno_del_staff(perfil_completo)
        tier = rareza_de(d["grade"], nivel_cursus, del_staff)

        titulo = _parsear_titulo_usuario(perfil_completo, login_alumno)
        owners = {"pablalva","ksudyn","smarquez","nmagro-r","osmunoz-"}
        if login_alumno in owners:
            tier = "Creator"
        self._guardar_o_actualizar_carta(
            login=login_alumno, photo=url_foto, coalition=coalition, title=titulo,
            altarians=wallets, cursus_lvl=nivel_cursus, eval_point=puntos_eval,
            is_blackhole=False, tier=tier)
        time.sleep(0.5)



    def _pre_cargar_mapa_coaliciones(self, headers):
        """Mapea de forma paginada las coaliciones para construir el filtro en memoria."""
        self.stdout.write(self.style.SUCCESS("\n⚡ Pre-cargando mapa de coaliciones de Madrid..."))
        mapa_coaliciones = {}
        
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
                        mapa_coaliciones[user_id] = coal_name
                page_coal += 1
                time.sleep(0.5)

        self.stdout.write(self.style.SUCCESS(f"✅ Filtro de carbón activo: {len(mapa_coaliciones)} estudiantes reales indexados."))
        return mapa_coaliciones


    def _consultar_perfil_extendido(self, id_alumno, login_alumno, headers):
        """Consulta un perfil /users/:id manejando reintentos por limitación de velocidad."""
        self.stdout.write(f"   🕵️‍♂️ Consultando perfil extendido de: {login_alumno}...")
        url_perfil_completo = f"{os.environ.get('BASE_API')}/users/{id_alumno}"
        
        while True:
            res_perfil = requests.get(url_perfil_completo, headers=headers)
            if res_perfil.status_code == 429:
                self.stdout.write(self.style.ERROR("      🚨 Límite de velocidad alcanzado. Esperando 3 segundos..."))
                time.sleep(3)
                continue
            if res_perfil.status_code == 200:
                return res_perfil.json()
            return {}


    def _guardar_o_actualizar_carta(self, login, photo, coalition, title, altarians,
                                    cursus_lvl, eval_point, is_blackhole, tier):
        """Inserta o actualiza la instancia correspondiente del modelo Card."""
        carta, creada = Card.objects.get_or_create(
            login=login,
            defaults={
                'photo': photo,
                'coalition': coalition,
                'title': title,
                'altarians': altarians,
                'cursus_lvl': cursus_lvl,
                'eval_point': eval_point,
                'tier': tier,
            }
        )
        if creada:
            self.stdout.write(self.style.SUCCESS(f"      🃏 Cromo Creado: {login} -> {coalition} | Título: {title}"))
        else:
            carta.photo = photo
            carta.altarians = altarians
            carta.coalition = coalition
            carta.cursus_lvl = cursus_lvl
            carta.eval_point = eval_point
            carta.title = title
            carta.tier = tier
            carta.save()
            self.stdout.write(self.style.SUCCESS(f"      🔄 Cromo Actualizado: {login}"))

def _parsear_titulo_usuario(perfil_completo, login_alumno):
    """Extrae el título marcado como seleccionado y formatea el tag %login."""
    titulo = login_alumno
    title_id = 0
    
    for t in perfil_completo.get("titles_users", []):
        if t.get("selected"): 
            title_id = t.get("title_id")
            break
    if title_id and title_id != 0:
        for t in perfil_completo.get("titles", []):
            if t.get("id") == title_id:
                titulo = t.get("name", login_alumno).replace("%login", login_alumno)
                break

    return titulo
