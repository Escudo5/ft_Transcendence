import { useEffect, useState } from 'react';

/**
 * AVISO DE MENSAJES SIN LEER
 * --------------------------
 * Un botón flotante que aparece SOLO cuando tienes mensajes sin leer, con el
 * número encima. Al pulsarlo te lleva al chat.
 *
 * Por qué existe: el chat funcionaba pero, si alguien te escribía estando en
 * el álbum o en la portada, no te enterabas hasta que abrías el chat por tu
 * cuenta. Un chat del que no te avisan es un chat que nadie mira.
 *
 * Está copiado del patrón de RegaloDiario: se monta en App.jsx, fuera de las
 * páginas, para que se vea estés donde estés. Va debajo del regalo para no
 * taparlo.
 *
 * ⚠️ Va FUERA del router (igual que el regalo), así que aquí no se pueden usar
 * <Link> ni los hooks de react-router: dejarían la página en blanco. Por eso
 * la navegación se hace con window.location.
 */

const CADA_CUANTO = 10000; // 10 segundos

export default function AvisoMensajes() {
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  const [total, setTotal] = useState(0);
  const [ruta, setRuta] = useState(window.location.pathname);

  useEffect(() => {
    let vivo = true;

    async function mirar() {
      try {
        const res = await fetch(`${apiBaseUrl}/chat/sin-leer/`, { credentials: 'include' });
        // Sin sesión responde 401/403: no es un fallo, es que no hay nadie
        // dentro. Se deja el contador a cero y no se enseña nada.
        if (!vivo) return;
        if (!res.ok) {
          setTotal(0);
          return;
        }
        setTotal((await res.json()).total || 0);
        setRuta(window.location.pathname);
      } catch {
        // Si el servidor no responde, mejor no enseñar un aviso a medias
        if (vivo) setTotal(0);
      }
    }

    mirar();
    const reloj = setInterval(mirar, CADA_CUANTO);
    return () => { vivo = false; clearInterval(reloj); };
  }, [apiBaseUrl]);

  // Nada que avisar, o ya estás en el chat leyéndolos
  if (total === 0 || ruta.toLowerCase().includes('chatsocial')) return null;

  return (
    <button
      onClick={() => { window.location.href = '/chatsocial'; }}
      title={`Tienes ${total} ${total === 1 ? 'mensaje sin leer' : 'mensajes sin leer'}`}
      style={{
        position: 'fixed',
        // Debajo del regalo diario, que ocupa la esquina de arriba
        top: '6.5rem',
        right: '1.5rem',
        zIndex: 40,
        width: '58px',
        height: '58px',
        borderRadius: '50%',
        border: '1px solid var(--accent-color)',
        background: 'var(--bg-card-base)',
        color: 'var(--text-primary)',
        fontSize: '1.6rem',
        cursor: 'pointer',
        boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
      }}
    >
      💬
      <span
        style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          minWidth: '22px',
          height: '22px',
          borderRadius: '11px',
          background: '#dc2626',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 700,
          lineHeight: '22px',
          padding: '0 5px',
          boxSizing: 'border-box',
        }}
      >
        {total > 99 ? '99+' : total}
      </span>
    </button>
  );
}
