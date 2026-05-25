import { Link } from 'react-router-dom';

function Catalogo() {
  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Catálogo de Cartas (Frontend React)</h2>
      <p style={{ color: '#666' }}>Aquí se mostrarán las cartas conectadas con la base de datos de Django muy pronto...</p>
      <br />
      <Link to="/home" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>← Volver al Inicio</Link>
    </div>
  );
}

export default Catalogo;