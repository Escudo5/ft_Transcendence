import { useState } from 'react';
import { Button, SecondaryButton } from '../../ui';
import { useI18n } from '../../../i18n';

const estilosModal = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  caja: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: '16px',
    padding: '1.8rem',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    textAlign: 'center'
  }
};

async function obtenerCsrfToken(apiBaseUrl) {
  const respuesta = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
  const datos = await respuesta.json();
  return datos.csrfToken;
}

export default function ModalCerrarSesion({ visible, onCancelar, apiBaseUrl }) {
  const { t: traduccion } = useI18n();
  const [cerrando, setCerrando] = useState(false);

  if (!visible) return null;

  const ejecutarCierreSesion = async () => {
    setCerrando(true);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);

      await fetch(`${apiBaseUrl}/users/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
      });
      window.location.href = '/';
    } catch (errorCapturado) {
      window.location.href = '/';
    }
  };

  return (
    <div style={estilosModal.overlay}>
      <div style={estilosModal.caja}>
        <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
          {traduccion('logoutConfirmTitle')}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
          {traduccion('logoutConfirmText')}
        </p>
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
          <SecondaryButton onClick={onCancelar} disabled={cerrando}>{traduccion('cancel')}</SecondaryButton>
          <Button onClick={ejecutarCierreSesion} disabled={cerrando}>
            {cerrando ? traduccion('loggingOut') : traduccion('yesLogout')}
          </Button>
        </div>
      </div>
    </div>
  );
}