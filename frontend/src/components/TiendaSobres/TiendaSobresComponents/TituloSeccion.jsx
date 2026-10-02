export const TituloSeccion = ({ id, children }) => {
    /* Tipografía de los títulos de las dos secciones. Solo del TEXTO: los
 * recuadros se quedan como están. Usa las fuentes del sistema de diseño de
 * Sergio (styles.css), no una nueva. */
    const tituloSeccion = {
        fontFamily: 'var(--font-heading)',
        fontSize: '1.35rem',
        fontWeight: 800,
        letterSpacing: '-0.01em',
        margin: 0,
        color: 'var(--text-primary)',
    };
    return
    <h2 id={id} style={tituloSeccion}>{children}</h2>
}