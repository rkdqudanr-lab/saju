export default function ActionTile({
  icon,
  title,
  sub,
  onClick,
  accent = false,
  progressFill = null,  // 0~100, null이면 미표시
  badge = null,
  ariaLabel,
}) {
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
        <div style={{
          marginTop: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          padding: '2px 7px',
          borderRadius: 999,
          background: 'var(--goldf)',
          border: '1px solid var(--acc)',
          fontSize: 10,
          color: 'var(--gold)',
          fontWeight: 700,
          alignSelf: 'flex-start',
        }}>
          {badge}
        </div>
      )}
    </button>
  );
}
