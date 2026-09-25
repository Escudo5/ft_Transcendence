import { useEffect, useRef, useState } from 'react';

// 🛠️ COMENTARIO DE IMPORTACIÓN: Cuando tengas tu imagen lista, descomenta la línea de abajo:
// import imagenSobre del '../assets/mi-sobre.png';

function SobreAnimado({ onOpen }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scrapedPercent, setScrapedPercent] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // -------------------------------------------------------------------------
    // OPCIÓN POR DEFECTO: Gradiente metalizado provisional
    // -------------------------------------------------------------------------
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.5, '#475569');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 159, 252, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.fillText('42 TCG PACK', canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0; 

    ctx.strokeStyle = '#ff9ffc';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, 45);
    ctx.lineTo(canvas.width - 15, 45);
    ctx.stroke();

    ctx.fillStyle = '#ff9ffc';
    ctx.font = '11px sans-serif';
    ctx.fillText('⚡ RASGA POR AQUÍ PARA ABRIR ⚡', canvas.width / 2, 30);

    // -------------------------------------------------------------------------
    // 🛠️ BLOQUE DE CARGA DE IMAGEN (Comenta todo lo de arriba y activa esto al tener tu PNG)
    // -------------------------------------------------------------------------
    /*
    const img = new Image();
    img.src = imagenSobre; // Usa la variable importada arriba
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Dibujamos la guía de corte sobre tu imagen
      ctx.strokeStyle = '#ff9ffc';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(15, 45);
      ctx.lineTo(canvas.width - 15, 45);
      ctx.stroke();
    };
    */

  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    scratch(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const scratch = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (y > 75) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercent();
  };

  const checkScratchPercent = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(15, 15, canvas.width - 30, 45);
    const pixels = imgData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const percent = (transparent / (pixels.length / 4)) * 100;
    setScrapedPercent(percent);

    if (percent > 55) {
      onOpen();
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '240px',
        height: '340px',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        cursor: 'crosshair',
        backgroundColor: '#000'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onMouseMove={scratch}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
        onTouchMove={scratch}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

export default SobreAnimado;