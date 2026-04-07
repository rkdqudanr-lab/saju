/**
 * DailyStarCardV2 컴포넌트
 * 3섹션 구조: [동양의 기운] + [서양의 하늘] + [별숨픽]
 */

import React, { useState, useCallback } from 'react';
import { breakAtNatural } from '../utils/constants.js';

/**
 * 응답 텍스트에서 [태그] 기준으로 섹션을 추출해 구조화된 객체로 반환
 */
function parseDailyLines(text) {
  const empty = {
    score: null,
    summary: '',
    saju: null,       // 동양의 기운
    astrology: null,  // 서양의 하늘
    synergy: null,    // 별숨픽
    badtime: null,
    closingAdvice: '',
    // 구형 아이템 fallback
    items: [],
  };

  if (!text || typeof text !== 'string') return empty;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // ── 점수 ──
  let score = null;
  const scoreIdx = lines.findIndex(l => l.startsWith('[점수]'));
  if (scoreIdx !== -1) {
    score = parseInt(lines[scoreIdx].replace('[점수]', '').trim(), 10);
  }

  // ── 요약 ──
  let summary = '';
  const summaryIdx = lines.findIndex(l => l.startsWith('[요약]'));
  if (summaryIdx !== -1) {
    summary = lines[summaryIdx].replace('[요약]', '').trim();
  }

  // ── 섹션 범위 추출 헬퍼 ──
  function extractSection(startTag) {
    const idx = lines.findIndex(l => l.startsWith(startTag));
    if (idx === -1) return null;
    const end = lines.findIndex((l, i) => i > idx && l.startsWith('['));
    return lines.slice(idx + 1, end === -1 ? undefined : end);
  }

  // ── [동양의 기운] ──
  const sajuLines = extractSection('[동양의 기운]');
  let saju = null;
  if (sajuLines && sajuLines.length > 0) {
    saju = { sipsin: '', energy: '', do: '', dont: '' };
    for (const line of sajuLines) {
      if (line.startsWith('십신:')) saju.sipsin = line.replace('십신:', '').trim();
      else if (line.startsWith('기운:')) saju.energy = line.replace('기운:', '').trim();
      else if (line.startsWith('DO:')) saju.do = line.replace('DO:', '').trim();
      else if (line.startsWith('DONT:') || line.startsWith("DON'T:")) {
        saju.dont = line.replace("DON'T:", '').replace('DONT:', '').trim();
      } else if (line.startsWith('✅')) saju.do = line.replace('✅', '').trim();
      else if (line.startsWith('❌')) saju.dont = line.replace('❌', '').trim();
      // 십신 설명 보조 줄
      else if (!saju.energy && saju.sipsin) saju.sipsinDesc = line;
    }
  }

  // ── [서양의 하늘] ──
  const astroLines = extractSection('[서양의 하늘]');
  let astrology = null;
  if (astroLines && astroLines.length > 0) {
    astrology = { planet: '', flow: '', color: '', number: '' };
    for (const line of astroLines) {
      if (line.startsWith('행성:')) astrology.planet = line.replace('행성:', '').trim();
      else if (line.startsWith('흐름:')) astrology.flow = line.replace('흐름:', '').trim();
      else if (line.startsWith('컬러:') || line.startsWith('🎨')) {
        astrology.color = line.replace('컬러:', '').replace('🎨', '').trim();
      } else if (line.startsWith('숫자:') || line.startsWith('🔢')) {
        astrology.number = line.replace('숫자:', '').replace('🔢', '').trim();
      } else if (!astrology.flow && astrology.planet) astrology.flow = line;
    }
  }

  // ── [별숨픽] ──
  const synergyLines = extractSection('[별숨픽]') || extractSection('[별숨 픽]');
  let synergy = null;
  if (synergyLines && synergyLines.length > 0) {
    synergy = { food: '', place: '', summary: '' };
    for (const line of synergyLines) {
      if (line.startsWith('음식:') || line.startsWith('🍽️')) {
        synergy.food = line.replace('음식:', '').replace('🍽️', '').trim();
      } else if (line.startsWith('장소:') || line.startsWith('📍')) {
        synergy.place = line.replace('장소:', '').replace('📍', '').trim();
      } else if (line.startsWith('요약:') || line.startsWith('✨')) {
        synergy.summary = line.replace('요약:', '').replace('✨', '').trim();
      }
    }
  }

  // ── 배드타임 ──
  let badtime = null;
  const badtimeIdx = lines.findIndex(l => l.includes('배드타임') || l.includes('⚠️'));
  if (badtimeIdx !== -1) {
    let symptom = '';
    let transformation = '';
    for (let i = badtimeIdx; i < Math.min(lines.length, badtimeIdx + 4); i++) {
      if (lines[i].startsWith('[악운 증상]') || lines[i].includes('악운') || lines[i].includes('증상')) {
        symptom = lines[i].replace('[악운 증상]', '').replace('악운 증상:', '').replace('악운:', '').replace('⚠️', '').trim();
        break;
      }
    }
    for (let i = badtimeIdx; i < Math.min(lines.length, badtimeIdx + 6); i++) {
      if (lines[i].includes('바꿨어요')) {
        transformation = lines[i].replace(/^→\s*/, '').trim();
        break;
      }
    }
    if (symptom || transformation) badtime = { symptom, transformation };
  }

  // ── 마무리 문장 ──
  const closingAdvice = [...lines].reverse().find(
    l => !l.startsWith('[') && !l.startsWith('🀄') && !l.startsWith('✦') && !l.includes('⚠️')
  ) || '';

  // ── 구형 포맷 fallback: 아이템 목록 ──
  const items = [];
  if (!saju && !astrology) {
    const itemStart = summaryIdx !== -1 ? summaryIdx + 1 : 0;
    for (let i = itemStart; i < lines.length && items.length < 5; i++) {
      const l = lines[i];
      if (l.startsWith('[') || l.startsWith('🀄') || l.startsWith('✦')) continue;
      items.push(l);
    }
  }

  return { score, summary, saju, astrology, synergy, badtime, closingAdvice, items };
}

// ── 구형 포맷용 아이콘/색상 ──
const LEGACY_ICONS = ['🎨', '🍽️', '🌿', '✨', '🌙'];
const LEGACY_COLORS = ['var(--lav)', 'var(--teal)', 'var(--gold)', 'var(--gold)', 'var(--rose)'];

export default function DailyStarCardV2({
  result,
  onBlockBadtime = null,
  isBlocking = false,
  canBlockBadtime = true,
  currentBp = 0,
  className = '',
}) {
  const [blocked, setBlocked] = useState(false);

  const {
    score,
    summary,
    saju,
    astrology,
    synergy,
    badtime,
    closingAdvice,
    items,
  } = parseDailyLines(result?.text || '');

  const hasBadtime = badtime && score && score < 50;
  const isNewFormat = !!(saju || astrology || synergy);

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
    <div className={`daily-star-card-v2 ${className}`}>
      {/* 별 파티클 */}
      <span className="dsc-spark dsc-spark-1">✦</span>
      <span className="dsc-spark dsc-spark-2">·</span>
      <span className="dsc-spark dsc-spark-3">✦</span>
      <span className="dsc-spark dsc-spark-4">·</span>

      <div className="dsc-card">
        <div className="dsc-top-shimmer" />

        {/* 제목 */}
        <div className="dsc-header">
          <span className="dsc-header-dot" />
          <span className="dsc-title">오늘 하루 나의 별숨</span>
          <span className="dsc-header-dot" />
        </div>

        {/* 점수 */}
        {score !== null && (
          <>
            <div className="dsc-score">
              별숨 점수 <strong>{score}</strong>
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', textAlign: 'center', marginTop: 2, marginBottom: 4 }}>
              오늘의 기운을 0~100으로 나타내요 · 50 미만이면 액막이 발동 가능
            </div>
          </>
        )}

        {/* 요약 */}
        {summary && (
          <div className="dsc-summary">{breakAtNatural(summary)}</div>
        )}

        {isNewFormat ? (
          /* ───── 신형 3섹션 레이아웃 ───── */
          <div className="dsc-sections">

            {/* 1. 동양의 기운 */}
            {saju && (
              <div className="dsc-section dsc-section-east">
                <div className="dsc-section-header">
                  <span className="dsc-section-icon">🀄</span>
                  <span className="dsc-section-title-text">동양의 기운 · 사주</span>
                </div>
                {saju.sipsin && (
                  <div className="dsc-sipsin">{saju.sipsin}</div>
                )}
                {saju.sipsinDesc && (
                  <div className="dsc-section-text dsc-sipsin-desc">{saju.sipsinDesc}</div>
                )}
                {saju.energy && (
                  <div className="dsc-section-text">{saju.energy}</div>
                )}
                {saju.do && (
                  <div className="dsc-action dsc-action-do">
                    <span className="dsc-action-badge dsc-badge-do">DO</span>
                    <span className="dsc-action-text">{saju.do}</span>
                  </div>
                )}
                {saju.dont && (
                  <div className="dsc-action dsc-action-dont">
                    <span className="dsc-action-badge dsc-badge-dont">주의</span>
                    <span className="dsc-action-text">{saju.dont}</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. 서양의 하늘 */}
            {astrology && (
              <div className="dsc-section dsc-section-west">
                <div className="dsc-section-header">
                  <span className="dsc-section-icon">✦</span>
                  <span className="dsc-section-title-text">서양의 하늘 · 점성술</span>
                </div>
                {astrology.planet && (
                  <div className="dsc-section-text">{astrology.planet}</div>
                )}
                {astrology.flow && (
                  <div className="dsc-section-text">{astrology.flow}</div>
                )}
                {(astrology.color || astrology.number) && (
                  <div className="dsc-astro-chips">
                    {astrology.color && (
                      <div className="dsc-astro-chip">
                        <span>🎨</span>
                        <span>{astrology.color}</span>
                      </div>
                    )}
                    {astrology.number && (
                      <div className="dsc-astro-chip">
                        <span>🔢</span>
                        <span>{astrology.number}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. 별숨픽 */}
            {synergy && (
              <div className="dsc-section dsc-section-synergy">
                <div className="dsc-section-header">
                  <span className="dsc-section-icon">✨</span>
                  <span className="dsc-section-title-text">별숨 픽 · 오늘의 시너지</span>
                </div>
                {synergy.food && (
                  <div className="dsc-synergy-row">
                    <span className="dsc-synergy-label">🍽️</span>
                    <span className="dsc-synergy-value">{synergy.food}</span>
                  </div>
                )}
                {synergy.place && (
                  <div className="dsc-synergy-row">
                    <span className="dsc-synergy-label">📍</span>
                    <span className="dsc-synergy-value">{synergy.place}</span>
                  </div>
                )}
                {synergy.summary && (
                  <div className="dsc-synergy-summary">{synergy.summary}</div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ───── 구형 아이템 리스트 fallback ───── */
          <div className="dsc-items">
            {items.map((item, i) => (
              <div
                key={i}
                className="dsc-item"
                style={{
                  '--dsc-delay': `${i * 0.08}s`,
                  '--dsc-color': LEGACY_COLORS[i],
                }}
              >
                <div className="dsc-item-icon-wrap">
                  <span className="dsc-item-icon">{LEGACY_ICONS[i]}</span>
                </div>
                <p className="dsc-item-text">{item}</p>
              </div>
            ))}
          </div>
        )}

        {/* 배드타임 섹션 */}
        {hasBadtime && (
          <div className="dsc-badtime">
            <div className="dsc-badtime-title">⚠️ 배드타임 감지</div>

            {badtime.symptom && (
              <div className="dsc-badtime-symptom">악운: {badtime.symptom}</div>
            )}

            {!blocked && (
              <button
                onClick={handleBlockBadtime}
                disabled={isBlocking || !canBlockBadtime || currentBp < 20}
                className="dsc-block-btn"
                style={{
                  backgroundColor: canBlockBadtime && currentBp >= 20 ? 'var(--teal)' : 'var(--bg3)',
                  color: canBlockBadtime && currentBp >= 20 ? '#fff' : 'var(--t4)',
                  cursor: isBlocking || !canBlockBadtime || currentBp < 20 ? 'not-allowed' : 'pointer',
                }}
              >
                {isBlocking ? '액막이 발동 중...' : '액막이 발동 (BP -20)'}
              </button>
            )}

            {blocked && (
              <div className="dsc-block-done">
                {badtime.transformation || '별숨이 악운을 긍정적으로 바꿨어요'}
              </div>
            )}

            {(!canBlockBadtime || currentBp < 20) && (
              <div className="dsc-bp-hint">
                BP를 충전하거나 미션을 완료하면 액막이를 발동할 수 있습니다
              </div>
            )}
          </div>
        )}

        {/* 마무리 문장 */}
        {closingAdvice && (
          <div className="dsc-closing">
            {closingAdvice}
          </div>
        )}
      </div>
    </div>
  );
}
