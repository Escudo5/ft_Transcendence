import { useState } from 'react';
import PieLegal from './PieLegal';
import { Alert, Button, Card, SecondaryButton, TextField } from './ui';
import { useI18n } from '../i18n';

/**
 * PANTALLA DE ACCESO
 * ------------------
 * Es lo primero que ve alguien que llega sin sesión abierta. Ofrece las dos
 * puertas de entrada de la aplicación:
 *
 *   1) Entrar con la cuenta de 42 (OAuth) -> te lleva a la Intra
 *   2) Entrar con email y contraseña     -> formularios de login y registro
 *
 * Las dos son independientes: quien entra por una nunca pasa por la otra.
 *
 * 🎨 NOTA PARA KONRAD Y SERGIO: los estilos usan las variables de styles.css
 * (--surface-raised, --accent, etc.), así que si cambiáis la paleta esta
 * pantalla cambia con el resto. Está hecha para que funcione; el diseño fino
 * es vuestro, cambiadlo sin miedo. La lógica vive en las funciones de arriba
 * y lo visual está todo en el objeto 'estilos'.
 */

// ==========================================================================
// ESTILOS (siguiendo las variables del proyecto)
// ==========================================================================
const estilos = {
  pantalla: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    fontFamily: 'var(--font-body)',
  },
  tarjeta: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  titulo: {
    fontFamily: 'var(--font-heading)',
    fontSize: '2rem',
    fontWeight: 800,
    textAlign: 'center',
    margin: 0,
    color: 'var(--accent)',
    letterSpacing: 0,
  },
  subtitulo: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    textAlign: 'center',
    margin: '0.5rem 0 1.75rem',
  },
  etiqueta: {
    fontFamily: 'var(--font-heading)',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.4rem',
    display: 'block',
  },
  campo: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--surface-overlay)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    transition: 'background-color 160ms var(--ease-out), border-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out)',
  },
  campoConError: {
    borderColor: '#f87171',
  },
  grupo: {
    marginBottom: '1.1rem',
  },
  errorCampo: {
    color: '#f87171',
    fontSize: '0.82rem',
    marginTop: '0.35rem',
  },
  avisoGeneral: {
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.4)',
    color: '#fca5a5',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.88rem',
    marginBottom: '1.1rem',
  },
  botonPrincipal: {
    width: '100%',
    background: 'var(--accent)',
    color: '#0c0f16',
    border: 'none',
    borderRadius: '8px',
    minHeight: '44px',
    padding: '0.9rem',
    fontFamily: 'var(--font-heading)',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  botonSecundario: {
    width: '100%',
    background: 'var(--surface-overlay)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    minHeight: '44px',
    padding: '0.9rem',
    fontFamily: 'var(--font-heading)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.85rem',
  },
  enlace: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontFamily: 'var(--font-body)',
    padding: 0,
  },
  pie: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
  },
  separador: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1.5rem 0',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
  lineaSeparador: {
    flex: 1,
    height: '1px',
    background: 'var(--border-default)',
  },
};

// ==========================================================================
// VALIDACIONES DEL NAVEGADOR
// El backend las repite todas por su cuenta (nunca hay que fiarse de lo que
// llega del navegador), pero comprobarlas aquí evita viajes innecesarios y
// le da respuesta inmediata a la persona. El subject las pide en ambos lados.
// ==========================================================================
function validarRegistro({ nombre, email, password, password2 }, t) {
  const errores = {};
  if (!nombre.trim()) errores.nombre = t('enterName');
  if (!email.trim()) errores.email = t('enterEmail');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.email = t('invalidEmail');
  if (!password) errores.password = t('enterPassword');
  else if (password.length < 8) errores.password = t('minimumPassword');
  if (password && password2 !== password) errores.password2 = t('passwordsMismatch');
  return errores;
}

// ==========================================================================
// CAMPO DE FORMULARIO REUTILIZABLE
// ⚠️ Va FUERA del componente a propósito: si se define dentro, React lo trata
// como un componente nuevo en cada pulsación y el input pierde el foco a cada
// letra que escribes.
// ==========================================================================
function Campo({ id, etiqueta, tipo = 'text', valor, onChange, error, autoComplete }) {
  return (
    <TextField
      id={id}
      label={etiqueta}
      type={tipo}
      value={valor}
      onChange={onChange}
      autoComplete={autoComplete}
      error={error}
    />
  );
}

// ==========================================================================
// COMPONENTE
// ==========================================================================
function Acceso({ apiBaseUrl, urlLogin42, onAutenticado }) {
  const { t } = useI18n();
  // Qué se está viendo: la elección inicial, el login o el registro
  const [vista, setVista] = useState('elegir');
  const [enviando, setEnviando] = useState(false);
  const [avisoGeneral, setAvisoGeneral] = useState('');
  const [errores, setErrores] = useState({});
  const [datos, setDatos] = useState({ nombre: '', email: '', password: '', password2: '' });

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  const irA = (nuevaVista) => {
    setVista(nuevaVista);
    setErrores({});
    setAvisoGeneral('');
  };

  // Django protege las peticiones que envían datos: hay que pedirle un
  // "salvoconducto" (token CSRF) y mandárselo de vuelta en la cabecera.
  const pedirToken = async () => {
    const res = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
    const { csrfToken } = await res.json();
    return csrfToken;
  };

  const enviar = async (ruta, cuerpo) => {
    setEnviando(true);
    setErrores({});
    setAvisoGeneral('');
    try {
      const token = await pedirToken();
      const res = await fetch(`${apiBaseUrl}/users/${ruta}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
        body: JSON.stringify(cuerpo),
      });
      const respuesta = await res.json().catch(() => ({}));

      if (!res.ok) {
        // El backend nos dice qué campo concreto falla; si no, mensaje general
        if (respuesta.campos) setErrores(respuesta.campos);
        setAvisoGeneral(respuesta.campos ? '' : respuesta.error || t('unableToComplete'));
        return;
      }

      onAutenticado(respuesta);
    } catch (error) {
      console.error('Error al hablar con el backend:', error);
      setAvisoGeneral(t('serverConnectionError'));
    } finally {
      setEnviando(false);
    }
  };

  const enviarRegistro = (e) => {
    e.preventDefault();
    const fallos = validarRegistro(datos, t);
    if (Object.keys(fallos).length) return setErrores(fallos);
    enviar('register', { nombre: datos.nombre, email: datos.email, password: datos.password });
  };

  const enviarLogin = (e) => {
    e.preventDefault();
    if (!datos.email.trim() || !datos.password) {
      return setErrores({
        email: !datos.email.trim() ? t('enterEmail') : undefined,
        password: !datos.password ? t('enterPassword') : undefined,
      });
    }
    enviar('login', { email: datos.email, password: datos.password });
  };

  return (
    <div style={estilos.pantalla}>
      <Card className="acceso-card">
        <h1 style={estilos.titulo}>ft_transcendence</h1>
        <p style={estilos.subtitulo}>{t('albumOf42')}</p>

        {/* ---------- VISTA 1: elegir cómo entrar ---------- */}
        {vista === 'elegir' && (
          <>
            <Button
              type="button"
              onClick={() => { window.location.href = urlLogin42; }}
            >
              {t('loginWith42')}
            </Button>

            <div style={estilos.separador}>
              <span style={estilos.lineaSeparador} />{t('or')}<span style={estilos.lineaSeparador} />
            </div>

            <SecondaryButton type="button" onClick={() => irA('login')}>
              {t('loginWithEmail')}
            </SecondaryButton>

            <p style={estilos.pie}>
              {t('noAccount')}{' '}
              <button type="button" className="ui-link" onClick={() => irA('registro')}>
                {t('signUp')}
              </button>
            </p>
          </>
        )}

        {/* ---------- VISTA 2: iniciar sesión ---------- */}
        {vista === 'login' && (
          <form onSubmit={enviarLogin} noValidate>
            {avisoGeneral && <Alert>{avisoGeneral}</Alert>}

            <Campo id="email" etiqueta={t('email')} tipo="email" autoComplete="email"
                   valor={datos.email} onChange={cambiar('email')} error={errores.email} />
            <Campo id="password" etiqueta={t('password')} tipo="password" autoComplete="current-password"
                   valor={datos.password} onChange={cambiar('password')} error={errores.password} />

            <Button type="submit" disabled={enviando}>
              {enviando ? t('loggingIn') : t('login')}
            </Button>

            <p style={estilos.pie}>
              {t('noAccount')}{' '}
              <button type="button" className="ui-link" onClick={() => irA('registro')}>{t('signUp')}</button>
              <br />
              <button type="button" className="ui-link ui-link-spaced" onClick={() => irA('elegir')}>
                {t('back')}
              </button>
            </p>
          </form>
        )}

        {/* ---------- VISTA 3: crear cuenta ---------- */}
        {vista === 'registro' && (
          <form onSubmit={enviarRegistro} noValidate>
            {avisoGeneral && <Alert>{avisoGeneral}</Alert>}

            <Campo id="nombre" etiqueta={t('name')} autoComplete="nickname"
                   valor={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} />
            <Campo id="email-reg" etiqueta={t('email')} tipo="email" autoComplete="email"
                   valor={datos.email} onChange={cambiar('email')} error={errores.email} />
            <Campo id="password-reg" etiqueta={t('password')} tipo="password" autoComplete="new-password"
                   valor={datos.password} onChange={cambiar('password')} error={errores.password} />
            <Campo id="password2" etiqueta={t('repeatPassword')} tipo="password" autoComplete="new-password"
                   valor={datos.password2} onChange={cambiar('password2')} error={errores.password2} />

            <Button type="submit" disabled={enviando}>
              {enviando ? t('creatingAccount') : t('createAccount')}
            </Button>

            <p style={estilos.pie}>
              {t('haveAccount')}{' '}
              <button type="button" className="ui-link" onClick={() => irA('login')}>{t('signIn')}</button>
              <br />
              <button type="button" className="ui-link ui-link-spaced" onClick={() => irA('elegir')}>
                {t('back')}
              </button>
            </p>
          </form>
        )}

        {/* Enlaces legales: tienen que poder leerse ANTES de registrarse */}
        <PieLegal estilo={{ marginTop: '1.5rem', paddingBottom: 0, fontSize: '0.8rem' }} />
      </Card>
    </div>
  );
}

export default Acceso;
