export default function PurifyOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div className="purify-overlay" aria-hidden="true">
      <div className="purify-orb">
        <div className="purify-orb-core" />
        <div className="purify-ring purify-ring-1" />
        <div className="purify-ring purify-ring-2" />
        <div className="purify-ring purify-ring-3" />
      </div>
      <div className="purify-sparks">
        {['✦', '✧', '✦', '✧', '✦'].map((spark, idx) => (
          <span key={idx} className={`purify-spark purify-spark-${idx + 1}`}>{spark}</span>
        ))}
      </div>
      <div className="purify-text">정화 재점 중...</div>
    </div>
  );
}
