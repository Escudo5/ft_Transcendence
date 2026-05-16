import { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export default function App() {
  const [health, setHealth] = useState("cargando...");
  const [cards, setCards] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const healthResponse = await fetch(`${apiUrl}/health/`);
        if (!healthResponse.ok) {
          throw new Error("No se pudo leer /health");
        }
        const healthJson = await healthResponse.json();
        setHealth(healthJson.status);

        const cardsResponse = await fetch(`${apiUrl}/cards/`);
        if (!cardsResponse.ok) {
          throw new Error("No se pudo leer /cards");
        }
        const cardsJson = await cardsResponse.json();
        setCards(cardsJson);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="container">
      <h1>ft_Transcendence - Arranque Web</h1>
      <p>
        Estado backend: <strong>{health}</strong>
      </p>
      {error ? <p className="error">{error}</p> : null}
      <section>
        <h2>Cartas guardadas</h2>
        {cards.length === 0 ? (
          <p>No hay cartas todavía. Puedes crear desde el endpoint POST /api/cards/.</p>
        ) : (
          <ul>
            {cards.map((card) => (
              <li key={card.id}>
                <strong>{card.name}</strong> | ATK {card.attack} | DEF {card.defense} | {card.rarity}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
