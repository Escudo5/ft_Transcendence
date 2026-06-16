import requests
from django.http import JsonResponse
from django.utils import timezone
from .models import CustomUser

# 🔑 Las llaves reales copiadas directamente de tu captura de la Intra
CLIENT_ID = 'u-s4t2ud-85745739c040c37d065eeef72dafbd19dea1e46b50172daac4f20c1907d34b47'
CLIENT_SECRET = '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'

# 🌐 La URL exacta que tenéis guardada en la casilla "Redirect URI" de la captura
REDIRECT_URI = 'http://localhost:3000'

def login_42_callback(request):
    """
    Punto de encuentro: Aquí redirige 42 al alumno tras loguearse en la escuela.
    Nos trae un regalo en la URL: el '?code=XXXX'
    """
    # PASO 1: Capturamos el código temporal que nos da 42
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': 'No se recibió el código de autorización de 42.'}, status=400)

    try:
        # PASO 2: Intercambiamos el código por la pulsera VIP (Access Token)
        url_token = "https://api.intra.42.fr/oauth/token"
        credenciales = {
            "grant_type": "authorization_code", # 👈 ¡OJO! Ahora es authorization_code, no client_credentials
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "redirect_uri": REDIRECT_URI
        }
        
        respuesta_token = requests.post(url_token, data=credenciales).json()
        token_de_acceso = respuesta_token.get("access_token")
        
        if not token_de_acceso:
            return JsonResponse({"error": "No se pudo obtener el token de acceso", "detalles": respuesta_token}, status=400)

        # PASO 3: Con el token, pedimos los datos del alumno real que está iniciando sesión
        url_perfil = "https://api.intra.42.fr/v2/me" # 👈 /v2/me nos da el perfil de quien está logueándose ahora mismo
        cabeceras = {"Authorization": f"Bearer {token_de_acceso}"}
        datos_perfil = requests.get(url_perfil, headers=cabeceras).json()

        # Extraemos los datos exactos que vuestro modelo necesita (tal y como hacías en tu prueba)
        id_42 = datos_perfil.get("id")
        username = datos_perfil.get("login")
        first_name = datos_perfil.get("first_name")
        last_name = datos_perfil.get("last_name")
        email = datos_perfil.get("email")
        is_staff = datos_perfil.get("staff?", False)
        is_active = datos_perfil.get("active?", True)
        is_alumni = datos_perfil.get("alumni?", False)
        
        # Cogemos la imagen mediana del CDN de 42
        profile_image = datos_perfil.get("image", {}).get("versions", {}).get("medium")

        # PASO 4: 🔥 EL CONTROL DE SOBRES DIARIOS GRATIS 🔥
        hoy = timezone.now().date() # Guardamos la fecha de hoy sin horas

        # Buscamos si este alumno ya existe en la base de datos por su id_42.
        # Si no existe, lo crea automáticamente usando los datos de 'defaults'
        usuario, creado = CustomUser.objects.get_or_create(
            id_42=id_42,
            defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'is_staff': is_staff,
                'is_active': is_active,
                'is_alumni': is_alumni,
                'profile_image': profile_image,
                'elo': 1000,               # ELO base para el juego de cartas
                'estado': 'online',        # Se acaba de conectar, pasa a Online
                'last_login_date': hoy,     # Su primer login con sobres es hoy
                'daily_packs_claimed': 0    # Empieza con 0 sobres reclamados
            }
        )

        if creado:
            # Escenario A: Usuario nuevo registrado con éxito.
            return JsonResponse({
                'status': 'nuevo_usuario',
                'username': usuario.username,
                'mensaje': f'¡Bienvenido por primera vez al Álbum, {usuario.username}!',
                'sobres_disponibles_hoy': 2
            })
        else:
            # Escenario B: El usuario ya existía de antes.
            # Actualizamos su estado a 'online' ya que se acaba de conectar
            usuario.estado = 'online'
            
            # 🔄 Comprobamos si ha cambiado el día desde su última conexión
            if usuario.last_login_date < hoy:
                # Es un nuevo día: actualizamos la fecha y reiniciamos el contador de sobres a 0
                usuario.last_login_date = hoy
                usuario.daily_packs_claimed = 0
            
            usuario.save() # Guardamos los cambios en PostgreSQL en Docker

            # Calculamos cuántos de sus 2 sobres diarios le quedan por abrir
            sobres_restantes = max(0, 2 - usuario.daily_packs_claimed)

            return JsonResponse({
                'status': 'usuario_existente',
                'username': usuario.username,
                'mensaje': f'¡Bienvenido de nuevo, {usuario.username}!',
                'sobres_disponibles_hoy': sobres_restantes
            })

    except Exception as e:
        return JsonResponse({'error': f'Fallo crítico en el login: {str(e)}'}, status=500)