import { Link } from 'react-router-dom';

export const RankingHeader = ({ traduccion, cartasEnCatalogo }) => {
  return (
    <header className="app-header">
      <div className="header-navigation floating-navigation">
        <Link to="/home" className="back-btn-link">
          {traduccion('catalogBack')}
        </Link>
        <Link to="/catalogo" className="back-btn-link">
          {traduccion('viewAlbum')}
        </Link>
      </div>

      <div className="logo-section" style={{ marginTop: '1rem' }}>
        <span className="logo-icon">🏆</span>
        <h1>{traduccion('rankingTitle')}</h1>
      </div>

      <p className="subtitle">
        {traduccion('rankingSubtitle')}
        {cartasEnCatalogo !== undefined &&
          traduccion('rankingPossible', { count: cartasEnCatalogo })}
      </p>
    </header>
  );
};