import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ListaChats from './ListaChats';
import BuscarAmigos from './BuscarAmigos';
import SolicitudesRecibidas from './SolicitudesRecibidas';
import './Chat.css';

const API = import.meta.env.VITE_API_URL || '/api';

const TEXTO_ESTADO = {
  online: 'En línea',
  ingame: 'Jugando',
  offline: 'Desconectado',
};

// El mismo tope que comprueba el servidor en chat/models.py
const LARGO_MAXIMO = 1000;

/** La foto ya montada. El servidor decide cuál: la que subió esa persona, la
 *  de la Intra, o un círculo con su inicial si no tiene ninguna. */
function foto(u) {
  return (
    <img
      src={u.profile_image}
      alt={u.username}
      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
    />
  );
}

/** Un amigo del servidor, al formato que espera ListaChats. */
function adaptarAmigo(u) {
  return {
    id: u.id,
    login: u.username,
    nombre: u.nombre,
    avatar: foto(u),
    estado: TEXTO_ESTADO[u.estado] || u.estado,
    bloqueado: false, // todavía no hay bloqueo en el servidor
  };
}

/** Una solicitud recibida, al formato que espera SolicitudesRecibidas.
 *  Ojo: el id que se manda para responder es EL DE LA SOLICITUD, no el de
 *  la persona. Si se manda el del usuario, el servidor devuelve 404. */
function adaptarSolicitud(s) {
  return {
    id: s.id,
    login: s.sender.username,
    nombre: s.sender.nombre,
    avatar: foto(s.sender),
  };
}

/** Alguien a quien puedes pedir amistad, al formato de BuscarAmigos. */
function adaptarCandidato(u) {
  return {
    id: u.id,
    login: u.username,
    nombre: u.nombre,
    avatar: foto(u),
  };
}

/** Django exige un token para todo lo que no sea leer. */
async function pedirToken() {
  const res = await fetch(`${API}/users/csrf/`, { credentials: 'include' });
  return (await res.json()).csrfToken;
}

function ChatSocial() {
  const navigate = useNavigate();

  const [chatSeleccionado, setChatSeleccionado] = useState(null);
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estados para abrir o cerrar las ventanas flotantes
  const [modalBuscarAbierto, setModalBuscarAbierto] = useState(false);
  const [modalSolicitudesAbierto, setModalSolicitudesAbierto] = useState(false);

  // Solicitudes que me han mandado y aún no he respondido
  const [solicitudes, setSolicitudes] = useState([]);
  // Gente a la que puedo pedir amistad (para la ventana de buscar)
  const [candidatos, setCandidatos] = useState([]);

  // 📡 Traer amigos y solicitudes del servidor.
  // Van juntas en una función y no dentro del useEffect porque hay que poder
  // volver a llamarlas después de aceptar o añadir a alguien. Si no, aceptas
  // una solicitud y la lista sigue igual hasta que recargas la página.
  const recargar = async () => {
    try {
      const [resAmigos, resSolic, resSinLeer] = await Promise.all([
        fetch(`${API}/social/amigos/`, { credentials: 'include' }),
        fetch(`${API}/social/solicitudes/pendientes/`, { credentials: 'include' }),
        fetch(`${API}/chat/sin-leer/`, { credentials: 'include' }),
      ]);

      if (resAmigos.status === 401 || resAmigos.status === 403) {
        setError('Tienes que iniciar sesión para ver tus amigos.');
        return;
      }
      if (!resAmigos.ok) {
        setError('No se ha podido cargar la lista de amigos.');
        return;
      }

      setError('');

      // Cuántos mensajes sin leer hay de cada persona, para el puntito rojo
      // de su fila. El servidor ya lo sabe; solo había que preguntárselo.
      let sinLeer = {};
      if (resSinLeer.ok) sinLeer = (await resSinLeer.json()).por_persona || {};

      setAmigos((await resAmigos.json()).map((u) => ({
        ...adaptarAmigo(u),
        sinLeer: sinLeer[u.username] || 0,
      })));
      if (resSolic.ok) {
        // Solo las recibidas: las enviadas son las mías y no hay nada que decidir
        setSolicitudes(((await resSolic.json()).received || []).map(adaptarSolicitud));
      }
    } catch (e) {
      console.error('Error al cargar amigos y solicitudes:', e);
      setError('No se ha podido conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { recargar(); }, []);

  // Refrescar los "sin leer" de la lista cada 10 segundos. Se pregunta solo
  // por eso (es una consulta de contar, no trae mensajes ni fotos), en vez de
  // recargar amigos y solicitudes enteros cada rato.
  useEffect(() => {
    let vivo = true;
    const reloj = setInterval(async () => {
      try {
        const res = await fetch(`${API}/chat/sin-leer/`, { credentials: 'include' });
        if (!vivo || !res.ok) return;
        const porPersona = (await res.json()).por_persona || {};
        setAmigos((prev) => prev.map((a) => ({ ...a, sinLeer: porPersona[a.login] || 0 })));
      } catch { /* si el servidor no responde, se deja lo que había */ }
    }, 10000);
    return () => { vivo = false; clearInterval(reloj); };
  }, []);

  // =====================================================================
  // 💬 LA CONVERSACIÓN
  // =====================================================================
  const [mensajes, setMensajes] = useState([]);
  const [borrador, setBorrador] = useState('');
  const [enviando, setEnviando] = useState(false);
  // Id del último mensaje que ya tenemos. Va en una referencia y no en el
  // estado porque lo lee el temporizador de abajo: si fuera estado, el
  // temporizador se quedaría con el valor de cuando se creó.
  const ultimoId = useRef(null);
  const finDeLaLista = useRef(null);

  const conQuien = chatSeleccionado?.login || null;

  // Cargar la conversación al elegir a alguien, y refrescarla cada 3 segundos.
  //
  // Se pregunta cada pocos segundos en vez de recibir los mensajes al vuelo.
  // Para eso harían falta WebSockets, que obligan a cambiar el servidor y a
  // rehacer el HTTPS; queda pendiente con Pablo. Mientras tanto esto funciona
  // y no toca la infraestructura. Para que no cueste caro, solo se piden los
  // mensajes NUEVOS (?desde=), no la conversación entera cada vez.
  useEffect(() => {
    if (!conQuien) {
      setMensajes([]);
      return undefined;
    }

    let vivo = true;            // evita escribir en un componente ya cerrado
    ultimoId.current = null;
    setMensajes([]);

    // Abrir la conversación da por leídos sus mensajes: el servidor lo hace al
    // pedirlos, y aquí se quita la bolita al momento en vez de esperar al
    // siguiente refresco. Si no, abres el chat y el aviso sigue ahí 10
    // segundos, como si no te hubieras enterado.
    setAmigos((prev) => prev.map((a) => (a.login === conQuien ? { ...a, sinLeer: 0 } : a)));

    async function traer() {
      try {
        const desde = ultimoId.current;
        const url = `${API}/chat/${encodeURIComponent(conQuien)}/`
          + (desde ? `?desde=${desde}` : '');
        const res = await fetch(url, { credentials: 'include' });
        if (!vivo || !res.ok) return;

        const nuevos = (await res.json()).mensajes || [];
        if (!nuevos.length) return;

        ultimoId.current = nuevos[nuevos.length - 1].id;
        setMensajes((prev) => (desde ? [...prev, ...nuevos] : nuevos));
      } catch (e) {
        console.error('Error al cargar la conversación:', e);
      }
    }

    traer();
    const reloj = setInterval(traer, 3000);
    // Al cambiar de conversación o salir de la página hay que parar el
    // temporizador: si no, se van acumulando y la web acaba preguntando
    // al servidor una vez por cada chat que hayas abierto.
    return () => { vivo = false; clearInterval(reloj); };
  }, [conQuien]);

  // Bajar del todo cuando llegan mensajes, como en cualquier chat
  useEffect(() => {
    finDeLaLista.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    const texto = borrador.trim();
    if (!texto || enviando) return;

    // Se comprueba aquí para avisar al momento; el servidor lo vuelve a
    // comprobar, que es lo que de verdad manda.
    if (texto.length > LARGO_MAXIMO) {
      alert(`El mensaje no puede pasar de ${LARGO_MAXIMO} caracteres.`);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API}/chat/${encodeURIComponent(conQuien)}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': await pedirToken() },
        body: JSON.stringify({ texto }),
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(datos.detail || 'No se ha podido enviar el mensaje.');
        return;
      }

      // Se pinta al momento, sin esperar al siguiente refresco
      setMensajes((prev) => [...prev, datos]);
      ultimoId.current = datos.id;
      setBorrador('');
    } catch (e) {
      console.error('Error al enviar el mensaje:', e);
      alert('No se ha podido conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const clickVolverHome = () => {
    navigate('/Home');
  };

  const visitarPerfil = (login) => {
    navigate(`/perfil/${login}`);
  };

  const alternarBloqueoUsuario = (login) => {
    setAmigos(prevAmigos =>
      prevAmigos.map(amigo => {
        if (amigo.login === login) {
          const nuevoEstado = !amigo.bloqueado;
          alert(`Usuario ${login} ha sido ${nuevoEstado ? 'BLOQUEADO' : 'DESBLOQUEADO'}.`);
          return { ...amigo, bloqueado: nuevoEstado };
        }
        return amigo;
      })
    );

    if (chatSeleccionado && chatSeleccionado.login === login) {
      setChatSeleccionado(prev => ({ ...prev, bloqueado: !prev.bloqueado }));
    }
  };

  // 🔎 Traer a quién puedo pedir amistad. Al servidor le pedimos la lista ya
  // filtrada (sin mí, sin mis amigos y sin los que tienen algo pendiente),
  // para no ofrecer botones que van a dar error al pulsarlos.
  const abrirBuscador = async () => {
    setModalBuscarAbierto(true);
    try {
      const res = await fetch(`${API}/social/buscar/`, { credentials: 'include' });
      if (res.ok) setCandidatos((await res.json()).map(adaptarCandidato));
    } catch (e) {
      console.error('Error al buscar gente:', e);
    }
  };

  // ➕ Pedir amistad de verdad. No añade a nadie a la lista: manda una
  // solicitud, y hasta que el otro la acepte no sois amigos.
  const agregarNuevoAmigo = async (usuario) => {
    try {
      const res = await fetch(`${API}/social/solicitudes/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': await pedirToken() },
        body: JSON.stringify({ receiver_id: usuario.id }),
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        // El servidor manda el motivo en castellano, listo para enseñar
        const motivo = Array.isArray(datos.non_field_errors) ? datos.non_field_errors[0] : datos.detail;
        alert(motivo || 'No se ha podido enviar la solicitud.');
        return;
      }
      alert(`Solicitud enviada a ${usuario.nombre}. Aparecerá en tu lista cuando la acepte.`);
      // Ya no se le puede volver a pedir: fuera del buscador
      setCandidatos(prev => prev.filter(c => c.id !== usuario.id));
    } catch (e) {
      console.error('Error al enviar la solicitud:', e);
      alert('No se ha podido conectar con el servidor.');
    }
  };

  // ✅ / ✕ Responder a una solicitud recibida.
  // El id que se manda es EL DE LA SOLICITUD, no el de la persona.
  const responderSolicitud = async (idSolicitud, accion) => {
    try {
      const res = await fetch(`${API}/social/solicitudes/${idSolicitud}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': await pedirToken() },
        body: JSON.stringify({ action: accion === 'aceptar' ? 'accept' : 'decline' }),
      });
      if (!res.ok) {
        alert('No se ha podido responder a la solicitud.');
        return;
      }
      // Volvemos a preguntar al servidor en vez de adivinar cómo ha quedado:
      // así el nuevo amigo aparece en la lista al momento.
      await recargar();
    } catch (e) {
      console.error('Error al responder la solicitud:', e);
      alert('No se ha podido conectar con el servidor.');
    }
  };

  return (
    <div className="chat-main-container">
      {/* 1. COLUMNA IZQUIERDA */}
      <ListaChats
        amigos={amigos}
        chatSeleccionado={chatSeleccionado}
        setChatSeleccionado={setChatSeleccionado}
        clickVolverHome={clickVolverHome}
        visitarPerfil={visitarPerfil}
        alternarBloqueoUsuario={alternarBloqueoUsuario}
        abrirModalAmigos={abrirBuscador}
        abrirModalSolicitudes={() => setModalSolicitudesAbierto(true)}
        numSolicitudesPendientes={solicitudes.length}
      />

      {/* 2. VENTANAS EMERGENTES */}
      <BuscarAmigos
        isOpen={modalBuscarAbierto}
        onClose={() => setModalBuscarAbierto(false)}
        usuarios={candidatos}
        agregarAmigo={agregarNuevoAmigo}
      />

      <SolicitudesRecibidas
        isOpen={modalSolicitudesAbierto}
        onClose={() => setModalSolicitudesAbierto(false)}
        solicitudes={solicitudes}
        responderSolicitud={responderSolicitud}
      />

      {/* 3. COLUMNA DERECHA (Próximo paso: AreaChat) */}
      <div className="chat-area">
        {chatSeleccionado ? (
          <>
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => visitarPerfil(chatSeleccionado.login)}>
                <div className="avatar-header">{chatSeleccionado.avatar}</div>
                <div>
                  <h4 style={{ margin: 0 }}>{chatSeleccionado.nombre} ({chatSeleccionado.login})</h4>
                  <span style={{ fontSize: '0.8rem', color: chatSeleccionado.bloqueado ? '#ff4d4d' : '#00ffcc' }}>
                    {chatSeleccionado.bloqueado ? 'Usuario Bloqueado' : chatSeleccionado.estado}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              {chatSeleccionado.bloqueado ? (
                <div style={{ textAlign: 'center', marginTop: '3rem', color: '#8b92b0' }}>
                  <p style={{ fontSize: '1.2rem', color: '#ff4d4d' }}>🚫 Has bloqueado a este usuario.</p>
                  <button onClick={() => alternarBloqueoUsuario(chatSeleccionado.login)} className="btn-volver" style={{ marginTop: '1rem' }}>
                    Desbloquear para hablar
                  </button>
                </div>
              ) : mensajes.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '3rem', color: '#8b92b0' }}>
                  <p>Todavía no os habéis escrito nada.</p>
                  <p style={{ fontSize: '0.9rem' }}>Escribe algo abajo para empezar.</p>
                </div>
              ) : (
                mensajes.map((m) => (
                  // Los míos a la derecha, los suyos a la izquierda. El 'mio'
                  // lo calcula el servidor, aquí no se compara ningún nombre.
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: m.mio ? 'flex-end' : 'flex-start',
                      marginBottom: '0.6rem',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: m.mio ? 'rgba(0, 255, 204, 0.15)' : '#1f2433',
                        border: `1px solid ${m.mio ? '#00ffcc' : '#2a2e3d'}`,
                        padding: '0.6rem 1rem',
                        borderRadius: '10px',
                        maxWidth: '70%',
                        wordBreak: 'break-word',
                      }}
                    >
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.texto}</div>
                      <div style={{ fontSize: '0.7rem', color: '#8b92b0', marginTop: '0.25rem', textAlign: 'right' }}>
                        {new Date(m.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Marca invisible del final, para bajar del todo solo */}
              <div ref={finDeLaLista} />
            </div>

            {/* Caja de escribir. Solo si no está bloqueado. */}
            {!chatSeleccionado.bloqueado && (
              <form
                onSubmit={enviarMensaje}
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  padding: '0.8rem 1rem',
                  borderTop: '1px solid #2a2e3d',
                }}
              >
                <input
                  type="text"
                  value={borrador}
                  onChange={(e) => setBorrador(e.target.value)}
                  placeholder={`Escribe a ${chatSeleccionado.nombre}…`}
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
          </>
        ) : (
          <div className="no-chat-selected">
            {cargando ? (
              <p>Cargando tus amigos…</p>
            ) : error ? (
              <>
                <span style={{ fontSize: '4rem' }}>⚠️</span>
                <h3>Algo ha ido mal</h3>
                <p style={{ color: '#ff9b9b' }}>{error}</p>
              </>
            ) : amigos.length === 0 ? (
              <>
                <span style={{ fontSize: '4rem' }}>👋</span>
                <h3>Todavía no tienes amigos</h3>
                <p>
                  Entra en el perfil de alguien y pulsa <strong>Añadir amigo</strong>.
                </p>
              </>
            ) : (
              <>
                <span style={{ fontSize: '4rem' }}>🌐</span>
                <h3>Módulo Social 42</h3>
                <p>Selecciona un amigo de la lista izquierda para chatear.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSocial;