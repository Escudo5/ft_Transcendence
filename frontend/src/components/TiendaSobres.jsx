import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FondoTiendaSobres from './FondoTiendaSobres';

import sobreIntacto from '../assets/sobre_verde_0.png';
import sobreRoto1 from '../assets/sobre_verde_1.png';
import sobreRoto2 from '../assets/sobre_verde_2.png';

function TiendaSobres()
{
  const navigate = useNavigate();

  // Estados de control
  const [fase, setFase] = useState('PRE_APERTURA'); // 'PRE_APERTURA' | 'ANIMACION' | 'REVELADO'
  const [toquesSobre, setToquesSobre] = useState(0); // Para ir rompiendo el sobre (0, 1, 2)
  const [cartasCargadas, setCartasCargadas] = useState([]);
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
  const tocarSobre = () =>
    {
      if (toquesSobre < 2)
      {
        setToquesSobre(prev => prev + 1);
      }
      else
      {
      // Al tercer toque abre las cartas
      setFase('ANIMACION');
      setTimeout(() => {
        setCartasCargadas(INTEGRANTES);
        setCartasVolteadas([false, false, false, false, false]);
        setFase('REVELADO');
      }, 1500); // 1.5 segundos de animación de apertura
    }
  };

  const voltearCarta = (index) => {
    if (cartasVolteadas[index])
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

  // Obtener la imagen según los toques dados al sobre
  const obtenerImagenSobre = () => {
    if (toquesSobre === 0) return sobreIntacto;
    if (toquesSobre === 1) return sobreRoto1;
    return sobreRoto2;
  };

  const renderBotonVolver = () => {
    if (fase !== 'PRE_APERTURA') return null;
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

  // COMPONENTE: SOBRE VISUAL EN PRE-APERTURA
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
            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))'
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

  // COMPONENTE: ANIMACIÓN INTERMEDIA
  const PantallaAnimacion = () => {
    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, textAlign: 'center' }}>
        <motion.h2 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ repeat: Infinity, duration: 0.8 }}
          style={{ color: '#fff', fontSize: '2.5rem', textShadow: '0 0 15px #FF9FFC' }}
        >
          ⌨️ ¡REPARTIENDO CARTAS! ⌨️
        </motion.h2>
      </div>
    );
  };

  // COMPONENTE: LAS 5 CARTAS
  const PantallaCincoCartas = () => {
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
        <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
          {cartasCargadas.map((carta, index) => {
            const estiloRareza = obtenerEstiloRareza(carta.rareza);
            const estaVolteada = cartasVolteadas[index];

            return (
              <div
                key={index}
                onClick={() => voltearCarta(index)}
                style={{
                  width: '180px',
                  height: '270px',
                  cursor: estaVolteada ? 'default' : 'pointer',
                  perspective: '1000px'
                }}
              >
                <motion.div
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d'
                  }}
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    rotateY: estaVolteada ? 180 : 0 
                  }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1, // Animación en cascada de reparto de cartas
                    ease: 'easeInOut' 
                  }}
                >
                  {/* REVERSO DE LA CARTA (BOCABAJO) */}
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
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                    }}
                  >
                    <span style={{ color: '#ff9ffc', fontWeight: 'bold', fontSize: '2rem', textShadow: '0 0 10px #ff9ffc' }}>
                      42
                    </span>
                  </div>

                  {/* ANVERSO DE LA CARTA (REVELADA) */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
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
              </div>
            );
          })}
        </div>

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
      {fase === 'ANIMACION' && PantallaAnimacion()}
      {fase === 'REVELADO' && PantallaCincoCartas()}
    </div>
  );
}

export default TiendaSobres;