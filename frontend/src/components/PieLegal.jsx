import { useI18n } from '../i18n';
/**
 * PIE DE PÁGINA CON LOS ENLACES LEGALES
 * -------------------------------------
 * El subject exige que las páginas legales sean "fácilmente accesibles desde la
 * aplicación", y pone como ejemplo justo esto: enlaces en un pie de página.
 *
 * Se pinta en la pantalla de acceso y en la portada. Importante que esté
 * también ANTES de iniciar sesión: una política de privacidad que solo puedes
 * leer después de registrarte no sirve de mucho.
 *
 * ⚠️ Usa <a href> y NO el <Link> de React Router a propósito. La pantalla de
 * acceso se dibuja fuera del router (cuando no hay sesión), y allí <Link>
 * revienta y deja la página en blanco. Con <a> funciona en los dos sitios; lo
 * único que cambia es que recarga la página entera, que para una página legal
 * da igual.
 */
export default function PieLegal({ estilo }) {
  const { t } = useI18n();
  const enlace = { color: 'var(--text-secondary)' };

  return (
    <footer
      style={{
        textAlign: 'center',
        padding: '1.5rem 1rem',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        ...estilo,
      }}
    >
      <a href="/privacidad" style={enlace}>{t('privacyPolicy')}</a>
      <span style={{ margin: '0 0.6rem', opacity: 0.5 }}>·</span>
      <a href="/terminos" style={enlace}>{t('termsOfService')}</a>
      <p style={{ marginTop: '0.6rem', opacity: 0.7 }}>
        {t('footerDisclaimer')}
      </p>
    </footer>
  );
}
