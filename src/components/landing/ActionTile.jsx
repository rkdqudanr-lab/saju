import { motion } from 'framer-motion';

const HERO_ARROW = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);

export default function ActionTile({
  icon,
  title,
  sub,
  onClick,
  accent = false,
  hero = false,
  progressFill = null,
  badge = null,
  ariaLabel,
}) {
  if (hero) {
    return (
      <motion.button
        type="button"
        className="tile-hero"
        onClick={onClick}
        aria-label={ariaLabel || title}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <motion.div className="tile-hero-icon" whileTap={{ scale: 1.12, rotate: -4 }}>
          {icon}
        </motion.div>
        <div className="tile-hero-body">
          <div className="tile-title">{title}</div>
          {sub && <div className="tile-sub">{sub}</div>}
        </div>
        <span className="tile-hero-arrow">{HERO_ARROW}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      className={`tile${accent ? ' tile-accent' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel || title}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <motion.div className="tile-icon" whileTap={{ scale: 1.15, rotate: -5 }}>
        {icon}
      </motion.div>
      <div className="tile-title">{title}</div>
      {sub && <div className="tile-sub">{sub}</div>}
      {progressFill !== null && (
        <div className="tile-progress">
          <motion.div
            className="tile-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progressFill))}%` }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      )}
      {badge && (
        <div className="tile-badge">
          {badge}
        </div>
      )}
    </motion.button>
  );
}
