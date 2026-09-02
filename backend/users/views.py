import json
import re
import requests
import os
from django.http import JsonResponse
from django.utils import timezone
from django.shortcuts import redirect
from django.contrib.auth import login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from .models import CustomUser

# 🔑 Credenciales de la aplicación registrada en la Intra (vienen del .env)
CLIENT_ID = os.environ.get('CLIENT_ID_NACHO')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET_NACHO')
# 🌐 La URL exacta que tenéis guardada en la casilla "Redirect URI" de la Intra
REDIRECT_URI = os.environ.get('FORTYTWO_REDIRECT_URI')

SOBRES_DIARIOS = 2  # Sobres gratis que regala el álbum cada día por loguearse


def login_42_callback(request):
    """
    Punto de encuentro: aquí redirige 42 al alumno tras loguearse en la escuela.
    Nos trae un regalo en la URL: el '?code=XXXX'.
    La primera vez REGISTRA al alumno; las siguientes REFRESCA sus datos.
    En ambos casos deja abierta una sesión (cookie) para que el backend
    le recuerde en el resto de peticiones.
    """
    # PASO 1: Capturamos el código temporal que nos da 42
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': 'No se recibió el código de autorización de 42.'}, status=400)

    try:
        # PASO 2: Intercambiamos el código por la pulsera VIP (Access Token)
        url_token = os.environ.get('URL_TOKEN')
        credenciales = {
            "grant_type": "authorization_code",  # 👈 ¡OJO! authorization_code, no client_credentials
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "redirect_uri": REDIRECT_URI
        }

        respuesta_token = requests.post(url_token, data=credenciales, timeout=15)
        respuesta_token_json = respuesta_token.json()
        token_de_acceso = respuesta_token_json.get("access_token")

        if not token_de_acceso:
            return JsonResponse({
                "error": "No se pudo obtener el token de acceso",
                "detalles": respuesta_token_json,
                "redirect_uri_usado": REDIRECT_URI,
            }, status=400)

        # PASO 3: Con el token, pedimos los datos del alumno que está iniciando sesión
        url_perfil = os.environ.get('URL_PERFIL')  # 👈 /v2/me nos da el perfil de quien se está logueando ahora mismo
        cabeceras = {"Authorization": f"Bearer {token_de_acceso}"}
        datos_perfil = requests.get(url_perfil, headers=cabeceras).json()

        id_42 = datos_perfil.get("id")
        username = datos_perfil.get("login")
        if not id_42 or not username:
            return JsonResponse({"error": "La Intra no devolvió un perfil válido", "detalles": datos_perfil}, status=400)

        hoy = timezone.now().date()  # Fecha de hoy sin horas, para el control de sobres

        # PASO 4: Buscamos al alumno por su id_42 (su "DNI" en la Intra, nunca cambia)
        usuario = CustomUser.objects.filter(id_42=id_42).first()
        creado = usuario is None

        if creado:
            # Caso borde: si ese username ya lo ocupa OTRA cuenta (datos viejos de
            # pruebas), le añadimos el id_42 al nombre para no chocar con el unique
            if CustomUser.objects.filter(username=username).exists():
                username = f"{username}_{id_42}"

            usuario = CustomUser(
                id_42=id_42,
                username=username,
                elo=1000,               # ELO base para el juego de cartas
                last_login_date=hoy,    # Su primer login con sobres es hoy
            )
            # Las cuentas que entran por 42 no tienen contraseña propia: así Django
            # la marca como "inutilizable" y nadie puede colarse por ese hueco
            usuario.set_unusable_password()

        # PASO 5: Datos que refrescamos SIEMPRE (en el registro y en cada login),
        # para que la foto, el email o el nombre sigan el ritmo de la Intra
        usuario.first_name = datos_perfil.get("first_name") or ""
        usuario.last_name = datos_perfil.get("last_name") or ""
        # None y no "": si 42 no devolviera correo, dos cuentas con "" chocarian
        # contra la restriccion de email unico. Varios None si conviven.
        usuario.email = (datos_perfil.get("email") or "").strip().lower() or None
        usuario.is_alumni = datos_perfil.get("alumni?", False)
        usuario.profile_image = datos_perfil.get("image", {}).get("versions", {}).get("medium")
        usuario.estado = 'online'  # Se acaba de conectar

        # PASO 6: 🔄 Guardamos el día de esta conexión. El contador de sobres
        # diarios reclamados ahora se lleva en la tabla UserPack (tarea de Pablo)
        if not creado and usuario.last_login_date < hoy:
            usuario.last_login_date = hoy

        usuario.save()  # Guardamos todo en PostgreSQL

        # PASO 7: 🔐 LA SESIÓN. Django deja una cookie en el navegador del alumno;
        # desde ahora request.user será este usuario en todas sus peticiones
        login(request, usuario, backend='django.contrib.auth.backends.ModelBackend')

        sobres_restantes = SOBRES_DIARIOS
        mensaje = f'¡Bienvenido por primera vez, {usuario.username}!' if creado else f'¡Bienvenido de nuevo, {usuario.username}!'

        # ✔️ Devolvemos JSON porque React lo consume con fetch().json()
        return JsonResponse({
            'status': 'nuevo_usuario' if creado else 'usuario_existente',
            'username': usuario.username,
            'profile_image': usuario.profile_image,
            'mensaje': mensaje,
            'sobres_disponibles_hoy': sobres_restantes
        })
    except Exception as e:
        return JsonResponse({'error': f'Fallo crítico en el login: {str(e)}'}, status=500)


@require_GET
def csrf_token_view(request):
    """Devuelve un token CSRF válido para que el frontend pueda enviar POSTs seguros."""
    return JsonResponse({'csrfToken': get_token(request)})


def me(request):
    """
    ¿Quién soy? Devuelve el perfil del alumno con la sesión abierta.
    El frontend puede llamarlo al cargar cualquier página para saber si hay
    alguien logueado (y si no lo hay, mandarle a la Intra a por el código).
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'No hay sesión iniciada.'}, status=401)

    u = request.user
    return JsonResponse({
        'id': u.id,
        'id_42': u.id_42,
        'username': u.username,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'email': u.email,
        'profile_image': u.profile_image,
        'elo': u.elo,
        'estado': u.estado,
        'is_alumni': u.is_alumni,
        'sobres_disponibles_hoy': SOBRES_DIARIOS,
        # 🎁 ¿Le toca regalo hoy? Solo INFORMA, no entrega nada: para recogerlo
        # hay que llamar a /api/cards/sobres/reclamar/. Así, recargar la página
        # nunca regala sobres por accidente.
        'regalo_disponible': u.ultimo_regalo_diario is None or u.ultimo_regalo_diario < timezone.localdate(),
    })


# =====================================================================
# 👤 PERFILES
# =====================================================================

def _estadisticas_coleccion(usuario):
    """
    Cuántas cartas tiene ese usuario, de cuántas hay, y cuál es la más rara.
    Se importa aquí dentro y no arriba para no crear una dependencia circular
    entre las apps de usuarios y de cartas.
    """
    from cards.models import Card, UserCard

    ORDEN_TIERS = ['Blackhole', 'Junior', 'Senior', 'Alumni', 'Transcender']

    mis_cartas = UserCard.objects.filter(user=usuario).select_related('card')
    distintas = mis_cartas.count()
    total_catalogo = Card.objects.count()
    con_repetidas = sum(c.cantidad for c in mis_cartas)

    mejor = None
    for uc in mis_cartas:
        tier = uc.card.tier
        if tier not in ORDEN_TIERS:
            continue
        if mejor is None or ORDEN_TIERS.index(tier) > ORDEN_TIERS.index(mejor['tier']):
            mejor = {'login': uc.card.login, 'tier': tier, 'photo': uc.card.photo}

    return {
        'cartas_distintas': distintas,
        'cartas_en_catalogo': total_catalogo,
        'cartas_con_repetidas': con_repetidas,
        # Porcentaje del álbum completado, redondeado a un decimal
        'porcentaje': round(distintas / total_catalogo * 100, 1) if total_catalogo else 0,
        'carta_mas_rara': mejor,
    }


def _perfil_publico(usuario):
    """Los datos de un usuario que puede ver cualquiera. Sin email ni id_42."""
    return {
        'username': usuario.username,
        # El nombre que él haya elegido; si no puso ninguno, el de la Intra
        'nombre': usuario.nombre_mostrado or usuario.get_full_name() or usuario.username,
        'bio': usuario.bio,
        'profile_image': usuario.profile_image,
        'elo': usuario.elo,
        'estado': usuario.estado,
        'is_alumni': usuario.is_alumni,
        'miembro_desde': usuario.date_joined.date().isoformat(),
        'coleccion': _estadisticas_coleccion(usuario),
    }


@require_GET
def perfil_usuario(request, username):
    """
    Perfil público de cualquier usuario, para poder verlo desde el chat, la
    lista de amigos o el buscador. Solo datos públicos: ni el email ni el id
    de la Intra salen de aquí.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Tienes que iniciar sesión.'}, status=401)

    usuario = CustomUser.objects.filter(username=username).first()
    if usuario is None:
        return JsonResponse({'error': f'No existe ningún usuario llamado {username}.'}, status=404)

    datos = _perfil_publico(usuario)
    datos['es_mi_perfil'] = usuario.pk == request.user.pk
    return JsonResponse(datos)


@require_http_methods(['PATCH'])
def editar_mi_perfil(request):
    """
    Edita los datos propios del perfil. Solo se pueden tocar la biografía y el
    nombre a mostrar: el resto (nombre real, email, foto) lo refresca la Intra
    en cada login y se sobrescribiría.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Tienes que iniciar sesión.'}, status=401)

    datos = _leer_json(request)
    usuario = request.user
    errores = {}

    if 'bio' in datos:
        bio = (datos.get('bio') or '').strip()
        if len(bio) > 500:
            errores['bio'] = 'La biografía no puede pasar de 500 caracteres.'
        else:
            usuario.bio = bio

    if 'nombre_mostrado' in datos:
        nombre = (datos.get('nombre_mostrado') or '').strip()
        if len(nombre) > 50:
            errores['nombre_mostrado'] = 'El nombre no puede pasar de 50 caracteres.'
        else:
            usuario.nombre_mostrado = nombre

    if errores:
        return JsonResponse({'error': 'Revisa los datos.', 'campos': errores}, status=400)

    usuario.save(update_fields=['bio', 'nombre_mostrado'])
    return JsonResponse({'mensaje': 'Perfil actualizado.', **_perfil_publico(usuario)})


# =====================================================================
# 🔒 DERECHOS SOBRE TUS DATOS (RGPD)
# Cualquiera puede llevarse sus datos o borrar su cuenta cuando quiera.
# Va de la mano de la Política de Privacidad: ahí prometemos esto, aquí se
# cumple.
#
# ⚠️ OJO CON EL MÓDULO DEL SUBJECT: el de "GDPR compliance" pide CUATRO cosas
# y aquí solo hay tres:
#   ✔ que el usuario pueda pedir sus datos      -> descargar_mis_datos
#   ✔ borrado con confirmación                  -> borrar_mi_cuenta
#   ✔ exportarlos en formato legible            -> el JSON descargable
#   ✘ CORREOS DE CONFIRMACIÓN de las operaciones -> NO IMPLEMENTADO
# Mientras falte lo último, el módulo NO se puede reclamar (el subject solo
# permite "al menos 3 de" en Gamification; en este los lista todos).
# Para cerrarlo haría falta configurar el envío de correo (servidor SMTP y sus
# credenciales en el .env) y avisar al descargar datos y al borrar la cuenta.
# =====================================================================

@require_GET
def descargar_mis_datos(request):
    """
    Devuelve TODO lo que guardamos de esta persona, en un fichero JSON que se
    descarga. Formato legible y completo, como exige el RGPD.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Tienes que iniciar sesión.'}, status=401)

    from cards.models import UserCard, UserPack

    u = request.user
    datos = {
        'exportado_el': timezone.now().isoformat(),
        'cuenta': {
            'username': u.username,
            'email': u.email,
            'nombre': u.first_name,
            'apellidos': u.last_name,
            'nombre_mostrado': u.nombre_mostrado,
            'biografia': u.bio,
            'foto': u.profile_image,
            'id_42': u.id_42,
            'es_alumni': u.is_alumni,
            'puntuacion_elo': u.elo,
            'estado': u.estado,
            'alta': u.date_joined.isoformat(),
            'ultimo_acceso': u.last_login.isoformat() if u.last_login else None,
            'ultimo_regalo_diario': u.ultimo_regalo_diario.isoformat() if u.ultimo_regalo_diario else None,
            # La contraseña NO se incluye: está cifrada de forma irreversible y
            # ni nosotros podemos leerla.
        },
        'album': [
            {
                'carta': uc.card.login,
                'rareza': uc.card.tier,
                'copias': uc.cantidad,
                'obtenida_el': uc.fecha_obtencion.isoformat(),
            }
            for uc in UserCard.objects.filter(user=u).select_related('card')
        ],
        'sobres': [
            {'tipo': p.tipo_sobre, 'cantidad': p.cantidad}
            for p in UserPack.objects.filter(user=u)
        ],
    }

    respuesta = JsonResponse(datos, json_dumps_params={'indent': 2, 'ensure_ascii': False})
    respuesta['Content-Disposition'] = f'attachment; filename="mis-datos-{u.username}.json"'
    return respuesta


@require_POST
def borrar_mi_cuenta(request):
    """
    Borra la cuenta y todo lo asociado (álbum y sobres se van en cascada).
    Pide confirmación explícita en el cuerpo para que un clic accidental o una
    petición suelta no borre la cuenta de nadie.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Tienes que iniciar sesión.'}, status=401)

    datos = _leer_json(request)
    if datos.get('confirmacion') != 'BORRAR MI CUENTA':
        return JsonResponse({
            'error': 'Falta la confirmación.',
            'detalle': 'Para borrar la cuenta hay que enviar la confirmación exacta.',
        }, status=400)

    usuario = request.user
    nombre = usuario.username
    logout(request)   # cerramos la sesión antes de borrar
    usuario.delete()  # el álbum y los sobres se borran en cascada

    return JsonResponse({'mensaje': f'La cuenta de {nombre} y todos sus datos se han borrado.'})


@require_GET
def list_users(request):
    """Devuelve usuarios de la base de datos para pintarlos en el front."""
    users = CustomUser.objects.all().order_by('username')
    logins = request.GET.get('logins')

    if logins:
        username_list = [username.strip() for username in logins.split(',') if username.strip()]
        users = users.filter(username__in=username_list)

    return JsonResponse({
        'users': [
            {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_image': user.profile_image,
                'elo': user.elo,
                'estado': user.estado,
                'is_alumni': user.is_alumni,
            }
            for user in users
        ]
    })


# =====================================================================
# 🔐 LA OTRA PUERTA: registro e inicio de sesion con email y contraseña
# Es independiente del login de 42: son dos caminos distintos para entrar.
# =====================================================================

def _leer_json(request):
    """Lee el cuerpo de la peticion como JSON. Devuelve {} si viene vacio o mal."""
    try:
        return json.loads(request.body or '{}')
    except (ValueError, TypeError):
        return {}


def _generar_username(nombre, email):
    """
    Django exige un nombre de usuario unico. Lo fabricamos a partir del nombre
    que ha elegido la persona (o del correo), quitando lo que Django no admite,
    y le añadimos un numero si ya estuviera cogido.
    """
    base = (nombre or email.split('@')[0]).strip()
    base = re.sub(r'[^\w.@+-]', '_', base)[:140] or 'usuario'
    username = base
    contador = 1
    while CustomUser.objects.filter(username=username).exists():
        username = f'{base}_{contador}'
        contador += 1
    return username


@require_POST
def register(request):
    """
    Crea una cuenta nueva con email y contraseña.
    La contraseña NUNCA se guarda tal cual: Django la trocea de forma
    irreversible y con un grano de sal distinto para cada usuario.
    """
    datos = _leer_json(request)
    email = (datos.get('email') or '').strip().lower()  # en minusculas para que
    password = datos.get('password') or ''              # Nacho@x.com y nacho@x.com
    nombre = (datos.get('nombre') or '').strip()        # no sean cuentas distintas

    errores = {}

    # 1. Que no falte nada
    if not email:
        errores['email'] = 'Escribe tu correo electrónico.'
    if not password:
        errores['password'] = 'Escribe una contraseña.'

    # 2. Que el correo tenga pinta de correo
    if email:
        try:
            validate_email(email)
        except ValidationError:
            errores['email'] = 'Ese correo no parece válido.'

    # 3. Que el correo no lo tenga ya otra cuenta
    if email and 'email' not in errores and CustomUser.objects.filter(email=email).exists():
        errores['email'] = 'Ya existe una cuenta con ese correo.'

    # 4. Que la contraseña sea decente (usa las reglas de settings.py:
    #    minimo de caracteres, que no sea de las mas comunes, que no sea solo numeros)
    if password:
        try:
            validate_password(password)
        except ValidationError as e:
            errores['password'] = ' '.join(e.messages)

    if errores:
        return JsonResponse({'error': 'Revisa los datos.', 'campos': errores}, status=400)

    # 5. Creamos la cuenta
    usuario = CustomUser(
        username=_generar_username(nombre, email),
        email=email,
        first_name=nombre[:150],
        elo=1000,
        last_login_date=timezone.now().date(),
        estado='online',
    )
    usuario.set_password(password)  # 👈 aqui es donde se cifra
    usuario.save()

    # 6. Le abrimos la sesion directamente, para que no tenga que loguearse
    #    otra vez justo despues de registrarse
    login(request, usuario, backend='django.contrib.auth.backends.ModelBackend')

    return JsonResponse({
        'status': 'nuevo_usuario',
        'username': usuario.username,
        'email': usuario.email,
        'mensaje': f'¡Bienvenido al Álbum, {usuario.first_name or usuario.username}!',
        'sobres_disponibles_hoy': SOBRES_DIARIOS,
    }, status=201)


@require_POST
def login_email(request):
    """Inicia sesion con email y contraseña."""
    datos = _leer_json(request)
    email = (datos.get('email') or '').strip().lower()
    password = datos.get('password') or ''

    if not email or not password:
        return JsonResponse({'error': 'Escribe tu correo y tu contraseña.'}, status=400)

    usuario = CustomUser.objects.filter(email=email).first()

    # 🛡️ A proposito NO decimos si lo que falla es el correo o la contraseña:
    # eso le diria a un atacante que correos existen en la base de datos.
    # Nota: las cuentas de 42 no tienen contraseña utilizable, asi que
    # check_password devuelve False para ellas y no se puede entrar por aqui.
    if usuario is None or not usuario.check_password(password):
        return JsonResponse({'error': 'Correo o contraseña incorrectos.'}, status=401)

    if not usuario.is_active:
        return JsonResponse({'error': 'Esta cuenta está desactivada.'}, status=403)

    hoy = timezone.now().date()
    usuario.estado = 'online'
    if usuario.last_login_date < hoy:
        usuario.last_login_date = hoy
    usuario.save()

    login(request, usuario, backend='django.contrib.auth.backends.ModelBackend')

    return JsonResponse({
        'status': 'usuario_existente',
        'username': usuario.username,
        'email': usuario.email,
        'mensaje': f'¡Bienvenido de nuevo, {usuario.first_name or usuario.username}!',
        'sobres_disponibles_hoy': SOBRES_DIARIOS,
    })


@csrf_exempt
def logout_view(request):
    """Cierra la sesión (borra la cookie) y deja al alumno como 'offline'."""
    if request.user.is_authenticated:
        CustomUser.objects.filter(pk=request.user.pk).update(estado='offline')
    logout(request)
    return JsonResponse({'status': 'ok', 'mensaje': 'Sesión cerrada. ¡Hasta mañana!'})
