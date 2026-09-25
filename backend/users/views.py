import io
import json
import re
import requests
import os
import uuid
from django.conf import settings
from django.core.files.base import ContentFile
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
from django.http import JsonResponse
from django.db import transaction
from .models import CustomUser
from cards.models import Card
from django.core.mail import send_mail
from django.core.mail import EmailMessage
# 🔑 Credenciales de la aplicación registrada en la Intra (vienen del .env)
CLIENT_ID = os.environ.get('CLIENT_ID_NACHO')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET_NACHO')
# 🌐 La URL exacta que tenéis guardada en la casilla "Redirect URI" de la Intra
REDIRECT_URI = os.environ.get('FORTYTWO_REDIRECT_URI')

# Solo para INFORMAR al front de cuántos toca hoy. Quien los entrega de
# verdad es cards/views.py (SOBRES_REGALO_DIARIO), y los dos números tienen
# que coincidir: si no, la web promete una cosa y el servidor da otra.
SOBRES_DIARIOS = 3


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

        # PASO 6: 🗑️ Aquí se guardaba `last_login_date` (Nacho, 18/09).
        # Solo se escribía: ninguna decisión del proyecto dependía de su
        # valor, y Django ya trae `last_login`, que rellena él solo al hacer
        # login() tres líneas más abajo. De hecho la exportación del RGPD ya
        # usaba el de Django, no el nuestro. El regalo diario se lleva en
        # `ultimo_regalo_diario`, que sí decide.

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
            # .foto y no .profile_image: si tiene avatar propio, ese manda.
            # Aunque acabe de entrar por 42, su foto subida no se toca.
            'profile_image': usuario.foto,
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

    # 🟢 La señal de vida ya NO se anota aquí (Nacho, 18/09).
    #
    # Estaba solo en esta vista, y el front la llama al abrir la página y
    # poco más. Mientras tanto el chat pregunta cada 3 segundos sin marcar
    # nada, así que a los 5 minutos aparecías desconectado escribiendo.
    #
    # Ahora lo hace users/middleware.py en TODAS las peticiones con sesión,
    # con un freno de un minuto. Cuando esta vista llega, request.user ya
    # trae la fecha nueva, así que el `estado_real` de abajo es correcto.

    return JsonResponse({
        'id': u.id,
        'id_42': u.id_42,
        'username': u.username,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'email': u.email,
        # La foto ya decidida (avatar propio si lo hay, si no la de la Intra).
        # Se mantiene el nombre 'profile_image' porque es el que espera el
        # front en la portada y en el ranking.
        'profile_image': u.foto,
        'tiene_avatar': bool(u.avatar),
        'estado': u.estado_real,
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
    from cards.rarezas import TODAS, puntos_de

    # El orden de las rarezas ya no se escribe aquí: viene de cards/rarezas.py,
    # que es donde se decide cuáles hay. Antes estaba copiado a mano y, al
    # cambiar las rarezas, "tu carta más rara" dejó de reconocer la mitad.
    mis_cartas = UserCard.objects.filter(user=usuario).select_related('card')
    distintas = mis_cartas.count()
    total_catalogo = Card.objects.count()
    con_repetidas = sum(c.cantidad for c in mis_cartas)

    # 🏆 TU CARTA MÁS RARA
    #
    # Antes solo se comparaba la RAREZA, y con un mayor estricto:
    #
    #     if TODAS.index(tier) > TODAS.index(mejor['tier']):
    #
    # O sea que la primera Legendaria que encontrara se quedaba, y ninguna otra
    # Legendaria la podía desbancar, porque ninguna es "más" que otra. Y como
    # la consulta no lleva orden, la base de datos las devuelve como quiere:
    # te enseñaba una al azar de entre las de arriba.
    #
    # A Nacho, con 5 Legendarias, le salía la de nivel 14,59 y no la de 22,61.
    #
    # Ahora se desempata por NIVEL. Tiene sentido porque la rareza ya se
    # calcula a partir del nivel (ver cards/rarezas.py): es la misma vara de
    # medir, solo que más fina. Así "tu carta más rara" es de verdad la mejor
    # que tienes, no una cualquiera.
    def cuanto_vale(uc):
        return (TODAS.index(uc.card.tier), uc.card.cursus_lvl or 0)

    mejor = None
    mejor_valor = None
    puntos = 0
    for uc in mis_cartas:
        tier = uc.card.tier
        # Solo las distintas suman: el bucle va por UserCard, que tiene una
        # fila por carta, no una por copia.
        puntos += puntos_de(tier)
        if tier not in TODAS:
            continue
        valor = cuanto_vale(uc)
        if mejor_valor is None or valor > mejor_valor:
            mejor_valor = valor
            mejor = {
                'login': uc.card.login,
                'tier': tier,
                'photo': uc.card.photo,
                # Va también el nivel: es el dato que explica POR QUÉ esa carta
                # es la mejor, y sin él el desempate no se entiende al verlo.
                'nivel': uc.card.cursus_lvl,
            }

    return {
        'cartas_distintas': distintas,
        'cartas_en_catalogo': total_catalogo,
        'cartas_con_repetidas': con_repetidas,
        # Porcentaje del álbum completado, redondeado a un decimal
        'porcentaje': round(distintas / total_catalogo * 100, 1) if total_catalogo else 0,
        'carta_mas_rara': mejor,
        'puntos': puntos,
    }


def _logros(usuario, stats):
    """
    Los logros NO se guardan en ninguna tabla: se calculan al vuelo a partir de
    lo que la persona tiene. Así no hace falta migración ni mantener nada en
    sincronía, y si mañana se añade un logro nuevo, todo el mundo lo ve
    reflejado al instante según su colección.

    Cada logro lleva su progreso, para que en pantalla se vea lo que falta y no
    solo un sí o un no.
    """
    from cards.models import UserCard
    from cards.rarezas import LEGENDARIO, TRANSCENDER, STAFF

    mis_cartas = list(UserCard.objects.filter(user=usuario).select_related('card'))

    distintas = stats['cartas_distintas']
    total_catalogo = stats['cartas_en_catalogo'] or 1
    tiers = {uc.card.tier for uc in mis_cartas}
    coaliciones = {uc.card.coalition for uc in mis_cartas if uc.card.coalition}
    max_copias = max((uc.cantidad for uc in mis_cartas), default=0)

    def logro(id, nombre, descripcion, icono, actual, objetivo):
        return {
            'id': id,
            'nombre': nombre,
            'descripcion': descripcion,
            'icono': icono,
            'actual': min(actual, objetivo),
            'objetivo': objetivo,
            'conseguido': actual >= objetivo,
        }

    return [
        logro('primera', 'Primera carta', 'Consigue tu primera carta', '🎴', distintas, 1),
        logro('coleccionista', 'Coleccionista', 'Reúne 10 cartas distintas', '📚', distintas, 10),
        logro('veterano', 'Veterano', 'Reúne 25 cartas distintas', '🏅', distintas, 25),
        logro('medio_album', 'Medio álbum', 'Completa la mitad del álbum', '📖',
              int(stats['porcentaje']), 50),
        logro('completista', 'Completista', 'Completa el álbum entero', '👑',
              distintas, total_catalogo),
        # 🎴 CAMBIO (Nacho, 10/09 y 15/09). Estos logros miraban rarezas que
        # ya no existen: "Buscador de Alumni" se había vuelto IMPOSIBLE de
        # conseguir, y el 15/09 el nombre volvió a cambiar (Legendaria ->
        # Legendario) al pasar a cinco rarezas.
        #
        # Los nombres salen de cards/rarezas.py, nunca escritos a mano, que es
        # justo lo que hizo que esto se rompiera las dos veces. Si el import
        # de arriba falla, es que alguien renombró una rareza y este fichero
        # se enterará EN EL ARRANQUE, no cuando un usuario abra su perfil.
        logro('leyenda', 'Cazador de leyendas',
              f'Consigue una carta {LEGENDARIO}', '✨',
              1 if LEGENDARIO in tiers else 0, 1),
        # 👔 Nuevo con la quinta rareza: solo 26 cartas de 805.
        logro('staff', 'Has visto al staff',
              f'Consigue una carta {STAFF}', '👔',
              1 if STAFF in tiers else 0, 1),
        logro('transcender', 'Más allá del tronco común',
              f'Consigue una carta {TRANSCENDER}', '🎓',
              1 if TRANSCENDER in tiers else 0, 1),
        logro('coaliciones', 'Diplomático', 'Ten cartas de las cuatro coaliciones', '🏳️',
              len(coaliciones), 4),
        logro('acumulador', 'Acumulador', 'Ten 5 copias de una misma carta', '🗃️',
              max_copias, 5),
        logro('madrugador', 'Madrugador', 'Recoge tu regalo diario', '🎁',
              1 if usuario.ultimo_regalo_diario else 0, 1),
    ]


def _perfil_publico(usuario):
    """Los datos de un usuario que puede ver cualquiera. Sin email ni id_42."""
    # Se calculan una sola vez: los logros salen de estas mismas cifras
    stats = _estadisticas_coleccion(usuario)
    return {
        # El id interno hace falta para pedirle amistad. No es el id_42 ni
        # revela nada: es el número de fila en nuestra base de datos.
        'id': usuario.id,
        'username': usuario.username,
        # El nombre que él haya elegido; si no puso ninguno, el de la Intra
        'nombre': usuario.nombre_mostrado or usuario.get_full_name() or usuario.username,
        'bio': usuario.bio,
        'profile_image': usuario.foto,
        'tiene_avatar': bool(usuario.avatar),
        # 🏆 La puntuación del perfil sale de la colección (ver cards/rarezas.py).
        'puntos': stats['puntos'],
        'estado': usuario.estado_real,
        'is_alumni': usuario.is_alumni,
        # 🔗 Nacho, 21/09: ¿esta cuenta entró con 42?
        #
        # Hace falta para el botón que lleva a su perfil de la Intra: esa
        # dirección se arma con el login, y SOLO vale para quien entró por
        # 42, porque ahí el username ES su login de la Intra. Quien se
        # registra con correo tiene un nombre inventado por nosotros
        # (_generar_username), y ese perfil no existe en la Intra.
        #
        # Va el sí/no y NO el id_42: el número es dato privado y por eso no
        # sale de aquí. Saber que alguien entró con 42 no revela nada que no
        # se vea ya en su propio nombre de usuario.
        'es_de_42': usuario.id_42 is not None,
        'miembro_desde': usuario.date_joined.date().isoformat(),
        'coleccion': stats,
        'logros': _logros(usuario, stats),
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
    # 🤝 En qué punto está la amistad con esta persona, para que el front sepa
    # qué botón enseñar: pedir amistad, "pendiente", responder o eliminar.
    datos.update(_estado_amistad(request.user, usuario))
    return JsonResponse(datos)


def _estado_amistad(yo, otro):
    """
    Cómo estamos esta persona y yo. Devuelve uno de:
        'yo'        -> es mi propio perfil
        'ninguna'   -> no hay nada, se le puede pedir amistad
        'enviada'   -> yo se la mandé y está esperando
        'recibida'  -> me la mandó él, puedo aceptar o rechazar
        'amigos'    -> ya lo somos
    Con 'recibida' va también el id de la solicitud, para poder responderla.
    """
    from social.models import FriendRequest

    if yo.pk == otro.pk:
        return {'amistad': 'yo', 'solicitud_id': None}

    solicitud = FriendRequest.objects.filter(
        sender__in=[yo, otro],
        receiver__in=[yo, otro],
    ).first()

    if solicitud is None or solicitud.status == FriendRequest.StatusChoice.DECLINED:
        # Una rechazada no cuenta: se puede volver a intentar
        return {'amistad': 'ninguna', 'solicitud_id': None}

    if solicitud.status == FriendRequest.StatusChoice.ACCEPTED:
        return {'amistad': 'amigos', 'solicitud_id': solicitud.id}

    if solicitud.sender_id == yo.pk:
        return {'amistad': 'enviada', 'solicitud_id': solicitud.id}
    return {'amistad': 'recibida', 'solicitud_id': solicitud.id}


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
# 🖼️ AVATAR: la foto que sube el propio usuario
#
# Esta es la única parte del proyecto donde alguien de fuera mete un FICHERO
# en nuestro servidor, así que es la que más hay que cuidar. Nunca nos fiamos
# de lo que llega: ni del nombre del fichero, ni de su extensión, ni de lo que
# el navegador diga que es. La única prueba que vale es abrirlo y ver que es
# una imagen de verdad.
#
# Lo que hacemos con la foto antes de guardarla:
#   1. Comprobamos que pesa menos de 2 MB
#   2. La abrimos con Pillow: si no es una imagen, se rechaza
#   3. La giramos si venía tumbada (las fotos de móvil suelen venir así)
#   4. La reducimos a 512x512 como mucho
#   5. La volvemos a guardar como JPEG con un nombre que elegimos NOSOTROS
#
# El paso 5 es el más importante para la seguridad: al reguardarla, del
# fichero original no queda ni un byte. Si alguien esconde algo dentro de una
# imagen, se pierde por el camino. Y de paso desaparecen los datos de GPS que
# las cámaras de móvil meten dentro de cada foto, que si no estaríamos
# publicando sin querer dónde vive la gente.
# =====================================================================

# Lo que aceptamos. Es una comprobación de cortesía para dar un mensaje claro:
# la de verdad es la de Pillow, porque la extensión de un fichero la pone quien
# quiere y no demuestra nada.
FORMATOS_AVATAR = {'JPEG', 'PNG', 'WEBP'}


def _procesar_avatar(fichero):
    """
    Convierte lo que ha subido el usuario en un JPEG pequeño y limpio.

    Devuelve (contenido, None) si todo va bien, o (None, 'mensaje de error')
    si el fichero no sirve. Nunca lanza excepciones hacia arriba: cualquier
    cosa rara acaba siendo un error con un mensaje entendible.
    """
    from PIL import Image, ImageOps

    if fichero.size > settings.AVATAR_MAX_BYTES:
        megas = settings.AVATAR_MAX_BYTES / (1024 * 1024)
        return None, f'La imagen no puede pesar más de {megas:.0f} MB.'

    # PRIMERA PASADA: solo mirar si es una imagen y de qué tipo.
    # verify() revisa la estructura del fichero sin descomprimir la foto
    # entera, así que una imagen corrupta o un fichero disfrazado caen aquí.
    try:
        prueba = Image.open(fichero)
        formato = prueba.format
        prueba.verify()
    except Exception:
        return None, 'Eso no es una imagen. Sube un archivo JPG, PNG o WEBP.'

    if formato not in FORMATOS_AVATAR:
        return None, 'Formato no admitido. Sube un archivo JPG, PNG o WEBP.'

    # SEGUNDA PASADA: la de verdad. verify() deja el objeto inservible, así que
    # hay que volver al principio del fichero y abrirlo otra vez.
    fichero.seek(0)
    try:
        imagen = Image.open(fichero)
        # Las fotos de móvil guardan "esto va girado" en una etiqueta interna
        # en vez de girar los píxeles. Si no lo aplicamos, salen tumbadas.
        imagen = ImageOps.exif_transpose(imagen)

        # El JPEG no admite transparencia. Si la foto la tiene (un PNG
        # recortado, por ejemplo) la pegamos sobre blanco; si no, esas zonas
        # saldrían negras.
        if imagen.mode in ('RGBA', 'LA', 'P'):
            imagen = imagen.convert('RGBA')
            fondo = Image.new('RGB', imagen.size, (255, 255, 255))
            fondo.paste(imagen, mask=imagen.split()[-1])
            imagen = fondo
        else:
            imagen = imagen.convert('RGB')

        # thumbnail() respeta la proporción: no deforma a nadie. Si la imagen
        # ya era pequeña, la deja como está.
        lado = settings.AVATAR_LADO_MAX
        imagen.thumbnail((lado, lado), Image.LANCZOS)

        memoria = io.BytesIO()
        imagen.save(memoria, format='JPEG', quality=85, optimize=True)
        return memoria.getvalue(), None
    except Exception:
        return None, 'No hemos podido procesar la imagen. Prueba con otra.'


@require_http_methods(['POST', 'DELETE'])
def mi_avatar(request):
    """
    POST   -> sube (o reemplaza) tu foto de perfil. Va en un formulario
              multipart, con el fichero en el campo 'avatar'.
    DELETE -> quita tu foto y vuelve a la de la Intra.

    Solo puedes tocar la tuya: no hay forma de indicar de quién es la foto,
    siempre se aplica a quien tiene la sesión abierta.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Tienes que iniciar sesión.'}, status=401)

    usuario = request.user

    # ---- Quitar la foto ----
    if request.method == 'DELETE':
        if not usuario.avatar:
            return JsonResponse({'error': 'No tienes ninguna foto subida.'}, status=400)
        # delete() borra el fichero del disco, no solo la referencia
        usuario.avatar.delete(save=True)
        return JsonResponse({
            'mensaje': 'Foto quitada. Vuelves a tener la de la Intra.',
            'foto': usuario.foto,
            'tiene_avatar': False,
        })

    # ---- Subir una foto ----
    fichero = request.FILES.get('avatar')
    if fichero is None:
        return JsonResponse({'error': 'No has enviado ninguna imagen.'}, status=400)

    contenido, error = _procesar_avatar(fichero)
    if error:
        return JsonResponse({'error': error}, status=400)

    # El nombre lo ponemos nosotros y lleva un trozo aleatorio por dos razones:
    # no usar nunca el nombre que venga de fuera (podría traer '../' y otras
    # cosas feas), y que al cambiar de foto cambie la dirección, porque si no
    # el navegador seguiría enseñando la antigua de su memoria caché.
    nombre = f'{usuario.pk}-{uuid.uuid4().hex[:12]}.jpg'

    # Si ya tenía una, fuera: si no, cada cambio dejaría un fichero muerto
    if usuario.avatar:
        usuario.avatar.delete(save=False)

    usuario.avatar.save(nombre, ContentFile(contenido), save=True)

    return JsonResponse({
        'mensaje': 'Foto de perfil actualizada.',
        'foto': usuario.foto,
        'tiene_avatar': True,
    })


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

@require_http_methods(["GET", "POST"])
def descargar_mis_datos(request):
    """
    Devuelve TODO lo que guardamos de esta persona, en un fichero JSON que se
    descarga, y ADEMÁS le manda una copia por correo si tiene uno.

    Las dos cosas a la vez y no una u otra, a propósito (Nacho, 22/09):

      - La descarga es el derecho de acceso del RGPD y tiene que funcionar
        siempre, también para quien no tenga correo.
      - El correo es la confirmación: sirve para que te enteres si alguien
        que no eres tú se ha bajado tus datos.

    El correo va con fail_silently: si el servidor de correo está caído, te
    descargas los datos igual.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Tienes que iniciar sesión.'}, status=401)

    from cards.models import UserCard, UserPack

    u = request.user

    # ⚠️ Nacho, 22/09: aquí había un corte que devolvía un 400 si la cuenta no
    # tenía correo. Se quita: ahora los datos se descargan igual y el correo
    # es un extra para quien lo tenga (ver el paso 3). Quedarse sin poder
    # sacar tus propios datos por no tener correo es justo lo que el RGPD no
    # permite, y pasa de verdad: el login de 42 deja el email a None cuando
    # la Intra no devuelve ninguno.

    # 1. Recopilamos todos sus datos
    datos = {
        'exportado_el': timezone.now().isoformat(),
        'cuenta': {
            'username': u.username,
            'email': u.email,
            'nombre': u.first_name,
            'apellidos': u.last_name,
            'nombre_mostrado': u.nombre_mostrado,
            'biografia': u.bio,
            'foto_de_la_intra': u.profile_image,
            'foto_subida_por_ti': u.avatar.url if u.avatar else None,
            'id_42': u.id_42,
            'es_alumni': u.is_alumni,
            'puntos': _estadisticas_coleccion(u)['puntos'],
            'estado': u.estado_real,
            'alta': u.date_joined.isoformat(),
            'ultimo_acceso': u.last_login.isoformat() if u.last_login else None,
            'ultimo_regalo_diario': u.ultimo_regalo_diario.isoformat() if u.ultimo_regalo_diario else None,
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

    # 2. Generamos el contenido JSON en memoria como una cadena formateada
    contenido_json = json.dumps(datos, indent=2, ensure_ascii=False)
    nombre_archivo = f"mis-datos-{u.username}.json"

    # 3. 📧 EL CORREO CON LOS DATOS ADJUNTOS.
    #
    # ⚠️ Nacho, 22/09: el correo SE SUMA a la descarga, no la sustituye.
    #
    # Tal como estaba, los datos SOLO llegaban por correo, y eso tenía dos
    # problemas serios:
    #
    #   1. Quien no tiene correo se quedaba sin sus datos. Y eso puede
    #      pasar: el campo admite vacío y el login de 42 lo deja a None si
    #      la Intra no devuelve correo. Para esa persona, el derecho de
    #      acceso del RGPD dejaba de existir.
    #   2. Si el servidor de correo fallaba, la respuesta era un 500 y no
    #      había forma de conseguir los datos.
    #
    # Así que ahora se hacen las dos cosas: el fichero se descarga siempre,
    # y además llega una copia por correo a quien tenga. Si el correo falla,
    # la descarga sigue funcionando: por eso fail_silently=True.
    if u.email:
        correo = EmailMessage(
            subject='Tus datos de Transcendence',
            body=(
                f'Hola {u.username},\n\n'
                'Adjunto a este correo encontrarás el archivo JSON con toda la información '
                'asociada a tu cuenta, de acuerdo con nuestro compromiso de transparencia y el RGPD.\n\n'
                'Si no has sido tú quien ha pedido esta copia, avísanos.\n\n'
                'Un saludo,\nEl equipo de Transcendence.'
            ),
            from_email=None,  # Utiliza DEFAULT_FROM_EMAIL definido en settings.py
            to=[u.email],
        )
        correo.attach(nombre_archivo, contenido_json, 'application/json')
        correo.send(fail_silently=True)

    # 4. Y la descarga de siempre, que es la que el front pide con un enlace
    #    (Perfil.jsx). Devolver aquí otra cosa dejaba al usuario mirando un
    #    JSON en una pestaña en blanco, fuera de la web.
    respuesta = JsonResponse(datos, json_dumps_params={'indent': 2, 'ensure_ascii': False})
    respuesta['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
    return respuesta

@require_POST
def borrar_mi_cuenta(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Tienes que iniciar sesión.'}, status=401)

    datos = _leer_json(request)
    if not datos or datos.get('confirmacion') != 'BORRAR MI CUENTA':
        return JsonResponse({'error': 'Falta la confirmación.'}, status=400)

    usuario = request.user
    nombre = usuario.username
    email_usuario = usuario.email  # Guardamos el email antes de borrar nada

    # 1. 🖼️ EL FICHERO DEL AVATAR, A MANO.
    #
    # ⚠️ Nacho, 22/09: esto estaba desde el principio y se perdió al meter los
    # correos. Lo recupero porque es justo lo que todo el mundo se deja:
    # al borrar el usuario, Django quita la fila de la base de datos pero NO
    # TOCA EL FICHERO DEL DISCO, así que la foto se quedaría ahí para siempre.
    # Y en la Política de Privacidad prometemos que al borrar la cuenta no
    # queda nada, así que hay que cumplirlo.
    #
    # Va lo primero, antes que nada: si fallara, la cuenta no se borra y no
    # nos quedamos con una cuenta ida y una foto huérfana.
    if usuario.avatar:
        usuario.avatar.delete(save=False)

    # 2. Borrar en la base de datos (álbum, sobres, mensajes, amigos y
    #    bloqueos se van en cascada).
    with transaction.atomic():
        if Card.objects.filter(login=usuario.username):
            Card.objects.filter(login=usuario.username).delete()
        usuario.delete()

    # 3. Hacer logout DESPUÉS de haber eliminado el usuario en BD
    logout(request)

    # 4. 📧 Y AHORA el correo de confirmación, cuando ya está todo hecho.
    #
    # ⚠️ Nacho, 22/09: dos cambios sobre lo que había, y los dos por el mismo
    # motivo: que un problema del servidor de correo NO impida borrar una
    # cuenta.
    #
    #   - Va DESPUÉS del borrado, no antes. Así el correo dice la verdad
    #     ("se han eliminado") en vez de prometerlo antes de hacerlo.
    #   - Va con fail_silently=True. Antes era False: si el servidor de
    #     correo estaba caído, saltaba la excepción, la cuenta NO se borraba
    #     y el usuario recibía un error 500. O sea que el derecho a borrar tus
    #     datos se quedaba bloqueado por algo que no tiene nada que ver.
    #
    # El RGPD es el borrado; el correo es cortesía. Si falla la cortesía, no
    # se cae el derecho.
    if email_usuario:
        send_mail(
            subject='Tu cuenta ha sido eliminada',
            message=f'Hola {nombre},\n\nConfirmamos que tu cuenta y todos tus datos han sido eliminados correctamente.',
            from_email=None,
            recipient_list=[email_usuario],
            fail_silently=True,
        )

    return JsonResponse({'mensaje': f'La cuenta de {nombre} se ha borrado correctamente.'})
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
                'profile_image': user.foto,
                'estado': user.estado_real,
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
    """Lee y decodifica el cuerpo JSON de la petición de forma segura."""
    try:
        if not request.body:
            return {}
        return json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


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

    usuario.estado = 'online'
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
