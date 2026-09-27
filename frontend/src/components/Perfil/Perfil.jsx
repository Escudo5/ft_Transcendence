import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Avatar, Button, Card, ProgressBar, StatusDot, TextField, SecondaryButton } from '../ui';
import { COLOR_RAREZA } from '../rarezas';
import { useI18n } from '../../i18n';
import ClavesApi from './ClavesApi';

// CONSTANTES Y ESTILOS
/* ⚠️ ESTA FRASE NO SE TRADUCE NUNCA, EN NINGÚN IDIOMA (Nacho, 22/09).
 *
 * Es la contraseña de seguridad del borrado de cuenta: el usuario la escribe
 * a mano y el backend comprueba que llega EXACTAMENTE así (users/views.py,
 * borrar_mi_cuenta). Si se tradujese, quien tenga la web en inglés
 * escribiría "DELETE MY ACCOUNT", no coincidiría, y el botón no se
 * activaría nunca: nadie podría borrar su cuenta.
 *
 * Lo que SÍ se traduce es la frase que la rodea ("escribe X para
 * confirmar"), y la palabra va dentro como un hueco. */
const FRASE_BORRADO = 'BORRAR MI CUENTA';

const AVATAR_MAX_MB = 2;
const AVATAR_TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

const COLOR_ESTADO = { online: '#4ade80', offline: '#94a3b8' };
// Nacho, 22/09: los textos del estado salen ahora de i18n (statusOnline /
// statusOffline). Este diccionario se queda solo con las CLAVES.
const TEXTO_ESTADO = { online: 'statusOnline', offline: 'statusOffline' };

const estilos = {
  cabecera: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  nombre: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.9rem',
    fontWeight: 800,
    margin: 0,
    color: 'var(--text-primary)'
  },
  login: {
    color: 'var(--text-secondary)',
    fontSize: '1.0rem',
    margin: '0.2rem 0 0.6rem'
  },
  bio: {
    color: 'var(--text-primary)',
    marginTop: '0.8rem',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap'
  },
  bioVacia: {
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    marginTop: '0.8rem'
  },
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
  },
  columnaFoto: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0
  },
  botonFoto: {
    background: 'var(--surface-overlay)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: '999px',
    padding: '0.35rem 0.85rem',
    fontFamily: 'var(--font-body)',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modalCaja: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: '16px',
    padding: '1.8rem',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    textAlign: 'center'
  }
};

// HELPER AUXILIAR: Pide la clave de seguridad al servidor
async function obtenerCsrfToken(apiBaseUrl) {
  const res = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}

/*
🔗 EL BOTÓN QUE LLEVA A SU PERFIL DE LA INTRA (Nacho, 21/09)

La dirección se arma con el login, que es exactamente el nombre de usuario
de quien entró con 42: https://profile.intra.42.fr/users/<login>

⚠️ SOLO SALE SI ESA CUENTA VINO DE 42 (`es_de_42`, que manda el backend).
Quien se registra con correo tiene un nombre inventado por nosotros, y ese
perfil no existe en la Intra: el botón llevaría a un 404. Antes que un botón
que engaña, ninguno.

Va como <a> y no como <button> a propósito: así funciona el clic central, el
"abrir en pestaña nueva" y el teclado, que es lo que la gente espera de un
enlace. Lleva las clases de botón del sistema de diseño para que se vea
igual que sus vecinos.

`rel="noopener noreferrer"` no es decoración: sin `noopener`, la página que
se abre puede manipular la nuestra a través de window.opener.
*/
function BotonIntra({ login, esDe42 }) {
  const { t } = useI18n();
  if (!esDe42 || !login) return null;

  return (
    <a
      className="ui-button ui-button-secondary"
      href={`https://profile.intra.42.fr/users/${encodeURIComponent(login)}`}
      target="_blank"
      rel="noopener noreferrer"
      title={t('intraProfileTitle', { user: login })}
      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
    >
      {t('intraProfile')}
    </a>
  );
}

// LÓGICA DE CARGA: Pide la información del usuario al servidor
function usePerfilData(login, apiBaseUrl) {
  const { t } = useI18n();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        let quien = login;
        if (!quien) {
          const resYo = await fetch(`${apiBaseUrl}/users/me/`, { credentials: 'include' });
          if (!resYo.ok) {
            setError(t('profileLoginRequired'));
            return;
          }
          quien = (await resYo.json()).username;
        }

        const res = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(quien)}/`, { credentials: 'include' });
        if (res.status === 404) {
          setError(t('profileNoSuchUser', { user: quien }));
          return;
        }
        if (!res.ok) {
          setError(t('profileLoadError'));
          return;
        }

        const datos = await res.json();
        setPerfil(datos);
      } catch (e) {
        console.error('Error al cargar perfil:', e);
        setError(t('serverError'));
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [login, apiBaseUrl]);

  return { perfil, setPerfil, cargando, error, setError, aviso, setAviso };
}

// SUBCOMPONENTES DE PANTALLA

// Cabecera con datos de usuario y botones de acción
function CabeceraPerfil({ perfil, setPerfil, setAviso, apiBaseUrl }) {
  const { t } = useI18n();
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState({ nombre_mostrado: '', bio: '' });
  const [guardando, setGuardando] = useState(false);

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [progreso, setProgreso] = useState(0);
  const [enviandoAmistad, setEnviandoAmistad] = useState(false);
  const inputFoto = useRef(null);

  const iniciarEdicion = () => {
    setBorrador({ nombre_mostrado: perfil.nombre || '', bio: perfil.bio || '' });
    setEditando(true);
    setAviso(null);
  };

  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);

      const res = await fetch(`${apiBaseUrl}/users/me/editar/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify(borrador),
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detalle = datos.campos ? Object.values(datos.campos).join(' ') : datos.error;
        setAviso({ texto: detalle || t('profileSaveError'), ok: false });
        return;
      }

      setPerfil({ ...perfil, nombre: datos.nombre, bio: datos.bio });
      setEditando(false);
      setAviso({ texto: t('profileUpdated'), ok: true });
    } catch (e) {
      setAviso({ texto: t('serverError'), ok: false });
    } finally {
      setGuardando(false);
    }
  };

  const subirFoto = async (evento) => {
    const fichero = evento.target.files?.[0];
    evento.target.value = '';
    if (!fichero) return;

    setAviso(null);
    if (!AVATAR_TIPOS.includes(fichero.type)) {
      setAviso({ texto: t('avatarWrongType'), ok: false });
      return;
    }
    if (fichero.size > AVATAR_MAX_MB * 1024 * 1024) {
      setAviso({ texto: `La imagen no puede pesar más de ${AVATAR_MAX_MB} MB.`, ok: false });
      return;
    }

    const urlPrevia = URL.createObjectURL(fichero);
    setVistaPrevia(urlPrevia);
    setProgreso(0);
    setSubiendoFoto(true);

    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);

      const formulario = new FormData();
      formulario.append('avatar', fichero);

      const datos = await new Promise((resolver, rechazar) => {
        const peticion = new XMLHttpRequest();
        peticion.open('POST', `${apiBaseUrl}/users/me/avatar/`);
        peticion.withCredentials = true;
        peticion.setRequestHeader('X-CSRFToken', csrfToken);

        peticion.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgreso(Math.round((ev.loaded / ev.total) * 100));
        };

        peticion.onload = () => {
          let cuerpo = {};
          try { cuerpo = JSON.parse(peticion.responseText); } catch {}
          if (peticion.status >= 200 && peticion.status < 300) resolver(cuerpo);
          else rechazar(new Error(cuerpo.error || 'No se ha podido subir la foto.'));
        };
        peticion.onerror = () => rechazar(new Error(t('connectionError')));
        peticion.send(formulario);
      });

      setPerfil({ ...perfil, profile_image: datos.foto, tiene_avatar: true });
      setAviso({ texto: datos.mensaje, ok: true });
    } catch (e) {
      setAviso({ texto: e.message || t('connectionError'), ok: false });
    } finally {
      setSubiendoFoto(false);
      setProgreso(0);
      URL.revokeObjectURL(urlPrevia);
      setVistaPrevia(null);
    }
  };

  const quitarFoto = async () => {
    setSubiendoFoto(true);
    setAviso(null);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);

      const res = await fetch(`${apiBaseUrl}/users/me/avatar/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAviso({ texto: datos.error || 'No se ha podido quitar la foto.', ok: false });
        return;
      }

      setPerfil({ ...perfil, profile_image: datos.foto, tiene_avatar: false });
      setAviso({ texto: datos.mensaje, ok: true });
    } catch (e) {
      setAviso({ texto: t('serverError'), ok: false });
    } finally {
      setSubiendoFoto(false);
    }
  };

  const accionAmistad = async (accion) => {
    setEnviandoAmistad(true);
    setAviso(null);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);
      const cabeceras = { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken };

      let res;
      if (accion === 'pedir') {
        res = await fetch(`${apiBaseUrl}/social/solicitudes/`, { method: 'POST', credentials: 'include', headers: cabeceras, body: JSON.stringify({ receiver_id: perfil.id }) });
      } else if (accion === 'aceptar' || accion === 'rechazar') {
        res = await fetch(`${apiBaseUrl}/social/solicitudes/${perfil.solicitud_id}/`, { method: 'PATCH', credentials: 'include', headers: cabeceras, body: JSON.stringify({ action: accion === 'aceptar' ? 'accept' : 'decline' }) });
      } else {
        res = await fetch(`${apiBaseUrl}/social/amigos/${perfil.id}/`, { method: 'DELETE', credentials: 'include', headers: cabeceras });
      }

      if (!res.ok) {
        setAviso({ texto: t('friendActionError'), ok: false });
        return;
      }

      const refresco = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(perfil.username)}/`, { credentials: 'include' });
      if (refresco.ok) setPerfil(await refresco.json());
    } catch (e) {
      setAviso({ texto: t('connectionError'), ok: false });
    } finally {
      setEnviandoAmistad(false);
    }
  };

  return (
    <Card>
      <div style={estilos.cabecera}>
        <div style={estilos.columnaFoto}>
          <Avatar src={vistaPrevia || perfil.profile_image} alt={perfil.username} size="large" />
          {subiendoFoto && <ProgressBar value={progreso} className="profile-progress" />}
          {perfil.es_mi_perfil && (
            <>
              <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" onChange={subirFoto} style={{ display: 'none' }} />
              <button style={estilos.botonFoto} onClick={() => inputFoto.current?.click()} disabled={subiendoFoto}>
                {subiendoFoto ? t('uploading') : t('changePhoto')}
              </button>
              {perfil.tiene_avatar && (
                <button style={{ ...estilos.botonFoto, border: 'none', background: 'transparent' }} onClick={quitarFoto} disabled={subiendoFoto}>
                  {t('remove')}
                </button>
              )}
            </>
          )}
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          {editando ? (
            <TextField id="nombre" label={t('displayName')} value={borrador.nombre_mostrado} maxLength={50} onChange={(e) => setBorrador({ ...borrador, nombre_mostrado: e.target.value })} />
          ) : (
            <>
              <h1 style={estilos.nombre}>{perfil.nombre}</h1>
              <p style={estilos.login}>@{perfil.username}</p>
            </>
          )}

          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusDot status={perfil.estado} label={TEXTO_ESTADO[perfil.estado] ? t(TEXTO_ESTADO[perfil.estado]) : perfil.estado} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Miembro desde {perfil.miembro_desde}</span>
            {perfil.is_alumni && <span style={{ color: 'var(--rarity-legendary)', fontSize: '0.85rem', fontWeight: 700 }}>🎓 Alumni</span>}
          </div>
        </div>
      </div>

      {editando ? (
        <div style={{ marginTop: '1.2rem' }}>
          <TextField id="bio" label={t('aboutMe')} as="textarea" value={borrador.bio} maxLength={500} onChange={(e) => setBorrador({ ...borrador, bio: e.target.value })} />
        </div>
      ) : perfil.bio ? (
        <p style={estilos.bio}>{perfil.bio}</p>
      ) : perfil.es_mi_perfil ? (
        <p style={estilos.bioVacia}>{t('profileNoBio')}</p>
      ) : null}

      {/* 🤝 EL BOTÓN DE AMISTAD, SEGÚN CÓMO ESTÉIS (Nacho, 21/09)
        *
        * El backend devuelve en `amistad` uno de estos cuatro (el quinto,
        * 'yo', no llega aquí porque este bloque solo sale en perfiles
        * ajenos). Están LOS CUATRO a propósito: si falta alguno, el botón
        * desaparece sin explicación y parece que la web se ha roto.
        *
        *   ninguna   -> no hay nada: se le puede pedir
        *   enviada   -> se la mandaste tú y está esperando respuesta
        *   recibida  -> te la mandó él: aceptar o rechazar
        *   amigos    -> ya lo sois: se puede deshacer
        *
        * ⚠️ El caso 'enviada' NO pintaba nada hasta el 21/09. Pedías
        * amistad, el botón desaparecía y no salía nada en su lugar: parecía
        * que no se había enviado y la gente lo intentaba otra vez. Ahora
        * sale apagado y dice que está esperando. */}
      {!perfil.es_mi_perfil && perfil.amistad && (
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {perfil.amistad === 'ninguna' && (
            <Button onClick={() => accionAmistad('pedir')} disabled={enviandoAmistad}>
              🤝 Solicitar amistad
            </Button>
          )}
          {perfil.amistad === 'enviada' && (
            <>
              <SecondaryButton disabled>⏳ Solicitud enviada</SecondaryButton>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                {t('friendWaitingAccept')}
              </span>
            </>
          )}
          {perfil.amistad === 'recibida' && (
            <>
              <Button onClick={() => accionAmistad('aceptar')} disabled={enviandoAmistad}>{t('accept')}</Button>
              <SecondaryButton onClick={() => accionAmistad('rechazar')} disabled={enviandoAmistad}>{t('reject')}</SecondaryButton>
            </>
          )}
          {perfil.amistad === 'amigos' && (
            <SecondaryButton onClick={() => accionAmistad('eliminar')} disabled={enviandoAmistad}>
              {t('removeFriend')}
            </SecondaryButton>
          )}

          {/* 🔗 Al lado del de amistad, el que lleva a su Intra. */}
          <BotonIntra login={perfil.username} esDe42={perfil.es_de_42} />
        </div>
      )}

      {perfil.es_mi_perfil && (
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.3rem' }}>
          {editando ? (
            <>
              <Button onClick={guardar} disabled={guardando}>{guardando ? t('saving') : t('saveChanges')}</Button>
              <SecondaryButton onClick={() => setEditando(false)} disabled={guardando}>{t('cancel')}</SecondaryButton>
            </>
          ) : (
            <>
              <Button onClick={iniciarEdicion}>{t('editProfile')}</Button>
              {/* 🔗 En tu propio perfil también: es tu Intra. */}
              <BotonIntra login={perfil.username} esDe42={perfil.es_de_42} />
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// Estadísticas de la colección del usuario
function ColeccionPerfil({ coleccion, puntos, esMiPerfil }) {
  const { t } = useI18n();
  return (
    <Card>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>{t('collection')}</h2>
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <span>{t('albumCompleted')}</span>
          <strong style={{ color: 'var(--text-primary)' }}>{coleccion.porcentaje}%</strong>
        </div>
        <ProgressBar value={coleccion.porcentaje} />
      </div>

      <div style={estilos.rejilla}>
        <div style={estilos.dato}>
          <div style={estilos.datoValor}>
            {coleccion.cartas_distintas}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/{coleccion.cartas_en_catalogo}</span>
          </div>
          <div style={estilos.datoEtiqueta}>{t('distinctCards')}</div>
        </div>
        <div style={estilos.dato}>
          <div style={estilos.datoValor}>{coleccion.cartas_con_repetidas}</div>
          <div style={estilos.datoEtiqueta}>{t('withDuplicates')}</div>
        </div>
        <div style={estilos.dato}>
          <div style={estilos.datoValor}>{(puntos ?? 0).toLocaleString('es-ES')}</div>
          <div style={estilos.datoEtiqueta}>{t('score')}</div>
        </div>
      </div>

      {coleccion.carta_mas_rara && (
        <div style={{ ...estilos.dato, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
          {coleccion.carta_mas_rara.photo && (
            <img src={coleccion.carta_mas_rara.photo} alt={coleccion.carta_mas_rara.login} style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' }} />
          )}
          <div>
            <div style={estilos.datoEtiqueta}>{esMiPerfil ? t('yourRarestCard') : t('theirRarestCard')}</div>
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

// Lista de Logros
function LogrosPerfil({ logros }) {
  const { t } = useI18n();
  if (!logros) return null;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>{t('achievements')}</h2>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {logros.filter((l) => l.conseguido).length} de {logros.length}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.8rem', marginTop: '1rem' }}>
        {logros.map((l) => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--surface-overlay)', border: `1px solid ${l.conseguido ? 'var(--accent)' : 'var(--border-default)'}`, borderRadius: '10px', padding: '0.8rem', opacity: l.conseguido ? 1 : 0.55 }}>
            <span style={{ fontSize: '1.7rem', filter: l.conseguido ? 'none' : 'grayscale(1)' }}>{l.icono}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{l.nombre}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{l.conseguido ? l.descripcion : `${l.actual} de ${l.objetivo}`}</div>
            </div>
            {l.conseguido && <span style={{ color: 'var(--accent)', fontWeight: 800 }}>✓</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}

// Opciones RGPD, Cierre de Sesión y Eliminación de Cuenta
function SeccionAjustesCuenta({ apiBaseUrl, setAviso, onAbrirLogoutModal }) {
  const { t } = useI18n();
  const [borrandoCuenta, setBorrandoCuenta] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [borrando, setBorrando] = useState(false);

  const borrarCuenta = async () => {
    setBorrando(true);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);

      const res = await fetch(`${apiBaseUrl}/users/me/borrar/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ confirmacion: FRASE_BORRADO }),
      });

      if (!res.ok) {
        setAviso({ texto: t('deleteAccountError'), ok: false });
        return;
      }
      window.location.href = '/';
    } catch (e) {
      setAviso({ texto: t('connectionError'), ok: false });
    } finally {
      setBorrando(false);
    }
  };

  return (
    <Card>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>{t('yourData')}</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
        {t('yourDataText')}
      </p>

      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <a href={`${apiBaseUrl}/users/me/datos/`} className="ui-button ui-button-secondary">⬇️ Descargar mis datos</a>
        <SecondaryButton onClick={onAbrirLogoutModal}>{t('logout')}</SecondaryButton>
        <SecondaryButton className="danger-button" onClick={() => { setBorrandoCuenta(true); setAviso(null); }}>
          🗑️ Borrar mi cuenta
        </SecondaryButton>
      </div>

      {borrandoCuenta && (
        <div style={{ marginTop: '1.2rem', padding: '1.2rem', borderRadius: '10px', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.4)' }}>
          <p style={{ color: '#fca5a5', fontWeight: 700, marginTop: 0 }}>{t('cannotBeUndone')}</p>
          {/* La instrucción se traduce; la FRASE que hay que escribir, no.
              Por eso va como hueco y no dentro del texto traducido. */}
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {t('typeToConfirm', { phrase: FRASE_BORRADO })}
          </p>
          <TextField id="confirmacion-borrado" label={t('confirmation')} value={textoConfirmacion} onChange={(e) => setTextoConfirmacion(e.target.value)} placeholder={FRASE_BORRADO} />
          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
            <Button className="danger-button" disabled={textoConfirmacion !== FRASE_BORRADO || borrando} onClick={borrarCuenta}>
              {borrando ? t('deleting') : t('deleteAccountForever')}
            </Button>
            <SecondaryButton onClick={() => setBorrandoCuenta(false)}>{t('cancel')}</SecondaryButton>
          </div>
        </div>
      )}
    </Card>
  );
}

// PARTE E: Ventana emergente Modal Cierre de Sesión
function ModalCerrarSesion({ visible, onCancelar, apiBaseUrl }) {
  const { t } = useI18n();
  const [cerrando, setCerrando] = useState(false);

  if (!visible) return null;

  const cerrarSesion = async () => {
    setCerrando(true);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);

      await fetch(`${apiBaseUrl}/users/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
      });
      window.location.href = '/';
    } catch (e) {
      window.location.href = '/';
    }
  };

  return (
    <div style={estilos.modalOverlay}>
      <div style={estilos.modalCaja}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></div>
        <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>{t('logoutConfirmTitle')}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
          {t('logoutConfirmText')}
        </p>
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
          <SecondaryButton onClick={onCancelar} disabled={cerrando}>{t('cancel')}</SecondaryButton>
          <Button onClick={cerrarSesion} disabled={cerrando}>{cerrando ? t('loggingOut') : t('yesLogout')}</Button>
        </div>
      </div>
    </div>
  );
}

// FUNCION PRINCIPAL

export default function Perfil() {
  const { t } = useI18n();
  const { login } = useParams();
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const { perfil, setPerfil, cargando, error, aviso, setAviso } = usePerfilData(login, apiBaseUrl);
  const [confirmarLogout, setConfirmarLogout] = useState(false);

  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-navigation floating-navigation">
          <Link to="/home" className="back-btn-link">{t('catalogBack')}</Link>
          <Link to="/catalogo" className="back-btn-link">{t('viewAlbum')}</Link>
        </div>
      </header>

      {cargando ? (
        <Card>{t('profileLoading')}</Card>
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

          {/* ---------- Claves de la API pública — solo en tu propio perfil ----------
            * Nacho, 24/09: esto venía de la rama nacho/api-publica, que salía de
            * un Perfil.jsx del 9 de septiembre. El merge dio conflicto porque el
            * fichero ha cambiado entero desde entonces (traducciones, RGPD, logros).
            * De aquel lado se ha cogido SOLO esto: el import y estas dos líneas.
            * Todo lo demás de aquella versión se ha descartado a propósito. */}
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