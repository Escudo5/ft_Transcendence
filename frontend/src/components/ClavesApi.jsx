import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, SecondaryButton, TextField } from './ui';

/**
 * TUS CLAVES DE API
 * -----------------
 * Va dentro de tu propio perfil (Perfil.jsx) y solo ahí. Sirve para que un
 * alumno pueda sacarse una clave sin tocar la terminal, y usarla desde un
 * script suyo para consultar el álbum o proponer intercambios.
 *
 * ⚠️ LO ÚNICO QUE HAY QUE ENTENDER DE ESTA PANTALLA:
 * la clave se ve UNA VEZ, justo al crearla. El servidor no la guarda, solo
 * guarda una huella, así que no hay ninguna forma de volver a enseñarla —
 * ni a ti ni a nosotros. Por eso al crearla sale un recuadro grande, con
 * botón de copiar, que no se va hasta que lo cierras tú a propósito.
 *
 * Lo mismo que hacen GitHub y la propia Intra de 42 con sus secretos.
 *
 * 🎨 KONRAD Y SERGIO: el diseño es vuestro, cambiadlo sin miedo. Usa las
 * variables de styles.css y los componentes de ui.jsx, nada propio.
 */

const MAX_NOMBRE = 60;

export default function ClavesApi() {
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const [abierto, setAbierto] = useState(false);
  const [claves, setClaves] = useState([]);
  const [maximo, setMaximo] = useState(5);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState('');
  const [creando, setCreando] = useState(false);
  const [reciencreada, setReciencreada] = useState(null); // { clave, nombre }
  const [copiado, setCopiado] = useState(false);

  const [borrandoId, setBorrandoId] = useState(null);

  // Igual que en el resto del proyecto: el token hay que pedirlo antes de
  // cada escritura, porque Django lo exige en POST, PUT y DELETE.
  const pedirToken = useCallback(async () => {
    const res = await fetch(`${apiBaseUrl}/users/csrf/`, { credentials: 'include' });
    const { csrfToken } = await res.json();
    return csrfToken;
  }, [apiBaseUrl]);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/publica/claves/`, { credentials: 'include' });
      if (!res.ok) throw new Error('No se han podido cargar tus claves.');
      const datos = await res.json();
      setClaves(datos.resultados || []);
      setMaximo(datos.maximo ?? 5);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [apiBaseUrl]);

  // Solo se piden al desplegar la sección: si no, cada visita al perfil
  // haría una petición más para algo que casi nadie va a abrir.
  useEffect(() => {
    if (abierto) recargar();
  }, [abierto, recargar]);

  async function crear(evento) {
    evento.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return;

    setCreando(true);
    setError('');
    try {
      const csrfToken = await pedirToken();
      const res = await fetch(`${apiBaseUrl}/publica/claves/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ nombre: limpio }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.detail || 'No se ha podido crear la clave.');

      setReciencreada({ clave: datos.clave, nombre: datos.nombre });
      setCopiado(false);
      setNombre('');
      recargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreando(false);
    }
  }

  async function cambiarActiva(clave) {
    setError('');
    try {
      const csrfToken = await pedirToken();
      const res = await fetch(`${apiBaseUrl}/publica/claves/${clave.id}/`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ activa: !clave.activa }),
      });
      if (!res.ok) {
        const datos = await res.json();
        throw new Error(datos.detail || 'No se ha podido cambiar la clave.');
      }
      recargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function borrar(clave) {
    setError('');
    try {
      const csrfToken = await pedirToken();
      const res = await fetch(`${apiBaseUrl}/publica/claves/${clave.id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
      });
      if (!res.ok) {
        const datos = await res.json();
        throw new Error(datos.detail || 'No se ha podido borrar la clave.');
      }
      setBorrandoId(null);
      recargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      // Si el navegador no deja copiar (pasa sin https o sin permiso), no se
      // pierde nada: la clave está a la vista y se puede seleccionar a mano.
      setCopiado(false);
    }
  }

  function fecha(iso) {
    if (!iso) return 'nunca';
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        style={{
          all: 'unset', cursor: 'pointer', display: 'flex', width: '100%',
          alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}
      >
        <span>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0,
            color: 'var(--accent)',
          }}>
            🔑 Claves de API
          </h2>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '0.9rem',
            margin: '0.4rem 0 0',
          }}>
            Para consultar tu álbum o jugar desde un programa tuyo, sin navegador.
          </p>
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '1.3rem' }}>
          {abierto ? '▾' : '▸'}
        </span>
      </button>

      {abierto && (
        <div style={{ marginTop: '1.4rem' }}>
          {error && <Alert>{error}</Alert>}

          {/* ---- La clave recién creada: se ve una vez y ya ---- */}
          {reciencreada && (
            <div style={{
              background: 'var(--surface-overlay)',
              border: '2px solid var(--accent)',
              borderRadius: '12px',
              padding: '1.1rem',
              marginBottom: '1.4rem',
            }}>
              <div style={{ fontWeight: 800, color: 'var(--accent)', marginBottom: '0.3rem' }}>
                Clave «{reciencreada.nombre}» creada
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '0.8rem' }}>
                Cópiala ahora. No se guarda en ninguna parte, así que no vas a
                poder verla otra vez. Si la pierdes, borra esta y crea otra.
              </div>
              <code style={{
                display: 'block', wordBreak: 'break-all', userSelect: 'all',
                background: 'var(--surface-base, rgba(0,0,0,0.35))',
                border: '1px solid var(--border-default)',
                borderRadius: '8px', padding: '0.7rem',
                fontSize: '0.82rem', color: 'var(--text-primary)',
              }}>
                {reciencreada.clave}
              </code>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
                <Button type="button" onClick={() => copiar(reciencreada.clave)}>
                  {copiado ? '✓ Copiada' : 'Copiar'}
                </Button>
                <SecondaryButton type="button" onClick={() => setReciencreada(null)}>
                  Ya la he guardado
                </SecondaryButton>
              </div>
            </div>
          )}

          {/* ---- Crear una nueva ---- */}
          <form onSubmit={crear} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <TextField
                id="nombre-clave"
                label="Nombre de la clave"
                placeholder="Bot de Discord, script del ranking…"
                value={nombre}
                maxLength={MAX_NOMBRE}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={creando || !nombre.trim() || claves.length >= maximo}>
              {creando ? 'Creando…' : 'Crear clave'}
            </Button>
          </form>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
            {claves.length} de {maximo} claves.
            {claves.length >= maximo && ' Borra alguna que no uses para crear otra.'}
          </div>

          {/* ---- Las que ya tienes ---- */}
          <div style={{ marginTop: '1.4rem' }}>
            {cargando && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}

            {!cargando && claves.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Todavía no tienes ninguna clave.
              </p>
            )}

            {claves.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.9rem',
                  padding: '0.8rem 0', flexWrap: 'wrap',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <div style={{ flex: 1, minWidth: '190px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{c.nombre}</strong>
                    {/* Badge 'default' y el color a mano: el sistema de diseño
                        solo trae tonos de rareza de carta, y no hay que
                        inventarse clases que luego no existen en styles.css */}
                    <Badge tone="default" style={{ color: c.activa ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {c.activa ? 'activa' : 'apagada'}
                    </Badge>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                    <code>{c.prefijo}…</code> · creada el {fecha(c.creada)} · usada por última vez: {fecha(c.ultimo_uso)}
                  </div>
                </div>

                {borrandoId === c.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button type="button" className="danger-button" onClick={() => borrar(c)}>
                      Sí, borrar
                    </Button>
                    <SecondaryButton type="button" onClick={() => setBorrandoId(null)}>
                      Cancelar
                    </SecondaryButton>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <SecondaryButton type="button" onClick={() => cambiarActiva(c)}>
                      {c.activa ? 'Apagar' : 'Encender'}
                    </SecondaryButton>
                    <SecondaryButton type="button" onClick={() => setBorrandoId(c.id)}>
                      Borrar
                    </SecondaryButton>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ---- Cómo se usa ---- */}
          <div style={{
            marginTop: '1.5rem', paddingTop: '1.1rem',
            borderTop: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', fontSize: '0.85rem',
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              La clave va en la cabecera <code>X-API-Key</code> de cada petición:
            </div>
            <code style={{
              display: 'block', overflowX: 'auto', whiteSpace: 'pre',
              background: 'var(--surface-overlay)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px', padding: '0.7rem', fontSize: '0.78rem',
            }}>
              {`curl -k -H "X-API-Key: TU_CLAVE" \\\n  ${window.location.origin}/api/publica/mi-album/`}
            </code>
            <div style={{ marginTop: '0.7rem' }}>
              Todo lo que se puede pedir está en{' '}
              <a
                href={`${apiBaseUrl}/publica/`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                la documentación de la API
              </a>.
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
