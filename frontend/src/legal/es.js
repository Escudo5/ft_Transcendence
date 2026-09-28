/* 📄 LOS DOCUMENTOS LEGALES EN ESPAÑOL
 *
 * Esto NO son claves de interfaz, y por eso no viven en i18n.jsx: son dos
 * documentos de prosa. Metidos en el diccionario habrian sido 106 claves por
 * idioma, con las frases partidas en trozos alrededor de cada negrita, y
 * habrian dejado el texto legal ilegible tanto para nosotros como para quien
 * lo traduzca.
 *
 * MARCAS QUE ENTIENDE EL DIBUJANTE (Legal.jsx):
 *    **negrita**          ->  <strong>negrita</strong>
 *    [texto](/ruta)       ->  un enlace
 *
 * Para anadir un idioma: copiar este fichero, traducir los textos y
 * registrarlo en Legal.jsx. Nada mas.
 */
export default {
  fecha: '3 de septiembre de 2026',
  ultimaActualizacion: 'Última actualización',
  volver: '← Volver al Inicio',
  verTerminos: 'Ver los Términos de Servicio →',
  verPrivacidad: 'Ver la Política de Privacidad →',

  privacidad: {
    titulo: 'Política de Privacidad',
    intro: '**42 Card Album** es un proyecto académico desarrollado por estudiantes de 42 Madrid como parte del cursus (proyecto ft_transcendence). No tiene ánimo de lucro y no está afiliado oficialmente a 42. Aquí explicamos, sin rodeos, qué datos guardamos y para qué.',
    apartados: [
      {
        h: 'Qué datos guardamos',
        bloques: [
          { p: 'Depende de cómo entres:' },
          { p: '**Si entras con tu cuenta de 42:**' },
          { ul: [
            'Tu login, nombre, apellidos y correo de la Intra',
            'La URL de tu foto de perfil de la Intra',
            'Tu identificador de la Intra, para reconocerte al volver',
            'Si eres alumni',
          ] },
          { p: 'Estos datos se actualizan cada vez que inicias sesión, para que estén al día. **No guardamos tu contraseña de 42 ni tenemos acceso a ella en ningún momento**: la autenticación la hace la propia Intra.' },
          { p: '**Si te registras con correo y contraseña:**' },
          { ul: [
            'Tu correo electrónico y el nombre que elijas',
            'Tu contraseña, guardada **cifrada de forma irreversible y con sal**. Ni siquiera nosotros podemos leerla',
          ] },
          { p: '**En ambos casos, mientras usas la aplicación:**' },
          { ul: [
            'Tu colección de cartas y cuántas copias tienes de cada una',
            'Los sobres de tu inventario y cuándo recogiste el regalo diario',
            'Tu estado de conexión (en línea, desconectado o jugando)',
            'La biografía y el nombre a mostrar que tú escribas en tu perfil',
            'La foto de perfil que subas, si decides subir una',
            'Una cookie de sesión, necesaria para mantenerte identificado',
          ] },
          { p: 'Sobre la foto que subes: antes de guardarla la reducimos y la volvemos a generar, y en ese paso **se eliminan los datos ocultos que las cámaras de móvil incrustan en cada imagen**, entre ellos las coordenadas del sitio donde se hizo la foto. No llegamos a guardar esa información en ningún momento. Puedes quitar tu foto cuando quieras desde tu perfil, y al hacerlo se borra del servidor.' },
        ],
      },
      {
        h: 'De dónde salen las cartas',
        bloques: [
          { p: 'Las cartas del juego se generan a partir de **información pública** de estudiantes de 42 Madrid obtenida de la API oficial de la Intra: login, coalición, título, nivel del cursus, puntos de evaluación y foto de perfil. No se incluye ningún dato privado.' },
          { p: 'Si apareces como carta y no quieres estar, escríbenos y te retiramos del catálogo.' },
        ],
      },
      {
        h: 'Para qué usamos tus datos',
        bloques: [
          { p: 'Únicamente para que la aplicación funcione: identificarte, guardar tu colección y repartir tus sobres diarios. **No hacemos publicidad, no perfilamos usuarios y no vendemos ni cedemos datos a terceros.** No usamos cookies de seguimiento ni analítica externa.' },
        ],
      },
      {
        h: 'Dónde se guardan',
        bloques: [
          { p: 'En una base de datos PostgreSQL alojada en la infraestructura del proyecto. Las conexiones entre tu navegador y el servidor van cifradas mediante HTTPS.' },
        ],
      },
      {
        h: 'Cuánto tiempo',
        bloques: [
          { p: 'Mientras tengas cuenta. Si la borras, tus datos se eliminan de inmediato y de forma permanente, incluida tu colección.' },
        ],
      },
      {
        h: 'Tus derechos',
        bloques: [
          { destacado: [
            { p: 'Desde [tu perfil](/perfil) puedes, en cualquier momento y sin pedir permiso a nadie:' },
            { ul: [
              '**Descargar todos tus datos** en un fichero legible',
              '**Borrar tu cuenta** y todo lo asociado a ella',
              '**Editar** tu biografía y tu nombre a mostrar',
            ] },
          ] },
          { p: 'Los datos que vienen de la Intra (nombre, correo, foto) se actualizan solos desde 42 en cada inicio de sesión, así que para cambiarlos hay que hacerlo en la propia Intra.' },
        ],
      },
      {
        h: 'Contacto',
        bloques: [
          { p: 'Para cualquier duda sobre tus datos, escribe a cualquiera de los estudiantes que mantienen el proyecto a través de la Intra de 42 Madrid.' },
        ],
      },
    ],
  },

  terminos: {
    titulo: 'Términos de Servicio',
    intro: 'Al usar **42 Card Album** aceptas estas condiciones. Si no estás de acuerdo, simplemente no uses la aplicación.',
    apartados: [
      {
        h: 'Qué es esto',
        bloques: [
          { p: 'Un álbum de cromos coleccionables con estudiantes de 42, hecho por estudiantes de 42 Madrid como proyecto académico del cursus. **Es un proyecto educativo sin ánimo de lucro** y no está afiliado oficialmente a 42 ni a la Intra.' },
        ],
      },
      {
        h: 'Quién puede usarlo',
        bloques: [
          { p: 'Puedes entrar con tu cuenta de 42 o registrarte con un correo y una contraseña. Eres responsable de mantener tu contraseña a salvo y de todo lo que ocurra en tu cuenta.' },
        ],
      },
      {
        h: 'Las cartas y los sobres no valen dinero',
        bloques: [
          { p: 'Las cartas, los sobres y cualquier otro elemento del juego son **contenido virtual sin valor económico**. No se pueden comprar, vender ni intercambiar por dinero, ni dentro ni fuera de la aplicación. No adquieres su propiedad: solo el derecho a usarlos dentro del juego.' },
          { p: 'Podemos ajustar las reglas del juego (cuántos sobres se reparten, las probabilidades de cada rareza o cómo funcionan los contratos) para equilibrarlo.' },
        ],
      },
      {
        h: 'Qué no se puede hacer',
        bloques: [
          { ul: [
            'Automatizar la apertura de sobres o cualquier otra acción con programas o scripts',
            'Intentar saltarse los límites del juego, como el regalo diario',
            'Suplantar a otra persona o usar su cuenta',
            'Atacar la aplicación o intentar acceder a datos de otros usuarios',
            'Usar el contenido con fines comerciales',
          ] },
        ],
      },
      {
        h: 'Si apareces como carta',
        bloques: [
          { p: 'Las cartas se generan con información pública de la API de 42. Si eres estudiante de 42 Madrid, es posible que aparezcas. Si no quieres, dínoslo y te retiramos del catálogo.' },
        ],
      },
      {
        h: 'Que esto es un proyecto de estudiantes',
        bloques: [
          { p: 'La aplicación se ofrece **tal cual está**. Puede tener fallos, estar caída o perder datos, y las cuentas pueden reiniciarse durante el desarrollo o al terminar el proyecto. No garantizamos disponibilidad ni conservación de tu colección.' },
        ],
      },
      {
        h: 'Tu cuenta',
        bloques: [
          { p: 'Puedes borrarla cuando quieras desde [tu perfil](/perfil). También podemos cerrar cuentas que incumplan estas normas.' },
        ],
      },
      {
        h: 'Cambios',
        bloques: [
          { p: 'Si cambiamos estos términos, actualizaremos la fecha de arriba. Seguir usando la aplicación significa que aceptas la nueva versión.' },
        ],
      },
    ],
  },
};
