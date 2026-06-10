import { Link } from 'react-router-dom';

function CrearCarta() {
  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Crear Nueva Carta (Frontend React)</h2>
      <p style={{ color: '#666' }}>Aquí colocaremos el formulario para enviar los datos de los estudiantes a Django.</p>
      <br />
      <Link to="/home" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>← Volver al Inicio</Link>
    </div>
  );
}

export default CrearCarta;