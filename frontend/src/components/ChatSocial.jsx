import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListaChats from './ListaChats';
import BuscarAmigos from './BuscarAmigos';
import SolicitudesEnviadas from './SolicitudesEnviadas';
import './Chat.css';

const API = import.meta.env.VITE_API_URL || '/api';

const TEXTO_ESTADO = {
  online: 'En línea',
  ingame: 'Jugando',
  offline: 'Desconectado',
};

function adaptarAmigo(u) {
  return {
    id: u.id,
    login: u.username,
    nombre: u.nombre,
    avatar: (
      <img
        src={u.profile_image}
        alt={u.username}
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
      />
    ),
    estado: TEXTO_ESTADO[u.estado] || u.estado,
    bloqueado: false,
  };
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

  // Lista de solicitudes recibidas pendientes de aceptar
  const [solicitudes, setSolicitudes] = useState([
    { id: 1, login: "jdoe", nombre: "John Doe", avatar: "👨‍💻" }
  ]);

  // Traer lista de amigos real del servidor
  useEffect(() => {
    async function cargarAmigos() {
      try {
        const res = await fetch(`${API}/social/amigos/`, { credentials: 'include' });
        if (res.status === 401 || res.status === 403) {
          setError('Tienes que iniciar sesión para ver tus amigos.');
          return;
        }
        if (!res.ok) {
          setError('No se ha podido cargar la lista de amigos.');
          return;
        }
        setAmigos((await res.json()).map(adaptarAmigo));
      } catch (e) {
        console.error('Error al cargar los amigos:', e);
        setError('No se ha podido conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    }
    cargarAmigos();
  }, []);

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

  // Añadir amigo desde BuscarAmigos.jsx
  const agregarNuevoAmigo = (nuevoUsuario) => {
    const yaExiste = amigos.some(a => a.login === nuevoUsuario.login);
    if (yaExiste) {
      alert("Este usuario ya está en tu lista de amigos.");
      return;
    }
    const nuevoContacto = {
      ...nuevoUsuario,
      estado: "En línea",
      bloqueado: false
    };
    setAmigos([...amigos, nuevoContacto]);
    alert(`¡Has añadido a ${nuevoUsuario.nombre}!`);
  };

  // Decisión del usuario en SolicitudesEnviadas.jsx
  const responderSolicitud = (idSolicitud, accion) => {
    if (accion === 'aceptar') {
      const solicitudAceptada = solicitudes.find(s => s.id === idSolicitud);
      if (solicitudAceptada) {
        agregarNuevoAmigo(solicitudAceptada);
      }
    }
    // Eliminamos la solicitud de la lista tras decidir
    setSolicitudes(solicitudes.filter(s => s.id !== idSolicitud));
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
        abrirModalAmigos={() => setModalBuscarAbierto(true)}
        abrirModalSolicitudes={() => setModalSolicitudesAbierto(true)}
        numSolicitudesPendientes={solicitudes.length}
      />

      {/* 2. VENTANAS EMERGENTES */}
      <BuscarAmigos
        isOpen={modalBuscarAbierto}
        onClose={() => setModalBuscarAbierto(false)}
        agregarAmigo={agregarNuevoAmigo}
      />

      <SolicitudesEnviadas
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
              ) : (
                <div style={{ backgroundColor: '#1f2433', padding: '0.8rem 1.2rem', borderRadius: '8px', maxWidth: '60%' }}>
                  👋 Chat activo con {chatSeleccionado.nombre}.
                </div>
              )}
            </div>
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