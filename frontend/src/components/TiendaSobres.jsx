import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  FondoTiendaSobres  from './FondoTiendaSobres';
function TiendaSobres()
{
    const navigate = useNavigate();

    const clickVolver = () => {
      navigate('/Inventario');
    }


    const renderBotonVolver = () => {
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
            borderRadius: '50PX',
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          Volver al Inventario
        </button>
      )
    };

    const Sobrepreeapertura = () => {
      return (
        <button
        //onClick={}
        className="back-btn-link"
        style={{
          padding: '0',
          fontSize: '1.5rem',
          cursor: 'pointer',
          width: '200px',
          height: '300px',
          borderRadius: '50PX',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)', 
          display: 'felx',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          SOBRE
        </button>
      )
    };
    
    const PaginaTiendaSobres = () => 
    {
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
        {Sobrepreeapertura()}
        </div>
        );
    }

    return PaginaTiendaSobres();

}

export default TiendaSobres;
