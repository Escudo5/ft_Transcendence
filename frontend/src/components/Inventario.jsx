import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Inventario() {
  const navigate = useNavigate();
  const [cargandoSobre, setCargandoSobre] = useState(false);
  const [mensajeSobre, setMensajeSobre] = useState('');
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const clickVolver = () => {
    navigate('/home');
  };

  const clickMochila = () => {
    navigate('/sobre');
  };

  const irTiendaSobres = () => {
    navigate('/tienda-sobre');
  }
  const renderBotonVolver = () => {
    return (
      <button
        onClick={clickVolver}
        className="back-btn-link"
        style={{
          padding: '0',
          fontSize: '1rem',
          cursor: 'pointer',
          width: '150px',
          height: '60px',
          borderRadius: '8px',
          position: 'absolute',
          top: '2.5rem',
          left: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ⬅️ Volver al Inicio
      </button>
    );
  };

  const renderBotonSobre = () => {
    return (
      <button
        onClick={clickMochila}
        className="back-btn-link"
        style={{
          padding: '0',
          fontSize: '0.9rem',
          cursor: 'pointer',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        MOCHILA
      </button>
    );
  };
  
  const renderTablillaInformativa = () => {
    return (
      <div
        className="control-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          height: '220px',
          margin: '10rem auto 2rem auto',
          padding: '2.5rem',
          backgroundColor: 'rgba(20, 20, 27, 0.2)',
          border: '5px solid rgba(0, 255, 204, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          TABLILLA INFORMATIVA
        </div>

        <div></div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}></div>
      </div>
    );
  };

  const renderTablillaEstadisticas = () => {
    return (
      <div
        className="control-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          height: '220px',
          margin: '2rem auto',
          padding: '2.5rem',
          backgroundColor: 'rgba(20, 20, 27, 0.2)',
          border: '5px solid rgba(0, 255, 204, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          TABLILLA DE ESTADISTICAS
        </div>

        <div></div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}></div>
      </div>
    );
  };

  // ⚠️ Estas dos funciones ya NO se usan desde aqui: el Inventario ahora solo
  // lleva a la tienda de sobres. Se dejan a proposito porque son el ejemplo que
  // funciona de como llamar al backend para abrir un sobre (pedir el token CSRF
  // y enviarlo en la cabecera). TiendaSobres.jsx todavia no habla con el
  // backend: cuando se conecte, este es el codigo a reutilizar. No borrar hasta
  // entonces.
  const obtenerTokenCsrf = async () => {
    const response = await fetch(`${apiBaseUrl}/users/csrf/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('No se pudo obtener el token CSRF.');
    }

    const data = await response.json();
    return data.csrfToken;
  };

  const abrirSobreComun = async () => {
    setCargandoSobre(true);
    setMensajeSobre('');

    try {
      const csrfToken = await obtenerTokenCsrf();
      const response = await fetch(`${apiBaseUrl}/cards/sobres/abrir/comun/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo abrir el sobre.');
      }

      setMensajeSobre(`¡Sobre común abierto! Has recibido ${data.cartas?.length || 0} cartas.`);
    } catch (error) {
      console.error('Error al abrir el sobre:', error);
      setMensajeSobre(error.message || 'No se pudo abrir el sobre.');
    } finally {
      setCargandoSobre(false);
    }
  };

  const renderTiendaSobres = () => {
    return (
      <div
        className="control-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          minHeight: '220px',
          margin: '2rem auto',
          padding: '2.5rem',
          backgroundColor: 'rgba(20, 20, 27, 0.2)',
          border: '5px solid rgba(0, 255, 204, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          TIENDA DE SOBRES
        </div>

        {/* SOBRE VISUAL (Konrad): al pulsarlo lleva a la tienda de sobres */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div 
            onClick={irTiendaSobres}
            style={{
              width: '140px',
              height: '90px',
              backgroundColor: '#1a1a24',
              border: '3px solid #00ffcc',
              borderRadius: '8px',
              position: 'relative',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 255, 204, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 204, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 204, 0.3)';
            }}
          >
            {/* Triángulo superior del sobre (Efecto carta clásica) */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '40px 67px 0 67px',
              borderColor: 'rgba(0, 255, 204, 0.15) transparent transparent transparent'
            }} />
            
            {/* Sello central místico estilo Bakugan / Orbe de Energía */}
            <div style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#ff9ffc',
              borderRadius: '50%',
              zIndex: 2,
              boxShadow: '0 0 10px #ff9ffc',
              border: '2px solid #fff'
            }} />

            <span style={{ position: 'absolute', bottom: '5px', fontSize: '0.65rem', color: '#00ffcc', fontWeight: 'bold', letterSpacing: '1px', zIndex: 2 }}>
              COMPRAR
            </span>
          </div>
        </div>

        {mensajeSobre && (
          <div style={{ color: '#8ef5e1', fontWeight: '600' }}>
            {mensajeSobre}
          </div>
        )}
      </div>
    );
  };

  const PaginaInventario = () => {
    return (
      <div className="app-container" style={{ position: 'relative', minHeight: '95vh', padding: '2rem' }}>
        
        {renderBotonVolver()}

        {renderBotonSobre()}

        {renderTablillaInformativa()}
        {renderTablillaEstadisticas()}
        {renderTiendaSobres()}

      </div>
    );
  };

  return PaginaInventario();
}

export default Inventario;