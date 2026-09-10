// ChatSocial.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ListaChats from './ListaChats';
import BuscarAmigos from './BuscarAmigos';
import SolicitudesRecibidas from './SolicitudesRecibidas';
import AreaChat from './AreaChat';
import './Chat.css';

const API = import.meta.env.VITE_API_URL || '/api';

const TEXTO_ESTADO = {
  online: 'En línea',
  ingame: 'Jugando',
  offline: 'Desconectado',
};

const LARGO_MAXIMO = 1000;

/* ===========================================================================
   [MOCK TEMPORAL FRONTEND - INICIO]
   Borrar este bloque entero al conectar completamente con el backend.
   Servirá para previsualizar los chats y probar bloqueos sin depender de BD.
   =========================================================================== */
const AMIGOS_MOCK_PRUEBAS = [
  {
    id: 991,
    login: 'amigo_normal',
    nombre: 'Carlos López',
    avatar: <div style={{ background: '#00ffcc', width: '100%', height: '100%', borderRadius: '50%' }} />,
    estado: 'En línea',
    bloqueado: false,
    meHaBloqueado: false,
    sinLeer: 0,
  },
  {
    id: 992,
    login: 'amigo_bloqueado_por_mi',
    nombre: 'Ana Gómez',
    avatar: <div style={{ background: '#ff4d4d', width: '100%', height: '100%', borderRadius: '50%' }} />,
    estado: 'Desconectado',
    bloqueado: true,
    meHaBloqueado: false,
    sinLeer: 0,
  },
  {
    id: 993,
    login: 'amigo_que_me_bloqueo',
    nombre: 'Marcos Ruiz',
    avatar: <div style={{ background: '#ffaa00', width: '100%', height: '100%', borderRadius: '50%' }} />,
    estado: 'Jugando',
    bloqueado: false,
    meHaBloqueado: true,
    sinLeer: 0,
  },
];

const MENSAJES_MOCK_PRUEBAS = {
  amigo_normal: [
  { id: 1, texto: '¡Hola! ¿Cómo vas con el proyecto?', mio: false, fecha: new Date().toISOString() },
  { id: 2, texto: 'Todo bien, cambiando algunas cartas.', mio: true, fecha: new Date().toISOString() },
  // 🔄 EJEMPLO 1: Propuesta recibida que puedes Aceptar o Rechazar
  {
    id: 10,
    mio: false,
    esIntercambio: true,
    fecha: new Date().toISOString(),
    propuesta: {
      id: 501,
      loginDestino: 'amigo_normal',
      estado: 'pendiente', // 'pendiente', 'aceptado', 'rechazado'
      expiraEn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Expira en 3 días
      cartaOfrecida: { id: 201, nombre: 'Norminette', imagen: '👾' },
      cartaPedida: { id: 101, nombre: '42 Logo Holo', imagen: '🃏' },
    },
  },
  // 🔄 EJEMPLO 2: Propuesta enviada por ti (en espera de que el otro responda)
  {
    id: 11,
    mio: true,
    esIntercambio: true,
    fecha: new Date().toISOString(),
    propuesta: {
      id: 502,
      loginDestino: 'amigo_normal',
      estado: 'pendiente',
      expiraEn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      cartaOfrecida: { id: 102, nombre: 'Piscina C', imagen: '🎴' },
      cartaPedida: { id: 202, nombre: 'Baguette 42', imagen: '🥖' },
    },
  },
],
  amigo_bloqueado_por_mi: [
    { id: 3, texto: 'Mensaje antiguo antes de que lo bloquearas.', mio: false, fecha: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, texto: 'Vale, recibido.', mio: true, fecha: new Date(Date.now() - 86400000).toISOString() },
  ],
  amigo_que_me_bloqueo: [
    { id: 5, texto: 'Hola, ¿hablamos luego?', mio: true, fecha: new Date(Date.now() - 172800000).toISOString() },
    { id: 6, texto: 'Historial previo intacto.', mio: false, fecha: new Date(Date.now() - 172800000).toISOString() },
  ],
};
/* ===========================================================================
   [MOCK TEMPORAL FRONTEND - FIN]
   =========================================================================== */

function obtenerFotoPerfil(usuario) {
  return (
    <img
      src={usuario.profile_image}
      alt={usuario.username}
      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
    />
  );
}

function adaptarAmigo(usuario) {
  return {
    id: usuario.id,
    login: usuario.username,
    nombre: usuario.nombre,
    avatar: obtenerFotoPerfil(usuario),
    estado: TEXTO_ESTADO[usuario.estado] || usuario.estado,
    bloqueado: usuario.bloqueado || false,
    meHaBloqueado: usuario.me_ha_bloqueado || false,
  };
}

function adaptarSolicitud(solicitud) {
  return {
    id: solicitud.id,
    login: solicitud.sender.username,
    nombre: solicitud.sender.nombre,
    avatar: obtenerFotoPerfil(solicitud.sender),
  };
}

function adaptarCandidato(usuarioCandidato) {
  return {
    id: usuarioCandidato.id,
    login: usuarioCandidato.username,
    nombre: usuarioCandidato.nombre,
    avatar: obtenerFotoPerfil(usuarioCandidato),
  };
}

async function pedirTokenCSRF() {
  const respuesta = await fetch(`${API}/users/csrf/`, { credentials: 'include' });
  const datos = await respuesta.json();
  return datos.csrfToken;
}

function ChatSocial() {
  const navigate = useNavigate();

  const [chatSeleccionado, setChatSeleccionado] = useState(null);
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalBuscarAbierto, setModalBuscarAbierto] = useState(false);
  const [modalSolicitudesAbierto, setModalSolicitudesAbierto] = useState(false);

  const [solicitudes, setSolicitudes] = useState([]);
  const [candidatos, setCandidatos] = useState([]);

  const recargarDatosSociales = async () => {
    try {
      const [resAmigos, resSolicitudes, resSinLeer] = await Promise.all([
        fetch(`${API}/social/amigos/`, { credentials: 'include' }),
        fetch(`${API}/social/solicitudes/pendientes/`, { credentials: 'include' }),
        fetch(`${API}/chat/sin-leer/`, { credentials: 'include' }),
      ]);

      if (resAmigos.status === 401 || resAmigos.status === 403) {
        setError('Tienes que iniciar sesión para ver tus amigos.');
        return;
      }

      if (!resAmigos.ok) {
        /* ===========================================================================
           [MOCK TEMPORAL FRONTEND - INICIO]
           Si falla la petición al Backend, cargamos los datos mock de prueba.
           =========================================================================== */
        console.warn('Backend no disponible/sin datos. Usando MOCK temporal.');
        setAmigos(AMIGOS_MOCK_PRUEBAS);
        setError('');
        return;
        /* ===========================================================================
           [MOCK TEMPORAL FRONTEND - FIN]
           =========================================================================== */
      }

      setError('');

      let mapaMensajesSinLeer = {};
      if (resSinLeer.ok) {
        const datosSinLeer = await resSinLeer.json();
        mapaMensajesSinLeer = datosSinLeer.por_persona || {};
      }

      const listaAmigosServidor = await resAmigos.json();
      
      /* ===========================================================================
         [MOCK TEMPORAL FRONTEND - INICIO]
         Si la lista de la API real está vacía, rellenamos con el mock para pruebas visuales.
         =========================================================================== */
      if (listaAmigosServidor.length === 0) {
        setAmigos(AMIGOS_MOCK_PRUEBAS);
      } else {
        setAmigos(
          listaAmigosServidor.map((usuario) => ({
            ...adaptarAmigo(usuario),
            sinLeer: mapaMensajesSinLeer[usuario.username] || 0,
          }))
        );
      }
      /* ===========================================================================
         [MOCK TEMPORAL FRONTEND - FIN]
         Remplazar el bloque anterior por:
         setAmigos(listaAmigosServidor.map((usuario) => ({ ...adaptarAmigo(usuario), sinLeer: mapaMensajesSinLeer[usuario.username] || 0 })));
         =========================================================================== */

      if (resSolicitudes.ok) {
        const datosSolicitudes = await resSolicitudes.json();
        setSolicitudes((datosSolicitudes.received || []).map(adaptarSolicitud));
      }
    } catch (err) {
      console.error('Error al cargar amigos y solicitudes:', err);
      /* ===========================================================================
         [MOCK TEMPORAL FRONTEND - INICIO]
         =========================================================================== */
      setAmigos(AMIGOS_MOCK_PRUEBAS);
      setError('');
      /* ===========================================================================
         [MOCK TEMPORAL FRONTEND - FIN]
         Al juntar con el backend, descomentar: setError('No se ha podido conectar con el servidor.');
         =========================================================================== */
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    recargarDatosSociales();
  }, []);

  useEffect(() => {
    let estaMontado = true;
    const intervaloSinLeer = setInterval(async () => {
      try {
        const respuesta = await fetch(`${API}/chat/sin-leer/`, { credentials: 'include' });
        if (!estaMontado || !respuesta.ok) return;
        const datos = await respuesta.json();
        const mapaSinLeer = datos.por_persona || {};
        setAmigos((prevAmigos) =>
          prevAmigos.map((amigo) => ({
            ...amigo,
            sinLeer: mapaSinLeer[amigo.login] || 0,
          }))
        );
      } catch (err) {
        /* Error de red silencioso */
      }
    }, 10000);

    return () => {
      estaMontado = false;
      clearInterval(intervaloSinLeer);
    };
  }, []);

  const [mensajes, setMensajes] = useState([]);
  const [borrador, setBorrador] = useState('');
  const [enviando, setEnviando] = useState(false);
  const ultimoMensajeIdRef = useRef(null);

  const loginUsuarioSeleccionado = chatSeleccionado?.login || null;

  useEffect(() => {
    if (!loginUsuarioSeleccionado) {
      setMensajes([]);
      return undefined;
    }

    let estaMontado = true;
    ultimoMensajeIdRef.current = null;
    setMensajes([]);

    setAmigos((prevAmigos) =>
      prevAmigos.map((amigo) =>
        amigo.login === loginUsuarioSeleccionado ? { ...amigo, sinLeer: 0 } : amigo
      )
    );

    async function obtenerMensajes() {
      try {
        const idUltimo = ultimoMensajeIdRef.current;
        const urlPeticion =
          `${API}/chat/${encodeURIComponent(loginUsuarioSeleccionado)}/` +
          (idUltimo ? `?desde=${idUltimo}` : '');

        const respuesta = await fetch(urlPeticion, { credentials: 'include' });
        if (!estaMontado || !respuesta.ok) {
          /* ===========================================================================
             [MOCK TEMPORAL FRONTEND - INICIO]
             =========================================================================== */
          if (MENSAJES_MOCK_PRUEBAS[loginUsuarioSeleccionado]) {
            setMensajes(MENSAJES_MOCK_PRUEBAS[loginUsuarioSeleccionado]);
          }
          /* ===========================================================================
             [MOCK TEMPORAL FRONTEND - FIN]
             =========================================================================== */
          return;
        }

        const datosRespuesta = await respuesta.json();
        const nuevosMensajes = datosRespuesta.mensajes || [];
        if (!nuevosMensajes.length) return;

        ultimoMensajeIdRef.current = nuevosMensajes[nuevosMensajes.length - 1].id;
        setMensajes((prevMensajes) =>
          idUltimo ? [...prevMensajes, ...nuevosMensajes] : nuevosMensajes
        );
      } catch (err) {
        console.error('Error al cargar la conversación:', err);
        /* ===========================================================================
           [MOCK TEMPORAL FRONTEND - INICIO]
           =========================================================================== */
        if (MENSAJES_MOCK_PRUEBAS[loginUsuarioSeleccionado]) {
          setMensajes(MENSAJES_MOCK_PRUEBAS[loginUsuarioSeleccionado]);
        }
        /* ===========================================================================
           [MOCK TEMPORAL FRONTEND - FIN]
           =========================================================================== */
      }
    }

    obtenerMensajes();
    const intervaloChat = setInterval(obtenerMensajes, 3000);

    return () => {
      estaMontado = false;
      clearInterval(intervaloChat);
    };
  }, [loginUsuarioSeleccionado]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    const textoLimpio = borrador.trim();
    if (!textoLimpio || enviando) return;

    if (textoLimpio.length > LARGO_MAXIMO) {
      alert(`El mensaje no puede pasar de ${LARGO_MAXIMO} caracteres.`);
      return;
    }

    setEnviando(true);
    try {
      const token = await pedirTokenCSRF();
      const respuesta = await fetch(`${API}/chat/${encodeURIComponent(loginUsuarioSeleccionado)}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
        body: JSON.stringify({ texto: textoLimpio }),
      });
      const datosRespuesta = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        /* ===========================================================================
           [MOCK TEMPORAL FRONTEND - INICIO]
           =========================================================================== */
        const nuevoMsgMock = {
          id: Date.now(),
          texto: textoLimpio,
          mio: true,
          fecha: new Date().toISOString(),
        };
        setMensajes((prev) => [...prev, nuevoMsgMock]);
        if (MENSAJES_MOCK_PRUEBAS[loginUsuarioSeleccionado]) {
          MENSAJES_MOCK_PRUEBAS[loginUsuarioSeleccionado].push(nuevoMsgMock);
        }
        setBorrador('');
        setEnviando(false);
        return;
        /* ===========================================================================
           [MOCK TEMPORAL FRONTEND - FIN]
           Al juntar con backend, borrar este bloque del if(!respuesta.ok) superior
           =========================================================================== */
      }

      setMensajes((prevMensajes) => [...prevMensajes, datosRespuesta]);
      ultimoMensajeIdRef.current = datosRespuesta.id;
      setBorrador('');
    } catch (err) {
      console.error('Error al enviar el mensaje:', err);
      /* ===========================================================================
         [MOCK TEMPORAL FRONTEND - INICIO]
         =========================================================================== */
      const nuevoMsgMock = {
        id: Date.now(),
        texto: textoLimpio,
        mio: true,
        fecha: new Date().toISOString(),
      };
      setMensajes((prev) => [...prev, nuevoMsgMock]);
      setBorrador('');
      /* ===========================================================================
         [MOCK TEMPORAL FRONTEND - FIN]
         =========================================================================== */
    } finally {
      setEnviando(false);
    }
  };

  const clickVolverHome = () => navigate('/Home');
  const visitarPerfil = (login) => navigate(`/perfil/${login}`);

  const alternarBloqueoUsuario = async (loginTarget) => {
    let nuevoEstadoBloqueo = false;

    setAmigos((prevAmigos) =>
      prevAmigos.map((amigo) => {
        if (amigo.login === loginTarget) {
          nuevoEstadoBloqueo = !amigo.bloqueado;
          return { ...amigo, bloqueado: nuevoEstadoBloqueo };
        }
        return amigo;
      })
    );

    if (chatSeleccionado && chatSeleccionado.login === loginTarget) {
      setChatSeleccionado((prev) => ({ ...prev, bloqueado: nuevoEstadoBloqueo }));
    }

    /* Petición HTTP al backend para guardar el bloqueo en Base de Datos */
    try {
      const token = await pedirTokenCSRF();
      await fetch(`${API}/social/bloquear/${encodeURIComponent(loginTarget)}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
      });
    } catch (err) {
      console.error('Error al notificar bloqueo al backend:', err);
    }
  };

  const abrirBuscadorAmigos = async () => {
    setModalBuscarAbierto(true);
    try {
      const respuesta = await fetch(`${API}/social/buscar/`, { credentials: 'include' });
      if (respuesta.ok) {
        const estudiantes = await respuesta.json();
        setCandidatos(estudiantes.map(adaptarCandidato));
      }
    } catch (err) {
      console.error('Error al buscar gente:', err);
    }
  };

  const agregarNuevoAmigo = async (usuarioObjetivo) => {
    try {
      const token = await pedirTokenCSRF();
      const respuesta = await fetch(`${API}/social/solicitudes/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
        body: JSON.stringify({ receiver_id: usuarioObjetivo.id }),
      });
      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        const motivoError = Array.isArray(datos.non_field_errors)
          ? datos.non_field_errors[0]
          : datos.detail;
        alert(motivoError || 'No se ha podido enviar la solicitud.');
        return;
      }
      alert(`Solicitud enviada a ${usuarioObjetivo.nombre}. Aparecerá en tu lista cuando la acepte.`);
      setCandidatos((prev) => prev.filter((candidato) => candidato.id !== usuarioObjetivo.id));
    } catch (err) {
      console.error('Error al enviar la solicitud:', err);
      alert('No se ha podido conectar con el servidor.');
    }
  };

  const responderSolicitud = async (idSolicitud, accion) => {
    try {
      const token = await pedirTokenCSRF();
      const respuesta = await fetch(`${API}/social/solicitudes/${idSolicitud}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
        body: JSON.stringify({ action: accion === 'aceptar' ? 'accept' : 'decline' }),
      });
      if (!respuesta.ok) {
        alert('No se ha podido responder a la solicitud.');
        return;
      }
      await recargarDatosSociales();
    } catch (err) {
      console.error('Error al responder la solicitud:', err);
      alert('No se ha podido conectar con el servidor.');
    }
  };

  return (
    <div className={`chat-main-container${chatSeleccionado ? ' has-selected-chat' : ''}`}>
      {/* 1. COLUMNA IZQUIERDA */}
      <ListaChats
        amigos={amigos}
        chatSeleccionado={chatSeleccionado}
        setChatSeleccionado={setChatSeleccionado}
        clickVolverHome={clickVolverHome}
        visitarPerfil={visitarPerfil}
        alternarBloqueoUsuario={alternarBloqueoUsuario}
        abrirModalAmigos={abrirBuscadorAmigos}
        abrirModalSolicitudes={() => setModalSolicitudesAbierto(true)}
        numSolicitudesPendientes={solicitudes.length}
      />

      <BuscarAmigos
        isOpen={modalBuscarAbierto}
        onClose={() => setModalBuscarAbierto(false)}
        usuarios={candidatos}
        agregarAmigo={agregarNuevoAmigo}
      />

      <SolicitudesRecibidas
        isOpen={modalSolicitudesAbierto}
        onClose={() => setModalSolicitudesAbierto(false)}
        solicitudes={solicitudes}
        responderSolicitud={responderSolicitud}
      />

      <AreaChat
        chatSeleccionado={chatSeleccionado}
        setChatSeleccionado={setChatSeleccionado}
        mensajes={mensajes}
        borrador={borrador}
        setBorrador={setBorrador}
        enviando={enviando}
        enviarMensaje={enviarMensaje}
        visitarPerfil={visitarPerfil}
        alternarBloqueoUsuario={alternarBloqueoUsuario}
        cargando={cargando}
        error={error}
        amigos={amigos}
      />
    </div>
  );
}

export default ChatSocial;