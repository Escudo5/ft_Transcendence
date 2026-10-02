import SobreHolografico from '../SobreHolografico';
import { Alert } from '../../ui';

export const SobrePreapertura = ({
  error,
  tipoSobreActivo,
  alTocarSobre,
  alCancelarApertura,
  estaAbriendo,
  traduccion,
}) => {
  return (
    <div className="apertura-stage">
      {error && (
        <Alert
          tone="error"
          style={{
            position: 'fixed',
            top: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {error}
        </Alert>
      )}

      <SobreHolografico
        tipo={tipoSobreActivo}
        onOpen={alTocarSobre}
        onProgress={() => {}}
      />

      <button
        type="button"
        className="cancel-pack-button"
        onClick={alCancelarApertura}
        disabled={estaAbriendo}
      >
        {traduccion('backToChoosePack')}
      </button>
    </div>
  );
};