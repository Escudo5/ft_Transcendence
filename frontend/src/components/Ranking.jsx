import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Card, ProgressBar } from './ui';

/**
 * CLASIFICACIÓN DE COLECCIONISTAS
 * -------------------------------
 * Quién tiene más cartas distintas. Se ordena por colección y no por el elo
 * porque el elo sigue siendo 1000 para todo el mundo (todavía no hay juego que
 * lo mueva), así que un ranking por elo sería una lista plana.
 *
 * Cada fila enlaza al perfil de esa persona.
 */

const estilos = {
  tarjeta: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  fila: (soyYo) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    background: soyYo ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
    border: soyYo ? '1px solid var(--accent)' : '1px solid transparent',
    borderBottom: soyYo ? '1px solid var(--accent)' : '1px solid var(--border-default)',
    textDecoration: 'none',
    color: 'inherit',
  }),
  posicion: (pos) => ({
    fontFamily: 'var(--font-heading)',
    fontWeight: 800,
    fontSize: pos <= 3 ? '1.4rem' : '1.05rem',
    width: '2.4rem',
    textAlign: 'center',
    flexShrink: 0,
    color:
      pos === 1 ? 'var(--rarity-legendary)'
      : pos === 2 ? '#cbd5e1'
      : pos === 3 ? '#d97706'
      : 'var(--text-secondary)',
  }),
  foto: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    border: '2px solid var(--border-default)',
  },
  fotoVacia: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'var(--surface-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nombre: {
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  login: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  cifra: {
    fontFamily: 'var(--font-heading)',
    fontWeight: 800,
    fontSize: '1.1rem',
    color: 'var(--accent)',
  },
  cifraEtiqueta: {
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  barraFuera: {
    background: 'var(--surface-overlay)',
    borderRadius: '999px',
    height: '6px',
    overflow: 'hidden',
    marginTop: '0.3rem',
  },
  barraDentro: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: 'var(--accent)',
  }),
};

const MEDALLA = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Ranking() {
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`${apiBaseUrl}/cards/ranking/`, { credentials: 'include' });
        if (res.status === 401 || res.status === 403) {
          setError('Tienes que iniciar sesión para ver la clasificación.');
          return;
        }
        if (!res.ok) {
          setError('No se ha podido cargar la clasificación.');
          return;
        }
        setDatos(await res.json());
      } catch (e) {
        console.error('Error al cargar el ranking:', e);
        setError('No se ha podido conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [apiBaseUrl]);

  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-navigation floating-navigation">
          <Link to="/home" className="back-btn-link">← Volver al Inicio</Link>
          <Link to="/catalogo" className="back-btn-link">📂 Ver Álbum</Link>
        </div>
        <div className="logo-section" style={{ marginTop: '1rem' }}>
          <span className="logo-icon">🏆</span>
          <h1>Clasificación</h1>
        </div>
        <p className="subtitle">
          Los mejores coleccionistas del campus
          {datos && `, sobre ${datos.cartas_en_catalogo} cartas posibles`}
        </p>
      </header>

      <Card>
        {cargando ? (
          <p style={{ color: 'var(--text-secondary)' }}>Cargando clasificación…</p>
        ) : error ? (
          <p style={{ color: '#fca5a5', fontWeight: 600 }}>{error}</p>
        ) : datos.clasificacion.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Todavía no hay coleccionistas.</p>
        ) : (
          datos.clasificacion.map((u) => (
            <Link key={u.username} to={`/perfil/${u.username}`} style={estilos.fila(u.soy_yo)}>
              <span style={estilos.posicion(u.posicion)}>
                {MEDALLA[u.posicion] || u.posicion}
              </span>

              <Avatar src={u.profile_image} alt={u.username} size="small" />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={estilos.nombre}>
                  {u.nombre} {u.soy_yo && <span style={{ color: 'var(--accent)' }}>· tú</span>}
                </div>
                <div style={estilos.login}>@{u.username}</div>
                <ProgressBar value={u.porcentaje} />
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={estilos.cifra}>{u.cartas_distintas}</div>
                <div style={estilos.cifraEtiqueta}>cartas</div>
                {/* 🏆 Los puntos por rareza. Dos personas con las mismas
                    cartas pueden tener puntos muy distintos: una legendaria
                    vale 25 comunes. */}
                <div style={{ ...estilos.cifraEtiqueta, marginTop: '0.35rem' }}>
                  {(u.puntos ?? 0).toLocaleString('es-ES')} pts
                </div>
              </div>
            </Link>
          ))
        )}
      </Card>
    </main>
  );
}
