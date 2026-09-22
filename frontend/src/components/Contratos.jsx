import { useState, useEffect } from 'react';

import { COLOR_RAREZA } from './rarezas';
import { useI18n } from '../i18n';

const API = import.meta.env.VITE_API_URL || '/api';

/* ===========================================================================
   🤝 CONTRATOS: 4 cartas de la misma rareza -> 1 de la rareza siguiente

   Entregas 4 cartas que te sobren de una rareza y te llevas una mejor. De
   cada carta te quedas siempre al menos una, así que NUNCA pierdes una carta
   del álbum: solo das repetidas.

   En qué se diferencia de quemar cartas (TiendaSobres):
     - Quemar = suerte. 4 copias de la MISMA carta -> un sobre de 5 al azar.
     - Contrato = puntería. 4 cartas de la MISMA RAREZA -> 1 carta mejor, y
       el servidor procura darte una que te FALTE.

   Por eso existen los dos: el sobre es cantidad, el contrato es progreso.

   🎨 KONRAD: está escrito siguiendo tu Intercambio.jsx — mismo modal oscuro
   (#151821 con borde #2a2e3d), mismos colores de acento (#ffaa00 para lo
   que se pide, #00ffcc para lo seleccionado) y los mismos estilos en línea.
   El diseño es tuyo, cámbialo sin miedo: lo que no hay que tocar son los
   nombres de los campos que se mandan al servidor.
   =========================================================================== */

// Los colores salen de rarezas.js, que es el único sitio donde están.

export function BotonContratos({ onClick }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      title={t('contractButtonTitle')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1.1rem',
        borderRadius: '10px',
        border: '1px solid #ffaa00',
        backgroundColor: 'rgba(255, 170, 0, 0.12)',
        color: '#ffaa00',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {/* Dos flechas subiendo: la idea es "subir de rareza" */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
      {t('contracts')}
    </button>
  );
}

export default function ModalContratos({ isOpen, onClose, alTerminar }) {
  const { t } = useI18n();
  const [rarezas, setRarezas] = useState([]);
  const [porContrato, setPorContrato] = useState(4);
  const [rarezaElegida, setRarezaElegida] = useState(null);
  const [seleccion, setSeleccion] = useState({}); // { idCarta: cuantas }
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [premio, setPremio] = useState(null);

  async function cargar() {
    setCargando(true);
    setAviso('');
    try {
      const res = await fetch(`${API}/cards/contratos/`, { credentials: 'include' });
      if (!res.ok) {
        setAviso(t('albumLoadError'));
        return;
      }
      const datos = await res.json();
      setRarezas(datos.rarezas || []);
      setPorContrato(datos.cartas_por_contrato ?? 4);
    } catch {
      setAviso(t('serverError'));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    setRarezaElegida(null);
    setSeleccion({});
    setPremio(null);
    cargar();
  }, [isOpen]);

  if (!isOpen) return null;

  const grupo = rarezas.find((r) => r.rareza === rarezaElegida);
  const elegidas = Object.values(seleccion).reduce((a, b) => a + b, 0);

  // Cuántas más se pueden coger de esta carta: lo que le sobra menos lo que
  // ya has cogido, y sin pasarte del total del contrato.
  function puedeSubir(carta) {
    const cogidas = seleccion[carta.id] || 0;
    return cogidas < carta.sobrantes && elegidas < porContrato;
  }

  function cambiar(carta, delta) {
    setPremio(null);
    setAviso('');
    setSeleccion((actual) => {
      const siguiente = { ...actual };
      const nuevo = (siguiente[carta.id] || 0) + delta;
      if (nuevo > 0) siguiente[carta.id] = nuevo;
      else delete siguiente[carta.id];
      return siguiente;
    });
  }

  async function confirmar() {
    setEnviando(true);
    setAviso('');
    setPremio(null);
    try {
      const resToken = await fetch(`${API}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();

      const res = await fetch(`${API}/cards/contratos/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({
          cartas: Object.entries(seleccion).map(([carta, cantidad]) => ({ carta, cantidad })),
        }),
      });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Lo que dice el servidor, tal cual: los motivos son de verdad
        // ("tienes que quedarte al menos con una", "ya es la más alta"...)
        setAviso(datos.detail || t('serverError'));
        return;
      }
      setPremio(datos);
      setSeleccion({});
      cargar();                 // el álbum ha cambiado: se vuelve a pedir
      alTerminar?.();           // para que el catálogo de detrás se refresque
    } catch {
      setAviso(t('serverError'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        backgroundColor: '#151821',
        border: '1px solid #2a2e3d',
        borderRadius: '16px',
        width: '100%', maxWidth: '620px',
        maxHeight: '90vh', overflowY: 'auto',
        padding: '1.5rem', color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#ffaa00' }}>{t('contractTitle')}</h3>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: '#8b92b0' }}>
              {t('contractDescription', { count: porContrato })}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')}
                  style={{ background: 'none', border: 'none', color: '#8b92b0',
                           fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {aviso && (
          <div style={{
            marginTop: '1rem', padding: '0.6rem 0.9rem', borderRadius: '8px',
            border: '1px solid #ff4d4d', backgroundColor: 'rgba(255,77,77,0.12)',
            color: '#ff4d4d', fontSize: '0.85rem',
          }}>{aviso}</div>
        )}

        {/* La carta que acabas de conseguir */}
        {premio && (
          <div style={{
            marginTop: '1rem', padding: '0.9rem', borderRadius: '12px',
            border: `2px solid ${COLOR_RAREZA[premio.rareza_recibida] || '#00ffcc'}`,
            backgroundColor: 'rgba(0,255,204,0.06)',
            display: 'flex', alignItems: 'center', gap: '0.9rem',
          }}>
            {premio.carta?.foto && (
              <img src={premio.carta.foto} alt={premio.carta.login}
                   style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' }} />
            )}
            <div>
              <div style={{ fontWeight: 800 }}>
                {premio.carta?.login}{' '}
                <span style={{ color: COLOR_RAREZA[premio.rareza_recibida] }}>
                  {premio.rareza_recibida}
                </span>
                {premio.era_nueva && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: '#00ffcc',
                                 border: '1px solid #00ffcc', borderRadius: '999px',
                                 padding: '0.1rem 0.5rem' }}>{t('newCard')}</span>
                )}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#8b92b0' }}>{premio.mensaje}</div>
            </div>
          </div>
        )}

        {cargando ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#8b92b0' }}>{t('contractLoading')}</p>
        ) : !rarezaElegida ? (
          /* ---------- PASO 1: elegir rareza ---------- */
          <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {rarezas.map((r) => (
              <button
                key={r.rareza}
                type="button"
                disabled={!r.se_puede}
                onClick={() => { setRarezaElegida(r.rareza); setSeleccion({}); setPremio(null); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.9rem 1rem', borderRadius: '10px',
                  border: `1px solid ${r.se_puede ? (COLOR_RAREZA[r.rareza] || '#2a2e3d') : '#2a2e3d'}`,
                  backgroundColor: '#1f2433',
                  color: r.se_puede ? '#fff' : '#8b92b0',
                  cursor: r.se_puede ? 'pointer' : 'not-allowed',
                  opacity: r.se_puede ? 1 : 0.55,
                  textAlign: 'left',
                }}
              >
                <span>
                  <strong style={{ color: COLOR_RAREZA[r.rareza] }}>{r.rareza}</strong>
                  {r.sube_a
                    ? <span style={{ color: '#8b92b0' }}> → {r.sube_a}</span>
                    : <span style={{ color: '#8b92b0' }}> · {t('highestRarity')}</span>}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#8b92b0' }}>
                  {t('duplicates', { count: r.sobrantes, s: r.sobrantes === 1 ? '' : 's' })}
                  {r.sube_a && !r.se_puede && ` · ${t('missingCards', { count: porContrato - r.sobrantes })}`}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* ---------- PASO 2: elegir las 4 cartas ---------- */
          <>
            <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', gap: '1rem' }}>
              <button type="button" onClick={() => { setRarezaElegida(null); setSeleccion({}); }}
                      style={{ background: 'none', border: 'none', color: '#8b92b0',
                               cursor: 'pointer', padding: 0, fontSize: '0.85rem' }}>
                {t('changeRarity')}
              </button>
              <span style={{ fontSize: '0.9rem' }}>
                <strong style={{ color: elegidas === porContrato ? '#00ffcc' : '#ffaa00' }}>
                  {elegidas}
                </strong>
                <span style={{ color: '#8b92b0' }}> de {porContrato}</span>
              </span>
            </div>

            <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column',
                          gap: '0.5rem', maxHeight: 'min(45vh, 340px)', overflowY: 'auto',
                          paddingRight: '0.3rem' }}>
              {(grupo?.cartas || []).map((c) => {
                const cogidas = seleccion[c.id] || 0;
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                    padding: '0.55rem 0.7rem', borderRadius: '8px',
                    border: `1px solid ${cogidas ? '#00ffcc' : '#2a2e3d'}`,
                    backgroundColor: cogidas ? 'rgba(0,255,204,0.08)' : '#1f2433',
                  }}>
                    {c.foto && (
                      <img src={c.foto} alt={c.login}
                           style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{c.login}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8b92b0' }}>
                        {t('copiesCanGive', { copies: c.copias, give: c.sobrantes })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button type="button" onClick={() => cambiar(c, -1)} disabled={!cogidas || enviando}
                              aria-label={t('removeCopy', { login: c.login })}
                              style={botonPaso(!cogidas)}>−</button>
                      <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: 700 }}>{cogidas}</span>
                      <button type="button" onClick={() => cambiar(c, 1)} disabled={!puedeSubir(c) || enviando}
                              aria-label={t('addCopy', { login: c.login })}
                              style={botonPaso(!puedeSubir(c))}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.7rem', marginTop: '1.2rem' }}>
              <button type="button" onClick={onClose} disabled={enviando}
                      style={{ padding: '0.6rem 1.1rem', borderRadius: '8px',
                               border: '1px solid #2a2e3d', backgroundColor: 'transparent',
                               color: '#8b92b0', cursor: 'pointer' }}>
                {t('close')}
              </button>
              <button type="button" onClick={confirmar}
                      disabled={enviando || elegidas !== porContrato}
                      style={{
                        padding: '0.6rem 1.2rem', borderRadius: '8px',
                        border: '1px solid #ffaa00',
                        backgroundColor: elegidas === porContrato ? 'rgba(255,170,0,0.2)' : 'transparent',
                        color: '#ffaa00', fontWeight: 700,
                        cursor: elegidas === porContrato && !enviando ? 'pointer' : 'not-allowed',
                        opacity: elegidas === porContrato ? 1 : 0.5,
                      }}>
                {enviando ? t('dealClosing') : t('makeContract', { selected: elegidas, total: porContrato })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function botonPaso(apagado) {
  return {
    width: '26px', height: '26px', borderRadius: '6px',
    border: '1px solid #2a2e3d', backgroundColor: '#151821',
    color: apagado ? '#4a5068' : '#fff',
    cursor: apagado ? 'not-allowed' : 'pointer',
    lineHeight: 1, fontSize: '1rem',
  };
}
