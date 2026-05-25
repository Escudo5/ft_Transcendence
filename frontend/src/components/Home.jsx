import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ textAlign: 'center', margin: '50px auto', maxWidth: '600px', fontFamily: 'Arial, sans-serif' }}>
      <h1>¡Bienvenido al Juego de Cartas de 42!</h1>
      <p>Gestiona y colecciona las estadísticas de los estudiantes del campus.</p>
      <div style={{ marginTop: '30px' }}>
        {/* Usamos <Link> en lugar de <a> para que React cambie de pantalla al instante sin recargar la web */}
        <Link to="/catalogo" style={{ margin: '10px', padding: '12px 24px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px', display: 'inline-block' }}>👁️ Ver Catálogo</Link>
        <Link to="/crear" style={{ margin: '10px', padding: '12px 24px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px', display: 'inline-block' }}>➕ Crear Nueva Carta</Link>
      </div>
    </div>
  );
}

export default Home;