"""
🎴 LAS RAREZAS DEL ÁLBUM

Un fichero solo para esto, y pequeño a propósito: es la única fuente de
verdad de qué rareza tiene cada carta, cuánto vale y en qué sobre entra.
Si algún día cambia algo de eso, se toca aquí y solo aquí.

Su gemelo en el navegador es frontend/src/components/rarezas.js, que
tiene los colores. Si se renombra una rareza hay que pasar por los dos.

═══════════════════════════════════════════════════════════════════════
LA REGLA: GRADE Y NIVEL, NO SOLO NIVEL
═══════════════════════════════════════════════════════════════════════

Hasta el 15/09 la rareza salía SOLO del nivel. El problema lo encontró el
equipo con un caso real: `acastrov` tiene nivel 11,57 pero sigue siendo
Cadet, o sea que no ha pasado el tronco común. Por nivel le tocaba
Transcender, y eso es falso: no es un Transcender, es un cadete que está
a punto de serlo.

Así que la regla mira las dos cosas:

    eres staff                  ->  Staff
    grade Cadet                 ->  Junior si nivel < 4, si no Senior
    grade Transcender o Alumni  ->  Legendario si nivel >= 14, si no Transcender

`Alumni` va con Transcender a propósito. En 42 te "alumnizan" cuando,
después de Transcender, pasas más de seis meses sin entregar un proyecto:
**no es un escalón por encima, es alguien que se paró**. Los datos lo
confirman: de los 96 Alumni vivos del campus, 59 están por debajo del
nivel 11, o sea atascados justo al final del tronco común. Si Alumni
fuese la rareza más alta, la carta más valiosa del álbum sería la de
quien se quedó parado.

═══════════════════════════════════════════════════════════════════════
CÓMO QUEDA EL CATÁLOGO (censo real del campus, 15/09/2026)
═══════════════════════════════════════════════════════════════════════

De los 2627 que han pasado por el cursus 21 en el campus 22, entran los
que no tienen el cursus cerrado, a los que no se les ha pasado la fecha
límite hace más de 30 días, y que no sean una cuenta de servicio del
staff. Son 779:

    Junior       305   39,2%
    Senior       183   23,5%
    Transcender  241   30,9%
    Legendario    50    6,4%
    Staff          ?    sale de dentro de esos cuatro

⚠️ EL NÚMERO DE STAFF NO SE SABE TODAVÍA, y no es por vaguería: un alumno
es del staff si tiene el logro 65, y los logros solo vienen en el perfil
ampliado, uno por persona. Contarlos ahora costaría 779 peticiones. Se
sabrá al cargar el catálogo, porque fill_db ya pide ese perfil de todas
formas para sacar el título.

Lo que sí se sabe: esas cartas salen de las cuatro de arriba, no se
suman. `bazuara` (nivel 16,49, Transcender) es Staff, no Legendario.

⚠️ Y OJO CON ESTO AL AJUSTAR EL JUEGO: Transcender (241) es más numeroso
que Senior (183). No es un fallo, es la forma del campus: hay mucho
Transcender que se queda y pocos cadetes de nivel alto. Pero significa
que casi un tercio del álbum es de rareza alta, así que ahí se concentra
el valor. Si algún día se quiere repartir mejor, la palanca son los
PUNTOS de aquí abajo.
"""

JUNIOR = 'Junior'
SENIOR = 'Senior'
TRANSCENDER = 'Transcender'
LEGENDARIO = 'Legendario'
STAFF = 'Staff'

# De menos a más rara. El orden importa: lo usan la ordenación del
# catálogo, "tu carta más rara" del perfil y el contrato, que sube una
# carta al escalón siguiente.
TODAS = (JUNIOR, SENIOR, TRANSCENDER, LEGENDARIO, STAFF)

# Los dos cortes por nivel de la regla de arriba.
NIVEL_SENIOR = 4.0        # dentro de los Cadet
NIVEL_LEGENDARIO = 14.0   # dentro de los que pasaron el tronco común

# Los grades de la Intra que significan "ya pasó el tronco común".
GRADES_PASADO_TRONCO = ('Transcender', 'Alumni')


def rareza_de(grade, nivel, es_staff=False):
    """
    La rareza de una carta a partir de su grade y su nivel.

    No recibe JSON a propósito: para eso está cards/intra.py, que traduce
    las dos formas en que la API devuelve un alumno. Aquí llegan datos
    limpios y esta función solo decide.

    NUNCA devuelve vacío. Si el grade falta o es raro (un piscinero, un
    dato incompleto de la Intra), devuelve Junior. Es a propósito: una
    versión anterior devolvía "" cuando no encajaba nada, no daba ningún
    error, y se habrían guardado ~800 cartas sin rareza sin que nadie se
    enterase. Antes una carta común mal puesta que una carta rota.
    """
    if es_staff:
        return STAFF

    try:
        nivel = float(nivel)
    except (TypeError, ValueError):
        nivel = 0.0

    if grade in GRADES_PASADO_TRONCO:
        return LEGENDARIO if nivel >= NIVEL_LEGENDARIO else TRANSCENDER

    # Cadet, y también cualquier cosa que no reconozcamos.
    return SENIOR if nivel >= NIVEL_SENIOR else JUNIOR


# ══════════════════════════════════════════════════════════════════════
# 🏆 LO QUE VALE CADA CARTA
# ══════════════════════════════════════════════════════════════════════
#
# Con las 779 del censo (y sin saber aún cuántas se irán a Staff):
#
#   Junior       305 x  10 =  3.050
#   Senior       183 x  25 =  4.575
#   Transcender  241 x  60 = 14.460
#   Legendario    50 x 200 = 10.000
#   Staff          ? x 300
#
# Un Staff vale 30 Junior. Cuando se sepa cuántos son, conviene repasar
# este número: si salieran muchos dejaría de ser la rareza especial, y si
# salen cuatro gatos igual hasta se queda corto.
#
# ⚠️ SOLO CUENTAN LAS CARTAS DISTINTAS. Tener 10 copias de la misma no da
# más puntos que tener una, a propósito: si no, acumular sin intercambiar
# sería una estrategia, y lo que queremos premiar es completar el álbum.
# Las repetidas valen para cambiarlas, y al cambiarlas sí suben los puntos.
PUNTOS = {
    JUNIOR: 10,
    SENIOR: 25,
    TRANSCENDER: 60,
    LEGENDARIO: 200,
    STAFF: 300,
}


def puntos_de(rareza):
    """Lo que vale una carta de esa rareza. Lo que no conozcamos, 0."""
    return PUNTOS.get(rareza, 0)


# ══════════════════════════════════════════════════════════════════════
# 🎁 LOS SOBRES
# ══════════════════════════════════════════════════════════════════════
#
# Qué probabilidad tiene cada rareza de salir, carta por carta. Cada
# sobre trae CARTAS_POR_SOBRE cartas y se tira una vez por cada una.
#
# ⚠️ ESTOS NÚMEROS SON DE EQUILIBRIO DEL JUEGO, no de programación. Se
# pueden mover sin miedo, pero cada fila tiene que sumar 100.
#
# El sobre común es el regalo diario. Los otros dos solo se consiguen
# quemando repetidas (ver RAREZAS_POR_SOBRE), así que son la recompensa
# de jugar, no de esperar.
PROBABILIDADES_SOBRE = {
    'comun': {JUNIOR: 55, SENIOR: 30, TRANSCENDER: 13, LEGENDARIO: 1.5, STAFF: 0.5},
    'raro':  {JUNIOR: 35, SENIOR: 33, TRANSCENDER: 25, LEGENDARIO: 5,   STAFF: 2},
    'epico': {JUNIOR: 20, SENIOR: 28, TRANSCENDER: 35, LEGENDARIO: 12,  STAFF: 5},
}

CARTAS_POR_SOBRE = 5

# Qué rareza hay que quemar para llevarse cada sobre. Lo usa el descarte
# (cards/intercambios.py): 4 copias de la misma carta dan un sobre de la
# calidad que corresponda, y siempre te queda una copia.
#
# Son tres sobres y cinco rarezas, así que las tres de arriba comparten
# el sobre épico.
RAREZAS_POR_SOBRE = {
    'comun': {JUNIOR},
    'raro':  {SENIOR},
    'epico': {TRANSCENDER, LEGENDARIO, STAFF},
}
