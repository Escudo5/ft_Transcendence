import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge, Button, Modal, SecondaryButton, TextField } from "./ui";
import ModalContratos, { BotonContratos } from "./Contratos";
import BotonAbrirSobres from "./BotonAbrirSobres";
import { CLASE_RAREZA, RAREZAS } from "./rarezas";
import ElectricBorder from "./ElectricBorder";
import CreatorCard from "./CreatorCard"; // 👈 IMPORTANTE: Importamos el nuevo componente
import { useI18n } from "../i18n";

const TIER_A_RAREZA = CLASE_RAREZA;

const LOGOS_COALICIONES = {
  zefiria: "/icons/zefiria_logo.png",
  marventis: "/icons/marventis_logo.png",
  tiamant: "/icons/logo_tiamant.png",
  ignisaria: "/icons/ignisaria_logo.png",
};

const TIERS = [...RAREZAS].reverse();

/* 🌍 LA RAREZA, TRADUCIDA
 *
 * ⚠️ SE CONSTRUYE SOLO a partir de RAREZAS (rarezas.js), nunca a mano. Ya pasó
 * una vez: había un diccionario escrito con "Común", "Épica" y "Legendaria",
 * rarezas que dejaron de existir el 15/09, y el filtro del álbum se quedó
 * mostrando el nombre de la clave. Construyéndolo así, el día que se añada una
 * rareza nueva aparece aquí sola.
 *
 * La clave queda 'rarity' + el nombre: Junior -> rarityJunior.
 */
const RAREZA_TRADUCCIONES = Object.fromEntries(
  RAREZAS.map((r) => [r, `rarity${r}`]),
);

/* 🔍 DETALLE DE UNA CARTA EN POP-UP */
function ModalCarta({ carta, registrados, onCerrar }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  if (!carta) return null;

  /* ⚠️ De las ~719 cartas del álbum, solo un puñado son de gente que tiene
   * cuenta en la web. Sin esta comprobación el botón "Ver su perfil" sale en
   * todas y lleva a "No existe ningún usuario llamado X". */
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
  const [sortBy, setSortBy] = useState("login");
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8;

  const [contratosAbierto, setContratosAbierto] = useState(false);
  const [refrescoAlbum, setRefrescoAlbum] = useState(0);

  const [cartaAbierta, setCartaAbierta] = useState(null);

  /* Quién de las cartas del álbum tiene cuenta en la web. Lo rellena el
   * segundo useEffect y lo usa el pop-up para decidir si ofrece el perfil. */
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

  /* Consulta de usuarios registrados en la web.
   *
   * Va en su propio useEffect y depende de `album` porque hasta que el álbum no
   * ha cargado no sabemos qué logins preguntar. Una sola petición con todos los
   * logins de golpe, no una por carta. */
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rarityFilter, sortBy]);

  const filteredCards = album.filter((card) => {
    const texto = searchTerm.toLowerCase();
    const matchesSearch =
      card.login.toLowerCase().includes(texto) ||
      card.titulo.toLowerCase().includes(texto) ||
      card.coalicion.toLowerCase().includes(texto);
    const matchesRarity = rarityFilter === "all" || card.tier === rarityFilter;
    return matchesSearch && matchesRarity;
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

  /* Renderizado de Carta Individual */
  const renderCardContent = (card) => {
    const isStaff = card.tier.toLowerCase() === "staff";
    const isCreator = card.tier.toLowerCase() === "creator";

    // 🌟 SI ES CREATOR: Se usa el nuevo componente separado
    if (isCreator) {
      return (
        <CreatorCard
          key={card.id}
          carta={card}
          onClick={() => setCartaAbierta(card)}
        />
      );
    }

    // CARTA NORMAL
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
              }}
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
            {/* ⚠️ La variable del map se llama `tier`, NO `t`: con `t` tapaba la
              * función t() de las traducciones y dentro del map era imposible
              * traducir nada. */}
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