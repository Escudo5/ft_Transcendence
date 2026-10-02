import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { RankingHeader } from './RankingComponents/RankingHeader';
import { ListaClasificacion } from './RankingComponents/ListaClasificacion';

export default function Ranking() {
  const { t: traduccion, languageInfo } = useI18n();
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const formateadorNumeros = new Intl.NumberFormat(languageInfo.locale);

  useEffect(() => {
    async function cargarRanking() {
      try {
        const respuesta = await fetch(`${apiBaseUrl}/cards/ranking/`, { credentials: 'include' });
        
        if (respuesta.status === 401 || respuesta.status === 403) {
          setError(traduccion('rankingLoginRequired'));
          return;
        }
        if (!respuesta.ok) {
          setError(traduccion('rankingLoadError'));
          return;
        }

        const datosRespuesta = await respuesta.json();
        setDatos(datosRespuesta);
      } catch (errorCapturado) {
        console.error('Error al cargar el ranking:', errorCapturado);
        setError(traduccion('serverError'));
      } finally {
        setCargando(false);
      }
    }

    cargarRanking();
  }, [apiBaseUrl, traduccion]);

  return (
    <main className="app-container">
      <RankingHeader
        traduccion={traduccion}
        cartasEnCatalogo={datos?.cartas_en_catalogo}
      />

      <ListaClasificacion
        cargando={cargando}
        error={error}
        clasificacion={datos?.clasificacion}
        formateador={formateadorNumeros}
        traduccion={traduccion}
      />
    </main>
  );
}