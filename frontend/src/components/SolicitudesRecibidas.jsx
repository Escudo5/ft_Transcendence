import { useI18n } from '../i18n';

/**
 * SOLICITUDES DE AMISTAD RECIBIDAS
 * --------------------------------
 * Las que te ha mandado OTRA gente y tú puedes aceptar o rechazar.
 *
 * Antes se llamaba SolicitudesEnviadas, que era justo lo contrario: las
 * enviadas son las tuyas y en esas no hay nada que decidir. Se renombra para
 * que el nombre diga lo que hace.
 */

function SolicitudesRecibidas({ isOpen, onClose, solicitudes, responderSolicitud }) {
  const { t } = useI18n();
  if (!isOpen) return null;

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
        border: '1px solid #ff007f',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '420px',
        padding: '1.5rem',
        boxShadow: '0 0 20px rgba(255, 0, 127, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ margin: 0, color: '#ff007f' }}>📩 {t('pendingRequests')}</h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8b92b0', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {solicitudes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6c728f' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📬</span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('noPendingRequests')}</p>
            </div>
          ) : (
            solicitudes.map((sol) => (
              <div 
                key={sol.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.8rem',
                  backgroundColor: '#202533',
                  borderRadius: '8px',
                  marginBottom: '0.6rem',
                  border: '1px solid #2a2e3d'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{sol.avatar}</span>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>{sol.nombre}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#8b92b0' }}>@{sol.login}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => responderSolicitud(sol.id, 'aceptar')}
                    title={t('acceptRequest')}
                    style={{
                      backgroundColor: 'rgba(0, 255, 204, 0.15)',
                      color: '#00ffcc',
                      border: '1px solid #00ffcc',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    ✓ {t('acceptRequest')}
                  </button>

                  <button
                    onClick={() => responderSolicitud(sol.id, 'rechazar')}
                    title={t('rejectRequest')}
                    style={{
                      backgroundColor: 'rgba(255, 77, 77, 0.15)',
                      color: '#ff4d4d',
                      border: '1px solid #ff4d4d',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SolicitudesRecibidas;