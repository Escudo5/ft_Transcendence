import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge, Button, Modal, SecondaryButton, TextField } from "./ui";
import ModalContratos, { BotonContratos } from "./Contratos";
import BotonAbrirSobres from "./BotonAbrirSobres";
import { CLASE_RAREZA, RAREZAS } from "./rarezas";
import ElectricBorder from "./ElectricBorder";
import { useI18n } from "../i18n";

/*
Mapeo global de rarezas a clases del sistema de diseño
CLASE_RAREZA traduce los identificadores devueltos por el backend
(por ejemplo: "Junior", "Senior", "Creator") a sus estilos CSS equivalentes ("common", "rare", "creator").
*/
const TIER_A_RAREZA = CLASE_RAREZA;

/*
Rutas estáticas a los logotipos de las coaliciones
*/
const LOGOS_COALICIONES = {
  zefiria: "/icons/zefiria_logo.png",
  marventis: "/icons/marventis_logo.png",
  tiamant: "/icons/logo_tiamant.png",
  ignisaria: "/icons/ignisaria_logo.png",
};

/*
Listado ordenado de niveles de rareza de mayor a menor exclusividad
*/
const TIERS = [...RAREZAS].reverse();

/*
🔍 DETALLE DE UNA CARTA EN POP-UP
*/
function ModalCarta({ carta, registrados, onCerrar }) {
  const navigate = useNavigate();

  if (!carta) return null;

  const visitarPerfil = () => navigate(`/perfil/${carta.login}`);
  const tienePerfil = registrados.has(carta.login);
  const logoCoalicion = LOGOS_COALICIONES[carta.coalicion?.toLowerCase()];

  return (
    <Modal open onClose={onCerrar} labelledBy="titulo-carta">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {logoCoalicion && (
            <img
              src={logoCoalicion}
              alt={carta.coalicion}
              title={carta.coalicion}
              style={{ width: "34px", height: "34px", objectFit: "contain" }}
            />
          )}
          <h2 id="titulo-carta" style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.4rem" }}>
            {carta.login}
          </h2>
          <Badge tone={carta.rareza}>{carta.tier.toUpperCase()}</Badge>
        </div>

        {carta.foto ? (
          <img
            src={carta.foto}
            alt={`Foto de ${carta.login}`}
            style={{
              width: "100%", maxHeight: "260px", objectFit: "cover",
              borderRadius: "12px", border: "2px solid var(--border-default)",
            }}
          />
        ) : (
          <div style={{ fontSize: "4rem", textAlign: "center" }}>👤</div>
        )}

        {carta.titulo && carta.titulo !== carta.login && (
          <p style={{ margin: 0, color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center" }}>
            {carta.titulo}
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem" }}>
          <Dato etiqueta="Nivel" valor={carta.nivel} />
          <Dato etiqueta="Coalición" valor={carta.coalicion} />
          <Dato etiqueta="Evaluaciones" valor={carta.evaluaciones} />
          <Dato etiqueta="Wallet" valor={carta.altarians} />
        </div>

        {carta.cantidad > 1 && (
          <p style={{ margin: 0, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Tienes <strong>{carta.cantidad}</strong> copias de esta carta
          </p>
        )}

        <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <SecondaryButton onClick={onCerrar}>Cerrar</SecondaryButton>
          {tienePerfil ? (
            <Button onClick={visitarPerfil}>Ver su perfil</Button>
          ) : (
            <span style={{ alignSelf: "center", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
              Todavía no se ha registrado en la web
            </span>
          )}
        </div>

      </div>
    </Modal>
  );
}

/* Una cifra con su etiqueta para la rejilla de datos del pop-up */
function Dato({ etiqueta, valor }) {
  return (
    <div style={{
      background: "var(--surface-overlay)",
      border: "1px solid var(--border-default)",
      borderRadius: "10px",
      padding: "0.6rem",
      textAlign: "center",
    }}>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, color: "var(--accent)" }}>{valor}</div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>{etiqueta}</div>
    </div>
  );
}
/*
🌍 LA RAREZA, TRADUCIDA (Sergio, con un arreglo de Nacho el 22/09)

Sergio montó este diccionario con las rarezas que había cuando empezó los
idiomas: "Común", "Épica", "Legendaria". Ninguna de esas existe ya desde el
15/09, así que `RAREZA_TRADUCCIONES['Junior']` daba undefined y el filtro de
rarezas y las etiquetas de las cartas habrían salido EN BLANCO. No es culpa
suya: la rama llevaba días abierta mientras las rarezas cambiaban debajo.

⚠️ Y POR ESO SE CONSTRUYE SOLO, a partir de RAREZAS (rarezas.js), en vez de
escribirlo a mano: así el día que se añada una rareza nueva aparece aquí
sola. Es exactamente el fallo del que avisa el comentario de rarezas.js, y
acaba de volver a pasar.

La clave queda 'rarity' + el nombre: Junior -> rarityJunior.
*/
const RAREZA_TRADUCCIONES = Object.fromEntries(
  RAREZAS.map((r) => [r, `rarity${r}`]),
);

export default function Catalogo() {
  const { t } = useI18n();
  const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

  const [album, setAlbum] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("login");
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8;

  const [contratosAbierto, setContratosAbierto] = useState(false);
  const [refrescoAlbum, setRefrescoAlbum] = useState(0);

  const [cartaAbierta, setCartaAbierta] = useState(null);
  const [registrados, setRegistrados] = useState(new Set());

  /* Carga inicial del Álbum */
  useEffect(() => {
    async function cargarAlbum() {
      try {
        const res = await fetch(`${apiBaseUrl}/cards/album/`, { credentials: "include" });

        if (res.status === 401 || res.status === 403) {
          setError(t("loginRequired"));
          return;
        }
        if (!res.ok) {
          setError(t("albumLoadError"));
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
            coalicion: item.card?.coalition || t("noCoalition"),
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
        setError(t("serverError"));
      } finally {
        setCargando(false);
      }
    }
    cargarAlbum();
  }, [apiBaseUrl, refrescoAlbum, t]);

  /* Consulta de usuarios registrados en la web */
  useEffect(() => {
    if (album.length === 0) return;
    let cancelado = false;

    async function mirarQuienEstaEnLaWeb() {
      try {
        const logins = [...new Set(album.map((c) => c.login))].filter(Boolean);
        const res = await fetch(
          `${apiBaseUrl}/users/list/?logins=${encodeURIComponent(logins.join(","))}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const datos = await res.json();
        if (cancelado) return;
        setRegistrados(new Set((datos.users || []).map((u) => u.username)));
      } catch (e) {
        console.error("No se ha podido saber quién está registrado:", e);
      }
    }
    mirarQuienEstaEnLaWeb();

    return () => { cancelado = true; };
  }, [album, apiBaseUrl]);

  /* Resetear página ante cambios de filtro */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rarityFilter, sortBy]);

  /* Filtros de búsqueda */
  const filteredCards = album.filter((card) => {
    const texto = searchTerm.toLowerCase();
    const matchesSearch =
      card.login.toLowerCase().includes(texto) ||
      card.titulo.toLowerCase().includes(texto) ||
      card.coalicion.toLowerCase().includes(texto);
    const matchesRarity = rarityFilter === "all" || card.tier === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  /* Ordenación */
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "login") return a.login.localeCompare(b.login);
    if (sortBy === "nivel") return b.nivel - a.nivel;
    if (sortBy === "repetidas") return b.cantidad - a.cantidad;
    if (sortBy === "rareza") return TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier);
    return 0;
  });

  /* Cálculos de Paginación */
  const totalCards = sortedCards.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;

  const indexOfLastCard = activePage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = sortedCards.slice(indexOfFirstCard, indexOfLastCard);

  const totalConRepetidas = album.reduce((suma, c) => suma + c.cantidad, 0);

  const goToNextPage = () => {
    if (activePage < totalPages) setCurrentPage(activePage + 1);
  };
  const goToPrevPage = () => {
    if (activePage > 1) setCurrentPage(activePage - 1);
  };

  /* Renderizado de Carta Individual */
  const renderCardContent = (card) => {
    const isStaff = card.tier.toLowerCase() === "staff";

    const cardMarkup = (
      <motion.article
        key={card.id}
        className={`card-item rarity-${card.rareza}`}
        role="button"
        tabIndex={0}
        aria-label={`Ver el detalle de la carta de ${card.login}`}
        style={{ cursor: "pointer" }}
        onClick={() => setCartaAbierta(card)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCartaAbierta(card);
          }
        }}
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
        {/* Header de la carta */}
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

        {/* Arte / Foto */}
        <div className="card-artwork">
          <div className="artwork-glow"></div>
          {card.cantidad > 1 && (
            <span
              title={t("copiesOfCard", { count: card.cantidad })}
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

        {/* Datos del estudiante */}
        <div className="card-body">
          <h3 className="card-title">{card.login}</h3>
          <p className="card-description">{card.titulo}</p>
        </div>

        {/* Stats */}
        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">{t("level")}</span>
            <span className="stat-value">{card.nivel}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-label">{t("evaluations")}</span>
            <span className="stat-value">{card.evaluaciones}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-label">{t("wallet")}</span>
            <span className="stat-value stat-wallet-value">
              {card.altarians}
              <img className="stat-logo" src="/icons/Altarians_logo.png" alt="" aria-hidden="true" />
            </span>
          </div>
        </div>
      </motion.article>
    );

    /* Borde eléctrico rosa magenta solo para Staff */
    if (isStaff) {
      return (
        <ElectricBorder
          key={card.id}
          color="#ec4899"
          speed={1}
          chaos={0.2}
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
      {/* Header flotante y títulos */}
      <header className="app-header">
        <div className="header-navigation floating-navigation">
          <Link to="/home" className="back-btn-link">
            {t("catalogBack")}
          </Link>
          <BotonAbrirSobres />
          <BotonContratos onClick={() => setContratosAbierto(true)} />
        </div>
        <div className="logo-section" style={{ marginTop: "1rem" }}>
          <span className="logo-icon">✨</span>
          {/* Nacho, 22/09: se quedan las DOS cosas. La clase del degradado es
              del diseño de Konrad y el texto traducido es de Sergio; quedarse
              con una sola habría perdido el trabajo del otro. */}
          <h1 className="titulo-degradado">{t("catalogTitle")}</h1>
        </div>
        <p className="subtitle">
          {cargando
            ? t("catalogLoadingCollection")
            : t("catalogCollectionCount", { distinct: album.length, total: totalConRepetidas })}
        </p>
      </header>

      {/* Controles de búsqueda y filtros */}
      <section className="control-panel">
        <TextField
          id="search"
          type="text"
          label={t("catalogSearch")}
          placeholder={t("catalogSearchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="control-group">
          <label htmlFor="rarity">{t("rarity")}</label>
          <select id="rarity" value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
            <option value="all">{t("allRarities")}</option>
            {TIERS.map((tier) => (
              <option key={tier} value={tier}>{t(RAREZA_TRADUCCIONES[tier])}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sort">{t("sortBy")}</label>
          <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="login">{t("sortLogin")}</option>
            <option value="rareza">{t("sortRarity")}</option>
            <option value="nivel">{t("sortLevel")}</option>
            <option value="repetidas">{t("sortDuplicates")}</option>
          </select>
        </div>
      </section>

      {/* Lista del Álbum */}
      <section className="album-grid-wrapper">
        <div className="grid-meta">
          <span>{t("cardsFound")}: <strong>{totalCards}</strong></span>
          <span>{t("pageOf", { page: activePage, total: totalPages })}</span>
        </div>

        {cargando ? (
          <div className="empty-state">
            <span className="empty-icon">⏳</span>
            <p>{t("catalogLoading")}</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : album.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <p>{t("catalogEmpty")}</p>
            {/* El mismo botón que arriba: si el álbum está vacío, este es
                justo el sitio donde más apetece que llame la atención. */}
            <div style={{ marginTop: "1rem" }}>
              <BotonAbrirSobres>{t("goOpenPacks")}</BotonAbrirSobres>
            </div>
          </div>
        ) : currentCards.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>{t("catalogNoMatch")}</p>
          </div>
        ) : (
          <div className="album-grid">
            {/* Nacho, 22/09: se queda NUESTRA linea, no las 101 de Sergio.
                La suya era la carta escrita a mano, de antes del refactor,
                sin el borde electrico del Staff, sin el clic que abre el
                pop-up y sin el teclado. Sus tres traducciones (nivel,
                evaluaciones y wallet) se han llevado a renderCardContent,
                que es donde vive ahora la carta. */}
            {currentCards.map((card) => renderCardContent(card))}
          </div>
        )}
      </section>

      {/* Paginación */}
      {totalPages > 1 && (
        <nav className="pagination-container" aria-label={t("pageSelector")}>
          <button
            className="pagination-btn arrow-btn"
            onClick={goToPrevPage}
            disabled={activePage === 1}
            title={t("previousPage")}
          >
            &larr; {t("previous")}
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
            title={t("nextPage")}
          >
            {t("next")} &rarr;
          </button>
        </nav>
      )}

      {/* Modales */}
      <ModalCarta
        carta={cartaAbierta}
        registrados={registrados}
        onCerrar={() => setCartaAbierta(null)}
      />

      <ModalContratos
        isOpen={contratosAbierto}
        onClose={() => setContratosAbierto(false)}
        alTerminar={() => setRefrescoAlbum((n) => n + 1)}
      />
    </main>
  );
}