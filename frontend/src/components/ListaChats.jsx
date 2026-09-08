import { useState } from 'react';

function ListaChats({
  amigos,
  chatSeleccionado,
  setChatSeleccionado,
  clickVolverHome,
  visitarPerfil,
  alternarBloqueoUsuario,
  abrirModalAmigos,
  abrirModalSolicitudes, // 👈 Nueva prop para abrir la ventana de solicitudes
  numSolicitudesPendientes = 0 // 👈 Opcional: Contador para mostrar una bolita si hay peticiones
}) {
  const [busqueda, setBusqueda] = useState('');
  const [menuAbiertoLogin, setMenuAbiertoLogin] = useState(null);

  const toggleMenuAmigo = (e, login) => {
    e.stopPropagation();
    if (menuAbiertoLogin === login) {
      setMenuAbiertoLogin(null);
    } else {
      setMenuAbiertoLogin(login);
    }
  };

  const amigosFiltrados = amigos.filter((amigo) => {
    const texto = busqueda.toLowerCase();
    return (
      amigo.nombre.toLowerCase().includes(texto) ||
      amigo.login.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="chat-sidebar">
      {/* CABECERA SUPERIOR CON BOTONES DE ACCIÓN */}
      <div className="sidebar-header">
        <button onClick={clickVolverHome} className="btn-volver" title="Volver al menú principal">
          ← Home
        </button>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button 
            onClick={abrirModalAmigos} 
            className="btn-volver" 
            style={{ borderColor: '#00bfff', color: '#00bfff', padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
          >
            + Amigos
          </button>

          <button 
            onClick={abrirModalSolicitudes} 
            className="btn-volver" 
            style={{ 
              borderColor: '#ff007f', 
              color: '#ff007f', 
              padding: '0.4rem 0.7rem', 
              fontSize: '0.8rem',
              position: 'relative'
            }}
          >
            Solicitudes
            {numSolicitudesPendientes > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#ff007f',
                color: '#fff',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '0.65rem',
                fontWeight: 'bold'
              }}>
                {numSolicitudesPendientes}
              </span>
            )}
          </button>
        </div>
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
                <div
                  className="info-amigo-click"
                  onClick={() => {
                    setChatSeleccionado(amigo);
                    setMenuAbiertoLogin(null);
                  }}
                >
                  {/* La foto lleva encima la bolita de mensajes sin leer,
                      con el mismo estilo que la del botón de Solicitudes */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div className="avatar-header">{amigo.avatar}</div>
                    {amigo.sinLeer > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: '#ff007f',
                        color: '#fff',
                        borderRadius: '50%',
                        padding: '2px 6px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold'
                      }}>
                        {amigo.sinLeer > 9 ? '9+' : amigo.sinLeer}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    {/* Con mensajes sin leer el nombre va más marcado, como
                        en cualquier chat: se localiza de un vistazo */}
                    <strong style={{ color: amigo.sinLeer > 0 ? '#fff' : undefined }}>
                      {amigo.nombre} ({amigo.login})
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: amigo.bloqueado ? '#ff4d4d' : '#00ffcc' }}>
                      {amigo.bloqueado ? '🚫 [Bloqueado]' : amigo.estado}
                    </div>
                  </div>
                </div>

                <button
                  className="btn-opciones-sidebar"
                  onClick={(e) => toggleMenuAmigo(e, amigo.login)}
                  title="Opciones del amigo"
                >
                  ⋮
                </button>

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