import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// 1. BASE DE DATOS LOCAL:
const CARDS_DATA = [
  { id: 1, name: "Cadete", rarity: "common", attack: 3, defense: 3, type: "Jugador", desc: "Acaba de entrar a la piscina y está lleno de ilusiones y cafeína." },
  { id: 2, name: "Piscinero", rarity: "rare", attack: 5, defense: 4, type: "Jugador", desc: "No duerme, no come, solo escribe código en C y sueña con punteros." },
  { id: 3, name: "Evaluator", rarity: "epic", attack: 7, defense: 6, type: "Boss", desc: "Su mirada fría puede tumbar tu defensa. Tu nota depende de su humor." },
  { id: 4, name: "Black Hole", rarity: "legendary", attack: 10, defense: 10, type: "Hechizo", desc: "Te absorbe si no entregas tus proyectos a tiempo. Fin de la partida." },
  { id: 5, name: "Coalición", rarity: "common", attack: 4, defense: 4, type: "Objeto", desc: "La unión de los estudiantes bajo un mismo estandarte. +1 de moral." },
  { id: 6, name: "Norminette", rarity: "legendary", attack: 9, defense: 8, type: "Boss", desc: "Destruye tus esperanzas encontrando espacios de más y variables mal declaradas." },
  { id: 7, name: "Git Conflict", rarity: "epic", attack: 8, defense: 5, type: "Bug", desc: "Detiene el flujo del tiempo de desarrollo. Main y branch luchan a muerte." },
  { id: 8, name: "Memory Leak", rarity: "rare", attack: 6, defense: 3, type: "Bug", desc: "Drena lentamente tus recursos (y tu cordura) hasta que todo colapsa." },
  { id: 9, name: "Seg Fault", rarity: "epic", attack: 9, defense: 2, type: "Bug", desc: "Un puntero nulo que rompe tu código en mil pedazos de forma instantánea." },
  { id: 10, name: "Makefile", rarity: "common", attack: 2, defense: 6, type: "Objeto", desc: "Automatiza tu sufrimiento con reglas claras: all, clean, fclean, re." },
  { id: 11, name: "Libft", rarity: "common", attack: 4, defense: 5, type: "Objeto", desc: "Tu primera gran amiga en la piscina. Siempre fiel y bien probada." },
  { id: 12, name: "GDB Debugger", rarity: "rare", attack: 3, defense: 8, type: "Objeto", desc: "Revela la verdad oculta en el stack de llamadas. Detecta el bug." },
  { id: 13, name: "Peer Review", rarity: "common", attack: 3, defense: 4, type: "Jugador", desc: "Dos compañeros miran tu pantalla con escepticismo y consejos útiles." },
  { id: 14, name: "Cafetera", rarity: "rare", attack: 1, defense: 9, type: "Objeto", desc: "El pilar fundamental de todo el campus de 42. Da energía ilimitada." },
  { id: 15, name: "Mago de Vim", rarity: "epic", attack: 8, defense: 7, type: "Jugador", desc: "Nadie sabe cómo salir de su editor, pero escribe código a velocidad luz." },
  { id: 16, name: "Bucle Infinito", rarity: "legendary", attack: 9, defense: 9, type: "Hechizo", desc: "while(1) { printf(\"Help\\n\"); } El tiempo deja de avanzar." }
];

export default function Catalogo() {
  // Estados para búsqueda, filtro, ordenación y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4; // 4 cartas por fila / página

  // Reiniciar a la primera página si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rarityFilter, sortBy]);

  // Filtrado de cartas
  const filteredCards = CARDS_DATA.filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          card.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          card.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = rarityFilter === "all" || card.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  // Ordenación de cartas
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "attack") return b.attack - a.attack;
    if (sortBy === "defense") return b.defense - a.defense;
    return a.id - b.id;
  });

  // Cálculos de paginación
  const totalCards = sortedCards.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;

  const indexOfLastCard = activePage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = sortedCards.slice(indexOfFirstCard, indexOfLastCard);

  // Manejadores de navegación
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
          <Link to="/inventario" className="back-btn-link">
            🧰 Ir a Inventario
          </Link>
        </div>
        <div className="logo-section" style={{ marginTop: "1rem" }}>
          <span className="logo-icon">✨</span>
          <h1>42 Card Album</h1>
        </div>
        <p className="subtitle">Colecciona las cartas más legendarias del campus y supera el agujero negro</p>
      </header>

      {/* Panel de control para filtros, búsqueda y ordenación */}
      <section className="control-panel">
        <div className="control-group">
          <label htmlFor="search">Buscar carta</label>
          <input
            id="search"
            type="text"
            placeholder="Ej: Cadete, Bug, re..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="rarity">Rareza</label>
          <select
            id="rarity"
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
          >
            <option value="all">Todas las rarezas</option>
            <option value="common">Comunes</option>
            <option value="rare">Raras</option>
            <option value="epic">Épicas</option>
            <option value="legendary">Legendarias</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sort">Ordenar por</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="id">Número de Álbum</option>
            <option value="name">Nombre</option>
            <option value="attack">Ataque (ATK)</option>
            <option value="defense">Defensa (DEF)</option>
          </select>
        </div>
      </section>

      {/* Cuadrícula de Cartas (Grid) */}
      <section className="album-grid-wrapper">
        <div className="grid-meta">
          <span>Cartas encontradas: <strong>{totalCards}</strong></span>
          <span>Página <strong>{activePage}</strong> de <strong>{totalPages}</strong></span>
        </div>

        {currentCards.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <p>No se encontraron cartas que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="album-grid">
            {currentCards.map((card) => (
              <article key={card.id} className={`card-item rarity-${card.rarity}`}>
                <div className="card-header">
                  <span className="card-type">{card.type}</span>
                  <span className={`rarity-badge badge-${card.rarity}`}>
                    {card.rarity.toUpperCase()}
                  </span>
                </div>
                
                <div className="card-artwork">
                  <div className="artwork-glow"></div>
                  <span className="artwork-id">#{String(card.id).padStart(3, "0")}</span>
                  <div className="artwork-symbol">
                    {card.rarity === "legendary" && "👑"}
                    {card.rarity === "epic" && "🔮"}
                    {card.rarity === "rare" && "💠"}
                    {card.rarity === "common" && "⚙️"}
                  </div>
                </div>

                <div className="card-body">
                  <h3 className="card-title">{card.name}</h3>
                  <p className="card-description">{card.desc}</p>
                </div>

                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-label">⚔️ ATK</span>
                    <span className="stat-value">{card.attack}</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat">
                    <span className="stat-label">🛡️ DEF</span>
                    <span className="stat-value">{card.defense}</span>
                  </div>
                </div>
              </article>
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
    </main>
  );
}