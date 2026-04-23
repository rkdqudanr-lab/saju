import { getCompatTier } from './groupUtils.js';

export default function TeamChemiSummary({ members, pairs }) {
  if (pairs.length < 1) return null;
  const sorted = [...pairs].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const bestTier = getCompatTier(best.score);
  const worstTier = getCompatTier(worst.score);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
      <div style={{ padding: '10px 12px', borderRadius: 'var(--r1)', background: `${bestTier.color}10`, border: `1px solid ${bestTier.color}30` }}>
        <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 4 }}>✨ 베스트 케미</div>
        <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: bestTier.color, marginBottom: 2 }}>
          {members[best.idxA]?.name} × {members[best.idxB]?.name}
        </div>
        <div style={{ fontSize: '11px', color: bestTier.color, fontWeight: 700 }}>{best.score}%</div>
      </div>
      <div style={{ padding: '10px 12px', borderRadius: 'var(--r1)', background: `${worstTier.color}10`, border: `1px solid ${worstTier.color}30` }}>
        <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 4 }}>⚖️ 주의 케미</div>
        <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: worstTier.color, marginBottom: 2 }}>
          {members[worst.idxA]?.name} × {members[worst.idxB]?.name}
        </div>
        <div style={{ fontSize: '11px', color: worstTier.color, fontWeight: 700 }}>{worst.score}%</div>
      </div>
    </div>
  );
}
