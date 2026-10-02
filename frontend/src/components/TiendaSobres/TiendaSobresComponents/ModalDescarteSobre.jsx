import { Modal } from '../../ui';

export const ModalDescarteSobre = ({
  sobreSeleccionado,
  album,
  seleccionDescarte,
  procesandoDescarte,
  mensajeDescarte,
  alCerrar,
  alCambiarGrupos,
  alConfirmarDescarte,
  traduccion,
}) => {
  if (!sobreSeleccionado) return null;

  const cartasFiltradas = album.filter(
    (carta) => sobreSeleccionado.rarezas.includes(carta.tier) && carta.cantidad >= 5
  );

  return (
    <Modal
      onClose={() => !procesandoDescarte && alCerrar()}
      labelledBy="selector-sobre-titulo"
      className="discard-modal"
    >
      <div className="discard-modal-header">
        <div>
          <span className="discard-modal-kicker">{traduccion('duplicatesExchange')}</span>
          <h2 id="selector-sobre-titulo">{sobreSeleccionado.nombre}</h2>
        </div>
        <button
          type="button"
          className="discard-modal-close"
          onClick={alCerrar}
          aria-label={traduccion('closeSelector')}
          disabled={procesandoDescarte}
        >
          ×
        </button>
      </div>

      <p className="discard-modal-intro">{traduccion('discardIntro')}</p>

      <div className="discard-card-list">
        {cartasFiltradas.map((carta) => {
          const maxGrupos = Math.floor((carta.cantidad - 1) / 4);
          const grupos = seleccionDescarte[carta.cardId] || 0;

          return (
            <div
              key={carta.cardId}
              className="discard-card-row"
              style={{ '--discard-color': sobreSeleccionado.color }}
            >
              <div className="discard-card-info">
                <strong>{carta.login}</strong>
                <span>{carta.cantidad} copias</span>
              </div>
              <div
                className="discard-stepper"
                role="group"
                aria-label={traduccion('burnGroupsOf', { login: carta.login })}
              >
                <button
                  type="button"
                  onClick={() => alCambiarGrupos(carta.cardId, grupos - 1)}
                  disabled={grupos === 0 || procesandoDescarte}
                  aria-label={traduccion('burnRemoveGroupOf', { login: carta.login })}
                >
                  −
                </button>
                <span aria-live="polite">
                  <strong>{grupos}</strong>
                  <small>{' ' + traduccion('groupsWord', { s: grupos === 1 ? '' : 's' })}</small>
                </span>
                <button
                  type="button"
                  onClick={() => alCambiarGrupos(carta.cardId, grupos + 1)}
                  disabled={grupos === maxGrupos || procesandoDescarte}
                  aria-label={traduccion('burnAddGroupOf', { login: carta.login })}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {cartasFiltradas.length === 0 && (
        <p className="discard-empty">{traduccion('discardEmpty')}</p>
      )}

      {mensajeDescarte && <p role="status">{mensajeDescarte}</p>}

      <div className="discard-modal-actions">
        <button
          type="button"
          className="discard-cancel-button"
          onClick={alCerrar}
          disabled={procesandoDescarte}
        >
          {traduccion('cancel')}
        </button>
        <button
          type="button"
          className="discard-confirm-button"
          onClick={alConfirmarDescarte}
          disabled={procesandoDescarte || !Object.keys(seleccionDescarte).length}
        >
          {procesandoDescarte ? traduccion('burning') : traduccion('confirmAndBurn')}
        </button>
      </div>
    </Modal>
  );
};