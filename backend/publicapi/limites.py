"""
🚦 EL LÍMITE DE PETICIONES

El subject lo pide expresamente para el módulo de API pública, y tiene
todo el sentido: en cuanto das una clave a alguien, ese alguien puede
poner su programa en un bucle. Sin límite, un fallo tonto en un script de
un compañero (un `while True` sin pausa) tumba el servidor para todos.

CÓMO SE CUENTA, Y POR QUÉ ASÍ:

  Lo normal en internet es contar por dirección IP. Aquí no serviría de
  mucho: en 42 todo el campus sale por la misma línea, así que TODOS
  compartiríais el mismo cubo y os quedaríais sin peticiones por culpa
  del script de otro.

  Como el portero (autenticacion.py) ya nos dice QUÉ CLAVE concreta está
  pidiendo, contamos por clave. Cada alumno tiene su propio cubo y el
  bucle infinito de uno no afecta a nadie más. La IP solo se usa para los
  que ni siquiera traen clave.

DOS VELOCIDADES, PORQUE NO CUESTA LO MISMO:

  Leer tu álbum es una consulta y ya está. Escribir (proponer un
  intercambio, descartar cartas) toca varias tablas con transacción y
  bloqueo de filas. Por eso escribir tiene un límite más apretado.

⚠️ DÓNDE SE LLEVA LA CUENTA:
  En la memoria del propio Django (la caché que trae de serie). Eso
  significa que al reiniciar el contenedor los contadores se ponen a
  cero, y que si algún día se levantan varios Django a la vez cada uno
  contaría por su lado.

  Para lo nuestro sobra: hay UN Django y el límite es una red de
  seguridad, no una barrera antifraude. Si esto saliera a internet de
  verdad, la cuenta se llevaría en Redis cambiando una línea del
  settings. Merece la pena decirlo así en la evaluación: sabemos cuál es
  la limitación y por qué la aceptamos.
"""

import math

from rest_framework.exceptions import APIException, Throttled
from rest_framework.throttling import SimpleRateThrottle

from .models import ClaveApi


class DemasiadasPeticiones(Throttled):
    """
    El 429, pero con un mensaje decente.

    El de fábrica de DRF sale medio traducido ("Solicitud fue regulada
    (throttled). Expected available in 34 seconds.") porque junta dos
    frases de dos catálogos distintos. Como este texto es lo que va a
    leer quien use nuestra API, lo escribimos entero nosotros.

    Se sigue heredando de Throttled y se sigue guardando self.wait
    porque de ahí saca DRF la cabecera Retry-After, que es lo que de
    verdad lee un programa para saber cuánto dormir.
    """

    def __init__(self, wait=None):
        self.wait = math.ceil(wait) if wait else None
        segundos = self.wait or 60
        APIException.__init__(self, (
            f'Has superado el límite de peticiones por minuto. '
            f'Vuelve a intentarlo dentro de {segundos} segundos.'
        ))


class LimitePorClave(SimpleRateThrottle):
    """
    La base. Lo único que hace es decidir EN QUÉ CUBO cae cada petición.

    DRF se encarga del resto: guarda las marcas de tiempo de las últimas
    peticiones de ese cubo, tira las que ya son viejas y, si quedan más
    de la cuenta, contesta 429 ("demasiadas peticiones") con un
    Retry-After diciendo cuántos segundos hay que esperar.
    """

    def get_cache_key(self, request, view):
        # request.auth lo dejó puesto el portero: es la ClaveApi con la
        # que ha entrado. Cada clave, su cubo.
        if isinstance(request.auth, ClaveApi):
            return f'{self.scope}:clave:{request.auth.pk}'

        # Sin clave pero con sesión: es alguien probando la API desde el
        # navegador, ya logueado. Cubo por usuario.
        if request.user is not None and request.user.is_authenticated:
            return f'{self.scope}:usuario:{request.user.pk}'

        # Ni clave ni sesión. Solo queda la IP.
        return f'{self.scope}:ip:{self.get_ident(request)}'


class LimiteLectura(LimitePorClave):
    """Para los GET. El número está en settings.py, no aquí."""
    scope = 'api_lectura'


class LimiteEscritura(LimitePorClave):
    """Para POST, PUT y DELETE: más apretado, porque cuestan más."""
    scope = 'api_escritura'
