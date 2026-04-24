import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = {
  tarot: {
    accent: 'var(--gold)',
    accentSoft: 'var(--goldf)',
    border: 'var(--acc)',
    background: 'radial-gradient(circle at 50% 0%, #1a1425 0%, var(--bg) 100%)',
    glow: 'radial-gradient(circle, rgba(200,165,80,0.15), transparent 70%)',
  },
  dream: {
    accent: 'var(--lav)',
    accentSoft: 'var(--lavf)',
    border: 'var(--lavacc)',
    background: 'radial-gradient(circle at 50% 0%, #121026 0%, var(--bg) 100%)',
    glow: 'radial-gradient(circle, rgba(171,149,255,0.15), transparent 70%)',
  },
  name: {
    accent: 'var(--gold2)',
    accentSoft: 'var(--goldf)',
    border: 'var(--acc)',
    background: 'radial-gradient(circle at 50% 0%, #1a1610 0%, var(--bg) 100%)',
    glow: 'radial-gradient(circle, rgba(232,176,72,0.15), transparent 70%)',
  },
  taegil: {
    accent: 'var(--gold)',
    accentSoft: 'var(--goldf)',
    border: 'var(--acc)',
    background: 'radial-gradient(circle at 50% 0%, #0d0f1a 0%, var(--bg) 100%)',
    glow: 'radial-gradient(circle, rgba(212,175,55,0.18), transparent 70%)',
  },
  prophecy: {
    accent: 'var(--teal)',
    accentSoft: 'var(--tealf)',
    border: 'var(--tealacc)',
    background: 'radial-gradient(circle at 50% 0%, #08121c 0%, var(--bg) 100%)',
    glow: 'radial-gradient(circle, rgba(107,191,181,0.15), transparent 70%)',
  },
  special: {
    accent: 'var(--gold)',
    accentSoft: 'var(--goldf)',
    border: 'var(--acc)',
    background: 'radial-gradient(circle at 50% 0%, #120e1c 0%, var(--bg) 100%)',
    glow: 'radial-gradient(circle, rgba(232,176,72,0.15), transparent 70%)',
  },
  default: {
    accent: 'var(--gold)',
    accentSoft: 'var(--goldf)',
    border: 'var(--acc)',
    background: 'var(--bg)',
    glow: 'radial-gradient(circle, rgba(232,176,72,0.12), transparent 70%)',
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: theme.background,
        overflowY: 'auto',
        padding: 'calc(env(safe-area-inset-top, 20px) + 20px) 20px calc(env(safe-area-inset-bottom, 20px) + 100px)',
      }}
    >
      <div style={{ maxWidth: 500, margin: '0 auto', position: 'relative' }}>
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={onDismiss}
          style={{
            position: 'absolute',
            top: -10,
            right: 0,
            display: 'flex',
            width: 40,
            height: 40,
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid var(--line)`,
            background: 'var(--surface-float)',
            color: 'var(--t2)',
            cursor: 'pointer',
            fontSize: 20,
            zIndex: 10,
            backdropFilter: 'blur(12px)',
          }}
          aria-label="닫기"
          whileTap={{ scale: 0.9 }}
        >
          ×
        </motion.button>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <div style={{ fontSize: 10, color: theme.accent, fontWeight: 800, letterSpacing: '.2em', marginBottom: 12, textTransform: 'uppercase' }}>
            {eyebrow}
          </div>
          <h2 style={{ margin: 0, fontSize: 'var(--xl)', color: 'var(--t1)', fontWeight: 800, lineHeight: 1.3, wordBreak: 'keep-all' }}>
            {title}
          </h2>
          {resolvedSummary && (
            <div
              style={{
                marginTop: 20,
                padding: '16px 20px',
                background: 'var(--goldf)',
                borderRadius: 'var(--r2)',
                border: '1px solid var(--acc)',
                color: 'var(--t1)',
                fontSize: 'var(--md)',
                fontWeight: 700,
                lineHeight: 1.6,
                wordBreak: 'keep-all',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <span style={{ color: theme.accent }}>{resolvedSummary}</span>
            </div>
          )}
        </motion.div>

        {highlights.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}
          >
            {highlights.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                style={{
                  padding: '18px 16px',
                  borderRadius: 'var(--r2)',
                  border: `1px solid var(--line)`,
                  background: 'var(--bg1)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, background: theme.glow, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: theme.accent, fontWeight: 800, letterSpacing: '.06em' }}>
                    {item.label}
                  </div>
                </div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 700, lineHeight: 1.4 }}>
                  {item.value}
                </div>
                {item.caption && (
                  <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.5 }}>
                    {item.caption}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {resolvedSections.map((section, index) => (
            <motion.div
              key={`${section.title}-${index}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '24px 20px',
                borderRadius: 'var(--r3)',
                background: 'var(--bg1)',
                border: `1px solid var(--line)`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -60,
                  right: -60,
                  width: 160,
                  height: 160,
                  background: theme.glow,
                  pointerEvents: 'none',
                  opacity: 0.6,
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, letterSpacing: '.12em', marginBottom: 12 }}>
                  {section.title}
                </div>
                <div style={{ fontSize: 'var(--md)', color: 'var(--t2)', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                  {section.body}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {(primaryAction || secondaryAction) && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}
          >
            {primaryAction && (
              <motion.button
                onClick={primaryAction}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: 'var(--r2)',
                  border: 'none',
                  background: `linear-gradient(135deg, ${theme.accent}, #fff7de)`,
                  color: '#1a1208',
                  fontSize: 'var(--sm)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px ${theme.accent}33`,
                }}
              >
                {primaryLabel}
              </motion.button>
            )}
            {secondaryAction && (
              <motion.button
                onClick={secondaryAction}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 'var(--r2)',
                  border: `1px solid var(--line)`,
                  background: 'var(--bg2)',
                  color: 'var(--t2)',
                  fontSize: 'var(--sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {secondaryLabel}
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
