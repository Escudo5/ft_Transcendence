import { useI18n } from '../i18n';
import es from '../legal/es';
import en from '../legal/en';
import ar from '../legal/ar';

/**
 * PÁGINAS LEGALES
 * ---------------
 * Un único componente que pinta la Política de Privacidad o los Términos de
 * Servicio según la prop 'tipo'. Son obligatorias en el subject y se revisan en
 * la evaluación: tienen que ser accesibles desde la aplicación y hablar de
 * NUESTRO proyecto, no ser una plantilla genérica.
 *
 * Están escritas a partir de lo que el proyecto hace de verdad:
 * lo que guarda la base de datos, cómo funciona el login con 42 y qué pasa con
 * los datos de la API de la Intra.
 *
 * ⚠️ Si añadís o quitáis datos del usuario, hay que actualizar la Política de
 * Privacidad EN LOS TRES IDIOMAS. Prometer una cosa y hacer otra es peor que no
 * prometer nada.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * 📄 POR QUÉ EL TEXTO NO ESTÁ AQUÍ DENTRO (Nacho, 28/09)
 *
 * Antes estaba, y en español fijo: 88 textos, unas 883 palabras. El módulo de
 * idiomas pide que TODO el texto sea traducible, así que había que sacarlo.
 *
 * Meterlo en i18n.jsx como el resto habría sido un error: son dos documentos
 * de prosa, no etiquetas de botones. Y como hay negritas DENTRO de las frases,
 * cada párrafo habría que partirlo en dos o tres claves. Salían 106 claves por
 * idioma (318 en total) y el texto legal quedaba troceado e ilegible.
 *
 * Por eso cada idioma es UN FICHERO en src/legal/, con el documento escrito
 * de corrido, y este componente solo lo dibuja. Añadir un idioma es copiar un
 * fichero, no escribir 106 claves.
 */

/* Los idiomas disponibles. El de español hace de red: si algún día se añade
 * un idioma a i18n.jsx y se olvida el fichero legal, se ve en español en vez
 * de reventar con la pantalla en blanco. */
const DOCUMENTOS = { es, en, ar };

const estilos = {
  pagina: {
    maxWidth: '820px',
    margin: '0 auto',
    padding: '2rem 1.5rem 4rem',
    fontFamily: 'var(--font-body)',
    color: 'var(--text-primary)',
    lineHeight: 1.65,
  },
  titulo: {
    fontFamily: 'var(--font-heading)',
    fontSize: '2.1rem',
    fontWeight: 800,
    color: 'var(--accent)',
    marginBottom: '0.3rem',
  },
  fecha: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginBottom: '2rem',
  },
  apartado: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--accent)',
    marginTop: '2rem',
    marginBottom: '0.6rem',
  },
  parrafo: { marginBottom: '0.9rem' },
  lista: { marginBottom: '0.9rem', paddingLeft: '1.3rem' },
  destacado: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: '12px',
    padding: '1.2rem',
    marginTop: '1rem',
  },
  enlace: { color: 'var(--accent)' },
};

/* ✍️ LAS DOS MARCAS QUE ENTIENDE EL TEXTO
 *
 *    **negrita**       ->  <strong>negrita</strong>
 *    [texto](/ruta)    ->  <a href="/ruta">texto</a>
 *
 * Se parte la frase por las dos a la vez y se va montando. Hace falta la
 * `key` en cada trozo porque React pinta una lista de elementos.
 *
 * ⚠️ NO interpreta HTML: lo que venga en el texto se escribe tal cual. Es a
 * propósito, para que un documento legal no pueda meter etiquetas en la
 * página sin que nos enteremos.
 */
const MARCAS = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function conFormato(texto) {
  return texto.split(MARCAS).filter(Boolean).map((trozo, i) => {
    const negrita = trozo.match(/^\*\*([^*]+)\*\*$/);
    if (negrita) return <strong key={i}>{negrita[1]}</strong>;

    const enlace = trozo.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (enlace) {
      return (
        <a key={i} href={enlace[2]} style={estilos.enlace}>
          {enlace[1]}
        </a>
      );
    }
    return trozo;
  });
}

/* Un bloque es un párrafo, una lista o una caja destacada (que lleva bloques
 * dentro). Se dibuja según lo que traiga. */
function Bloque({ bloque }) {
  if (bloque.p) return <p style={estilos.parrafo}>{conFormato(bloque.p)}</p>;

  if (bloque.ul) {
    return (
      <ul style={estilos.lista}>
        {bloque.ul.map((linea, i) => (
          <li key={i}>{conFormato(linea)}</li>
        ))}
      </ul>
    );
  }

  if (bloque.destacado) {
    return (
      <div style={estilos.destacado}>
        {bloque.destacado.map((b, i) => (
          <Bloque key={i} bloque={b} />
        ))}
      </div>
    );
  }
  return null;
}

function Documento({ doc, fecha, etiquetaFecha }) {
  return (
    <>
      <h1 className="titulo-degradado" style={estilos.titulo}>{doc.titulo}</h1>
      <p style={estilos.fecha}>{etiquetaFecha}: {fecha}</p>

      <p style={estilos.parrafo}>{conFormato(doc.intro)}</p>

      {doc.apartados.map((ap, i) => (
        <div key={i}>
          <h2 style={estilos.apartado}>{ap.h}</h2>
          {ap.bloques.map((b, j) => (
            <Bloque key={j} bloque={b} />
          ))}
        </div>
      ))}
    </>
  );
}

export default function Legal({ tipo }) {
  const { language } = useI18n();
  const textos = DOCUMENTOS[language] || DOCUMENTOS.es;
  const esPrivacidad = tipo === 'privacidad';

  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-navigation">
          <a href="/" className="back-btn-link">{textos.volver}</a>
        </div>
      </header>

      <div style={estilos.pagina}>
        <Documento
          doc={esPrivacidad ? textos.privacidad : textos.terminos}
          fecha={textos.fecha}
          etiquetaFecha={textos.ultimaActualizacion}
        />

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-default)' }}>
          <a href={esPrivacidad ? '/terminos' : '/privacidad'} style={estilos.enlace}>
            {esPrivacidad ? textos.verTerminos : textos.verPrivacidad}
          </a>
        </div>
      </div>
    </main>
  );
}
