import { useRef, useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { BotonIntercambio, ModalPropuestaIntercambio, MensajeIntercambio } from './Intercambio';

const LARGO_MAXIMO = 1000;
const API = import.meta.env.VITE_API_URL || '/api';

async function pedirTokenCSRF() {
  const respuesta = await fetch(`${API}/users/csrf/`, { credentials: 'include' });
  const datos = await respuesta.json();
  return datos.csrfToken;
}

/* ⚠️ Recibe `t` y `locale` como parametros y no por el gancho: esta funcion
 * vive FUERA del componente, y los hooks de React solo se pueden llamar
 * dentro. Quien la usa se los pasa. */
function obtenerEtiquetaDelDia(fechaMensaje, t, locale) {
  const fechaObjeto = new Date(fechaMensaje);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  const esMismoDia = (fechaA, fechaB) => fechaA.toDateString() === fechaB.toDateString();

  if (esMismoDia(fechaObjeto, hoy)) return t('today');
  if (esMismoDia(fechaObjeto, ayer)) return t('yesterday');

  return fechaObjeto.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    ...(fechaObjeto.getFullYear() !== hoy.getFullYear() ? { year: 'numeric' } : {}),
  });
}

function AreaChat({
  chatSeleccionado,
  setChatSeleccionado,
  mensajes,
  borrador,
  setBorrador,
  enviando,
  enviarMensaje,
  visitarPerfil,
  alternarBloqueoUsuario,
  cargando,
  error,
  amigos,
  // Lo pasa ChatSocial: vuelve a pedir las propuestas al momento, en vez de
  // esperar a la siguiente vuelta del refresco de 3 segundos.
  recargarIntercambios,
}) {
  const { t, languageInfo } = useI18n();
  const finDeLaListaRef = useRef(null);
  const [modalIntercambioAbierto, setModalIntercambioAbierto] = useState(false);

  /* 📜 EL SCROLL AUTOMÁTICO, QUE ANTES TE ARRASTRABA ABAJO (Nacho, 6/10)
   *
   * Aquí había un `scrollIntoView` que bajaba al último mensaje CADA VEZ que
   * cambiaba la lista, sin mirar dónde estabas. Si te ibas hacia arriba a leer
   * y el otro escribía, te devolvía abajo de un tirón (y con 'smooth', medio
   * segundo peleando contra tu dedo).
   *
   * Ahora solo baja si YA estabas abajo, o si el mensaje nuevo es tuyo (lo
   * acabas de escribir y esperas verlo). Si estabas leyendo arriba, no te mueve
   * y aparece un botón para bajar cuando quieras.
   *
   * ⚠️ POR QUÉ LA POSICIÓN SE APUNTA AL HACER SCROLL Y NO DENTRO DEL EFECTO:
   * el efecto corre DESPUÉS de pintar el mensaje nuevo, así que ahí el alto ya
   * ha crecido. Midiendo en ese momento, un mensaje largo daría "no estabas
   * abajo" aunque lo estuvieras, y no bajaría. Por eso se guarda en una
   * referencia cada vez que el usuario mueve el scroll, que es ANTES.
   */
  const contenedorMensajesRef = useRef(null);
  const estabaAbajoRef = useRef(true);   // al abrir una conversación, abajo
  const [hayMensajesNuevosAbajo, setHayMensajesNuevosAbajo] = useState(false);

  // Cuánto puedes haberte separado del final y seguir contando como "abajo".
  // Sin margen, un píxel de diferencia ya contaría como que estás leyendo.
  const MARGEN_ABAJO = 100;

  const bajarAlFinal = () => {
    finDeLaListaRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHayMensajesNuevosAbajo(false);
  };

  const alHacerScroll = () => {
    const caja = contenedorMensajesRef.current;
    if (!caja) return;
    const abajo = caja.scrollHeight - caja.scrollTop - caja.clientHeight <= MARGEN_ABAJO;
    estabaAbajoRef.current = abajo;
    // Si bajas tú a mano, el aviso ya no hace falta.
    if (abajo) setHayMensajesNuevosAbajo(false);
  };

  // ⚠️ Este useState tiene que estar AQUÍ ARRIBA, con los demás, y no abajo
  // junto a las funciones que lo usan.
  //
  // Unas líneas más abajo hay un `if (!chatSeleccionado) return ...`. React
  // cuenta los hooks por orden en cada pintada, así que un useState puesto
  // después de ese return se ejecutaría solo cuando hay chat elegido, y la
  // cuenta cambiaría: "Rendered more hooks than during the previous render".
  // Es la regla de los hooks: todos arriba, ninguno detrás de un return ni
  // dentro de un if.
  //
  // Guarda lo que ha contestado el servidor del último intercambio: puede ser
  // una buena noticia o un no con su motivo.
  const [avisoIntercambio, setAvisoIntercambio] = useState('');

  // Al cambiar de conversación se empieza abajo, como siempre.
  useEffect(() => {
    estabaAbajoRef.current = true;
    setHayMensajesNuevosAbajo(false);
  }, [chatSeleccionado?.login]);

  useEffect(() => {
    if (!mensajes.length) return;

    const ultimo = mensajes[mensajes.length - 1];
    if (ultimo.mio || estabaAbajoRef.current) bajarAlFinal();
    else setHayMensajesNuevosAbajo(true);
  }, [mensajes]);

  if (!chatSeleccionado) {
    return (
      <div className="chat-area">
        <div className="no-chat-selected">
          {cargando ? (
            <p>{t('loadingFriends')}</p>
          ) : error ? (
            <>
              <span style={{ fontSize: '4rem' }}>⚠️</span>
              <h3>{t('somethingWentWrong')}</h3>
              <p style={{ color: '#ff9b9b' }}>{error}</p>
            </>
          ) : amigos.length === 0 ? (
            <>
              <span style={{ fontSize: '4rem' }}>👋</span>
              <h3>{t('noFriendsYet')}</h3>
              <p>{t('noFriendsHint')}</p>
            </>
          ) : (
            <>
              <span style={{ fontSize: '4rem' }}>🌐</span>
              <h3>{t('socialModule')}</h3>
              <p>{t('pickAFriend')}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const yoLoHeBloqueado = chatSeleccionado.bloqueado;
  const meHaBloqueadoAEstudiando = chatSeleccionado.meHaBloqueado;
  const hayBloqueoActivo = yoLoHeBloqueado || meHaBloqueadoAEstudiando;


  const handleEnviarPropuestaIntercambio = async ({ cartaOfrecida, cartaPedida }) => {
    setAvisoIntercambio('');
    try {
      const token = await pedirTokenCSRF();
      const respuesta = await fetch(`${API}/cards/intercambios/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
        body: JSON.stringify({
          para: chatSeleccionado.login,
          carta_ofrecida: cartaOfrecida.id,
          carta_pedida: cartaPedida.id,
        }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setAvisoIntercambio(datos.detail || t('tradeProposalSendError'));
        return;
      }
      // Para que aparezca ya, sin esperar a la siguiente vuelta de 3 segundos
      recargarIntercambios?.();
    } catch (err) {
      console.error('Error al enviar propuesta de intercambio:', err);
      setAvisoIntercambio(t('tradeProposalSendError'));
    }
  };

  const handleResponderIntercambio = async (idPropuesta, accion) => {
    setAvisoIntercambio('');
    try {
      const token = await pedirTokenCSRF();
      const respuesta = await fetch(`${API}/cards/intercambios/${idPropuesta}/`, {
        method: 'PATCH',   // PATCH y no POST: se cambia el estado de algo que ya existe
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
        body: JSON.stringify({ accion }), // 'aceptar' o 'rechazar'
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setAvisoIntercambio(datos.detail || t(accion === 'aceptar' ? 'tradeAcceptError' : 'tradeRejectError'));
        return;
      }
      setAvisoIntercambio(datos.detail || '');
      recargarIntercambios?.();
    } catch (err) {
      console.error(`Error al ${accion} el intercambio:`, err);
      setAvisoIntercambio(t(accion === 'aceptar' ? 'tradeAcceptError' : 'tradeRejectError'));
    }
  };

  return (
    <div className="chat-area">
      {/* CABECERA DEL CHAT */}
      <div className="chat-header">
        <button
          type="button"
          className="mobile-chat-back"
          onClick={() => setChatSeleccionado(null)}
          aria-label={t('backToChats')}
        >
          ←
        </button>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
          onClick={() => visitarPerfil(chatSeleccionado.login)}
        >
          <div className="avatar-header">{chatSeleccionado.avatar}</div>
          <div>
            <h4 style={{ margin: 0 }}>
              {chatSeleccionado.nombre} ({chatSeleccionado.login})
            </h4>
            <span style={{ fontSize: '0.8rem', color: hayBloqueoActivo ? '#ff4d4d' : '#00ffcc' }}>
              {yoLoHeBloqueado
                ? t('blockedByYou')
                : meHaBloqueadoAEstudiando
                ? t('blockedYouShort')
                : chatSeleccionado.estado}
            </span>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE MENSAJES
          position: relative para que el botón de "mensajes nuevos" se coloque
          respecto a esta caja y no respecto a la pantalla. */}
      <div
        ref={contenedorMensajesRef}
        onScroll={alHacerScroll}
        style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', position: 'relative' }}
      >
        {mensajes.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: '#8b92b0' }}>
            <p>{t('noMessagesYet')}</p>
            <p style={{ fontSize: '0.9rem' }}>{t('writeSomething')}</p>
          </div>
        ) : (
          mensajes.map((mensajeActual, indice) => {
            const etiquetaDia = obtenerEtiquetaDelDia(mensajeActual.fecha, t, languageInfo.locale);
            const mensajeAnterior = mensajes[indice - 1];
            const cambiaElDia =
              indice === 0 || etiquetaDia !== obtenerEtiquetaDelDia(mensajeAnterior.fecha, t, languageInfo.locale);

            return (
              <div key={mensajeActual.id}>
                {cambiaElDia && (
                  <div style={{ textAlign: 'center', margin: '1rem 0 0.8rem' }}>
                    <span
                      style={{
                        backgroundColor: '#1f2433',
                        border: '1px solid #2a2e3d',
                        color: '#8b92b0',
                        fontSize: '0.72rem',
                        padding: '0.25rem 0.8rem',
                        borderRadius: '12px',
                      }}
                    >
                      {etiquetaDia}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: mensajeActual.mio ? 'flex-end' : 'flex-start',
                    marginBottom: '0.6rem',
                  }}
                >
                  {/* SI ES UN INTERCAMBIO MUESTRA LA TARJETA; SI NO, UN GLOBO DE TEXTO */}
                  {mensajeActual.esIntercambio ? (
                    <MensajeIntercambio
                      propuesta={mensajeActual.propuesta}
                      esMio={mensajeActual.mio}
                      onResponder={handleResponderIntercambio}
                    />
                  ) : (
                    <div
                      style={{
                        backgroundColor: mensajeActual.mio ? 'rgba(0, 255, 204, 0.15)' : '#1f2433',
                        border: `1px solid ${mensajeActual.mio ? '#00ffcc' : '#2a2e3d'}`,
                        padding: '0.6rem 1rem',
                        borderRadius: '10px',
                        maxWidth: '70%',
                        wordBreak: 'break-word',
                      }}
                    >
                      <div style={{ whiteSpace: 'pre-wrap' }}>{mensajeActual.texto}</div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#8b92b0',
                          marginTop: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '0.3rem',
                        }}
                        title={new Date(mensajeActual.fecha).toLocaleString(languageInfo.locale)}
                      >
                        <span>
                          {new Date(mensajeActual.fecha).toLocaleTimeString(languageInfo.locale, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {/* ICONO DE CONFIRMACIÓN DE LECTURA (Solo mensajes propios) */}
                        {mensajeActual.mio && (
                          <span
                            style={{
                              color: mensajeActual.leido ? '#00ffcc' : '#8b92b0',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              lineHeight: 1,
                            }}
                            title={mensajeActual.leido ? t('messageRead') : t('messageSent')}
                          >
                            {mensajeActual.leido ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={finDeLaListaRef} />
      </div>

      {/* 📨 Solo sale si ha llegado algo mientras leías hacia arriba. Va fuera
          de la caja que hace scroll, para que se quede quieto y no suba con
          los mensajes. */}
      {hayMensajesNuevosAbajo && (
        <button
          type="button"
          onClick={bajarAlFinal}
          style={{
            position: 'absolute',
            bottom: '6.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 5,
            padding: '0.45rem 1rem',
            borderRadius: '999px',
            border: '1px solid var(--accent)',
            background: 'var(--surface-raised)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          }}
        >
          {t('newMessagesBelow')}
        </button>
      )}

      {/* AVISOS DE BLOQUEO O CAJA DE TEXTO + BOTÓN INTERCAMBIO */}
      {yoLoHeBloqueado ? (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#151821',
            borderTop: '1px solid #2a2e3d',
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#ff4d4d', fontSize: '0.9rem', marginRight: '1rem' }}>
            🚫 Has bloqueado a este usuario.
          </span>
          <button
            onClick={() => alternarBloqueoUsuario(chatSeleccionado.login)}
            className="btn-volver"
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
          >
            {t('unblock')}
          </button>
        </div>
      ) : meHaBloqueadoAEstudiando ? (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#151821',
            borderTop: '1px solid #2a2e3d',
            textAlign: 'center',
            color: '#8b92b0',
            fontSize: '0.9rem',
          }}
        >
          {t('blockedByThisUser')}
        </div>
      ) : (
        <form
          onSubmit={enviarMensaje}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.8rem 1rem',
            borderTop: '1px solid #2a2e3d',
            flexWrap: 'wrap',
          }}
        >
          {/* Lo que ha dicho el servidor del último intercambio. Puede ser una
              buena noticia ("¡Hecho! Le has dado X y has recibido Y") o un no
              con su motivo ("ya no tiene esa carta repetida"). */}
          {avisoIntercambio && (
            <div
              onClick={() => setAvisoIntercambio('')}
              style={{
                flexBasis: '100%',
                backgroundColor: 'rgba(255, 170, 0, 0.12)',
                border: '1px solid #ffaa00',
                color: '#ffaa00',
                borderRadius: '8px',
                padding: '0.5rem 0.8rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {avisoIntercambio}
            </div>
          )}

          {/* BOTÓN DE PROPUESTA DE INTERCAMBIO DE CARTAS */}
          <BotonIntercambio
            onClick={() => setModalIntercambioAbierto(true)}
            disabled={enviando}
          />

          <input
            type="text"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            placeholder={t('writeToUser', { name: chatSeleccionado.nombre })}
            maxLength={LARGO_MAXIMO}
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: '20px',
              border: '1px solid #2a2e3d',
              backgroundColor: '#0d1017',
              color: '#fff',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={enviando || !borrador.trim()}
            style={{
              padding: '0.7rem 1.4rem',
              borderRadius: '20px',
              border: '1px solid #00ffcc',
              backgroundColor: 'rgba(0, 255, 204, 0.15)',
              color: '#00ffcc',
              fontWeight: 'bold',
              cursor: enviando || !borrador.trim() ? 'not-allowed' : 'pointer',
              opacity: enviando || !borrador.trim() ? 0.5 : 1,
            }}
          >
            {enviando ? '…' : 'Enviar'}
          </button>
        </form>
      )}

      {/* MODAL DE SELECCIÓN DE CARTAS */}
      <ModalPropuestaIntercambio
        isOpen={modalIntercambioAbierto}
        onClose={() => setModalIntercambioAbierto(false)}
        usuarioDestino={chatSeleccionado}
        onEnviarPropuesta={handleEnviarPropuestaIntercambio}
      />
    </div>
  );
}

export default AreaChat;