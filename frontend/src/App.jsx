import { useState } from "react";

const cards = [
  { id: 1, name: "Cadete", rarity: "common", attack: 4, defense: 3 },
  { id: 2, name: "Piscinero", rarity: "rare", attack: 6, defense: 4 },
  { id: 3, name: "Evaluator", rarity: "epic", attack: 7, defense: 6 },
  { id: 4, name: "Black Hole", rarity: "rare", attack: 8, defense: 2 },
  { id: 5, name: "Coalition", rarity: "common", attack: 3, defense: 7 },
];

export default function App() {
  const [showOnlyRare, setShowOnlyRare] = useState(false);

  const filteredCards = showOnlyRare
    ? cards.filter((card) => card.rarity === "rare")
    : cards;

  const toggleFilter = () => {
    setShowOnlyRare((prev) => !prev);
  };

  return (
    <main className="container">
      <h1>Album</h1>

      <button onClick={toggleFilter}>
        {showOnlyRare ? "Mostrar todas" : "Filtrar rare"}
      </button>

      <section className="grid">
        {filteredCards.length === 0 ? (
          <p>No hay cartas para este filtro.</p>
        ) : (
          filteredCards.map((card) => (
            <article key={card.id} className="card">
              <h3>{card.name}</h3>
              <p>Rareza: {card.rarity}</p>
              <p>ATK: {card.attack}</p>
              <p>DEF: {card.defense}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
