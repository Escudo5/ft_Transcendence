import { useCallback } from "react";

export const RepartoNaipes = ({ children }) => {

    // Función para calcular desde qué punto X del centro sale cada carta
    const obtenerXInicial = useCallback((index) => {
        // Como son 5 cartas, la 0 y 1 vienen de la derecha del centro, la 3 y 4 de la izquierda
        const offset = (index - 2) * -180; // Compensación exacta según el ancho de la carta + gap
        return offset;
    }, []);

    // Aqui volteamos la carta si no esta volteada ya
    const voltearCarta = useCallback((index) => {
        if (cartasVolteadas[index] === true)
            return;

        const nuevoEstado = [...cartasVolteadas];
        nuevoEstado[index] = true;
        setCartasVolteadas(nuevoEstado);
    }, []);
    
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
            }}
            onClick={() => voltearCarta(index)}
            style={{
                width: '180px',
                height: '270px',
                cursor: estaVolteada ? 'default' : 'pointer', // Quita la mano si ya está revelada
                perspective: '1000px' // Da profundidad para el efecto 3D
            }}

        >{children}</motion.div>
    )
}