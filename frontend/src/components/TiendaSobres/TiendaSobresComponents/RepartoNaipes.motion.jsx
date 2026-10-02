import { motion } from 'framer-motion';
import { useCallback } from "react";

export const RepartoNaipes = ({ index: indice, estaVolteada, alHacerClic, children }) => {

    const obtenerXInicial = useCallback((posicion) => {
        const compensacion = (posicion - 2) * -180;
        return compensacion;
    }, []);

    return (
        <motion.div
            key={indice}
            initial={{
                scale: 0.1,
                opacity: 0,
                x: obtenerXInicial(indice),
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
                delay: indice * 0.2,
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