import { motion } from 'framer-motion';
import { RepartoNaipes } from './RepartoNaipes.motion';
import { VoltearNaipe } from './VoltearNaipe.motion';
import { NaipeCaraA } from './NaipeCaraA';
import { NaipeCaraB } from './NaipeCaraB';
import { rareza } from './rareza.config';

export const PantallaCincoCartas = ({
  cartasCargadas,
  cartasVolteadas,
  alVoltearCarta,
  alResetearFases,
  traduccion,
}) => {
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
        width: '95vw',
      }}
    >
      <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
        {cartasCargadas.map((carta, indice) => {
          const configRareza = rareza[carta.rareza];
          const estaVolteada = cartasVolteadas[indice];

          return (
            <RepartoNaipes
              key={indice}
              index={indice}
              estaVolteada={estaVolteada}
              alHacerClic={() => alVoltearCarta(indice)}
            >
              <VoltearNaipe estaVolteada={estaVolteada}>
                <NaipeCaraA rareza={configRareza} />
                <NaipeCaraB rareza={configRareza} carta={carta} />
              </VoltearNaipe>
            </RepartoNaipes>
          );
        })}
      </div>

      {cartasVolteadas.every(Boolean) && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={alResetearFases}
          style={{
            padding: '0.9rem 3rem',
            fontSize: '1.2rem',
            backgroundColor: '#00babc',
            color: '#101418',
            border: '2px solid #7fffee',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(0, 186, 188, 0.55)',
            maxWidth: 'calc(100vw - 2rem)',
            textAlign: 'center',
          }}
        >
          {traduccion('exitOpening')}
        </motion.button>
      )}
    </div>
  );
};