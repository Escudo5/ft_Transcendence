
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
 * Privacidad. Prometer una cosa y hacer otra es peor que no prometer nada.
 */

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
    background: 'linear-gradient(to right, #38bdf8, #818cf8, #c084fc)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
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
    color: 'var(--accent-color)',
    marginTop: '2rem',
    marginBottom: '0.6rem',
  },
  parrafo: { marginBottom: '0.9rem' },
  lista: { marginBottom: '0.9rem', paddingLeft: '1.3rem' },
  destacado: {
    background: 'var(--bg-card-base)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1.2rem',
    marginTop: '1rem',
  },
};

const FECHA = '3 de septiembre de 2026';

function Privacidad() {
  return (
    <>
      <h1 style={estilos.titulo}>Política de Privacidad</h1>
      <p style={estilos.fecha}>Última actualización: {FECHA}</p>

      <p style={estilos.parrafo}>
        <strong>42 Card Album</strong> es un proyecto académico desarrollado por estudiantes de
        42 Madrid como parte del cursus (proyecto ft_transcendence). No tiene ánimo de lucro y
        no está afiliado oficialmente a 42. Aquí explicamos, sin rodeos, qué datos guardamos y
        para qué.
      </p>

      <h2 style={estilos.apartado}>Qué datos guardamos</h2>
      <p style={estilos.parrafo}>Depende de cómo entres:</p>
      <p style={estilos.parrafo}><strong>Si entras con tu cuenta de 42:</strong></p>
      <ul style={estilos.lista}>
        <li>Tu login, nombre, apellidos y correo de la Intra</li>
        <li>La URL de tu foto de perfil de la Intra</li>
        <li>Tu identificador de la Intra, para reconocerte al volver</li>
        <li>Si eres alumni</li>
      </ul>
      <p style={estilos.parrafo}>
        Estos datos se actualizan cada vez que inicias sesión, para que estén al día.
        <strong> No guardamos tu contraseña de 42 ni tenemos acceso a ella en ningún momento</strong>:
        la autenticación la hace la propia Intra.
      </p>

      <p style={estilos.parrafo}><strong>Si te registras con correo y contraseña:</strong></p>
      <ul style={estilos.lista}>
        <li>Tu correo electrónico y el nombre que elijas</li>
        <li>
          Tu contraseña, guardada <strong>cifrada de forma irreversible y con sal</strong>. Ni
          siquiera nosotros podemos leerla
        </li>
      </ul>

      <p style={estilos.parrafo}><strong>En ambos casos, mientras usas la aplicación:</strong></p>
      <ul style={estilos.lista}>
        <li>Tu colección de cartas y cuántas copias tienes de cada una</li>
        <li>Los sobres de tu inventario y cuándo recogiste el regalo diario</li>
        <li>Tu estado de conexión (en línea, desconectado o jugando)</li>
        <li>La biografía y el nombre a mostrar que tú escribas en tu perfil</li>
        <li>Una cookie de sesión, necesaria para mantenerte identificado</li>
      </ul>

      <h2 style={estilos.apartado}>De dónde salen las cartas</h2>
      <p style={estilos.parrafo}>
        Las cartas del juego se generan a partir de <strong>información pública</strong> de
        estudiantes de 42 Madrid obtenida de la API oficial de la Intra: login, coalición,
        título, nivel del cursus, puntos de evaluación y foto de perfil. No se incluye ningún
        dato privado.
      </p>
      <p style={estilos.parrafo}>
        Si apareces como carta y no quieres estar, escríbenos y te retiramos del catálogo.
      </p>

      <h2 style={estilos.apartado}>Para qué usamos tus datos</h2>
      <p style={estilos.parrafo}>
        Únicamente para que la aplicación funcione: identificarte, guardar tu colección y
        repartir tus sobres diarios. <strong>No hacemos publicidad, no perfilamos usuarios y no
        vendemos ni cedemos datos a terceros.</strong> No usamos cookies de seguimiento ni
        analítica externa.
      </p>

      <h2 style={estilos.apartado}>Dónde se guardan</h2>
      <p style={estilos.parrafo}>
        En una base de datos PostgreSQL alojada en la infraestructura del proyecto. Las
        conexiones entre tu navegador y el servidor van cifradas mediante HTTPS.
      </p>

      <h2 style={estilos.apartado}>Cuánto tiempo</h2>
      <p style={estilos.parrafo}>
        Mientras tengas cuenta. Si la borras, tus datos se eliminan de inmediato y de forma
        permanente, incluida tu colección.
      </p>

      <h2 style={estilos.apartado}>Tus derechos</h2>
      <div style={estilos.destacado}>
        <p style={estilos.parrafo}>
          Desde <a href="/perfil" style={{ color: 'var(--accent-color)' }}>tu perfil</a> puedes,
          en cualquier momento y sin pedir permiso a nadie:
        </p>
        <ul style={{ ...estilos.lista, marginBottom: 0 }}>
          <li><strong>Descargar todos tus datos</strong> en un fichero legible</li>
          <li><strong>Borrar tu cuenta</strong> y todo lo asociado a ella</li>
          <li><strong>Editar</strong> tu biografía y tu nombre a mostrar</li>
        </ul>
      </div>
      <p style={{ ...estilos.parrafo, marginTop: '1rem' }}>
        Los datos que vienen de la Intra (nombre, correo, foto) se actualizan solos desde 42 en
        cada inicio de sesión, así que para cambiarlos hay que hacerlo en la propia Intra.
      </p>

      <h2 style={estilos.apartado}>Contacto</h2>
      <p style={estilos.parrafo}>
        Para cualquier duda sobre tus datos, escribe a cualquiera de los estudiantes que
        mantienen el proyecto a través de la Intra de 42 Madrid.
      </p>
    </>
  );
}

function Terminos() {
  return (
    <>
      <h1 style={estilos.titulo}>Términos de Servicio</h1>
      <p style={estilos.fecha}>Última actualización: {FECHA}</p>

      <p style={estilos.parrafo}>
        Al usar <strong>42 Card Album</strong> aceptas estas condiciones. Si no estás de acuerdo,
        simplemente no uses la aplicación.
      </p>

      <h2 style={estilos.apartado}>Qué es esto</h2>
      <p style={estilos.parrafo}>
        Un álbum de cromos coleccionables con estudiantes de 42, hecho por estudiantes de 42
        Madrid como proyecto académico del cursus. <strong>Es un proyecto educativo sin ánimo de
        lucro</strong> y no está afiliado oficialmente a 42 ni a la Intra.
      </p>

      <h2 style={estilos.apartado}>Quién puede usarlo</h2>
      <p style={estilos.parrafo}>
        Puedes entrar con tu cuenta de 42 o registrarte con un correo y una contraseña. Eres
        responsable de mantener tu contraseña a salvo y de todo lo que ocurra en tu cuenta.
      </p>

      <h2 style={estilos.apartado}>Las cartas y los sobres no valen dinero</h2>
      <p style={estilos.parrafo}>
        Las cartas, los sobres y cualquier otro elemento del juego son{' '}
        <strong>contenido virtual sin valor económico</strong>. No se pueden comprar, vender ni
        intercambiar por dinero, ni dentro ni fuera de la aplicación. No adquieres su propiedad:
        solo el derecho a usarlos dentro del juego.
      </p>
      <p style={estilos.parrafo}>
        Podemos ajustar las reglas del juego (cuántos sobres se reparten, las probabilidades de
        cada rareza o cómo funcionan los contratos) para equilibrarlo.
      </p>

      <h2 style={estilos.apartado}>Qué no se puede hacer</h2>
      <ul style={estilos.lista}>
        <li>Automatizar la apertura de sobres o cualquier otra acción con programas o scripts</li>
        <li>Intentar saltarse los límites del juego, como el regalo diario</li>
        <li>Suplantar a otra persona o usar su cuenta</li>
        <li>Atacar la aplicación o intentar acceder a datos de otros usuarios</li>
        <li>Usar el contenido con fines comerciales</li>
      </ul>

      <h2 style={estilos.apartado}>Si apareces como carta</h2>
      <p style={estilos.parrafo}>
        Las cartas se generan con información pública de la API de 42. Si eres estudiante de 42
        Madrid, es posible que aparezcas. Si no quieres, dínoslo y te retiramos del catálogo.
      </p>

      <h2 style={estilos.apartado}>Que esto es un proyecto de estudiantes</h2>
      <p style={estilos.parrafo}>
        La aplicación se ofrece <strong>tal cual está</strong>. Puede tener fallos, estar caída o
        perder datos, y las cuentas pueden reiniciarse durante el desarrollo o al terminar el
        proyecto. No garantizamos disponibilidad ni conservación de tu colección.
      </p>

      <h2 style={estilos.apartado}>Tu cuenta</h2>
      <p style={estilos.parrafo}>
        Puedes borrarla cuando quieras desde{' '}
        <a href="/perfil" style={{ color: 'var(--accent-color)' }}>tu perfil</a>. También
        podemos cerrar cuentas que incumplan estas normas.
      </p>

      <h2 style={estilos.apartado}>Cambios</h2>
      <p style={estilos.parrafo}>
        Si cambiamos estos términos, actualizaremos la fecha de arriba. Seguir usando la
        aplicación significa que aceptas la nueva versión.
      </p>
    </>
  );
}

export default function Legal({ tipo }) {
  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-navigation">
          <a href="/" className="back-btn-link">← Volver al Inicio</a>
        </div>
      </header>

      <div style={estilos.pagina}>
        {tipo === 'privacidad' ? <Privacidad /> : <Terminos />}

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <a
            href={tipo === 'privacidad' ? '/terminos' : '/privacidad'}
            style={{ color: 'var(--accent-color)' }}
          >
            {tipo === 'privacidad' ? 'Ver los Términos de Servicio →' : 'Ver la Política de Privacidad →'}
          </a>
        </div>
      </div>
    </main>
  );
}
