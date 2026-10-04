import { motion } from "framer-motion";
import { Badge } from "../ui";
import { useI18n } from "../../i18n";

const LOGOS_COALICIONES = {
  zefiria: "/icons/zefiria_logo.png",
  marventis: "/icons/marventis_logo.png",
  tiamant: "/icons/logo_tiamant.png",
  ignisaria: "/icons/ignisaria_logo.png",
};

export default function CreatorCard({ carta, onClick }) {
  const { t } = useI18n();

  // Compatibilidad de nombres de datos
  const login = carta.loginUsuario || carta.login || "";
  const titulo = carta.tituloPersonalizado || carta.titulo || login;
  const nombreCoalicion = carta.nombreCoalicion || carta.coalicion || "";
  const urlFoto = carta.urlFoto || carta.foto || null;
  const cantidadCopias = carta.cantidadCopias ?? carta.cantidad ?? 1;
  const puntosEvaluacion = carta.puntosEvaluacion ?? carta.evaluaciones ?? 0;
  const saldoAltarians = carta.saldoAltarians ?? carta.altarians ?? 0;

  // Formateo del nivel a máximo 2 decimales limpios
  const nivelBruto = carta.nivelFormateado ?? carta.nivel ?? 0;
  const nivelFormateado = parseFloat(Number(nivelBruto).toFixed(2));

  const logoCoalicion = LOGOS_COALICIONES[nombreCoalicion.toLowerCase()];

  return (
    <motion.article
      className="card-item rarity-creator creator-card-special"
      role="button"
      tabIndex={0}
      aria-label={t('viewCreatorCardOf', { login })}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, type: "spring", stiffness: 190, damping: 17 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      style={{ position: "relative" }}
    >
      <div className="creator-bg-effect">
        <div className="creator-glow-orb primary" />
        <div className="creator-glow-orb secondary" />
        <div className="creator-mesh-pattern" />
      </div>

      <div className="creator-card-content" style={{ position: "relative", zIndex: 2 }}>
        <div className="card-header">
          {logoCoalicion ? (
            <img
              className="card-coalition-logo"
              src={logoCoalicion}
              alt={nombreCoalicion}
              title={nombreCoalicion}
            />
          ) : (
            <span className="card-type">{nombreCoalicion}</span>
          )}
          <Badge tone="creator">{t("rarityCreator").toUpperCase()}</Badge>
        </div>

        <div className="card-artwork">
          <div className="artwork-glow"></div>
          {cantidadCopias > 1 && (
            <span className="card-copies-badge">
              ×{cantidadCopias}
            </span>
          )}
          {urlFoto ? (
            <img 
              className="card-photo" 
              src={urlFoto} 
              alt={login}
              style={{
                height: "110%", width: "95px", maxHeight: "260px", objectFit: "cover", 
              }} 
            />
          ) : (
            <div className="artwork-symbol">👤</div>
          )}
        </div>

        <div className="card-body">
          <h3 className="card-title">{login}</h3>
          <p className="card-description">{titulo}</p>
        </div>

        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">{t("level")}</span>
            <span className="stat-value">{nivelFormateado}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-label">{t("evaluations")}</span>
            <span className="stat-value">{puntosEvaluacion}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-label">{t("wallet")}</span>
            <span className="stat-value stat-wallet-value">
              {saldoAltarians}
              <img className="stat-logo" src="/icons/Altarians_logo.png" alt="" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}