import { useMemo } from 'react';

const THEMES = {
  tarot: {
    accent: 'rgba(200,165,80,0.92)',
    accentSoft: 'rgba(200,165,80,0.14)',
    border: 'rgba(200,165,80,0.34)',
    background: 'linear-gradient(180deg, rgba(13,11,30,0.98) 0%, rgba(22,17,38,0.99) 100%)',
    glow: 'radial-gradient(circle, rgba(200,165,80,0.14), transparent 68%)',
  },
  dream: {
    accent: 'rgba(171,149,255,0.92)',
    accentSoft: 'rgba(171,149,255,0.12)',
    border: 'rgba(171,149,255,0.28)',
    background: 'linear-gradient(180deg, rgba(10,10,28,0.98) 0%, rgba(20,16,42,0.99) 100%)',
    glow: 'radial-gradient(circle, rgba(171,149,255,0.14), transparent 68%)',
  },
  name: {
    accent: 'rgba(232,176,72,0.92)',
    accentSoft: 'rgba(232,176,72,0.12)',
    border: 'rgba(232,176,72,0.28)',
    background: 'linear-gradient(180deg, rgba(18,14,10,0.98) 0%, rgba(28,20,14,0.99) 100%)',
    glow: 'radial-gradient(circle, rgba(232,176,72,0.13), transparent 68%)',
  },
  taegil: {
    accent: 'rgba(108,196,143,0.92)',
    accentSoft: 'rgba(108,196,143,0.12)',
    border: 'rgba(108,196,143,0.26)',
    background: 'linear-gradient(180deg, rgba(8,20,18,0.98) 0%, rgba(16,30,26,0.99) 100%)',
    glow: 'radial-gradient(circle, rgba(108,196,143,0.13), transparent 68%)',
  },
  prophecy: {
    accent: 'rgba(124,183,255,0.92)',
    accentSoft: 'rgba(124,183,255,0.12)',
    border: 'rgba(124,183,255,0.28)',
    background: 'linear-gradient(180deg, rgba(8,16,28,0.98) 0%, rgba(14,24,42,0.99) 100%)',
    glow: 'radial-gradient(circle, rgba(124,183,255,0.13), transparent 68%)',
  },
  special: {
    accent: 'rgba(232,176,72,0.92)',
    accentSoft: 'rgba(232,176,72,0.12)',
    border: 'rgba(232,176,72,0.28)',
    background: 'linear-gradient(180deg, rgba(14,10,24,0.98) 0%, rgba(24,18,38,0.99) 100%)',
    glow: 'radial-gradient(circle, rgba(232,176,72,0.14), transparent 68%)',
  },
  default: {
    accent: 'rgba(232,176,72,0.92)',
    accentSoft: 'rgba(232,176,72,0.12)',
    border: 'rgba(232,176,72,0.28)',
    background: 'linear-gradient(180deg, rgba(15,11,29,0.98) 0%, rgba(22,17,38,0.99) 100%)',
    glow: 'radial-gradient(circle, rgba(232,176,72,0.14), transparent 68%)',
  },
};

function extractTag(text, tags) {
  for (const tag of tags) {
    const match = text.match(new RegExp(`\\[${tag}\\]\\s*([^\\n]+)`));
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function cleanText(text = '') {
  return text
    .replace(/\[(점수|요약|한줄평|별숨픽|주의|본문)\]\s*[^\n]*\n?/g, '')
    .trim();
}

function getSummaryFromText(text = '') {
  const tagged = extractTag(text, ['요약', '한줄평']);
  if (tagged) return tagged;

  const cleaned = cleanText(text);
  const firstLine = cleaned
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return '';
  return firstLine.split(/(?<=[.!?。！？])\s+/)[0]?.trim() || firstLine;
}

function splitBody(text = '') {
  const taggedBody = text.match(/\[본문\]\s*([\s\S]+)/);
  const cleaned = taggedBody?.[1]?.trim() || cleanText(text);
  return cleaned
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function FeatureResultSheet({
  type = 'default',
  eyebrow = 'BYEOLSOOM INSIGHT',
  title,
  summary,
  text = '',
  highlights = [],
  sections = [],
  primaryAction,
  primaryLabel = '다시 보기',
  secondaryAction,
  secondaryLabel,
  onDismiss,
}) {
  const theme = THEMES[type] || THEMES.default;
  const resolvedSummary = summary || getSummaryFromText(text);
  const paragraphs = useMemo(() => splitBody(text), [text]);
  const resolvedSections = sections.length
    ? sections
    : paragraphs.slice(0, 3).map((body, index) => ({
        title: ['핵심 흐름', '별숨의 해석', '오늘의 메모'][index] || `포인트 ${index + 1}`,
        body,
      }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: theme.background,
        overflowY: 'auto',
        padding: 'env(safe-area-inset-top, 16px) 18px calc(env(safe-area-inset-bottom, 20px) + 84px)',
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
        <button
          onClick={onDismiss}
          style={{
            position: 'sticky',
            top: 8,
            marginLeft: 'auto',
            display: 'flex',
            width: 38,
            height: 38,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${theme.border}`,
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--t2)',
            cursor: 'pointer',
            fontSize: 18,
            zIndex: 2,
          }}
          aria-label="닫기"
        >
          ×
        </button>

        <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, letterSpacing: '.18em', marginBottom: 10 }}>
            {eyebrow}
          </div>
          <h2 style={{ margin: 0, fontSize: 'var(--lg)', color: 'var(--t1)', fontWeight: 800, lineHeight: 1.25 }}>
            {title}
          </h2>
          {resolvedSummary && (
            <div
              style={{
                marginTop: 16,
                padding: '0 8px',
                color: 'var(--t1)',
                fontSize: 'var(--md)',
                fontWeight: 800,
                lineHeight: 1.5,
                wordBreak: 'keep-all',
              }}
            >
              <strong style={{ color: theme.accent, fontWeight: 900 }}>
                {resolvedSummary}
              </strong>
            </div>
          )}
        </div>

        {highlights.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
              gap: 12,
              marginBottom: 18,
            }}
          >
            {highlights.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                style={{
                  padding: '16px 14px',
                  borderRadius: 18,
                  border: `1px solid ${theme.border}`,
                  background: 'rgba(255,255,255,0.03)',
                  boxShadow: '0 14px 40px rgba(0,0,0,0.18)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {item.emoji && <span style={{ fontSize: 18 }}>{item.emoji}</span>}
                  <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, letterSpacing: '.08em' }}>
                    {item.label}
                  </div>
                </div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 700, lineHeight: 1.5 }}>
                  {item.value}
                </div>
                {item.caption && (
                  <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.55 }}>
                    {item.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {resolvedSections.map((section, index) => (
            <div
              key={`${section.title}-${index}`}
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '20px 18px',
                borderRadius: 22,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 120,
                  height: 120,
                  background: theme.glow,
                  pointerEvents: 'none',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, letterSpacing: '.1em', marginBottom: 10 }}>
                  {section.title}
                </div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                  {section.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        {(primaryAction || secondaryAction) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {primaryAction && (
              <button
                onClick={primaryAction}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 999,
                  border: 'none',
                  background: `linear-gradient(135deg, ${theme.accent}, rgba(255,210,120,0.92))`,
                  color: '#1a1208',
                  fontSize: 'var(--sm)',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {primaryLabel}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 999,
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  color: 'var(--t2)',
                  fontSize: 'var(--xs)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
