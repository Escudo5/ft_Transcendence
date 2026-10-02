export const TituloSeccion = ({ id, children }) => {
    const estiloTitulo = {
        fontFamily: 'var(--font-heading)',
        fontSize: '1.35rem',
        fontWeight: 800,
        letterSpacing: '-0.01em',
        margin: 0,
        color: 'var(--text-primary)',
    };

    return (
        <h2 id={id} style={estiloTitulo}>
            {children}
        </h2>
    );
};