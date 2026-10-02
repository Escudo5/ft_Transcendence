import { motion } from 'framer-motion';
import { useCallback } from "react";

export const RepartoNaipes = ({ index, estaVolteada, alHacerClic, children }) => {

    // Función para calcular desde qué punto X del centro sale cada carta
    const obtenerXInicial = useCallback((idx) => {
        // Como son 5 cartas, la 0 y 1 vienen de la derecha del centro, la 3 y 4 de la izquierda
        const offset = (idx - 2) * -180; // Compensación exacta según el ancho de la carta + gap
        return offset;
    }, []);

    return (
        <motion.div
            key={index}
            // 🎴 TODAS NACEN EN EL CENTRO EXACTO
            initial={{
                scale: 0.1,
                opacity: 0,
                x: obtenerXInicial(index),
                y: 50
            }}
            animate={{
                scale: 1,
                opacity: 1,
                x: 0,
                y: 0
            }}
            transition={{
                duration: 0.6,
                delay: index * 0.2, // Salida en abanico secuencial
                type: 'spring',
                stiffness: 100,
                damping: 14
            }}
            onClick={alHacerClic}
            style={{
                width: '180px',
                height: '270px',
                cursor: estaVolteada ? 'default' : 'pointer',
                perspective: '1000px'
            }}
        >
            {children}
        </motion.div>
    );
};