import { useNavigate } from "react-router-dom";
import { Badge, Button, Modal, SecondaryButton } from "../../ui";
import { useI18n } from "../../../i18n";

const LOGOS_COALICIONES = {
  zefiria: "/icons/zefiria_logo.png",
  marventis: "/icons/marventis_logo.png",
  tiamant: "/icons/logo_tiamant.png",
  ignisaria: "/icons/ignisaria_logo.png",
};

export default function ModalDetalleCarta({ carta, usuariosRegistrados, onCerrar }) {
  const navegar = useNavigate();
  const { t } = useI18n();

  if (!carta) return null;

  const estaRegistradoEnWeb = usuariosRegistrados.has(carta.loginUsuario);
  const irAlPerfil = () => navegar(`/perfil/${carta.loginUsuario}`);
  const logoCoalicion = LOGOS_COALICIONES[carta.nombreCoalicion?.toLowerCase()];

  return (
    <Modal open onClose={onCerrar} labelledBy="titulo-carta">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {logoCoalicion && (
            <img
              src={logoCoalicion}
              alt={carta.nombreCoalicion}
              title={carta.nombreCoalicion}
              style={{ width: "34px", height: "34px", objectFit: "contain" }}
            />
          )}
          <h2 id="titulo-carta" style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.4rem" }}>
            {carta.loginUsuario}
          </h2>
          <Badge tone={carta.rarezaCss}>{carta.categoriaTier.toUpperCase()}</Badge>
        </div>

        {carta.urlFoto ? (
          <img
            src={carta.urlFoto}
            alt={t('photoOfUser', { login: carta.loginUsuario })}
            style={{
              width: "100%", maxHeight: "260px", objectFit: "cover",
              borderRadius: "12px", border: "2px solid var(--border-default)",
            }}
          />
        ) : (
          <div style={{ fontSize: "4rem", textAlign: "center" }}>👤</div>
        )}

        {carta.tituloPersonalizado && carta.tituloPersonalizado !== carta.loginUsuario && (
          <p style={{ margin: 0, color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center" }}>
            {carta.tituloPersonalizado}
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem" }}>
          <BloqueDato etiqueta={t("level")} valor={carta.nivelFormateado} />
          <BloqueDato etiqueta={t("coalition")} valor={carta.nombreCoalicion} />
          <BloqueDato etiqueta={t("evaluations")} valor={carta.puntosEvaluacion} />
          <BloqueDato etiqueta={t("wallet")} valor={carta.saldoAltarians} />
        </div>

        {carta.cantidadCopias > 1 && (
          <p style={{ margin: 0, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {t("copiesOfCard", { count: carta.cantidadCopias })}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <SecondaryButton onClick={onCerrar}>{t("close")}</SecondaryButton>
          {estaRegistradoEnWeb ? (
            <Button onClick={irAlPerfil}>{t("viewTheirProfile")}</Button>
          ) : (
            <span style={{ alignSelf: "center", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
              {t("notRegisteredYet")}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}

function BloqueDato({ etiqueta, valor }) {
  return (
    <div style={{
      background: "var(--surface-overlay)",
      border: "1px solid var(--border-default)",
      borderRadius: "10px",
      padding: "0.6rem",
      textAlign: "center",
    }}>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, color: "var(--accent)" }}>{valor}</div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>{etiqueta}</div>
    </div>
  );
}