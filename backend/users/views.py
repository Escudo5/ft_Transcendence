import csv
import io
import json
import re
import requests
import os
import uuid
from html import escape as escapar_html
from django.conf import settings
from django.core.files.base import ContentFile
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.shortcuts import redirect
from django.contrib.auth import login, logout
from django.contrib.sessions.models import Session
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
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


@require_GET
def sesion(request):
    """
    ¿Hay sesión abierta? Contesta SIEMPRE 200: que no la haya no es un error,
    y un 401 dejaría una línea roja en la consola del navegador en la pantalla
    de acceso, que es lo primero que ve cualquiera.
    """
    return JsonResponse({'autenticado': request.user.is_authenticated})


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

    mis_cartas = UserCard.objects.filter(user=usuario).select_related('card')
    distintas = mis_cartas.count()
    total_catalogo = Card.objects.count()
    con_repetidas = sum(c.cantidad for c in mis_cartas)


    def cuanto_vale(uc):
        return (TODAS.index(uc.card.tier), uc.card.cursus_lvl or 0)

    mejor = None
    mejor_valor = None
    puntos = 0
    for uc in mis_cartas:
        tier = uc.card.tier
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

    🌐 Aquí no hay texto: sale solo el DATO (qué logro, cuánto llevas, cuánto
    falta) y el texto lo pone el front desde i18n.jsx, en los tres idiomas.

    ⚠️ Si añades un logro, hace falta su línea en DICCIONARIO_LOGROS de
    components/Perfil/PerfilComponents/LogrosPerfil.jsx y sus claves en
    i18n.jsx EN LOS TRES IDIOMAS. Si falta, en pantalla sale la clave en crudo.
    """
    from cards.models import UserCard
    from cards.rarezas import LEGENDARIO, TRANSCENDER, STAFF

    mis_cartas = list(UserCard.objects.filter(user=usuario).select_related('card'))

    distintas = stats['cartas_distintas']
    total_catalogo = stats['cartas_en_catalogo'] or 1
    tiers = {uc.card.tier for uc in mis_cartas}
    coaliciones = {uc.card.coalition for uc in mis_cartas if uc.card.coalition}
    max_copias = max((uc.cantidad for uc in mis_cartas), default=0)

    def logro(id, icono, actual, objetivo, rareza=None):
        datos = {
            'id': id,
            'icono': icono,
            'actual': min(actual, objetivo),
            'objetivo': objetivo,
            'conseguido': actual >= objetivo,
        }
        # 🎴 Los tres logros de rareza dicen "Consigue una carta Legendario".
        # El nombre de la rareza va como DATO y no metido en la frase: así el
        # front lo traduce con la clave que ya tiene para las rarezas
        # (rarityLegendario, rarityStaff...) y la frase es UNA sola traducción
        # que sirve para los tres.
        if rareza:
            datos['rareza'] = rareza
        return datos

    # Los números (el 10, el 25, el 5...) van SOLO aquí, en 'objetivo'. El front
    # los mete en la frase traducida, así que "Reúne 10 cartas distintas" no
    # tiene el 10 escrito en ningún texto: si mañana se sube a 15, cambia esta
    # línea y la frase se actualiza sola en los tres idiomas.
    return [
        logro('primera', '🎴', distintas, 1),
        logro('coleccionista', '📚', distintas, 10),
        logro('veterano', '🏅', distintas, 25),
        logro('medio_album', '📖', int(stats['porcentaje']), 50),
        logro('completista', '👑', distintas, total_catalogo),
        logro('leyenda', '✨', 1 if LEGENDARIO in tiers else 0, 1, rareza=LEGENDARIO),
        # 👔 Nuevo con la quinta rareza: solo 9 cartas de 824.
        logro('staff', '👔', 1 if STAFF in tiers else 0, 1, rareza=STAFF),
        logro('transcender', '🎓', 1 if TRANSCENDER in tiers else 0, 1, rareza=TRANSCENDER),
        logro('coaliciones', '🏳️', len(coaliciones), 4),
        logro('acumulador', '🗃️', max_copias, 5),
        logro('madrugador', '🎁', 1 if usuario.ultimo_regalo_diario else 0, 1),
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
# El módulo de "GDPR compliance" del subject pide CUATRO cosas, y están las
# cuatro:
#   ✔ que el usuario pueda pedir sus datos      -> descargar_mis_datos
#   ✔ borrado con confirmación                  -> borrar_mi_cuenta
#   ✔ exportarlos en formato legible            -> JSON, CSV o HTML (?format=)
#   ✔ correos de confirmación de las operaciones -> al descargar y al borrar
#     (servidor SMTP con las credenciales del .env)
# =====================================================================

class _EscritorCsvSeguro:
    """
    Envuelve al csv.writer para que ninguna celda se pueda ejecutar como
    fórmula.

    Excel y LibreOffice tratan como fórmula cualquier celda que empiece por
    = + - @ (o por tabulador o retorno de carro). Una biografía que empiece
    por "=HYPERLINK(...)" se ejecutaría al abrir el fichero. Se neutraliza
    poniendo una comilla delante, que es lo que se recomienda para esto.

    Coste asumido: un texto legítimo que empiece por + o - (por ejemplo un
    nombre visible "+34 600...") sale con esa comilla delante en el CSV. El
    JSON y el HTML no cambian.
    """
    PELIGROSOS = ('=', '+', '-', '@', '\t', '\r')

    def __init__(self, escritor):
        self.escritor = escritor

    def writerow(self, fila):
        self.escritor.writerow([
            "'" + celda if isinstance(celda, str) and celda.startswith(self.PELIGROSOS) else celda
            for celda in fila
        ])


def _generar_csv_datos(datos):
    """
    Convierte el diccionario de datos del usuario en un formato CSV legible
    organizado por secciones (datos de cuenta, álbum de cartas y sobres).
    """
    buffer = io.StringIO()
    writer = _EscritorCsvSeguro(csv.writer(buffer))  

    writer.writerow(['Exportado el', datos.get('exportado_el')])
    writer.writerow([])

    # 1. Sección Datos de Cuenta
    writer.writerow(['DATOS DE LA CUENTA'])
    writer.writerow(['Campo', 'Valor'])
    cuenta = datos.get('cuenta', {})
    for clave, valor in cuenta.items():
        writer.writerow([clave, valor if valor is not None else ''])

    writer.writerow([])

    # 2. Sección Álbum de Cartas
    writer.writerow(['ALBUM DE CARTAS'])
    writer.writerow(['Carta', 'Rareza', 'Copias', 'Obtenida El'])
    for c in datos.get('album', []):
        writer.writerow([c.get('carta'), c.get('rareza'), c.get('copias'), c.get('obtenida_el')])

    writer.writerow([])

    # 3. Sección Sobres en Inventario
    writer.writerow(['SOBRES DISPONIBLES'])
    writer.writerow(['Tipo de Sobre', 'Cantidad'])
    for s in datos.get('sobres', []):
        writer.writerow([s.get('tipo'), s.get('cantidad')])

    return '\ufeff' + buffer.getvalue()


def _generar_html_datos(datos):
    """
    Genera un informe estructurado en formato HTML estético y legible
    para el cumplimiento del requisito de acceso en "formato legible" del RGPD.
    """
    cuenta = datos.get('cuenta', {})
    album = datos.get('album', [])
    sobres = datos.get('sobres', [])

    def h(valor):
        return escapar_html(str(valor))

    filas_cuenta = "".join([
        f"<tr><th style='text-align:left; padding:8px; border-bottom:1px solid #334155;'>{h(k)}</th>"
        f"<td style='padding:8px; border-bottom:1px solid #334155;'>{h(v) if v is not None else '-'}</td></tr>"
        for k, v in cuenta.items()
    ])

    filas_album = "".join([
        f"<tr><td style='padding:8px; border-bottom:1px solid #334155;'>{h(c.get('carta'))}</td>"
        f"<td style='padding:8px; border-bottom:1px solid #334155;'>{h(c.get('rareza'))}</td>"
        f"<td style='padding:8px; border-bottom:1px solid #334155;'>{h(c.get('copias'))}</td>"
        f"<td style='padding:8px; border-bottom:1px solid #334155;'>{h(c.get('obtenida_el'))}</td></tr>"
        for c in album
    ]) or "<tr><td colspan='4' style='padding:8px;'>Sin cartas en el álbum</td></tr>"

    filas_sobres = "".join([
        f"<tr><td style='padding:8px; border-bottom:1px solid #334155;'>{h(s.get('tipo'))}</td>"
        f"<td style='padding:8px; border-bottom:1px solid #334155;'>{h(s.get('cantidad'))}</td></tr>"
        for s in sobres
    ]) or "<tr><td colspan='2' style='padding:8px;'>Sin sobres disponibles</td></tr>"

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mis Datos - Transcendence</title>
    <style>
        body {{ font-family: system-ui, -apple-system, sans-serif; margin: 30px; background: #0f172a; color: #f8fafc; }}
        .card {{ background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
        h1 {{ color: #38bdf8; margin-bottom: 8px; }}
        h2 {{ color: #cbd5e1; border-bottom: 2px solid #334155; padding-bottom: 8px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
    </style>
</head>
<body>
    <div class="card">
        <h1>Transcendence - Informe de Datos de Usuario</h1>
        <p>Exportado el: <strong>{h(datos.get('exportado_el'))}</strong></p>
    </div>

    <div class="card">
        <h2>Datos de la Cuenta</h2>
        <table>{filas_cuenta}</table>
    </div>

    <div class="card">
        <h2>Álbum de Cartas ({len(album)})</h2>
        <table>
            <thead>
                <tr style="text-align:left; background:#334155;">
                    <th style="padding:8px;">Carta</th>
                    <th style="padding:8px;">Rareza</th>
                    <th style="padding:8px;">Copias</th>
                    <th style="padding:8px;">Obtenida El</th>
                </tr>
            </thead>
            <tbody>{filas_album}</tbody>
        </table>
    </div>

    <div class="card">
        <h2>Sobres en Inventario</h2>
        <table>
            <thead>
                <tr style="text-align:left; background:#334155;">
                    <th style="padding:8px;">Tipo</th>
                    <th style="padding:8px;">Cantidad</th>
                </tr>
            </thead>
            <tbody>{filas_sobres}</tbody>
        </table>
    </div>
</body>
</html>"""
    return html


@require_http_methods(["GET", "POST"])
def descargar_mis_datos(request):
    """
    Devuelve TODO lo que guardamos de esta persona en el formato solicitado (JSON por defecto,
    o bien CSV o HTML), y ADEMÁS le manda una copia por correo si tiene uno.

    Las dos cosas a la vez, a propósito: la descarga es el derecho de acceso y
    tiene que funcionar siempre, también sin correo; el correo es el aviso de
    que alguien se ha bajado tus datos. Va con fail_silently: si el servidor
    de correo está caído, te descargas los datos igual.

    Formatos aceptados vía parametro GET 'format':
      - format=json (por defecto): Genera el JSON original estructurado.
      - format=csv: Genera una representación en formato CSV.
      - format=html: Genera un informe en HTML estético y legible.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Tienes que iniciar sesión.'}, status=401)

    from cards.models import UserCard, UserPack

    u = request.user


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

    # 2. Leemos el parámetro de formato ('json' por defecto)
    fmt = request.GET.get('format', 'json').lower()
    if fmt not in ('csv', 'html'):
        fmt = 'json'

    if fmt == 'csv':
        contenido = _generar_csv_datos(datos)
        nombre_archivo = f"mis-datos-{u.username}.csv"
        mime_type = 'text/csv'
        respuesta = HttpResponse(contenido, content_type='text/csv; charset=utf-8')
    elif fmt == 'html':
        contenido = _generar_html_datos(datos)
        nombre_archivo = f"mis-datos-{u.username}.html"
        mime_type = 'text/html'
        respuesta = HttpResponse(contenido, content_type='text/html; charset=utf-8')
    else:
        # Formato JSON por defecto
        contenido = json.dumps(datos, indent=2, ensure_ascii=False)
        nombre_archivo = f"mis-datos-{u.username}.json"
        mime_type = 'application/json'
        respuesta = JsonResponse(datos, json_dumps_params={'indent': 2, 'ensure_ascii': False})

    # 3. 📧 EL CORREO CON LOS DATOS ADJUNTOS.
    if u.email:
        correo = EmailMessage(
            subject='Tus datos de Transcendence',
            body=(
                f'Hola {u.username},\n\n'
                f'Adjunto a este correo encontrarás el archivo ({fmt.upper()}) con toda la información '
                'asociada a tu cuenta, de acuerdo con nuestro compromiso de transparencia y el RGPD.\n\n'
                'Si no has sido tú quien ha pedido esta copia, avísanos.\n\n'
                'Un saludo,\nEl equipo de Transcendence.'
            ),
            from_email=None,  # Utiliza DEFAULT_FROM_EMAIL definido en settings.py
            to=[u.email],
        )
        correo.attach(nombre_archivo, contenido.encode('utf-8'), mime_type)
        correo.send(fail_silently=True)
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
    if usuario.avatar:
        usuario.avatar.delete(save=False)

    # 2. Borrar en la base de datos (álbum, sobres, mensajes, amigos y
    #    bloqueos se van en cascada).
    with transaction.atomic():
        if Card.objects.filter(login=usuario.username):
            Card.objects.filter(login=usuario.username).delete()
            with open("ignore_logins.txt", "a", encoding="utf-8") as archivo:
                archivo.write(f"{usuario.username}\n")
        usuario.delete()

    # 3. Hacer logout DESPUÉS de haber eliminado el usuario en BD
    logout(request)

    # 4. 📧 Y AHORA el correo de confirmación, cuando ya está todo hecho.
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
    """
    Devuelve usuarios de la base de datos para pintarlos en el front.

    La usan el álbum (Catalogo.jsx) y la portada (Home.jsx) para saber quién,
    de los que tienen carta, está además registrado en la web.

    ⚠️ Con sesión: sin esta comprobación cualquiera, sin registrarse, se bajaba
    el nombre, la foto y el estado de TODOS los usuarios. El correo y el id_42
    no salen nunca de aquí.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Tienes que iniciar sesión.'}, status=401)

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
        return JsonResponse({'error': 'Revisa los datos.', 'campos': errores}, status=200)

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
        return JsonResponse({
            'success': False, 
            'error': 'Escribe tu correo y tu contraseña.'
        }, status=200) # <--- Cambiado a 200

    usuario = CustomUser.objects.filter(email=email).first()

    if usuario is None or not usuario.check_password(password):
        return JsonResponse({
            'success': False, 
            'error': 'Correo o contraseña incorrectos.'
        }, status=200) # <--- Cambiado a 200

    if not usuario.is_active:
        return JsonResponse({
            'success': False, 
            'error': 'Esta cuenta está desactivada.'
        }, status=200) # <--- Cambiado a 200

    usuario.estado = 'online'
    usuario.save()

    login(request, usuario, backend='django.contrib.auth.backends.ModelBackend')

    return JsonResponse({
        'success': True, # <--- Añadido para el éxito
        'status': 'usuario_existente',
        'username': usuario.username,
        'email': usuario.email,
        'mensaje': f'¡Bienvenido de nuevo, {usuario.first_name or usuario.username}!',
        'sobres_disponibles_hoy': SOBRES_DIARIOS,
    }, status=200)


def _cerrar_todas_sus_sesiones(usuario):
    """
    Borra las sesiones de esta persona en TODOS los navegadores, no solo en el
    que pulsa "cerrar sesión". El id del usuario va codificado dentro de cada
    sesión, así que no se puede filtrar con una consulta: hay que abrirlas.
    """
    suyas = [
        sesion.session_key
        for sesion in Session.objects.filter(expire_date__gte=timezone.now())
        if sesion.get_decoded().get('_auth_user_id') == str(usuario.pk)
    ]
    Session.objects.filter(session_key__in=suyas).delete()


@csrf_exempt
def logout_view(request):
    """Cierra la sesión en todos sus navegadores y deja al alumno como 'offline'."""
    if request.user.is_authenticated:
        CustomUser.objects.filter(pk=request.user.pk).update(estado='offline')
        _cerrar_todas_sus_sesiones(request.user)
    logout(request)
    return JsonResponse({'status': 'ok', 'mensaje': 'Sesión cerrada. ¡Hasta mañana!'})
