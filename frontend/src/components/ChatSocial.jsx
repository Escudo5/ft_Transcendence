import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListaChats from './ListaChats'; // 👈 Importamos el componente
import './Chat.css';

/**
 * 🔌 KONRAD: aquí es donde tu chat se engancha al servidor.
 *
 * Tus pantallas no han cambiado: ListaChats.jsx sigue igual, porque lo hiciste
 * bien y no sabe de dónde salen los datos. Lo único que cambia es que la lista
 * de amigos ya no está escrita a mano, sino que viene de /api/social/amigos/.
 *
 * El servidor los manda con otros nombres de campo, así que aquí se traducen
 * a los tuyos (ver 'adaptarAmigo' abajo). Si necesitas algún dato más, dímelo
 * y lo añado al servidor en vez de inventarlo aquí.
 */

const API = import.meta.env.VITE_API_URL || '/api';

// El servidor dice 'online' / 'offline' / 'ingame'; tú enseñas texto
const TEXTO_ESTADO = {
  online: 'En línea',
  ingame: 'Jugando',
  offline: 'Desconectado',
};

/** Traduce un amigo del servidor al formato que espera ListaChats. */
function adaptarAmigo(u) {
  return {
    id: u.id,
    login: u.username,
    nombre: u.nombre,
    // Tu componente pinta {amigo.avatar} dentro de un div, así que aquí va
    // directamente la foto ya montada. El servidor decide cuál: la que subió,
    // la de la Intra o un círculo con su inicial. Así no tocamos ListaChats.
    avatar: (
      <img
        src={u.profile_image}
        alt={u.username}
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
      />
    ),
    estado: TEXTO_ESTADO[u.estado] || u.estado,
    // Todavía no hay bloqueo en el servidor: de momento vive solo aquí
    bloqueado: false,
  };
}

function ChatSocial() {
  const navigate = useNavigate();

  const [chatSeleccionado, setChatSeleccionado] = useState(null);
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // 📡 Traer la lista de amigos de verdad al abrir la página
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

  // Ya no es un aviso: la página de perfil existe de verdad
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

  const abrirModalAmigos = () => {
    alert("Próximamente: Se abrirá el modal para buscar nuevos estudiantes (Punto 2).");
  };

  return (
    <div className="chat-main-container">
      {/* 1. COLUMNA IZQUIERDA: Módulo ListaChats */}
      <ListaChats
        amigos={amigos}
        chatSeleccionado={chatSeleccionado}
        setChatSeleccionado={setChatSeleccionado}
        clickVolverHome={clickVolverHome}
        visitarPerfil={visitarPerfil}
        alternarBloqueoUsuario={alternarBloqueoUsuario}
        abrirModalAmigos={abrirModalAmigos}
      />

      {/* 2. COLUMNA DERECHA: Zona de Conversación provisional */}
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
              // Sin esto, una lista vacía parece que la página está rota
              <>
                <span style={{ fontSize: '4rem' }}>👋</span>
                <h3>Todavía no tienes amigos</h3>
                <p>
                  Entra en el perfil de alguien y pulsa <strong>Añadir amigo</strong>.
                  Puedes encontrar gente en la{' '}
                  <a href="/ranking" style={{ color: '#00ffcc' }}>clasificación</a>.
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