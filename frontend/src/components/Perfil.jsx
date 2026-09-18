import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Avatar, Button, Card, ProgressBar, SecondaryButton, StatusDot, TextField } from './ui';
import { COLOR_RAREZA } from './rarezas';

/**
 * PÁGINA DE PERFIL
 * ----------------
 * Muestra el perfil de un usuario: sus datos y cómo lleva la colección.
 *
 *   /perfil          -> el tuyo (editable)
 *   /perfil/:login   -> el de otra persona (solo lectura)
 *
 * Solo se pueden editar la biografía y el nombre a mostrar. El resto (nombre
 * real, email y foto) lo refresca la Intra en cada login, así que si se
 * dejaran editar se borrarían solos la próxima vez que entrases.
 *
 * 🎨 KONRAD Y SERGIO: usa las variables de color de styles.css y algunas de
 * vuestras clases (app-container, app-header, control-panel...). El diseño es
 * vuestro, cambiadlo sin miedo: lo visual está en el objeto 'estilos'.
 */

// 🖼️ Límites de la foto de perfil. Son LOS MISMOS que comprueba el backend en
// users/views.py. Aquí se miran para avisar al momento sin subir 5 MB en balde;
// los que mandan de verdad son los del servidor, porque estos se los puede
// saltar cualquiera desde el navegador.
const AVATAR_MAX_MB = 2;
const AVATAR_TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

// ⚠️ Nacho, 18/09 (con el visto bueno de Konrad): quitado el estado
// 'ingame'. El backend no lo escribía nunca porque no hay juego, y el
// 18/09 se borró también del modelo. Solo se tocan estas dos líneas.
const COLOR_ESTADO = {
  online: '#4ade80',
  offline: '#94a3b8',
};

const TEXTO_ESTADO = {
  online: 'En línea',
  offline: 'Desconectado',
};

const estilos = {
  tarjeta: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    marginBottom: '1.5rem',
  },
  cabecera: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  foto: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid var(--accent)',
    flexShrink: 0,
  },
  fotoVacia: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'var(--surface-overlay)',
    border: '3px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    flexShrink: 0,
  },
  nombre: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.9rem',
    fontWeight: 800,
    margin: 0,
    color: 'var(--text-primary)',
  },
  login: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    margin: '0.2rem 0 0.6rem',
  },
  bio: {
    color: 'var(--text-primary)',
    marginTop: '0.8rem',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  bioVacia: {
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    marginTop: '0.8rem',
  },
  etiquetaEstado: (estado) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    color: COLOR_ESTADO[estado] || COLOR_ESTADO.offline,
    fontWeight: 600,
  }),
  punto: (estado) => ({
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    background: COLOR_ESTADO[estado] || COLOR_ESTADO.offline,
    display: 'inline-block',
  }),
  rejilla: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  dato: {
    background: 'var(--surface-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: '10px',
    padding: '1rem',
    textAlign: 'center',
  },
  datoValor: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--accent)',
  },
  datoEtiqueta: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '0.25rem',
  },
  barraFuera: {
    background: 'var(--surface-overlay)',
    borderRadius: '999px',
    height: '14px',
    overflow: 'hidden',
    border: '1px solid var(--border-default)',
    marginTop: '0.6rem',
  },
  barraDentro: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: 'var(--accent)',
  }),
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
  boton: {
    background: 'var(--accent)',
    color: '#0c0f16',
    border: 'none',
    borderRadius: '8px',
    padding: '0.8rem 1.4rem',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  botonSecundario: {
    background: 'var(--surface-overlay)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    padding: '0.8rem 1.4rem',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  aviso: {
    borderRadius: '8px',
    padding: '0.7rem 1rem',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    fontWeight: 600,
  },
  // 🖼️ Zona de la foto: la imagen con sus botoncitos debajo
  columnaFoto: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
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
    cursor: 'pointer',
  },
  barraProgresoFuera: {
    width: '120px',
    height: '5px',
    background: 'var(--surface-overlay)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  barraProgresoDentro: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: 'var(--accent)',
    transition: 'width 0.15s linear',
  }),
};

export default function Perfil() {
  const { login } = useParams(); // si la dirección lleva login, es el de otro
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Edición
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState({ nombre_mostrado: '', bio: '' });
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { texto, ok }

  // 🖼️ Foto de perfil
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  // Vista previa: la foto elegida se enseña AL MOMENTO, sin esperar al
  // servidor, para que se vea qué se está subiendo mientras sube
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [progreso, setProgreso] = useState(0); // 0-100
  // El <input type="file"> de verdad es feísimo y no se puede maquillar, así
  // que se esconde y lo abrimos desde nuestro propio botón con esta referencia
  const inputFoto = useRef(null);

  // 🤝 Amistad con la persona de este perfil
  const [enviandoAmistad, setEnviandoAmistad] = useState(false);

  // Borrado de cuenta (RGPD)
  const [borrandoCuenta, setBorrandoCuenta] = useState(false); // ¿se ve la confirmación?
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [borrando, setBorrando] = useState(false);

  /**
   * Sube la foto que acaba de elegir el usuario.
   *
   * Se comprueba aquí el tipo y el peso para poder avisar al instante, pero es
   * solo comodidad: el servidor lo vuelve a comprobar todo y además abre la
   * imagen para asegurarse de que lo es. Estas comprobaciones del navegador se
   * las salta cualquiera, así que nunca son la seguridad de verdad.
   */
  const subirFoto = async (evento) => {
    const fichero = evento.target.files?.[0];
    // Permite volver a elegir la MISMA foto después de un error: si no se
    // limpia, el navegador no avisa del cambio porque el valor es el mismo
    evento.target.value = '';
    if (!fichero) return;

    setAviso(null);

    if (!AVATAR_TIPOS.includes(fichero.type)) {
      setAviso({ texto: 'Solo se admiten imágenes JPG, PNG o WEBP.', ok: false });
      return;
    }
    if (fichero.size > AVATAR_MAX_MB * 1024 * 1024) {
      const pesa = (fichero.size / 1024 / 1024).toFixed(1);
      setAviso({ texto: `La imagen pesa ${pesa} MB y el máximo son ${AVATAR_MAX_MB} MB.`, ok: false });
      return;
    }

    // Vista previa inmediata: el navegador puede enseñar un fichero del disco
    // sin subirlo a ningún sitio. Así se ve la foto elegida al instante.
    const urlPrevia = URL.createObjectURL(fichero);
    setVistaPrevia(urlPrevia);
    setProgreso(0);
    setSubiendoFoto(true);

    try {
      const resToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();

      // Un fichero no viaja en JSON: se manda en un formulario.
      // Y NO ponemos 'Content-Type' a mano a propósito: el navegador lo pone
      // solo, con una marca interna que necesita para separar el fichero del
      // resto. Si lo escribimos nosotros, se rompe la subida.
      const formulario = new FormData();
      formulario.append('avatar', fichero);

      // 📊 Aquí NO se usa fetch a propósito: fetch no sabe decir cuánto lleva
      // subido de un fichero. XMLHttpRequest es más antiguo pero sí avisa del
      // progreso, que es justo lo que necesitamos para la barra.
      const datos = await new Promise((resolver, rechazar) => {
        const peticion = new XMLHttpRequest();
        peticion.open('POST', `${apiBaseUrl}/users/me/avatar/`);
        peticion.withCredentials = true; // equivale al credentials:'include' de fetch
        peticion.setRequestHeader('X-CSRFToken', csrfToken);

        peticion.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgreso(Math.round((ev.loaded / ev.total) * 100));
          }
        };

        peticion.onload = () => {
          let cuerpo = {};
          try { cuerpo = JSON.parse(peticion.responseText); } catch { /* respuesta no JSON */ }
          if (peticion.status >= 200 && peticion.status < 300) {
            resolver(cuerpo);
          } else {
            rechazar(new Error(cuerpo.error || 'No se ha podido subir la foto.'));
          }
        };
        peticion.onerror = () => rechazar(new Error('No se ha podido conectar con el servidor.'));
        peticion.send(formulario);
      });

      setPerfil({ ...perfil, profile_image: datos.foto, tiene_avatar: true });
      setAviso({ texto: datos.mensaje, ok: true });
    } catch (e) {
      console.error('Error al subir la foto:', e);
      setAviso({ texto: e.message || 'No se ha podido conectar con el servidor.', ok: false });
    } finally {
      setSubiendoFoto(false);
      setProgreso(0);
      // Liberamos la vista previa: si no, esa foto se queda ocupando memoria
      // del navegador hasta que se recargue la página
      URL.revokeObjectURL(urlPrevia);
      setVistaPrevia(null);
    }
  };

  /** Quita la foto subida y vuelve a la de la Intra. */
  const quitarFoto = async () => {
    setSubiendoFoto(true);
    setAviso(null);
    try {
      const resToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();

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
      console.error('Error al quitar la foto:', e);
      setAviso({ texto: 'No se ha podido conectar con el servidor.', ok: false });
    } finally {
      setSubiendoFoto(false);
    }
  };

  const borrarCuenta = async () => {
    setBorrando(true);
    try {
      const resToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();

      const res = await fetch(`${apiBaseUrl}/users/me/borrar/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ confirmacion: 'BORRAR MI CUENTA' }),
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAviso({ texto: datos.error || 'No se ha podido borrar la cuenta.', ok: false });
        return;
      }

      // La cuenta ya no existe: recargamos para volver a la pantalla de acceso
      alert(datos.mensaje || 'Tu cuenta se ha borrado.');
      window.location.href = '/';
    } catch (e) {
      console.error('Error al borrar la cuenta:', e);
      setAviso({ texto: 'No se ha podido conectar con el servidor.', ok: false });
    } finally {
      setBorrando(false);
    }
  };

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        // Si no nos dan login, preguntamos primero quiénes somos
        let quien = login;
        if (!quien) {
          const resYo = await fetch(`${apiBaseUrl}/users/me/`, { credentials: 'include' });
          if (!resYo.ok) {
            setError('Tienes que iniciar sesión para ver tu perfil.');
            return;
          }
          quien = (await resYo.json()).username;
        }

        const res = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(quien)}/`, {
          credentials: 'include',
        });
        if (res.status === 404) {
          setError(`No existe ningún usuario llamado "${quien}".`);
          return;
        }
        if (!res.ok) {
          setError('No se ha podido cargar el perfil.');
          return;
        }

        const datos = await res.json();
        setPerfil(datos);
        setBorrador({ nombre_mostrado: datos.nombre || '', bio: datos.bio || '' });
      } catch (e) {
        console.error('Error al cargar el perfil:', e);
        setError('No se ha podido conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [login, apiBaseUrl]);

  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      // Django protege lo que envía datos: hay que pedirle el token primero
      const resToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();

      const res = await fetch(`${apiBaseUrl}/users/me/editar/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify(borrador),
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detalle = datos.campos ? Object.values(datos.campos).join(' ') : datos.error;
        setAviso({ texto: detalle || 'No se ha podido guardar.', ok: false });
        return;
      }

      setPerfil({ ...perfil, nombre: datos.nombre, bio: datos.bio });
      setEditando(false);
      setAviso({ texto: 'Perfil actualizado.', ok: true });
    } catch (e) {
      console.error('Error al guardar el perfil:', e);
      setAviso({ texto: 'No se ha podido conectar con el servidor.', ok: false });
    } finally {
      setGuardando(false);
    }
  };

  /**
   * 🤝 Pedir amistad, responder o dejar de ser amigos.
   *
   * El servidor nos dice en 'perfil.amistad' en qué punto estamos, y según eso
   * se enseña un botón u otro. Después de cada acción se vuelve a preguntar,
   * para no adivinar el estado nuevo por nuestra cuenta.
   */
  const accionAmistad = async (accion) => {
    setEnviandoAmistad(true);
    setAviso(null);
    try {
      const resToken = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
      const { csrfToken } = await resToken.json();
      const cabeceras = { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken };

      let res;
      if (accion === 'pedir') {
        res = await fetch(`${apiBaseUrl}/social/solicitudes/`, {
          method: 'POST', credentials: 'include', headers: cabeceras,
          body: JSON.stringify({ receiver_id: perfil.id }),
        });
      } else if (accion === 'aceptar' || accion === 'rechazar') {
        res = await fetch(`${apiBaseUrl}/social/solicitudes/${perfil.solicitud_id}/`, {
          method: 'PATCH', credentials: 'include', headers: cabeceras,
          body: JSON.stringify({ action: accion === 'aceptar' ? 'accept' : 'decline' }),
        });
      } else {
        res = await fetch(`${apiBaseUrl}/social/amigos/${perfil.id}/`, {
          method: 'DELETE', credentials: 'include', headers: cabeceras,
        });
      }

      const datos = await res.json().catch(() => ({}));
      if (!res.ok) {
        // El servidor manda el motivo en castellano, listo para enseñar
        const motivo = datos.detail || datos.error
          || (Array.isArray(datos.non_field_errors) ? datos.non_field_errors[0] : null);
        setAviso({ texto: motivo || 'No se ha podido completar la acción.', ok: false });
        return;
      }

      // Volvemos a pedir el perfil para que el botón refleje el estado nuevo
      const refresco = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(perfil.username)}/`, {
        credentials: 'include',
      });
      if (refresco.ok) setPerfil(await refresco.json());

      setAviso({
        texto: {
          pedir: 'Solicitud de amistad enviada.',
          aceptar: '¡Ya sois amigos!',
          rechazar: 'Solicitud rechazada.',
          eliminar: 'Ya no sois amigos.',
        }[accion],
        ok: true,
      });
    } catch (e) {
      console.error('Error en la acción de amistad:', e);
      setAviso({ texto: 'No se ha podido conectar con el servidor.', ok: false });
    } finally {
      setEnviandoAmistad(false);
    }
  };

  const cancelar = () => {
    setBorrador({ nombre_mostrado: perfil.nombre || '', bio: perfil.bio || '' });
    setEditando(false);
    setAviso(null);
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-navigation floating-navigation">
          <Link to="/home" className="back-btn-link">← Volver al Inicio</Link>
          <Link to="/catalogo" className="back-btn-link">📂 Ver Álbum</Link>
        </div>
      </header>

      {cargando ? (
        <Card>Cargando perfil…</Card>
      ) : error ? (
        <Card><Alert>{error}</Alert></Card>
      ) : (
        <>
          {/* ---------- Datos del usuario ---------- */}
          <Card>
            {aviso && (
              <Alert tone={aviso.ok ? 'success' : 'error'}>{aviso.texto}</Alert>
            )}

            <div style={estilos.cabecera}>
              <div style={estilos.columnaFoto}>
                {/* Mientras sube, se enseña la foto elegida (vistaPrevia).
                    El backend siempre manda una foto, así que el muñequito de
                    abajo ya casi nunca sale: se deja por si acaso. */}
                <Avatar
                src={vistaPrevia || perfil.profile_image}
                alt={perfil.username}
                size="large"
                className={subiendoFoto ? 'avatar-uploading' : ''}
                />

                {/* Barra de progreso: solo mientras se está subiendo */}
                {subiendoFoto && <ProgressBar value={progreso} className="profile-progress" />}

                {/* Cambiar la foto: solo en tu propio perfil */}
                {perfil.es_mi_perfil && (
                  <>
                    <input
                      ref={inputFoto}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={subirFoto}
                      style={{ display: 'none' }}
                    />
                    <button
                      style={estilos.botonFoto}
                      onClick={() => inputFoto.current?.click()}
                      disabled={subiendoFoto}
                    >
                      {subiendoFoto ? 'Subiendo…' : '📷 Cambiar foto'}
                    </button>
                    {perfil.tiene_avatar && (
                      <button
                        style={{ ...estilos.botonFoto, border: 'none', background: 'transparent' }}
                        onClick={quitarFoto}
                        disabled={subiendoFoto}
                      >
                        Quitar
                      </button>
                    )}
                  </>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '240px' }}>
                {editando ? (
                  <>
                    <TextField
                      id="nombre"
                      label="Nombre a mostrar"
                      value={borrador.nombre_mostrado}
                      maxLength={50}
                      onChange={(e) => setBorrador({ ...borrador, nombre_mostrado: e.target.value })}
                    />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                      Si lo dejas vacío se usará tu nombre de la Intra.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 style={estilos.nombre}>{perfil.nombre}</h1>
                    <p style={estilos.login}>@{perfil.username}</p>
                  </>
                )}

                <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusDot status={perfil.estado} label={TEXTO_ESTADO[perfil.estado] || perfil.estado} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Miembro desde {perfil.miembro_desde}
                  </span>
                  {perfil.is_alumni && (
                    <span style={{ color: 'var(--rarity-legendary)', fontSize: '0.85rem', fontWeight: 700 }}>
                      🎓 Alumni
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Biografía */}
            {editando ? (
              <div style={{ marginTop: '1.2rem' }}>
                <TextField
                  id="bio"
                  label="Sobre mí"
                  as="textarea"
                  className="profile-bio-input"
                  value={borrador.bio}
                  maxLength={500}
                  onChange={(e) => setBorrador({ ...borrador, bio: e.target.value })}
                  placeholder="Cuenta algo sobre ti…"
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                  {borrador.bio.length}/500
                </p>
              </div>
            ) : perfil.bio ? (
              <p style={estilos.bio}>{perfil.bio}</p>
            ) : perfil.es_mi_perfil ? (
              <p style={estilos.bioVacia}>Todavía no has escrito nada sobre ti.</p>
            ) : null}

            {/* 🤝 Amistad: solo en el perfil de OTRA persona */}
            {!perfil.es_mi_perfil && perfil.amistad && (
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {perfil.amistad === 'ninguna' && (
                  <button style={estilos.boton} onClick={() => accionAmistad('pedir')} disabled={enviandoAmistad}>
                    {enviandoAmistad ? 'Enviando…' : '🤝 Añadir amigo'}
                  </button>
                )}

                {perfil.amistad === 'enviada' && (
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    ⏳ Solicitud enviada, esperando respuesta
                  </span>
                )}

                {perfil.amistad === 'recibida' && (
                  <>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      Te ha enviado una solicitud
                    </span>
                    <button style={estilos.boton} onClick={() => accionAmistad('aceptar')} disabled={enviandoAmistad}>
                      Aceptar
                    </button>
                    <button style={estilos.botonSecundario} onClick={() => accionAmistad('rechazar')} disabled={enviandoAmistad}>
                      Rechazar
                    </button>
                  </>
                )}

                {perfil.amistad === 'amigos' && (
                  <>
                    <span style={{ color: '#86efac', fontWeight: 700 }}>✅ Sois amigos</span>
                    <button
                      style={{ ...estilos.botonSecundario, borderColor: '#f87171', color: '#fca5a5' }}
                      onClick={() => accionAmistad('eliminar')}
                      disabled={enviandoAmistad}
                    >
                      Eliminar amigo
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Botones (solo en tu propio perfil) */}
            {perfil.es_mi_perfil && (
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.3rem', flexWrap: 'wrap' }}>
                {editando ? (
                  <>
                    <Button onClick={guardar} disabled={guardando}>
                      {guardando ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                    <SecondaryButton onClick={cancelar} disabled={guardando}>
                      Cancelar
                    </SecondaryButton>
                  </>
                ) : (
                  <Button onClick={() => { setEditando(true); setAviso(null); }}>
                    ✏️ Editar perfil
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* ---------- Colección ---------- */}
          <Card>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>
              Colección
            </h2>

            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Álbum completado</span>
                <strong style={{ color: 'var(--text-primary)' }}>{perfil.coleccion.porcentaje}%</strong>
              </div>
              <ProgressBar value={perfil.coleccion.porcentaje} />
            </div>

            <div style={estilos.rejilla}>
              <div style={estilos.dato}>
                <div style={estilos.datoValor}>
                  {perfil.coleccion.cartas_distintas}
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    /{perfil.coleccion.cartas_en_catalogo}
                  </span>
                </div>
                <div style={estilos.datoEtiqueta}>Cartas distintas</div>
              </div>

              <div style={estilos.dato}>
                <div style={estilos.datoValor}>{perfil.coleccion.cartas_con_repetidas}</div>
                <div style={estilos.datoEtiqueta}>Con repetidas</div>
              </div>

              {/* 🏆 Puntos por rareza de la colección. Antes esta caja
                  enseñaba el 'elo', que era un 1000 fijo en todos los
                  perfiles porque no había nada que lo moviera. */}
              <div style={estilos.dato}>
                <div style={estilos.datoValor}>
                  {(perfil.puntos ?? 0).toLocaleString('es-ES')}
                </div>
                <div style={estilos.datoEtiqueta}>Puntuación</div>
              </div>
            </div>

            {perfil.coleccion.carta_mas_rara && (
              <div style={{ ...estilos.dato, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
                {perfil.coleccion.carta_mas_rara.photo && (
                  <img
                    src={perfil.coleccion.carta_mas_rara.photo}
                    alt={perfil.coleccion.carta_mas_rara.login}
                    style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                )}
                <div>
                  <div style={estilos.datoEtiqueta}>
                    {perfil.es_mi_perfil ? 'Tu carta más rara' : 'Su carta más rara'}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {perfil.coleccion.carta_mas_rara.login}
                  </div>
                  <div style={{
                    // Antes el color estaba fijo en dorado, así que una carta
                    // Común salía como si fuera Legendaria. Ahora cada rareza
                    // con el suyo.
                    color: COLOR_RAREZA[perfil.coleccion.carta_mas_rara.tier] || 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}>
                    {perfil.coleccion.carta_mas_rara.tier}
                    {/* El nivel explica POR QUÉ es esa y no otra: entre varias
                        de la misma rareza gana la de nivel más alto. */}
                    {perfil.coleccion.carta_mas_rara.nivel != null && (
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {' · nivel '}{perfil.coleccion.carta_mas_rara.nivel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ---------- Logros ---------- */}
          {perfil.logros && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>
                  Logros
                </h2>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {perfil.logros.filter((l) => l.conseguido).length} de {perfil.logros.length}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.8rem', marginTop: '1rem' }}>
                {perfil.logros.map((l) => (
                  <div
                    key={l.id}
                    title={l.descripcion}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      background: 'var(--surface-overlay)',
                      // Los que faltan se ven apagados, para que se note lo que queda
                      border: `1px solid ${l.conseguido ? 'var(--accent)' : 'var(--border-default)'}`,
                      borderRadius: '10px',
                      padding: '0.8rem',
                      opacity: l.conseguido ? 1 : 0.55,
                    }}
                  >
                    <span style={{ fontSize: '1.7rem', filter: l.conseguido ? 'none' : 'grayscale(1)' }}>
                      {l.icono}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {l.nombre}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {l.conseguido ? l.descripcion : `${l.actual} de ${l.objetivo}`}
                      </div>
                      {!l.conseguido && (
                        <div style={{ background: 'var(--surface-raised)', borderRadius: '999px', height: '4px', marginTop: '0.35rem', overflow: 'hidden' }}>
                          <div style={{ width: `${(l.actual / l.objetivo) * 100}%`, height: '100%', background: 'var(--accent)' }} />
                        </div>
                      )}
                    </div>
                    {l.conseguido && <span style={{ color: 'var(--accent)', fontWeight: 800 }}>✓</span>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ---------- Tus datos (RGPD) — solo en tu propio perfil ---------- */}
          {perfil.es_mi_perfil && (
            <Card>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent)' }}>
                Tus datos
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Puedes llevarte todo lo que guardamos de ti o borrar tu cuenta cuando quieras.
                Lo explicamos en la{' '}
                <Link to="/privacidad" style={{ color: 'var(--accent)' }}>Política de Privacidad</Link>.
              </p>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                <a
                  href={`${apiBaseUrl}/users/me/datos/`}
                  className="ui-button ui-button-secondary"
                >
                  ⬇️ Descargar mis datos
                </a>
                <SecondaryButton
                  className="danger-button"
                  onClick={() => { setBorrandoCuenta(true); setAviso(null); }}
                >
                  🗑️ Borrar mi cuenta
                </SecondaryButton>
              </div>

              {/* Confirmación: borrar una cuenta no puede ser un solo clic */}
              {borrandoCuenta && (
                <div
                  style={{
                    marginTop: '1.2rem',
                    padding: '1.2rem',
                    borderRadius: '10px',
                    background: 'rgba(248, 113, 113, 0.08)',
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                  }}
                >
                  <p style={{ color: '#fca5a5', fontWeight: 700, marginTop: 0 }}>
                    Esto no se puede deshacer
                  </p>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Se borrarán tu cuenta, tu álbum entero y tus sobres. Si quieres guardar una
                    copia, descarga tus datos antes.
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Escribe <strong style={{ color: '#fca5a5' }}>BORRAR MI CUENTA</strong> para confirmar:
                  </p>
                  <TextField
                    id="confirmacion-borrado"
                    label="Confirmación"
                    className="confirmation-input"
                    value={textoConfirmacion}
                    onChange={(e) => setTextoConfirmacion(e.target.value)}
                    placeholder="BORRAR MI CUENTA"
                  />
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <Button
                      className="danger-button"
                      disabled={textoConfirmacion !== 'BORRAR MI CUENTA' || borrando}
                      onClick={borrarCuenta}
                    >
                      {borrando ? 'Borrando…' : 'Borrar mi cuenta definitivamente'}
                    </Button>
                    <SecondaryButton
                      onClick={() => { setBorrandoCuenta(false); setTextoConfirmacion(''); }}
                    >
                      Cancelar
                    </SecondaryButton>
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </main>
  );
}
