import { useState, useRef } from 'react';
import { Avatar, Button, Card, ProgressBar, StatusDot, TextField, SecondaryButton } from '../../ui';
import { useI18n } from '../../../i18n';

const AVATAR_MAX_MB = 2;
const AVATAR_TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const TEXTO_ESTADO = { online: 'statusOnline', offline: 'statusOffline' };

const estilosCabecera = {
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
  }
};

async function obtenerCsrfToken(apiBaseUrl) {
  const respuesta = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
  const datos = await respuesta.json();
  return datos.csrfToken;
}

function BotonIntra({ login, esDe42 }) {
  const { t: traduccion } = useI18n();
  if (!esDe42 || !login) return null;

  return (
    <a
      className="ui-button ui-button-secondary"
      href={`https://profile.intra.42.fr/users/${encodeURIComponent(login)}`}
      target="_blank"
      rel="noopener noreferrer"
      title={traduccion('intraProfileTitle', { user: login })}
      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
    >
      {traduccion('intraProfile')}
    </a>
  );
}

export default function CabeceraPerfil({ perfil, setPerfil, setAviso, apiBaseUrl }) {
  const { t: traduccion } = useI18n();
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

  const guardarCambios = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);

      const respuesta = await fetch(`${apiBaseUrl}/users/me/editar/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify(borrador),
      });
      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        const detalle = datos.campos ? Object.values(datos.campos).join(' ') : datos.error;
        setAviso({ texto: detalle || traduccion('profileSaveError'), ok: false });
        return;
      }

      setPerfil({ ...perfil, nombre: datos.nombre, bio: datos.bio });
      setEditando(false);
      setAviso({ texto: traduccion('profileUpdated'), ok: true });
    } catch (errorCapturado) {
      setAviso({ texto: traduccion('serverError'), ok: false });
    } finally {
      setGuardando(false);
    }
  };

  const subirFotoPerfil = async (evento) => {
    const fichero = evento.target.files?.[0];
    evento.target.value = '';
    if (!fichero) return;

    setAviso(null);
    if (!AVATAR_TIPOS.includes(fichero.type)) {
      setAviso({ texto: traduccion('avatarWrongType'), ok: false });
      return;
    }
    if (fichero.size > AVATAR_MAX_MB * 1024 * 1024) {
      setAviso({ texto: traduccion('imageTooHeavy', { mb: AVATAR_MAX_MB }), ok: false });
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
          else rechazar(new Error(cuerpo.error || traduccion('photoUploadError')));
        };
        peticion.onerror = () => rechazar(new Error(traduccion('connectionError')));
        peticion.send(formulario);
      });

      setPerfil({ ...perfil, profile_image: datos.foto, tiene_avatar: true });
      setAviso({ texto: datos.mensaje, ok: true });
    } catch (errorCapturado) {
      setAviso({ texto: errorCapturado.message || traduccion('connectionError'), ok: false });
    } finally {
      setSubiendoFoto(false);
      setProgreso(0);
      URL.revokeObjectURL(urlPrevia);
      setVistaPrevia(null);
    }
  };

  const quitarFotoPerfil = async () => {
    setSubiendoFoto(true);
    setAviso(null);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);

      const respuesta = await fetch(`${apiBaseUrl}/users/me/avatar/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
      });
      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setAviso({ texto: datos.error || traduccion('photoRemoveError'), ok: false });
        return;
      }

      setPerfil({ ...perfil, profile_image: datos.foto, tiene_avatar: false });
      setAviso({ texto: datos.mensaje, ok: true });
    } catch (errorCapturado) {
      setAviso({ texto: traduccion('serverError'), ok: false });
    } finally {
      setSubiendoFoto(false);
    }
  };

  const gestionarAccionAmistad = async (accion) => {
    setEnviandoAmistad(true);
    setAviso(null);
    try {
      const csrfToken = await obtenerCsrfToken(apiBaseUrl);
      const cabeceras = { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken };

      let respuesta;
      if (accion === 'pedir') {
        respuesta = await fetch(`${apiBaseUrl}/social/solicitudes/`, { method: 'POST', credentials: 'include', headers: cabeceras, body: JSON.stringify({ receiver_id: perfil.id }) });
      } else if (accion === 'aceptar' || accion === 'rechazar') {
        respuesta = await fetch(`${apiBaseUrl}/social/solicitudes/${perfil.solicitud_id}/`, { method: 'PATCH', credentials: 'include', headers: cabeceras, body: JSON.stringify({ action: accion === 'aceptar' ? 'accept' : 'decline' }) });
      } else {
        respuesta = await fetch(`${apiBaseUrl}/social/amigos/${perfil.id}/`, { method: 'DELETE', credentials: 'include', headers: cabeceras });
      }

      if (!respuesta.ok) {
        setAviso({ texto: traduccion('friendActionError'), ok: false });
        return;
      }

      const refresco = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(perfil.username)}/`, { credentials: 'include' });
      if (refresco.ok) setPerfil(await refresco.json());
    } catch (errorCapturado) {
      setAviso({ texto: traduccion('connectionError'), ok: false });
    } finally {
      setEnviandoAmistad(false);
    }
  };

  return (
    <Card>
      <div style={estilosCabecera.cabecera}>
        <div style={estilosCabecera.columnaFoto}>
          <Avatar src={vistaPrevia || perfil.profile_image} alt={perfil.username} size="large" />
          {subiendoFoto && <ProgressBar value={progreso} className="profile-progress" />}
          {perfil.es_mi_perfil && (
            <>
              <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" onChange={subirFotoPerfil} style={{ display: 'none' }} />
              <button style={estilosCabecera.botonFoto} onClick={() => inputFoto.current?.click()} disabled={subiendoFoto}>
                {subiendoFoto ? traduccion('uploading') : traduccion('changePhoto')}
              </button>
              {perfil.tiene_avatar && (
                <button style={{ ...estilosCabecera.botonFoto, border: 'none', background: 'transparent' }} onClick={quitarFotoPerfil} disabled={subiendoFoto}>
                  {traduccion('remove')}
                </button>
              )}
            </>
          )}
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          {editando ? (
            <TextField id="nombre" label={traduccion('displayName')} value={borrador.nombre_mostrado} maxLength={50} onChange={(e) => setBorrador({ ...borrador, nombre_mostrado: e.target.value })} />
          ) : (
            <>
              <h1 style={estilosCabecera.nombre}>{perfil.nombre}</h1>
              <p style={estilosCabecera.login}>@{perfil.username}</p>
            </>
          )}

          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusDot status={perfil.estado} label={TEXTO_ESTADO[perfil.estado] ? traduccion(TEXTO_ESTADO[perfil.estado]) : perfil.estado} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Miembro desde {perfil.miembro_desde}</span>
            {perfil.is_alumni && <span style={{ color: 'var(--rarity-legendary)', fontSize: '0.85rem', fontWeight: 700 }}>🎓 Alumni</span>}
          </div>
        </div>
      </div>

      {editando ? (
        <div style={{ marginTop: '1.2rem' }}>
          <TextField id="bio" label={traduccion('aboutMe')} as="textarea" value={borrador.bio} maxLength={500} onChange={(e) => setBorrador({ ...borrador, bio: e.target.value })} />
        </div>
      ) : perfil.bio ? (
        <p style={estilosCabecera.bio}>{perfil.bio}</p>
      ) : perfil.es_mi_perfil ? (
        <p style={estilosCabecera.bioVacia}>{traduccion('profileNoBio')}</p>
      ) : null}

      {!perfil.es_mi_perfil && perfil.amistad && (
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {perfil.amistad === 'ninguna' && (
            <Button onClick={() => gestionarAccionAmistad('pedir')} disabled={enviandoAmistad}>
              🤝 Solicitar amistad
            </Button>
          )}
          {perfil.amistad === 'enviada' && (
            <>
              <SecondaryButton disabled>⏳ Solicitud enviada</SecondaryButton>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                {traduccion('friendWaitingAccept')}
              </span>
            </>
          )}
          {perfil.amistad === 'recibida' && (
            <>
              <Button onClick={() => gestionarAccionAmistad('aceptar')} disabled={enviandoAmistad}>{traduccion('accept')}</Button>
              <SecondaryButton onClick={() => gestionarAccionAmistad('rechazar')} disabled={enviandoAmistad}>{traduccion('reject')}</SecondaryButton>
            </>
          )}
          {perfil.amistad === 'amigos' && (
            <SecondaryButton onClick={() => gestionarAccionAmistad('eliminar')} disabled={enviandoAmistad}>
              {traduccion('removeFriend')}
            </SecondaryButton>
          )}

          <BotonIntra login={perfil.username} esDe42={perfil.es_de_42} />
        </div>
      )}

      {perfil.es_mi_perfil && (
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.3rem' }}>
          {editando ? (
            <>
              <Button onClick={guardarCambios} disabled={guardando}>{guardando ? traduccion('saving') : traduccion('saveChanges')}</Button>
              <SecondaryButton onClick={() => setEditando(false)} disabled={guardando}>{traduccion('cancel')}</SecondaryButton>
            </>
          ) : (
            <>
              <Button onClick={iniciarEdicion}>{traduccion('editProfile')}</Button>
              <BotonIntra login={perfil.username} esDe42={perfil.es_de_42} />
            </>
          )}
        </div>
      )}
    </Card>
  );
}