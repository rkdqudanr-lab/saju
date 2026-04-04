/**
 * GamificationHeaderV2 컴포넌트
 * 게이미피케이션 헤더: BP, 레벨, 스트릭, 미션, 무료 BP 충전 타이머
 */

import React, { useState, useEffect } from 'react';

export default function GamificationHeaderV2({
  currentBp = 0,
  guardianLevel = 1,
  loginStreak = 0,
  todayMissionsDone = 0,
  totalMissionsTodo = 3,
  freeRechargeAvailable = false, // users.free_bp_recharge_at이 오늘인지 여부
  className = '',
}) {
  const [timeUntilRecharge, setTimeUntilRecharge] = useState('');

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

  // 매시간 2시까지의 시간 계산
  useEffect(() => {
    const calculateTimeUntilRecharge = () => {
      const now = new Date();
      const nextRechargeHour = 14; // 오후 2시

      let nextRecharge = new Date();
      nextRecharge.setHours(nextRechargeHour, 0, 0, 0);

      // 이미 2시가 지났으면 내일 2시로 설정
      if (now > nextRecharge) {
        nextRecharge.setDate(nextRecharge.getDate() + 1);
      }

      const diffMs = nextRecharge - now;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (freeRechargeAvailable) {
        setTimeUntilRecharge('지금 충전 가능!');
      } else if (hours === 0 && minutes <= 1) {
        setTimeUntilRecharge('곧 충전됨...');
      } else {
        setTimeUntilRecharge(`${hours}시간 ${minutes}분 후`);
      }
    };

    calculateTimeUntilRecharge();
    const interval = setInterval(calculateTimeUntilRecharge, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, [freeRechargeAvailable]);

  return (
    <div
      className={`gamification-header-v2 ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#f9f9f9',
        borderBottom: '1px solid #eee',
        borderRadius: '0 0 8px 8px',
        marginBottom: '16px',
        gap: '12px',
        flexWrap: 'wrap',
        minHeight: '44px',
      }}
    >
      {/* BP 표시 + 충전 타이머 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: '600',
          color: color,
        }}
      >
        <span>💎</span>
        <span>{currentBp}</span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: '500',
            color: freeRechargeAvailable ? '#5FAD7A' : '#999',
            opacity: 0.8,
          }}
        >
          ⏰ {timeUntilRecharge}
        </span>
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
