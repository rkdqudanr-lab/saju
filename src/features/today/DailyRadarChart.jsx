import { AXES_9, getDailyAxisScores } from './getDailyAxisScores.js';

export default function DailyRadarChart({ baseScore, equippedItems }) {
  const scores = getDailyAxisScores(baseScore, equippedItems);
  const cx = 130, cy = 130, r = 90;
  const n = AXES_9.length;
  const angleStep = (2 * Math.PI) / n;
  const toXY = (angle, radius) => ({ x: cx + radius * Math.sin(angle), y: cy - radius * Math.cos(angle) });

  const basePoints = scores.map((s, i) => { const p = toXY(angleStep * i, (s.base / 100) * r); return `${p.x},${p.y}`; }).join(' ');
  const totalPoints = scores.map((s, i) => { const p = toXY(angleStep * i, (s.total / 100) * r); return `${p.x},${p.y}`; }).join(' ');

  const bonusAcc = scores.reduce((acc, s) => acc + s.bonus, 0);
  const weakest  = [...scores].sort((a, b) => a.total - b.total)[0];
  const strongest = [...scores].sort((a, b) => b.total - a.total)[0];

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>오늘의 운세 점수</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>
            {bonusAcc > 0
              ? <span style={{ color: 'var(--gold)' }}>아이템 효과가 점수에 바로 반영되고 있어요.</span>
              : '오늘 운세를 본 뒤 더 올리고 싶은 항목에 아이템을 사용할 수 있어요.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        {[
          { label: '9개 영역 평균', value: `${Math.round(scores.reduce((s, sc) => s + sc.total, 0) / scores.length)}점` },
          { label: '가장 약한 영역', value: `${weakest.label} ${weakest.total}점` },
          { label: '가장 강한 영역', value: `${strongest.label} ${strongest.total}점` },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: '10px 12px', background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--t4)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)' }}>{value}</div>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 260 260" width="100%" style={{ maxWidth: 280, display: 'block', margin: '0 auto' }}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
          <polygon key={level} points={Array.from({ length: n }, (_, i) => { const p = toXY(angleStep * i, level * r); return `${p.x},${p.y}`; }).join(' ')} fill="none" stroke="var(--line)" strokeWidth="1" />
        ))}
        {Array.from({ length: n }, (_, i) => { const o = toXY(angleStep * i, r); return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="var(--line)" strokeWidth="1" />; })}
        <polygon points={basePoints} fill="rgba(255,255,255,0.06)" stroke="var(--t4)" strokeWidth="1.5" strokeLinejoin="round" />
        {bonusAcc > 0 && <polygon points={totalPoints} fill="rgba(232,176,72,0.15)" stroke="var(--gold)" strokeWidth="2" strokeLinejoin="round" style={{ transition: 'all 0.5s ease-out' }} />}
        {scores.map((s, i) => { const p = toXY(angleStep * i, (s.total / 100) * r); return <circle key={i} cx={p.x} cy={p.y} r="4" fill={s.bonus > 0 ? 'var(--gold)' : 'var(--t4)'} style={{ transition: 'all 0.5s ease' }} />; })}
        {scores.map((s, i) => { const p = toXY(angleStep * i, r + 22); return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill={s.bonus > 0 ? 'var(--gold)' : 'var(--t2)'} fontSize={s.bonus > 0 ? '12' : '10'} fontWeight={s.bonus > 0 ? '700' : '400'} fontFamily="var(--ff)">{s.label}</text>; })}
      </svg>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {scores.map((s) => (
          <div key={s.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ minWidth: 34, fontSize: 11, color: s.bonus > 0 ? 'var(--gold)' : 'var(--t3)', fontWeight: s.bonus > 0 ? 700 : 400 }}>{s.label}</span>
              <div style={{ flex: 1, height: 5, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.total}%`, background: s.bonus > 0 ? 'linear-gradient(90deg, var(--t4) 0%, var(--gold) 100%)' : 'var(--t4)', borderRadius: 3, transition: 'width 0.6s ease-out' }} />
              </div>
              <span style={{ minWidth: 30, textAlign: 'right', fontSize: 11, fontWeight: 700, color: s.bonus > 0 ? 'var(--gold)' : 'var(--t3)' }}>{s.total}</span>
            </div>
            {s.bonus > 0 && s.boostItem && (
              <div style={{ paddingLeft: 42, marginTop: 2, fontSize: 10, color: 'var(--gold)', lineHeight: 1.4 }}>
                {s.boostItem.name} 효과로 +{s.bonus}점이 반영됐어요.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
