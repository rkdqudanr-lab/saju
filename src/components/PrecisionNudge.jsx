import { useAppStore } from '../store/useAppStore.js';

const MAX_SCORE = 50;

const LEVEL_META = {
  low:  { label: '기본',   color: 'var(--t4)',  bg: 'var(--bg2)' },
  mid:  { label: '중간',   color: '#6ab187',    bg: 'rgba(106,177,135,.08)' },
  high: { label: '초정밀', color: 'var(--gold)', bg: 'var(--goldf)' },
};

export default function PrecisionNudge() {
  const dataPrecision = useAppStore((s) => s.dataPrecision);
  const setStep       = useAppStore((s) => s.setStep);
  const { total = 0, level = 'low' } = dataPrecision || {};

  if (level === 'high') return null;

  const pct      = Math.min(Math.round((total / MAX_SCORE) * 100), 100);
  const meta     = LEVEL_META[level] || LEVEL_META.low;
  const nextPts  = level === 'low' ? 25 - total : 50 - total;
  const message  = level === 'low'
    ? '생시(태어난 시간)를 입력하면 분석이 훨씬 깊어져요'
    : '고민 키워드와 인생 단계를 채우면 초정밀 분석이 가능해요';

  return (
    <div
      style={{
        margin: '20px 0 0',
        padding: '16px 18px',
        background: meta.bg,
        border: `1px solid ${meta.color}33`,
        borderRadius: 16,
        animation: 'fadeUp .35s ease',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 'var(--xs)', color: meta.color, fontWeight: 700, letterSpacing: '.06em' }}>
          ✦ 나의 별숨 정밀도
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
          {total}점 / {MAX_SCORE}점 · <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
        </div>
      </div>

      {/* 게이지 바 */}
      <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: meta.color,
            borderRadius: 4,
            transition: 'width .6s ease',
          }}
        />
      </div>

      {/* 메시지 + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
          {message}
          <span style={{ color: meta.color, fontWeight: 600 }}> (+{nextPts}점이면 다음 레벨)</span>
        </div>
        <button
          onClick={() => setStep(13)}
          style={{
            flexShrink: 0,
            padding: '7px 14px',
            background: 'none',
            border: `1px solid ${meta.color}`,
            borderRadius: 20,
            color: meta.color,
            fontSize: 'var(--xs)',
            fontWeight: 600,
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          채우기 →
        </button>
      </div>
    </div>
  );
}
