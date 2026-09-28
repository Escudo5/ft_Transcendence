import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge, Button, Modal, SecondaryButton, TextField } from "../ui";
import ModalContratos, { BotonContratos } from "./Contratos";
import BotonAbrirSobres from "../TiendaSobres/BotonAbrirSobres";
import { CLASE_RAREZA, RAREZAS } from "../rarezas";
import ElectricBorder from "../Componentes/ElectricBorder";
import CreatorCard from "./CreatorCard";
import { useI18n } from "../../i18n";

const TIER_A_RAREZA = CLASE_RAREZA;

const LOGOS_COALICIONES = {
  zefiria: "/icons/zefiria_logo.png",
  marventis: "/icons/marventis_logo.png",
  tiamant: "/icons/logo_tiamant.png",
  ignisaria: "/icons/ignisaria_logo.png",
};

const TIERS = [...RAREZAS].reverse();

const RAREZA_TRADUCCIONES = Object.fromEntries(
  RAREZAS.map((r) => [r, `rarity${r}`]),
);

/* 🔍 DETALLE DE UNA CARTA EN POP-UP */
function ModalCarta({ carta, registrados, onCerrar }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  if (!carta) return null;

  const tienePerfil = registrados.has(carta.login);
  const visitarPerfil = () => navigate(`/perfil/${carta.login}`);
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
          <Dato etiqueta={t("level")} valor={carta.nivel} />
          <Dato etiqueta={t("coalition")} valor={carta.coalicion} />
          <Dato etiqueta={t("evaluations")} valor={carta.evaluaciones} />
          <Dato etiqueta={t("wallet")} valor={carta.altarians} />
        </div>

        {carta.cantidad > 1 && (
          <p style={{ margin: 0, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {t("copiesOfCard", { count: carta.cantidad })}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <SecondaryButton onClick={onCerrar}>{t("close")}</SecondaryButton>
          {tienePerfil ? (
            <Button onClick={visitarPerfil}>{t("viewTheirProfile")}</Button>
          ) : (
            <span style={{ alignSelf: "center", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
              {t("notRegisteredYet")}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}

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

export default function Catalogo() {
  const { t } = useI18n();
  const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

  const [album, setAlbum] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  
  // ⏱️ CAMBIO 1: Estado para el nuevo filtro de tiempo
  const [timeFilter, setTimeFilter] = useState("all");

  const [sortBy, setSortBy] = useState("login");
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8;

  const [contratosAbierto, setContratosAbierto] = useState(false);
  const [refrescoAlbum, setRefrescoAlbum] = useState(0);

  const [cartaAbierta, setCartaAbierta] = useState(null);
  const [registrados, setRegistrados] = useState(new Set());

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
            // Se usa el nombre exacto que manda el backend
            created_at: item.fecha_obtencion || item.created_at || item.obtenida_en || null,          })),
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

  // ⏱️ CAMBIO 3: Añadimos `timeFilter` a las dependencias para resetear la página a 1 al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rarityFilter, sortBy, timeFilter]);

  const filteredCards = album.filter((card) => {
    const texto = searchTerm.toLowerCase();
    const matchesSearch =
      card.login.toLowerCase().includes(texto) ||
      card.titulo.toLowerCase().includes(texto) ||
      card.coalicion.toLowerCase().includes(texto);
    const matchesRarity = rarityFilter === "all" || card.tier === rarityFilter;

    // ⏱️ CAMBIO 4: Lógica para filtrar por fecha
    let matchesTime = true;
    if (timeFilter !== "all" && card.created_at) {
      const fechaCarta = new Date(card.created_at);
      const ahora = new Date();
      // Calculamos los días transcurridos entre hoy y el momento de obtención
      const diferenciaDias = (ahora - fechaCarta) / (1000 * 60 * 60 * 24);

      if (timeFilter === "24h") {
        matchesTime = diferenciaDias <= 1;
      } else if (timeFilter === "7d") {
        matchesTime = diferenciaDias <= 7;
      } else if (timeFilter === "30d") {
        matchesTime = diferenciaDias <= 30;
      }
    }

    return matchesSearch && matchesRarity && matchesTime;
  });

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "login") return a.login.localeCompare(b.login);
    if (sortBy === "nivel") return b.nivel - a.nivel;
    if (sortBy === "repetidas") return b.cantidad - a.cantidad;
    if (sortBy === "rareza") return TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier);
    return 0;
  });

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

  const renderCardContent = (card) => {
    const isStaff = card.tier.toLowerCase() === "staff";
    const isCreator = card.tier.toLowerCase() === "creator";

    if (isCreator) {
      return (
        <CreatorCard
          key={card.id}
          carta={card}
          onClick={() => setCartaAbierta(card)}
        />
      );
    }

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
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
      >
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

        <div className="card-artwork">
          <div className="artwork-glow"></div>
          {card.cantidad > 1 && (
            <span
              className="card-copies-badge"
              title={`Tienes ${card.cantidad} copias de esta carta`}
            >
              ×{card.cantidad}
            </span>
          )}
          {card.foto ? (
            <img className="card-photo" src={card.foto} alt={card.login} />
          ) : (
            <div className="artwork-symbol">👤</div>
          )}
        </div>

        <div className="card-body">
          <h3 className="card-title">{card.login}</h3>
          <p className="card-description">{card.titulo}</p>
        </div>

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
          <h1 className="titulo-degradado">42 Card Album</h1>
        </div>
        <p className="subtitle">
          {cargando
            ? t("catalogLoadingCollection")
            : t("catalogCollectionCount", { distinct: album.length, total: totalConRepetidas })}
        </p>
      </header>

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

        {/* ⏱️ CAMBIO 5: Inserción del selector de rango de tiempo en el panel de control */}
        <div className="control-group">
          <label htmlFor="time">{t("filterObtained")}</label>
          <select id="time" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
            <option value="all">{t("filterAllDates")}</option>
            <option value="24h">{t("filterLast24h")}</option>
            <option value="7d">{t("filterLast7d")}</option>
            <option value="30d">{t("filterLast30d")}</option>
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
            {currentCards.map((card) => renderCardContent(card))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="pagination-container" aria-label={t("pageSelector")}>
          <button
            className="pagination-btn arrow-btn"
            onClick={goToPrevPage}
            disabled={activePage === 1}
          >
            &larr; {t("previous")}
          </button>

          <div className="page-numbers">
            {(() => {
              const pages = [];
              const delta = 1;

              for (let i = 1; i <= totalPages; i++) {
                if (
                  i === 1 ||
                  i === totalPages ||
                  (i >= activePage - delta && i <= activePage + delta)
                ) {
                  pages.push(i);
                } else if (
                  pages[pages.length - 1] !== "..." &&
                  (i < activePage - delta || i > activePage + delta)
                ) {
                  pages.push("...");
                }
              }

              return pages.map((page, index) => {
                if (page === "...") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      style={{
                        padding: "0.5rem 0.6rem",
                        color: "var(--text-secondary)",
                        fontWeight: "bold",
                        alignSelf: "center",
                      }}
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    className={`pagination-btn number-btn ${activePage === page ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              });
            })()}
          </div>

          <button
            className="pagination-btn arrow-btn"
            onClick={goToNextPage}
            disabled={activePage === totalPages}
          >
            {t("next")} &rarr;
          </button>
        </nav>
      )}

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