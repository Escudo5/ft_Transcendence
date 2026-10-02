import { motion } from "framer-motion";
import { Badge } from "../ui";
import { useI18n } from "../../i18n";

/*
  Logotipos de las coaliciones
*/
const LOGOS_COALICIONES = {
  zefiria: "/icons/zefiria_logo.png",
  marventis: "/icons/marventis_logo.png",
  tiamant: "/icons/logo_tiamant.png",
  ignisaria: "/icons/ignisaria_logo.png",
};

export default function CreatorCard({ carta, onClick }) {
  const { t } = useI18n();
  const logoCoalicion = LOGOS_COALICIONES[carta.coalicion?.toLowerCase()];

  return (
    <motion.article
  className="card-item rarity-creator creator-card-special"
  role="button"
  tabIndex={0}
  aria-label={t('viewCreatorCardOf', { login: carta.login })}
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
      {/* 🔮 CAPAS DE EFECTO EN EL FONDO 🔮 */}
      <div className="creator-bg-effect">
        <div className="creator-glow-orb primary" />
        <div className="creator-glow-orb secondary" />
        <div className="creator-mesh-pattern" />
      </div>

      {/* CONTENIDO DE LA CARTA (Por encima del fondo) */}
      <div className="creator-card-content" style={{ position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div className="card-header">
          {logoCoalicion ? (
            <img
              className="card-coalition-logo"
              src={logoCoalicion}
              alt={carta.coalicion}
              title={carta.coalicion}
            />
          ) : (
            <span className="card-type">{carta.coalicion}</span>
          )}
          <Badge tone="creator">{t("rarityCreator").toUpperCase()}</Badge>
        </div>

        {/* Arte / Foto */}
        <div className="card-artwork">
          <div className="artwork-glow"></div>
          {carta.cantidad > 1 && (
            <span className="card-copies-badge">
              ×{carta.cantidad}
            </span>
          )}
          {carta.foto ? (
            <img className="card-photo" 
            src={carta.foto} 
            alt={carta.login}
            style={{
              height:"110%", width: "95px", maxHeight: "260px", objectFit: "cover", 
            }} />
          ) : (
            <div className="artwork-symbol">👤</div>
          )}
        </div>

        {/* Info */}
        <div className="card-body">
          <h3 className="card-title">{carta.login}</h3>
          <p className="card-description">{carta.titulo}</p>
        </div>

        {/* Stats */}
        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">{t("level")}</span>
            <span className="stat-value">{carta.nivel}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-label">{t("evaluations")}</span>
            <span className="stat-value">{carta.evaluaciones}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-label">{t("wallet")}</span>
            <span className="stat-value stat-wallet-value">
              {carta.altarians}
              <img className="stat-logo" src="/icons/Altarians_logo.png" alt="" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}