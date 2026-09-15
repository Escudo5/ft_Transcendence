"""
🎴 LAS RAREZAS DEL ÁLBUM

Un fichero solo para esto, y pequeño a propósito: es la única fuente de
verdad de qué rareza tiene cada carta. Lo usan fill_db (al cargar el
catálogo desde la Intra) y el comando recalcular_rarezas (para arreglar
las que ya están guardadas). Si algún día cambian los cortes, se tocan
aquí y cambian en los dos sitios.

═══════════════════════════════════════════════════════════════════════
POR QUÉ LA RAREZA VA POR NIVEL Y NO POR EL "GRADE" DE LA INTRA
═══════════════════════════════════════════════════════════════════════

Antes se sacaba del campo `grade`: Cadet -> Junior/Senior, Transcender ->
Transcender, Alumni -> Alumni. Parecía razonable, pero los datos de
verdad de 42 Madrid (consultados el 10/09/2026) dicen otra cosa:

  Transcender  190 alumnos   98% activos   nivel mediano 11,97
  Alumni        95 alumnos   65% activos   nivel mediano 10,66
                             52 de los 95 atascados entre nivel 10 y 11

En 42 te "alumnizan" cuando, después de Transcender, pasas más de seis
meses sin entregar un proyecto. O sea que **Alumni no es un escalón por
encima de Transcender: es alguien que se quedó parado justo al final del
tronco común**, y un tercio ya ni aparece por el campus.

Con el sistema viejo, la carta más "valiosa" del álbum habría sido la de
quien se atascó. Por eso la rareza va por NIVEL, que sí mide lo que ha
hecho cada uno. `grade` se sigue guardando en la carta como información,
pero no decide nada.

═══════════════════════════════════════════════════════════════════════
DE DÓNDE SALEN LOS CORTES
═══════════════════════════════════════════════════════════════════════

No son inventados. El **nivel 11 es el final del tronco común** (los
Transcender empiezan en 10,45), y el 4 es donde se deja de ser novato.
Con el catálogo real de 719 cartas queda así:

    Común        < 4      285 cartas   40%
    Épica        4 - 11    214 cartas   30%
    Transcender  11 - 14   170 cartas   24%
    Legendaria   14+        50 cartas    7%

Es el único reparto que baja de verdad (40 > 30 > 24 > 7). Cualquier otro
corte se desordena por el tapón de 114 personas que hay entre el nivel 11
y el 12, justo al salir del tronco común.

**Solo 50 legendarias en 719.** Esa escasez es la que hace que valga la
pena buscarlas y cambiarlas.

⚠️ Ojo con las que ya cayeron: la rareza "Blackhole" que existía antes
DESAPARECE. Los alumnos que ya cayeron no entran en el catálogo, así que
no puede haber ninguna carta de esa rareza.
"""

COMUN = 'Común'
EPICA = 'Épica'
TRANSCENDER = 'Transcender'
LEGENDARIA = 'Legendaria'

# De menos a más rara. El orden importa: lo usan el desplegable de filtrar
# y la ordenación del catálogo.
TODAS = (COMUN, EPICA, TRANSCENDER, LEGENDARIA)

# (nivel a partir del cual, rareza). Se recorre de arriba abajo y se coge
# la primera que encaja; si no encaja ninguna, es Común.
CORTES = (
    (14.0, LEGENDARIA),
    (11.0, TRANSCENDER),
    (4.0, EPICA),
)


# ══════════════════════════════════════════════════════════════════════
# 🏆 LO QUE VALE CADA CARTA
# ══════════════════════════════════════════════════════════════════════
#
# Antes, la "puntuación" del perfil era el ELO: un 1000 fijo que no movía
# nada, puesto pensando en un juego de cartas que no existe. Un evaluador
# lo ve igual en todos los perfiles y pregunta, y la respuesta era "no
# hace nada". Ahora ese hueco enseña puntos de verdad.
#
# Y resuelve algo más de fondo: hasta hoy, en el ranking una carta
# Legendaria contaba lo mismo que una Común, así que la rareza solo
# servía para el color y la animación del sobre. Con esto, elegir qué
# cambias y qué descartas pasa a tener consecuencias.
#
# LOS NÚMEROS, Y POR QUÉ ESTOS:
#
#   Común        10  x285 =  2.850
#   Épica        30  x214 =  6.420
#   Transcender  80  x170 = 13.600
#   Legendaria  250  x 50 = 12.500
#                    ────────────
#   Álbum entero        =  35.370
#
# Una legendaria vale 25 comunes, que es más o menos lo que cuesta
# encontrarla (son el 7% del catálogo). Pero fíjate en que los totales por
# rareza quedan parecidos: quien colecciona a lo ancho y quien caza rarezas
# acaban en sitios parecidos. No hay una sola forma buena de jugar.
#
# ⚠️ SOLO CUENTAN LAS CARTAS DISTINTAS. Tener 10 copias de la misma no da
# más puntos que tener una, a propósito: si no, acumular sin intercambiar
# sería una estrategia, y lo que queremos premiar es completar el álbum.
# Las repetidas valen para cambiarlas, y al cambiarlas sí suben los puntos.
PUNTOS = {
    COMUN: 10,
    EPICA: 30,
    TRANSCENDER: 80,
    LEGENDARIA: 250,
}


def puntos_de(rareza):
    """Lo que vale una carta de esa rareza. Lo que no conozcamos, 0."""
    return PUNTOS.get(rareza, 0)


# ══════════════════════════════════════════════════════════════════════
# 🎁 LOS SOBRES
# ══════════════════════════════════════════════════════════════════════
#
# Esto estaba escrito a mano en cards/views.py, y las rarezas viejas
# estaban además repetidas en otros SIETE sitios. Al cambiarlas, todos se
# quedaron viejos a la vez y nadie se enteró: los sobres siguieron
# funcionando porque el código tiene un "si no hay cartas de esa rareza,
# coge cualquiera", así que un sobre común empezó a dar 11% de
# legendarias sin dar ningún error.
#
# Por eso viven aquí ahora: para que cambiar una rareza sea cambiar UN
# fichero, y no acordarse de ocho.
#
# ⚠️ ESTOS NÚMEROS SON DE EQUILIBRIO DEL JUEGO, no de programación. Están
# pensados para que el álbum se pueda completar en algo menos de un año
# viniendo casi todos los días, contando con que además se intercambia.
# Se pueden mover sin miedo: solo hay que cambiarlos aquí.
PROBABILIDADES_SOBRE = {
    'comun': {COMUN: 55, EPICA: 30, TRANSCENDER: 13, LEGENDARIA: 2},
    'raro': {COMUN: 35, EPICA: 33, TRANSCENDER: 25, LEGENDARIA: 7},
    'epico': {COMUN: 20, EPICA: 30, TRANSCENDER: 33, LEGENDARIA: 17},
}

CARTAS_POR_SOBRE = 5

# Qué rareza de carta hace falta descartar para llevarse cada sobre.
# Lo usa el descarte de Sergio (cards/intercambios.py): 4 copias de la
# misma carta te dan un sobre de la calidad que corresponda.
#
# Son tres sobres y cuatro rarezas, así que las dos de arriba comparten
# el sobre épico. Es lo que ya hacía él con las rarezas viejas.
RAREZAS_POR_SOBRE = {
    'comun': {COMUN},
    'raro': {EPICA},
    'epico': {TRANSCENDER, LEGENDARIA},
}


def rareza_por_nivel(nivel, perfil):
    """
    El nivel del cursus -> la rareza de su carta.
    """
    tier = ""
    grade, level = "", 0.0

    for t in perfil.get("cursus_users", {}):
        if t.get("cursus_id") == 21:
            grade = t.get("grade", "")
            level = t.get("level", 0.0) or 0.0
            break

    if grade == "Cadet":
        tier = "Senior" if level >= 4 else "Junior"
    elif grade == "Transcender":
        tier = "Legendaria" if level >= 14 else "Transcender"
    elif grade == "Alumni":
        tier = "Legendaria" if level >= 14 else "Transcender"
    if any(a.get("id") == 65 for a in perfil.get("achievements", [])):
        tier = "Staff"

    return tier