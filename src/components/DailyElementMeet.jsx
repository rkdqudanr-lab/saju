import { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { CG, CGO, OC, OE, ON } from '../utils/saju.js';

const SHENG = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const KE    = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' };

function getRelation(myEl, todayEl) {
  if (!myEl || !todayEl) return { label: '오늘의 흐름', tone: 'neutral' };
  if (myEl === todayEl)          return { label: '같은 기운이 공명하는 날',   tone: 'same' };
  if (SHENG[myEl] === todayEl)   return { label: '내가 오늘을 이끄는 날',     tone: 'give' };
  if (KE[myEl] === todayEl)      return { label: '내가 흐름을 다스리는 날',   tone: 'control' };
  if (KE[todayEl] === myEl)      return { label: '외부 흐름이 나를 다듬는 날', tone: 'tension' };
  return                               { label: '오늘이 나를 지지하는 날',    tone: 'receive' };
}

const TONE_LINE = {
  same:    'var(--gold)',
  give:    '#7DE8C4',
  control: 'var(--gold)',
  tension: '#E87B8A',
  receive: '#9B8EC4',
  neutral: 'var(--line)',
};

function Orb({ el, gan, sublabel, size = 64 }) {
  const color = OC[el] || 'var(--t3)';
  const emoji = el === '금' ? '⚪' : (OE[el] || '·');
  const name  = ON[el] || el;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `${color}22`,
        border: `2px solid ${color}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38,
        boxShadow: `0 0 18px ${color}33`,
        animation: 'dmOrb 3s ease-in-out infinite',
        position: 'relative',
      }}>
        <span role="img" aria-hidden="true">{emoji}</span>
        <div style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          border: `1px solid ${color}33`,
          animation: 'dmRing 3s ease-in-out infinite',
        }} />
      </div>
      <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)' }}>{name}</div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', textAlign: 'center', lineHeight: 1.4 }}>
        {sublabel}<br />{gan}
      </div>
    </div>
  );
}

function FlowLine({ tone, dir }) {
  const color = TONE_LINE[tone] || TONE_LINE.neutral;
  const dots = [0, 1, 2];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 60 }}>
      <svg width="100%" height="24" style={{ overflow: 'visible' }}>
        <line x1="0" y1="12" x2="100%" y2="12" stroke={`${color}44`} strokeWidth="1.5" strokeDasharray="4 4" />
        {dots.map((i) => (
          <circle
            key={i}
            cx="50%"
            cy="12"
            r="3.5"
            fill={color}
            style={{
              animation: `dmDot${dir === 'left' ? 'R' : 'L'} 1.8s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
              opacity: 0.85,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function DailyElementMeet({ myGan, todayGan }) {
  const data = useMemo(() => {
    if (!myGan || !todayGan) return null;
    const myIdx    = CG.indexOf(myGan);
    const todayIdx = CG.indexOf(todayGan);
    if (myIdx === -1 || todayIdx === -1) return null;
    const myEl    = CGO[myIdx];
    const todayEl = CGO[todayIdx];
    const rel     = getRelation(myEl, todayEl);
    return { myEl, todayEl, rel };
  }, [myGan, todayGan]);

  const containerRef = useRef(null);
  const [showLabel, setShowLabel] = useState(true);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setShowLabel(el.getBoundingClientRect().width >= 260);
    const ro = new ResizeObserver(([entry]) => {
      setShowLabel(entry.contentRect.width >= 260);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!data) return null;
  const { myEl, todayEl, rel } = data;

  return (
    <div ref={containerRef} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '20px 12px 12px',
    }}>
      <style>{`
        @keyframes dmOrb {
          0%, 100% { box-shadow: 0 0 14px ${OC[myEl] || '#888'}33; }
          50%       { box-shadow: 0 0 26px ${OC[myEl] || '#888'}55; }
        }
        @keyframes dmRing {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.08); opacity: 0.9; }
        }
        @keyframes dmDotL {
          0%   { transform: translateX(-28px); opacity: 0; }
          30%  { opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translateX(28px); opacity: 0; }
        }
        @keyframes dmDotR {
          0%   { transform: translateX(28px); opacity: 0; }
          30%  { opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translateX(-28px); opacity: 0; }
        }
      `}</style>

      <Orb el={myEl} gan={myGan} sublabel="나의 일간" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 60 }}>
        <FlowLine tone={rel.tone} dir={rel.tone === 'receive' || rel.tone === 'tension' ? 'left' : 'right'} />
        {showLabel && (
          <div style={{
            fontSize: 'var(--xs)', color: 'var(--t3)', textAlign: 'center',
            background: 'var(--bg2)', borderRadius: 20,
            padding: '3px 10px', border: '1px solid var(--line)',
            whiteSpace: 'nowrap',
          }}>
            {rel.label}
          </div>
        )}
      </div>
      <Orb el={todayEl} gan={todayGan} sublabel="오늘 일진" />
    </div>
  );
}
