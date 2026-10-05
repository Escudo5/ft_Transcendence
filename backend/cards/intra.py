"""
🔌 LEER LA API DE 42 SIN IMPORTAR POR DÓNDE ENTRE EL DATO

═══════════════════════════════════════════════════════════════════════
POR QUÉ EXISTE ESTE FICHERO
═══════════════════════════════════════════════════════════════════════

Sacamos alumnos por DOS rutas distintas de la API, y las dos traen los
mismos datos pero puestos del revés:

    /users/<login>      el usuario va arriba y sus cursus DENTRO de él
                        -> el nivel está en json["cursus_users"][n]["level"]

    /cursus_users       el cursus va arriba y el usuario DENTRO de él
                        -> el nivel está en json["level"]

Eso ya nos costó un rato: `login_card` funcionaba y `fill_db` no, con el
mismo código, porque el JSON que le llegaba tenía otra forma. Y lo peor es
que no daba error: simplemente no encontraba el grade y devolvía una
rareza vacía, así que se habrían guardado ~800 cartas sin rareza y en
silencio.

La solución no es hacer que cada sitio sepa de qué ruta viene el dato, es
traducir las dos formas a una sola aquí, y que a partir de este punto
nadie más tenga que enterarse.

═══════════════════════════════════════════════════════════════════════
DOS TRAMPAS COMPROBADAS CONTRA LA API DE VERDAD (15/09)
═══════════════════════════════════════════════════════════════════════

1. `/users/<login>` devuelve VARIOS cursus, no uno. Para nmagro-r vienen
   dos: la piscina (cursus 9, nivel 3,64, grade "Pisciner") y el tronco
   común (cursus 21, nivel 8,48, grade "Cadet"). Si no se filtra por
   cursus_id se puede coger el de la piscina y sale una carta con los
   datos equivocados, otra vez sin ningún error.

2. EL STAFF TIENE DOS CUENTAS, y la que nos interesa es la de alumno.

   Cuando alguien de 42 entra a trabajar en el campus no pierde su cuenta
   de alumno: le crean ADEMÁS una cuenta de staff aparte. Por ejemplo
   `bazuara` es la cuenta de alumno y `sultan` la de staff.

   Comprobado el 15/09 contra la Intra:

       bazuara   kind=student  staff?=False  ->  logro 65 SÍ
       sultan    kind=admin    staff?=True   ->  logro 65 no

   O sea que `user["staff?"]` marca justo las cuentas que hay que TIRAR:
   son cuentas de servicio con nivel 0 y sin cursus, y entre ellas hay
   hasta bots (marvin, 42madrid_tech, madridbocal).

   La señal buena es el LOGRO 65 en la cuenta de alumno, que se llama
   "Come to the dark side, we have cookies". Eso obliga a mirar el perfil
   ampliado, pero no cuesta ninguna petición de más: fill_db ya lo pide
   para cada alumno, para sacarle el título.
"""
CURSUS_TRONCO = 21


def datos_del_alumno(json_api):
    """
    Devuelve siempre el mismo diccionario, venga el JSON de donde venga.

    Lo que sale de aquí es lo único que necesitan `rareza_de` y los
    filtros del catálogo, así que a partir de este punto ya da igual qué
    ruta de la API se usó.

    Si al alumno le falta el tronco común (por ejemplo un piscinero), el
    nivel sale 0 y el grade None. No revienta a propósito: preferimos una
    carta rara antes que tumbar la carga entera del catálogo a la mitad.
    """
    if "cursus_users" in json_api:
        usuario = json_api
        cursus = next(
            (c for c in json_api.get("cursus_users") or []
             if c.get("cursus_id") == CURSUS_TRONCO),
            {},
        )
    else:
        usuario = json_api.get("user") or {}
        cursus = json_api

    imagen = usuario.get("image") or {}

    return {
        "login":     usuario.get("login"),
        "id":        usuario.get("id"),
        "foto":      ((imagen.get("versions") or {}).get("large")
                      or (imagen.get("versions") or {}).get("medium")),
        "wallet":    usuario.get("wallet") or 0,
        "puntos":    usuario.get("correction_point") or 0,
        "activo":    bool(usuario.get("active?")),
        "cuenta_staff": bool(usuario.get("staff?")),
        "nivel":     cursus.get("level") or 0.0,
        "grade":     cursus.get("grade"),
        "fin":       cursus.get("end_at"),

        # ⚠️ NO vale para filtrar: la Intra no la mantiene al día (hay 176
        # personas con fecha pasada y la cuenta activa). El corte es "fin".
        "blackhole": cursus.get("blackholed_at"),
    }

LOGRO_STAFF = 65


def es_alumno_del_staff(perfil_ampliado):
    """
    ¿Esta persona, siendo alumno, trabaja además en el campus?

    Hay que pasarle el perfil ampliado (/users/<login> o /users/<id>),
    porque los logros NO vienen en el listado de /cursus_users. No es un
    gasto extra: fill_db ya pide ese perfil para cada alumno, para sacarle
    el título.

    Esto es lo que decide que una carta sea Staff, no la marca `staff?`:
    esa señala la cuenta aparte que les crean, que no queremos.
    """
    for logro in perfil_ampliado.get("achievements") or []:
        if logro.get("id") == LOGRO_STAFF:
            return True
    return False
