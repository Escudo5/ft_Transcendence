"""
✍️ LAS VENTANILLAS DE ESCRIBIR — POST, PUT y DELETE

⚠️ LO MÁS IMPORTANTE DE ESTE FICHERO ES LO QUE **NO** TIENE:

  No hay ni una sola regla del juego. Ni "solo entre amigos", ni "los dos
  tienen que tenerla repetida", ni las transacciones, ni los bloqueos de
  filas. Todo eso ya está escrito y probado en cards/intercambios.py, y
  aquí se HEREDA tal cual.

  Lo único que cambia es el portero: quien entra por aquí lo hace con una
  clave de API en vez de con la cookie del navegador.

  Es la diferencia entre tener las reglas en un sitio o tenerlas en dos.
  Si mañana decidimos que los intercambios caducan a los 5 días en vez de
  a los 3, se cambia UNA vez y cambia en los dos lados. Copiando el
  código, tarde o temprano uno de los dos se queda viejo, y eso es un
  agujero de seguridad esperando: la puerta de atrás con las reglas
  antiguas.

Lo que sí es nuevo aquí es la gestión de las claves (crear, renombrar,
desactivar y borrar), porque eso no existía en ninguna parte.
"""

from rest_framework import status
from rest_framework.response import Response

from cards.intercambios import (DescartarView, IntercambiosView,
                                ResponderIntercambioView)

from .models import ClaveApi
from .views import BaseApiPublica, MezclaApiPublica

# Cuántas claves puede tener cada alumno a la vez.
#
# El límite existe porque desde la API se pueden crear claves, y sin tope
# un script en bucle llenaría la tabla de claves basura. Cinco son de
# sobra para lo que puede querer alguien: una por programa.
MAX_CLAVES = 5


# ══════════════════ LO QUE YA EXISTÍA, CON OTRA PUERTA ══════════════════

class IntercambiosApiView(MezclaApiPublica, IntercambiosView):
    """
    GET  /api/publica/intercambios/   -> mis propuestas
    POST /api/publica/intercambios/   -> proponer un cambio
        {"para": "<login>", "carta_ofrecida": <id>, "carta_pedida": <id>}
    """


class IntercambioApiView(MezclaApiPublica, ResponderIntercambioView):
    """
    PUT    /api/publica/intercambios/<id>/  {"accion": "aceptar"|"rechazar"}
    DELETE /api/publica/intercambios/<id>/  -> retirar la que enviaste yo
    """

    def put(self, request, pk):
        """
        La vista de siempre responde a PATCH, que es lo correcto cuando
        cambias un trocito de algo. Se añade PUT porque el subject pide
        expresamente los cuatro verbos, y para quien use la API es más
        fácil acordarse de PUT.

        No se copia nada: se llama al PATCH de la clase de la que
        heredamos.
        """
        return self.patch(request, pk)


class DescartarApiView(MezclaApiPublica, DescartarView):
    """
    GET  /api/publica/descartar/   -> qué cartas tienes repetidas 4 veces
    POST /api/publica/descartar/   -> canjearlas, con {"carta": <id>}
    """


# ══════════════════════════ LAS CLAVES ══════════════════════════════════

def clave_json(c):
    """
    Nunca, en ningún caso, la clave. Solo con qué reconocerla.

    Y no es que se nos olvide incluirla: es que NO LA TENEMOS. En la base
    solo está su huella. Ni nosotros podríamos enseñársela a nadie.
    """
    return {
        'id': c.id,
        'nombre': c.nombre,
        'prefijo': c.prefijo,
        'activa': c.activa,
        'creada': c.created_at.isoformat(),
        'ultimo_uso': c.ultimo_uso.isoformat() if c.ultimo_uso else None,
    }


class ClavesView(BaseApiPublica):
    """
    GET  /api/publica/claves/   -> mis claves
    POST /api/publica/claves/   -> crear una, con {"nombre": "..."}

    ⚠️ El POST es el ÚNICO sitio de todo el proyecto donde una clave
    viaja en claro, y solo esa vez. Quien la pide tiene que copiarla en
    ese momento: no hay forma de volver a verla, ni para él ni para
    nosotros. Si la pierde, borra esa y crea otra.
    """

    def get(self, request):
        claves = ClaveApi.objects.filter(usuario=request.user)
        return Response({
            'total': claves.count(),
            'maximo': MAX_CLAVES,
            'resultados': [clave_json(c) for c in claves],
        }, status=status.HTTP_200_OK)

    def post(self, request):
        nombre = str(request.data.get('nombre', '')).strip()
        if not nombre:
            return Response({'detail': 'Ponle un nombre para saber luego para qué era.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if len(nombre) > 60:
            return Response({'detail': 'El nombre no puede pasar de 60 caracteres.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if ClaveApi.objects.filter(usuario=request.user).count() >= MAX_CLAVES:
            return Response(
                {'detail': f'Ya tienes {MAX_CLAVES} claves, que es el máximo. '
                           f'Borra alguna que no uses.'},
                status=status.HTTP_400_BAD_REQUEST)

        objeto, en_claro = ClaveApi.crear(request.user, nombre)
        return Response({
            **clave_json(objeto),
            'clave': en_claro,
            'aviso': 'Cópiala ahora: no se guarda y no vas a poder verla otra vez.',
            'como_usarla': f'Mándala en la cabecera  X-API-Key: {en_claro[:8]}…',
        }, status=status.HTTP_201_CREATED)


class ClaveView(BaseApiPublica):
    """
    PUT    /api/publica/claves/<id>/  {"activa": false} y/o {"nombre": "..."}
    DELETE /api/publica/claves/<id>/  -> borrarla del todo

    POR QUÉ HAY LAS DOS COSAS, DESACTIVAR Y BORRAR:
      Desactivar es reversible: si sospechas que se te ha escapado la
      clave, la apagas al momento y, si era una falsa alarma, la vuelves
      a encender. Borrar no tiene vuelta atrás.
      Ante una sospecha, lo que hay que poder hacer rápido es lo
      reversible; si no, la gente duda y tarda.
    """

    def _mia(self, request, pk):
        """
        Filtrar SIEMPRE por usuario, no solo por id.

        Si buscáramos solo por id y luego comprobáramos el dueño, un
        despiste al escribir el `if` dejaría a cualquiera tocar las
        claves de otro. Metiéndolo en la consulta, la clave de otro
        sencillamente no existe para ti: sale el mismo 404 que si te
        inventaras el número.
        """
        return ClaveApi.objects.filter(pk=pk, usuario=request.user).first()

    def put(self, request, pk):
        clave = self._mia(request, pk)
        if clave is None:
            return Response({'detail': 'Esa clave no existe.'},
                            status=status.HTTP_404_NOT_FOUND)

        cambios = []
        if 'nombre' in request.data:
            nombre = str(request.data.get('nombre', '')).strip()
            if not nombre:
                return Response({'detail': 'El nombre no puede quedarse vacío.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if len(nombre) > 60:
                return Response({'detail': 'El nombre no puede pasar de 60 caracteres.'},
                                status=status.HTTP_400_BAD_REQUEST)
            clave.nombre = nombre
            cambios.append('nombre')

        if 'activa' in request.data:
            valor = request.data.get('activa')
            # Llega como texto si la petición va en formulario, y como
            # booleano si va en JSON. Se admiten las dos formas.
            clave.activa = valor in (True, 'true', 'True', '1', 1, 'si')
            cambios.append('activa')

        if not cambios:
            return Response({'detail': 'No has dicho qué cambiar. Manda "nombre" y/o "activa".'},
                            status=status.HTTP_400_BAD_REQUEST)

        clave.save(update_fields=cambios)
        return Response(clave_json(clave), status=status.HTTP_200_OK)

    def delete(self, request, pk):
        clave = self._mia(request, pk)
        if clave is None:
            return Response({'detail': 'Esa clave no existe.'},
                            status=status.HTTP_404_NOT_FOUND)

        # Si alguien borra la clave con la que está entrando ahora mismo,
        # que lo sepa: la siguiente petición ya le va a dar 401.
        se_esta_borrando_la_suya = getattr(request.auth, 'pk', None) == clave.pk
        nombre = clave.nombre
        clave.delete()

        return Response({
            'detail': f'Clave "{nombre}" borrada.',
            'ojo': ('Es la clave con la que acabas de entrar: a partir de '
                    'ahora dejará de funcionar.') if se_esta_borrando_la_suya else None,
        }, status=status.HTTP_200_OK)
