import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // 👈 IMPORTAMOS FRAMER MOTION
import FondoTiendaSobres from './FondoTiendaSobres';

function TiendaSobres() {
  const navigate = useNavigate();

  const [fase, setFase] = useState('PRE_APERTURA'); 
  const [cartasCargadas, setCartasCargadas] = useState([]);
  
  // Array de control: registra qué carta está bocarriba (true) o bocabajo (false)
  const [cartasVolteadas, setCartasVolteadas] = useState([false, false, false, false, false]);

  const INTEGRANTES = [
    { login: "ksudyn", nombre: "Konrad", avatar: "imagen", rareza: "legendary" },
    { login: "pablalva", nombre: "Pablo", avatar: "imagen", rareza: "legendary" },
    { login: "nmagro-r", nombre: "Nacho", avatar: "imagen", rareza: "epic" },
    { login: "smarquez", nombre: "Sergio", avatar: "imagen", rareza: "rare" },
    { login: "osmunoz-", nombre: "Óscar", avatar: "imagen", rareza: "common" },
  ];

  const clickVolver = () => {
    navigate('/Inventario');
  };

  const iniciarApertura = () => {
    setFase('ANIMACION');
    setCartasVolteadas([false, false, false, false, false]);
    //Se inicilaizan los volteos a falsepara que esten dados la vuelat

    setTimeout(() => {
      setCartasCargadas(INTEGRANTES);
      setFase('REVELADO');
    }, 2000);
  };

  //Aqui volteamos la carta si no esta volteada ya
  const voltearCarta = (index) =>
    {
      if (cartasVolteadas[index] === true)
        return;

      const nuevoEstado = [...cartasVolteadas];
      nuevoEstado[index] = true;
      setCartasVolteadas(nuevoEstado);
    };

  const comprobarTodasVolteadas = () =>
    {
      return cartasVolteadas.every(estado => estado === true);
    };

  const resetearFases = () =>
    {
      setFase('PRE_APERTURA');
      setCartasCargadas([]);
    };

  const obtenerEstiloRareza = (rareza) =>
  {
    switch (rareza)
    {
      case 'legendary': return { color: '#ffb700', border: '3px solid #ffb700', shadow: '0 0 25px rgba(255, 183, 0, 0.6)' };
      case 'epic': return { color: '#a335ee', border: '3px solid #a335ee', shadow: '0 0 25px rgba(163, 53, 238, 0.6)' };
      case 'rare': return { color: '#0070dd', border: '3px solid #0070dd', shadow: '0 0 20px rgba(0, 112, 221, 0.5)' };
      default: return { color: '#ffffff', border: '2px solid #ffffff', shadow: '0 4px 15px rgba(255, 255, 255, 0.2)' };
    }
  };

  const renderBotonVolver = () =>
  {
    if (fase !== 'PRE_APERTURA')
      return null;
    return (
      <button
        onClick={clickVolver}
        className="back-btn-link"
        style={{
          padding: '0',
          fontSize: '1.5rem',
          cursor: 'pointer',
          width: '200px',
          height: '75px',
          borderRadius: '50px',
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}
      >
        Volver al Inventario
      </button>
    );
  };

  const Sobrepreeapertura = () => {
    return (
      <button
        onClick={iniciarApertura}
        className="back-btn-link"
        style={{
          padding: '0',
          fontSize: '1.8rem',
          cursor: 'pointer',
          width: '220px',
          height: '320px',
          borderRadius: '12px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          color: '#fff',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #2c3e50, #bdc3c7, #2c3e50)',
          border: '4px dashed #fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          letterSpacing: '2px'
        }}
      >
        ABRIR
      </button>
    );
  };

  const PantallaAnimacion = () => {
    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: '2.5rem', textShadow: '0 0 15px #FF9FFC' }}>
          💥 ¡ABRIENDO SOBRE! 💥
        </h2>
      </div>
    );
  };

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
        {/* Fila horizontal que posiciona las 5 cartas juntas una al lado de la otra */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
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
                  
                  {/* CARA A (BOCABAJO): Reverso común del juego 
                  Aqui me gustaria poner una imagen tambien, algo como 42 o algo así */}
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
                      boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}
                  >
                    <div style={{ color: '#ff9ffc', fontWeight: 'bold', fontSize: '1.2rem', textShadow: '0 0 8px #ff9ffc' }}>42</div>
                  </div>

                  {/* CARA B (BOCARRIBA): Datos reales de la carta 
                  Y aquí que aparezca la carta en sí*/}
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
                      <span style={{ color: estiloRareza.color, fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        {carta.rareza}
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '110px', backgroundColor: '#20202b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.8rem' }}>
                      {carta.avatar}
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', borderTop: '1px solid #222', paddingTop: '0.5rem' }}>
                      {carta.nombre}
                    </div>
                  </div>

                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Solo aparece si el usuario ha revelado las 5 cartas
        Esto no se si sera necesario, pero supongo que sí,
        al final meteremos un boton para guaradar en el inventario todo
        o haremos que se guarden automaticamente*/}
        {comprobarTodasVolteadas() && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={resetearFases}
            style={{
              padding: '0.8rem 3.5rem',
              fontSize: '1.3rem',
              backgroundColor: '#00ffcc',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 0 20px #00ffcc'
            }}
          >
            GUARDAR EN INVENTARIO
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
        {fase === 'ANIMACION' && PantallaAnimacion()}
        {fase === 'REVELADO' && PantallaCincoCartas()}
      </div>
    );
  };

  return PaginaTiendaSobres();
}

export default TiendaSobres;