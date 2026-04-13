import React, { useState, useEffect } from 'react';

export default function GamificationHeaderV2({
  currentBp = 0,
  guardianLevel = 1,
  loginStreak = 0,
  todayMissionsDone = 0,
  totalMissionsTodo = 3,
  freeRechargeAvailable = false,
  className = '',
}) {
  const [timeUntilRecharge, setTimeUntilRecharge] = useState('');

  const missionProgress = `${todayMissionsDone}/${totalMissionsTodo}`;

  useEffect(() => {
    const calculateTimeUntilRecharge = () => {
      const now = new Date();
      const nextRechargeHour = 14; // 오후 2시

      let nextRecharge = new Date();
      nextRecharge.setHours(nextRechargeHour, 0, 0, 0);

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
        setTimeUntilRecharge(`${hours}h ${minutes}m 후`);
      }
    };

    calculateTimeUntilRecharge();
    const interval = setInterval(calculateTimeUntilRecharge, 60000);
    return () => clearInterval(interval);
  }, [freeRechargeAvailable]);

  return (
    <div className={`gam-header ${className} stellar-glass`}>
      {/* BP 표시 + 충전 타이머 */}
      <div className="gam-item gam-bp shimmer">
        <span style={{ filter: 'drop-shadow(0 0 5px var(--gold-glow))' }}>💎</span>
        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>{currentBp}</span>
        <span className={`gam-recharge ${freeRechargeAvailable ? 'active glow' : ''}`} style={{ fontSize: '10px', opacity: 0.8 }}>
          ⏰ {timeUntilRecharge}
        </span>
      </div>

      {/* 레벨 배지 */}
      <div className="gam-lvl stellar-badge">
        Lv.{guardianLevel}
      </div>

      {/* 스트릭 */}
      {loginStreak > 0 && (
        <div className="gam-item gam-streak">
          <span style={{ filter: 'drop-shadow(0 0 5px rgba(255,100,0,0.3))' }}>🔥</span>
          <span style={{ fontWeight: 600 }}>{loginStreak}일</span>
        </div>
      )}

      {/* 미션 현황 */}
      <div className="gam-item gam-mission" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--line)' }}>
        <span style={{ filter: 'drop-shadow(0 0 5px rgba(0,200,255,0.3))' }}>🎯</span>
        <span style={{ fontWeight: 600 }}>{missionProgress}</span>
      </div>
    </div>
  );
}
