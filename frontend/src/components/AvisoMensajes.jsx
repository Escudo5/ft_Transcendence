import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

/**
 * AVISO DE LO QUE TE ESPERA EN EL CHAT
 * ------------------------------------
 * Un botón flotante que aparece SOLO cuando tienes algo pendiente, con el
 * número encima. Al pulsarlo te lleva al chat.
 *
 * Avisa de DOS cosas: mensajes sin leer y propuestas de intercambio sin
 * responder. Las dos vienen de la misma petición (/api/chat/sin-leer/), que
 * ya se hacía cada 10 segundos: así los intercambios no cuestan ni una
 * petición más, ni hace falta un segundo globo peleándose por el mismo
 * rincón de la pantalla.
 *
 * Si lo único pendiente es un intercambio, el icono cambia de 💬 a 🔄, para
 * saber de qué es el aviso antes de pulsarlo.
 *
 * Por qué existe: el chat funcionaba pero, si alguien te escribía estando en
 * el álbum o en la portada, no te enterabas hasta que abrías el chat por tu
 * cuenta. Un chat del que no te avisan es un chat que nadie mira. Con los
 * intercambios pasaba lo mismo: te proponían un cambio y no había forma de
 * enterarse.
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
  const { t } = useI18n();
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  const [total, setTotal] = useState(0);
  // 🔄 Propuestas de intercambio sin responder. Van aparte del total de
  // mensajes para poder decir "2 mensajes y 1 intercambio" en vez de un "3"
  // que no explica de qué es.
  const [intercambios, setIntercambios] = useState(0);
  const [deQuien, setDeQuien] = useState([]); // logins de quien te ha escrito
  const [ruta, setRuta] = useState(window.location.pathname);

  // En la portada NO hace falta: allí el aviso va pegado al botón de
  // ChatSocial (ContadorMensajes.jsx), que es donde uno lo busca. Este
  // flotante es para el resto de pantallas, donde no hay botón al que pegarlo.
  const enLaPortada = ['/', '/home'].includes(ruta.toLowerCase());

  useEffect(() => {
    let vivo = true;

    async function mirar() {
      // Si estamos en la portada ni se pregunta: el contador del botón ya lo
      // hace, y no tiene sentido preguntar dos veces lo mismo cada 10 segundos
      setRuta(window.location.pathname);
      if (['/', '/home'].includes(window.location.pathname.toLowerCase())) {
        setTotal(0);
        setIntercambios(0);
        return;
      }
      try {
        const res = await fetch(`${apiBaseUrl}/chat/sin-leer/`, { credentials: 'include' });
        // Sin sesión responde 401/403: no es un fallo, es que no hay nadie
        // dentro. Se deja el contador a cero y no se enseña nada.
        if (!vivo) return;
        if (!res.ok) {
          setTotal(0);
          setIntercambios(0);
          return;
        }
        const datos = await res.json();
        setTotal(datos.total || 0);
        setIntercambios(datos.intercambios || 0);
        // Quién te está esperando, por mensaje o por propuesta. Se juntan sin
        // repetir: si alguien te ha escrito Y te ha propuesto un cambio, sale
        // una vez.
        setDeQuien([...new Set([
          ...Object.keys(datos.por_persona || {}),
          ...Object.keys(datos.intercambios_por_persona || {}),
        ])]);
      } catch {
        // Si el servidor no responde, mejor no enseñar un aviso a medias
        if (vivo) { setTotal(0); setIntercambios(0); }
      }
    }

    mirar();
    const reloj = setInterval(mirar, CADA_CUANTO);
    return () => { vivo = false; clearInterval(reloj); };
  }, [apiBaseUrl]);

  // Nada que avisar, o estamos en la portada (allí lo lleva el botón)
  //
  // Sí se enseña estando DENTRO del chat, a propósito: si te escribe alguien
  // con quien no tienes la conversación abierta, la lista de la izquierda lo
  // marca con su bolita, pero el flotante lo hace imposible de perder.
  const pendientes = total + intercambios;
  if (pendientes === 0 || enLaPortada) return null;

  // El texto se arma con lo que haya de verdad, para que no ponga
  // "0 mensajes" cuando lo único pendiente es un intercambio.
  const trozos = [];
  if (total) trozos.push(t('unreadMessages', { count: total, s: total === 1 ? '' : 's' }));
  if (intercambios) trozos.push(t('pendingTrades', { count: intercambios, s: intercambios === 1 ? '' : 's' }));
  // Si SOLO hay intercambios, el icono cambia a las dos flechas: así se
  // sabe de qué es el aviso antes de pulsarlo.
  const soloIntercambios = total === 0 && intercambios > 0;

  return (
    <button
      onClick={() => {
        // Se va a la conversación de quien nos espera, no a la lista pelada.
        // Sin esto llegabas al chat y tenías que adivinar quién, que es justo
        // lo que el aviso venía a evitar. Y si ya estabas en /chatsocial,
        // mandarte a la MISMA dirección no hacía nada visible.
        // Si te esperan varios, se abre el primero: mejor entrar en una
        // conversación que quedarte mirando la lista. Los demás siguen
        // marcados con su bolita en la columna de la izquierda.
        window.location.href = '/chatsocial'
          + (deQuien.length ? `?con=${encodeURIComponent(deQuien[0])}` : '');
      }}
      title={
        t('pendingTitle', { items: trozos.join(' y ') })
        + (deQuien.length ? ` de ${deQuien.join(', ')}` : '')
      }
      style={{
        position: 'fixed',
        // Debajo del regalo diario, que ocupa la esquina de arriba
        top: '6.5rem',
        right: '1.5rem',
        zIndex: 40,
        width: '58px',
        height: '58px',
        borderRadius: '50%',
        border: '1px solid var(--accent)',
        background: 'var(--surface-raised)',
        color: 'var(--text-primary)',
        fontSize: '1.6rem',
        cursor: 'pointer',
        boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
      }}
    >
      {soloIntercambios ? '🔄' : '💬'}
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
        {pendientes > 99 ? '99+' : pendientes}
      </span>
    </button>
  );
}
