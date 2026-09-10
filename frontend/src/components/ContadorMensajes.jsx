import { useEffect, useState } from 'react';

/**
 * CONTADOR DE LO QUE TE ESPERA EN EL CHAT
 * ---------------------------------------
 * Una bolita roja con el número, para pegar encima de cualquier botón que
 * lleve al chat. Si no tienes nada pendiente, no pinta nada.
 *
 * Cuenta DOS cosas juntas: mensajes sin leer y propuestas de intercambio sin
 * responder. Las dos vienen de la misma petición, así que los intercambios no
 * cuestan ni una petición más.
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
  const [intercambios, setIntercambios] = useState(0);

  useEffect(() => {
    let vivo = true;

    async function mirar() {
      try {
        const res = await fetch(`${apiBaseUrl}/chat/sin-leer/`, { credentials: 'include' });
        if (!vivo) return;
        // Sin sesión responde 401/403: no es un fallo, es que no hay nadie
        if (!res.ok) { setTotal(0); setIntercambios(0); return; }
        const datos = await res.json();
        setTotal(datos.total || 0);
        setIntercambios(datos.intercambios || 0);
      } catch {
        if (vivo) { setTotal(0); setIntercambios(0); }
      }
    }

    mirar();
    const reloj = setInterval(mirar, 10000);
    return () => { vivo = false; clearInterval(reloj); };
  }, [apiBaseUrl]);

  const pendientes = total + intercambios;
  if (pendientes === 0) return null;

  // El texto se arma con lo que haya de verdad, para que no diga "0 mensajes"
  // cuando lo único pendiente es una propuesta de intercambio.
  const trozos = [];
  if (total) trozos.push(`${total} ${total === 1 ? 'mensaje' : 'mensajes'}`);
  if (intercambios) trozos.push(`${intercambios} ${intercambios === 1 ? 'intercambio' : 'intercambios'}`);

  return (
    <span
      title={`Tienes ${trozos.join(' y ')} sin responder`}
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
      {pendientes > 99 ? '99+' : pendientes}
    </span>
  );
}
