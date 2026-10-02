import { Card } from '../../ui';
import { FilaClasificacion } from './FilaClasificacion';

export const ListaClasificacion = ({
  cargando,
  error,
  clasificacion,
  formateador,
  traduccion,
}) => {
  return (
    <Card>
      {cargando ? (
        <p style={{ color: 'var(--text-secondary)' }}>{traduccion('rankingLoading')}</p>
      ) : error ? (
        <p style={{ color: '#fca5a5', fontWeight: 600 }}>{error}</p>
      ) : !clasificacion || clasificacion.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>{traduccion('rankingEmpty')}</p>
      ) : (
        clasificacion.map((usuario) => (
          <FilaClasificacion
            key={usuario.username}
            usuario={usuario}
            formateador={formateador}
            traduccion={traduccion}
          />
        ))
      )}
    </Card>
  );
};