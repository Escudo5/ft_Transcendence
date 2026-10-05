"""
🔐 EL PORTERO DE LA API PÚBLICA

Aquí está la pieza que mira cada petición que llega a /api/publica/ y
decide si pasa o no.

CÓMO ENTRA LA GENTE EN EL RESTO DEL PROYECTO, Y POR QUÉ AQUÍ NO VALE:

  En la web, cuando un alumno hace login, Django le deja una COOKIE en el
  navegador. A partir de ahí el navegador la manda sola en cada petición y
  Django sabe quién es. Eso funciona porque hay un navegador de por medio.

  Un programa (un script en Python, un bot, una hoja de cálculo) no tiene
  navegador ni cookies. Necesita otra forma de decir quién es: manda la
  clave en una CABECERA de la petición, así:

      GET /api/publica/mi-album/
      X-API-Key: AQUI-VA-TU-CLAVE

  (El ejemplo de arriba era una cadena con la pinta EXACTA de una clave de
   verdad: 54 caracteres, los mismos que genera token_urlsafe(40). Se ha
   cambiado el 5/10 por una que no se pueda confundir. Nunca metáis una clave
   de verdad en un comentario, ni "solo de ejemplo": las claves se guardan
   cifradas a propósito, y una pegada aquí se sube a GitHub en claro.)

  Una cabecera es simplemente un dato que acompaña a la petición, aparte
  de la dirección. El navegador ya manda unas cuantas sin que lo veas.

⚠️ POR QUÉ LA CLAVE VA EN LA CABECERA Y NO EN LA DIRECCIÓN:
  Podríamos haberla pedido como /api/publica/album/?clave=XXXX, pero las
  direcciones se guardan en los registros del servidor, en el historial
  del navegador y en los intermediarios. La clave acabaría escrita en
  media docena de sitios. Las cabeceras no se registran.
"""

from datetime import timedelta

from django.utils import timezone
from rest_framework import authentication, exceptions

from .models import ClaveApi

# Nombre de la cabecera tal y como la deja Django en request.META: pone
# HTTP_ delante y cambia los guiones por barras bajas. O sea, la cabecera
# "X-API-Key" que manda el programa llega aquí como "HTTP_X_API_KEY".
CABECERA = 'HTTP_X_API_KEY'

# Cada cuánto, como mucho, apuntamos "esta clave se ha usado". Ver abajo.
MINUTOS_ENTRE_APUNTES = 5


class AutenticacionPorClave(authentication.BaseAuthentication):
    """
    Traduce una clave de API en un usuario del proyecto.

    Django REST Framework llama a authenticate() antes de cada vista. Si
    devolvemos un usuario, la vista se ejecuta como si esa persona
    estuviera dentro; y todo lo que ya tenemos escrito (permisos,
    request.user, los filtros por usuario) funciona igual que en la web,
    sin cambiar ni una línea.

    Esa es la gracia de hacerlo así y no con un `if` dentro de cada
    vista: la API pública reutiliza el mismo sistema de permisos que el
    resto del proyecto.
    """

    def authenticate(self, request):
        clave = request.META.get(CABECERA, '').strip()

        # ── Sin cabecera: no es asunto nuestro ────────────────────────
        # Devolver None NO es rechazar: es decir "yo no sé quién es
        # este, que lo intente otro". Detrás va la autenticación por
        # sesión, así que una petición desde el propio navegador del
        # alumno (con su cookie) también entra. Muy útil: la misma ruta
        # sirve para el script de fuera y para probar desde la web.
        #
        # Si nadie la reconoce, el permiso IsAuthenticated de la vista es
        # el que corta con un 401. Aquí no hay que hacerlo.
        if not clave:
            return None

        # ── Con cabecera pero mala: aquí sí cortamos ──────────────────
        # Si alguien SE HA MOLESTADO en mandar una clave, merece que le
        # digamos que está mal. Dejarlo pasar al siguiente sistema haría
        # que un fallo de clave se viera como un genérico "no has
        # iniciado sesión", y te puedes tirar una tarde buscando eso.
        objeto = ClaveApi.objects.filter(
            huella=ClaveApi.resumir(clave)
        ).select_related('usuario').first()

        if objeto is None:
            raise exceptions.AuthenticationFailed('Clave de API no válida.')

        if not objeto.activa:
            raise exceptions.AuthenticationFailed('Esta clave está desactivada.')

        if not objeto.usuario.is_active:
            raise exceptions.AuthenticationFailed('La cuenta dueña de esta clave está desactivada.')

        self._apuntar_uso(objeto)

        # DRF espera exactamente esta pareja: (usuario, lo_que_autenticó).
        # El segundo elemento acaba en request.auth, así que dentro de
        # una vista se puede saber POR QUÉ CLAVE ha entrado, y no solo
        # quién es. Lo usaremos para el límite de peticiones.
        return (objeto.usuario, objeto)

    def authenticate_header(self, request):
        """
        Sin esto, DRF contesta 403 en vez de 401.

        La diferencia importa: 401 significa "no sé quién eres, preséntate"
        y 403 "sé quién eres pero esto no es para ti". Un programa que
        recibe 401 sabe que tiene que revisar su clave.
        """
        return 'X-API-Key'

    # ------------------------------------------------------------------
    @staticmethod
    def _apuntar_uso(objeto):
        """
        Guarda cuándo se usó la clave por última vez, pero NO en cada
        petición.

        Si lo apuntáramos siempre, cada lectura de la API se convertiría
        también en una ESCRITURA en la base de datos. Un script que pida
        100 veces seguidas haría 100 escrituras que a nadie le importan:
        para lo que sirve el dato ("¿esta clave sigue viva o la puedo
        borrar?") basta con la precisión de unos minutos.

        Se usa update() y no save() a propósito: escribe solo esa columna
        con una única orden, sin leer ni reescribir el resto de la fila.
        Así dos peticiones a la vez no se pisan.
        """
        ahora = timezone.now()
        if (objeto.ultimo_uso is not None
                and ahora - objeto.ultimo_uso < timedelta(minutes=MINUTOS_ENTRE_APUNTES)):
            return
        ClaveApi.objects.filter(pk=objeto.pk).update(ultimo_uso=ahora)
        objeto.ultimo_uso = ahora
