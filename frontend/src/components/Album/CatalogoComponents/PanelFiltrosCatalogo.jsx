import { TextField } from "../../ui";
import { RAREZAS } from "../../rarezas";
import { useI18n } from "../../../i18n";

const TIERS = [...RAREZAS].reverse();
const RAREZA_TRADUCCIONES = Object.fromEntries(
  RAREZAS.map((r) => [r, `rarity${r}`]),
);

export default function PanelFiltrosCatalogo({
  textoBusqueda,
  onChangeBusqueda,
  filtroRareza,
  onChangeRareza,
  filtroTiempo,
  onChangeTiempo,
  criterioOrdenacion,
  onChangeOrdenacion,
}) {
  const { t } = useI18n();

  return (
    <section className="control-panel">
      <TextField
        id="search"
        type="text"
        label={t("catalogSearch")}
        placeholder={t("catalogSearchPlaceholder")}
        value={textoBusqueda}
        onChange={(e) => onChangeBusqueda(e.target.value)}
      />

      <div className="control-group">
        <label htmlFor="rarity">{t("rarity")}</label>
        <select id="rarity" value={filtroRareza} onChange={(e) => onChangeRareza(e.target.value)}>
          <option value="all">{t("allRarities")}</option>
          {TIERS.map((tier) => (
            <option key={tier} value={tier}>{t(RAREZA_TRADUCCIONES[tier])}</option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="time">{t("filterObtained")}</label>
        <select id="time" value={filtroTiempo} onChange={(e) => onChangeTiempo(e.target.value)}>
          <option value="all">{t("filterAllDates")}</option>
          <option value="24h">{t("filterLast24h")}</option>
          <option value="7d">{t("filterLast7d")}</option>
          <option value="30d">{t("filterLast30d")}</option>
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="sort">{t("sortBy")}</label>
        <select id="sort" value={criterioOrdenacion} onChange={(e) => onChangeOrdenacion(e.target.value)}>
          <option value="login">{t("sortLogin")}</option>
          <option value="rareza">{t("sortRarity")}</option>
          <option value="nivel">{t("sortLevel")}</option>
          <option value="repetidas">{t("sortDuplicates")}</option>
        </select>
      </div>
    </section>
  );
}