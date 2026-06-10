function MiniBars({ values = [] }) {
  const safeValues = values.filter((value) => value !== null && Number.isFinite(value));
  if (!safeValues.length) return null;

  return (
    <span className="feature-rail-bars" aria-hidden="true">
      {values.slice(-7).map((value, index) => (
        <span
          key={index}
          className="feature-rail-bar"
          style={{
            height: value === null ? 4 : Math.max(5, Math.min(28, Math.round((value / 100) * 28))),
            opacity: value === null ? 0.28 : 1,
          }}
        />
      ))}
    </span>
  );
}

export default function FeatureRail({ title, subtitle, items = [] }) {
  if (!items.length) return null;

  return (
    <section className="home-section feature-rail-section" aria-label={title}>
      <div className="home-section-head">
        <div>
          <h2 className="home-section-title">{title}</h2>
          {subtitle && <p className="home-section-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="feature-rail">
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            className={`feature-rail-card${item.accent ? ' is-accent' : ''}`}
            onClick={item.onClick}
            aria-label={item.ariaLabel || item.label}
          >
            <span className="feature-rail-top">
              <span className="feature-rail-icon" aria-hidden="true">{item.icon}</span>
              {item.badge && <span className="feature-rail-badge">{item.badge}</span>}
            </span>
            <span className="feature-rail-label">{item.label}</span>
            {item.sub && <span className="feature-rail-sub">{item.sub}</span>}
            {item.progress !== undefined && (
              <span className="feature-rail-progress" aria-hidden="true">
                <span style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
              </span>
            )}
            {item.bars && <MiniBars values={item.bars} />}
          </button>
        ))}
      </div>
    </section>
  );
}
