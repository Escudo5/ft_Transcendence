import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n';

export default function PerfilHeader() {
  const { t: traduccion } = useI18n();

  return (
    <header className="app-header">
      <div className="header-navigation floating-navigation">
        <Link to="/home" className="back-btn-link">{traduccion('catalogBack')}</Link>
        <Link to="/catalogo" className="back-btn-link">{traduccion('viewAlbum')}</Link>
      </div>
    </header>
  );
}