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


def rareza_por_nivel(nivel):
    """
    El nivel del cursus -> la rareza de su carta.

    Admite None y textos raros sin reventar: cualquier cosa que no sea un
    número cuenta como nivel 0, o sea Común. Es a propósito: si la Intra
    devuelve un dato incompleto de alguien, preferimos una carta común a
    que se caiga la carga entera del catálogo a mitad.
    """
    try:
        nivel = float(nivel)
    except (TypeError, ValueError):
        return COMUN

    for minimo, rareza in CORTES:
        if nivel >= minimo:
            return rareza
    return COMUN
