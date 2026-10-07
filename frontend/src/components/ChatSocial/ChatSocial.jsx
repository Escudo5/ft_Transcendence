// ChatSocial.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ListaChats from './ListaChats';
import BuscarAmigos from './BuscarAmigos';
import SolicitudesRecibidas from './SolicitudesRecibidas';
import AreaChat from './AreaChat';
import { adaptarPropuesta } from './Intercambio';
import { useI18n } from '../../i18n';
import './Chat.css';

const API = import.meta.env.VITE_API_URL || '/api';

const TEXTO_ESTADO = {
  online: 'statusOnline',
  offline: 'statusOffline',
};

const LARGO_MAXIMO = 1000;


function obtenerFotoPerfil(usuario,ancho="75px",alto="75px") {
  return (
    <img
      src={usuario.profile_image}
      alt={usuario.username}
      style={{ width: ancho, height: alto, borderRadius: '50%', objectFit: 'cover' }}
    />
  );
}

function adaptarAmigo(usuario) {
  return {
    id: usuario.id,
    login: usuario.username,
    nombre: usuario.nombre,
    avatar: obtenerFotoPerfil(usuario,"50px","50px"),
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
    avatar: obtenerFotoPerfil(solicitud.sender,"75px","75px"),
  };
}

function adaptarCandidato(usuarioCandidato) {
  return {
    id: usuarioCandidato.id,
    login: usuarioCandidato.username,
    nombre: usuarioCandidato.nombre,
    avatar: obtenerFotoPerfil(usuarioCandidato,"75px","75px"),
  };
}

// La bolita de cada persona cuenta lo que te espera de ella: sus mensajes sin
// leer y sus propuestas de intercambio sin responder.
function pendientesPorPersona(datosSinLeer) {
  const pendientes = { ...(datosSinLeer.por_persona || {}) };
  for (const [login, n] of Object.entries(datosSinLeer.intercambios_por_persona || {})) {
    pendientes[login] = (pendientes[login] || 0) + n;
  }
  return pendientes;
}

async function pedirTokenCSRF() {
  const respuesta = await fetch(`${API}/users/csrf/`, { credentials: 'include' });
  const datos = await respuesta.json();
  return datos.csrfToken;
}

function ChatSocial() {
  const { t } = useI18n();
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
        setError(t('friendsLoginRequired'));
        return;
      }

      if (!resAmigos.ok) {
        setError(t('friendsLoadError'));
        return;
      }

      setError('');

      let mapaMensajesSinLeer = {};
      if (resSinLeer.ok) {
        const datosSinLeer = await resSinLeer.json();
        mapaMensajesSinLeer = pendientesPorPersona(datosSinLeer);
      }

      const listaAmigosServidor = await resAmigos.json();
      
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
      setError(t('serverError'));
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
        const mapaSinLeer = pendientesPorPersona(datos);
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
          setError(t('messagesLoadError'));
          return;
        }
        setError('');

        const datosRespuesta = await respuesta.json();
        const nuevosMensajes = datosRespuesta.mensajes || [];
        if (!nuevosMensajes.length) return;

        // La referencia se mueve al id más alto RECIBIDO, no al último de la
        // lista: el servidor ordena por fecha y el filtro va por id, y aunque
        // en la práctica coinciden, así no depende de que coincidan.
        ultimoMensajeIdRef.current = Math.max(
          ultimoMensajeIdRef.current || 0,
          ...nuevosMensajes.map((m) => m.id)
        );

        setMensajes((prevMensajes) => {
          if (!idUltimo) return nuevosMensajes;
          // Sin repetir: tu propio mensaje ya se pintó al enviarlo y vuelve a
          // llegar en este refresco. Y ordenados por id, porque el tuyo se
          // pintó antes de que llegara el del otro aunque sea posterior.
          const yaEstan = new Set(prevMensajes.map((m) => m.id));
          const aAñadir = nuevosMensajes.filter((m) => !yaEstan.has(m.id));
          if (!aAñadir.length) return prevMensajes;
          return [...prevMensajes, ...aAñadir].sort((a, b) => a.id - b.id);
        });
      } catch (err) {
        console.error('Error al cargar la conversación:', err);
        setError(t('serverError'));
      }
    }

    obtenerMensajes();
    const intervaloChat = setInterval(obtenerMensajes, 3000);

    return () => {
      estaMontado = false;
      clearInterval(intervaloChat);
    };
  }, [loginUsuarioSeleccionado]);


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
      alert(t('messageTooLong', { max: LARGO_MAXIMO }));
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
        // Cuando el servidor rechazaba el mensaje, se pintaba igual en la
        // pantalla y se borraba el cuadro de texto. O sea que veías tu mensaje
        // enviado y el otro no lo recibía nunca, sin ningún aviso. Y el
        // servidor rechaza mensajes por motivos de verdad: si os habéis
        // bloqueado, si ya no sois amigos, o si pasa de 1000 caracteres.
        //
        // Ahora se enseña el motivo que dé el servidor y NO se borra lo
        // escrito, para que no haya que teclearlo otra vez.
        setError(datosRespuesta.detail || datosRespuesta.error
                 || t('messageSendError'));
        return;
      }

      // Se pinta ya, para verlo al instante sin esperar al refresco.
      setMensajes((prevMensajes) => [...prevMensajes, datosRespuesta]);

      // ⚠️ AQUÍ ESTABA EL FALLO DE LOS MENSAJES PERDIDOS, y por eso NO se
      // toca la referencia (Nacho, 5/10).
      //
      // Había un `ultimoMensajeIdRef.current = datosRespuesta.id`. El refresco
      // pide ?desde=<referencia> y el servidor filtra id > desde, así que al
      // apuntar el id DE TU MENSAJE te saltabas los del otro con id menor:
      //
      //   vais por el 98 · el otro manda el 99 · tú mandas el 100
      //   la referencia salta a 100 · el 99 no vuelve NUNCA
      //
      // Quedaba guardado en la base y no se pintaba. Dejándola en el último id
      // RECIBIDO, el siguiente refresco trae el 99 y el 100, y el de arriba se
      // encarga de no repetir el tuyo y de ordenarlos.
      setBorrador('');
    } catch (err) {
      console.error('Error al enviar el mensaje:', err);
      // Igual que arriba: no se finge que se ha enviado, y el texto se queda
      // escrito para poder reintentarlo.
      setError(t('messageSendError'));
    } finally {
      setEnviando(false);
    }
  };

  const clickVolverHome = () => navigate('/Home');
  const visitarPerfil = (login) => navigate(`/perfil/${login}`);

  const alternarBloqueoUsuario = async (loginTarget) => {
    const amigoTarget = amigos.find((a) => a.login === loginTarget);
    const estaBloqueado = amigoTarget ? amigoTarget.bloqueado : false;

    const metodoHTTP = estaBloqueado ? 'DELETE' : 'POST';
    const nuevoEstado = !estaBloqueado;

    // Actualización optimista de UI
    setAmigos((prevAmigos) =>
      prevAmigos.map((amigo) => {
        if (amigo.login === loginTarget) {
          return { ...amigo, bloqueado: nuevoEstado };
        }
        return amigo;
      })
    );

    if (chatSeleccionado && chatSeleccionado.login === loginTarget) {
      setChatSeleccionado((prev) => ({ ...prev, bloqueado: nuevoEstado }));
    }

    try {
      const token = await pedirTokenCSRF();
      const respuesta = await fetch(`${API}/social/bloquear/${encodeURIComponent(loginTarget)}/`, {
        method: metodoHTTP,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
      });

      if (!respuesta.ok) {
        console.error('Error al actualizar el estado de bloqueo en servidor');
        recargarDatosSociales();
      }
    } catch (err) {
      console.error('Error al notificar bloqueo al backend:', err);
      recargarDatosSociales();
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
        alert(motivoError || t('friendRequestSendError'));
        return;
      }
      alert(t('friendRequestSent', { name: usuarioObjetivo.nombre }));
      setCandidatos((prev) => prev.filter((candidato) => candidato.id !== usuarioObjetivo.id));
    } catch (err) {
      console.error('Error al enviar la solicitud:', err);
      alert(t('serverError'));
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
        alert(t('friendRequestReplyError'));
        return;
      }
      await recargarDatosSociales();
    } catch (err) {
      console.error('Error al responder la solicitud:', err);
      alert(t('serverError'));
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