// 태양별자리 · 달별자리 · 상승궁 세 점을 시각화하는 컴포넌트

const SIGN_ELEMENT = {
  양: 'fire', 사자: 'fire', 사수: 'fire',
  황소: 'earth', 처녀: 'earth', 염소: 'earth',
  쌍둥이: 'air', 천칭: 'air', 물병: 'air',
  게: 'water', 전갈: 'water', 물고기: 'water',
};

const ELEMENT_COLOR = {
  fire:  '#E07050',
  earth: '#C08830',
  air:   '#6BBFB5',
  water: '#4A8EC4',
};

const ZODIAC_GLYPH = {
  양: '♈', 황소: '♉', 쌍둥이: '♊', 게: '♋',
  사자: '♌', 처녀: '♍', 천칭: '♎', 전갈: '♏',
  사수: '♐', 염소: '♑', 물병: '♒', 물고기: '♓',
};

function getColor(shortName) {
  const el = SIGN_ELEMENT[shortName];
  return el ? ELEMENT_COLOR[el] : 'var(--t4)';
}
function getGlyph(shortName) {
  return ZODIAC_GLYPH[shortName] || '✦';
}

function SignOrb({ roleIcon, roleLabel, sign, size = 58 }) {
  if (!sign) return <div style={{ minWidth: 80 }} />;
  const color = getColor(sign.s);
  const glyph = getGlyph(sign.s);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 72 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `${color}1A`,
        border: `2px solid ${color}55`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 16px ${color}2A`,
        animation: 'asOrb 3.4s ease-in-out infinite',
        position: 'relative',
        gap: 1,
      }}>
        <span style={{ fontSize: size * 0.28, lineHeight: 1, color: 'var(--t3)' }}>{roleIcon}</span>
        <span style={{ fontSize: size * 0.36, lineHeight: 1, color }}>
          {glyph}
        </span>
        <div style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          border: `1px solid ${color}2A`,
          animation: 'asRing 3.4s ease-in-out infinite',
        }} />
      </div>
      <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>
        {sign.n || `${sign.s}자리`}
      </div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', textAlign: 'center' }}>
        {roleLabel}
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 24 }}>
      <svg width="100%" height="16" style={{ overflow: 'visible' }}>
        <line x1="0" y1="8" x2="100%" y2="8"
          stroke="var(--line)" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    </div>
  );
}

export default function AstroSignViz({ sun, moon, asc }) {
  if (!sun && !moon && !asc) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 4, padding: '16px 8px 8px',
    }}>
      <style>{`
        @keyframes asOrb {
          0%, 100% { box-shadow: 0 0 12px var(--as-c, #888)2A; }
          50%       { box-shadow: 0 0 22px var(--as-c, #888)44; }
        }
        @keyframes asRing {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50%       { transform: scale(1.07); opacity: 0.8; }
        }
      `}</style>

      {sun && <SignOrb roleIcon="☀" roleLabel="태양별자리" sign={sun} />}
      {sun && (asc || moon) && <Connector />}
      {asc && <SignOrb roleIcon="↑" roleLabel="상승궁" sign={asc} size={52} />}
      {asc && moon && <Connector />}
      {!asc && sun && moon && <Connector />}
      {moon && <SignOrb roleIcon="🌙" roleLabel="달별자리" sign={moon} />}
    </div>
  );
}
