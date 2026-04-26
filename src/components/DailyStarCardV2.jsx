import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore.js';
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
  { key: 'food', label: '\uC74C\uC2DD', icon: '\u{1F372}', tint: 'var(--gold)' },
  { key: 'place', label: '\uC7A5\uC18C', icon: '\u{1F4CD}', tint: 'var(--teal)' },
  { key: 'color', label: '\uC0C9', icon: '\u{1F3A8}', tint: 'var(--lav)' },
  { key: 'item', label: '\uC544\uC774\uD15C', icon: '\u{1F9FF}', tint: 'var(--gold)' },
  { key: 'number', label: '\uC22B\uC790', icon: '\u{1F522}', tint: 'var(--teal)' },
  { key: 'direction', label: '\uBC29\uD5A5', icon: '\u{1F9ED}', tint: 'var(--mint)' },
  { key: 'communication', label: '\uC18C\uD1B5', icon: '\u{1F4AC}', tint: 'var(--rose)' },
  { key: 'action', label: '\uD589\uB3D9', icon: '\u2728', tint: 'var(--gold)' },
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
  ownedRows = null,
  onUseItem = null,
  pendingItems = [],
  onToggleItem = null,
  scoreBoost = 0,
}) {
  const [blocked, setBlocked] = useState(false);
  const setStep = useAppStore((s) => s.setStep);
  const parsed = parseDailyLines(result?.text || '');

  // parsed.score (텍스트 실시간 파싱) 우선, 없으면 gamification이 별도 설정한 result.score로 폴백
  // useDailyConsultationHandler가 { ...prev, text } 로 업데이트하므로 flickering 없음
  const score = parsed.score ?? result?.score ?? null;
  const scoreBoostVal = Number(scoreBoost) || 0;
  const displayedScore = (score !== null && !isNaN(score)) ? Math.min(100, Number(score) + scoreBoostVal) : null;
  const summary = parsed.summary || '';
  const easternKi = parsed.easternKi;
  const westernSky = parsed.westernSky;
  const categories = parsed.categories;
  const synergy = parsed.synergy;
  const badtime = result?.badtime || parsed.badtime;
  const closingAdvice = parsed.closingAdvice;
  const items = parsed.items;

  const hasBadtime = badtime && score !== null && !Number.isNaN(score) && score < BADTIME_THRESHOLD;
  const hasStructuredData = !!(categories || synergy);
  const categoryActionRows = categories
    ? CATEGORY_META.map(({ key, label }) => {
        const cat = categories[key];
        if (!cat) return null;
        const axisScore = axisScores.find((s) => s.key === key);
        const catScore = cat.score ?? (cat.stars != null ? Math.max(20, Math.min(100, cat.stars * 20)) : null);
        const scoreValue = axisScore?.total ?? catScore ?? 50;
        const matchingRow = ownedRows?.find((r) => r.item?.aspectKey === key) || null;
        return {
          key,
          label,
          scoreValue,
          isLow: scoreValue <= LOW_SCORE_THRESHOLD,
          matchingRow,
          boost: matchingRow?.item?.boost || 0,
        };
      }).filter(Boolean)
    : [];
  const primaryActionRow = categoryActionRows
    .filter((entry) => entry.matchingRow)
    .sort((a, b) => {
      if (a.isLow !== b.isLow) return a.isLow ? -1 : 1;
      if (a.scoreValue !== b.scoreValue) return a.scoreValue - b.scoreValue;
      return b.boost - a.boost;
    })[0] || null;

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
      <span className="dsc-spark dsc-spark-1">✦</span>
      <span className="dsc-spark dsc-spark-2">✧</span>
      <span className="dsc-spark dsc-spark-3">⋆</span>
      <span className="dsc-spark dsc-spark-4">✦</span>

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
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 10 }}>✦ 서양의 하늘</div>
            {westernSky.planet && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7, marginBottom: 6 }}>{westernSky.planet}</div>
            )}
            {westernSky.flow && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>{westernSky.flow}</div>
            )}
          </div>
        )}

        {categories && (
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r2)',
            padding: 16,
            marginBottom: 16,
          }}>
            <div className="dsc-section-title-row">
              <div style={{
                fontSize: 'var(--xs)',
                fontWeight: 700,
                color: 'var(--gold)',
                letterSpacing: '.06em',
              }}>
                {'\uC624\uB298\uC758 \uC6B4\uC138'}
              </div>
              {primaryActionRow && onUseItem && (
                <button
                  type="button"
                  className="dsc-inline-action-btn"
                  onClick={() => onUseItem(primaryActionRow.matchingRow)}
                >
                  {primaryActionRow.isLow ? `${primaryActionRow.label} \uC544\uC774\uD15C \uC0AC\uC6A9` : '\uC544\uC774\uD15C \uC0AC\uC6A9'}
                </button>
              )}
            </div>
            <div style={{
              fontSize: 'var(--xs)',
              fontWeight: 700,
              color: 'var(--gold)',
              letterSpacing: '.06em',
              display: 'none',
              marginBottom: 12,
            }}>
              ✦ 오늘의 운세
            </div>
            {CATEGORY_META.map(({ key, label, icon }) => {
              const cat = categories[key];
              if (!cat) return null;
              const axisScore = axisScores.find((s) => s.key === key);
              const catScore = cat.score ?? (cat.stars != null ? Math.max(20, Math.min(100, cat.stars * 20)) : null);
              const scoreValue = axisScore?.total ?? catScore ?? 50;
              const bonus = axisScore?.bonus || 0;
              const isLow = scoreValue <= LOW_SCORE_THRESHOLD;
              const scoreColor = bonus > 0 ? 'var(--gold)' : isLow ? '#c46b4f' : 'var(--t2)';
              const matchingRow = ownedRows?.find((r) => r.item?.aspectKey === key);
              const isPending = pendingItems.some(pi => pi.rowId === matchingRow?.rowId);
              const boostVal = matchingRow?.item?.boost || 0;
              const pendingBoost = isPending ? boostVal : 0;
              const totalPredicted = Math.min(100, scoreValue + pendingBoost);

              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: 'var(--t2)', minWidth: 40, fontWeight: 600 }}>{label}</span>
                    <div style={{ flex: 1, height: 10, background: 'var(--bg3)', borderRadius: 5, position: 'relative', overflow: 'hidden' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, height: '100%',
                        width: `${scoreValue}%`, background: scoreColor, borderRadius: 5, zIndex: 1
                      }} />
                      {pendingBoost > 0 && (
                        <div style={{
                          position: 'absolute', left: `${scoreValue}%`, top: 0, height: '100%',
                          width: `${Math.min(100 - scoreValue, pendingBoost)}%`,
                          background: 'var(--gold)', borderRadius: '0 3px 3px 0',
                          animation: 'dsc-boost-pulse 1.5s ease-in-out infinite',
                          zIndex: 0
                        }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, justifyContent: 'flex-end' }}>
                      {pendingBoost > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', animation: 'dsc-text-pulse 1.5s infinite' }}>
                          {totalPredicted}점
                        </span>
                      )}
                      <span style={{ minWidth: 34, textAlign: 'right', fontSize: 12, fontWeight: 800, color: scoreColor, opacity: pendingBoost > 0 ? 0.5 : 1 }}>
                        {scoreValue}점
                      </span>
                      {onToggleItem && (
                        matchingRow ? (
                          <button
                            type="button"
                            onClick={() => onToggleItem(matchingRow)}
                            style={{
                              flexShrink: 0,
                              padding: '4px 9px',
                              borderRadius: 999,
                              border: isPending ? '1px solid var(--gold)' : '1px solid var(--acc)',
                              background: isPending ? 'var(--gold)' : 'var(--goldf)',
                              color: isPending ? '#fff' : 'var(--gold)',
                              fontSize: 10,
                              fontWeight: 700,
                              fontFamily: 'var(--ff)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s',
                            }}
                          >
                            {isPending ? '취소' : `선택 (+${matchingRow.item.boost})`}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setStep(40)}
                            style={{
                              flexShrink: 0,
                              padding: '4px 9px',
                              borderRadius: 999,
                              border: '1px solid var(--line)',
                              background: 'var(--bg3)',
                              color: 'var(--t4)',
                              fontSize: 10,
                              fontWeight: 700,
                              fontFamily: 'var(--ff)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            아이템 얻기
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  {cat.desc && (
                    <div style={{
                      fontSize: 11,
                      color: 'var(--t3)',
                      lineHeight: 1.5,
                      paddingLeft: 50,
                      wordBreak: 'keep-all',
                    }}>
                      {cat.desc}
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
              <span className="dsc-section-icon">{'\u{1FA84}'}</span>
              <span className="dsc-section-title-text">{'\uBCC4\uC228\uD53D'}</span>
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
