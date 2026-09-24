import { useI18n } from '../i18n';
import { useState } from 'react';

function ListaChats({
  amigos,
  chatSeleccionado,
  setChatSeleccionado,
  clickVolverHome,
  visitarPerfil,
  alternarBloqueoUsuario,
  abrirModalAmigos,
  abrirModalSolicitudes,
  numSolicitudesPendientes = 0,
}) {
  const { t } = useI18n();
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [loginMenuDesplegado, setLoginMenuDesplegado] = useState(null);

  const alternarMenuOpcionesAmigo = (eventoDeClic, loginUsuario) => {
    // Detiene la propagación del clic para que no se abra el chat al hacer clic en los tres puntos
    eventoDeClic.stopPropagation();

    if (loginMenuDesplegado === loginUsuario) {
      setLoginMenuDesplegado(null);
    } else {
      setLoginMenuDesplegado(loginUsuario);
    }
  };

  const listaAmigosFiltrados = amigos.filter((amigoActual) => {
    const busquedaEnMinusculas = textoBusqueda.toLowerCase();
    return (
      amigoActual.nombre.toLowerCase().includes(busquedaEnMinusculas) ||
      amigoActual.login.toLowerCase().includes(busquedaEnMinusculas)
    );
  });

  return (
    <div className="chat-sidebar">
      {/* CABECERA SUPERIOR CON BOTONES DE ACCIÓN */}
      <div className="sidebar-header">
        <button onClick={clickVolverHome} className="btn-volver" title={t('backToMainMenu')}>
          ← {t('home')}
        </button>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={abrirModalAmigos}
            className="btn-volver"
            style={{ borderColor: '#00bfff', color: '#00bfff', padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
          >
            + {t('friends')}
          </button>

          <button
            onClick={abrirModalSolicitudes}
            className="btn-volver"
            style={{
              borderColor: '#ff007f',
              color: '#ff007f',
              padding: '0.4rem 0.7rem',
              fontSize: '0.8rem',
              position: 'relative',
            }}
          >
            {t('requests')}
            {numSolicitudesPendientes > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#ff007f',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                }}
              >
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
          placeholder={t('chatSearchPlaceholder')}
          value={textoBusqueda}
          onChange={(eventoDeClic) => setTextoBusqueda(eventoDeClic.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 1rem',
            borderRadius: '20px',
            border: '1px solid #2a2e3d',
            backgroundColor: '#0d1017',
            color: '#fff',
            outline: 'none',
            fontSize: '0.85rem',
          }}
        />
      </div>

      {/* LISTA DE AMIGOS */}
      <div style={{ padding: '0 0.8rem 0.8rem 0.8rem', overflowY: 'auto', flex: 1 }}>
        {listaAmigosFiltrados.length === 0 ? (
          <p style={{ color: '#6c728f', textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
            {t('noContactsFound')}
          </p>
        ) : (
          listaAmigosFiltrados.map((amigoActual) => {
            const estaSeleccionado = chatSeleccionado?.login === amigoActual.login;

            return (
              <div
                key={amigoActual.login}
                className="item-amigo-sidebar"
                style={{
                  backgroundColor: estaSeleccionado ? '#282e40' : '#202533',
                  borderColor: estaSeleccionado ? '#00ffcc' : '#2a2e3d',
                }}
              >
                <div
                  className="info-amigo-click"
                  onClick={() => {
                    setChatSeleccionado(amigoActual);
                    setLoginMenuDesplegado(null);
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div className="avatar-header">{amigoActual.avatar}</div>
                    
                    {/* INDICADOR DE MENSAJES SIN LEER */}
                    {amigoActual.sinLeer > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          backgroundColor: '#ff007f',
                          color: '#fff',
                          borderRadius: '50%',
                          padding: '2px 6px',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {amigoActual.sinLeer > 9 ? '9+' : amigoActual.sinLeer}
                      </span>
                    )}
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ color: amigoActual.sinLeer > 0 ? '#fff' : undefined }}>
                      {amigoActual.nombre} ({amigoActual.login})
                    </strong>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: amigoActual.bloqueado ? '#ff4d4d' : '#00ffcc',
                      }}
                    >
                      {amigoActual.bloqueado ? '🚫 [Bloqueado]' : amigoActual.estado}
                    </div>
                  </div>
                </div>

                <button
                  className="btn-opciones-sidebar"
                  onClick={(eventoDeClic) => alternarMenuOpcionesAmigo(eventoDeClic, amigoActual.login)}
                  title={t('friendOptions')}
                >
                  ⋮
                </button>

                {loginMenuDesplegado === amigoActual.login && (
                  <div className="menu-desplegable-sidebar">
                    <button
                      className="opcion-item"
                      onClick={() => {
                        visitarPerfil(amigoActual.login);
                        setLoginMenuDesplegado(null);
                      }}
                    >
                      👤 Visitar Perfil
                    </button>

                    <button
                      className={`opcion-item ${
                        amigoActual.bloqueado ? 'opcion-desbloquear' : 'opcion-bloquear'
                      }`}
                      onClick={() => {
                        alternarBloqueoUsuario(amigoActual.login);
                        setLoginMenuDesplegado(null);
                      }}
                    >
                      {amigoActual.bloqueado ? t('unblock') : t('block')}
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