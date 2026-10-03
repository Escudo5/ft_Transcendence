import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Card } from './ui';
import { useI18n } from '../i18n';

// Componentes modularizados de la carpeta PerfilComponents
import PerfilHeader from './PerfilComponents/PerfilHeader';
import CabeceraPerfil from './PerfilComponents/CabeceraPerfil';
import ColeccionPerfil from './PerfilComponents/ColeccionPerfil';
import LogrosPerfil from './PerfilComponents/LogrosPerfil';
import SeccionAjustesCuenta from './PerfilComponents/SeccionAjustesCuenta';
import ModalCerrarSesion from './PerfilComponents/ModalCerrarSesion';
import ClavesApi from './ClavesApi';

// Custom Hook de carga de datos
function usePerfilData(login, apiBaseUrl) {
  const { t: traduccion } = useI18n();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    async function cargarPerfil() {
      setCargando(true);
      setError('');
      try {
        let usuarioSolicitado = login;
        if (!usuarioSolicitado) {
          const respuestaYo = await fetch(`${apiBaseUrl}/users/me/`, { credentials: 'include' });
          if (!respuestaYo.ok) {
            setError(traduccion('profileLoginRequired'));
            return;
          }
          usuarioSolicitado = (await respuestaYo.json()).username;
        }

        const respuesta = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(usuarioSolicitado)}/`, { credentials: 'include' });
        if (respuesta.status === 404) {
          setError(traduccion('profileNoSuchUser', { user: usuarioSolicitado }));
          return;
        }
        if (!respuesta.ok) {
          setError(traduccion('profileLoadError'));
          return;
        }

        const datos = await respuesta.json();
        setPerfil(datos);
      } catch (errorCapturado) {
        console.error('Error al cargar perfil:', errorCapturado);
        setError(traduccion('serverError'));
      } finally {
        setCargando(false);
      }
    }
    cargarPerfil();
  }, [login, apiBaseUrl, traduccion]);

  return { perfil, setPerfil, cargando, error, setError, aviso, setAviso };
}

export default function Perfil() {
  const { t: traduccion } = useI18n();
  const { login } = useParams();
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const { perfil, setPerfil, cargando, error, aviso, setAviso } = usePerfilData(login, apiBaseUrl);
  const [confirmarLogout, setConfirmarLogout] = useState(false);

  return (
    <main className="app-container">
      <PerfilHeader />

      {cargando ? (
        <Card>{traduccion('profileLoading')}</Card>
      ) : error ? (
        <Card><Alert tone="error">{error}</Alert></Card>
      ) : (
        <>
          {aviso && <Alert tone={aviso.ok ? 'success' : 'error'}>{aviso.texto}</Alert>}

          <CabeceraPerfil 
            perfil={perfil} 
            setPerfil={setPerfil} 
            setAviso={setAviso} 
            apiBaseUrl={apiBaseUrl} 
          />

          <ColeccionPerfil 
            coleccion={perfil.coleccion} 
            puntos={perfil.puntos} 
            esMiPerfil={perfil.es_mi_perfil} 
          />

          <LogrosPerfil logros={perfil.logros} />

          {perfil.es_mi_perfil && <ClavesApi />}

          {perfil.es_mi_perfil && (
            <SeccionAjustesCuenta
              apiBaseUrl={apiBaseUrl} 
              setAviso={setAviso} 
              onAbrirLogoutModal={() => setConfirmarLogout(true)} 
            />
          )}

          <ModalCerrarSesion 
            visible={confirmarLogout} 
            onCancelar={() => setConfirmarLogout(false)} 
            apiBaseUrl={apiBaseUrl} 
          />
        </>
      )}
    </main>
  );
}