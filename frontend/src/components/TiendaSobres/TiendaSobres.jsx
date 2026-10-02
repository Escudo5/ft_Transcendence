import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FondoTiendaSobres from './FondoTiendaSobres';
import { Alert } from '../ui';
import { CLASE_RAREZA } from '../rarezas';
import { useI18n } from '../../i18n';

// Componentes extraídos
import { BotonVolver } from './TiendaSobresComponents/BotonVolver';
import { CrearSobreSeccion } from './TiendaSobresComponents/CrearSobreSeccion';
import { ModalDescarteSobre } from './TiendaSobresComponents/ModalDescarteSobre';
import { AbrirSobreSeccion } from './TiendaSobresComponents/AbrirSobreSeccion';
import { SobrePreapertura } from './TiendaSobresComponents/SobrePreapertura';
import { PantallaCincoCartas } from './TiendaSobresComponents/PantallaCincoCartas';

function TiendaSobres() {
  const { t: traduccion } = useI18n();
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
  const [cartasVolteadas, setCartasVolteadas] = useState([false, false, false, false, false]);

  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const SOBRES = [
    { id: 'comun', nombre: traduccion('packCommon'), rarezas: ['Junior'], color: 'var(--rarity-common)' },
    { id: 'raro', nombre: traduccion('packRare'), rarezas: ['Senior'], color: 'var(--rarity-rare)' },
    { id: 'legendario', backendType: 'epico', nombre: traduccion('packLegendary'), rarezas: ['Transcender', 'Legendario', 'Staff', 'Creator'], color: 'var(--rarity-legendary)' },
  ];

  const TIER_A_RAREZA = CLASE_RAREZA;

  const adaptarCarta = (cartaRaw) => ({
    login: cartaRaw.login,
    nombre: cartaRaw.title || cartaRaw.login,
    foto: cartaRaw.photo,
    tier: cartaRaw.tier,
    rareza: TIER_A_RAREZA[cartaRaw.tier] || 'common',
  });

  useEffect(() => {
    async function cargarAlbum() {
      try {
        const respuesta = await fetch(`${apiBaseUrl}/cards/album/`, { credentials: 'include' });
        if (!respuesta.ok) return;
        const datos = await respuesta.json();
        setAlbum((datos || []).map((elemento) => ({
          cardId: elemento.card?.id,
          cantidad: elemento.cantidad ?? 1,
          login: elemento.card?.login || '',
          tier: elemento.card?.tier || 'Junior',
        })));
      } catch (errorCapturado) {
        console.error('No se pudo cargar el álbum para crear sobres:', errorCapturado);
      }
    }
    cargarAlbum();
  }, [apiBaseUrl]);

  const consultarSobres = async () => {
    try {
      const respuesta = await fetch(`${apiBaseUrl}/cards/sobres/`, { credentials: 'include' });
      if (!respuesta.ok) return;
      const datos = await respuesta.json();
      setSobresDisponibles({
        comun: datos.sobres?.comun ?? 0,
        raro: datos.sobres?.raro ?? 0,
        epico: datos.sobres?.epico ?? 0,
      });
    } catch (errorCapturado) {
      console.error('No se pudo consultar el inventario de sobres:', errorCapturado);
    }
  };

  useEffect(() => {
    consultarSobres();
  }, []);

  const abrirSelectorSobre = useCallback((sobre) => {
    setMensajeDescarte('');
    setSeleccionDescarte({});
    setSobreSeleccionado(sobre);
  }, []);

  const cambiarGruposSeleccionados = useCallback((cardId, grupos) => {
    setSeleccionDescarte((estadoActual) => {
      const siguienteEstado = { ...estadoActual };
      if (grupos > 0) siguienteEstado[cardId] = grupos;
      else delete siguienteEstado[cardId];
      return siguienteEstado;
    });
  }, []);

  const confirmarDescarte = async () => {
    const cartas = Object.entries(seleccionDescarte).map(([carta, grupos]) => ({ carta, grupos }));
    if (!cartas.length) return;
    if (!window.confirm(traduccion('burnConfirm'))) return;

    setProcesandoDescarte(true);
    setMensajeDescarte('');
    try {
      const respuestaToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await respuestaToken.json();
      const respuesta = await fetch(`${apiBaseUrl}/cards/descartar/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ tipo_sobre: sobreSeleccionado.backendType || sobreSeleccionado.id, cartas }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.detail || datos.error || traduccion('burnError'));

      setAlbum((estadoActual) =>
        estadoActual
          .map((carta) => ({ ...carta, cantidad: carta.cantidad - ((seleccionDescarte[carta.cardId] || 0) * 4) }))
          .filter((carta) => carta.cantidad > 0)
      );
      setMensajeDescarte(traduccion('burnDone', { count: datos.sobres_creados, s: datos.sobres_creados === 1 ? '' : 's' }));
      setSeleccionDescarte({});
      consultarSobres();
    } catch (errorCapturado) {
      setMensajeDescarte(errorCapturado.message);
    } finally {
      setProcesandoDescarte(false);
    }
  };

  const seleccionarTipoSobre = (tipo) => {
    const disponibles = sobresDisponibles[tipo];
    if (disponibles === null) {
      setError(traduccion('packsChecking'));
      return;
    }
    if (disponibles < 1) {
      setError(traduccion('noPacksLeft', { type: tipo }));
      return;
    }
    setTipoSobreActivo(tipo);
    setFase('PRE_APERTURA');
    setCartasCargadas([]);
    setError('');
  };

  const abrirSobreEnBackend = async () => {
    setAbriendo(true);
    setError('');
    try {
      const respuestaToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await respuestaToken.json();

      const respuesta = await fetch(`${apiBaseUrl}/cards/sobres/abrir/${tipoSobreActivo}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      });
      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setError(datos.error || datos.detail || traduccion('packOpenError'));
        return false;
      }

      setCartasCargadas((datos.cartas || []).map(adaptarCarta));
      if (typeof datos.sobres_restantes === 'number') {
        setSobresDisponibles((estadoActual) => ({ ...estadoActual, [tipoSobreActivo]: datos.sobres_restantes }));
      }
      return true;
    } catch (errorCapturado) {
      console.error('Error al abrir el sobre:', errorCapturado);
      setError(traduccion('serverConnectionError'));
      return false;
    } finally {
      setAbriendo(false);
    }
  };

  const clickVolver = () => {
    navigate('/catalogo');
  };

  const tocarSobre = async () => {
    if (abriendo) return;

    if (sobresDisponibles[tipoSobreActivo] !== null && sobresDisponibles[tipoSobreActivo] < 1) {
      setError(traduccion('noPacksLeft', { type: tipoSobreActivo }));
      return;
    }

    const haIdoBien = await abrirSobreEnBackend();
    if (!haIdoBien) return;

    setCartasVolteadas([false, false, false, false, false]);
    setFase('REVELADO');
  };

  const voltearCarta = (indice) => {
    if (cartasVolteadas[indice]) return;
    const nuevoEstado = [...cartasVolteadas];
    nuevoEstado[indice] = true;
    setCartasVolteadas(nuevoEstado);
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

  return (
    <main
      className={`app-container tienda-sobres-app ${fase !== 'SELECCION' ? 'modo-apertura' : ''}`}
      style={{
        position: 'relative',
        minHeight: '100vh',
        padding: fase === 'SELECCION' ? '2rem' : 0,
        overflowX: 'hidden',
      }}
    >
      {/* Fondo solo en SELECCION */}
      {fase === 'SELECCION' && (
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
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
        </div>
      )}

      {/* FASE SELECCIÓN */}
      {fase === 'SELECCION' && (
        <>
          <BotonVolver alHacerClic={clickVolver} texto={traduccion('backToCatalog')} />

          {error && (
            <Alert tone="error" style={{ position: 'relative', zIndex: 3, maxWidth: '620px', margin: '1rem auto' }}>
              {error}
            </Alert>
          )}

          <CrearSobreSeccion
            listaSobres={SOBRES}
            alSeleccionarSobre={abrirSelectorSobre}
            traduccion={traduccion}
          />

          <AbrirSobreSeccion
            listaSobres={SOBRES}
            sobresDisponibles={sobresDisponibles}
            tipoSobreActivo={tipoSobreActivo}
            alSeleccionarTipo={seleccionarTipoSobre}
            traduccion={traduccion}
          />
        </>
      )}

      {/* MODAL DE DESCARTE / SOBRE SELECCIONADO */}
      <ModalDescarteSobre
        sobreSeleccionado={sobreSeleccionado}
        album={album}
        seleccionDescarte={seleccionDescarte}
        procesandoDescarte={procesandoDescarte}
        mensajeDescarte={mensajeDescarte}
        alCerrar={() => setSobreSeleccionado(null)}
        alCambiarGrupos={cambiarGruposSeleccionados}
        alConfirmarDescarte={confirmarDescarte}
        traduccion={traduccion}
      />

      {/* FASE PRE_APERTURA */}
      {fase === 'PRE_APERTURA' && (
        <SobrePreapertura
          error={error}
          tipoSobreActivo={tipoSobreActivo}
          alTocarSobre={tocarSobre}
          alCancelarApertura={cancelarApertura}
          estaAbriendo={abriendo}
          traduccion={traduccion}
        />
      )}

      {/* FASE REVELADO */}
      {fase === 'REVELADO' && (
        <PantallaCincoCartas
          cartasCargadas={cartasCargadas}
          cartasVolteadas={cartasVolteadas}
          alVoltearCarta={voltearCarta}
          alResetearFases={resetearFases}
          traduccion={traduccion}
        />
      )}
    </main>
  );
}

export default TiendaSobres;