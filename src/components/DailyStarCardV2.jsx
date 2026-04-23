import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { breakAtNatural } from '../utils/constants.js';
import { BADTIME_THRESHOLD } from '../utils/gamificationLogic.js';

const CATEGORY_META = [
  { key: 'overall', label: '종합운', icon: '✨' },
  { key: 'love', label: '애정운', icon: '💞' },
  { key: 'money', label: '금전운', icon: '💰' },
  { key: 'work', label: '직장운', icon: '💼' },
  { key: 'study', label: '학업운', icon: '📚' },
  { key: 'health', label: '건강운', icon: '🌿' },
  { key: 'social', label: '대인운', icon: '🤝' },
  { key: 'travel', label: '이동운', icon: '🧭' },
  { key: 'create', label: '창의운', icon: '🎨' },
];

const LEGACY_ICONS = ['✨', '🍽️', '🌿', '🔢', '💬'];
const LEGACY_COLORS = ['var(--lav)', 'var(--teal)', 'var(--gold)', 'var(--gold)', 'var(--rose)'];

function extractLabeledValue(lines, patterns) {
  const line = lines.find((entry) => patterns.some((pattern) => pattern.test(entry)));
  if (!line) return '';
  return line
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/^[^:]+:\s*/, '')
    .trim();
}

function parseCategoryLine(line) {
  const numericMatch = line.match(/(\d{1,3})\s*점/);
  const starCount = (line.match(/⭐/g) || []).length;
  const stars = starCount || (numericMatch ? Math.max(1, Math.min(5, Math.round(Number(numericMatch[1]) / 20))) : null);
  const desc = line.split('-').slice(1).join('-').trim() || line.split(':').slice(1).join(':').trim();
  return {
    stars,
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
    { key: 'money', regexes: [/^금전운[:\s]/, /^금전[:\s]/] },
    { key: 'work', regexes: [/^직장운[:\s]/, /^직장[:\s]/] },
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

  const synergy = {
    food: extractLabeledValue(lines, [/^음식[:\s]/, /^추천 음식[:\s]/]),
    place: extractLabeledValue(lines, [/^장소[:\s]/, /^추천 장소[:\s]/]),
    color: extractLabeledValue(lines, [/^컬러[:\s]/, /^색상[:\s]/]),
    number: extractLabeledValue(lines, [/^숫자[:\s]/, /^행운 숫자[:\s]/]),
    direction: extractLabeledValue(lines, [/^방향[:\s]/, /^행운 방향[:\s]/]),
    summary: extractLabeledValue(lines, [/^\[별숨 시너지\]/, /^\[시너지\]/, /^시너지[:\s]/]),
  };

  const normalizedSynergy = Object.values(synergy).some(Boolean) ? synergy : null;

  const badtimeLine = lines.find((line) => /배드타임|액막이|주의/.test(line));
  const badtime = badtimeLine
    ? {
        symptom: badtimeLine.replace(/^\[[^\]]+\]\s*/, '').trim(),
        transformation: '',
      }
    : null;

  const closingAdvice = [...lines].reverse().find((line) => {
    if (line.startsWith('[')) return false;
    if (/^(종합운|애정운|금전운|직장운|학업운|건강운|대인운|이동운|창의운)[:\s]/.test(line)) return false;
    if (/^(음식|장소|컬러|색상|숫자|행운 숫자|방향|행운 방향|시너지)[:\s]/.test(line)) return false;
    return true;
  }) || '';

  const items = lines
    .filter((line) => !line.startsWith('['))
    .filter((line) => !/^(종합운|애정운|금전운|직장운|학업운|건강운|대인운|이동운|창의운)[:\s]/.test(line))
    .filter((line) => !/^(음식|장소|컬러|색상|숫자|행운 숫자|방향|행운 방향|시너지)[:\s]/.test(line))
    .slice(0, 5);

  return {
    score,
    summary,
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
}) {
  const [blocked, setBlocked] = useState(false);
  const parsed = parseDailyLines(result?.text || '');

  const score = parsed.score ?? result?.score ?? null;
  const summary = parsed.summary || '';
  const categories = parsed.categories;
  const synergy = parsed.synergy;
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

        {categories && (
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r2)',
            padding: 16,
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 'var(--xs)',
              fontWeight: 700,
              color: 'var(--gold)',
              letterSpacing: '.06em',
              marginBottom: 12,
            }}>
              오늘의 영역별 점수
            </div>
            {CATEGORY_META.map(({ key, label, icon }) => {
              const cat = categories[key];
              if (!cat) return null;
              const scoreValue = Math.max(20, Math.min(100, (cat.stars || 0) * 20));
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)', minWidth: 44 }}>{label}</span>
                    <div style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${scoreValue}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: scoreValue <= 45
                            ? 'linear-gradient(90deg, #d58f6c 0%, #c46b4f 100%)'
                            : 'linear-gradient(90deg, #8f8aaf 0%, var(--gold) 100%)',
                        }}
                      />
                    </div>
                    <span style={{ minWidth: 34, textAlign: 'right', fontSize: 12, fontWeight: 700, color: scoreValue <= 45 ? '#c46b4f' : 'var(--gold)' }}>
                      {scoreValue}점
                    </span>
                  </div>
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
                </div>
              );
            })}
          </div>
        )}

        {synergy && (
          <div className="dsc-section dsc-section-synergy">
            <div className="dsc-section-header">
              <span className="dsc-section-icon">🪄</span>
              <span className="dsc-section-title-text">아이템 연계</span>
            </div>
            {synergy.food && (
              <div className="dsc-synergy-row">
                <span className="dsc-synergy-label">음식</span>
                <span className="dsc-synergy-value">{synergy.food}</span>
              </div>
            )}
            {synergy.place && (
              <div className="dsc-synergy-row">
                <span className="dsc-synergy-label">장소</span>
                <span className="dsc-synergy-value">{synergy.place}</span>
              </div>
            )}
            {synergy.color && (
              <div className="dsc-synergy-row">
                <span className="dsc-synergy-label">컬러</span>
                <span className="dsc-synergy-value">{synergy.color}</span>
              </div>
            )}
            {synergy.number && (
              <div className="dsc-synergy-row">
                <span className="dsc-synergy-label">숫자</span>
                <span className="dsc-synergy-value">{synergy.number}</span>
              </div>
            )}
            {synergy.direction && (
              <div className="dsc-synergy-row">
                <span className="dsc-synergy-label">방향</span>
                <span className="dsc-synergy-value">{synergy.direction}</span>
              </div>
            )}
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
