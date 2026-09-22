import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

/**
 * REGALO DIARIO
 * -------------
 * Botón flotante con el regalo del día. Muestra un punto rojo cuando tienes
 * sobres sin recoger, y el número de sobres que te quedan sin abrir.
 *
 * Cómo funciona por dentro:
 *   1) Pregunta a /api/users/me/ si te toca regalo hoy (solo informa)
 *   2) Pregunta a /api/cards/sobres/ cuántos sobres tienes
 *   3) Al pulsar, llama a /api/cards/sobres/reclamar/ (esto sí entrega)
 *
 * 🎨 KONRAD Y SERGIO: va flotando arriba a la derecha para no tocar vuestra
 * maquetación. Usa las variables de color de styles.css. Movedlo, cambiadlo o
 * integradlo donde queráis: lo visual está todo en el objeto 'estilos'.
 */

const estilos = {
  contenedor: {
    position: 'fixed',
    bottom: '2rem',
    left: '2rem',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
    gap: '0.6rem',
    fontFamily: 'var(--font-body)',
  },
  boton: {
    position: 'relative',
    width: '58px',
    height: '58px',
    borderRadius: '50%',
    border: '1px solid var(--border-default)',
    background: 'var(--surface-raised)',
    color: 'var(--text-primary)',
    fontSize: '1.6rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  botonConRegalo: {
    borderColor: 'var(--border-accent)',
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
  },
  punto: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#ef4444',
    border: '2px solid var(--surface-raised)',
  },
  contador: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: '999px',
    padding: '0.3rem 0.75rem',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  aviso: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-accent)',
    borderRadius: '10px',
    padding: '0.6rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    maxWidth: '230px',
    textAlign: 'left',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
};

function RegaloDiario() {
  const { t } = useI18n();
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const [disponible, setDisponible] = useState(false);
  const [sobres, setSobres] = useState(0);
  const [aviso, setAviso] = useState('');
  const [reclamando, setReclamando] = useState(false);
  const [visible, setVisible] = useState(false); // solo se muestra si hay sesión

  // Al cargar: ¿me toca regalo? ¿cuántos sobres tengo?
  const consultar = async () => {
    try {
      const resYo = await fetch(`${apiBaseUrl}/users/me/`, { credentials: 'include' });
      if (!resYo.ok) return; // sin sesión: el botón no se enseña
      const yo = await resYo.json();
      setVisible(true);
      setDisponible(Boolean(yo.regalo_disponible));

      const resSobres = await fetch(`${apiBaseUrl}/cards/sobres/`, { credentials: 'include' });
      if (resSobres.ok) {
        const datos = await resSobres.json();
        setSobres(datos.sobres?.comun ?? 0);
      }
    } catch (e) {
      console.error('No se pudo consultar el regalo diario:', e);
    }
  };

  useEffect(() => { consultar(); }, []);

  const recoger = async () => {
    if (reclamando) return; // un doble clic no debe reclamar dos veces
    if (!disponible) {
      setAviso('Ya has recogido tu regalo de hoy. Vuelve mañana 🌙');
      return;
    }

    setReclamando(true);
    try {
      // Django exige el token para las peticiones que envían datos
      const resToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();

      const res = await fetch(`${apiBaseUrl}/cards/sobres/reclamar/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAviso(datos.error || 'No se ha podido recoger el regalo.');
        setDisponible(false);
        return;
      }

      setAviso(`🎉 ¡+${datos.sobres_recibidos} sobres! Ábrelos en la tienda.`);
      setSobres(datos.sobres_totales ?? sobres);
      setDisponible(false);
    } catch (e) {
      console.error('Error al recoger el regalo:', e);
      setAviso('No se ha podido conectar con el servidor.');
    } finally {
      setReclamando(false);
    }
  };

  // El aviso se va solo a los 5 segundos
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  if (!visible) return null;

  return (
    <div style={estilos.contenedor}>
      <button
        type="button"
        onClick={recoger}
        disabled={reclamando}
        title={disponible ? t('claimDailyGift') : t('giftAlreadyClaimed')}
        style={{ ...estilos.boton, ...(disponible ? estilos.botonConRegalo : {}) }}
      >
        {reclamando ? '⏳' : '🎁'}
        {disponible && <span style={estilos.punto} />}
      </button>

      {sobres > 0 && (
        <span style={estilos.contador}>
          {sobres} {sobres === 1 ? 'sobre sin abrir' : 'sobres sin abrir'}
        </span>
      )}

      {aviso && <div style={estilos.aviso}>{aviso}</div>}
    </div>
  );
}

export default RegaloDiario;
