const CORE_TONES = {
  목: {
    label: '목기운 코어',
    glyph: '芽',
    color: '#7EC8A4',
    soft: 'rgba(126,200,164,0.18)',
    ring: 'rgba(126,200,164,0.42)',
    text: '새싹처럼 천천히 자라며 오늘의 가능성을 품는 별숨이에요.',
    keyword: '성장',
  },
  화: {
    label: '화기운 코어',
    glyph: '火',
    color: '#E8B048',
    soft: 'rgba(232,176,72,0.2)',
    ring: 'rgba(232,176,72,0.48)',
    text: '따뜻한 빛으로 공간을 깨우고 마음의 온도를 올리는 별숨이에요.',
    keyword: '온기',
  },
  토: {
    label: '토기운 코어',
    glyph: '土',
    color: '#C9A66B',
    soft: 'rgba(201,166,107,0.2)',
    ring: 'rgba(201,166,107,0.46)',
    text: '단단한 중심으로 하루의 흐름을 받쳐주는 별숨이에요.',
    keyword: '중심',
  },
  금: {
    label: '금기운 코어',
    glyph: '金',
    color: '#9BADCE',
    soft: 'rgba(155,173,206,0.2)',
    ring: 'rgba(155,173,206,0.46)',
    text: '맑은 결정처럼 생각을 정돈하고 기준을 세우는 별숨이에요.',
    keyword: '정돈',
  },
  수: {
    label: '수기운 코어',
    glyph: '水',
    color: '#7EC8E3',
    soft: 'rgba(126,200,227,0.2)',
    ring: 'rgba(126,200,227,0.46)',
    text: '고요한 물결처럼 마음을 살피고 감각을 깨우는 별숨이에요.',
    keyword: '흐름',
  },
};

const FALLBACK_CORE = {
  label: '별숨 코어',
  glyph: '✦',
  color: '#E8B048',
  soft: 'rgba(232,176,72,0.18)',
  ring: 'rgba(232,176,72,0.44)',
  text: '운세를 볼수록 조금씩 채워지는 나만의 별숨이에요.',
  keyword: '시작',
};

export function getByeolsoomCoreTone(saju) {
  return CORE_TONES[saju?.dom] || FALLBACK_CORE;
}

export default function ByeolsoomCore({ saju, level = 1, stardust = 0 }) {
  const core = getByeolsoomCoreTone(saju);
  return (
    <section style={{
      borderRadius: 24,
      border: '1px solid rgba(232,176,72,0.24)',
      background: 'linear-gradient(180deg, rgba(232,176,72,0.08), rgba(255,255,255,0.02)), var(--bg2)',
      padding: 18,
      marginBottom: 16,
      overflow: 'hidden',
    }}>
      <div style={{
        minHeight: 270,
        borderRadius: 20,
        border: '1px solid var(--line)',
        background: `radial-gradient(circle at 50% 38%, ${core.soft}, transparent 34%), linear-gradient(180deg, var(--bg1), var(--bg2))`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}>
        <div style={{ position: 'absolute', top: 18, left: 18, fontSize: 10, color: 'var(--gold)', fontWeight: 800, letterSpacing: '.08em' }}>MY BYEOLSOOM</div>
        <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--t4)', border: '1px solid var(--line)', borderRadius: 999, padding: '4px 8px', background: 'var(--bg2)' }}>Lv.{level}</span>
          <span style={{ fontSize: 11, color: 'var(--gold)', border: '1px solid var(--acc)', borderRadius: 999, padding: '4px 8px', background: 'var(--goldf)' }}>{stardust} 별가루</span>
        </div>

        <div style={{ textAlign: 'center', width: '100%', maxWidth: 300 }}>
          <div style={{
            width: 132,
            height: 132,
            borderRadius: '50%',
            margin: '0 auto 16px',
            background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.72), ${core.soft} 36%, rgba(12,10,20,0.18) 72%)`,
            border: `1px solid ${core.color}`,
            boxShadow: `0 0 36px ${core.ring}, inset 0 0 24px rgba(255,255,255,0.12)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            color: core.color,
          }}>
            <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: `1px solid ${core.ring}` }} />
            <div style={{ position: 'absolute', inset: 22, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)' }} />
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{core.glyph}</div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: core.soft, border: `1px solid ${core.ring}`, color: core.color, fontSize: 10, fontWeight: 900, marginBottom: 8 }}>
            {core.keyword}
          </div>
          <div style={{ fontSize: 'var(--md)', color: core.color, fontWeight: 900, marginBottom: 7 }}>{core.label}</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.75 }}>{core.text}</div>
        </div>
      </div>
    </section>
  );
}

