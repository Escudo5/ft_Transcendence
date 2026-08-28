import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // 👈 IMPORTAMOS FRAMER MOTION
import FondoTiendaSobres from './FondoTiendaSobres';

// 1. IMPORTA LAS 3 IMÁGENES DE TUS SOBRES
import sobreIntacto from '../assets/sobre_verde_0.png';
import sobreRoto1 from '../assets/sobre_verde_1.png';
import sobreRoto2 from '../assets/sobre_verde_2.png';

function TiendaSobres() {
  const navigate = useNavigate();

  const [fase, setFase] = useState('PRE_APERTURA');
  const [toquesSobre, setToquesSobre] = useState(0);

  const [cartasCargadas, setCartasCargadas] = useState([]);
  
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
  const tocarSobre = () => {
    if (toquesSobre < 2) {
      setToquesSobre(prev => prev + 1);
    } else {
      // SEGURAMENTE ESTA PARTE SEA LA QUE CAMBIE AL USAR [INTEGRANTES]
      // COMO CARTAS A MOSTRAR Y HAY QUE METER LAS CARTAS ALEATORIAS
      // Al tercer toque abre las cartas directamente
      setCartasCargadas(INTEGRANTES);
      setCartasVolteadas([false, false, false, false, false]); // Se inicializan los volteos a false para que esten dadas la vuelta
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
      case 'legendary': return { color: '#ffb700', border: '3px solid #ffb700', shadow: '0 0 25px rgba(255, 183, 0, 0.6)' };
      case 'epic': return { color: '#a335ee', border: '3px solid #a335ee', shadow: '0 0 25px rgba(163, 53, 238, 0.6)' };
      case 'rare': return { color: '#0070dd', border: '3px solid #0070dd', shadow: '0 0 20px rgba(0, 112, 221, 0.5)' };
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
          backgroundColor: '#15151b',
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
              drop-shadow(0 0 25px rgba(0, 255, 170, 0.5)) 
              drop-shadow(0 0 50px rgba(163, 53, 238, 0.6))
            `
          }}
        />

        <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 'bold', textShadow: '0 0 10px #000' }}>
          {toquesSobre === 0 && "¡Haz clic en el sobre para abrirlo!"}
          {toquesSobre === 1 && "¡Toca 2 veces más!"}
          {toquesSobre === 2 && "¡Un último toque!"}
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
                      backgroundColor: '#15151b',
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
                      backgroundColor: 'rgba(10, 10, 15, 0.95)',
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

                    <div style={{ width: '100%', height: '110px', backgroundColor: '#20202b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      {carta.avatar}
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
              backgroundColor: '#00ffcc',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 0 20px #00ffcc'
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
      <div className="app-container" style={{ position: 'relative', minHeight: '95vh', padding: '2rem', overflowX: 'hidden' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
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
      </div>
    );
  };

  return PaginaTiendaSobres();
}

export default TiendaSobres;