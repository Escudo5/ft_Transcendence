// ChatSocial.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ListaChats from './ListaChats';
import BuscarAmigos from './BuscarAmigos';
import SolicitudesRecibidas from './SolicitudesRecibidas';
import AreaChat from './AreaChat';
import { adaptarPropuesta } from './Intercambio';
import './Chat.css';

const API = import.meta.env.VITE_API_URL || '/api';

const TEXTO_ESTADO = {
  online: 'En línea',
  ingame: 'Jugando',
  offline: 'Desconectado',
};

const LARGO_MAXIMO = 1000;


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
        // Nacho, 10/09: aquí se cargaban amigos inventados cuando el servidor
        // fallaba. Se quita, como dejó dicho Konrad al escribirlo: si algo va
        // mal hay que verlo, no taparlo con datos falsos. En una evaluación,
        // una pantalla que finge funcionar es peor que una que da error.
        setError('No se han podido cargar tus amigos. Inténtalo en un momento.');
        return;
      }

      setError('');

      let mapaMensajesSinLeer = {};
      if (resSinLeer.ok) {
        const datosSinLeer = await resSinLeer.json();
        mapaMensajesSinLeer = datosSinLeer.por_persona || {};
      }

      const listaAmigosServidor = await resAmigos.json();
      
      // Exactamente lo que Konrad dejó escrito que había que poner aquí al
      // juntarlo con el backend. Si no tienes amigos, la lista sale vacía y la
      // pantalla ya sabe decir "todavía no tienes amigos".
      setAmigos(
        listaAmigosServidor.map((usuario) => ({
          ...adaptarAmigo(usuario),
          sinLeer: mapaMensajesSinLeer[usuario.username] || 0,
        }))
      );

      if (resSolicitudes.ok) {
        const datosSolicitudes = await resSolicitudes.json();
        setSolicitudes((datosSolicitudes.received || []).map(adaptarSolicitud));
      }
    } catch (err) {
      console.error('Error al cargar amigos y solicitudes:', err);
      // Lo que Konrad dejó dicho que había que descomentar al juntarlo.
      setError('No se ha podido conectar con el servidor.');
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

  // 🔄 Las propuestas de intercambio de esta conversación (Nacho, 10/09).
  //
  // Van en un estado APARTE de los mensajes, y no mezcladas en la misma
  // petición, porque son dos cosas distintas: los mensajes solo crecen (se
  // piden los nuevos con ?desde=<id> y se añaden al final), pero una
  // propuesta CAMBIA: pasa de pendiente a aceptada, o caduca a los 3 días.
  // Si viviera dentro de la lista de mensajes habría que ir buscándola para
  // actualizarla. Así se vuelve a pedir la lista entera cada vez y ya está.
  const [propuestas, setPropuestas] = useState([]);
  // Un contador que solo sirve para forzar que se vuelvan a pedir: al subirlo,
  // el efecto de abajo se dispara otra vez.
  const [refrescoIntercambios, setRefrescoIntercambios] = useState(0);

  const loginUsuarioSeleccionado = chatSeleccionado?.login || null;

  useEffect(() => {
    if (!loginUsuarioSeleccionado) {
      setMensajes([]);
      setPropuestas([]);
      return undefined;
    }

    let estaMontado = true;
    ultimoMensajeIdRef.current = null;
    setMensajes([]);
    setPropuestas([]);

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
        if (!estaMontado) return;
        if (!respuesta.ok) {
          // Nacho, 10/09: aquí se enseñaba una conversación inventada cuando
          // el servidor fallaba. Fuera. Se deja lo que hubiera y se avisa: la
          // conversación se sigue pidiendo cada 3 segundos, así que si el
          // servidor vuelve, se arregla solo.
          setError('No se han podido cargar los mensajes.');
          return;
        }
        setError('');

        const datosRespuesta = await respuesta.json();
        const nuevosMensajes = datosRespuesta.mensajes || [];
        if (!nuevosMensajes.length) return;

        ultimoMensajeIdRef.current = nuevosMensajes[nuevosMensajes.length - 1].id;
        setMensajes((prevMensajes) =>
          idUltimo ? [...prevMensajes, ...nuevosMensajes] : nuevosMensajes
        );
      } catch (err) {
        console.error('Error al cargar la conversación:', err);
        setError('No se ha podido conectar con el servidor.');
      }
    }

    obtenerMensajes();
    const intervaloChat = setInterval(obtenerMensajes, 3000);

    return () => {
      estaMontado = false;
      clearInterval(intervaloChat);
    };
  }, [loginUsuarioSeleccionado]);

  // 🔄 LAS PROPUESTAS DE INTERCAMBIO DE ESTA CONVERSACIÓN (Nacho, 10/09)
  //
  // Ciclo aparte del de los mensajes, y no por capricho: al refrescar las
  // propuestas (por ejemplo justo después de aceptar una) no queremos vaciar
  // y volver a pedir la conversación entera, que es lo que hace el otro
  // efecto cada vez que se dispara.
  //
  // Aquí se pide la lista COMPLETA cada vez, sin el ?desde=<id> de los
  // mensajes. Es a propósito: un mensaje solo se añade, pero una propuesta
  // cambia de estado (pendiente -> aceptada) o caduca a los 3 días, así que
  // hay que volver a mirarlas todas. Son como mucho un puñado.
  useEffect(() => {
    if (!loginUsuarioSeleccionado) {
      setPropuestas([]);
      return undefined;
    }

    let estaMontado = true;

    async function obtenerPropuestas() {
      try {
        const respuesta = await fetch(`${API}/cards/intercambios/`, { credentials: 'include' });
        if (!estaMontado || !respuesta.ok) return;

        const datos = await respuesta.json();
        // El servidor manda TODAS mis propuestas vivas, con cualquiera; aquí
        // nos quedamos con las de esta conversación. Las aceptadas, las
        // rechazadas y las de más de 3 días ya no vienen.
        const suyas = [...(datos.recibidos || []), ...(datos.enviados || [])]
          .filter((i) => i.de === loginUsuarioSeleccionado || i.para === loginUsuarioSeleccionado)
          .map((i) => ({
            // 'int-' delante porque AreaChat usa el id como clave de React, y
            // mensajes e intercambios son tablas distintas: un mensaje con id
            // 7 y un intercambio con id 7 chocarían.
            id: `int-${i.id}`,
            mio: i.mio,
            fecha: i.fecha,
            esIntercambio: true,
            propuesta: adaptarPropuesta(i),
          }));
        if (estaMontado) setPropuestas(suyas);
      } catch (err) {
        console.error('Error al cargar los intercambios:', err);
      }
    }

    obtenerPropuestas();
    const intervalo = setInterval(obtenerPropuestas, 3000);

    return () => {
      estaMontado = false;
      clearInterval(intervalo);
    };
  }, [loginUsuarioSeleccionado, refrescoIntercambios]);

  // Lo llama AreaChat justo después de proponer, aceptar o rechazar, para que
  // se vea al momento y no haya que esperar a la siguiente vuelta de 3s.
  const recargarIntercambios = () => setRefrescoIntercambios((n) => n + 1);

  // Mensajes y propuestas, juntos y por orden de fecha, para que cada
  // propuesta salga en el punto de la conversación en el que se hizo.
  const mensajesConIntercambios = [...mensajes, ...propuestas]
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

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
        // ⚠️ Nacho, 10/09: ESTE ERA EL PEOR DE LOS TRES.
        //
        // Cuando el servidor rechazaba el mensaje, se pintaba igual en la
        // pantalla y se borraba el cuadro de texto. O sea que veías tu mensaje
        // enviado y el otro no lo recibía nunca, sin ningún aviso. Y el
        // servidor rechaza mensajes por motivos de verdad: si os habéis
        // bloqueado, si ya no sois amigos, o si pasa de 1000 caracteres.
        //
        // Ahora se enseña el motivo que dé el servidor y NO se borra lo
        // escrito, para que no haya que teclearlo otra vez.
        setError(datosRespuesta.detail || datosRespuesta.error
                 || 'No se ha podido enviar el mensaje.');
        return;
      }

      setMensajes((prevMensajes) => [...prevMensajes, datosRespuesta]);
      ultimoMensajeIdRef.current = datosRespuesta.id;
      setBorrador('');
    } catch (err) {
      console.error('Error al enviar el mensaje:', err);
      // Igual que arriba: no se finge que se ha enviado, y el texto se queda
      // escrito para poder reintentarlo.
      setError('No se ha podido enviar el mensaje. Revisa la conexión.');
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
        mensajes={mensajesConIntercambios}
        recargarIntercambios={recargarIntercambios}
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