import { motion } from "framer-motion";
import { Badge } from "../../ui";
import ElectricBorder from "../../Componentes/ElectricBorder";
import CreatorCard from "../CreatorCard";
import { useI18n } from "../../../i18n";

const LOGOS_COALICIONES = {
  zefiria: "/icons/zefiria_logo.png",
  marventis: "/icons/marventis_logo.png",
  tiamant: "/icons/logo_tiamant.png",
  ignisaria: "/icons/ignisaria_logo.png",
};

export default function TarjetaCarta({ carta, onSeleccionarCarta }) {
  const { t } = useI18n();

  const esTipoStaff = carta.categoriaTier.toLowerCase() === "staff";
  const esTipoCreador = carta.categoriaTier.toLowerCase() === "creator";

  if (esTipoCreador) {
    return (
      <CreatorCard
        key={carta.idInstancia}
        carta={carta}
        onClick={() => onSeleccionarCarta(carta)}
      />
    );
  }

  const ContenidoTarjeta = (
    <motion.article
      key={carta.idInstancia}
      className={`card-item rarity-${carta.rarezaCss}`}
      role="button"
      tabIndex={0}
      aria-label={t('viewCardOf', { login: carta.loginUsuario })}
      style={{ cursor: "pointer" }}
      onClick={() => onSeleccionarCarta(carta)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSeleccionarCarta(carta);
        }
      }}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, type: "spring", stiffness: 190, damping: 17 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
    >
      <div className="card-header">
        {LOGOS_COALICIONES[carta.nombreCoalicion.toLowerCase()] ? (
          <img
            className="card-coalition-logo"
            src={LOGOS_COALICIONES[carta.nombreCoalicion.toLowerCase()]}
            alt={carta.nombreCoalicion}
            title={carta.nombreCoalicion}
          />
        ) : (
          <span className="card-type">{carta.nombreCoalicion}</span>
        )}
        <Badge tone={carta.rarezaCss}>
          {carta.categoriaTier.toUpperCase()}
        </Badge>
      </div>

      <div className="card-artwork">
        <div className="artwork-glow"></div>
        {carta.cantidadCopias > 1 && (
          <span
            className="card-copies-badge"
            title={t('youHaveCopies', { count: carta.cantidadCopias })}
          >
            ×{carta.cantidadCopias}
          </span>
        )}
        {carta.urlFoto ? (
          <img
            className="card-photo"
            src={carta.urlFoto}
            alt={carta.loginUsuario}
            style={{ height: 'fit', maxWidth: '100px', objectFit: 'cover', objectPosition: 'center top', borderRadius: '0.05px' }}
          />
        ) : (
          <div className="artwork-symbol">👤</div>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-title">{carta.loginUsuario}</h3>
        <p className="card-description">{carta.tituloPersonalizado}</p>
      </div>

      <div className="card-stats">
        <div className="stat">
          <span className="stat-label">{t("level")}</span>
          <span className="stat-value">{carta.nivelFormateado}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat">
          <span className="stat-label">{t("evaluations")}</span>
          <span className="stat-value">{carta.puntosEvaluacion}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat">
          <span className="stat-label">{t("wallet")}</span>
          <span className="stat-value stat-wallet-value">
            {carta.saldoAltarians}
            <img className="stat-logo" src="/icons/Altarians_logo.png" alt="" aria-hidden="true" />
          </span>
        </div>
      </div>
    </motion.article>
  );

  if (esTipoStaff) {
    return (
      <ElectricBorder
        key={carta.idInstancia}
        color="#ec4899"
        speed={1}
        chaos={0.2}
        borderRadius={16}
      >
        {ContenidoTarjeta}
      </ElectricBorder>
    );
  }

  return ContenidoTarjeta;
}