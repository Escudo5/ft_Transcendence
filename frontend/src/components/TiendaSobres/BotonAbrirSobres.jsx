import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '../../i18n';

export default function BotonAbrirSobres({ to = '/tienda-sobre', children }) {
  const sinMovimiento = useReducedMotion();
  const { t } = useI18n();

  return (
    <Link
      to={to}
      aria-label={t('openPacks')}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.6rem 1.2rem',
        borderRadius: '999px',
        textDecoration: 'none',
        // El borde lleva el degradado del proyecto: se pinta el fondo dos
        // veces, uno para el relleno y otro para el borde, y se recortan por
        // separado. Es la forma de tener un borde con degradado sin añadir
        // un elemento de más.
        border: '1px solid transparent',
        backgroundImage:
          'linear-gradient(var(--surface-raised), var(--surface-raised)), var(--degradado-titulo)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        isolation: 'isolate',
      }}
    >
      {/* El resplandor que respira, detrás de todo */}
      <motion.span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-40%',
          zIndex: -1,
          background:
            'radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 62%)',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0.16 }}
        animate={sinMovimiento ? { opacity: 0.16 } : { opacity: [0.14, 0.34, 0.14] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* El brillo que lo cruza, como el reflejo de un cromo */}
      {!sinMovimiento && (
        <motion.span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '42%',
            zIndex: 0,
            background:
              'linear-gradient(100deg, transparent, rgba(255,255,255,0.22), transparent)',
            pointerEvents: 'none',
          }}
          initial={{ left: '-50%' }}
          animate={{ left: ['-50%', '120%'] }}
          transition={{
            duration: 1.1,
            // El grueso del tiempo es la espera: cruza y desaparece casi 4
            // segundos. Si cruzara sin parar, mareaba.
            repeatDelay: 3.9,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <CartasAbanicadas quieto={sinMovimiento} />

      <span
        style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: 'var(--font-heading)',
          fontSize: '0.82rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          // El texto pintado con el degradado del proyecto, igual que hace
          // .titulo-degradado en styles.css
          backgroundImage: 'var(--degradado-titulo)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          // Si el navegador no supiera recortar el fondo al texto, quedaría
          // invisible. Este respaldo evita eso.
          WebkitTextFillColor: 'transparent',
        }}
      >
        {children ?? t('openPacks')}
      </span>
    </Link>
  );
}

/* Tres cartas abanicadas. La del medio sobresale y late un poco; al pasar el
   ratón por el botón, las de los lados se abren. */
function CartasAbanicadas({ quieto }) {
  const carta = {
    width: 9,
    height: 13,
    rx: 1.6,
    strokeWidth: 1.3,
    fill: 'var(--surface-base, #0c0f16)',
  };

  return (
    <motion.svg
      width="22"
      height="20"
      viewBox="0 0 24 22"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'relative', zIndex: 1, overflow: 'visible', flexShrink: 0 }}
      initial="quieta"
      whileHover="abierta"
      animate={quieto ? 'quieta' : 'latiendo'}
      variants={{
        latiendo: { scale: [1, 1.06, 1], transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } },
        quieta: { scale: 1 },
        abierta: { scale: 1.08 },
      }}
    >
      {/* Izquierda */}
      <motion.rect
        x="1" y="6" {...carta}
        stroke="var(--accent)" opacity="0.55"
        variants={{ quieta: { rotate: -14 }, latiendo: { rotate: -14 }, abierta: { rotate: -24, x: -2 } }}
        style={{ originX: '50%', originY: '100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      />
      {/* Derecha */}
      <motion.rect
        x="14" y="6" {...carta}
        stroke="var(--accent)" opacity="0.55"
        variants={{ quieta: { rotate: 14 }, latiendo: { rotate: 14 }, abierta: { rotate: 24, x: 2 } }}
        style={{ originX: '50%', originY: '100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      />
      {/* La del medio, la protagonista */}
      <rect x="7.5" y="3" {...carta} stroke="var(--accent)" />
      {/* Un destello dentro de la carta central */}
      <path
        d="M12 6.4l0.7 1.7 1.7 0.7-1.7 0.7-0.7 1.7-0.7-1.7-1.7-0.7 1.7-0.7z"
        fill="var(--accent)"
      />
    </motion.svg>
  );
}
