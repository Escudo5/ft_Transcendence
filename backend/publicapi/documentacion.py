"""
📖 LA DOCUMENTACIÓN, QUE SE ESCRIBE SOLA

GET /api/publica/  ->  todo lo que se puede hacer, con ejemplos.

POR QUÉ NO ES UN FICHERO DE TEXTO:

  Un documento aparte se queda viejo. Siempre. Alguien añade una ruta un
  martes, se le olvida actualizar el papel, y a partir de ahí la
  documentación miente. Y una documentación que miente es peor que no
  tener ninguna, porque la gente se fía.

  Esta se saca del código en el momento de pedirla:

    - las direcciones, del fichero de rutas (urls.py)
    - los verbos que admite cada una, mirando qué métodos tiene escritos
      la clase de verdad
    - la explicación, del comentario que hay dentro de esa clase
    - los números del límite, de settings.py

  Si mañana alguien añade una ruta, aparece aquí sola. Si borra otra,
  desaparece sola. No hay nada que mantener.

⚠️ ESTA ES LA ÚNICA VENTANILLA SIN CLAVE, y a propósito: para pedir una
  clave hay que saber cómo, y no se puede exigir tener ya la llave para
  poder leer dónde está la cerradura. Aquí no hay ni un dato de ningún
  alumno, solo texto explicando el funcionamiento.
"""

import inspect
import json
import re

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .limites import DemasiadasPeticiones, LimiteLectura

VERBOS = ('get', 'post', 'put', 'patch', 'delete')


def _metodos_de(vista):
    """
    Qué verbos admite de verdad una vista.

    Se mira si la clase tiene escrito un método con ese nombre. No hay
    forma de que esto mienta: si alguien borra el `def delete`, deja de
    salir en la lista al instante.
    """
    return [v.upper() for v in VERBOS if hasattr(vista, v)]


def _explicacion_de(vista):
    """El comentario de la clase, en líneas sueltas y sin la sangría."""
    texto = inspect.getdoc(vista) or ''
    return [linea for linea in texto.splitlines() if linea.strip()]


def _sin_jerga(ruta):
    """
    Django escribe las rutas con hueco como '<str:login>' o '<int:pk>'.
    Eso es para el ordenador; a una persona hay que enseñarle '<login>'.
    """
    ruta = re.sub(r'<(?:str|int|slug):pk>', '<id>', ruta)
    return re.sub(r'<(?:str|int|slug):([a-z_]+)>', r'<\1>', ruta)


def _pide_clave(vista):
    """¿Esta ventanilla exige clave? Se mira su permiso de verdad."""
    return permissions.AllowAny not in getattr(vista, 'permission_classes', [])


def _ejemplo_curl(base, ruta, metodo, cuerpo, con_clave=True):
    """Un ejemplo que se puede copiar y pegar tal cual en la terminal."""
    trozos = ['curl -k']
    if metodo != 'GET':
        trozos.append(f'-X {metodo}')
    if con_clave:
        trozos.append('-H "X-API-Key: $CLAVE"')
    if cuerpo:
        trozos.append('-H "Content-Type: application/json"')
        trozos.append(f"-d '{json.dumps(cuerpo, ensure_ascii=False)}'")
    trozos.append(f'{base}{ruta}')
    return ' '.join(trozos)


class PortadaView(APIView):
    """
    La portada de la API: qué es, cómo se entra y qué se puede pedir.
    """
    # Sin clave: ver la explicación de arriba del fichero.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LimiteLectura]

    def throttled(self, request, wait):
        raise DemasiadasPeticiones(wait)

    def get(self, request):
        # Se importa aquí dentro y no arriba porque urls.py importa este
        # fichero: si nos importáramos el uno al otro al arrancar, Python
        # se quedaría dando vueltas. Al hacerlo dentro de la función, para
        # cuando alguien pide la portada las rutas ya están cargadas.
        from . import urls

        base = request.build_absolute_uri('/api/publica')
        limites = settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']

        ventanillas = []
        for regla in urls.urlpatterns:
            vista = regla.callback.cls          # la clase de la vista
            ruta = _sin_jerga('/' + str(regla.pattern))
            metodos = _metodos_de(vista)
            cuerpo = getattr(vista, 'ejemplo_cuerpo', None)
            clave = _pide_clave(vista)
            ventanillas.append({
                'ruta': f'/api/publica{ruta}',
                'metodos': metodos,
                'necesita_clave': clave,
                'que_hace': _explicacion_de(vista),
                'ejemplos': [
                    _ejemplo_curl(base, ruta, m,
                                  cuerpo if m in ('POST', 'PUT', 'PATCH') else None,
                                  con_clave=clave)
                    for m in metodos
                ],
            })

        return Response({
            'api': 'Álbum de cromos de 42 Madrid',
            'version': 1,
            'que_es': [
                'Una ventanilla para que un programa (un script, un bot, una '
                'hoja de cálculo) pueda consultar el álbum y jugar sin pasar '
                'por el navegador.',
                'Cualquier alumno registrado puede sacarse su clave desde su '
                'perfil. La clave va SIEMPRE en la cabecera X-API-Key.',
                'Que sea "pública" quiere decir que está documentada y abierta '
                'a cualquier alumno, no que esté al aire: sin clave no se ve '
                'ningún dato.',
            ],
            'como_entrar': {
                'cabecera': 'X-API-Key: <tu clave>',
                'por_que_en_la_cabecera': (
                    'Y no en la dirección: las direcciones se quedan escritas '
                    'en los registros del servidor, en el historial y en los '
                    'intermediarios. Las cabeceras no.'
                ),
                'donde_conseguirla': 'En tu perfil, o por POST /api/publica/claves/ '
                                     'si ya tienes una.',
                'se_ve_una_vez': 'De la clave solo guardamos una huella, así que '
                                 'ni nosotros podemos volver a enseñártela. '
                                 'Cópiala al crearla.',
                'ejemplo': f'curl -k -H "X-API-Key: $CLAVE" {base}/mi-album/',
            },
            'limite_de_peticiones': {
                'leer': limites['api_lectura'],
                'escribir': limites['api_escritura'],
                'se_cuenta_por': 'clave, no por dirección IP (en el campus todos '
                                 'salimos por la misma línea y compartiríamos cupo)',
                'al_pasarse': 'HTTP 429 con la cabecera Retry-After diciendo '
                              'cuántos segundos hay que esperar.',
            },
            'paginacion': {
                'parametros': '?pagina=1&por_pagina=50',
                'maximo_por_pagina': 100,
                'respuesta': '{"total": .., "pagina": .., "paginas": .., '
                             '"resultados": [..]}',
            },
            'errores': {
                '400': 'Falta algo o no cumple una regla del juego. El texto lo dice.',
                '401': 'Sin clave, clave mal escrita o clave desactivada.',
                '403': 'Tienes clave pero eso no es para ti (por ejemplo, '
                       'intercambiar con quien no es amigo tuyo).',
                '404': 'No existe. También sale si es de otro alumno: lo que no '
                       'es tuyo, para ti no existe.',
                '429': 'Demasiadas peticiones. Mira Retry-After.',
            },
            'ventanillas': ventanillas,
        }, status=status.HTTP_200_OK)
