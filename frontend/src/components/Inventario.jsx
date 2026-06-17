import { useNavigate } from 'react-router-dom';

function Inventario() {
  const navigate = useNavigate();

  const clickVolver = () => {
    navigate('/home');
  };

  const clickMochila = () => {
    navigate('/sobre');
  };

  const renderBotonVolver = () => {
    return (
      <button
        onClick={clickVolver}
        className="back-btn-link"
        style={{
          padding: '0',
          fontSize: '1rem',
          cursor: 'pointer',
          width: '150px',
          height: '60px',
          borderRadius: '8px',
          position: 'absolute',
          top: '2.5rem',
          left: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ⬅️ Volver al Inicio
      </button>
    );
  };

  const renderBotonSobre = () => {
    return (
      <button
        onClick={clickMochila}
        className="back-btn-link"
        style={{
          padding: '0',
          fontSize: '0.9rem',
          cursor: 'pointer',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        MOCHILA
      </button>
    );
  };
  
  const renderTablillaInformativa = () => {
    return (
      <div
        className="control-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          height: '220px',
          margin: '10rem auto 2rem auto',
          padding: '2.5rem',
          backgroundColor: 'rgba(20, 20, 27, 0.2)',
          border: '5px solid rgba(0, 255, 204, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          TABLILLA INFORMATIVA
        </div>

        <div></div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}></div>
      </div>
    );
  };

  const renderTablillaEstadisticas = () => {
    return (
      <div
        className="control-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          height: '220px',
          margin: '2rem auto',
          padding: '2.5rem',
          backgroundColor: 'rgba(20, 20, 27, 0.2)',
          border: '5px solid rgba(0, 255, 204, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          TABLILLA DE ESTADISTICAS
        </div>

        <div></div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}></div>
      </div>
    );
  };

  const renderTiendaSobres = () => {
    return (
      <div
        className="control-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          height: '220px',
          margin: '2rem auto',
          padding: '2.5rem',
          backgroundColor: 'rgba(20, 20, 27, 0.2)',
          border: '5px solid rgba(0, 255, 204, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          TIENDA DE SOBRES
        </div>

        <div></div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}></div>
      </div>
    );
  };

  const PaginaInventario = () => {
    return (
      <div className="app-container" style={{ position: 'relative', minHeight: '100vh', padding: '2rem' }}>
        
        {renderBotonVolver()}

        {renderBotonSobre()}

        {renderTablillaInformativa()}
        {renderTablillaEstadisticas()}
        {renderTiendaSobres()}

      </div>
    );
  };

  return PaginaInventario();
}

export default Inventario;