import { TituloSeccion } from './TituloSeccion';
import { SubtituloSeccion } from './SubtituloSeccion';
import { IconoSobre } from './IconoSobre';

export const AbrirSobreSeccion = ({
  listaSobres,
  sobresDisponibles,
  tipoSobreActivo,
  alSeleccionarTipo,
  traduccion,
}) => {
  return (
    <section
      className="control-panel"
      style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '2rem auto' }}
      aria-labelledby="abrir-sobres-titulo"
    >
      <div className="grid-meta">
        <TituloSeccion id="abrir-sobres-titulo">{traduccion('availablePacks')}</TituloSeccion>
        <SubtituloSeccion>{traduccion('choosePackQuality')}</SubtituloSeccion>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {listaSobres.map((sobre) => {
          const tipoBackend = sobre.backendType || sobre.id;
          const cantidadDisponible = sobresDisponibles[tipoBackend];

          return (
            <button
              key={sobre.id}
              type="button"
              className={`pack-option pack-option-${sobre.id} ${tipoSobreActivo === tipoBackend ? 'is-selected' : ''}`}
              onClick={() => alSeleccionarTipo(tipoBackend)}
              style={{ '--pack-color': sobre.color }}
            >
              <IconoSobre /> {sobre.nombre}
              <span style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                {cantidadDisponible ?? '…'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};