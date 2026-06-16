import { useEffect } from 'react';
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

  // 📡 RECEPTOR AUTOMÁTICO DEL CÓDIGO DE 42
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      console.log("¡Código de 42 detectado! Autenticando al alumno...", code);

      fetch(`http://localhost:8000/api/users/auth/callback/?code=${code}`)
        .then(response => response.json())
        .then(data => {
          console.log("Respuesta del Backend:", data);
          // Saltará la alerta de éxito con los sobres del día
          alert(`¡Conexión exitosa!\nUsuario: ${data.username}\nSobres disponibles hoy: ${data.sobres_disponibles_hoy}`);
          // 🚨 IMPORTANTE: No ponemos navigate('/catalogo') para que el alumno se quede en esta portada viendo vuestras cartas de presentación
        })
        .catch(error => {
          console.error("Error al hablar con el backend:", error);
          alert("Error en la autenticación con la Intra de 42");
        });
    }
  }, []);

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

      {/* 🃏 SECCIÓN VISUAL: Vuestras 5 cartas fijas de presentación */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '3rem', padding: '0 2rem' }}>
        {INTEGRANTES.map((user) => (
          <article key={user.login} className={`card-item rarity-${user.rareza}`} style={{ padding: '1rem', textAlign: 'center', background: '#2a2a2a', borderRadius: '12px', border: '1px solid #444' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{user.avatar}</div>
            <h3 style={{ fontSize: '1.1rem', margin: '0' }}>{user.nombre}</h3>
            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>@{user.login}</span>
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
    </div>
  );
}

export default Home;