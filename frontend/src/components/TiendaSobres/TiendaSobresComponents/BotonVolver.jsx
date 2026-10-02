export const BotonVolver = ({ alHacerClic, texto }) => {
  return (
    <button
      onClick={alHacerClic}
      className="back-btn-link floating-pack-back-button"
      style={{
        padding: '0.8rem 1.5rem',
        fontSize: '1.2rem',
        cursor: 'pointer',
        borderRadius: '50px',
        backgroundColor: 'var(--surface-raised)',
        color: '#fff',
        border: '2px solid #ff9ffc',
        boxShadow: '0 0 10px rgba(255,159,252,0.3)',
      }}
    >
      {texto}
    </button>
  );
};
