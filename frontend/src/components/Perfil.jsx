import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';

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

const COLOR_ESTADO = {
  online: '#4ade80',
  ingame: '#fbbf24',
  offline: '#94a3b8',
};

const TEXTO_ESTADO = {
  online: 'En línea',
  ingame: 'Jugando',
  offline: 'Desconectado',
};

const estilos = {
  tarjeta: {
    background: 'var(--bg-card-base)',
    border: '1px solid var(--border-color)',
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
    border: '3px solid var(--accent-color)',
    flexShrink: 0,
  },
  fotoVacia: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'var(--bg-control)',
    border: '3px solid var(--border-color)',
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
    background: 'var(--bg-control)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '1rem',
    textAlign: 'center',
  },
  datoValor: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--accent-color)',
  },
  datoEtiqueta: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '0.25rem',
  },
  barraFuera: {
    background: 'var(--bg-control)',
    borderRadius: '999px',
    height: '14px',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    marginTop: '0.6rem',
  },
  barraDentro: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: 'linear-gradient(to right, #38bdf8, #818cf8, #c084fc)',
    transition: 'width 0.4s',
  }),
  campo: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--bg-control)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    outline: 'none',
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
    background: 'var(--accent-color)',
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
    background: 'var(--bg-control)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
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
    background: 'var(--bg-control)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '999px',
    padding: '0.35rem 0.85rem',
    fontFamily: 'var(--font-body)',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
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
  // El <input type="file"> de verdad es feísimo y no se puede maquillar, así
  // que se esconde y lo abrimos desde nuestro propio botón con esta referencia
  const inputFoto = useRef(null);

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

      const res = await fetch(`${apiBaseUrl}/users/me/avatar/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: formulario,
      });
      const datos = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAviso({ texto: datos.error || 'No se ha podido subir la foto.', ok: false });
        return;
      }

      setPerfil({ ...perfil, profile_image: datos.foto, tiene_avatar: true });
      setAviso({ texto: datos.mensaje, ok: true });
    } catch (e) {
      console.error('Error al subir la foto:', e);
      setAviso({ texto: 'No se ha podido conectar con el servidor.', ok: false });
    } finally {
      setSubiendoFoto(false);
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

  const cancelar = () => {
    setBorrador({ nombre_mostrado: perfil.nombre || '', bio: perfil.bio || '' });
    setEditando(false);
    setAviso(null);
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-navigation">
          <Link to="/home" className="back-btn-link">← Volver al Inicio</Link>
          <Link to="/catalogo" className="back-btn-link">📂 Ver Álbum</Link>
        </div>
      </header>

      {cargando ? (
        <div style={estilos.tarjeta}>Cargando perfil…</div>
      ) : error ? (
        <div style={estilos.tarjeta}>
          <p style={{ color: '#fca5a5', fontWeight: 600 }}>{error}</p>
        </div>
      ) : (
        <>
          {/* ---------- Datos del usuario ---------- */}
          <section style={estilos.tarjeta}>
            {aviso && (
              <div
                style={{
                  ...estilos.aviso,
                  background: aviso.ok ? 'rgba(74, 222, 128, 0.12)' : 'rgba(248, 113, 113, 0.12)',
                  border: `1px solid ${aviso.ok ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`,
                  color: aviso.ok ? '#86efac' : '#fca5a5',
                }}
              >
                {aviso.texto}
              </div>
            )}

            <div style={estilos.cabecera}>
              <div style={estilos.columnaFoto}>
                {perfil.profile_image ? (
                  <img src={perfil.profile_image} alt={perfil.username} style={estilos.foto} />
                ) : (
                  <div style={estilos.fotoVacia}>👤</div>
                )}

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
                    <label style={estilos.etiqueta} htmlFor="nombre">Nombre a mostrar</label>
                    <input
                      id="nombre"
                      style={estilos.campo}
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
                  <span style={estilos.etiquetaEstado(perfil.estado)}>
                    <span style={estilos.punto(perfil.estado)} />
                    {TEXTO_ESTADO[perfil.estado] || perfil.estado}
                  </span>
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
                <label style={estilos.etiqueta} htmlFor="bio">Sobre mí</label>
                <textarea
                  id="bio"
                  style={{ ...estilos.campo, minHeight: '90px', resize: 'vertical' }}
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

            {/* Botones (solo en tu propio perfil) */}
            {perfil.es_mi_perfil && (
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.3rem', flexWrap: 'wrap' }}>
                {editando ? (
                  <>
                    <button style={estilos.boton} onClick={guardar} disabled={guardando}>
                      {guardando ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                    <button style={estilos.botonSecundario} onClick={cancelar} disabled={guardando}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button style={estilos.boton} onClick={() => { setEditando(true); setAviso(null); }}>
                    ✏️ Editar perfil
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ---------- Colección ---------- */}
          <section style={estilos.tarjeta}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent-color)' }}>
              Colección
            </h2>

            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Álbum completado</span>
                <strong style={{ color: 'var(--text-primary)' }}>{perfil.coleccion.porcentaje}%</strong>
              </div>
              <div style={estilos.barraFuera}>
                <div style={estilos.barraDentro(perfil.coleccion.porcentaje)} />
              </div>
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

              <div style={estilos.dato}>
                <div style={estilos.datoValor}>{perfil.elo}</div>
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
                  <div style={estilos.datoEtiqueta}>Su carta más rara</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {perfil.coleccion.carta_mas_rara.login}
                  </div>
                  <div style={{ color: 'var(--rarity-legendary)', fontSize: '0.85rem', fontWeight: 700 }}>
                    {perfil.coleccion.carta_mas_rara.tier}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ---------- Logros ---------- */}
          {perfil.logros && (
            <section style={estilos.tarjeta}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent-color)' }}>
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
                      background: 'var(--bg-control)',
                      // Los que faltan se ven apagados, para que se note lo que queda
                      border: `1px solid ${l.conseguido ? 'var(--accent-color)' : 'var(--border-color)'}`,
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
                        <div style={{ background: 'var(--bg-card-base)', borderRadius: '999px', height: '4px', marginTop: '0.35rem', overflow: 'hidden' }}>
                          <div style={{ width: `${(l.actual / l.objetivo) * 100}%`, height: '100%', background: 'var(--accent-color)' }} />
                        </div>
                      )}
                    </div>
                    {l.conseguido && <span style={{ color: 'var(--accent-color)', fontWeight: 800 }}>✓</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---------- Tus datos (RGPD) — solo en tu propio perfil ---------- */}
          {perfil.es_mi_perfil && (
            <section style={estilos.tarjeta}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: 'var(--accent-color)' }}>
                Tus datos
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Puedes llevarte todo lo que guardamos de ti o borrar tu cuenta cuando quieras.
                Lo explicamos en la{' '}
                <Link to="/privacidad" style={{ color: 'var(--accent-color)' }}>Política de Privacidad</Link>.
              </p>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                <a
                  href={`${apiBaseUrl}/users/me/datos/`}
                  style={{ ...estilos.botonSecundario, textDecoration: 'none', display: 'inline-block' }}
                >
                  ⬇️ Descargar mis datos
                </a>
                <button
                  style={{ ...estilos.botonSecundario, borderColor: '#f87171', color: '#fca5a5' }}
                  onClick={() => { setBorrandoCuenta(true); setAviso(null); }}
                >
                  🗑️ Borrar mi cuenta
                </button>
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
                  <input
                    style={estilos.campo}
                    value={textoConfirmacion}
                    onChange={(e) => setTextoConfirmacion(e.target.value)}
                    placeholder="BORRAR MI CUENTA"
                  />
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button
                      style={{
                        ...estilos.boton,
                        background: '#dc2626',
                        color: 'white',
                        opacity: textoConfirmacion === 'BORRAR MI CUENTA' ? 1 : 0.5,
                        cursor: textoConfirmacion === 'BORRAR MI CUENTA' ? 'pointer' : 'not-allowed',
                      }}
                      disabled={textoConfirmacion !== 'BORRAR MI CUENTA' || borrando}
                      onClick={borrarCuenta}
                    >
                      {borrando ? 'Borrando…' : 'Borrar mi cuenta definitivamente'}
                    </button>
                    <button
                      style={estilos.botonSecundario}
                      onClick={() => { setBorrandoCuenta(false); setTextoConfirmacion(''); }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
