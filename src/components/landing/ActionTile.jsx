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
      <button
        type="button"
        className="tile-hero"
        onClick={onClick}
        aria-label={ariaLabel || title}
      >
        <div className="tile-hero-icon">{icon}</div>
        <div className="tile-hero-body">
          <div className="tile-title">{title}</div>
          {sub && <div className="tile-sub">{sub}</div>}
        </div>
        <span className="tile-hero-arrow">{HERO_ARROW}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`tile${accent ? ' tile-accent' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel || title}
    >
      <div className="tile-icon">{icon}</div>
      <div className="tile-title">{title}</div>
      {sub && <div className="tile-sub">{sub}</div>}
      {progressFill !== null && (
        <div className="tile-progress">
          <div
            className="tile-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progressFill))}%` }}
          />
        </div>
      )}
      {badge && (
        <div className="tile-badge">
          {badge}
        </div>
      )}
    </button>
  );
}
