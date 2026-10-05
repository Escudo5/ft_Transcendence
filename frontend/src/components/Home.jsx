import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PieLegal from './PieLegal';
import ContadorMensajes from './ChatSocial/ContadorMensajes';
import { Avatar, Badge, Button, Card, Modal } from './ui';
import { CLASE_RAREZA, COLOR_RAREZA } from './rarezas';
import CreatorCard from './Album/CreatorCard';
import { useI18n } from '../i18n';
import ModalDetalleCarta from './Album/CatalogoComponents/ModalDetalleCarta';

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
      <circle
        cx={tamano / 2} cy={tamano / 2} r={radio}
        fill="none" stroke="var(--border-default)" strokeWidth={grosor}
      />
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
        <div style={{ fontSize: '0.8rem' }}>{t("boardLevel", { level: parseFloat(Number(carta.nivel || 0).toFixed(2)) })}</div>
      </div>
    </div>
  );
}

function Home() {
  const { t, languageInfo } = useI18n();
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  const cardsEndpoint = import.meta.env.VITE_CARDS_ENDPOINT || `${apiBaseUrl}/cards`;

  const [indiceSeleccionado, setIndiceSeleccionado] = useState(null);
  const [integrantes, setIntegrantes] = useState(INTEGRANTES_BASE);
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
              return {
                ...user,
                loginUsuario: user.login,
                nombreCoalicion: '',
                urlFoto: user.avatar !== 'imagen' ? user.avatar : null,
                tituloPersonalizado: user.nombre,
                categoriaTier: 'Creator',
                rarezaCss: user.rareza,
                nivelFormateado: 0,
                puntosEvaluacion: 0,
                saldoAltarians: 0,
                cantidadCopias: 1,
              };
            }

            const cardDb = await response.json();

            return {
              ...user,
              idInstancia: cardDb.id || user.login,
              loginUsuario: cardDb.login || user.login,
              nombreCoalicion: cardDb.coalition || '',
              urlFoto: getUserImage(cardDb) || (user.avatar !== 'imagen' ? user.avatar : null),
              tituloPersonalizado: cardDb.title || user.nombre,
              categoriaTier: cardDb.tier || 'Creator',
              rarezaCss: CLASE_RAREZA[cardDb.tier] || user.rareza,
              nivelFormateado: parseFloat(Number(cardDb.cursus_lvl ?? 0).toFixed(2)),
              puntosEvaluacion: cardDb.eval_point ?? 0,
              saldoAltarians: cardDb.altarians ?? 0,
              cantidadCopias: 1,
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

  useEffect(() => {
    const controller = new AbortController();

    async function cargarTablon() {
      try {
        const opciones = { credentials: 'include', signal: controller.signal };

        const resYo = await fetch(`${apiBaseUrl}/users/me/`, opciones);
        if (!resYo.ok) return;
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

  const irAnterior = (e) => {
    e.stopPropagation();
    setIndiceSeleccionado((prev) => (prev === 0 ? INTEGRANTES_BASE.length - 1 : prev - 1));
  };

  const irSiguiente = (e) => {
    e.stopPropagation();
    setIndiceSeleccionado((prev) => (prev === INTEGRANTES_BASE.length - 1 ? 0 : prev + 1));
  };

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

      <section className="team-grid" aria-label={t("teamGridLabel")}>
        {integrantes.map((user, index) => (
          <CreatorCard
            key={user.login}
            carta={user}
            onClick={() => setIndiceSeleccionado(index)}
          />
        ))}
      </section>

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
        <button className="back-btn-link" style={{ padding: '1.5rem', fontSize: '1.25rem', cursor: 'pointer', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '8px', fontWeight: 'bold', position: 'relative' }} onClick={() => navigate('/chatsocial')}>
          {t('chat')}
          <ContadorMensajes />
        </button>
      </nav>

      <section className="control-panel" style={{ marginTop: '2rem', display: 'block' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--accent)' }}>
           {t('statisticsBoard')}
        </h2>
        
        <div className="stats-grid" style={{
          display: 'grid', 
          gap: '1.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
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

          <ColumnaTablon color="var(--rarity-legendary)" titulo={t("boardTopCardAll")}>
            {tablon?.cartaMasAlta ? <CartaMini carta={tablon.cartaMasAlta} t={t} /> : <p>…</p>}
          </ColumnaTablon>

          <ColumnaTablon color="var(--rarity-epic)" titulo={t("boardTopCardMine")}>
            {tablon?.miCartaMasAlta ? (
              <CartaMini carta={tablon.miCartaMasAlta} t={t} />
            ) : (
              <p>{tablon ? t("boardNoCards") : '…'}</p>
            )}
          </ColumnaTablon>

          <ColumnaTablon color="var(--rarity-rare)" titulo={t("boardFriendsOnline")}>
            {!tablon ? <p>…</p> : tablon.amigos.length === 0 ? (
              <p>{t("boardNoFriends")}</p>
            ) : (
              <>
                <p style={estilosTablon.cifra}>
                  {t("boardOnlineCount", { count: tablon.amigos.filter((a) => a.estado !== 'offline').length })}
                </p>
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

      {/* MODAL REUTILIZANDO EL COMPONENTE DEL ÁLBUM */}
      {integranteActivo && (
        <AnimatePresence mode="wait">
          <div key={integranteActivo.login} style={{ position: 'relative' }}>
            <ModalDetalleCarta
              carta={integranteActivo}
              usuariosRegistrados={new Set(integrantes.map((i) => i.loginUsuario))}
              onCerrar={() => setIndiceSeleccionado(null)}
            />

            {/* Flecha Izquierda (Anterior) */}
            <Button
              type="button"
              className="pagination-btn"
              onClick={irAnterior}
              aria-label={t("previousMember")}
              style={{
                position: 'fixed',
                top: '50%',
                left: 'calc(50% - 230px)', // Posicionada justo al borde izquierdo de la carta
                transform: 'translateY(-50%)',
                zIndex: 1100,
                padding: '0.4rem 0.7rem',  // Botón un poco más pequeño
                fontSize: '0.9rem',
              }}
            >
              <span aria-hidden="true">&#9664;</span>
            </Button>

            {/* Flecha Derecha (Siguiente) */}
            <Button
              type="button"
              className="pagination-btn"
              onClick={irSiguiente}
              aria-label={t("nextMember")}
              style={{
                position: 'fixed',
                top: '50%',
                right: 'calc(50% - 230px)', // Posicionada justo al borde derecho de la carta
                transform: 'translateY(-50%)',
                zIndex: 1100,
                padding: '0.4rem 0.7rem',  // Botón un poco más pequeño
                fontSize: '0.9rem',
              }}
            >
              <span aria-hidden="true">&#9654;</span>
            </Button>
          </div>
        </AnimatePresence>
      )}

      <PieLegal estilo={{ marginTop: '3rem' }} />
    </main>
  );
}

export default Home;