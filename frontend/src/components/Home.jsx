import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const INTEGRANTES = [
  { login: "ksudyn", nombre: "Konrad", avatar: "imagen", rareza: "legendary" },
  { login: "pablalva", nombre: "Pablo", avatar: "imagen", rareza: "legendary" },
  { login: "nmagro-r", nombre: "Nacho", avatar: "imagen", rareza: "epic" },
  { login: "smarquez", nombre: "Sergio", avatar: "imagen", rareza: "rare" },
  { login: "osmunoz-", nombre: "Óscar", avatar: "imagen", rareza: "common" },
];

function Home() {
  const navigate = useNavigate();

  // 🔑 Enlace de autorización real con vuestro CLIENT_ID de la captura
 const URL_LOGIN_42 = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-85745739c040c37d065eeef72dafbd19dea1e46b50172daac4f20c1907d34b47&redirect_uri=http%3A%2F%2Flocalhost%3A3000&response_type=code&scope=public";

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
          
          // 1. Le soltamos la alerta de éxito al alumno
          alert(`¡Conexión exitosa!\nUsuario: ${data.username}\nSobres disponibles hoy: ${data.sobres_disponibles_hoy}`);
          
          // 2. 🚀 ¡PUM! Le mandamos automáticamente al Álbum de cartas
          navigate('/catalogo');
        })
        .catch(error => {
          console.error("Error al hablar con el backend:", error);
          alert("Error en la autenticación con la Intra de 42");
        });
    }
  }, [navigate]);

  return (
    <div className="app-container" style={{ padding: '2rem 0' }}>
      <header className="app-header">
        <div className="logo-section">
          <h1>ft_transcendence</h1>
        </div>
        <p className="subtitle">Integrantes del grupo</p>
      </header>

      {/* 🔑 BOTÓN DE LOGIN REFORZADO (A PRUEBA DE CSS) */}
      <div style={{ textAlign: 'center', margin: '2rem 0', position: 'relative', zIndex: 9999 }}>
        <button 
          onClick={() => window.location.href = URL_LOGIN_42}
          style={{
            display: 'inline-block',
            padding: '1.25rem 3rem',
            fontSize: '1.3rem',
            fontWeight: 'bold',
            color: '#FFFFFF',
            backgroundColor: '#00BABC',
            border: '3px solid #FFFFFF',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(0, 186, 188, 0.6)',
            width: 'auto',
            minWidth: '300px'
          }}
        >
          🔑 CONECTAR CUENTA DE 42 (RECLAMAR SOBRES)
        </button>
      </div>
      {/* Cartas de integrantes */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '1rem' }}>
        {INTEGRANTES.map((user) => (
          <article key={user.login} className={`card-item rarity-${user.rareza}`} style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{user.avatar}</div>
            <h3 style={{ fontSize: '1rem', margin: '0' }}>{user.nombre}</h3>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>@{user.login}</span>
          </article>
        ))}
      </section>

      {/* Botones principales */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <Link to="/catalogo" className="back-btn-link" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '1.25rem', display: 'block' }}>
          📂 Ver Álbum
        </Link>
        <button className="back-btn-link" style={{ padding: '1.5rem', fontSize: '1.25rem', cursor: 'pointer' }} onClick={Game}>
          🎮 Iniciar Game
        </button>
      </section>
    </div>
  );
}

export default Home;