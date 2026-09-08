import { Link } from 'react-router-dom';

function Game() {
  return (
    <div style={{
      textAlign: 'center', 
      padding: '3rem 1rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'var(--font-heading)'
    }}>
      {/* Mensaje premium */}
      <h1 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '1.5rem', 
        color: 'var(--rarity-legendary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Tranquilos, aún no es el momento... 😉
      </h1>

      {/* Contenedor de la imagen/gif con los estilos de neón del proyecto */}
      <div className="card-item rarity-legendary" style={{ 
        display: 'inline-block', 
        padding: '10px', 
        marginBottom: '2rem',
        backgroundColor: 'var(--bg-card-base)'
      }}>
        <img 
          /* URL alternativa y directa para evitar bloqueos del navegador en local */
          src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3hvaDE5bHFvbmR0aG1jZnN4aTB5dXBnY3Qwd3o5OXlxOWpkbXEwbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/r1IMdmkhUcpzy/giphy.webp" 
          alt="Cristiano Ronaldo SIUUU" 
          width="640"
          height="360"
          loading="eager"
          style={{ 
            maxWidth: '100%', 
            borderRadius: '8px',
            display: 'block'
          }} 
        />
      </div>

      {/* Botón para regresar al Home de forma limpia */}
      <div>
        <Link to="/home" className="back-btn-link" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          ⬅️ Volver al Inicio
        </Link>
      </div>
    </div>
  );
}

export default Game;