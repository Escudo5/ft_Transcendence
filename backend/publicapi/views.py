"""
🚪 LAS VENTANILLAS DE LA API PÚBLICA — las de leer

Aquí están los GET: consultar el catálogo, consultar tu álbum y consultar
la ficha de un alumno. Los de escribir van en otro fichero.

TRES COSAS QUE SE REPITEN EN TODAS Y ESTÁN EN LA CLASE BASE:

  1. Quién puede entrar: la clave de API O la sesión de siempre. Las dos,
     porque así la misma dirección vale para un script de fuera y para
     probarlo tú desde el navegador ya logueado.

  2. El límite de peticiones.

  3. Que hay que estar identificado. NO es una API abierta a cualquiera:
     aquí hay datos de alumnos de 42 y nadie de fuera tiene por qué
     verlos. "Pública" quiere decir que está documentada y que cualquier
     alumno puede pedir su clave, no que esté al aire.

⚠️ QUÉ SE DEVUELVE Y QUÉ NO:
  De cada alumno salen su login, su foto y sus datos de juego. NO sale el
  correo, ni el nombre real, ni nada que la Intra no enseñe ya. Es la
  misma línea que sigue el resto del proyecto y lo que toca por el RGPD:
  si un dato no hace falta para jugar, no viaja.
"""

from django.contrib.auth import get_user_model
from django.core.paginator import Paginator
from django.db.models import Q, Sum
from rest_framework import permissions, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView

from cards.models import Card, UserCard

from .autenticacion import AutenticacionPorClave
from .limites import DemasiadasPeticiones, LimiteEscritura, LimiteLectura

User = get_user_model()

# Cuántas cartas se mandan de una vez si no se pide otra cosa, y el techo.
#
# Hace falta paginar porque el catálogo va a tener 771 cartas: mandarlas
# todas en cada petición es medio megabyte por consulta para que quien
# pregunta mire las diez primeras. El techo existe para que nadie pueda
# saltarse el límite de peticiones pidiendo ?por_pagina=100000.
POR_PAGINA = 50
POR_PAGINA_MAX = 100


class MezclaApiPublica:
    """
    Todo lo que convierte una vista normal en una ventanilla de la API
    pública, en un sitio y sin nada más dentro.

    Va como "mezcla" (una clase suelta que se añade a otra) en vez de
    como clase base y ya está, porque así se le puede pegar a las vistas
    que YA existen en cards/. Ver escritura.py: allí el intercambio de la
    API pública hereda de la vista del intercambio de siempre y de esta
    mezcla, y con eso tiene las reglas del juego de una y el portero de
    la otra. Cero reglas copiadas.
    """
    authentication_classes = [AutenticacionPorClave, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_throttles(self):
        """
        El límite lo decide el VERBO, no la vista.

        DRF, de serie, pone un único límite por vista. Pero en la misma
        dirección conviven un GET (barato: una consulta) y un POST (caro:
        varias tablas, transacción y bloqueo de filas). Mirando el método
        se le da a cada uno el suyo sin tener que partir las vistas en dos.
        """
        if self.request.method in permissions.SAFE_METHODS:
            return [LimiteLectura()]
        return [LimiteEscritura()]

    def throttled(self, request, wait):
        """DRF llama aquí al cortar. Cambiamos solo el mensaje."""
        raise DemasiadasPeticiones(wait)


class BaseApiPublica(MezclaApiPublica, APIView):
    """De aquí heredan las ventanillas nuevas."""


# ─────────────────────────── AYUDANTES ──────────────────────────────────

def carta_json(carta):
    return {
        'id': carta.id,
        'login': carta.login,
        'titulo': carta.title or carta.login,
        'foto': carta.photo,
        'rareza': carta.tier,
        'coalicion': carta.coalition,
        'nivel': carta.cursus_lvl,
    }


def alumno_json(alumno):
    """Lo que se puede contar de una persona. Ni correo ni nombre real."""
    return {
        'login': alumno.username,
        'nombre': alumno.nombre_mostrado or alumno.username,
        'foto': alumno.foto,
        'bio': alumno.bio,
        'estado': alumno.estado_real,
        'elo': alumno.elo,
    }


def paginar(consulta, request, convertir):
    """
    Parte una lista larga en trozos y devuelve siempre la misma forma:

        {"total": 771, "pagina": 2, "paginas": 16, "resultados": [...]}

    Con el total y el número de páginas, quien pregunta sabe si hay más
    sin tener que adivinarlo pidiendo la siguiente a ver si viene vacía.
    """
    try:
        por_pagina = int(request.query_params.get('por_pagina', POR_PAGINA))
    except ValueError:
        por_pagina = POR_PAGINA
    por_pagina = max(1, min(por_pagina, POR_PAGINA_MAX))

    paginador = Paginator(consulta, por_pagina)
    try:
        numero = int(request.query_params.get('pagina', 1))
    except ValueError:
        numero = 1
    # get_page no revienta si pides la página 999: te da la última.
    pagina = paginador.get_page(numero)

    return {
        'total': paginador.count,
        'pagina': pagina.number,
        'paginas': paginador.num_pages,
        'por_pagina': por_pagina,
        'resultados': [convertir(x) for x in pagina.object_list],
    }


# ─────────────────────────── VENTANILLAS ────────────────────────────────

class CatalogoView(BaseApiPublica):
    """
    GET /api/publica/catalogo/

    Todas las cartas que existen, las tengas o no. Filtros opcionales:

        ?buscar=konrad      por login, título o coalición
        ?rareza=Bronce      solo de esa rareza
        ?coalicion=...      solo de esa coalición
        ?pagina=2&por_pagina=20
    """

    def get(self, request):
        cartas = Card.objects.all().order_by('login')

        buscar = request.query_params.get('buscar', '').strip()
        if buscar:
            cartas = cartas.filter(
                Q(login__icontains=buscar)
                | Q(title__icontains=buscar)
                | Q(coalition__icontains=buscar)
            )

        rareza = request.query_params.get('rareza', '').strip()
        if rareza:
            cartas = cartas.filter(tier__iexact=rareza)

        coalicion = request.query_params.get('coalicion', '').strip()
        if coalicion:
            cartas = cartas.filter(coalition__iexact=coalicion)

        return Response(paginar(cartas, request, carta_json),
                        status=status.HTTP_200_OK)


class MiAlbumView(BaseApiPublica):
    """
    GET /api/publica/mi-album/

    Tus cartas, con cuántas copias tienes de cada una, y un resumen de
    cómo va el álbum.

    Fíjate en que NO lleva ningún login en la dirección: siempre devuelve
    las cartas de quien manda la clave. Así es imposible pedir el álbum
    de otro por error o a propósito.

    Filtros: ?repetidas=1 (solo las que tienes más de una vez),
             ?buscar=..., ?pagina=..., ?por_pagina=...
    """

    def get(self, request):
        mias = (UserCard.objects
                .filter(user=request.user)
                .select_related('card')
                .order_by('card__login'))

        if request.query_params.get('repetidas') in ('1', 'true', 'si'):
            mias = mias.filter(cantidad__gt=1)

        buscar = request.query_params.get('buscar', '').strip()
        if buscar:
            mias = mias.filter(Q(card__login__icontains=buscar)
                               | Q(card__title__icontains=buscar))

        def convertir(uc):
            return {**carta_json(uc.card),
                    'copias': uc.cantidad,
                    'conseguida': uc.fecha_obtencion.isoformat()}

        datos = paginar(mias, request, convertir)

        # El resumen se calcula sobre el álbum ENTERO, no sobre la página
        # que se esté mirando ni sobre los filtros. Si no, "llevas 12 de
        # 771" cambiaría según lo que hubieras buscado.
        todas = UserCard.objects.filter(user=request.user)
        distintas = todas.count()
        total_catalogo = Card.objects.count()
        datos['resumen'] = {
            'distintas': distintas,
            'catalogo': total_catalogo,
            'porcentaje': round(distintas * 100 / total_catalogo, 1) if total_catalogo else 0,
            'copias_totales': todas.aggregate(n=Sum('cantidad'))['n'] or 0,
            'repetidas': todas.filter(cantidad__gt=1).count(),
        }
        return Response(datos, status=status.HTTP_200_OK)


class AlumnoView(BaseApiPublica):
    """
    GET /api/publica/alumnos/<login>/

    La ficha de un alumno: sus datos públicos, su carta si la tiene y
    cómo lleva el álbum.

    ⚠️ Del álbum de otro se dice CUÁNTAS lleva, no CUÁLES. Saber que
    alguien va por 300 es parte del juego (es lo que sale en el ranking);
    ver su colección carta a carta no aporta nada y son datos suyos.
    """

    def get(self, request, login):
        alumno = User.objects.filter(username__iexact=login).first()
        if alumno is None:
            return Response({'detail': f'No hay ningún alumno con el login {login}.'},
                            status=status.HTTP_404_NOT_FOUND)

        datos = alumno_json(alumno)
        carta = Card.objects.filter(login__iexact=login).first()
        datos['carta'] = carta_json(carta) if carta else None
        datos['album'] = {
            'distintas': UserCard.objects.filter(user=alumno).count(),
            'catalogo': Card.objects.count(),
        }
        return Response(datos, status=status.HTTP_200_OK)
