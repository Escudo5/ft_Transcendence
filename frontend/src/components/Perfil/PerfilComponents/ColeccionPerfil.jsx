import { Card, ProgressBar } from '../../ui';
import { COLOR_RAREZA } from '../../rarezas';
import { useI18n } from '../../../i18n';

const estilosColeccion = {
  rejilla: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  dato: {
    background: 'var(--surface-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: '10px',
    padding: '1rem',
    textAlign: 'center'
  },
  datoValor: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--accent)'
  },
  datoEtiqueta: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '0.25rem'
  }
};

export default function ColeccionPerfil({ coleccion, puntos, esMiPerfil }) {
  const { t: traduccion, languageInfo } = useI18n();

  return (
    <Card>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>
        {traduccion('collection')}
      </h2>
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <span>{traduccion('albumCompleted')}</span>
          <strong style={{ color: 'var(--text-primary)' }}>{coleccion.porcentaje}%</strong>
        </div>
        <ProgressBar value={coleccion.porcentaje} />
      </div>

      <div style={estilosColeccion.rejilla}>
        <div style={estilosColeccion.dato}>
          <div style={estilosColeccion.datoValor}>
            {coleccion.cartas_distintas}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/{coleccion.cartas_en_catalogo}</span>
          </div>
          <div style={estilosColeccion.datoEtiqueta}>{traduccion('distinctCards')}</div>
        </div>
        <div style={estilosColeccion.dato}>
          <div style={estilosColeccion.datoValor}>{coleccion.cartas_con_repetidas}</div>
          <div style={estilosColeccion.datoEtiqueta}>{traduccion('withDuplicates')}</div>
        </div>
        <div style={estilosColeccion.dato}>
          <div style={estilosColeccion.datoValor}>{(puntos ?? 0).toLocaleString(languageInfo.locale)}</div>
          <div style={estilosColeccion.datoEtiqueta}>{traduccion('score')}</div>
        </div>
      </div>

      {coleccion.carta_mas_rara && (
        <div style={{ ...estilosColeccion.dato, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
          {coleccion.carta_mas_rara.photo && (
            <img src={coleccion.carta_mas_rara.photo} alt={coleccion.carta_mas_rara.login} style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' }} />
          )}
          <div>
            <div style={estilosColeccion.datoEtiqueta}>{esMiPerfil ? traduccion('yourRarestCard') : traduccion('theirRarestCard')}</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{coleccion.carta_mas_rara.login}</div>
            <div style={{ color: COLOR_RAREZA[coleccion.carta_mas_rara.tier] || 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
              {coleccion.carta_mas_rara.tier}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}