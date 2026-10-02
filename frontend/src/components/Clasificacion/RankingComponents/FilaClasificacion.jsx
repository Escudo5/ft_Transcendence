import { Link } from 'react-router-dom';
import { Avatar, ProgressBar } from '../../ui';

const MEDALLA = { 1: '🥇', 2: '🥈', 3: '🥉' };

const obtenerEstiloFila = (soyYo) => ({
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
});

const obtenerEstiloPosicion = (posicion) => ({
  fontFamily: 'var(--font-heading)',
  fontWeight: 800,
  fontSize: posicion <= 3 ? '1.4rem' : '1.05rem',
  width: '2.4rem',
  textAlign: 'center',
  flexShrink: 0,
  color:
    posicion === 1 ? 'var(--rarity-legendary)'
    : posicion === 2 ? '#cbd5e1'
    : posicion === 3 ? '#d97706'
    : 'var(--text-secondary)',
});

export const FilaClasificacion = ({ usuario, formateador, traduccion }) => {
  return (
    <Link to={`/perfil/${usuario.username}`} style={obtenerEstiloFila(usuario.soy_yo)}>
      <span style={obtenerEstiloPosicion(usuario.posicion)}>
        {MEDALLA[usuario.posicion] || usuario.posicion}
      </span>

      <Avatar src={usuario.profile_image} alt={usuario.username} size="small" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {usuario.nombre}{' '}
          {usuario.soy_yo && <span style={{ color: 'var(--accent)' }}>· {traduccion('you')}</span>}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          @{usuario.username}
        </div>
        <ProgressBar value={usuario.porcentaje} />
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.1rem',
            color: 'var(--accent)',
          }}
        >
          {usuario.cartas_distintas}
        </div>
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {traduccion('cards')}
        </div>
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginTop: '0.35rem',
          }}
        >
          {formateador.format(usuario.puntos ?? 0)} {traduccion('points')}
        </div>
      </div>
    </Link>
  );
};