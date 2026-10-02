export const SubtituloSeccion = ({ children }) => {
    const estiloSubtitulo = {
        fontFamily: 'var(--font-heading)',
        fontSize: '0.82rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
    };

    return <span style={estiloSubtitulo}>{children}</span>;
};