import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PieLegal from './PieLegal';
import ContadorMensajes from './ChatSocial/ContadorMensajes';
import { Avatar, Badge, Button, Card, Modal } from './ui';
import { CLASE_RAREZA, COLOR_RAREZA } from './rarezas';
import CreatorCard from './Album/CreatorCard';
import { useI18n } from '../i18n';

// 👥 Tarjetas base de presentación del equipo de desarrollo
const INTEGRANTES_BASE = [
  { login: "ksudyn", nombre: "Konrad", avatar: "imagen", rareza: "creator" },
  { login: "pablalva", nombre: "Pablo", avatar: "imagen", rareza: "creator" },
  { login: "nmagro-r", nombre: "Nacho", avatar: "imagen", rareza: "creator" },
  { login: "smarquez", nombre: "Sergio", avatar: "imagen", rareza: "creator" },
  { login: "osmunoz-", nombre: "Óscar", avatar: "imagen", rareza: "creator" },
];

function getUserImage(userData) {
  return userData?.profile_image || userData?.photo || userData?.avatar || null;
}

/* 📊 Una columna del tablón de estadísticas: el filete de color, el título y
 * lo que le metas dentro. Está aparte para que las cuatro se vean iguales y
 * cambiar el aspecto sea tocar un sitio, no cuatro. */
const estilosTablon = {
  columna: { borderLeft: '2px solid', paddingLeft: '0.75rem' },
  titulo: { color: 'var(--text-primary)', marginBottom: '0.5rem' },
  cifra: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.35rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '0 0 0.25rem',
  },
};

function ColumnaTablon({ color, titulo, children }) {
  return (
    <div style={{ ...estilosTablon.columna, borderLeftColor: color }}>
      <h4 style={estilosTablon.titulo}>{titulo}</h4>
      {children}
    </div>
  );
}

/*
🍩 EL ANILLO DE PROGRESO (Nacho, 21/09)

Un SVG a mano, sin ninguna librería. Son treinta líneas y evita meter una
dependencia entera para dibujar un círculo.

CÓMO FUNCIONA, que parece magia y no lo es: se dibuja el círculo completo y
se le pinta la línea a trozos con `strokeDasharray`. El primer número es
cuánto se pinta y el segundo cuánto se salta. Si la vuelta entera mide
2·π·r, pintando ese largo por el porcentaje sale justo el arco que toca.

El -90 de la rotación es para que empiece arriba y no a la derecha, que es
como la gente espera leer un progreso.

Va con role y aria-label porque un dibujo no lo lee nadie con un lector de
pantalla: sin eso, para quien no ve la imagen esta columna estaría vacía.
*/
function AnilloProgreso({ porcentaje, etiqueta, color = 'var(--accent)', tamano = 92 }) {
  const seguro = Math.max(0, Math.min(100, Number(porcentaje) || 0));
  const grosor = 9;
  const radio = (tamano - grosor) / 2;
  const vuelta = 2 * Math.PI * radio;
  const pintado = (vuelta * seguro) / 100;

  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${tamano} ${tamano}`}
      role="img"
      aria-label={etiqueta}
      style={{ display: 'block' }}
    >
      {/* El carril de atrás: la vuelta entera, apagada */}
      <circle
        cx={tamano / 2} cy={tamano / 2} r={radio}
        fill="none" stroke="var(--border-default)" strokeWidth={grosor}
      />
      {/* Y encima, el trozo conseguido */}
      <circle
        cx={tamano / 2} cy={tamano / 2} r={radio}
        fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round"
        strokeDasharray={`${pintado} ${vuelta - pintado}`}
        transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
      />
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="var(--text-primary)"
        style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 800 }}
      >
        {seguro}%
      </text>
    </svg>
  );
}

/*
🎴 UNA CARTA EN PEQUEÑO, con su foto.

Mismo aspecto que "tu carta más rara" del perfil (foto de 54px redondeada y
la rareza en su color) para que las dos pantallas se parezcan. El color sale
de COLOR_RAREZA, que es el diccionario de rarezas.js: no se escribe aquí
ningún color a mano.
*/
function CartaMini({ carta, t }) {
  if (!carta) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
      {carta.photo ? (
        <img
          src={carta.photo}
          alt={carta.login}
          style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: '54px', height: '54px', borderRadius: '8px', background: 'var(--surface-overlay)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>👤</div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{carta.login}</div>
        <div style={{ color: COLOR_RAREZA[carta.tier] || 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
          {carta.tier}
        </div>
        <div style={{ fontSize: '0.8rem' }}>{t("boardLevel", { level: carta.nivel })}</div>
        {/* ⚠️ Nacho, 21/09: aquí llegó a salir la coalición y el equipo
            decidió quitarla de las dos cartas del tablón. Se pinta con este
            componente y no en cada columna a mano, así que las dos enseñan
            lo mismo por construcción y no se pueden descuadrar. */}
      </div>
    </div>
  );
}

function Home() {
  // languageInfo ademas de t: el separador de miles cambia con el idioma
  // (2.495 en español, 2,495 en ingles). Formatearlo siempre 'es-ES'
  // seria dejar la cifra a medio traducir.
  const { t, languageInfo } = useI18n();
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  const cardsEndpoint = import.meta.env.VITE_CARDS_ENDPOINT || `${apiBaseUrl}/cards`;

  // 2. ESTADOS (Variables dinámicas de React)
  // indiceSeleccionado guardará un número (0 a 4) si hay una carta abierta, o null si están todas cerradas.
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(null);
  const [integrantes, setIntegrantes] = useState(INTEGRANTES_BASE);

  /*
  📊 LOS DATOS DEL TABLÓN (Nacho, 21/09)

  `tablon` es null mientras se cargan, y entonces las columnas enseñan un
  "…" en vez de un cero. Un cero mentiría: no es que tengas 0 puntos, es que
  todavía no lo sabemos.
  */
  const [tablon, setTablon] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarUsuarios() {
      try {
        const respuestas = await Promise.all(
          INTEGRANTES_BASE.map(async (user) => {
            const response = await fetch(`${cardsEndpoint}/${encodeURIComponent(user.login)}/`, {
              credentials: 'include',
              signal: controller.signal,
            });

            if (!response.ok) {
              return user;
            }

            const cardDb = await response.json();

            /* 🎴 CAMBIO (Nacho, 24/09): antes de aquí solo salían el nombre y
             * la foto, y la portada pintaba un maquetado propio con un "DEV"
             * fijo. La llamada YA traía la carta entera; solo había que dejar
             * de tirar el resto de campos.
             *
             * Se mantienen `nombre`, `avatar` y `rareza` porque son los que usa
             * el modal de abajo, y se añaden los de la carta con LOS MISMOS
             * NOMBRES que en el álbum (Catalogo.jsx), que es lo que espera
             * CreatorCard. Si se renombra uno allí, hay que renombrarlo aquí.
             *
             * ⚠️ AQUÍ NO VA `cantidad` A PROPÓSITO (Nacho, 24/09). Las
             * repetidas son cosa del álbum: la portada es la presentación del
             * equipo, no tu colección, así que el ×2 no pinta nada. Como
             * CreatorCard solo dibuja el contador si `carta.cantidad > 1`, no
             * poniendo el campo ya no sale. Y así la portada tampoco necesita
             * pedir /cards/album/, que era una petición solo para esto. */
            return {
              ...user,
              nombre: cardDb.title || user.nombre,
              avatar: getUserImage(cardDb) || user.avatar,
              rareza: CLASE_RAREZA[cardDb.tier] || user.rareza,

              titulo: cardDb.title || '',
              coalicion: cardDb.coalition || '',
              foto: cardDb.photo,
              tier: cardDb.tier,
              nivel: cardDb.cursus_lvl ?? 0,
              evaluaciones: cardDb.eval_point ?? 0,
              altarians: cardDb.altarians ?? 0,
            };
          }),
        );

        setIntegrantes(respuestas);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('No se pudieron cargar las cartas:', error);
        }
      }
    }

    cargarUsuarios();

    return () => controller.abort();
  }, [cardsEndpoint]);

  /*
  📊 Carga de los datos del tablón de estadísticas.

  Son TRES peticiones y no una porque cada dato ya vive en su sitio, y
  duplicarlo en un endpoint nuevo sería tener la misma cifra en dos lugares
  (que es como se quedan viejas a trozos):

    /users/me/            -> quién soy (hace falta para pedir mi perfil)
    /users/<yo>/          -> mi progreso y mi carta más rara
    /cards/ranking/       -> mi posición y la mejor carta del catálogo
    /social/amigos/       -> mis amigos con su estado de verdad

  Van con Promise.all, así que tardan lo que la más lenta, no la suma.

  Si algo falla NO se rompe la portada: cada trozo se queda a null y su
  columna dice que no se ha podido cargar. La portada es lo primero que se
  ve, y prefiero una columna vacía a una pantalla en blanco.
  */
  useEffect(() => {
    const controller = new AbortController();

    async function cargarTablon() {
      try {
        const opciones = { credentials: 'include', signal: controller.signal };

        const resYo = await fetch(`${apiBaseUrl}/users/me/`, opciones);
        if (!resYo.ok) return;                 // sin sesión no hay tablón
        const yo = await resYo.json();

        const [perfil, ranking, amigos] = await Promise.all([
          fetch(`${apiBaseUrl}/users/${encodeURIComponent(yo.username)}/`, opciones)
            .then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${apiBaseUrl}/cards/ranking/`, opciones)
            .then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${apiBaseUrl}/social/amigos/`, opciones)
            .then((r) => (r.ok ? r.json() : [])).catch(() => []),
        ]);

        if (controller.signal.aborted) return;

        const miFila = (ranking?.clasificacion || []).find((u) => u.soy_yo);

        setTablon({
          coleccion: perfil?.coleccion || null,
          puntos: perfil?.puntos ?? null,
          miCartaMasAlta: perfil?.coleccion?.carta_mas_rara || null,
          posicion: miFila?.posicion ?? null,
          cartaMasAlta: ranking?.carta_mas_alta || null,
          // El endpoint de amigos devuelve una lista; 'estado' ya es el
          // estado_real (mira la última señal de vida), así que aquí no hay
          // que volver a decidir nada.
          amigos: Array.isArray(amigos) ? amigos : [],
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('No se pudo cargar el tablón:', error);
        }
      }
    }

    cargarTablon();
    return () => controller.abort();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (indiceSeleccionado === null) return undefined;

    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') setIndiceSeleccionado(null);
    };

    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [indiceSeleccionado]);

  // Función que se activa al pulsar el botón de Game
  const ChatSocial = () => {
    navigate('/chatsocial'); // Te manda directo a la pantalla de game
  };

  // Funciones para navegar dentro de la galería ampliada
  const irAnterior = (e) => {
    e.stopPropagation(); // Evita que se cierre el modal al hacer click en el botón
    setIndiceSeleccionado((prev) => (prev === 0 ? INTEGRANTES_BASE.length - 1 : prev - 1));
  };

  const irSiguiente = (e) => {
    e.stopPropagation(); // Evita que se cierre el modal al hacer click en el botón
    setIndiceSeleccionado((prev) => (prev === INTEGRANTES_BASE.length - 1 ? 0 : prev + 1));
  };

  // El integrante que está actualmente ampliado (si lo hay)
  const integranteActivo = indiceSeleccionado !== null ? integrantes[indiceSeleccionado] : null;

  return (
    <main className="app-container" style={{ padding: '2rem 0', backgroundColor: 'transparent', color: 'white', minHeight: '100vh', textAlign: 'center' }}>
      <header className="app-header">
        <div className="logo-section">
          <h1>ft_transcendence</h1>
        </div>
        <p className="subtitle" style={{ fontSize: '1.2rem', opacity: 0.8, marginTop: '0.5rem' }}>
          {t('projectCreators')}
        </p>
      </header>

{/* Fila con las 5 cartas de los miembros del grupo.
  *
  * 🎴 CAMBIO (Nacho, 24/09): aquí había un maquetado propio, con un "DEV"
  * escrito a mano y sin ningún dato real de la carta. Ahora se pinta con
  * CreatorCard, EL MISMO componente que usa el álbum, así que la portada
  * enseña la carta de verdad: su coalición, su nivel, sus evaluaciones y sus
  * altarians.
  *
  * Sin el ×N de las repetidas, a propósito: esto es la presentación del
  * equipo, no la colección de quien mira. Lo de las repetidas es del álbum.
  *
  * ⚠️ La rareza sale de la base de datos: si tus 5 cartas no están todavía
  * como Creator, lo que se ve son los datos reales dentro del marco de
  * creator. Se arregla sincronizando, no tocando esto. */}
  <section className="team-grid" aria-label={t("teamGridLabel")}>
    {integrantes.map((user, index) => (
      <CreatorCard
        key={user.login}
        carta={user}
        onClick={() => setIndiceSeleccionado(index)}
      />
    ))}
  </section>

      {/* 🧭 BOTONES DE ACCIÓN: las opciones del juego.
          La rejilla se ajusta sola al número de botones (antes eran dos fijos),
          así añadir o quitar alguno no descuadra la fila. */}
      <nav className="action-grid" aria-label={t("mainActionsLabel")}>
        <Link to="/catalogo" className="back-btn-link" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '1.25rem', display: 'block', background: '#00BABC', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          {t('viewAlbum')}
        </Link>
        <Link to="/perfil" className="back-btn-link" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '1.25rem', display: 'block', background: '#333', color: 'white', textDecoration: 'none', border: '1px solid #555', borderRadius: '8px', fontWeight: 'bold' }}>
          {t('myProfile')}
        </Link>
        <Link to="/ranking" className="back-btn-link" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '1.25rem', display: 'block', background: '#333', color: 'white', textDecoration: 'none', border: '1px solid #555', borderRadius: '8px', fontWeight: 'bold' }}>
          {t('ranking')}
        </Link>
        {/* El botón del chat lleva encima la bolita de mensajes sin leer.
            El 'position: relative' es lo que hace que la bolita se coloque
            respecto a este botón y no respecto a la página entera. */}
        <button className="back-btn-link" style={{ padding: '1.5rem', fontSize: '1.25rem', cursor: 'pointer', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '8px', fontWeight: 'bold', position: 'relative' }} onClick={() => navigate('/chatsocial')}>
          {t('chat')}
          <ContadorMensajes />
        </button>
      </nav>


      {/* PARTE 3: ABAJO (Tablón de anuncios rectangular con 4 columnas) */}
      <section className="control-panel" style={{ marginTop: '2rem', display: 'block' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--accent)' }}>
           {t('statisticsBoard')}
        </h2>
        
        {/* Rejilla interna de 4 columnas (Grid) preparada para los futuros datos del Backend */}
        <div className="stats-grid" style={{
          display: 'grid', 
          gap: '1.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
          
          {/* ── 1. TU PROGRESO ───────────────────────────────────────── */}
          <ColumnaTablon color="var(--accent)" titulo={t("boardProgress")}>
            {tablon?.coleccion ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <AnilloProgreso porcentaje={tablon.coleccion.porcentaje} etiqueta={t("boardRingLabel", { percent: tablon.coleccion.porcentaje })} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0 }}>{t("boardCardsOf", { have: tablon.coleccion.cartas_distintas, total: tablon.coleccion.cartas_en_catalogo })}</p>
                  <p style={{ margin: 0 }}>{t("boardPoints", { points: (tablon.puntos ?? 0).toLocaleString(languageInfo.locale) })}</p>
                  {tablon.posicion && <p style={{ margin: 0 }}>{t("boardRankPosition")} <strong>#{tablon.posicion}</strong></p>}
                </div>
              </div>
            ) : <p>…</p>}
          </ColumnaTablon>

          {/* ── 2. LA MEJOR CARTA QUE EXISTE ──────────────────────────── */}
          <ColumnaTablon color="var(--rarity-legendary)" titulo={t("boardTopCardAll")}>
            {tablon?.cartaMasAlta ? <CartaMini carta={tablon.cartaMasAlta} t={t} /> : <p>…</p>}
          </ColumnaTablon>

          {/* ── 3. LA MEJOR QUE TIENES TÚ ─────────────────────────────── */}
          <ColumnaTablon color="var(--rarity-epic)" titulo={t("boardTopCardMine")}>
            {tablon?.miCartaMasAlta ? (
              <CartaMini carta={tablon.miCartaMasAlta} t={t} />
            ) : (
              /* Sin cartas todavía no es un error: es que aún no ha abierto
                 ningún sobre. Se le dice qué hacer en vez de dejar un hueco. */
              <p>{tablon ? t("boardNoCards") : '…'}</p>
            )}
          </ColumnaTablon>

          {/* ── 4. AMIGOS CONECTADOS ──────────────────────────────────── */}
          <ColumnaTablon color="var(--rarity-rare)" titulo={t("boardFriendsOnline")}>
            {!tablon ? <p>…</p> : tablon.amigos.length === 0 ? (
              <p>{t("boardNoFriends")}</p>
            ) : (
              <>
                <p style={estilosTablon.cifra}>
                  {t("boardOnlineCount", { count: tablon.amigos.filter((a) => a.estado !== 'offline').length })}
                </p>
                {/* Los conectados primero, y como mucho cinco: esto es un
                    resumen, la lista entera está en el chat. */}
                {[...tablon.amigos]
                  .sort((a, b) => (a.estado !== 'offline' ? -1 : 1) - (b.estado !== 'offline' ? -1 : 1))
                  .slice(0, 5)
                  .map((a) => (
                    <p key={a.id}>
                      <span style={{ color: a.estado !== 'offline' ? '#4ade80' : '#94a3b8' }}>●</span>
                      {' '}{a.nombre || a.username}
                    </p>
                  ))}
                {tablon.amigos.length > 5 && <p>{t("boardAndMore", { count: tablon.amigos.length - 5 })}</p>}
              </>
            )}
          </ColumnaTablon>

        </div>
      </section>

      {/* MODAL / CAPA FLOTANTE AMPLRIADA (Solo se dibuja si indiceSeleccionado tiene un número) */}
      <AnimatePresence>
        {integranteActivo && (
          <motion.div
            key={integranteActivo.login}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Modal onClose={() => setIndiceSeleccionado(null)} labelledBy="integrante-activo">
          {/* Contenedor de navegación (Botón Izquierda, Carta, Botón Derecha) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            
            {/* Botón Anterior */}
            <Button type="button" className="pagination-btn" onClick={irAnterior} aria-label={t("previousMember")}>
              <span aria-hidden="true">&#9664;</span>
            </Button>

            {/* Carta Ampliada */}
            <Card
              as="article"
              className={`home-modal-card rarity-${integranteActivo.rareza}`}
              onClick={(e) => e.stopPropagation()} // Evita que se cierre el modal al hacer click dentro de la carta
            >
              <Avatar src={integranteActivo.avatar !== 'imagen' ? integranteActivo.avatar : undefined} alt={integranteActivo.nombre} size="large" />
              <h2 id="integrante-activo" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>
                {integranteActivo.nombre}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0 0 1.5rem 0' }}>
                @{integranteActivo.login}
              </p>
              <Badge tone={integranteActivo.rareza}>
                Rarity: {integranteActivo.rareza}
              </Badge>
            </Card>

            {/* Botón Siguiente */}
            <Button type="button" className="pagination-btn" onClick={irSiguiente} aria-label={t("nextMember")}>
              <span aria-hidden="true">&#9654;</span>
            </Button>

          </div>
            </Modal>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlaces legales, obligatorios en el subject */}
      <PieLegal estilo={{ marginTop: '3rem' }} />
    </main>
  );
}

export default Home;