import { useState, useEffect } from "react";
import { RAREZAS, CLASE_RAREZA } from "../rarezas";
import ModalContratos from "./Contratos";
import BotonAbrirSobres from "../TiendaSobres/BotonAbrirSobres";
import { useI18n } from "../../i18n";

// Subcomponentes refactorizados
import CabeceraCatalogo from "./CatalogoComponents/CabeceraCatalogo";
import PanelFiltrosCatalogo from "./CatalogoComponents/PanelFiltrosCatalogo";
import ModalDetalleCarta from "./CatalogoComponents/ModalDetalleCarta";
import TarjetaCarta from "./CatalogoComponents/TarjetaCarta";
import PaginacionCatalogo from "./CatalogoComponents/PaginacionCatalogo";

const ORDEN_TIERS = [...RAREZAS].reverse();
const CARTAS_POR_PAGINA = 8;

export default function Catalogo() {
  const { t } = useI18n();
  const urlBaseApi = import.meta.env.VITE_API_URL || "/api";

  // Estados de datos principales
  const [listaColeccion, setListaColeccion] = useState([]);
  const [estaCargando, setEstaCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");

  // Estados de control de filtros
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [filtroRareza, setFiltroRareza] = useState("all");
  const [filtroTiempo, setFiltroTiempo] = useState("all");
  const [criterioOrdenacion, setCriterioOrdenacion] = useState("login");

  // Estados de paginación y modales
  const [paginaActual, setPaginaActual] = useState(1);
  const [modalContratosAbierto, setModalContratosAbierto] = useState(false);
  const [contadorRefresco, setContadorRefresco] = useState(0);

  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);
  const [loginsRegistradosWeb, setLoginsRegistradosWeb] = useState(new Set());

  // 1. Carga del álbum desde la API
  useEffect(() => {
    async function obtenerAlbumUsuario() {
      try {
        const respuesta = await fetch(`${urlBaseApi}/cards/album/`, { credentials: "include" });

        if (respuesta.status === 401 || respuesta.status === 403) {
          setMensajeError(t("loginRequired"));
          return;
        }
        if (!respuesta.ok) {
          setMensajeError(t("albumLoadError"));
          return;
        }

        const datos = await respuesta.json();

        setListaColeccion(
          (datos || []).map((item) => {
            const nivelBruto = item.card?.cursus_lvl ?? 0;
            // 💡 Solución definitiva: Formateo de float a max 2 decimales limpios
            const nivelLimpio = parseFloat(Number(nivelBruto).toFixed(2));

            return {
              idInstancia: item.id,
              idCartaBase: item.card?.id,
              cantidadCopias: item.cantidad ?? 1,
              loginUsuario: item.card?.login || "",
              tituloPersonalizado: item.card?.title || item.card?.login || "",
              nombreCoalicion: item.card?.coalition || t("noCoalition"),
              urlFoto: item.card?.photo,
              categoriaTier: item.card?.tier || "Junior",
              rarezaCss: CLASE_RAREZA[item.card?.tier] || "common",
              nivelFormateado: nivelLimpio,
              puntosEvaluacion: item.card?.eval_point ?? 0,
              saldoAltarians: item.card?.altarians ?? 0,
              fechaObtencion: item.fecha_obtencion || item.created_at || item.obtenida_en || null,
            };
          }),
        );
      } catch (e) {
        console.error("Error al cargar el álbum:", e);
        setMensajeError(t("serverError"));
      } finally {
        setEstaCargando(false);
      }
    }

    obtenerAlbumUsuario();
  }, [urlBaseApi, contadorRefresco, t]);

  // 2. Consulta secundaria de usuarios registrados en la plataforma
  useEffect(() => {
    if (listaColeccion.length === 0) return;
    let consultaCancelada = false;

    async function verificarUsuariosRegistrados() {
      try {
        const listaLogins = [...new Set(listaColeccion.map((c) => c.loginUsuario))].filter(Boolean);
        const respuesta = await fetch(
          `${urlBaseApi}/users/list/?logins=${encodeURIComponent(listaLogins.join(","))}`,
          { credentials: "include" },
        );

        if (!respuesta.ok) return;
        const datos = await respuesta.json();
        if (consultaCancelada) return;

        setLoginsRegistradosWeb(new Set((datos.users || []).map((u) => u.username)));
      } catch (e) {
        console.error("No se ha podido consultar el registro de usuarios:", e);
      }
    }

    verificarUsuariosRegistrados();

    return () => { consultaCancelada = true; };
  }, [listaColeccion, urlBaseApi]);

  // 3. Reseteo de página al cambiar cualquier filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [textoBusqueda, filtroRareza, criterioOrdenacion, filtroTiempo]);

  // Lógica de filtrado
  const cartasFiltradas = listaColeccion.filter((carta) => {
    const textoBuscado = textoBusqueda.toLowerCase();
    const coincideTexto =
      carta.loginUsuario.toLowerCase().includes(textoBuscado) ||
      carta.tituloPersonalizado.toLowerCase().includes(textoBuscado) ||
      carta.nombreCoalicion.toLowerCase().includes(textoBuscado);

    const coincideRareza = filtroRareza === "all" || carta.categoriaTier === filtroRareza;

    let coincideTiempo = true;
    if (filtroTiempo !== "all" && carta.fechaObtencion) {
      const fechaCarta = new Date(carta.fechaObtencion);
      const fechaActual = new Date();
      const diferenciaDias = (fechaActual - fechaCarta) / (1000 * 60 * 60 * 24);

      if (filtroTiempo === "24h") coincideTiempo = diferenciaDias <= 1;
      else if (filtroTiempo === "7d") coincideTiempo = diferenciaDias <= 7;
      else if (filtroTiempo === "30d") coincideTiempo = diferenciaDias <= 30;
    }

    return coincideTexto && coincideRareza && coincideTiempo;
  });

  // Lógica de ordenación
  const cartasOrdenadas = [...cartasFiltradas].sort((a, b) => {
    if (criterioOrdenacion === "login") return a.loginUsuario.localeCompare(b.loginUsuario);
    if (criterioOrdenacion === "nivel") return b.nivelFormateado - a.nivelFormateado;
    if (criterioOrdenacion === "repetidas") return b.cantidadCopias - a.cantidadCopias;
    if (criterioOrdenacion === "rareza") return ORDEN_TIERS.indexOf(a.categoriaTier) - ORDEN_TIERS.indexOf(b.categoriaTier);
    return 0;
  });

  // Paginación
  const totalCartas = cartasOrdenadas.length;
  const totalPaginas = Math.ceil(totalCartas / CARTAS_POR_PAGINA) || 1;
  const paginaValidaActual = paginaActual > totalPaginas ? totalPaginas : paginaActual;

  const indiceUltimoItem = paginaValidaActual * CARTAS_POR_PAGINA;
  const indicePrimerItem = indiceUltimoItem - CARTAS_POR_PAGINA;
  const cartasVisibles = cartasOrdenadas.slice(indicePrimerItem, indiceUltimoItem);

  const totalCartasConRepetidas = listaColeccion.reduce((suma, c) => suma + c.cantidadCopias, 0);

  return (
    <main className="app-container">
      <CabeceraCatalogo
        cargando={estaCargando}
        totalUnicas={listaColeccion.length}
        totalConRepetidas={totalCartasConRepetidas}
        onAbrirContratos={() => setModalContratosAbierto(true)}
      />

      <PanelFiltrosCatalogo
        textoBusqueda={textoBusqueda}
        onChangeBusqueda={setTextoBusqueda}
        filtroRareza={filtroRareza}
        onChangeRareza={setFiltroRareza}
        filtroTiempo={filtroTiempo}
        onChangeTiempo={setFiltroTiempo}
        criterioOrdenacion={criterioOrdenacion}
        onChangeOrdenacion={setCriterioOrdenacion}
      />

      <section className="album-grid-wrapper">
        <div className="grid-meta">
          <span>{t("cardsFound")}: <strong>{totalCartas}</strong></span>
          <span>{t("pageOf", { page: paginaValidaActual, total: totalPaginas })}</span>
        </div>

        {estaCargando ? (
          <div className="empty-state">
            <span className="empty-icon">⏳</span>
            <p>{t("catalogLoading")}</p>
          </div>
        ) : mensajeError ? (
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <p>{mensajeError}</p>
          </div>
        ) : listaColeccion.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <p>{t("catalogEmpty")}</p>
            <div style={{ marginTop: "1rem" }}>
              <BotonAbrirSobres>{t("goOpenPacks")}</BotonAbrirSobres>
            </div>
          </div>
        ) : cartasVisibles.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>{t("catalogNoMatch")}</p>
          </div>
        ) : (
          <div className="album-grid">
            {cartasVisibles.map((carta) => (
              <TarjetaCarta
                key={carta.idInstancia}
                carta={carta}
                onSeleccionarCarta={setCartaSeleccionada}
              />
            ))}
          </div>
        )}
      </section>

      <PaginacionCatalogo
        paginaActual={paginaValidaActual}
        totalPaginas={totalPaginas}
        onCambiarPagina={setPaginaActual}
      />

      <ModalDetalleCarta
        carta={cartaSeleccionada}
        usuariosRegistrados={loginsRegistradosWeb}
        onCerrar={() => setCartaSeleccionada(null)}
      />

      <ModalContratos
        isOpen={modalContratosAbierto}
        onClose={() => setModalContratosAbierto(false)}
        alTerminar={() => setContadorRefresco((n) => n + 1)}
      />
    </main>
  );
}