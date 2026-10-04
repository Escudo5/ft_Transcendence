import { Card } from '../../ui';
import { useI18n } from '../../../i18n';

const DICCIONARIO_LOGROS = {
  primera:       { nombre: 'achFirstCard',    desc: 'achFirstCardDesc' },
  coleccionista: { nombre: 'achCollector',    desc: 'achDistinctCardsDesc' },
  veterano:      { nombre: 'achVeteran',      desc: 'achDistinctCardsDesc' },
  medio_album:   { nombre: 'achHalfAlbum',    desc: 'achHalfAlbumDesc' },
  completista:   { nombre: 'achCompletist',   desc: 'achCompletistDesc' },
  leyenda:       { nombre: 'achLegendHunter', desc: 'achRarityCardDesc' },
  staff:         { nombre: 'achStaffSpotted', desc: 'achRarityCardDesc' },
  transcender:   { nombre: 'achBeyondCore',   desc: 'achRarityCardDesc' },
  coaliciones:   { nombre: 'achDiplomat',     desc: 'achDiplomatDesc' },
  acumulador:    { nombre: 'achHoarder',      desc: 'achHoarderDesc' },
  madrugador:    { nombre: 'achEarlyBird',    desc: 'achEarlyBirdDesc' },
};

export default function LogrosPerfil({ logros }) {
  const { t: traduccion } = useI18n();
  if (!logros) return null;

  const obtenerTextosLogro = (itemLogro) => {
    const claves = DICCIONARIO_LOGROS[itemLogro.id];
    if (!claves) return { nombre: itemLogro.id, descripcion: '' };

    const huecos = { n: itemLogro.objetivo };
    if (itemLogro.rareza) huecos.rareza = traduccion(`rarity${itemLogro.rareza}`);

    return { 
      nombre: traduccion(claves.nombre), 
      descripcion: traduccion(claves.desc, huecos) 
    };
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>
          {traduccion('achievements')}
        </h2>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {logros.filter((item) => item.conseguido).length} {traduccion('ofTotal', { total: logros.length })}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.8rem', marginTop: '1rem' }}>
        {logros.map((itemLogro) => {
          const { nombre, descripcion } = obtenerTextosLogro(itemLogro);
          return (
            <div key={itemLogro.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--surface-overlay)', border: `1px solid ${itemLogro.conseguido ? 'var(--accent)' : 'var(--border-default)'}`, borderRadius: '10px', padding: '0.8rem', opacity: itemLogro.conseguido ? 1 : 0.55 }}>
              <span style={{ fontSize: '1.7rem', filter: itemLogro.conseguido ? 'none' : 'grayscale(1)' }}>{itemLogro.icono}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{nombre}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  {itemLogro.conseguido ? descripcion : traduccion('achProgress', { actual: itemLogro.actual, objetivo: itemLogro.objetivo })}
                </div>
              </div>
              {itemLogro.conseguido && <span style={{ color: 'var(--accent)', fontWeight: 800 }}>✓</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}