import { Link } from "react-router-dom";
import BotonAbrirSobres from "../../TiendaSobres/BotonAbrirSobres";
import { BotonContratos } from "../Contratos";
import { useI18n } from "../../../i18n";

export default function CabeceraCatalogo({ cargando, totalUnicas, totalConRepetidas, onAbrirContratos }) {
  const { t } = useI18n();

  return (
    <header className="app-header">
      <div className="header-navigation floating-navigation">
        <Link to="/home" className="back-btn-link">
          {t("catalogBack")}
        </Link>
        <BotonAbrirSobres />
        <BotonContratos onClick={onAbrirContratos} />
      </div>
      <div className="logo-section" style={{ marginTop: "1rem" }}>
        <span className="logo-icon">✨</span>
        <h1 className="titulo-degradado">42 Card Album</h1>
      </div>
      <p className="subtitle">
        {cargando
          ? t("catalogLoadingCollection")
          : t("catalogCollectionCount", { distinct: totalUnicas, total: totalConRepetidas })}
      </p>
    </header>
  );
}