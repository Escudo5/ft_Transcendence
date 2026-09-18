"""
🟢 LA SEÑAL DE VIDA

Anota "esta persona sigue por aquí" en cada petición que llega con sesión
abierta. De esto depende que tus amigos te vean en línea.

═══════════════════════════════════════════════════════════════════════
POR QUÉ HIZO FALTA
═══════════════════════════════════════════════════════════════════════

Hasta el 18/09 `ultima_actividad` se refrescaba SOLO en /api/users/me/, que
el front llama al abrir la página y poco más. Pero el chat pregunta al
servidor cada 3 segundos, y esas peticiones no marcaban nada.

Resultado: a los 5 minutos (CustomUser.MINUTOS_PARA_DESCONECTAR) alguien
aparecía DESCONECTADO mientras te estaba escribiendo. Nos pasó con Konrad
el 17/09 y se veía rarísimo: sus mensajes llegaban y el punto seguía gris.

El campo no mentía; es que nadie lo tocaba.

═══════════════════════════════════════════════════════════════════════
POR QUÉ UN MIDDLEWARE Y NO UNA LÍNEA EN CADA VISTA
═══════════════════════════════════════════════════════════════════════

El front tiene seis sondeos repartidos en cinco componentes (el chat, el
contador de mensajes sin leer, los avisos, las propuestas de intercambio…).
Ir vista por vista significa acertar con las seis hoy y acordarse de la
séptima el día que alguien la añada. Aquí pasa TODO, así que no hay nada
que recordar.

═══════════════════════════════════════════════════════════════════════
EL FRENO: UNA ESCRITURA POR MINUTO, NO UNA CADA 3 SEGUNDOS
═══════════════════════════════════════════════════════════════════════

Sin freno, cuatro personas con el chat abierto son ~80 escrituras por
minuto para guardar un dato que solo se consulta con 5 minutos de margen.

Con el freno son 4. Y no hace falta guardar el freno en ningún sitio: la
propia fecha guardada dice cuándo se escribió por última vez.

⚠️ El margen (60 s) tiene que ser MUCHO menor que MINUTOS_PARA_DESCONECTAR
(5 min), o alguien activo se apagaría entre escritura y escritura.
"""

from django.utils import timezone

# Cada cuánto se baja de verdad a la base de datos. Ver el porqué arriba.
SEGUNDOS_ENTRE_ESCRITURAS = 60


class SenalDeVidaMiddleware:
    """Refresca `ultima_actividad` del usuario conectado, como mucho una vez
    por minuto."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        self._marcar(request)
        return self.get_response(request)

    def _marcar(self, request):
        # `request.user` lo pone AuthenticationMiddleware, que va ANTES que
        # este en la lista de settings.py. Si algún día se mueven de orden,
        # este getattr evita que todo el sitio se caiga con un AttributeError.
        usuario = getattr(request, 'user', None)
        if usuario is None or not usuario.is_authenticated:
            return

        ahora = timezone.now()
        anterior = usuario.ultima_actividad

        # Nunca ha dado señales (recién creado) -> hay que escribir sí o sí.
        if anterior is not None:
            if (ahora - anterior).total_seconds() < SEGUNDOS_ENTRE_ESCRITURAS:
                return

        # ⚠️ .update() sobre la consulta, NO usuario.save().
        #
        # Dos motivos:
        #   1. save() escribiría además cualquier campo que la vista haya
        #      tocado a medias en este mismo momento.
        #   2. El regalo diario y los intercambios bloquean la fila con
        #      select_for_update(). Un UPDATE de una sola columna no pelea
        #      con ellos; un save() completo sí podría pisarles el trabajo.
        #
        # ⚠️ Y el modelo se pide con get_user_model(), NO con type(usuario):
        # request.user no es el usuario, es un SimpleLazyObject que lo
        # envuelve, así que type() devuelve la envoltura y no tiene .objects.
        # (Costó un 500 el 18/09; la prueba lo pilló antes de mergear.)
        # Se importa aquí dentro, que es lo normal en un middleware: arriba
        # se ejecutaría antes de que Django tenga las apps cargadas.
        from django.contrib.auth import get_user_model
        get_user_model().objects.filter(pk=usuario.pk).update(ultima_actividad=ahora)

        # Y en memoria también, para que si esta misma petición pregunta por
        # `estado_real` (lo hace /api/users/me/) vea la fecha nueva y no la
        # vieja que venía de la base.
        usuario.ultima_actividad = ahora
