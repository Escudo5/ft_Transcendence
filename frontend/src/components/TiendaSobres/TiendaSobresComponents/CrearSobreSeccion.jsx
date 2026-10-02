import { TituloSeccion } from './TituloSeccion';
import { SubtituloSeccion } from './SubtituloSeccion';
import { IconoSobre } from './IconoSobre';

export const CrearSobreSeccion = ({ listaSobres, alSeleccionarSobre, traduccion }) => {
  return (
    <section
      className="control-panel"
      style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '4rem auto 2rem' }}
      aria-labelledby="crear-sobres-titulo"
    >
      <div className="grid-meta">
        <TituloSeccion id="crear-sobres-titulo">{traduccion('getPacksWithDuplicates')}</TituloSeccion>
        <SubtituloSeccion>{traduccion('burn4KeepOne')}</SubtituloSeccion>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {listaSobres.map((sobre) => (
          <button
            key={sobre.id}
            type="button"
            className={`pack-option pack-option-${sobre.id}`}
            onClick={() => alSeleccionarSobre(sobre)}
            style={{ '--pack-color': sobre.color }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <IconoSobre /> {sobre.nombre}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.74rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                opacity: 0.85,
                textAlign: 'center',
                lineHeight: 1.35,
              }}
            >
              {traduccion('burnsDuplicatesOf')}<br />
              {sobre.rarezas.join(' o ')}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};