import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore.js';
import { STEP } from '../utils/steps.js';
import { breakAtNatural } from '../utils/constants.js';
import { BADTIME_THRESHOLD } from '../utils/gamificationLogic.js';
import { parseDailyLines } from '../utils/parseDailyLines.js';
import { AnimatedScore, TypingMessage } from './common/AnimatedText.jsx';

const CATEGORY_META = [
  { key: 'overall', label: '종합운', icon: '✨' },
  { key: 'love', label: '애정운', icon: '💞' },
  { key: 'wealth', label: '금전운', icon: '💰' },
  { key: 'career', label: '직장운', icon: '📈' },
  { key: 'study', label: '학업운', icon: '📚' },
  { key: 'health', label: '건강운', icon: '🌿' },
  { key: 'social', label: '대인운', icon: '🤝' },
  { key: 'travel', label: '이동운', icon: '🧭' },
  { key: 'create', label: '창의운', icon: '🎨' },
];

const LOW_SCORE_THRESHOLD = 45;

const LEGACY_ICONS = ['✨', '🍽️', '🌿', '🔢', '💬'];
const LEGACY_COLORS = ['var(--lav)', 'var(--teal)', 'var(--gold)', 'var(--gold)', 'var(--rose)'];
const SYNERGY_META = [
  { key: 'food', label: '음식', icon: '🍲', tint: 'var(--gold)' },
  { key: 'place', label: '장소', icon: '📍', tint: 'var(--teal)' },
  { key: 'color', label: '색', icon: '🎨', tint: 'var(--lav)' },
  { key: 'item', label: '아이템', icon: '🧿', tint: 'var(--gold)' },
  { key: 'number', label: '숫자', icon: '🔢', tint: 'var(--teal)' },
  { key: 'direction', label: '방향', icon: '🧭', tint: 'var(--mint)' },
  { key: 'communication', label: '소통', icon: '💬', tint: 'var(--rose)' },
  { key: 'action', label: '행동', icon: '✨', tint: 'var(--gold)' },
];

function splitSynergyValue(value) {
  if (!value) return { primary: '', description: '' };
  const [primary, ...rest] = value.split(/\s*[—-]\s*/);
  return {
    primary: primary?.trim() || value,
    description: rest.join(' — ').trim(),
  };
}

export default function DailyStarCardV2({
  result,
  onBlockBadtime = null,
  isBlocking = false,
  canBlockBadtime = true,
  currentBp = 0,
  className = '',
  axisScores = [],
  boostMap = {},
  scoreBoost = 0,
  categoryTextOverrides = {},
  synergyOverride = null,
  // kept for backward-compat, not used
  ownedRows = null,
  pendingItems = [],
  onToggleItem = null,
  onUseItem = null,
}) {
  void ownedRows; void pendingItems; void onToggleItem; void onUseItem;

  const [blocked, setBlocked] = useState(false);
  const setStep = useAppStore((s) => s.setStep);
  const parsed = parseDailyLines(result?.text || '');

  const score = parsed.score ?? result?.score ?? null;
  const scoreBoostVal = Number(scoreBoost) || 0;
  const displayedScore = (score !== null && !isNaN(score)) ? Math.min(100, Number(score) + scoreBoostVal) : null;
  const summary = parsed.summary || '';
  const easternKi = parsed.easternKi;
  const westernSky = parsed.westernSky;
  const categories = parsed.categories
    ? Object.fromEntries(
        Object.entries(parsed.categories).map(([key, value]) => [
          key,
          { ...value, desc: categoryTextOverrides?.[key] || value?.desc || '' },
        ]),
      )
    : null;
  const synergy = synergyOverride || parsed.synergy;
  const badtime = result?.badtime || parsed.badtime;
  const closingAdvice = parsed.closingAdvice;
  const items = parsed.items;

  const hasBadtime = badtime && score !== null && !Number.isNaN(score) && score < BADTIME_THRESHOLD;
  const hasStructuredData = !!(categories || synergy);

  const handleBlockBadtime = useCallback(async () => {
    if (isBlocking || !onBlockBadtime) return;
    try {
      await onBlockBadtime();
      setBlocked(true);
    } catch (error) {
      console.error('액막이 실패:', error);
    }
  }, [onBlockBadtime, isBlocking]);

  return (
    <motion.div
      className={`daily-star-card-v2 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <span className="dsc-spark dsc-spark-1"></span>
      <span className="dsc-spark dsc-spark-2">✧</span>
      <span className="dsc-spark dsc-spark-3">⋆</span>
      <span className="dsc-spark dsc-spark-4"></span>

      <div className="dsc-card">
        <div className="dsc-top-shimmer" />

        <div className="dsc-header">
          <span className="dsc-header-dot" />
          <span className="dsc-title">오늘 하루 나의 별숨</span>
          <span className="dsc-header-dot" />
        </div>

        {displayedScore !== null && (
          <div className="dsc-score">
            별숨 점수 <strong><AnimatedScore value={displayedScore || 0} /></strong>
            {scoreBoost > 0 && (
              <span style={{ marginLeft: 8, fontSize: '0.75em', color: 'var(--gold)', fontWeight: 700 }}>
                +<AnimatedScore value={scoreBoost} duration={0.8} />
              </span>
            )}
          </div>
        )}

        {summary && (
          <div className="dsc-summary" style={{ padding: 0, background: 'none', border: 'none', boxShadow: 'none' }}>
            <TypingMessage text={breakAtNatural(summary)} isSummary={true} />
          </div>
        )}

        {easternKi && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)', padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 10 }}>🌙 동양의 기운</div>
            {easternKi.sinshin && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 700, marginRight: 6 }}>십신</span>
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t1)', lineHeight: 1.6 }}>{easternKi.sinshin}</span>
              </div>
            )}
            {easternKi.kiun && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7, marginBottom: 10 }}>{easternKi.kiun}</div>
            )}
            {easternKi.doAction && (
              <div style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginRight: 6 }}>DO</span>
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>{easternKi.doAction}</span>
              </div>
            )}
            {easternKi.dontAction && (
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
                <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, marginRight: 6 }}>DONT</span>
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>{easternKi.dontAction}</span>
              </div>
            )}
          </div>
        )}

        {westernSky && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)', padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 10 }}>서양의 하늘</div>
            {westernSky.planet && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7, marginBottom: 6 }}>{westernSky.planet}</div>
            )}
            {westernSky.flow && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>{westernSky.flow}</div>
            )}
          </div>
        )}

        {categories && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)', padding: 16, marginBottom: 16 }}>
            <div className="dsc-section-title-row">
              <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)', letterSpacing: '.06em' }}>
                오늘의 운세
              </div>
            </div>
            {CATEGORY_META.map(({ key, label }) => {
              const cat = categories[key];
              if (!cat) return null;
              const axisScore = axisScores.find((s) => s.key === key);
              const catScore = cat.score ?? (cat.stars != null ? Math.max(20, Math.min(100, cat.stars * 20)) : null);
              const scoreValue = axisScore?.total ?? catScore ?? 50;
              const bonus = axisScore?.bonus || 0;
              const isLow = scoreValue <= LOW_SCORE_THRESHOLD;
              const barColor = bonus > 0 ? 'var(--gold)' : isLow ? '#c46b4f' : 'var(--t2)';
              const boostEntry = boostMap[key];

              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: 'var(--t2)', minWidth: 40, fontWeight: 600 }}>{label}</span>
                    <div style={{ flex: 1, height: 10, background: 'var(--bg3)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${scoreValue}%`, background: barColor, borderRadius: 5 }} />
                    </div>
                    <span style={{ minWidth: 34, textAlign: 'right', fontSize: 12, fontWeight: 800, color: barColor }}>
                      {scoreValue}점
                    </span>
                  </div>
                  {cat.desc && (
                    <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, paddingLeft: 50, wordBreak: 'keep-all' }}>
                      {cat.desc}
                    </div>
                  )}
                  {boostEntry && (
                    <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600, lineHeight: 1.5, paddingLeft: 50, marginTop: 3 }}>
                      ✨ {boostEntry.emoji} {boostEntry.name}{boostEntry.items?.length > 1 ? ` 외 ${boostEntry.items.length - 1}개` : ''}의 기운이 깃들었어요 (+{boostEntry.boost}점)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {synergy && (
          <div className="dsc-section dsc-section-synergy">
            <div className="dsc-section-header">
              <span className="dsc-section-icon">🪄</span>
              <span className="dsc-section-title-text">별숨픽</span>
            </div>
            <div className="dsc-synergy-grid">
              {SYNERGY_META
                .map(({ key, ...meta }) => ({ ...meta, value: synergy[key] }))
                .filter(({ value }) => value)
                .map(({ label, icon, tint, value }) => {
                  const { primary, description } = splitSynergyValue(value);
                  return (
                    <div key={label} className="dsc-synergy-card" style={{ '--dsc-synergy-tint': tint }}>
                      <div className="dsc-synergy-card-top">
                        <span className="dsc-synergy-icon" aria-hidden="true">{icon}</span>
                        <span className="dsc-synergy-label">{label}</span>
                      </div>
                      <div className="dsc-synergy-primary">{primary}</div>
                      {description && <div className="dsc-synergy-desc">{description}</div>}
                    </div>
                  );
                })}
            </div>
            {synergy.summary && (
              <div className="dsc-synergy-summary">{synergy.summary}</div>
            )}
          </div>
        )}

        {!hasStructuredData && items.length > 0 && (
          <div className="dsc-items">
            {items.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="dsc-item"
                style={{
                  '--dsc-delay': `${index * 0.08}s`,
                  '--dsc-color': LEGACY_COLORS[index % LEGACY_COLORS.length],
                }}
              >
                <div className="dsc-item-icon-wrap">
                  <span className="dsc-item-icon">{LEGACY_ICONS[index % LEGACY_ICONS.length]}</span>
                </div>
                <p className="dsc-item-text">{item}</p>
              </div>
            ))}
          </div>
        )}

        {hasBadtime && (
          <div className="dsc-badtime">
            <div className="dsc-badtime-title">주의 흐름</div>
            {badtime?.symptom && (
              <div className="dsc-badtime-symptom">징후: {badtime.symptom}</div>
            )}
            {!blocked && (
              <motion.button
                onClick={handleBlockBadtime}
                disabled={isBlocking || !canBlockBadtime || currentBp < 20}
                className="dsc-block-btn"
                style={{
                  backgroundColor: canBlockBadtime && currentBp >= 20 ? 'var(--teal)' : 'var(--bg3)',
                  color: canBlockBadtime && currentBp >= 20 ? '#fff' : 'var(--t4)',
                  cursor: isBlocking || !canBlockBadtime || currentBp < 20 ? 'not-allowed' : 'pointer',
                }}
                whileTap={{ scale: 0.93 }}
              >
                {isBlocking ? '액막이 발동 중...' : '액막이 발동 (BP -20)'}
              </motion.button>
            )}
            {blocked && (
              <div className="dsc-block-done">
                {badtime?.transformation || '별숨이 주의 흐름을 한 번 눌러줬어요.'}
              </div>
            )}
            {(!canBlockBadtime || currentBp < 20) && (
              <div className="dsc-bp-hint">
                BP를 충전하거나 미션을 완료하면 액막이를 발동할 수 있어요.
              </div>
            )}
          </div>
        )}

        {closingAdvice && (
          <div className="dsc-closing" style={{ padding: 0, background: 'none', border: 'none', boxShadow: 'none' }}>
            <TypingMessage text={closingAdvice} isSummary={false} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
