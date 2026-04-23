import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { breakAtNatural } from '../utils/constants.js';
import { BADTIME_THRESHOLD } from '../utils/gamificationLogic.js';

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

function extractLabeledValue(lines, patterns) {
  const line = lines.find((entry) => patterns.some((pattern) => pattern.test(entry)));
  if (!line) return '';
  return line
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/^[^:]+:\s*/, '')
    .trim();
}

function splitSynergyValue(value) {
  if (!value) return { primary: '', description: '' };
  const [primary, ...rest] = value.split(/\s*[—-]\s*/);
  return {
    primary: primary?.trim() || value,
    description: rest.join(' — ').trim(),
  };
}

function parseCategoryLine(line) {
  const afterColon = line.split(':').slice(1).join(':').trim();
  // "68 — 설명" 또는 "3 — 설명" 형식 (1~3자리 숫자 + em/en/hyphen dash)
  const leadingNumMatch = afterColon.match(/^(\d{1,3})\s*[—–-]+\s*/);
  // "68점" 형식
  const numericMatch = line.match(/(\d{1,3})\s*점/);
  // "★★★" 형식
  const starCount = (line.match(/[⭐★]/g) || []).length;

  let stars = null;
  let score = null; // 20~100 직접 점수
  let desc = '';

  if (starCount) {
    stars = starCount;
    desc = line.split('-').slice(1).join('-').trim() || afterColon;
  } else if (leadingNumMatch) {
    const n = Number(leadingNumMatch[1]);
    if (n <= 5) {
      stars = n;
    } else {
      score = Math.max(20, Math.min(100, n));
    }
    desc = afterColon.replace(leadingNumMatch[0], '').trim();
  } else if (numericMatch) {
    const n = Number(numericMatch[1]);
    if (n <= 5) {
      stars = n;
    } else {
      score = Math.max(20, Math.min(100, n));
    }
    desc = afterColon.replace(/\d{1,3}\s*점/, '').trim();
  } else {
    desc = afterColon;
  }

  return {
    stars,
    score,
    desc: desc && !/^\d+\s*점?$/.test(desc) ? desc : '',
  };
}

function parseDailyLines(text) {
  const empty = {
    score: null,
    summary: '',
    synergy: null,
    categories: null,
    badtime: null,
    closingAdvice: '',
    items: [],
  };

  if (!text || typeof text !== 'string') return empty;

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const scoreLine = lines.find((line) => /^\[(점수|score)\]/i.test(line));
  const scoreMatch = scoreLine?.match(/(\d{1,3})/);
  const score = scoreMatch ? Math.max(0, Math.min(100, Number(scoreMatch[1]))) : null;

  const summaryLine = lines.find((line) => /^\[(요약|summary)\]/i.test(line));
  const summary = summaryLine
    ? summaryLine.replace(/^\[(요약|summary)\]\s*/i, '').trim()
    : '';

  const categories = {};
  const categoryPatterns = [
    { key: 'overall', regexes: [/^종합운[:\s]/, /^종합[:\s]/] },
    { key: 'love', regexes: [/^애정운[:\s]/, /^애정[:\s]/] },
    { key: 'wealth', regexes: [/^금전운[:\s]/, /^금전[:\s]/] },
    { key: 'career', regexes: [/^직장운[:\s]/, /^직장[:\s]/] },
    { key: 'study', regexes: [/^학업운[:\s]/, /^학업[:\s]/] },
    { key: 'health', regexes: [/^건강운[:\s]/, /^건강[:\s]/] },
    { key: 'social', regexes: [/^대인운[:\s]/, /^대인[:\s]/] },
    { key: 'travel', regexes: [/^이동운[:\s]/, /^이동[:\s]/] },
    { key: 'create', regexes: [/^창의운[:\s]/, /^창의[:\s]/] },
  ];

  for (const { key, regexes } of categoryPatterns) {
    const line = lines.find((entry) => regexes.some((regex) => regex.test(entry)));
    if (line) categories[key] = parseCategoryLine(line);
  }

  const normalizedCategories = Object.keys(categories).length > 0 ? categories : null;

  // [동양의 기운] 파싱
  const easternKi = {
    sinshin: extractLabeledValue(lines, [/^십신[:\s]/]),
    kiun: extractLabeledValue(lines, [/^기운[:\s]/]),
    doAction: extractLabeledValue(lines, [/^DO[:\s]/i]),
    dontAction: extractLabeledValue(lines, [/^DONT[:\s]/i]),
  };
  const normalizedEasternKi = Object.values(easternKi).some(Boolean) ? easternKi : null;

  // [서양의 하늘] 파싱
  const westernSky = {
    planet: extractLabeledValue(lines, [/^행성[:\s]/]),
    flow: extractLabeledValue(lines, [/^흐름[:\s]/]),
  };
  const normalizedWesternSky = Object.values(westernSky).some(Boolean) ? westernSky : null;

  // [별숨픽] 파싱
  const synergy = {
    food: extractLabeledValue(lines, [/^음식[:\s]/, /^추천 음식[:\s]/]),
    place: extractLabeledValue(lines, [/^장소[:\s]/, /^추천 장소[:\s]/]),
    color: extractLabeledValue(lines, [/^색[:\s]/, /^컬러[:\s]/, /^색상[:\s]/]),
    item: extractLabeledValue(lines, [/^아이템[:\s]/]),
    number: extractLabeledValue(lines, [/^숫자[:\s]/, /^행운 숫자[:\s]/]),
    direction: extractLabeledValue(lines, [/^방향[:\s]/, /^행운 방향[:\s]/]),
    communication: extractLabeledValue(lines, [/^소통[:\s]/]),
    action: extractLabeledValue(lines, [/^행동[:\s]/]),
    summary: extractLabeledValue(lines, [/^요약[:\s]/, /^\[별숨 시너지\]/, /^\[시너지\]/, /^시너지[:\s]/]),
  };

  const normalizedSynergy = Object.values(synergy).some(Boolean) ? synergy : null;

  const badtimeLine = lines.find((line) => /배드타임|액막이|주의/.test(line));
  const badtime = badtimeLine
    ? {
        symptom: badtimeLine.replace(/^\[[^\]]+\]\s*/, '').trim(),
        transformation: '',
      }
    : null;

  const FIELD_PREFIXES = /^(종합운|애정운|금전운|직장운|학업운|건강운|대인운|이동운|창의운|음식|장소|색|컬러|색상|아이템|숫자|행운 숫자|방향|행운 방향|소통|행동|요약|시너지|십신|기운|DO|DONT|행성|흐름)[:\s]/i;

  const closingAdvice = [...lines].reverse().find((line) => {
    if (line.startsWith('[')) return false;
    if (FIELD_PREFIXES.test(line)) return false;
    return true;
  }) || '';

  const items = lines
    .filter((line) => !line.startsWith('['))
    .filter((line) => !FIELD_PREFIXES.test(line))
    .slice(0, 5);

  return {
    score,
    summary,
    easternKi: normalizedEasternKi,
    westernSky: normalizedWesternSky,
    synergy: normalizedSynergy,
    categories: normalizedCategories,
    badtime,
    closingAdvice,
    items,
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
}) {
  const [blocked, setBlocked] = useState(false);
  const parsed = parseDailyLines(result?.text || '');

  const score = parsed.score ?? result?.score ?? null;
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

        {score !== null && (
          <div className="dsc-score">
            별숨 점수 <strong>{score}</strong>
          </div>
        )}

        {summary && (
          <div className="dsc-summary">{breakAtNatural(summary)}</div>
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
              const matchingRow = ownedRows?.find((r) => r.item?.aspectKey === key);
              const scoreColor = bonus > 0 ? 'var(--gold)' : isLow ? '#c46b4f' : 'var(--t2)';
              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)', minWidth: 44 }}>{label}</span>
                    <div style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${scoreValue}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: bonus > 0
                            ? 'linear-gradient(90deg, #d8b36a 0%, var(--gold) 100%)'
                            : isLow
                              ? 'linear-gradient(90deg, #d58f6c 0%, #c46b4f 100%)'
                              : 'linear-gradient(90deg, #8f8aaf 0%, var(--gold) 100%)',
                          transition: 'width 0.5s ease-out',
                        }}
                      />
                    </div>
                    <span style={{ minWidth: 34, textAlign: 'right', fontSize: 12, fontWeight: 800, color: scoreColor }}>
                      {scoreValue}점
                    </span>
                    {matchingRow && onUseItem && (
                      <button
                        type="button"
                        onClick={() => onUseItem(matchingRow)}
                        style={{
                          flexShrink: 0,
                          padding: '4px 9px',
                          borderRadius: 999,
                          border: '1px solid var(--acc)',
                          background: 'var(--goldf)',
                          color: 'var(--gold)',
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: 'var(--ff)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isLow ? '바로 쓰기' : '사용'}
                      </button>
                    )}
                  </div>
                  {bonus > 0 && axisScore?.boostItem && (
                    <div style={{ paddingLeft: 30, marginBottom: 3, fontSize: 10, color: 'var(--gold)', fontWeight: 700, lineHeight: 1.5 }}>
                      {axisScore.boostItem.name} 효과로 +{bonus}점 상승!
                    </div>
                  )}
                  {cat.desc && (
                    <div style={{
                      fontSize: 11,
                      color: 'var(--t3)',
                      lineHeight: 1.5,
                      paddingLeft: 30,
                      wordBreak: 'keep-all',
                    }}>
                      {cat.desc}
                    </div>
                  )}
                  {isLow && !matchingRow && ownedRows !== null && (
                    <div style={{ paddingLeft: 30, marginTop: 3, fontSize: 10, color: 'var(--t4)', lineHeight: 1.5 }}>
                      이 영역에 쓸 아이템이 없어요.
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
          <div className="dsc-closing">
            {closingAdvice}
          </div>
        )}
      </div>
    </motion.div>
  );
}
