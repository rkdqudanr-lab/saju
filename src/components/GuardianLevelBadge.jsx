/**
 * GuardianLevelBadge 컴포넌트
 * Lv1~5 뱃지, 다음 레벨 진행률 표시
 */

import React from 'react';

export default function GuardianLevelBadge({
  level = 1,
  nextLevelMissions = 0,
  totalMissionsToNextLevel = 15,
  className = '',
}) {
  const levelLabels = {
    1: '초급 액막이사',
    2: '중급 액막이사',
    3: '고급 액막이사',
    4: '마스터 액막이사',
    5: '별숨의 수호자',
  };

  const levelColors = {
    1: '#9B8EC4',
    2: '#5FAD7A',
    3: '#C08830',
    4: '#E05A3A',
    5: '#B8A035',
  };

  const label = levelLabels[level] || '초급 액막이사';
  const color = levelColors[level] || '#9B8EC4';
  const isMaxLevel = level >= 5;
  const progress = isMaxLevel ? 100 : Math.min(100, ((totalMissionsToNextLevel - nextLevelMissions) / totalMissionsToNextLevel) * 100);

  return (
    <div className={`guardian-level-badge ${className}`}>
      {/* 뱃지 */}
      <div
        style={{
          display: 'inline-block',
          padding: '8px 12px',
          backgroundColor: color,
          color: '#fff',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '4px',
        }}
      >
        Lv{level} · {label}
      </div>

      {/* 레벨업 혜택 설명 */}
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: '10px' }}>
        미션 완료 · 액막이 · 출석으로 레벨업 → 무료 충전량 증가
      </div>

      {/* 다음 레벨 진행률 */}
      {!isMaxLevel && (
        <div style={{ marginTop: '4px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--t3)' }}>
              다음 레벨까지
            </div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: color }}>
              {nextLevelMissions} 미션
            </div>
          </div>

          {/* 진행률 바 */}
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--bg3)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: color,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* 최대 레벨 도달 메시지 */}
      {isMaxLevel && (
        <div style={{
          fontSize: '12px',
          color: color,
          fontWeight: '600',
          marginTop: '8px',
          textAlign: 'center',
        }}>
          최고 레벨 달성! 주간 보너스 100 BM 획득
        </div>
      )}
    </div>
  );
}
