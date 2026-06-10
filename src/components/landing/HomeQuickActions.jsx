export default function HomeQuickActions({ title = '바로가기', items = [] }) {
  if (!items.length) return null;

  return (
    <section className="home-section home-quick-actions" aria-label={title}>
      <div className="home-section-head">
        <h2 className="home-section-title">{title}</h2>
      </div>
      <div className="home-mini-grid">
        {items.map((item, index) => (
          <button
            key={item.label || index}
            type="button"
            className={`home-mini-action${item.accent ? ' is-accent' : ''}`}
            onClick={item.onClick}
            aria-label={item.ariaLabel || item.label}
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="home-mini-image"
                loading="lazy"
                decoding="async"
                aria-hidden="true"
                draggable={false}
              />
            ) : (
              <span className="home-mini-icon" aria-hidden="true">{item.icon}</span>
            )}
            <span className="home-mini-copy">
              <span className="home-mini-label">{item.label}</span>
              {item.meta && <span className="home-mini-meta">{item.meta}</span>}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
