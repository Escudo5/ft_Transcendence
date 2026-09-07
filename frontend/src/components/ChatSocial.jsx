import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListaChats from './ListaChats'; // 👈 Importamos el componente
import './Chat.css';

function ChatSocial() {
  const navigate = useNavigate();

  const [chatSeleccionado, setChatSeleccionado] = useState(null);

  // Lista de prueba de amigos
  const [amigos, setAmigos] = useState([
    { login: "ksudyn", nombre: "Konrad", avatar: "💻", estado: "En línea", bloqueado: false },
    { login: "pablalva", nombre: "Pablo", avatar: "⚡", estado: "Desconectado", bloqueado: false },
    { login: "nmagro-r", nombre: "Nacho", avatar: "🔥", estado: "En línea", bloqueado: true }
  ]);

  const clickVolverHome = () => {
    navigate('/Home');
  };

  const visitarPerfil = (login) => {
    alert(`Redirigiendo al perfil de 42 de: ${login}`);
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
            <span style={{ fontSize: '4rem' }}>🌐</span>
            <h3>Módulo Social 42</h3>
            <p>Selecciona un amigo de la lista izquierda para chatear.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSocial;