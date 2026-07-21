import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 👥 Tarjetas fijas de presentación del equipo de desarrollo
const INTEGRANTES = [
  { login: "ksudyn", nombre: "Konrad", avatar: "imagen", rareza: "legendary" },
  { login: "pablalva", nombre: "Pablo", avatar: "imagen", rareza: "legendary" },
  { login: "nmagro-r", nombre: "Nacho", avatar: "imagen", rareza: "epic" },
  { login: "smarquez", nombre: "Sergio", avatar: "imagen", rareza: "rare" },
  { login: "osmunoz-", nombre: "Óscar", avatar: "imagen", rareza: "common" },
];

function Home() {
  const navigate = useNavigate();

  // 2. ESTADOS (Variables dinámicas de React)
  // indiceSeleccionado guardará un número (0 a 4) si hay una carta abierta, o null si están todas cerradas.
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(null);

  // Función que se activa al pulsar el botón de Game
  const Game = () => {
    navigate('/game'); // Te manda directo a la pantalla de game
  };

  // Funciones para navegar dentro de la galería ampliada
  const irAnterior = (e) => {
    e.stopPropagation(); // Evita que se cierre el modal al hacer click en el botón
    setIndiceSeleccionado((prev) => (prev === 0 ? INTEGRANTES.length - 1 : prev - 1));
  };

  const irSiguiente = (e) => {
    e.stopPropagation(); // Evita que se cierre el modal al hacer click en el botón
    setIndiceSeleccionado((prev) => (prev === INTEGRANTES.length - 1 ? 0 : prev + 1));
  };

  // El integrante que está actualmente ampliado (si lo hay)
  const integranteActivo = indiceSeleccionado !== null ? INTEGRANTES[indiceSeleccionado] : null;

  return (
    <div className="app-container" style={{ padding: '2rem 0', backgroundColor: '#1e1e1e', color: 'white', minHeight: '100vh', textAlign: 'center' }}>
      <header className="app-header">
        <div className="logo-section">
          <h1>ft_transcendence</h1>
        </div>
        <p className="subtitle" style={{ fontSize: '1.2rem', opacity: 0.8, marginTop: '0.5rem' }}>
          Creadores del Proyecto
        </p>
      </header>

      {/* Fila con las 5 cartas de los miembros del grupo */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '1rem' }}>
        {INTEGRANTES.map((user, index) => (
          <article
          key={user.login}
          className={`card-item rarity-${user.rareza}`}
          style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer'}}
          onClick={() => setIndiceSeleccionado(index)} // Al hacer click, guardamos su índice
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{user.avatar}</div>
            <h3 style={{ fontSize: '1rem', margin: '0' }}>{user.nombre}</h3>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>@{user.login}</span>
          </article>
        ))}
      </section>

      {/* 🧭 BOTONES DE ACCIÓN: Las dos opciones del juego */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '4rem', padding: '0 2rem' }}>
        <Link to="/catalogo" className="back-btn-link" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '1.25rem', display: 'block', background: '#00BABC', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          📂 Ver Álbum
        </Link>
        <button className="back-btn-link" style={{ padding: '1.5rem', fontSize: '1.25rem', cursor: 'pointer', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '8px', fontWeight: 'bold' }} onClick={() => navigate('/game')}>
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

      {/* MODAL / CAPA FLOTANTE AMPLRIADA (Solo se dibuja si indiceSeleccionado tiene un número) */}
      {integranteActivo && (
        <div 
          onClick={() => setIndiceSeleccionado(null)} // Si haces click fuera de la carta, se cierra
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Fondo oscuro semitransparente
            backdropFilter: 'blur(8px)',           // EFECTO BORROSO PREMIUM
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zindex: 1000,                          // Se dibuja por encima de todo
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {/* Contenedor de navegación (Botón Izquierda, Carta, Botón Derecha) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            
            {/* Botón Anterior */}
            <button className="pagination-btn" onClick={irAnterior} style={{ fontSize: '1.5rem', padding: '1rem' }}>
              ◀
            </button>

            {/* Carta Ampliada */}
            <article 
              className={`card-item rarity-${integranteActivo.rareza}`} 
              onClick={(e) => e.stopPropagation()} // Evita que se cierre el modal al hacer click dentro de la carta
              style={{ 
                width: '320px', 
                padding: '2rem', 
                textAlign: 'center',
                transform: 'scale(1.1)', // Un poco más grande que las normales
                boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
              }}
            >
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{integranteActivo.avatar}</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>
                {integranteActivo.nombre}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0 0 1.5rem 0' }}>
                @{integranteActivo.login}
              </p>
              <div className="rarity-badge" style={{ display: 'inline-block', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                Rarity: {integranteActivo.rareza}
              </div>
            </article>

            {/* Botón Siguiente */}
            <button className="pagination-btn" onClick={irSiguiente} style={{ fontSize: '1.5rem', padding: '1rem' }}>
              ▶
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Home;