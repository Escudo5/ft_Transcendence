import { useState } from 'react';
import { useI18n } from '../../i18n';

function BuscarAmigos({ isOpen, onClose, usuarios = [], agregarAmigo }) {
  const { t } = useI18n();
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  // 🔌 La lista ya no está escrita aquí: llega desde ChatSocial.jsx, que se la
  // pide al servidor (/api/social/buscar/). Viene filtrada: sin uno mismo, sin
  // los que ya son amigos y sin los que tienen una solicitud a medias.
  const usuariosRed42 = usuarios;

  if (!isOpen) return null;

  const usuariosFiltrados = usuariosRed42.filter(user =>
    user.login.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    user.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#151821',
        border: '1px solid #00bfff',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '420px',
        padding: '1.5rem',
        boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#00bfff' }}>🌐 {t('searchNetwork')}</h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8b92b0', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder={t('searchLoginPlaceholder')}
          value={busquedaUsuario}
          onChange={(e) => setBusquedaUsuario(e.target.value)}
          style={{
            width: '100%',
            padding: '0.7rem 1rem',
            borderRadius: '8px',
            border: '1px solid #2a2e3d',
            backgroundColor: '#0d1017',
            color: '#fff',
            outline: 'none',
            marginBottom: '1rem'
          }}
        />

        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {usuariosFiltrados.length === 0 ? (
            <p style={{ color: '#6c728f', textAlign: 'center', fontSize: '0.9rem' }}>
              {t('noStudents')}
            </p>
          ) : (
            usuariosFiltrados.map((usuario) => (
              <div 
                key={usuario.login}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  backgroundColor: '#202533',
                  borderRadius: '8px',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{usuario.avatar}</span>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{usuario.nombre}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#8b92b0' }}>@{usuario.login}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    agregarAmigo(usuario);
                    onClose();
                  }}
                  style={{
                    backgroundColor: '#00bfff',
                    color: '#000',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  + {t('add')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BuscarAmigos;