import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // 👈 IMPORTAMOS FRAMER MOTION
import FondoTiendaSobres from './FondoTiendaSobres';
import SobreHolografico from './SobreHolografico';
import { Alert, Modal } from '../ui';
import { CLASE_RAREZA } from '../rarezas';
import { useI18n } from '../../i18n';
import { TituloSeccion } from './TiendaSobresComponents/TituloSeccion';
import { SubtituloSeccion } from './TiendaSobresComponents/SubtituloSeccion';
import { IconoSobre } from './TiendaSobresComponents/IconoSobre';
import { RepartoNaipes } from './TiendaSobresComponents/RepartoNaipes.motion';
import { VoltearNaipe } from './TiendaSobresComponents/VoltearNaipe.motion';
import { NaipeCaraA } from './TiendaSobresComponents/NaipeCaraA';
import { NaipeCaraB } from './TiendaSobresComponents/NaipeCaraB';
import { rareza } from './TiendaSobresComponents/rareza.config';

// 1. IMPORTA LAS 3 IMÁGENES DE TUS SOBRES

function TiendaSobres() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [fase, setFase] = useState('SELECCION');

  const [cartasCargadas, setCartasCargadas] = useState([]);
  const [error, setError] = useState('');
  const [abriendo, setAbriendo] = useState(false);
  const [sobresDisponibles, setSobresDisponibles] = useState({ comun: null, raro: null, epico: null });
  const [tipoSobreActivo, setTipoSobreActivo] = useState('comun');
  const [album, setAlbum] = useState([]);
  const [sobreSeleccionado, setSobreSeleccionado] = useState(null);
  const [seleccionDescarte, setSeleccionDescarte] = useState({});
  const [procesandoDescarte, setProcesandoDescarte] = useState(false);
  const [mensajeDescarte, setMensajeDescarte] = useState('');

  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  // ⚠️ Nacho, 10/09: las rarezas de aquí eran las de ayer (Junior, Senior,
  // Alumni, Blackhole) y yo las cambié el mismo día. Con las viejas, el
  // servidor rechazaba 44 de las 54 cartas al descartar. Ahora coinciden con
  // las de backend/cards/rarezas.py, que es donde se decide cuáles hay.
  //
  // SERGIO: son 3 sobres y 4 rarezas, así que las dos de arriba comparten el
  // sobre épico, igual que hacías tú antes con Alumni y Transcender.
  const SOBRES = [
    { id: 'comun', nombre: t('packCommon'), rarezas: ['Junior'], color: 'var(--rarity-common)' },
    { id: 'raro', nombre: t('packRare'), rarezas: ['Senior'], color: 'var(--rarity-rare)' },
    { id: 'legendario', backendType: 'epico', nombre: t('packLegendary'), rarezas: ['Transcender', 'Legendario', 'Staff', 'Creator'], color: 'var(--rarity-legendary)' },
  ];

  // Las rarezas del backend (tier) no se llaman igual que los estilos de esta
  // pantalla, asi que las traducimos. El color sube conforme sube la rareza,
  // que es lo que importa aunque los nombres no coincidan.
  // (El mismo diccionario esta en Catalogo.jsx: si se cambia uno, el otro.)
  // El diccionario vive en rarezas.js, en un solo sitio.
  const TIER_A_RAREZA = CLASE_RAREZA;

  // Convierte una carta del backend al formato que pinta esta pantalla
  const adaptarCarta = (c) => ({
    login: c.login,
    nombre: c.title || c.login,
    foto: c.photo,
    tier: c.tier, // Esto seria el nombre : "SENIOR", POR EJEMPLO
    rareza: TIER_A_RAREZA[c.tier] || 'common',
  });

  useEffect(() => {
    async function cargarAlbum() {
      try {
        const res = await fetch(`${apiBaseUrl}/cards/album/`, { credentials: 'include' });
        if (!res.ok) return;
        const datos = await res.json();
        setAlbum((datos || []).map((item) => ({
          cardId: item.card?.id,
          cantidad: item.cantidad ?? 1,
          login: item.card?.login || '',
          tier: item.card?.tier || 'Junior',
        })));
      } catch (e) {
        console.error('No se pudo cargar el álbum para crear sobres:', e);
      }
    }
    cargarAlbum();
  }, [apiBaseUrl]);

  // Al entrar preguntamos cuantos sobres tiene, para no dejarle romper el sobre
  // si no le queda ninguno.
  const consultarSobres = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/cards/sobres/`, { credentials: 'include' });
      if (!res.ok) return;
      const datos = await res.json();
      setSobresDisponibles({
        comun: datos.sobres?.comun ?? 0,
        raro: datos.sobres?.raro ?? 0,
        epico: datos.sobres?.epico ?? 0,
      });
    } catch (e) {
      console.error('No se pudo consultar el inventario de sobres:', e);
    }
  };

  useEffect(() => { consultarSobres(); }, []);

  const abrirSelectorSobre = useCallback((sobre) => {
    setMensajeDescarte('');
    setSeleccionDescarte({});
    setSobreSeleccionado(sobre);
  }, []); // TODO: revisar dependencias, no parece que tenga

  const cambiarGruposSeleccionados = useCallback((cardId, grupos) => {
    setSeleccionDescarte((actual) => {
      const siguiente = { ...actual };
      if (grupos > 0) siguiente[cardId] = grupos;
      else delete siguiente[cardId];
      return siguiente;
    });
  }, []); // TODO: revisar dependencias, no parece que tenga

  const confirmarDescarte = async () => {
    const cartas = Object.entries(seleccionDescarte).map(([carta, grupos]) => ({ carta, grupos }));
    if (!cartas.length) return;
    if (!window.confirm(t('burnConfirm'))) return;

    setProcesandoDescarte(true);
    setMensajeDescarte('');
    try {
      const resToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();
      const res = await fetch(`${apiBaseUrl}/cards/descartar/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ tipo_sobre: sobreSeleccionado.backendType || sobreSeleccionado.id, cartas }),
      });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.detail || datos.error || t('burnError'));

      setAlbum((actual) => actual
        .map((card) => ({ ...card, cantidad: card.cantidad - ((seleccionDescarte[card.cardId] || 0) * 4) }))
        .filter((card) => card.cantidad > 0));
      setMensajeDescarte(t('burnDone', { count: datos.sobres_creados, s: datos.sobres_creados === 1 ? '' : 's' }));
      setSeleccionDescarte({});
      consultarSobres();
    } catch (e) {
      setMensajeDescarte(e.message);
    } finally {
      setProcesandoDescarte(false);
    }
  };

  const seleccionarTipoSobre = (tipo) => {
    const disponibles = sobresDisponibles[tipo];
    if (disponibles === null) {
      setError(t('packsChecking'));
      return;
    }
    if (disponibles < 1) {
      setError(t('noPacksLeft', { type: tipo }));
      return;
    }
    setTipoSobreActivo(tipo);
    setFase('PRE_APERTURA');
    setCartasCargadas([]);
    setError('');
  };

  // Pide al backend que abra un sobre de verdad: descuenta uno del inventario,
  // sortea 5 cartas segun las probabilidades y las guarda en el album.
  const abrirSobreEnBackend = async () => {
    setAbriendo(true);
    setError('');
    try {
      // Django exige un token para las peticiones que envian datos
      const resToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();

      const res = await fetch(`${apiBaseUrl}/cards/sobres/abrir/${tipoSobreActivo}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(datos.error || datos.detail || t('packOpenError'));
        return false;
      }

      setCartasCargadas((datos.cartas || []).map(adaptarCarta));
      // El backend nos dice cuantos le quedan tras abrir este
      if (typeof datos.sobres_restantes === 'number') {
        setSobresDisponibles((actual) => ({ ...actual, [tipoSobreActivo]: datos.sobres_restantes }));
      }
      return true;
    } catch (e) {
      console.error('Error al abrir el sobre:', e);
      setError(t('serverConnectionError'));
      return false;
    } finally {
      setAbriendo(false);
    }
  };

  // Array de control: registra qué carta está bocarriba (true) o bocabajo (false)
  const [cartasVolteadas, setCartasVolteadas] = useState([false, false, false, false, false]);

  const clickVolver = () => {
    navigate('/catalogo');
  };

  // La escena 3D llama a esta función cuando la tira termina de rasgarse.
  const tocarSobre = async () => {
    if (abriendo) return; // evita abrir dos veces si se hace doble clic

    // 🔒 Si no le quedan sobres, ni siquiera empieza a romperse: seria abrir un
    // regalo para encontrarlo vacio.
    if (sobresDisponibles[tipoSobreActivo] !== null && sobresDisponibles[tipoSobreActivo] < 1) {
      setError(t('noPacksLeft', { type: tipoSobreActivo }));
      return;
    }

    const haIdoBien = await abrirSobreEnBackend();
    if (!haIdoBien) {
      return;
    }

    setCartasVolteadas([false, false, false, false, false]); // todas bocabajo
    setFase('REVELADO');
  };

  const resetearFases = () => {
    setFase('SELECCION');
    setCartasCargadas([]);
  };

  const cancelarApertura = () => {
    if (abriendo) return;
    setError('');
    setCartasCargadas([]);
    setFase('SELECCION');
  };

  // Asigna colores, bordes y sombras dinámicas según la rareza/categoría
  // Orden de exclusividad: Junior < Senior < Transcender < Legendario < Staff
  // ⚠️ Nacho, 18/09: los COLORES vuelven a salir de styles.css.
  //
  // Konrad los había escrito a mano aquí, y tres de los cinco no coincidían
  // con los del resto de la web: la misma carta salía dorada al abrir el
  // sobre y ámbar en el catálogo, y el Staff rosa neón aquí y magenta allí.
  //
  // Es el mismo fallo que está contado en rarezas.js: el mismo dato en
  // varios sitios se queda viejo a trozos y sin dar ningún error. Con
  // var(--rarity-*) basta con tocar styles.css y cambia en todas partes.
  //
  // Los RGBA del brillo sí van a mano, porque box-shadow no puede sacar la
  // transparencia de una variable sin color-mix(), y color-mix() es
  // reciente y nos evalúan en Firefox. Cada uno es su var de al lado:
  //     common #94a3b8 · rare #0284c7 · epic #a855f7
  //     legendary #d97706 · staff #ec4899
  // Si algún día se cambia un color, hay que cambiar también su rgba.
  // const obtenerEstiloRareza = (rareza) => {
  //   switch (rareza) {
  //     case 'creator': // La más exclusiva (Verde Esmeralda Radiante / Neón)
  //       return {
  //         color: 'var(--rarity-creator)',
  //         background: 'var(--rarity-creator-bg)',
  //         border: '3px solid var(--rarity-creator)',
  //         shadow: '0 0 30px rgba(0, 255, 135, 0.8), 0 0 10px rgba(96, 239, 255, 0.5)'
  //       };
  //     case 'staff': // 5. La más exclusiva
  //       return {
  //         color: 'var(--rarity-staff)',
  //         background: 'var(--rarity-staff-bg)',
  //         border: '3px solid var(--rarity-staff)',
  //         shadow: '0 0 30px rgba(236, 72, 153, 0.8), 0 0 10px rgba(236, 72, 153, 0.5)'
  //       };
  //     case 'legendary': // 4. Legendario
  //       return {
  //         color: 'var(--rarity-legendary)',
  //         background: 'var(--rarity-legendary-bg)',
  //         border: '3px solid var(--rarity-legendary)',
  //         shadow: '0 0 25px rgba(217, 119, 6, 0.7)'
  //       };
  //     case 'epic': // 3. Transcender
  //       return {
  //         color: 'var(--rarity-epic)',
  //         background: 'var(--rarity-epic-bg)',
  //         border: '3px solid var(--rarity-epic)',
  //         shadow: '0 0 20px rgba(168, 85, 247, 0.6)'
  //       };
  //     case 'rare': // 2. Senior
  //       return {
  //         color: 'var(--rarity-rare)',
  //         background: 'var(--rarity-rare-bg)',
  //         border: '3px solid var(--rarity-rare)',
  //         shadow: '0 0 15px rgba(2, 132, 199, 0.5)'
  //       };
  //     case 'common': // 1. Junior
  //     default:
  //       return {
  //         color: 'var(--rarity-common)',
  //         background: 'var(--rarity-common-bg)',
  //         border: '2px solid var(--rarity-common)',
  //         shadow: '0 0 10px rgba(148, 163, 184, 0.3)'
  //       };
  //   }
  // };


  //FC
  const renderBotonVolver = () => {
    return (
      <button
        onClick={clickVolver}
        className="back-btn-link floating-pack-back-button"
        style={{
          padding: '0.8rem 1.5rem',
          fontSize: '1.2rem',
          cursor: 'pointer',
          borderRadius: '50px',
          backgroundColor: 'var(--surface-raised)',
          color: '#fff',
          border: '2px solid #ff9ffc',
          boxShadow: '0 0 10px rgba(255,159,252,0.3)'
        }}
      >
        {t('backToCatalog')}
      </button>
    );
  };

  //FC
  const Sobrepreeapertura = () => {
    return (
      <div className="apertura-stage">
        {/* ⚠️ El aviso va ARRIBA del sobre: el sobre mide 800px y cualquier cosa
            que se ponga debajo se queda fuera de la pantalla y no se ve. */}
        {error && (
          // Aviso del sistema de diseño (ui.jsx): los colores y el role="alert"
          // para lectores de pantalla los pone él. Aquí solo se mantiene la
          // posición fija arriba, que es lo que este caso necesita.
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
          onOpen={tocarSobre}
          onProgress={() => { }}
        />

        <button
          type="button"
          className="cancel-pack-button"
          onClick={cancelarApertura}
          disabled={abriendo}
        >
          {t('backToChoosePack')}
        </button>

      </div>
    );
  };

  // COMPONENTE: REPARTIENDO CARTAS DESDE EL CENTRO
  //FC
  const PantallaCincoCartas = () => {

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
          width: '95vw'
        }}
      >
        {/* Fila horizontal que posiciona las 5 cartas juntas una al lado de la otra */}
        <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
          {cartasCargadas.map((carta, index) => {
            const rareza = rareza[carta.rareza];
            const estaVolteada = cartasVolteadas[index];

            return (
              <RepartoNaipes>
                {/* Contenedor animable en 3D de Framer Motion */}
                <VoltearNaipe >
                  {/* CARA A (BOCABAJO): Reverso adaptado con el color de su categoría */}
                  <NaipeCaraA rareza={rareza} />
                  {/* CARA B (BOCARRIBA): Datos reales de la carta */}
                  <NaipeCaraB rareza={rareza} />
                </VoltearNaipe>
              </RepartoNaipes>
            );
          })}
        </div>

        {/* Solo aparece si el usuario ha revelado las 5 cartas */}
        {cartasVolteadas.every(Boolean) && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={resetearFases}
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
              textAlign: 'center'
            }}
          >
            {t('exitOpening')}
          </motion.button>
        )}
      </div>
    );
  };

  const PaginaTiendaSobres = () => {
    return (
      <main className={`app-container tienda-sobres-app ${fase !== 'SELECCION' ? 'modo-apertura' : ''}`} style={{ position: 'relative', minHeight: '100vh', padding: fase === 'SELECCION' ? '2rem' : 0, overflowX: 'hidden' }}>
        {fase === 'SELECCION' && <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
          <FondoTiendaSobres
            topColor="#5227FF"
            bottomColor="#FF9FFC"
            intensity={0.7}
            rotationSpeed={0.5}
            glowAmount={0.002}
            pillarWidth={18}
            pillarHeight={3}
            noiseIntensity={0.5}
            pillarRotation={25}
            interactive={false}
            mixBlendMode="screen"
            quality="high"
          />
        </div>}

        {/** {fase === 'SELECCION' && <VolverButton/>} */}
        {fase === 'SELECCION' && renderBotonVolver()}

        {/** {fase === 'SELECCION' && <ErrorAlert/>} */}
        {fase === 'SELECCION' && error && (
          <Alert tone="error" style={{ position: 'relative', zIndex: 3, maxWidth: '620px', margin: '1rem auto' }}>
            {error}
          </Alert>
        )}

        {/** {fase === 'SELECCION' && <CrearSobre props/>} */}
        {fase === 'SELECCION' && <section className="control-panel" style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '4rem auto 2rem' }} aria-labelledby="crear-sobres-titulo">
          <div className="grid-meta">
            <TituloSeccion id="crear-sobres-titulo">{t('getPacksWithDuplicates')}</TituloSeccion> //TODO: Revisar el renderizado
            <span style={subtituloSeccion}>{t('burn4KeepOne')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {SOBRES.map((sobre) => (
              <button key={sobre.id} type="button" className={`pack-option pack-option-${sobre.id}`} onClick={() => abrirSelectorSobre(sobre)} style={{ '--pack-color': sobre.color }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <IconoSobre /> {sobre.nombre}
                </span>
                {/* Qué hay que quemar para llevarse ESTE sobre. Sin esto, el
                    recuadro dice lo que te dan pero no lo que cuesta, y no hay
                    forma de saber que 4 Transcender dan un sobre legendario
                    hasta que abres el modal. */}
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  opacity: 0.85,
                  textAlign: 'center',
                  lineHeight: 1.35,
                }}>
                  {t('burnsDuplicatesOf')}<br />
                  {sobre.rarezas.join(' o ')}
                </span>
              </button>
            ))}
          </div>
        </section>}

        {/** {sobreSeleccionado && <SeleccionarSobre props/>} */}
        {sobreSeleccionado && (
          <Modal onClose={() => !procesandoDescarte && setSobreSeleccionado(null)} labelledBy="selector-sobre-titulo" className="discard-modal">
            <div className="discard-modal-header">
              <div>
                <span className="discard-modal-kicker">{t('duplicatesExchange')}</span>
                <h2 id="selector-sobre-titulo">{sobreSeleccionado.nombre}</h2>
              </div>
              <button type="button" className="discard-modal-close" onClick={() => setSobreSeleccionado(null)} aria-label={t('closeSelector')} disabled={procesandoDescarte}>×</button>
            </div>
            <p className="discard-modal-intro">{t('discardIntro')}</p>
            <div className="discard-card-list">
              {/* ⚠️ Nacho, 10/09: era `>= 4`, y con 4 copias justas la pantalla
                  te dejaba elegirla pero el servidor la rechazaba. Ahora hacen
                  falta 5, porque quemar 4 te dejaria SIN esa carta en el album
                  y eso no lo queremos. Mismo criterio que los contratos. */}
              {album.filter((card) => sobreSeleccionado.rarezas.includes(card.tier) && card.cantidad >= 5).map((card) => {
                // Las copias que puedes quemar son todas menos una: la ultima
                // se queda siempre para no perder la carta.
                const maxGrupos = Math.floor((card.cantidad - 1) / 4);
                const grupos = seleccionDescarte[card.cardId] || 0;
                return (
                  <div key={card.cardId} className="discard-card-row" style={{ '--discard-color': sobreSeleccionado.color }}>
                    <div className="discard-card-info">
                      <strong>{card.login}</strong>
                      <span>{card.cantidad} copias</span>
                    </div>
                    <div className="discard-stepper" role="group" aria-label={t('burnGroupsOf', { login: card.login })}>
                      <button type="button" onClick={() => cambiarGruposSeleccionados(card.cardId, grupos - 1)} disabled={grupos === 0 || procesandoDescarte} aria-label={t('burnRemoveGroupOf', { login: card.login })}>−</button>
                      <span aria-live="polite"><strong>{grupos}</strong><small>{' ' + t('groupsWord', { s: grupos === 1 ? '' : 's' })}</small></span>
                      <button type="button" onClick={() => cambiarGruposSeleccionados(card.cardId, grupos + 1)} disabled={grupos === maxGrupos || procesandoDescarte} aria-label={t('burnAddGroupOf', { login: card.login })}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {album.filter((card) => sobreSeleccionado.rarezas.includes(card.tier) && card.cantidad >= 5).length === 0 && (
              <p className="discard-empty">{t('discardEmpty')}</p>
            )}
            {mensajeDescarte && <p role="status">{mensajeDescarte}</p>}
            <div className="discard-modal-actions">
              <button type="button" className="discard-cancel-button" onClick={() => setSobreSeleccionado(null)} disabled={procesandoDescarte}>{t('cancel')}</button>
              <button type="button" className="discard-confirm-button" onClick={confirmarDescarte} disabled={procesandoDescarte || !Object.keys(seleccionDescarte).length}>
                {procesandoDescarte ? t('burning') : t('confirmAndBurn')}
              </button>
            </div>
          </Modal>
        )}

        {/** {fase === 'SELECCION' && <AbrirSobre props/>} */}
        {fase === 'SELECCION' && <section className="control-panel" style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '2rem auto' }} aria-labelledby="abrir-sobres-titulo">
          <div className="grid-meta">
            <h2 id="abrir-sobres-titulo" style={tituloSeccion}>{t('availablePacks')}</h2>
            <SubtituloSeccion>{t('choosePackQuality')}</SubtituloSeccion> //TODO: revisar el renderizado
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {SOBRES.map((sobre) => {
              const tipo = sobre.backendType || sobre.id;
              const cuantos = sobresDisponibles[tipo];
              return (
                <button key={sobre.id} type="button" className={`pack-option pack-option-${sobre.id} ${tipoSobreActivo === tipo ? 'is-selected' : ''}`} onClick={() => seleccionarTipoSobre(tipo)} style={{ '--pack-color': sobre.color }}>
                  <IconoSobre /> {sobre.nombre}
                  {/* Solo el número: la palabra "disponibles" ya la dice el
                      título de la sección, repetirla en cada recuadro sobra. */}
                  <span style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                    {cuantos ?? '…'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>}

        {/** {fase === 'SELECCION' && <PreaperturaSobre props/>} */}
        {fase === 'PRE_APERTURA' && Sobrepreeapertura()}

        {/** {fase === 'SELECCION' && <ManoCartas props/>} */}
        {fase === 'REVELADO' && PantallaCincoCartas()}
      </main>
    );
  };

  return PaginaTiendaSobres();
}

export default TiendaSobres;

/**
 * const componenteConSuLogicaDeRender = (sobreSeleccionado) => sobreSeleccionado && <SeleccionarSobre props/>
 *  
 * fase === 'SELECCION' && ((componenteConSuLogicaDeRender) => (
 * <VolverBtn/>
 * error && <ErrorAlert/>
 * componenteConSuLogicaDeRender -> se mete en su lugar del layout en cada fase
 * <SeleccionarSobre props/>
 * <AbrirSobre props/>
 * ))
 * 
 * fase === 'PRE_APERTURA' && (componenteConSuLogicaDeRender) => (
 * componenteConSuLogicaDeRender -> se mete en su lugar del layout en cada fase
 * <PreaperturaSobre props/>}
 * )
 * 
 * fase === 'REVELADO' && (componenteConSuLogicaDeRender) => (
 * componenteConSuLogicaDeRender -> se mete en su lugar del layout en cada fase
 * <ManoCartas props/>
 * )
 */