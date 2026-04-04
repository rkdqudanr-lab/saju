/**
 * DailyStarCardV2 컴포넌트
 * 게이미피케이션 버전 운세 카드
 * 배드타임 섹션, 액막이 버튼, 처방 정보 포함
 */

import React, { useState, useCallback } from 'react';
import { breakAtNatural } from '../utils/constants.js';

const ITEM_ICONS = ['🎨', '🍽️', '🌿', '✨', '🌙'];
const ITEM_COLORS = ['var(--lav)', 'var(--teal)', 'var(--gold)', 'var(--gold)', 'var(--rose)'];

function parseDailyLines(text) {
  if (!text || typeof text !== 'string') return {
    score: null,
    summary: '',
    items: [],
    badtime: null,
    sajuReason: '',
    astrologyReason: '',
    closingAdvice: '',
  };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let score = null;
  let summary = '';
  const items = [];
  let summaryFound = false;
  let badtime = null;
  let sajuReason = '';
  let astrologyReason = '';
  let closingAdvice = '';

  // [점수] 추출
  const scoreIdx = lines.findIndex(l => l.startsWith('[점수]'));
  if (scoreIdx !== -1) {
    const scoreStr = lines[scoreIdx].replace('[점수]', '').trim();
    score = parseInt(scoreStr, 10);
  }

  // [요약] 추출
  const summaryIdx = lines.findIndex(l => l.startsWith('[요약]'));
  if (summaryIdx !== -1) {
    summary = lines[summaryIdx].replace('[요약]', '').trim();
    summaryFound = true;
  }

  // 아이템 추출 (색/음식/방향/좋은것/조심할것)
  const colorStart = lines.findIndex(l => l.includes('오늘의 색'));
  const itemStart = colorStart !== -1 ? colorStart : (summaryFound ? summaryIdx + 1 : 0);

  for (let i = itemStart; i < lines.length && items.length < 5; i++) {
    const line = lines[i];
    if (line.startsWith('[점수]') || line.startsWith('[요약]') || line.startsWith('[배드타임')) continue;
    if (line.startsWith('🀄') || line.startsWith('✦') || line.includes('마무리')) continue;
    items.push(line);
  }

  // 배드타임 섹션 추출
  const badtimeIdx = lines.findIndex(l => l.includes('배드타임') || l.includes('⚠️'));
  if (badtimeIdx !== -1) {
    let symptom = '';
    let transformation = '';

    // 증상 추출
    for (let i = badtimeIdx; i < lines.length && i < badtimeIdx + 3; i++) {
      if (lines[i].includes('악운') || lines[i].includes('증상')) {
        symptom = lines[i].replace('악운 증상:', '').replace('악운:', '').replace('⚠️', '').trim();
        break;
      }
    }

    // 변환된 운명 추출
    for (let i = badtimeIdx; i < lines.length && i < badtimeIdx + 5; i++) {
      if (lines[i].includes('바꿨어요')) {
        transformation = lines[i].trim();
        break;
      }
    }

    if (symptom || transformation) {
      badtime = { symptom, transformation };
    }
  }

  // 사주 근거 추출 (🀄 아이콘)
  const sajuIdx = lines.findIndex(l => l.startsWith('🀄'));
  if (sajuIdx !== -1) {
    sajuReason = lines[sajuIdx].replace('🀄', '').trim();
  }

  // 별자리 근거 추출 (✦ 아이콘)
  const astrologyIdx = lines.findIndex(l => l.startsWith('✦'));
  if (astrologyIdx !== -1) {
    astrologyReason = lines[astrologyIdx].replace('✦', '').trim();
  }

  // 마무리 문장 추출 (마지막 1-2줄)
  if (lines.length > 0) {
    closingAdvice = lines[lines.length - 1];
  }

  return {
    score,
    summary,
    items,
    badtime,
    sajuReason,
    astrologyReason,
    closingAdvice,
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

  const {
    score,
    summary,
    items,
    badtime,
    sajuReason,
    astrologyReason,
    closingAdvice,
  } = parseDailyLines(result?.text || '');

  const hasBadtime = badtime && score && score < 50;

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
        {/* 상단 shimmer 라인 */}
        <div className="dsc-top-shimmer" />

        {/* 제목 */}
        <div className="dsc-header">
          <span className="dsc-header-dot" />
          <span className="dsc-title">오늘 하루 나의 별숨</span>
          <span className="dsc-header-dot" />
        </div>

        {/* 점수 */}
        {score !== null && (
          <div className="dsc-score">
            별숨 점수 <strong>{score}</strong>
          </div>
        )}

        {/* 요약 */}
        {summary && (
          <div className="dsc-summary">{breakAtNatural(summary)}</div>
        )}

        {/* 기본 5항목 */}
        <div className="dsc-items">
          {items.map((item, i) => (
            <div
              key={i}
              className="dsc-item"
              style={{
                '--dsc-delay': `${i * 0.08}s`,
                '--dsc-color': ITEM_COLORS[i],
              }}
            >
              <div className="dsc-item-icon-wrap">
                <span className="dsc-item-icon">{ITEM_ICONS[i]}</span>
              </div>
              <p className="dsc-item-text">{item}</p>
            </div>
          ))}
        </div>

        {/* 배드타임 섹션 */}
        {hasBadtime && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#fff5f5',
              borderLeft: '4px solid #E05A3A',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#E05A3A', marginBottom: '8px' }}>
              ⚠️ 배드타임 감지
            </div>

            {badtime.symptom && (
              <div style={{ fontSize: '12px', color: '#333', marginBottom: '10px' }}>
                악운: {badtime.symptom}
              </div>
            )}

            {/* 액막이 버튼 */}
            {!blocked && (
              <button
                onClick={handleBlockBadtime}
                disabled={isBlocking || !canBlockBadtime || currentBp < 20}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: canBlockBadtime && currentBp >= 20 ? '#5FAD7A' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor:
                    isBlocking || !canBlockBadtime || currentBp < 20
                      ? 'not-allowed'
                      : 'pointer',
                  marginBottom: '8px',
                  transition: 'opacity 0.2s',
                }}
              >
                {isBlocking ? '액막이 발동 중...' : `액막이 발동 (BP -20)`}
              </button>
            )}

            {/* 액막이 완료 메시지 */}
            {blocked && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#2e7d32',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}
              >
                ✨ {badtime.transformation || '별숨이 악운을 긍정적으로 바꿨어요'}
              </div>
            )}

            {/* BP 부족 메시지 */}
            {!canBlockBadtime || currentBp < 20 ? (
              <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                💡 BP를 충전하거나 미션을 완료하면 액막이를 발동할 수 있습니다
              </div>
            ) : null}

            {/* 사주/별자리 근거 */}
            {(sajuReason || astrologyReason) && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
                {sajuReason && <div>🀄 {sajuReason}</div>}
                {astrologyReason && <div>✦ {astrologyReason}</div>}
              </div>
            )}
          </div>
        )}

        {/* 마무리 한 줄 비책 */}
        {closingAdvice && (
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #f0f0f0',
            fontSize: '12px',
            color: '#666',
            fontStyle: 'italic',
          }}>
            {closingAdvice}
          </div>
        )}
      </div>
    </div>
  );
}
