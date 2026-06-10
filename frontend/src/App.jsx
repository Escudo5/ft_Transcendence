// 1. IMPORTACIONES: Traemos herramientas de React
// 'useState' sirve para que la página recuerde datos (estado) que pueden cambiar (ej. qué página estamos viendo).
// 'useEffect' sirve para ejecutar código automáticamente cuando cambian ciertas cosas (ej. resetear la página al buscar).
import { useState, useEffect } from "react";

// 2. BASE DE DATOS LOCAL (Array de objetos):
// Aquí guardamos la información de todas las cartas del álbum. Cada carta es un objeto {} con sus atributos.
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

// 3. COMPONENTE PRINCIPAL (App):
// En React, la interfaz se divide en componentes. Esta función define la caja principal del álbum de cartas.
export default function App() {
  
  // 4. ESTADOS (State variables):
  // Son variables especiales que, al cambiar, hacen que la pantalla se vuelva a dibujar (renderizar) de manera automática.
  // Sintaxis: const [variable, funcionParaCambiarla] = useState(ValorInicial);
  
  const [searchTerm, setSearchTerm] = useState("");      // Guarda el texto escrito en el buscador.
  const [rarityFilter, setRarityFilter] = useState("all");  // Guarda el filtro de rareza seleccionado.
  const [sortBy, setSortBy] = useState("id");               // Guarda el criterio de ordenación (ej. ataque).
  const [currentPage, setCurrentPage] = useState(1);       // Guarda el número de página actual que está viendo el usuario.
  const cardsPerPage = 12;                                  // Constante: cuántas cartas queremos por página.

  // 5. EFECTOS (useEffect):
  // Esta función vigila las variables [searchTerm, rarityFilter, sortBy].
  // Si alguna de ellas cambia, ejecuta el código interior. En este caso, reinicia la paginación a la página 1.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rarityFilter, sortBy]);

  // 6. LÓGICA DE FILTRADO:
  // Tomamos CARDS_DATA y generamos una nueva lista "filteredCards" que solo contiene las cartas que cumplen los criterios.
  const filteredCards = CARDS_DATA.filter((card) => {
    // Comprobamos si el nombre, descripción o tipo contienen el texto del buscador (sin importar mayúsculas/minúsculas).
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          card.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          card.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Comprobamos si coincide la rareza seleccionada o si el filtro está en "Todas" ("all").
    const matchesRarity = rarityFilter === "all" || card.rarity === rarityFilter;
    
    // Solo devolvemos true si cumple ambos filtros.
    return matchesSearch && matchesRarity;
  });

  // 7. LÓGICA DE ORDENACIÓN:
  // Ordenamos la lista filtrada de cartas según el criterio seleccionado.
  // Usamos [...filteredCards] para hacer una copia de la lista antes de ordenarla y no modificar la original.
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name); // Orden alfabético por nombre.
    if (sortBy === "attack") return b.attack - a.attack;       // De mayor a menor ataque.
    if (sortBy === "defense") return b.defense - a.defense;     // De mayor a menor defensa.
    return a.id - b.id; // Por defecto ordena por el ID (orden del álbum).
  });

  // 8. CÁLCULO DE PAGINACIÓN:
  const totalCards = sortedCards.length; // Total de cartas que quedan después de aplicar filtros.
  
  // Dividimos el total entre las cartas por página y redondeamos hacia arriba para saber cuántas páginas hay en total.
  // El '|| 1' evita que si hay 0 cartas, el total de páginas sea 0 (mínimo será la página 1 vacía).
  const totalPages = Math.ceil(totalCards / cardsPerPage) || 1;
  
  // Control de seguridad: Evita que la página actual sea mayor que el total de páginas.
  const activePage = currentPage > totalPages ? totalPages : currentPage;

  // Calculamos los índices de corte del array para mostrar solo las cartas de la página activa.
  // Por ejemplo, si activePage = 2 y cardsPerPage = 4:
  // indexOfLastCard = 2 * 4 = 8
  // indexOfFirstCard = 8 - 4 = 4
  // Con .slice(4, 8) tomamos los elementos del índice 4 al 7 (el 8 no se incluye).
  const indexOfLastCard = activePage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = sortedCards.slice(indexOfFirstCard, indexOfLastCard);

  // 9. MANEJADORES DE NAVEGACIÓN (Event Handlers):
  const goToNextPage = () => {
    if (activePage < totalPages) setCurrentPage(activePage + 1);
  };

  const goToPrevPage = () => {
    if (activePage > 1) setCurrentPage(activePage - 1);
  };

  // 10. EL RETORNO (Renderizado JSX):
  // Lo que devuelve esta función es código JSX (similar a HTML pero interactivo y mezclado con Javascript).
  return (
    <main className="app-container">
      {/* Cabecera del Álbum */}
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">✨</span>
          <h1>42 Card Album</h1>
        </div>
        <p className="subtitle">Colecciona las cartas más legendarias del campus y supera el agujero negro</p>
      </header>

      {/* PANEL DE CONTROL: Buscador, filtros y ordenación */}
      <section className="control-panel">
        {/* Caja de búsqueda por texto */}
        <div className="control-group">
          <label htmlFor="search">Buscar carta</label>
          <input
            id="search"
            type="text"
            placeholder="Ej: Cadete, Bug, re..."
            value={searchTerm} // Enlazamos el input con el valor del estado 'searchTerm'.
            // Cada vez que el usuario escribe, se ejecuta esta función actualizando el estado.
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {/* Desplegable de filtro de rarezas */}
        <div className="control-group">
          <label htmlFor="rarity">Rareza</label>
          <select
            id="rarity"
            value={rarityFilter} // Enlazamos el select con 'rarityFilter'.
            onChange={(e) => setRarityFilter(e.target.value)}
          >
            <option value="all">Todas las rarezas</option>
            <option value="common">Comunes</option>
            <option value="rare">Raras</option>
            <option value="epic">Épicas</option>
            <option value="legendary">Legendarias</option>
          </select>
        </div>

        {/* Desplegable para ordenar las cartas */}
        <div className="control-group">
          <label htmlFor="sort">Ordenar por</label>
          <select
            id="sort"
            value={sortBy} // Enlazamos el select con 'sortBy'.
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="id">Número de Álbum</option>
            <option value="name">Nombre</option>
            <option value="attack">Ataque (ATK)</option>
            <option value="defense">Defensa (DEF)</option>
          </select>
        </div>
      </section>

      {/* SECCIÓN DE LA CUADRÍCULA (GRID) DEL ÁLBUM */}
      <section className="album-grid-wrapper">
        {/* Metadatos sobre el número de cartas y página activa */}
        <div className="grid-meta">
          <span>Cartas encontradas: <strong>{totalCards}</strong></span>
          <span>Página <strong>{activePage}</strong> de <strong>{totalPages}</strong></span>
        </div>

        {/* CONDICIONAL: Si no hay cartas, mostramos un aviso. Si las hay, dibujamos la cuadrícula. */}
        {currentCards.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <p>No se encontraron cartas que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="album-grid">
            {/* MAPEO: Recorremos las cartas de la página activa ('currentCards') y dibujamos una por una */}
            {currentCards.map((card) => (
              // Usamos un identificador único 'key' en el elemento raíz para que React sea eficiente al actualizar la lista.
              // Le añadimos una clase CSS dinámica basada en la rareza (rarity-common, rarity-rare, etc.) para darle estilos únicos.
              <article key={card.id} className={`card-item rarity-${card.rarity}`}>
                
                {/* Cabecera interna de la carta (Tipo y Etiqueta de rareza) */}
                <div className="card-header">
                  <span className="card-type">{card.type}</span>
                  <span className={`rarity-badge badge-${card.rarity}`}>
                    {card.rarity.toUpperCase()}
                  </span>
                </div>
                
                {/* Ilustración de la carta (con efectos visuales de neón) */}
                <div className="card-artwork">
                  <div className="artwork-glow"></div>
                  <span className="artwork-id">#{String(card.id).padStart(3, "0")}</span>
                  {/* Icono temático según el nivel de rareza */}
                  <div className="artwork-symbol">
                    {card.rarity === "legendary" && "👑"}
                    {card.rarity === "epic" && "🔮"}
                    {card.rarity === "rare" && "💠"}
                    {card.rarity === "common" && "⚙️"}
                  </div>
                </div>

                {/* Contenido principal: Título y descripción */}
                <div className="card-body">
                  <h3 className="card-title">{card.name}</h3>
                  <p className="card-description">{card.desc}</p>
                </div>

                {/* Estadísticas de combate de la carta */}
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

      {/* CONTROLES DE PAGINACIÓN (SELECTOR INFERIOR) */}
      {/* Solo mostramos la barra de paginación si hay más de 1 página disponible */}
      {totalPages > 1 && (
        <nav className="pagination-container" aria-label="Selector de páginas del álbum">
          {/* Botón página Anterior (se deshabilita si estamos en la página 1) */}
          <button 
            className="pagination-btn arrow-btn" 
            onClick={goToPrevPage} 
            disabled={activePage === 1}
            title="Página Anterior"
          >
            &larr; Anterior
          </button>
          
          {/* Lista de números de página individuales */}
          <div className="page-numbers">
            {/* Generamos un array dinámico basado en 'totalPages' para renderizar cada botón de página */}
            {Array.from({ length: totalPages }, (_, idx) => {
              const pageNumber = idx + 1;
              return (
                <button
                  key={pageNumber}
                  // Si el número coincide con la página activa, le agregamos la clase 'active' para resaltarlo.
                  className={`pagination-btn number-btn ${activePage === pageNumber ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          {/* Botón página Siguiente (se deshabilita si estamos en la última página) */}
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
