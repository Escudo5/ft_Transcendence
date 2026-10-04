import { useState } from 'react';
import { Button, Card, SecondaryButton, TextField } from '../../ui';
import { useI18n } from '../../../i18n';

const FRASE_BORRADO = 'BORRAR MI CUENTA';

async function obtenerCsrfToken(apiBaseUrl) {
  const respuesta = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
  const datos = await respuesta.json();
  return datos.csrfToken;
}

export default function SeccionAjustesCuenta({ apiBaseUrl, setAviso, onAbrirLogoutModal }) {
  const { t: traduccion } = useI18n();
  const [borrandoCuenta, setBorrandoCuenta] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [borrando, setBorrando] = useState(false);

  const ejecutarBorradoCuenta = async () => {
    setBorrando(true);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);

      const respuesta = await fetch(`${apiBaseUrl}/users/me/borrar/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ confirmacion: FRASE_BORRADO }),
      });

      if (!respuesta.ok) {
        setAviso({ texto: traduccion('deleteAccountError'), ok: false });
        return;
      }
      window.location.href = '/';
    } catch (errorCapturado) {
      setAviso({ texto: traduccion('connectionError'), ok: false });
    } finally {
      setBorrando(false);
    }
  };

  return (
    <Card>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>
        {traduccion('yourData')}
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
        {traduccion('yourDataText')}
      </p>

      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <a href={`${apiBaseUrl}/users/me/datos/`} className="ui-button ui-button-secondary">⬇️ Descargar mis datos</a>
        <a href={`${apiBaseUrl}/users/me/datos/?format=csv`} className="ui-button ui-button-secondary">📊 CSV</a>
        <a href={`${apiBaseUrl}/users/me/datos/?format=html`} className="ui-button ui-button-secondary">📄 HTML</a>
        <SecondaryButton onClick={onAbrirLogoutModal}>{traduccion('logout')}</SecondaryButton>
        <SecondaryButton className="danger-button" onClick={() => { setBorrandoCuenta(true); setAviso(null); }}>
          🗑️ Borrar mi cuenta
        </SecondaryButton>
      </div>

      {borrandoCuenta && (
        <div style={{ marginTop: '1.2rem', padding: '1.2rem', borderRadius: '10px', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.4)' }}>
          <p style={{ color: '#fca5a5', fontWeight: 700, marginTop: 0 }}>{traduccion('cannotBeUndone')}</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {traduccion('typeToConfirm', { phrase: FRASE_BORRADO })}
          </p>
          <TextField id="confirmacion-borrado" label={traduccion('confirmation')} value={textoConfirmacion} onChange={(evento) => setTextoConfirmacion(evento.target.value)} placeholder={FRASE_BORRADO} />
          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
            <Button className="danger-button" disabled={textoConfirmacion !== FRASE_BORRADO || borrando} onClick={ejecutarBorradoCuenta}>
              {borrando ? traduccion('deleting') : traduccion('deleteAccountForever')}
            </Button>
            <SecondaryButton onClick={() => setBorrandoCuenta(false)}>{traduccion('cancel')}</SecondaryButton>
          </div>
        </div>
      )}
    </Card>
  );
}