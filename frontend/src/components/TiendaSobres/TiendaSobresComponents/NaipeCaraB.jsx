export const NaipeCaraB = ({  rareza }) => {
    return (
        <div
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)', // Arranca invertida para el efecto de giro
                background: 'rgba(9,9,11,0.95)',
                borderRadius: '12px',
                border: rareza.border,
                boxShadow: rareza.shadow,
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem',
                justifyContent: 'space-between',
                color: '#fff'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 'bold' }}>{carta.login}</span>
                <span style={{ color: rareza.color, fontWeight: 'bold', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    {carta.tier}
                </span>
            </div>

            <div style={{ width: '100%', height: '110px', background: rareza.background, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', overflow: 'hidden' }}>
                {carta.foto ? (
                    <img
                        src={carta.foto}
                        alt={carta.login}
                        style={{ height: '110px', maxWidth: '85px', objectFit: 'cover', objectPosition: 'center top', borderRadius: '0.05px' }}
                    />
                ) : (
                    // Por si ese alumno no tiene foto en la Intra
                    '👤'
                )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', borderTop: '1px solid #333', paddingTop: '0.5rem' }}>
                {carta.nombre}
            </div>
        </div>
    )
}