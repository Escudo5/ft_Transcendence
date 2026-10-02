    // Asigna colores, bordes y sombras dinámicas según la rareza/categoría
  // Orden de exclusividad: Junior < Senior < Transcender < Legendario < Staff
  // ⚠️ Nacho, 18/09: los COLORES vuelven a salir de styles.css.
  //
  // Konrad los había escrito a mano aquí, y tres de los cinco no coincidían
  // con los del resto de la web: la misma carta salía dorada al abrir el
  // sobre y ámbar en el catálogo, y el Staff rosa neón aquí y magenta allí.
  //
  // Es el mismo fallo que está contado en rarezas.js: el mismo dato en
  // varios sitios se queda viejo a trozos y sin dar ningún error. Con
  // var(--rarity-*) basta con tocar styles.css y cambia en todas partes.
  //
  // Los RGBA del brillo sí van a mano, porque box-shadow no puede sacar la
  // transparencia de una variable sin color-mix(), y color-mix() es
  // reciente y nos evalúan en Firefox. Cada uno es su var de al lado:
  //     common #94a3b8 · rare #0284c7 · epic #a855f7
  //     legendary #d97706 · staff #ec4899
  // Si algún día se cambia un color, hay que cambiar también su rgba.
  export const rareza = {
    creator: {
          color: 'var(--rarity-creator)',
          background: 'var(--rarity-creator-bg)',
          border: '3px solid var(--rarity-creator)',
          shadow: '0 0 30px rgba(0, 255, 135, 0.8), 0 0 10px rgba(96, 239, 255, 0.5)'
        },
        staff:{
          color: 'var(--rarity-staff)',
          background: 'var(--rarity-staff-bg)',
          border: '3px solid var(--rarity-staff)',
          shadow: '0 0 30px rgba(236, 72, 153, 0.8), 0 0 10px rgba(236, 72, 153, 0.5)'
        },
        legedary: {
          color: 'var(--rarity-legendary)',
          background: 'var(--rarity-legendary-bg)',
          border: '3px solid var(--rarity-legendary)',
          shadow: '0 0 25px rgba(217, 119, 6, 0.7)'
        },
        epic: {
          color: 'var(--rarity-epic)',
          background: 'var(--rarity-epic-bg)',
          border: '3px solid var(--rarity-epic)',
          shadow: '0 0 20px rgba(168, 85, 247, 0.6)'
        },
        rare: {
          color: 'var(--rarity-rare)',
          background: 'var(--rarity-rare-bg)',
          border: '3px solid var(--rarity-rare)',
          shadow: '0 0 15px rgba(2, 132, 199, 0.5)'
        },
        common: {
          color: 'var(--rarity-common)',
          background: 'var(--rarity-common-bg)',
          border: '2px solid var(--rarity-common)',
          shadow: '0 0 10px rgba(148, 163, 184, 0.3)'
        }

  };
