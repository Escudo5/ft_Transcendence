import os
import time
import requests
from django.core.management.base import BaseCommand
from cards.models import Card
from cards.rarezas import rareza_por_nivel   # 🎴 Nacho, 10/09

    # =========================================================================
    # 🛠️ FUNCIONES AUXILIARES COMPARTIDAS (Misma lógica, cero redundancia)
    # =========================================================================
def _obtener_headers_auth():  # 1. Quitamos 'self'
    """Gestiona las credenciales y devuelve los cabeceros con el Token."""
    CLIENT_ID = os.environ.get('CLIENT_ID_PABLO')
    CLIENT_SECRET = os.environ.get('CLIENT_SECRET_PABLO')
    url_token = os.environ.get('URL_TOKEN')

    # 2. Cambiamos self.stdout por print normal
    print("🔑 Solicitando token de acceso...")
    
    payload_token = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    
    response_token = requests.post(url_token, data=payload_token)
    if response_token.status_code != 200:
        # 3. Cambiamos self.stdout por print normal
        print(f"❌ Error Token: {response_token.text}")
        return None

    token = response_token.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}

class Command(BaseCommand):
    help = 'Puebla el catálogo de forma masiva filtrando los 10.000 usuarios históricos o actualiza solo a los creadores'

    def add_arguments(self, parser):
        # Flag para ejecutar exclusivamente el flujo de creadores
        parser.add_argument(
            '--creators',
            action='store_true',
            help='Sincroniza única y exclusivamente a los 5 creadores usando el endpoint directo de usuarios',
        )

    def handle(self, *args, **options):
        # 🔑 1. OBTENER TOKEN DE ACCESO
        headers = _obtener_headers_auth()
        if not headers:
            return

        # 🌟 CASO A: VÍA EXCLUSIVA PARA LOS 5 CREADORES (JSON Directo)
        if options['creators']:
            self._sincronizar_creadores_directo(headers)
            return

        # 🏴 CASO B: FASE MASIVA HISTÓRICA POR PÁGINAS (JSON Anidado)
        mapa_coaliciones = self._pre_cargar_mapa_coaliciones(headers)
        
        self.stdout.write(self.style.WARNING("\n🚀 Descargando perfiles oficiales de 42 Madrid (Filtrando piscinas)..."))
        
        pagina_actual = 1
        por_pagina = 100

        while True:
            #self.stdout.write(self.style.WARNING(f"📥 Solicitando página {pagina_actual} de la lista de usuarios..."))
            
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
                self._procesar_registro_usuario(registro, mapa_coaliciones, headers)

            # 🛑 MODO PRUEBA: Procesa los 100 primeros de la página 1 y frena.
            # Quita este break cuando quieras lanzar la sincronización de todo el campus.
            break
            pagina_actual += 1
            time.sleep(0.5)


    # =========================================================================
    # 🚀 FLUJO 1: SINCRONIZACIÓN EXCLUSIVA DE CREADORES (JSON NATIVO /users/:login)
    # =========================================================================
    def _sincronizar_creadores_directo(self, headers):
        """Sincroniza los creadores extrayendo los datos directamente de la raíz de /users/:login"""
        self.stdout.write(self.style.SUCCESS("\n🛠️ Modo Creadores Activo: Procesando perfiles específicos..."))
        
        # ⚠️ Pon aquí vuestros 5 logins exactos de la Intra
        logins_creadores = ["pablalva", "smarquez", "nmagro-r", "ksudyn", "osmunoz-"]

        for login in logins_creadores:
            self.stdout.write(f"🔍 Solicitando perfil directo de: {login}...")
            url_user = f"{os.environ.get('BASE_API')}/users/{login}"
            res_user = requests.get(url_user, headers=headers)
            
            if res_user.status_code != 200:
                self.stdout.write(self.style.ERROR(f"❌ No se pudo obtener el perfil de {login}"))
                continue
                
            perfil = res_user.json()
            user_id = perfil.get("id")
            import json
            print(json.dumps(perfil, indent=4, ensure_ascii=False))

            if perfil.get("staff?"):
                self.stdout.write(self.style.WARNING(f"   ⏩ Saltando a {login} (Es miembro del Staff)"))
                continue

            # Consultar su coalición real de forma individual
            coalition = "Zefiria"
            url_user_coal = f"{os.environ.get('BASE_API')}/users/{user_id}/coalitions"
            res_coal = requests.get(url_user_coal, headers=headers)
            if res_coal.status_code == 200 and res_coal.json():
                coalition = res_coal.json()[0].get("name", "Zefiria")

            # Parseo de datos del Cursus 21 (Nivel, BH, Alumni)
            nivel_cursus, blackhole, fecha_bh = self._parsear_datos_cursus(perfil)

            # Filtro Blackhole histórico
            if blackhole and fecha_bh and fecha_bh < "2023-06-17":
                self.stdout.write(self.style.WARNING(f"   ⏩ Saltando a {login} (Inactivo/Blackhole anterior a la fecha límite)"))
                continue

            # 🎴 CAMBIO (Nacho, 10/09): la rareza sale del NIVEL, no del grade.
            # El porqué, con los datos reales de la Intra, está en
            # cards/rarezas.py. Resumen: Alumni no es mejor que Transcender,
            # es alguien que se quedó parado al final del tronco común.
            #
            # Aquí NO se filtra a nadie: estos cinco somos los del equipo y
            # nuestras cartas tienen que existir siempre, pase lo que pase con
            # nuestro cursus. Sin ellas la portada da errores 404.
            tier = rareza_por_nivel(nivel_cursus)

            # Parseo de Título (Reutilizado)
            titulo,tier = _parsear_titulo_usuario(perfil, login,tier)

            # Extracción de datos básicos (Campos raíz del JSON directo)
            url_foto = perfil.get("image", {}).get("versions", {}).get("small")
            puntos_eval = perfil.get("correction_point", 0)
            wallets = perfil.get("wallet", 0)

            # Guardado en base de datos (Reutilizado)
            self._(
                login=login, photo=url_foto, coalition=coalition, title=titulo,
                altarians=wallets, cursus_lvl=nivel_cursus, eval_point=puntos_eval,
                is_blackhole=blackhole, tier=tier
            )
            time.sleep(0.5)

        self.stdout.write(self.style.SUCCESS("\n🏁 ¡Los 5 creadores han sido sincronizados con éxito!"))


    # =========================================================================
    # 🏴 FLUJO 2: PROCESAMIENTO GENERAL POR PÁGINAS (JSON ANIDADO /cursus_users)
    # =========================================================================

    # TODO:el grado se debe sacar del bloque general(registro) no des alumno(basico) comprobar con el script de pruebas

    def _procesar_registro_usuario(self, registro, mapa_coaliciones, headers):
        """Filtra, extrae y procesa un usuario proveniente del volcado masivo paginado."""
        login_alumno = registro.get("user", {}).get("login")
        id_alumno = registro.get("user", {}).get("id")
        
        if not login_alumno or "bot" in login_alumno:
            return

        # 🛡️ FILTRO COALICIÓN: Si no está en el mapa indexado de Madrid, nos lo saltamos
        coalition = mapa_coaliciones.get(id_alumno)
        if not coalition:
            return

        if registro.get("user",{}).get("staff?"):
            self.stdout.write(self.style.WARNING(f"   ⏩ Saltando a {login_alumno} (Es miembro del Staff)"))
            return
        
        # 🎴 CAMBIO (Nacho, 10/09). Dos cosas, y las dos con datos reales de la
        # Intra detrás (el detalle está en cards/rarezas.py):
        #
        #   1. El FILTRO. Antes solo se saltaba a quien había caído ANTES de
        #      junio de 2023, así que quien cayó en 2024 o 2025 entraba igual.
        #      Ahora se salta a cualquiera cuyo cursus se haya acabado.
        #
        #      Se mira `end_at` y no `blackholed_at`: blackholed_at es la fecha
        #      límite que tiene TODO alumno vivo del tronco común, así que no
        #      dice nada sobre si sigue o no. end_at solo se rellena cuando el
        #      cursus se acabó de verdad.
        #
        #   2. La RAREZA sale del nivel, no del grade.
        fin_del_cursus = registro.get("end_at")
        nivel_cursus = round(registro.get("level", 0.0), 2)

        if fin_del_cursus:
            self.stdout.write(self.style.WARNING(
                f"   ⏩ Saltando a {login_alumno} (su cursus terminó el {fin_del_cursus[:10]})"))
            return

        tier = rareza_por_nivel(nivel_cursus)

        url_foto = registro.get("user",{}).get("image",{}).get("versions",{}).get("medium")
        puntos_eval = registro.get("user",{}).get("correction_point")
        wallets = registro.get("user",{}).get("wallet")
        import json
        perfil_completo = self._consultar_perfil_extendido(id_alumno, login_alumno, headers)
        ##print(json.dumps(perfil_completo, indent=4, ensure_ascii=False))
        if not perfil_completo:
            return

        titulo,tier = _parsear_titulo_usuario(perfil_completo, login_alumno,tier)
        print(tier)
        self._guardar_o_actualizar_carta(
            login=login_alumno, photo=url_foto, coalition=coalition, title=titulo,
            altarians=wallets, cursus_lvl=nivel_cursus, eval_point=puntos_eval,
            # Siempre False: aquí solo se llega si el cursus NO ha terminado.
            # (El parámetro no se guarda en ninguna parte: el modelo Card no
            #  tiene ese campo. Se deja para no cambiarle la firma a Pablo.)
            is_blackhole=False, tier=tier
        )
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


    def _guardar_o_actualizar_carta(self, login, photo, coalition, title, altarians, cursus_lvl, eval_point, is_blackhole, tier):
        """Inserta o actualiza la instancia correspondiente del modelo Card."""
        print(tier)
        carta, creada = Card.objects.get_or_create(
            login=login,
            defaults={
                'photo': photo,
                'coalition': coalition,
                'title': title,
                'altarians': altarians,
                'cursus_lvl': cursus_lvl,
                'eval_point': eval_point,
                'tier': tier
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

def _parsear_titulo_usuario(perfil_completo, login_alumno, tier):
    """Extrae el título marcado como seleccionado y formatea el tag %login."""
    titulo = login_alumno
    title_id = 0
    
    for t in perfil_completo.get("titles_users", []):
        if t.get("selected"): 
            title_id = t.get("title_id")
            break

    for t in perfil_completo.get("achievements", []):
        if t.get("id") == 65:
            tier = "staff"
            break
    
    if title_id and title_id != 0:
        for t in perfil_completo.get("titles", []):
            if t.get("id") == title_id:
                titulo = t.get("name", login_alumno).replace("%login", login_alumno)
                break

    return titulo, tier
