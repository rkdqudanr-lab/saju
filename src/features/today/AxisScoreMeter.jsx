import { LOW_AXIS_SCORE_THRESHOLD } from './getDailyAxisScores.js';

export default function AxisScoreMeter({ score, compact = false }) {
  const tone = score.bonus > 0 ? 'var(--gold)' : score.total <= LOW_AXIS_SCORE_THRESHOLD ? '#c46b4f' : 'var(--t4)';
  return (
    <div style={{ minWidth: compact ? 96 : 132 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: compact ? 10 : 11, color: 'var(--t4)' }}>
          {score.bonus > 0 ? `기본 ${score.base} · 보정 +${score.bonus}` : `기본 ${score.base}`}
        </span>
        <span style={{ fontSize: compact ? 15 : 17, fontWeight: 800, color: tone }}>{score.total}점</span>
      </div>
      <div style={{ height: compact ? 6 : 8, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${score.total}%`,
          background: score.bonus > 0
            ? 'linear-gradient(90deg, #d8b36a 0%, var(--gold) 100%)'
            : score.total <= LOW_AXIS_SCORE_THRESHOLD
              ? 'linear-gradient(90deg, #d58f6c 0%, #c46b4f 100%)'
              : 'linear-gradient(90deg, #8f8aaf 0%, var(--t4) 100%)',
          borderRadius: 999,
          transition: 'width 0.6s ease-out',
        }} />
      </div>
    </div>
  );
}
