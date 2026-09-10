import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge, TextField } from "./ui";
import ModalContratos, { BotonContratos } from "./Contratos";
import BotonAbrirSobres from "./BotonAbrirSobres";

/**
 * EL ÁLBUM
 * --------
 * Muestra las cartas que el usuario tiene de verdad, leyéndolas de
 * GET /api/cards/album/. Antes esta pantalla enseñaba 16 cartas escritas a mano
 * ("Cadete", "Norminette"...) que no existían en ninguna parte: abrías sobres,
 * las cartas se guardaban en tu álbum... y aquí seguías viendo las inventadas.
 *
 * 🎨 KONRAD Y SERGIO: se mantienen vuestras clases de estilo (card-item,
 * rarity-*, card-artwork...) para no romper el diseño. Lo que cambia es de
 * dónde salen los datos y qué se enseña en cada carta, porque una carta real
 * no tiene ataque ni defensa: tiene nivel, puntos de evaluación y coalición.
 */

// Las rarezas del backend (tier) no se llaman igual que las clases de estilo
// 🎴 Las rarezas del backend -> el hueco de color del sistema de diseño.
//
// ⚠️ Los nombres NO coinciden, y no es un error. "common/rare/epic/legendary"
// son los cuatro colores que trae styles.css (gris, azul, morado, dorado) y
// nuestras rarezas se llaman de otra forma. Lo que importa es que el color
// suba conforme sube la rareza, y eso sí se cumple: la Épica sale azul y la
// Transcender morada porque la Transcender es más rara.
//
// KONRAD Y SERGIO: si preferís renombrar los colores en styles.css, adelante;
// solo hay que cambiar este diccionario a la vez.
const TIER_A_RAREZA = {
  Legendaria: "legendary",
  Transcender: "epic",
  "Épica": "rare",
  "Común": "common",
};

// Los tiers tal cual, para el desplegable de filtrar. El orden es el que
// usa la ordenación "por rareza": de la más rara a la más común.
const TIERS = ["Legendaria", "Transcender", "Épica", "Común"];

export default function Catalogo() {
  const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

  // Datos que vienen del backend
  const [album, setAlbum] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Estados para búsqueda, filtro, ordenación y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("login");
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8;

  // 🤝 Contratos: 4 cartas repetidas de la misma rareza -> 1 mejor.
  // 'refrescoAlbum' solo sirve para forzar que se vuelva a pedir el álbum
  // cuando un contrato lo cambia: al subirlo, el efecto de abajo se dispara.
  const [contratosAbierto, setContratosAbierto] = useState(false);
  const [refrescoAlbum, setRefrescoAlbum] = useState(0);

  // Pedimos el álbum al entrar
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
        // Cada elemento es { id, card: {...}, cantidad, fecha_obtencion }.
        // Lo aplanamos para que sea más cómodo de pintar.
        setAlbum(
          (datos || []).map((item) => ({
            id: item.id,
            cardId: item.card?.id,
            cantidad: item.cantidad ?? 1,
            login: item.card?.login || "",
            titulo: item.card?.title || item.card?.login || "",
            coalicion: item.card?.coalition || "Sin coalición",
            foto: item.card?.photo,
            tier: item.card?.tier || "Común",
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

  // Reiniciar a la primera página si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rarityFilter, sortBy]);

  // Filtrado: busca por login, título y coalición
  const filteredCards = album.filter((card) => {
    const texto = searchTerm.toLowerCase();
    const matchesSearch =
      card.login.toLowerCase().includes(texto) ||
      card.titulo.toLowerCase().includes(texto) ||
      card.coalicion.toLowerCase().includes(texto);
    const matchesRarity = rarityFilter === "all" || card.tier === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  // Ordenación
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "login") return a.login.localeCompare(b.login);
    if (sortBy === "nivel") return b.nivel - a.nivel;
    if (sortBy === "repetidas") return b.cantidad - a.cantidad;
    if (sortBy === "rareza") return TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier);
    return 0;
  });

  // Cálculos de paginación
  const totalCards = sortedCards.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;

  const indexOfLastCard = activePage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = sortedCards.slice(indexOfFirstCard, indexOfLastCard);

  // Cuántas cartas tienes en total contando repetidas
  const totalConRepetidas = album.reduce((suma, c) => suma + c.cantidad, 0);

  const goToNextPage = () => {
    if (activePage < totalPages) setCurrentPage(activePage + 1);
  };
  const goToPrevPage = () => {
    if (activePage > 1) setCurrentPage(activePage - 1);
  };

  return (
    <main className="app-container">
      {/* Cabecera del Álbum */}
      <header className="app-header">
        <div className="header-navigation">
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

      {/* Panel de control para filtros, búsqueda y ordenación */}
      <section className="control-panel">
        {/* Campo del sistema de diseño (ui.jsx): trae ya la etiqueta, el
            aviso de error y el aria-invalid para los lectores de pantalla */}
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

      {/* Cuadrícula de Cartas (Grid) */}
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
            {/* El mismo botón que arriba: si el álbum está vacío, este es
                justo el sitio donde más apetece que llame la atención. */}
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
            {currentCards.map((card, index) => (
              <motion.article
                key={card.id}
                className={`card-item rarity-${card.rareza}`}
                initial={{ opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.38, type: 'spring', stiffness: 190, damping: 17 }}
                whileHover={{
                  y: -6,
                  scale: 1.02,
                  transition: { duration: 0.18, delay: 0, type: 'tween' },
                }}
                whileTap={{
                  scale: 0.96,
                  transition: { duration: 0.12, delay: 0, type: 'tween' },
                }}
                whileFocus={{
                  scale: 1.02,
                  transition: { duration: 0.18, delay: 0, type: 'tween' },
                }}
              >
                <div className="card-header">
                  <span className="card-type">{card.coalicion}</span>
                  <Badge tone={card.rareza}>
                    {card.tier.toUpperCase()}
                  </Badge>
                </div>

                <div className="card-artwork">
                  <div className="artwork-glow"></div>
                  {/* Cuántas copias tienes; solo se enseña si hay repetidas.
                      Lleva estilo propio en vez de la clase .artwork-id porque
                      esa se pinta al 30% de opacidad y sobre una foto no se ve. */}
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
                      src={card.foto}
                      alt={card.login}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                    />
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
                    <span className="stat-label">📈 NIVEL</span>
                    <span className="stat-value">{card.nivel}</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat">
                    <span className="stat-label">✅ EVALS</span>
                    <span className="stat-value">{card.evaluaciones}</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Controles de paginación */}
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

      <ModalContratos
        isOpen={contratosAbierto}
        onClose={() => setContratosAbierto(false)}
        alTerminar={() => setRefrescoAlbum((n) => n + 1)}
      />
    </main>
  );
}
