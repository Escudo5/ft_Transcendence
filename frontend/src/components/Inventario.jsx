import { useNavigate } from 'react-router-dom';

function Inventario() {
  const navigate = useNavigate();

  const clickVolver = () => {
    navigate('/home');
  };

  const clickSobre = () => {
    navigate('/sobre');
  };

  const renderBotonVolver = () => {
    return (
      <button
        onClick={clickVolver}
        className="back-btn-link"
        style={{
          padding: '0',
          fontSize: '1rem',      // Tamaño del texto
          cursor: 'pointer',
          width: '150px',        // Ancho fijo rectangular
          height: '60px',        // Alto fijo elegante (un poco más bajo que los 70px del círculo)
          borderRadius: '8px',   // Esquinas ligeramente suavizadas, no circulares
          position: 'absolute',  // Coordenadas fijas en la pantalla
          top: '2.5rem',         // Centrado verticalmente respecto al botón de la derecha
          left: '2rem',          // Anclado a la izquierda
          display: 'flex',       // Centrado perfecto del texto con Flexbox
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
        onClick={clickSobre}
        className="back-btn-link"
        style={{
          padding: '0',
          fontSize: '0.9rem',
          cursor: 'pointer',
          width: '70px',
          height: '70px',
          borderRadius: '50%', // Lo hace circular
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          // Estas tres líneas centran el texto "SOBRE" perfectamente en medio
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        SOBRE
      </button>
    );
  };

  // Aquí es donde en el futuro podréis cambiar el fondo, meter las tablas, etc.
  const PaginaInventario = () => {
    return (
      <div className="app-container" style={{ position: 'relative', minHeight: '100vh', padding: '2rem' }}>
        
        {renderBotonVolver()}

        {renderBotonSobre()}

        {/*{renderTablaEstadisticas()} */}
        {/* {renderTiendaSobres()} */}

      </div>
    );
  };

  return PaginaInventario();
}

export default Inventario;