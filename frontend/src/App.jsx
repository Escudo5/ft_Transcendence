import { useEffect, useRef, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import DotField from "./components/Componentes/Fondo_animado";
import Acceso from './components/Acceso';
import RegaloDiario from './components/RegaloDiario';
import Home from './components/Home';
import Catalogo from './components/Album/Catalogo';
import Perfil from './components/Perfil/Perfil';
import Ranking from './components/Clasificacion/Ranking';
import Legal from './components/Legal';
import PieLegal from './components/PieLegal';
import TiendaSobres from './components/TiendaSobres/TiendaSobres';
import ChatSocial from './components/ChatSocial/ChatSocial';
import { I18nProvider, LanguageSelector, useI18n } from './i18n';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/home" replace />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/catalogo",
    element: <Catalogo />,
  },
  {
    path: "/chatsocial",
    element: <ChatSocial />,
  },
  {
    path: "/tienda-sobre",
    element: <TiendaSobres />,
  },
  {
    // Tu propio perfil
    path: "/perfil",
    element: <Perfil />,
  },
  {
    // El perfil de otra persona (desde el chat, los amigos o el buscador)
    path: "/perfil/:login",
    element: <Perfil />,
  },
  {
    // 🏆 Clasificación de coleccionistas
    path: "/ranking",
    element: <Ranking />,
  },
  {
    // ⚖️ Páginas legales: obligatorias en el subject y accesibles SIN sesión
    path: "/privacidad",
    element: <Legal tipo="privacidad" />,
  },
  {
    path: "/terminos",
    element: <Legal tipo="terminos" />,
  },
  {
    // Cualquier dirección que no exista vuelve a la portada, en vez de la
    // página de error de React Router y sus errores en la consola
    path: "*",
    element: <Navigate to="/home" replace />,
  },
]);

// Direcciones que se pueden ver sin haber iniciado sesión. Las legales tienen
// que estar aquí: una política de privacidad que solo puedes leer después de
// registrarte no sirve de nada (y el subject pide que sean accesibles).
const RUTAS_PUBLICAS = ["/privacidad", "/terminos"];

function AppContent() {
  const { t } = useI18n();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Corregido: sin la barra '/' al final para coincidir 1:1 con el .env de Django y la Intra
  const redirectUri = window.location.origin;
  const URL_LOGIN_42 = `https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-85745739c040c37d065eeef72dafbd19dea1e46b50172daac4f20c1907d34b47&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=public`;
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const codeYaProcesado = useRef(false);

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // 🟢 CASO 1: Viene de 42 con código de autorización
      if (!codeYaProcesado.current) {
        codeYaProcesado.current = true;

        fetch(`${apiBaseUrl}/users/auth/callback/?code=${code}`, { credentials: 'include' })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error servidor HTTP ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            if (data.error) {
              alert(t('login42Error', { error: data.error }));
              setIsAuthenticated(false);
            } else {
              // 🧹 Limpiamos el ?code= de la URL para evitar errores al recargar
              window.history.replaceState({}, document.title, window.location.pathname);
              setIsAuthenticated(true);
              // data.mensaje lo manda Django y viene en español: ver la nota
              // de i18n.jsx sobre los errores del backend.
              alert(`${data.mensaje}\n` + t('packsAvailableToday', { count: data.sobres_disponibles_hoy }));
            }
          })
          .catch((error) => {
            console.error('Error al hablar con el backend:', error);
            alert(t('authIntraError'));
            setIsAuthenticated(false);
          })
          .finally(() => setLoading(false));
      }
    } else {
      // 🔵 CASO 2: Entrada directa sin código -> Verificamos si Django tiene sesión guardada
      // /sesion/ y no /me/: contesta 200 aunque no haya sesión, así la
      // pantalla de acceso no deja un 401 en rojo en la consola
      fetch(`${apiBaseUrl}/users/sesion/`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : { autenticado: false }))
        .then((datos) => {
          // Si no hay sesión ya no expulsamos a la Intra sin preguntar: mostramos
          // la pantalla de acceso para que elija entre entrar con 42 o con email
          setIsAuthenticated(datos.autenticado === true);
        })
        .catch(() => setIsAuthenticated(false))
        .finally(() => setLoading(false));
    }
  }, []);

  // Si se cierra la sesión en otro navegador, este se entera solo y vuelve a
  // la pantalla de acceso: lo pregunta cada 30 segundos y al volver a la pestaña.
  useEffect(() => {
    if (!isAuthenticated) return;

    async function seguimosDentro() {
      try {
        const res = await fetch(`${apiBaseUrl}/users/sesion/`, { credentials: 'include' });
        if (!res.ok) return;
        const datos = await res.json();
        if (datos.autenticado === false) setIsAuthenticated(false);
      } catch {
        // Sin conexión no se sabe si hay sesión: no se echa a nadie por eso
      }
    }

    const alVolver = () => {
      if (document.visibilityState === 'visible') seguimosDentro();
    };
    const reloj = setInterval(seguimosDentro, 30000);
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(reloj);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [isAuthenticated, apiBaseUrl]);

  if (loading) {
    return (
      <>
        <LanguageSelector />
        <main className="session-loading" aria-live="polite">
          <h2>{t('checkingSession')}</h2>
        </main>
      </>
    );
  }

  // 🚪 Sin sesión: pantalla de acceso (entrar con 42 o con email y contraseña).
  // Al entrar correctamente, el backend ya ha dejado la sesión abierta, así que
  // solo hay que dar paso a la aplicación.
  // Las páginas legales se ven aunque no haya sesión: son obligatorias y
  // cualquiera tiene que poder leerlas antes de decidir si se registra.
  const enRutaPublica = RUTAS_PUBLICAS.includes(window.location.pathname);

  if (!isAuthenticated && !enRutaPublica) {
    return (
      <MotionConfig reducedMotion="user">
        <LanguageSelector />
        <DotField style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }} />
        <Acceso
          apiBaseUrl={apiBaseUrl}
          urlLogin42={URL_LOGIN_42}
          onAutenticado={(datos) => {
            // datos.mensaje lo manda Django y viene en español: ver la nota
            // de i18n.jsx sobre los errores del backend.
            alert(`${datos.mensaje}\n` + t('packsAvailableToday', { count: datos.sobres_disponibles_hoy }));
            setIsAuthenticated(true);
          }}
        />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <LanguageSelector />
      <DotField style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }} />
      {/* 🎁 Flota por encima de todas las pantallas: el regalo debe poder
          recogerse estés donde estés, no solo en la portada. Solo con sesión:
          en las páginas legales sin sesión no sirve y preguntaba (401) */}
      {isAuthenticated && <RegaloDiario />}
      {/* ⚠️ `future` no es decorativo: sin él React Router escribe un warning en
          la consola en cada carga. Va aquí y no en createBrowserRouter porque
          en esta versión quien lee v7_startTransition es RouterProvider. */}
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </MotionConfig>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}