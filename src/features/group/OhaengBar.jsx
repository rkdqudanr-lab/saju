import { OHAENG_COLOR, OHAENG_CHAR } from './groupUtils.js';

export default function OhaengBar({ members }) {
  const total = members.length;
  if (!total) return null;
  const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  members.forEach((m) => { if (m.saju?.dom && counts[m.saju.dom] !== undefined) counts[m.saju.dom]++; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  return (
    <div style={{ marginBottom: 16, background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--line)', padding: '16px 16px 14px' }}>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 14, letterSpacing: '.05em' }}>✦ 우리 모임의 오행 기운</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 72 }}>
        {Object.entries(counts).map(([el, cnt]) => {
          const pct = total ? cnt / total : 0;
          const color = OHAENG_COLOR[el];
          const barH = Math.max(4, pct * 52);
          const isDom = cnt > 0 && cnt === dominant[1];
          return (
            <div key={el} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: cnt > 0 ? 'var(--t1)' : 'var(--t4)', opacity: cnt > 0 ? 1 : 0.4 }}>{cnt}</div>
              <div style={{ width: '100%', height: barH, borderRadius: '4px 4px 0 0', background: cnt > 0 ? color : 'var(--bg3)', opacity: cnt > 0 ? 1 : 0.3, transition: 'height 0.7s cubic-bezier(.34,1.56,.64,1)', boxShadow: isDom ? `0 0 12px ${color}66, 0 0 4px ${color}44` : 'none' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: cnt > 0 ? color : 'var(--t4)', opacity: cnt > 0 ? 1 : 0.4, textShadow: isDom ? `0 0 8px ${color}88` : 'none' }}>{OHAENG_CHAR[el]}</div>
            </div>
          );
        })}
      </div>
      {dominant[1] > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 'var(--xs)', color: 'var(--t3)', textAlign: 'center', lineHeight: 1.6 }}>
          이 모임은{' '}
          <span style={{ color: OHAENG_COLOR[dominant[0]], fontWeight: 700, textShadow: `0 0 8px ${OHAENG_COLOR[dominant[0]]}66` }}>
            {OHAENG_CHAR[dominant[0]]} {dominant[0]} 기운
          </span>
          {' '}이 강해요
          {sorted[1]?.[1] > 0 && sorted[1][0] !== dominant[0] && (
            <span style={{ color: 'var(--t4)' }}>{' · '}<span style={{ color: OHAENG_COLOR[sorted[1][0]] }}>{OHAENG_CHAR[sorted[1][0]]}</span> 기운도 함께해요</span>
          )}
        </div>
      )}
    </div>
  );
}
