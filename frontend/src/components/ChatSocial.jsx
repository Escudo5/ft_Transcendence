import React, { useState } from 'react';
import './Chat.css'; // 👈 Importamos los estilos de WhatsApp Web

function ChatSocial() {
  // Estado para saber qué amigo hemos pinchado (null significa "ninguno")
  const [chatActivo, setChatActivo] = useState(null);

  return (
    <div className="whatsapp-container">
      {/* 1. Columna Izquierda (Próximamente SidebarChats.jsx) */}
      <div className="sidebar-container">
        <div style={{ padding: '1rem', borderBottom: '1px solid #2a2a35' }}>
          <h3>💬 Chats 42</h3>
        </div>
        
        {/* Simulación provisional de lista de amigos */}
        <div style={{ padding: '1rem' }}>
          <button 
            onClick={() => setChatActivo({ nombre: "Konrad (ksudyn)", status: "en línea" })}
            style={{ width: '100%', padding: '0.8rem', backgroundColor: '#20202b', color: '#fff', border: '1px solid #ff9ffc', cursor: 'pointer', borderRadius: '8px' }}
          >
            Abrir chat con Konrad
          </button>
        </div>
      </div>

      {/* 2. Columna Derecha (Próximamente AreaChat.jsx) */}
      <div className="chat-window-container">
        {chatActivo ? (
          <div style={{ padding: '2rem' }}>
            <h2>Conversación con {chatActivo.nombre}</h2>
            <p>Estado: {chatActivo.status}</p>
          </div>
        ) : (
          <div className="no-chat-selected">
            <h2>💬 Chat Social 42</h2>
            <p>Selecciona a un compañero para empezar a chatear</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSocial;