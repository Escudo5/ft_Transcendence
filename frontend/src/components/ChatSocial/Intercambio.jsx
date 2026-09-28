import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';

const API = import.meta.env.VITE_API_URL || '/api';

/* ===========================================================================
   0. TRADUCIR LAS CARTAS DEL BACKEND AL FORMATO DE ESTA PANTALLA
   (Nacho, 10/09)

   El backend manda { id, login, titulo, foto, tier, coalicion, copias } y
   esta pantalla estaba escrita para { id, nombre, imagen, rareza }. En vez
   de renombrar el JSX de Konrad, se traduce aquí: así lo visual se queda
   como estaba y esto es lo único que hay que tocar si cambia el servidor.

   ⚠️ KONRAD: 'imagen' es un emoji según la rareza, porque tu pantalla pinta
   {carta.imagen} como texto. Va también 'foto', que es la foto de verdad del
   alumno en la Intra: si prefieres enseñar esa, cambia el <div> por un <img
   src={carta.foto}> y ya está, el dato ya te llega.
   =========================================================================== */
const EMOJI_POR_RAREZA = {
  'Junior': '🃏',
  'Senior': '🎴',
  'Transcender': '👾',
  'Legendario': '👑',
  'Staff': '👔',
  'Creator': '🎨',
};

// Las dos columnas de cartas del modal. Alto generoso pero limitado a lo que
// mide la ventana, para que en un portátil pequeño el modal siga cabiendo y no
// se salgan los botones de enviar por debajo.
const estiloLista = {
  maxHeight: 'min(45vh, 340px)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  // Un hueco a la derecha para que la barra de scroll, cuando aparezca, no se
  // monte encima del texto de las cartas.
  paddingRight: '0.3rem',
};


function adaptarCarta(c) {
  return {
    id: c.id,
    nombre: c.titulo || c.login,
    login: c.login,
    rareza: c.tier,
    imagen: EMOJI_POR_RAREZA[c.tier] || '🃏',
    foto: c.foto,
    copias: c.copias,
  };
}

/* Y lo mismo para una propuesta entera: del formato del servidor al que
   espera MensajeIntercambio. */
export function adaptarPropuesta(i) {
  return {
    id: i.id,
    loginDestino: i.para,
    // El servidor las manda en mayúsculas (PENDIENTE, ACEPTADO...) porque así
    // están escritas en la base de datos; aquí se esperan en minúsculas.
    estado: (i.estado || '').toLowerCase(),
    expiraEn: i.expira_en,
    cartaOfrecida: adaptarCarta(i.ofrece),
    cartaPedida: adaptarCarta(i.pide),
  };
}

/* ===========================================================================
   1. BOTÓN DE INTERCAMBIO (Icono tipo carta/Uno para poner junto al botón enviar)
   =========================================================================== */
export function BotonIntercambio({ onClick, disabled }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={t('proposeTrade')}
      style={{
        padding: '0.7rem',
        borderRadius: '50%',
        border: '1px solid #ffaa00',
        // Nacho, 10/09: era 'rgba(ff, 170, 0, 0.15)'. Ese "ff" no es un número,
        // así que el navegador se saltaba la línea entera sin avisar y el botón
        // salía sin fondo.
        backgroundColor: 'rgba(255, 170, 0, 0.15)',
        color: '#ffaa00',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '42px',
        height: '42px',
        flexShrink: 0,
      }}
    >
      {/* Icono vectorial estilo cartas de Uno / Swap */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3l4 4-4 4" />
        <path d="M20 7H4" />
        <path d="M8 21l-4-4 4-4" />
        <path d="M4 17h16" />
      </svg>
    </button>
  );
}

/* ===========================================================================
   2. MODAL DE SELECCIÓN DE CARTAS (Ofrecer vs Pedir)
   =========================================================================== */
export function ModalPropuestaIntercambio({ isOpen, onClose, usuarioDestino, onEnviarPropuesta }) {
  const { t } = useI18n();
  const [misRepetidas, setMisRepetidas] = useState([]);
  const [susRepetidas, setSusRepetidas] = useState([]);
  const [cartaOfrecida, setCartaOfrecida] = useState(null);
  const [cartaPedida, setCartaPedida] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!isOpen || !usuarioDestino) return;

    async function cargarCartasParaIntercambio() {
      setCargando(true);
      try {
        // 🔌 CONECTADO AL BACKEND (Nacho, 10/09).
        //
        // Antes eran DOS peticiones a /cartas/mis-repetidas/ y
        // /cartas/repetidas/<login>/. Esas rutas no existen: la de verdad es
        // UNA sola y trae las dos listas juntas, porque el servidor tiene que
        // comprobar de todas formas que sois amigos antes de enseñar nada.
        //
        //   GET /api/cards/intercambios/repetidas/<login>/
        //       -> { "mias": [...], "suyas": [...] }
        //
        // (Es "cards", en inglés, como el resto de rutas de cartas.)
        const respuesta = await fetch(
          `${API}/cards/intercambios/repetidas/${encodeURIComponent(usuarioDestino.login)}/`,
          { credentials: 'include' },
        );

        if (!respuesta.ok) {
          // 403 = no sois amigos, 404 = no existe. Listas vacías: la pantalla
          // ya sabe enseñar "No tienes repetidas".
          setMisRepetidas([]);
          setSusRepetidas([]);
          return;
        }

        const datos = await respuesta.json();
        setMisRepetidas((datos.mias || []).map(adaptarCarta));
        setSusRepetidas((datos.suyas || []).map(adaptarCarta));
      } catch (err) {
        console.error('Error al cargar cartas de intercambio:', err);
        setMisRepetidas([]);
        setSusRepetidas([]);
      } finally {
        setCargando(false);
      }
    }

    cargarCartasParaIntercambio();
  }, [isOpen, usuarioDestino]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cartaOfrecida || !cartaPedida) return;
    
    onEnviarPropuesta({
      cartaOfrecida,
      cartaPedida,
    });
    
    setCartaOfrecida(null);
    setCartaPedida(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#151821',
        border: '1px solid #2a2e3d',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '550px',
        padding: '1.5rem',
        color: '#fff',
      }}>
        <h3 style={{ marginTop: 0, color: '#ffaa00', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {t('tradeProposalWith', { user: usuarioDestino.nombre })}
        </h3>

        {cargando ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>{t('loadingBothCards')}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
              {/* COLUMNA 1: LO QUE TÚ OFRECES */}
              <div>
                <label style={{ fontSize: '0.85rem', color: '#8b92b0', display: 'block', marginBottom: '0.5rem' }}>
                  {t('youOfferLabel')} <b style={{ color: '#00ffcc' }}>{misRepetidas.length}</b>
                </label>
                {/* Nacho, 10/09: la caja medía 200px de alto, que dan para unas
                    4 cartas. Con 29 repetidas parecía que solo tenías 4, porque
                    en Mac la barra de scroll está escondida hasta que la mueves.
                    Ahora entran más y el número de arriba dice cuántas hay. */}
                <div style={{ ...estiloLista }}>
                  {misRepetidas.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#ff4d4d' }}>{t('youHaveNoDuplicates')}</span>
                  ) : (
                    misRepetidas.map((carta) => (
                      <button
                        key={carta.id}
                        type="button"
                        onClick={() => setCartaOfrecida(carta)}
                        style={{
                          padding: '0.6rem',
                          borderRadius: '8px',
                          border: cartaOfrecida?.id === carta.id ? '2px solid #00ffcc' : '1px solid #2a2e3d',
                          backgroundColor: cartaOfrecida?.id === carta.id ? 'rgba(0,255,204,0.1)' : '#1f2433',
                          color: '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div>{carta.imagen} <strong>{carta.nombre}</strong></div>
                        <small style={{ color: '#8b92b0' }}>{carta.rareza}</small>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* COLUMNA 2: LO QUE TÚ PIDES */}
              <div>
                <label style={{ fontSize: '0.85rem', color: '#8b92b0', display: 'block', marginBottom: '0.5rem' }}>
                  {t('youAskLabel')} <b style={{ color: '#ffaa00' }}>{susRepetidas.length}</b>
                </label>
                <div style={{ ...estiloLista }}>
                  {susRepetidas.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#ff4d4d' }}>{t('theyHaveNoDuplicates')}</span>
                  ) : (
                    susRepetidas.map((carta) => (
                      <button
                        key={carta.id}
                        type="button"
                        onClick={() => setCartaPedida(carta)}
                        style={{
                          padding: '0.6rem',
                          borderRadius: '8px',
                          border: cartaPedida?.id === carta.id ? '2px solid #ffaa00' : '1px solid #2a2e3d',
                          backgroundColor: cartaPedida?.id === carta.id ? 'rgba(255,170,0,0.1)' : '#1f2433',
                          color: '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div>{carta.imagen} <strong>{carta.nombre}</strong></div>
                        <small style={{ color: '#8b92b0' }}>{carta.rareza}</small>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #2a2e3d',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={!cartaOfrecida || !cartaPedida}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #ffaa00',
                  backgroundColor: 'rgba(255, 170, 0, 0.2)',
                  color: '#ffaa00',
                  fontWeight: 'bold',
                  cursor: !cartaOfrecida || !cartaPedida ? 'not-allowed' : 'pointer',
                  opacity: !cartaOfrecida || !cartaPedida ? 0.5 : 1,
                }}
              >
                {t('sendProposal')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ===========================================================================
   3. TARJETA EN EL CHAT (Globo con contador y botones de responder)
   =========================================================================== */
export function MensajeIntercambio({ propuesta, esMio, onResponder }) {
  const { t } = useI18n();
  const [tiempoRestante, setTiempoRestante] = useState('');
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    if (propuesta.estado !== 'pendiente') return;

    const fechaExpiracion = new Date(propuesta.expiraEn).getTime();

    const actualizarContador = () => {
      const ahora = new Date().getTime();
      const diferencia = fechaExpiracion - ahora;

      if (diferencia <= 0) {
        setExpirado(true);
        setTiempoRestante('Caducado');
        return;
      }

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

      if (dias > 0) {
        setTiempoRestante(`${dias}d ${horas}h restantes`);
      } else {
        setTiempoRestante(`${horas}h ${minutos}m restantes`);
      }
    };

    actualizarContador();
    const intervalo = setInterval(actualizarContador, 60000); // Actualiza cada minuto

    return () => clearInterval(intervalo);
  }, [propuesta.expiraEn, propuesta.estado]);

  const estadoActual = expirado ? 'expirado' : propuesta.estado;

  return (
    <div
      style={{
        backgroundColor: '#151821',
        border: '1px solid #ffaa00',
        borderRadius: '12px',
        padding: '1rem',
        maxWidth: '320px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <span style={{ color: '#ffaa00', fontWeight: 'bold', fontSize: '0.85rem' }}>
          {t('tradeProposal')}
        </span>
        {estadoActual === 'pendiente' && (
          <span style={{ fontSize: '0.72rem', color: '#ffcc00', backgroundColor: 'rgba(255,204,0,0.1)', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
            ⏱️ {tiempoRestante}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <div style={{ backgroundColor: '#1f2433', padding: '0.5rem', borderRadius: '8px' }}>
          <small style={{ color: '#8b92b0', display: 'block' }}>{esMio ? t('youOffer') : t('theyOffer')}</small>
          <div style={{ fontSize: '1.2rem' }}>{propuesta.cartaOfrecida.imagen}</div>
          <strong>{propuesta.cartaOfrecida.nombre}</strong>
        </div>

        <span style={{ color: '#8b92b0', fontWeight: 'bold' }}>➔</span>

        <div style={{ backgroundColor: '#1f2433', padding: '0.5rem', borderRadius: '8px' }}>
          <small style={{ color: '#8b92b0', display: 'block' }}>{esMio ? t('youAsk') : t('theyAsk')}</small>
          <div style={{ fontSize: '1.2rem' }}>{propuesta.cartaPedida.imagen}</div>
          <strong>{propuesta.cartaPedida.nombre}</strong>
        </div>
      </div>

      {/* ESTADOS / ACCIONES */}
      <div style={{ marginTop: '0.8rem', borderTop: '1px solid #2a2e3d', paddingTop: '0.6rem' }}>
        {estadoActual === 'pendiente' && !esMio && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onResponder(propuesta.id, 'rechazar')}
              style={{
                flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1px solid #ff4d4d',
                backgroundColor: 'rgba(255,77,77,0.1)', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              {t('reject')}
            </button>
            <button
              onClick={() => onResponder(propuesta.id, 'aceptar')}
              style={{
                flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1px solid #00ffcc',
                backgroundColor: 'rgba(0,255,204,0.15)', color: '#00ffcc', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              {t('accept')}
            </button>
          </div>
        )}

        {estadoActual === 'pendiente' && esMio && (
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8b92b0', textAlign: 'center' }}>
            {t('tradeWaitingReply', { user: propuesta.loginDestino })}
          </p>
        )}

        {estadoActual === 'aceptado' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#00ffcc', textAlign: 'center', fontWeight: 'bold' }}>
            {t('tradeAccepted')}
          </p>
        )}

        {estadoActual === 'rechazado' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#ff4d4d', textAlign: 'center' }}>
            {t('tradeRejected')}
          </p>
        )}

        {estadoActual === 'expirado' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#8b92b0', textAlign: 'center' }}>
            {t('tradeExpired')}
          </p>
        )}
      </div>
    </div>
  );
}