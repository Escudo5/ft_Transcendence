import { useState } from 'react';

function ListaChats({
  amigos,
  chatSeleccionado,
  setChatSeleccionado,
  clickVolverHome,
  visitarPerfil,
  alternarBloqueoUsuario,
  abrirModalAmigos
}) {
  // 1. Estado para almacenar el texto que se escribe en el buscador
  const [busqueda, setBusqueda] = useState('');

  // 2. Estado para saber qué menú de 3 puntos está abierto (guarda el login del usuario)
  const [menuAbiertoLogin, setMenuAbiertoLogin] = useState(null);

  // 3. Función para alternar el menú desplegable de un amigo específico
  const toggleMenuAmigo = (e, login) => {
    e.stopPropagation(); // Evita seleccionar el chat al hacer clic en los 3 puntos
    if (menuAbiertoLogin === login) {
      setMenuAbiertoLogin(null);
    } else {
      setMenuAbiertoLogin(login);
    }
  };

  // 4. Filtrado en tiempo real de amigos
  const amigosFiltrados = amigos.filter((amigo) => {
    const texto = busqueda.toLowerCase();
    return (
      amigo.nombre.toLowerCase().includes(texto) ||
      amigo.login.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="chat-sidebar">
      {/* CABECERA SUPERIOR */}
      <div className="sidebar-header">
        <button onClick={clickVolverHome} className="btn-volver">
          ← Home
        </button>
        <button onClick={abrirModalAmigos} className="btn-volver" style={{ borderColor: '#00bfff', color: '#00bfff' }}>
          + Amigos
        </button>
      </div>

      {/* BUSCADOR DE CONTACTOS */}
      <div style={{ padding: '0.8rem' }}>
        <input
          type="text"
          placeholder="🔍 Buscar o empezar un chat..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 1rem',
            borderRadius: '20px',
            border: '1px solid #2a2e3d',
            backgroundColor: '#0d1017',
            color: '#fff',
            outline: 'none',
            fontSize: '0.85rem'
          }}
        />
      </div>

      {/* LISTA DE AMIGOS */}
      <div style={{ padding: '0 0.8rem 0.8rem 0.8rem', overflowY: 'auto', flex: 1 }}>
        {amigosFiltrados.length === 0 ? (
          <p style={{ color: '#6c728f', textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
            No se encontraron contactos
          </p>
        ) : (
          amigosFiltrados.map((amigo) => {
            const estaSeleccionado = chatSeleccionado?.login === amigo.login;

            return (
              <div
                key={amigo.login}
                className="item-amigo-sidebar"
                style={{
                  backgroundColor: estaSeleccionado ? '#282e40' : '#202533',
                  borderColor: estaSeleccionado ? '#00ffcc' : '#2a2e3d'
                }}
              >
                {/* ZONA CLICABLE DE LA TARJETA */}
                <div
                  className="info-amigo-click"
                  onClick={() => {
                    setChatSeleccionado(amigo);
                    setMenuAbiertoLogin(null); // Cierra cualquier menú flotante abierto
                  }}
                >
                  <div className="avatar-header">{amigo.avatar}</div>
                  <div style={{ textAlign: 'left' }}>
                    <strong>{amigo.nombre} ({amigo.login})</strong>
                    <div style={{ fontSize: '0.75rem', color: amigo.bloqueado ? '#ff4d4d' : '#00ffcc' }}>
                      {amigo.bloqueado ? '🚫 [Bloqueado]' : amigo.estado}
                    </div>
                  </div>
                </div>

                {/* BOTÓN DE 3 PUNTOS VERTICALES */}
                <button
                  className="btn-opciones-sidebar"
                  onClick={(e) => toggleMenuAmigo(e, amigo.login)}
                  title="Opciones del amigo"
                >
                  ⋮
                </button>

                {/* MENÚ FLOTANTE DESPLEGABLE */}
                {menuAbiertoLogin === amigo.login && (
                  <div className="menu-desplegable-sidebar">
                    <button
                      className="opcion-item"
                      onClick={() => {
                        visitarPerfil(amigo.login);
                        setMenuAbiertoLogin(null);
                      }}
                    >
                      👤 Visitar Perfil
                    </button>

                    <button
                      className={`opcion-item ${amigo.bloqueado ? 'opcion-desbloquear' : 'opcion-bloquear'}`}
                      onClick={() => {
                        alternarBloqueoUsuario(amigo.login);
                        setMenuAbiertoLogin(null);
                      }}
                    >
                      {amigo.bloqueado ? '✅ Desbloquear' : '🚫 Bloquear'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ListaChats;