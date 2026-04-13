/**
 * GamificationHeader 컴포넌트
 * 게이미피케이션 헤더: BP, 레벨, 스트릭, 미션 현황 표시
 */

import React from 'react';

export default function GamificationHeader({
  currentBp = 0,
  guardianLevel = 1,
  loginStreak = 0,
  todayMissionsDone = 0,
  totalMissionsTodo = 3,
  className = '',
}) {
  // 레벨별 색상
  const levelColors = {
    1: '#4A8EC4',
    2: '#5FAD7A',
    3: '#C08830',
    4: '#E05A3A',
    5: '#B8A035',
  };

  const color = levelColors[guardianLevel] || '#4A8EC4';
  const missionProgress = `${todayMissionsDone}/${totalMissionsTodo}`;

  return (
    <div
      className={`gamification-header ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#f9f9f9',
        borderBottom: `1px solid #eee`,
        borderRadius: '0 0 8px 8px',
        marginBottom: '16px',
      }}
    >
      {/* BP 표시 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: '600',
          color: color,
        }}
      >
        <span>💎</span>
        <span>{currentBp}</span>
      </div>

      {/* 레벨 배지 */}
      <div
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          backgroundColor: color,
          color: '#fff',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
        }}
      >
        Lv{guardianLevel}
      </div>

      {/* 스트릭 */}
      {loginStreak > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#E05A3A',
          }}
        >
          <span>🔥</span>
          <span>{loginStreak}일</span>
        </div>
      )}

      {/* 미션 현황 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#666',
        }}
      >
        <span>🎯</span>
        <span>{missionProgress}</span>
      </div>
    </div>
  );
}
