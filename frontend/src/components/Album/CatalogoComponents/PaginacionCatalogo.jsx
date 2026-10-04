import { useI18n } from "../../../i18n";

export default function PaginacionCatalogo({ paginaActual, totalPaginas, onCambiarPagina }) {
  const { t } = useI18n();

  if (totalPaginas <= 1) return null;

  const paginas = [];
  const rangoProximidad = 1;

  for (let i = 1; i <= totalPaginas; i++) {
    if (
      i === 1 ||
      i === totalPaginas ||
      (i >= paginaActual - rangoProximidad && i <= paginaActual + rangoProximidad)
    ) {
      paginas.push(i);
    } else if (
      paginas[paginas.length - 1] !== "..." &&
      (i < paginaActual - rangoProximidad || i > paginaActual + rangoProximidad)
    ) {
      paginas.push("...");
    }
  }

  return (
    <nav className="pagination-container" aria-label={t("pageSelector")}>
      <button
        className="pagination-btn arrow-btn"
        onClick={() => onCambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
      >
        &larr; {t("previous")}
      </button>

      <div className="page-numbers">
        {paginas.map((numPagina, indice) => {
          if (numPagina === "...") {
            return (
              <span
                key={`puntos-${indice}`}
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
              key={numPagina}
              className={`pagination-btn number-btn ${paginaActual === numPagina ? "active" : ""}`}
              onClick={() => onCambiarPagina(numPagina)}
            >
              {numPagina}
            </button>
          );
        })}
      </div>

      <button
        className="pagination-btn arrow-btn"
        onClick={() => onCambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
      >
        {t("next")} &rarr;
      </button>
    </nav>
  );
}