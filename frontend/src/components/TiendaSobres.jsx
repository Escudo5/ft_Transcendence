import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // 👈 IMPORTAMOS FRAMER MOTION
import FondoTiendaSobres from './FondoTiendaSobres';
import { Alert } from './ui';

// 1. IMPORTA LAS 3 IMÁGENES DE TUS SOBRES
import sobreIntacto from '../assets/sobre_verde_0.png';
import sobreRoto1 from '../assets/sobre_verde_1.png';
import sobreRoto2 from '../assets/sobre_verde_2.png';

function TiendaSobres() {
  const navigate = useNavigate();

  const [fase, setFase] = useState('PRE_APERTURA');
  const [toquesSobre, setToquesSobre] = useState(0);

  const [cartasCargadas, setCartasCargadas] = useState([]);
  const [error, setError] = useState('');
  const [abriendo, setAbriendo] = useState(false);
  const [sobresDisponibles, setSobresDisponibles] = useState(null); // null = aun no lo sabemos

  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  // Las rarezas del backend (tier) no se llaman igual que los estilos de esta
  // pantalla, asi que las traducimos. El color sube conforme sube la rareza,
  // que es lo que importa aunque los nombres no coincidan.
  // (El mismo diccionario esta en Catalogo.jsx: si se cambia uno, el otro.)
  const TIER_A_RAREZA = {
    Legendaria: 'legendary',
    Transcender: 'epic',
    'Épica': 'rare',
    'Común': 'common',
  };

  // Convierte una carta del backend al formato que pinta esta pantalla
  const adaptarCarta = (c) => ({
    login: c.login,
    nombre: c.title || c.login,
    foto: c.photo,
    rareza: TIER_A_RAREZA[c.tier] || 'common',
  });

  // Al entrar preguntamos cuantos sobres tiene, para no dejarle romper el sobre
  // si no le queda ninguno.
  const consultarSobres = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/cards/sobres/`, { credentials: 'include' });
      if (!res.ok) return;
      const datos = await res.json();
      const quedan = datos.sobres?.comun ?? 0;
      setSobresDisponibles(quedan);
      if (quedan < 1) setError('No te quedan sobres comunes. Vuelve mañana a por los tuyos.');
    } catch (e) {
      console.error('No se pudo consultar el inventario de sobres:', e);
    }
  };

  useEffect(() => { consultarSobres(); }, []);

  // Pide al backend que abra un sobre de verdad: descuenta uno del inventario,
  // sortea 5 cartas segun las probabilidades y las guarda en el album.
  const abrirSobreEnBackend = async () => {
    setAbriendo(true);
    setError('');
    try {
      // Django exige un token para las peticiones que envian datos
      const resToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();

      const res = await fetch(`${apiBaseUrl}/cards/sobres/abrir/comun/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(datos.error || datos.detail || 'No se ha podido abrir el sobre.');
        return false;
      }

      setCartasCargadas((datos.cartas || []).map(adaptarCarta));
      // El backend nos dice cuantos le quedan tras abrir este
      if (typeof datos.sobres_restantes === 'number') setSobresDisponibles(datos.sobres_restantes);
      return true;
    } catch (e) {
      console.error('Error al abrir el sobre:', e);
      setError('No se ha podido conectar con el servidor.');
      return false;
    } finally {
      setAbriendo(false);
    }
  };
  
  // Array de control: registra qué carta está bocarriba (true) o bocabajo (false)
  const [cartasVolteadas, setCartasVolteadas] = useState([false, false, false, false, false]);

  const INTEGRANTES = [
    { login: "ksudyn", nombre: "Konrad", avatar: "💻", rareza: "legendary" },
    { login: "pablalva", nombre: "Pablo", avatar: "⚡", rareza: "legendary" },
    { login: "nmagro-r", nombre: "Nacho", avatar: "🔥", rareza: "epic" },
    { login: "smarquez", nombre: "Sergio", avatar: "🛡️", rareza: "rare" },
    { login: "osmunoz-", nombre: "Óscar", avatar: "⚔️", rareza: "common" },
  ];

  const clickVolver = () => {
    navigate('/Inventario');
  };

  // Manejador al tocar el sobre (Efecto de rotura progresiva)
  const tocarSobre = async () => {
    if (abriendo) return; // evita abrir dos veces si se hace doble clic

    // 🔒 Si no le quedan sobres, ni siquiera empieza a romperse: seria abrir un
    // regalo para encontrarlo vacio.
    if (sobresDisponibles !== null && sobresDisponibles < 1) {
      setError('No te quedan sobres comunes. Vuelve mañana a por los tuyos.');
      setToquesSobre(0);
      return;
    }

    if (toquesSobre < 2) {
      setToquesSobre(prev => prev + 1);
    } else {
      // Al tercer toque pedimos al backend que abra el sobre de verdad.
      const haIdoBien = await abrirSobreEnBackend();
      if (!haIdoBien) {
        // Si no ha podido abrirse (por ejemplo, no te quedan sobres), dejamos
        // el sobre otra vez entero. Si se quedara roto pareceria que la pantalla
        // se ha colgado.
        setToquesSobre(0);
        return;
      }

      setCartasVolteadas([false, false, false, false, false]); // todas bocabajo
      setFase('REVELADO');
    }
  };

  // Aqui volteamos la carta si no esta volteada ya
  const voltearCarta = (index) => {
    if (cartasVolteadas[index] === true)
      return;

    const nuevoEstado = [...cartasVolteadas];
    nuevoEstado[index] = true;
    setCartasVolteadas(nuevoEstado);
  };

  const comprobarTodasVolteadas = () => {
    return cartasVolteadas.every(estado => estado === true);
  };

  const resetearFases = () => {
    setFase('PRE_APERTURA');
    setToquesSobre(0);
    setCartasCargadas([]);
  };

  const obtenerEstiloRareza = (rareza) => {
    switch (rareza) {
      case 'legendary': return { color: 'var(--rarity-legendary)', border: '3px solid var(--rarity-legendary)', shadow: '0 0 25px rgba(217, 119, 6, 0.6)' };
      case 'epic': return { color: 'var(--rarity-epic)', border: '3px solid var(--rarity-epic)', shadow: '0 0 25px rgba(168, 85, 247, 0.6)' };
      case 'rare': return { color: 'var(--rarity-rare)', border: '3px solid var(--rarity-rare)', shadow: '0 0 20px rgba(2, 132, 199, 0.5)' };
      default: return { color: '#ffffff', border: '2px solid #ffffff', shadow: '0 4px 15px rgba(255, 255, 255, 0.2)' };
    }
  };

  const obtenerImagenSobre = () => {
    if (toquesSobre === 0) return sobreIntacto;
    if (toquesSobre === 1) return sobreRoto1;
    return sobreRoto2;
  };

  const renderBotonVolver = () => {
    if (fase !== 'PRE_APERTURA')
      return null;
    return (
      <button
        onClick={clickVolver}
        className="back-btn-link"
        style={{
          padding: '0.8rem 1.5rem',
          fontSize: '1.2rem',
          cursor: 'pointer',
          borderRadius: '50px',
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          zIndex: 10,
          backgroundColor: 'var(--surface-raised)',
          color: '#fff',
          border: '2px solid #ff9ffc',
          boxShadow: '0 0 10px rgba(255,159,252,0.3)'
        }}
      >
        ← Volver al Inventario
      </button>
    );
  };

  const Sobrepreeapertura = () => {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          zIndex: 5
        }}
      >
        {/* ⚠️ El aviso va ARRIBA del sobre: el sobre mide 800px y cualquier cosa
            que se ponga debajo se queda fuera de la pantalla y no se ve. */}
        {error && (
          // Aviso del sistema de diseño (ui.jsx): los colores y el role="alert"
          // para lectores de pantalla los pone él. Aquí solo se mantiene la
          // posición fija arriba, que es lo que este caso necesita.
          <Alert
            tone="error"
            style={{
              position: 'fixed',
              top: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            {error}
          </Alert>
        )}

        <motion.img
          key={toquesSobre}
          src={obtenerImagenSobre()}
          alt="Sobre 42"
          onClick={tocarSobre}
          initial={{ scale: 0.9, rotate: -2 }}
          animate={{ scale: 1, rotate: [0, -3, 3, 0] }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '560px',
            height: '800px',
            objectFit: 'contain',
            cursor: 'pointer',
            filter: `
              drop-shadow(0 0 25px rgba(20, 184, 166, 0.5)) 
              drop-shadow(0 0 50px rgba(168, 85, 247, 0.6))
            `
          }}
        />

        <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 'bold', textShadow: '0 0 10px #000' }}>
          {abriendo && "Abriendo el sobre…"}
          {!abriendo && toquesSobre === 0 && "¡Haz clic en el sobre para abrirlo!"}
          {!abriendo && toquesSobre === 1 && "¡Toca 2 veces más!"}
          {!abriendo && toquesSobre === 2 && "¡Un último toque!"}
        </p>

      </div>
    );
  };

  // COMPONENTE: REPARTIENDO CARTAS DESDE EL CENTRO
  const PantallaCincoCartas = () => {
    // Función para calcular desde qué punto X del centro sale cada carta
    const obtenerXInicial = (index) => {
      // Como son 5 cartas, la 0 y 1 vienen de la derecha del centro, la 3 y 4 de la izquierda
      const offset = (index - 2) * -180; // Compensación exacta según el ancho de la carta + gap
      return offset;
    };
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3rem',
          width: '95vw'
        }}
      >
        {/* Fila horizontal que posiciona las 5 cartas juntas una al lado de la otra */}
        <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
          {cartasCargadas.map((carta, index) => {
            const estiloRareza = obtenerEstiloRareza(carta.rareza);
            const estaVolteada = cartasVolteadas[index];

            return (
              <motion.div
                key={index}
                // 🎴 TODAS NACEN EN EL CENTRO EXACTO (x e y calculados desde el origen común)
                initial={{ 
                  scale: 0.1, 
                  opacity: 0, 
                  x: obtenerXInicial(index), // Vienen desplazadas horizontalmente hasta el centro
                  y: 50 // Un pelín abajo donde estaba el sobre
                }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  x: 0, // Van a su posición normal en el Flexbox
                  y: 0 
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.2, // Salida en abanico secuencial
                  type: 'spring',
                  stiffness: 100,
                  damping: 14
,                }}
                onClick={() => voltearCarta(index)}
                style={{
                  width: '180px',
                  height: '270px',
                  cursor: estaVolteada ? 'default' : 'pointer', // Quita la mano si ya está revelada
                  perspective: '1000px' // Da profundidad para el efecto 3D
                }}
              >
                {/* Contenedor animable en 3D de Framer Motion */}
                <motion.div
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d'
                  }}
                  animate={{ rotateY: estaVolteada ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                  {/* CARA A (BOCABAJO): Reverso común del juego */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      backgroundColor: 'var(--surface-raised)',
                      border: '3px solid #ff9ffc',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                    }}
                  >
                    <div style={{ color: '#ff9ffc', fontWeight: 'bold', fontSize: '2rem', textShadow: '0 0 10px #ff9ffc' }}>
                      42
                    </div>
                  </div>

                  {/* CARA B (BOCARRIBA): Datos reales de la carta */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)', // Arranca invertida para el efecto de giro
                      backgroundColor: 'rgba(9, 9, 11, 0.95)',
                      borderRadius: '12px',
                      border: estiloRareza.border,
                      boxShadow: estiloRareza.shadow,
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1rem',
                      justifyContent: 'space-between',
                      color: '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{carta.login}</span>
                      <span style={{ color: estiloRareza.color, fontWeight: 'bold', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        {carta.rareza}
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '110px', backgroundColor: 'var(--surface-overlay)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', overflow: 'hidden' }}>
                      {carta.foto ? (
                        <img
                          src={carta.foto}
                          alt={carta.login}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        // Por si ese alumno no tiene foto en la Intra
                        '👤'
                      )}
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', borderTop: '1px solid #333', paddingTop: '0.5rem' }}>
                      {carta.nombre}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Solo aparece si el usuario ha revelado las 5 cartas */}
        {comprobarTodasVolteadas() && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={resetearFases}
            style={{
              padding: '0.9rem 3rem',
              fontSize: '1.2rem',
              backgroundColor: '#00babc',
              color: '#101418',
              border: '2px solid #7fffee',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 0 20px rgba(0, 186, 188, 0.55)',
              maxWidth: 'calc(100vw - 2rem)',
              textAlign: 'center'
            }}
          >
            SALIR DE ESTA APERTURA
          </motion.button>
        )}
      </div>
    );
  };

  const PaginaTiendaSobres = () => {
    return (
      <main className="app-container" style={{ position: 'relative', minHeight: '100vh', padding: '2rem', overflowX: 'hidden' }}>
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
          <FondoTiendaSobres
            topColor="#5227FF"
            bottomColor="#FF9FFC"
            intensity={0.7}
            rotationSpeed={0.5}
            glowAmount={0.002}
            pillarWidth={18}
            pillarHeight={3}
            noiseIntensity={0.5}
            pillarRotation={25}
            interactive={false}
            mixBlendMode="screen"
            quality="high"
          />
        </div>

        {renderBotonVolver()}

        {fase === 'PRE_APERTURA' && Sobrepreeapertura()}
        {fase === 'REVELADO' && PantallaCincoCartas()}
      </main>
    );
  };

  return PaginaTiendaSobres();
}

export default TiendaSobres;