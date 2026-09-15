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

2. Si alguien es del staff se sabe por `user["staff?"]`, que YA VIENE en
   las dos rutas. No hace falta mirar los logros: eso obliga a pedir el
   perfil ampliado de cada alumno, o sea ~800 peticiones de más sobre un
   límite de 1200 a la hora. Comprobado con el censo entero del campus:
   `staff?`, `kind == "admin"` y no tener grade señalan a las mismas 26
   personas.
"""

# El 42cursus. El 9 es la piscina, y NO cuenta para la carta.
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
        # Vino de /users/<login>: el usuario arriba, los cursus dentro.
        usuario = json_api
        cursus = next(
            (c for c in json_api.get("cursus_users") or []
             if c.get("cursus_id") == CURSUS_TRONCO),
            {},
        )
    else:
        # Vino de /cursus_users: el cursus arriba, el usuario dentro.
        usuario = json_api.get("user") or {}
        cursus = json_api

    imagen = usuario.get("image") or {}

    return {
        "login":     usuario.get("login"),
        "id":        usuario.get("id"),
        "foto":      (imagen.get("versions") or {}).get("medium"),
        "wallet":    usuario.get("wallet") or 0,
        "puntos":    usuario.get("correction_point") or 0,
        # 👔 La marca del staff, sin pedir el perfil ampliado.
        "staff":     bool(usuario.get("staff?")),
        "nivel":     cursus.get("level") or 0.0,
        "grade":     cursus.get("grade"),
        # 🏁 Cuándo se cerró su cursus. Vacío mientras sigue.
        "fin":       cursus.get("end_at"),
        # ⏳ Su fecha límite. La tiene TODO alumno vivo del tronco común,
        #    así que tenerla NO significa haber caído: hay que mirar si ya
        #    pasó. Al pasar el tronco común desaparece.
        "blackhole": cursus.get("blackholed_at"),
    }
