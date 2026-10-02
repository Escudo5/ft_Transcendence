export const NaipeCaraA = ({ rareza}) => {
    return (
        <div
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                backgroundColor: 'var(--surface-raised)',
                border: rareza.border,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: rareza.shadow
            }}
        >
            <div style={{ color: rareza.color, fontWeight: 'bold', fontSize: '2rem', textShadow: `0 0 10px ${rareza.color}` }}>
                42
            </div>
        </div>
    )
}