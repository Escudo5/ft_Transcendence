import { useEffect, useState } from 'react';

/**
 * CONTADOR DE MENSAJES SIN LEER
 * -----------------------------
 * Una bolita roja con el número, para pegar encima de cualquier botón que
 * lleve al chat. Si no tienes nada sin leer, no pinta nada.
 *
 * Se usa en el botón de ChatSocial de la portada. Está aparte del aviso
 * flotante (AvisoMensajes.jsx) porque son dos sitios distintos con el mismo
 * dato: en la portada el aviso va pegado a su botón, que es donde uno lo
 * busca; en el resto de pantallas no hay botón al que pegarlo, así que allí
 * flota en una esquina.
 *
 * ⚠️ Quien lo use tiene que ponerle 'position: relative' al elemento de
 * alrededor, o la bolita se irá a la esquina de la página.
 */
export default function ContadorMensajes() {
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let vivo = true;

    async function mirar() {
      try {
        const res = await fetch(`${apiBaseUrl}/chat/sin-leer/`, { credentials: 'include' });
        if (!vivo) return;
        // Sin sesión responde 401/403: no es un fallo, es que no hay nadie
        if (!res.ok) { setTotal(0); return; }
        setTotal((await res.json()).total || 0);
      } catch {
        if (vivo) setTotal(0);
      }
    }

    mirar();
    const reloj = setInterval(mirar, 10000);
    return () => { vivo = false; clearInterval(reloj); };
  }, [apiBaseUrl]);

  if (total === 0) return null;

  return (
    <span
      title={`Tienes ${total} ${total === 1 ? 'mensaje sin leer' : 'mensajes sin leer'}`}
      style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        minWidth: '24px',
        height: '24px',
        borderRadius: '12px',
        background: '#dc2626',
        color: '#fff',
        fontSize: '0.8rem',
        fontWeight: 700,
        lineHeight: '24px',
        textAlign: 'center',
        padding: '0 6px',
        boxSizing: 'border-box',
      }}
    >
      {total > 99 ? '99+' : total}
    </span>
  );
}
