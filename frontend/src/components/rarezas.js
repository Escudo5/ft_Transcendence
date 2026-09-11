/* ===========================================================================
   🎴 LAS RAREZAS, EN UN SOLO SITIO DEL FRONT

   El equivalente en el navegador de backend/cards/rarezas.py.

   POR QUÉ EXISTE ESTE FICHERO: hoy (10/09) los nombres de las rarezas
   estaban escritos a mano en OCHO sitios del proyecto. Al cambiarlos, los
   ocho se quedaron viejos a la vez y ninguno dio un error: un sobre común
   pasó a dar un 11% de legendarias en silencio. El arreglo de fondo no es
   parchear los ocho, es que vivan en uno.

   Así que si algún día cambian las rarezas: aquí y en cards/rarezas.py.

   ⚠️ SEA HONESTO: quedan dos sitios más que escriben nombres de rareza, pero
   NO son copias de esto, son otros diccionarios distintos:

     - Intercambio.jsx    rareza -> emoji
     - TiendaSobres.jsx   qué rarezas quema cada tipo de sobre

   Si se renombra una rareza hay que pasar por los dos. Se podrían traer aquí,
   pero mezclar "de qué color es" con "qué sobre da" en el mismo fichero
   tampoco ayuda. Queda anotado para que nadie se lo encuentre por sorpresa.
   =========================================================================== */

// De menos rara a más rara. El orden importa: lo usa la ordenación por rareza.
export const RAREZAS = ['Común', 'Épica', 'Transcender', 'Legendaria'];

/* El color de cada rareza, sacado de las variables de styles.css.
 *
 * ⚠️ Los nombres NO coinciden con los de las variables, y no es un error:
 * "common/rare/epic/legendary" son los cuatro colores que trae el sistema de
 * diseño (gris, azul, morado, dorado) y nuestras rarezas se llaman de otra
 * forma. Lo que importa es que el color suba conforme sube la rareza, y eso
 * sí se cumple. */
export const COLOR_RAREZA = {
  'Común': 'var(--rarity-common)',
  'Épica': 'var(--rarity-rare)',
  'Transcender': 'var(--rarity-epic)',
  'Legendaria': 'var(--rarity-legendary)',
};

/* El mismo dato pero como nombre de clase, para los sitios que usan las
 * clases de Sergio (card-item rarity-*, ui-badge-*) en vez de un color. */
export const CLASE_RAREZA = {
  'Común': 'common',
  'Épica': 'rare',
  'Transcender': 'epic',
  'Legendaria': 'legendary',
};
