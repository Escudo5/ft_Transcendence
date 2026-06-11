import { Link, useNavigate } from 'react-router-dom';

// 1. ESTRUCTURA DE DATOS: Tus 5 integrantes del equipo de 42
const INTEGRANTES = [
  { login: "ksudyn", nombre: "Konrad", avatar: "imagen", rareza: "legendary" },
  { login: "pablalva", nombre: "Pablo", avatar: "imagen", rareza: "legendary" },
  { login: "nmagro-r", nombre: "Nacho", avatar: "imagen", rareza: "epic" },
  { login: "smarquez", nombre: "Sergio", avatar: "imagen", rareza: "rare" },
  { login: "osmunoz-", nombre: "Óscar", avatar: "imagen", rareza: "common" },
];

function Home() {
  const navigate = useNavigate();

  // Función que se activa al pulsar el botón de Game
  const Game = () => {
    navigate('/game'); // Te manda directo a la pantalla de game
  };

  return (
    <div className="app-container" style={{ padding: '2rem 0' }}>
      
      {/* PARTE 1: ARRIBA (Título e Integrantes) */}
      <header className="app-header">
        <div className="logo-section">
          <h1>ft_transcendence</h1>
        </div>
        <p className="subtitle">Integrantes del grupo</p>
      </header>

      {/* Fila con las 5 cartas de los miembros del grupo */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '1rem' }}>
        {INTEGRANTES.map((user) => (
          <article key={user.login} className={`card-item rarity-${user.rareza}`} style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{user.avatar}</div>
            <h3 style={{ fontSize: '1rem', margin: '0' }}>{user.nombre}</h3>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>@{user.login}</span>
          </article>
        ))}
      </section>


      {/* PARTE 2: EN EL MEDIO (Los dos botones principales) */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Botón Álbum */}
        <Link to="/catalogo" className="back-btn-link" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '1.25rem', display: 'block' }}>
          📂 Ver Álbum
        </Link>

        {/* Botón Game (redirige a Game) */}
        <button 
          className="back-btn-link" 
          style={{ padding: '1.5rem', fontSize: '1.25rem', cursor: 'pointer' }}
          onClick={Game}
        >
          🎮 Iniciar Game
        </button>
      </section>


      {/* PARTE 3: ABAJO (Tablón de anuncios rectangular con 4 columnas) */}
      <section className="control-panel" style={{ marginTop: '2rem', display: 'block' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
           Tablón de estadisticas
        </h2>
        
        {/* Rejilla interna de 4 columnas (Grid) preparada para los futuros datos del Backend */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
          
          {/* Columna 1 (Sección provisional) */}
          <div style={{ borderLeft: '2px solid var(--accent-color)', paddingLeft: '0.75rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ya se vera el titulo</h4>
            <p>• Datos por añadir</p>
          </div>

          {/* Columna 2 (Sección provisional) */}
          <div style={{ borderLeft: '2px solid var(--rarity-epic)', paddingLeft: '0.75rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ya se vera el titulo</h4>
            <p>• Datos por añadir</p>
          </div>

          {/* Columna 3 (Sección provisional) */}
          <div style={{ borderLeft: '2px solid var(--rarity-legendary)', paddingLeft: '0.75rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ya se vera el titulo</h4>
            <p>• Datos por añadir</p>
          </div>

          {/* Columna 4 (Sección provisional para añadir más cosas) */}
          <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '0.75rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ya se vera el titulo</h4>
            <p>• Datos por añadir</p>
          </div>

        </div>
      </section>

    </div>
  );
}

export default Home;