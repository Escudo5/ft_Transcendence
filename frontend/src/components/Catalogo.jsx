import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge, TextField } from "./ui";
import ModalContratos, { BotonContratos } from "./Contratos";
import BotonAbrirSobres from "./BotonAbrirSobres";
import { CLASE_RAREZA, RAREZAS } from "./rarezas";
import ElectricBorder from "./ElectricBorder";

/*
Mapeo global de rarezas a clases del sistema de diseño

CLASE_RAREZA traduce los identificadores devueltos por el backend 
(por ejemplo: "Junior", "Senior") a sus estilos CSS equivalentes ("common", "rare").
*/
const TIER_A_RAREZA = CLASE_RAREZA;

/*
Rutas estáticas a los logotipos de las coaliciones

Este objeto vincula el nombre de la coalición en minúsculas con su
respectiva imagen guardada dentro del directorio público.
*/
const LOGOS_COALICIONES = {
  zefiria: "/icons/zefiria_logo.png",
  marventis: "/icons/marventis_logo.png",
  tiamant: "/icons/logo_tiamant.png",
  ignisaria: "/icons/ignisaria_logo.png",
};

/*
Listado ordenado de niveles de rareza de mayor a menor exclusividad

Invierte el array exportado de rarezas sin alterar la referencia original,
utilizado para poblar el selector de filtros y el criterio de ordenación.
*/
const TIERS = [...RAREZAS].reverse();

export default function Catalogo() {
  /*
  Dirección base del servidor de la API

  Toma la variable de entorno expuesta por Vite o recurre al proxy '/api' por defecto.
  */
  const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

  /*
  Estados principales de datos y carga de la vista

  album almacena el listado plano de las cartas procesadas.
  cargando controla el estado visual de espera mientras la petición finaliza.
  error captura mensajes de fallo de autenticación o de conexión con la API.
  */
  const [album, setAlbum] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  /*
  Estados para la manipulación y paginación de los datos

  searchTerm filtra por cadenas de texto introducidas.
  rarityFilter limita las cartas a una categoría específica.
  sortBy define el criterio de ordenación en la vista.
  currentPage e indexOfLastCard/indexOfFirstCard gestionan el troceado de datos.
  */
  const [searchTerm, setSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("login");
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8;

  /*
  Estados de integración para la funcionalidad de contratos

  contratosAbierto conmuta la visibilidad del modal de canjes.
  refrescoAlbum actúa como un contador de control que fuerza la recarga del efecto.
  */
  const [contratosAbierto, setContratosAbierto] = useState(false);
  const [refrescoAlbum, setRefrescoAlbum] = useState(0);

  /*
  Petición remota para la carga del álbum de cartas

  useEffect ejecuta la llamada a 'GET /api/cards/album/' al montar la vista o al
  modificar el contador de refrescoAlbum. Aclana la estructura de respuesta para
  vincular directamente las URLs de fotos (item.card.photo) y sus atributos.
  */
  useEffect(() => {
    async function cargarAlbum() {
      try {
        const res = await fetch(`${apiBaseUrl}/cards/album/`, { credentials: "include" });

        if (res.status === 401 || res.status === 403) {
          setError("Tienes que iniciar sesión para ver tu álbum.");
          return;
        }
        if (!res.ok) {
          setError("No se ha podido cargar tu álbum.");
          return;
        }

        const datos = await res.json();
        setAlbum(
          (datos || []).map((item) => ({
            id: item.id,
            cardId: item.card?.id,
            cantidad: item.cantidad ?? 1,
            login: item.card?.login || "",
            titulo: item.card?.title || item.card?.login || "",
            coalicion: item.card?.coalition || "Sin coalición",
            foto: item.card?.photo,
            tier: item.card?.tier || "Junior",
            rareza: TIER_A_RAREZA[item.card?.tier] || "common",
            nivel: item.card?.cursus_lvl ?? 0,
            evaluaciones: item.card?.eval_point ?? 0,
            altarians: item.card?.altarians ?? 0,
          })),
        );
      } catch (e) {
        console.error("Error al cargar el álbum:", e);
        setError("No se ha podido conectar con el servidor.");
      } finally {
        setCargando(false);
      }
    }
    cargarAlbum();
  }, [apiBaseUrl, refrescoAlbum]);

  /*
  Restablecimiento de página en búsquedas activas

  Reinicia la paginación a la primera posición cada vez que el usuario modifica
  el texto del buscador, el filtro de rareza o la opción de ordenación.
  */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rarityFilter, sortBy]);

  /*
  Filtrado dinámico de cartas

  Busca coincidencias insensibles a mayúsculas dentro del login, título o coalición,
  evaluando simultáneamente si la carta pertenece al nivel de rareza seleccionado.
  */
  const filteredCards = album.filter((card) => {
    const texto = searchTerm.toLowerCase();
    const matchesSearch =
      card.login.toLowerCase().includes(texto) ||
      card.titulo.toLowerCase().includes(texto) ||
      card.coalicion.toLowerCase().includes(texto);
    const matchesRarity = rarityFilter === "all" || card.tier === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  /*
  Ordenación de la lista filtrada

  Crea una copia de la lista y la ordena alfabéticamente por login, por nivel
  de rareza segun el índice de TIERS, por nivel de estudiante o por repetidas.
  */
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "login") return a.login.localeCompare(b.login);
    if (sortBy === "nivel") return b.nivel - a.nivel;
    if (sortBy === "repetidas") return b.cantidad - a.cantidad;
    if (sortBy === "rareza") return TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier);
    return 0;
  });

  /*
  Cálculos matemáticos para la paginación de la cuadrícula

  Determina el total de páginas necesarias e identifica el segmento de array
  correspondiente a la página activa actual mediante slice.
  */
  const totalCards = sortedCards.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;

  const indexOfLastCard = activePage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = sortedCards.slice(indexOfFirstCard, indexOfLastCard);

  /*
  Cómputo total de volumen de la colección

  Suma las copias acumuladas de todas las cartas pertenecientes al álbum.
  */
  const totalConRepetidas = album.reduce((suma, c) => suma + c.cantidad, 0);

  /*
  Manejadores de eventos de cambio de página

  Sumariza o resta el indicador numérico de la página activa respetando los límites.
  */
  const goToNextPage = () => {
    if (activePage < totalPages) setCurrentPage(activePage + 1);
  };
  const goToPrevPage = () => {
    if (activePage > 1) setCurrentPage(activePage - 1);
  };

  /*
  Función auxiliar de renderizado individual de cartas

  Aísla la estructura DOM de la carta para permitir envolverla condicionalmente
  con el componente ElectricBorder en caso de pertenecer a la categoría Staff.
  */
  const renderCardContent = (card) => {
    const isStaff = card.tier.toLowerCase() === "staff";

    const cardMarkup = (
      <motion.article
        key={card.id}
        className={`card-item rarity-${card.rareza}`}
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, type: "spring", stiffness: 190, damping: 17 }}
        whileHover={{
          y: -6,
          scale: 1.02,
          transition: { duration: 0.18, delay: 0, type: "tween" },
        }}
        whileTap={{
          scale: 0.96,
          transition: { duration: 0.12, delay: 0, type: "tween" },
        }}
        whileFocus={{
          scale: 1.02,
          transition: { duration: 0.18, delay: 0, type: "tween" },
        }}
      >
        {/* Encabezado de la carta */}
        <div className="card-header">
          {LOGOS_COALICIONES[card.coalicion.toLowerCase()] ? (
            <img
              className="card-coalition-logo"
              src={LOGOS_COALICIONES[card.coalicion.toLowerCase()]}
              alt={card.coalicion}
              title={card.coalicion}
            />
          ) : (
            <span className="card-type">{card.coalicion}</span>
          )}
          <Badge tone={card.rareza}>
            {card.tier.toUpperCase()}
          </Badge>
        </div>

        {/* Marco artístico y foto */}
        <div className="card-artwork">
          <div className="artwork-glow"></div>
          {card.cantidad > 1 && (
            <span
              title={`Tienes ${card.cantidad} copias de esta carta`}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                zIndex: 3,
                background: "rgba(12, 15, 22, 0.85)",
                border: "2px solid var(--accent)",
                color: "var(--accent)",
                borderRadius: "999px",
                padding: "0.15rem 0.55rem",
                fontFamily: "var(--font-heading)",
                fontSize: "0.85rem",
                fontWeight: 800,
                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              ×{card.cantidad}
            </span>
          )}
          {card.foto ? (
            <img
              className="card-photo"
              src={card.foto}
              alt={card.login}
            />
          ) : (
            <div className="artwork-symbol">👤</div>
          )}
        </div>

        {/* Información del estudiante */}
        <div className="card-body">
          <h3 className="card-title">{card.login}</h3>
          <p className="card-description">{card.titulo}</p>
        </div>

        {/* Estadísticas */}
        <div className="card-stats">
          <div className="stat">
            <span className="stat-label"> NIVEL</span>
            <span className="stat-value">{card.nivel}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-label"> EVALS</span>
            <span className="stat-value">{card.evaluaciones}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-label">WALLET</span>
            <span className="stat-value stat-wallet-value">
              {card.altarians}
              <img className="stat-logo" src="/icons/Altarians_logo.png" alt="" aria-hidden="true" />
            </span>
          </div>
        </div>
      </motion.article>
    );

    /*
    Aplicación condicional del marco animado ElectricBorder

    Si la carta pertenece al nivel 'Staff', se envuelve con el componente
    ElectricBorder configurado con un todo cian brillante (#7df9ff) y bordes de 16px.
    */
    if (isStaff) {
      return (
        <ElectricBorder
          key={card.id}
          color="#ec4899"
          speed={1}
          chaos={0.2}
          thickness={2}
          borderRadius={16}
        >
          {cardMarkup}
        </ElectricBorder>
      );
    }

    return cardMarkup;
  };

  return (
    <main className="app-container">
      {/* Cabecera superior del álbum */}
      <header className="app-header">
        <div className="header-navigation floating-navigation">
          <Link to="/home" className="back-btn-link">
            ← Volver al Inicio
          </Link>
          <BotonAbrirSobres />
          <BotonContratos onClick={() => setContratosAbierto(true)} />
        </div>
        <div className="logo-section" style={{ marginTop: "1rem" }}>
          <span className="logo-icon">✨</span>
          <h1>42 Card Album</h1>
        </div>
        <p className="subtitle">
          {cargando
            ? "Cargando tu colección…"
            : `Tienes ${album.length} cartas distintas (${totalConRepetidas} contando repetidas)`}
        </p>
      </header>

      {/* Panel interactivo de filtros y ordenación */}
      <section className="control-panel">
        <TextField
          id="search"
          type="text"
          label="Buscar carta"
          placeholder="Por login, título o coalición…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="control-group">
          <label htmlFor="rarity">Rareza</label>
          <select id="rarity" value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
            <option value="all">Todas las rarezas</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sort">Ordenar por</label>
          <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="login">Login (A-Z)</option>
            <option value="rareza">Rareza</option>
            <option value="nivel">Nivel</option>
            <option value="repetidas">Repetidas</option>
          </select>
        </div>
      </section>

      {/* Cuadrícula de cartas */}
      <section className="album-grid-wrapper">
        <div className="grid-meta">
          <span>Cartas encontradas: <strong>{totalCards}</strong></span>
          <span>Página <strong>{activePage}</strong> de <strong>{totalPages}</strong></span>
        </div>

        {cargando ? (
          <div className="empty-state">
            <span className="empty-icon">⏳</span>
            <p>Cargando tu álbum…</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : album.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <p>Tu álbum está vacío. Abre sobres en la tienda para conseguir cartas.</p>
            <div style={{ marginTop: "1rem" }}>
              <BotonAbrirSobres>Ir a abrir sobres</BotonAbrirSobres>
            </div>
          </div>
        ) : currentCards.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>Ninguna carta de tu álbum coincide con la búsqueda.</p>
          </div>
        ) : (
          <div className="album-grid">
            {currentCards.map((card) => renderCardContent(card))}
          </div>
        )}
      </section>

      {/* Controles inferiores de paginación */}
      {totalPages > 1 && (
        <nav className="pagination-container" aria-label="Selector de páginas del álbum">
          <button
            className="pagination-btn arrow-btn"
            onClick={goToPrevPage}
            disabled={activePage === 1}
            title="Página Anterior"
          >
            &larr; Anterior
          </button>

          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, idx) => {
              const pageNumber = idx + 1;
              return (
                <button
                  key={pageNumber}
                  className={`pagination-btn number-btn ${activePage === pageNumber ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <button
            className="pagination-btn arrow-btn"
            onClick={goToNextPage}
            disabled={activePage === totalPages}
            title="Página Siguiente"
          >
            Siguiente &rarr;
          </button>
        </nav>
      )}

      {/* Modal global del sistema de contratos */}
      <ModalContratos
        isOpen={contratosAbierto}
        onClose={() => setContratosAbierto(false)}
        alTerminar={() => setRefrescoAlbum((n) => n + 1)}
      />
    </main>
  );
}