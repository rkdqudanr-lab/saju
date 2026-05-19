// 태양별자리 · 달별자리 · 상승궁 시각화 — 흐르는 점 애니메이션

// sign.elem: "불" | "흙" | "바람" | "물"
const ELEM_COLOR = {
  불:  '#E07050',
  흙:  '#C08830',
  바람: '#6BBFB5',
  물:  '#4A8EC4',
};

function getColor(sign) {
  return ELEM_COLOR[sign?.elem] || 'var(--t3)';
}

function SignOrb({ roleIcon, roleLabel, sign, size = 58 }) {
  if (!sign) return <div style={{ minWidth: 72 }} />;
  const color   = getColor(sign);
  const glyph   = sign.s || '✦';       // ♉ ♏ etc.
  const dispName = sign.n || '';        // 황소자리
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 72 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `${color}1A`,
        border: `2px solid ${color}55`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 16px ${color}2A`,
        position: 'relative',
        gap: 1,
        animation: 'asOrb 3.4s ease-in-out infinite',
        '--as-color': color,
      }}>
        <span style={{ fontSize: size * 0.28, lineHeight: 1, color: 'var(--t3)' }}>{roleIcon}</span>
        <span style={{ fontSize: size * 0.36, lineHeight: 1, color }}>{glyph}</span>
        <div style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          border: `1px solid ${color}2A`,
          animation: 'asRing 3.4s ease-in-out infinite',
        }} />
      </div>
      <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>{dispName}</div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', textAlign: 'center' }}>{roleLabel}</div>
    </div>
  );
}

function FlowConnector({ fromColor, toColor }) {
  const mid = fromColor || toColor || 'var(--t4)';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 32 }}>
      <div style={{ position: 'relative', width: '100%', height: 20 }}>
        {/* 배경선 */}
        <svg width="100%" height="20" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
          <line x1="0" y1="10" x2="100%" y2="10"
            stroke={`${mid}44`} strokeWidth="1.5" strokeDasharray="4 4"/>
        </svg>
        {/* 흐르는 점 3개 */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: i === 1 ? 5 : 4,
            height: i === 1 ? 5 : 4,
            borderRadius: '50%',
            background: mid,
            marginTop: -(i === 1 ? 2.5 : 2),
            marginLeft: -(i === 1 ? 2.5 : 2),
            animation: 'asFlow 1.8s ease-in-out infinite',
            animationDelay: `${i * 0.6}s`,
            opacity: 0,
          }}/>
        ))}
      </div>
    </div>
  );
}

export default function AstroSignViz({ sun, moon, asc }) {
  if (!sun && !moon && !asc) return null;

  const sunColor  = getColor(sun);
  const moonColor = getColor(moon);
  const ascColor  = getColor(asc);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 4, padding: '16px 8px 8px',
    }}>
      <style>{`
        @keyframes asOrb {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.04); }
        }
        @keyframes asRing {
          0%, 100% { transform: scale(1);    opacity: 0.4; }
          50%       { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes asFlow {
          0%   { transform: translateX(-22px); opacity: 0; }
          25%  { opacity: 0.9; }
          75%  { opacity: 0.9; }
          100% { transform: translateX(22px);  opacity: 0; }
        }
      `}</style>

      {sun && <SignOrb roleIcon="☀" roleLabel="태양별자리" sign={sun} />}
      {sun && (asc || moon) && (
        <FlowConnector fromColor={sunColor} toColor={asc ? ascColor : moonColor} />
      )}
      {asc && <SignOrb roleIcon="↑" roleLabel="상승궁" sign={asc} size={52} />}
      {asc && moon && (
        <FlowConnector fromColor={ascColor} toColor={moonColor} />
      )}
      {!asc && sun && moon && (
        <FlowConnector fromColor={sunColor} toColor={moonColor} />
      )}
      {moon && <SignOrb roleIcon="🌙" roleLabel="달별자리" sign={moon} />}
    </div>
  );
}
