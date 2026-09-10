import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

/* ===========================================================================
   1. BOTÓN DE INTERCAMBIO (Icono tipo carta/Uno para poner junto al botón enviar)
   =========================================================================== */
export function BotonIntercambio({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Proponer intercambio de cartas"
      style={{
        padding: '0.7rem',
        borderRadius: '50%',
        border: '1px solid #ffaa00',
        backgroundColor: 'rgba(ff, 170, 0, 0.15)',
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
        // Peticiones a las APIs de cartas intercambiables
        const [resMisCartas, resSusCartas] = await Promise.all([
          fetch(`${API}/cartas/mis-repetidas/`, { credentials: 'include' }),
          fetch(`${API}/cartas/repetidas/${encodeURIComponent(usuarioDestino.login)}/`, { credentials: 'include' }),
        ]);

        if (resMisCartas.ok && resSusCartas.ok) {
          const dataMis = await resMisCartas.json();
          const dataSus = await resSusCartas.json();
          setMisRepetidas(dataMis);
          setSusRepetidas(dataSus);
        } else {
          // MOCK TEMPORAL DE PRUEBAS FRONTEND
          setMisRepetidas([
            { id: 101, nombre: '42 Logo Holo', imagen: '🃏', rareza: 'Épica' },
            { id: 102, nombre: 'Piscina C', imagen: '🎴', rareza: 'Común' },
          ]);
          setSusRepetidas([
            { id: 201, nombre: 'Norminette', imagen: '👾', rareza: 'Legendaria' },
            { id: 202, nombre: 'Baguette 42', imagen: '🥖', rareza: 'Común' },
          ]);
        }
      } catch (err) {
        console.error('Error al cargar cartas de intercambio:', err);
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
          🔄 Propuesta de Intercambio con {usuarioDestino.nombre}
        </h3>

        {cargando ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando tus cartas y las de tu compañero…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
              {/* COLUMNA 1: LO QUE TÚ OFRECES */}
              <div>
                <label style={{ fontSize: '0.85rem', color: '#8b92b0', display: 'block', marginBottom: '0.5rem' }}>
                  Ofreces (Tus repetidas):
                </label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {misRepetidas.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#ff4d4d' }}>No tienes repetidas.</span>
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
                  Pides (Sus repetidas):
                </label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {susRepetidas.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#ff4d4d' }}>El usuario no tiene repetidas.</span>
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
                Cancelar
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
                Enviar Propuesta
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
          🔄 Propuesta de Intercambio
        </span>
        {estadoActual === 'pendiente' && (
          <span style={{ fontSize: '0.72rem', color: '#ffcc00', backgroundColor: 'rgba(255,204,0,0.1)', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
            ⏱️ {tiempoRestante}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <div style={{ backgroundColor: '#1f2433', padding: '0.5rem', borderRadius: '8px' }}>
          <small style={{ color: '#8b92b0', display: 'block' }}>{esMio ? 'Ofreces' : 'Te ofrece'}</small>
          <div style={{ fontSize: '1.2rem' }}>{propuesta.cartaOfrecida.imagen}</div>
          <strong>{propuesta.cartaOfrecida.nombre}</strong>
        </div>

        <span style={{ color: '#8b92b0', fontWeight: 'bold' }}>➔</span>

        <div style={{ backgroundColor: '#1f2433', padding: '0.5rem', borderRadius: '8px' }}>
          <small style={{ color: '#8b92b0', display: 'block' }}>{esMio ? 'Pides' : 'Te pide'}</small>
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
              Rechazar
            </button>
            <button
              onClick={() => onResponder(propuesta.id, 'aceptar')}
              style={{
                flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1px solid #00ffcc',
                backgroundColor: 'rgba(0,255,204,0.15)', color: '#00ffcc', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              Aceptar
            </button>
          </div>
        )}

        {estadoActual === 'pendiente' && esMio && (
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8b92b0', textAlign: 'center' }}>
            Esperando respuesta de {propuesta.loginDestino}…
          </p>
        )}

        {estadoActual === 'aceptado' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#00ffcc', textAlign: 'center', fontWeight: 'bold' }}>
            Aceptado
          </p>
        )}

        {estadoActual === 'rechazado' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#ff4d4d', textAlign: 'center' }}>
            Rechazado
          </p>
        )}

        {estadoActual === 'expirado' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#8b92b0', textAlign: 'center' }}>
            Expirado (Plazo vencido)
          </p>
        )}
      </div>
    </div>
  );
}