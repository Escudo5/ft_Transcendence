import { motion } from 'framer-motion';

export const VoltearNaipe = ({ estaVolteada, children }) => {
    return (
        <motion.div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
            }}
            animate={{ rotateY: estaVolteada ? 180 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.div>
    );
};