/**
 * GamificationHeaderV2 컴포넌트
 * BP, 레벨, 스트릭(티어 색상 + 마일스톤 바 + 프리즈), 미션, 무료 충전 타이머
 */

import React, { useState, useEffect } from 'react';
import { getStreakTier, getNextStreakMilestone, STREAK_FREEZE_COST } from '../utils/gamificationLogic.js';

export default function GamificationHeaderV2({
  currentBp = 0,
  guardianLevel = 1,
  loginStreak = 0,
  todayMissionsDone = 0,
  totalMissionsTodo = 3,
  freeRechargeAvailable = false,
  onFreezeStreak,       // () => Promise<{success, message}>
  className = '',
}) {
  const [timeUntilRecharge, setTimeUntilRecharge] = useState('');
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [freezing, setFreezing] = useState(false);

  const levelColors = { 1: '#9B8EC4', 2: '#5FAD7A', 3: '#C08830', 4: '#E05A3A', 5: '#B8A035' };
  const levelColor = levelColors[guardianLevel] || '#9B8EC4';

  // 스트릭 티어 (1일→빨강, 7일→파랑, 14일→보라, 30일→금색)
  const tier = getStreakTier(loginStreak);
  const nextMilestone = getNextStreakMilestone(loginStreak);
  // 현재 티어의 시작점 기준으로 진행률 계산
  const tierStart = tier.min === 1 ? 0 : tier.min;
  const tierEnd = nextMilestone ?? (tier.min + 30);
  const milestoneProgress = nextMilestone
    ? Math.min(100, Math.round(((loginStreak - tierStart) / (tierEnd - tierStart)) * 100))
    : 100;

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(14, 0, 0, 0);
      if (now > next) next.setDate(next.getDate() + 1);
      const diff = next - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (freeRechargeAvailable) setTimeUntilRecharge('지금 충전 가능!');
      else if (h === 0 && m <= 1) setTimeUntilRecharge('곧 충전됨...');
      else setTimeUntilRecharge(`${h}시간 ${m}분 후`);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [freeRechargeAvailable]);

  const handleFreezeClick = () => {
    if (currentBp < STREAK_FREEZE_COST) return;
    setShowFreezeConfirm(true);
  };

  const handleFreezeConfirm = async () => {
    if (!onFreezeStreak || freezing) return;
    setFreezing(true);
    await onFreezeStreak();
    setFreezing(false);
    setShowFreezeConfirm(false);
  };

  return (
    <div
      className={`gamification-header-v2 ${className}`}
      style={{
        padding: '8px 16px 10px',
        backgroundColor: 'var(--bg2)',
        borderBottom: '1px solid var(--line)',
        borderRadius: '0 0 8px 8px',
        marginBottom: '16px',
      }}
    >
      {/* 상단 행 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', minHeight: '36px' }}>

        {/* BP + 충전 타이머 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: levelColor }}>
          <span>💎</span>
          <span>{currentBp}</span>
          <span style={{ fontSize: '10px', fontWeight: '500', color: freeRechargeAvailable ? 'var(--teal)' : 'var(--t4)', opacity: 0.8 }}>
            ⏰ {timeUntilRecharge}
          </span>
        </div>

        {/* 레벨 배지 */}
        <div style={{ padding: '3px 8px', backgroundColor: levelColor, color: '#fff', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
          Lv{guardianLevel}
        </div>

        {/* 스트릭 */}
        {loginStreak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px', filter: `drop-shadow(0 0 4px ${tier.glow})` }}>{tier.emoji}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: tier.color }}>{loginStreak}일</span>
            {nextMilestone && (
              <span style={{ fontSize: '10px', color: 'var(--t4)', opacity: 0.75 }}>→{nextMilestone}일</span>
            )}
            {/* 프리즈 버튼 */}
            {loginStreak >= 2 && onFreezeStreak && (
              <button
                onClick={handleFreezeClick}
                title={`스트릭 프리즈 (${STREAK_FREEZE_COST} BP)`}
                style={{
                  marginLeft: '2px',
                  background: 'none',
                  border: `1px solid ${currentBp >= STREAK_FREEZE_COST ? 'var(--t4)' : 'var(--line)'}`,
                  borderRadius: '8px',
                  padding: '1px 5px',
                  fontSize: '10px',
                  color: currentBp >= STREAK_FREEZE_COST ? 'var(--t3)' : 'var(--t5)',
                  cursor: currentBp >= STREAK_FREEZE_COST ? 'pointer' : 'not-allowed',
                  opacity: currentBp >= STREAK_FREEZE_COST ? 1 : 0.4,
                }}
              >
                ❄️{STREAK_FREEZE_COST}
              </button>
            )}
          </div>
        )}

        {/* 미션 현황 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: 'var(--t3)' }}>
          <span>🎯</span>
          <span>{todayMissionsDone}/{totalMissionsTodo}</span>
        </div>
      </div>

      {/* 스트릭 마일스톤 진행 바 */}
      {loginStreak > 0 && nextMilestone && (
        <div style={{ marginTop: '6px' }}>
          <div style={{ height: '3px', backgroundColor: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${milestoneProgress}%`,
                background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
                borderRadius: '2px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '9px', color: 'var(--t5)', marginTop: '2px', textAlign: 'right' }}>
            {nextMilestone}일 달성까지 {nextMilestone - loginStreak}일
          </div>
        </div>
      )}

      {/* 프리즈 확인 모달 */}
      {showFreezeConfirm && (
        <div
          onClick={() => setShowFreezeConfirm(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg2)', borderRadius: '16px', padding: '24px 20px',
              width: 'min(320px, 88vw)', textAlign: 'center', border: '1px solid var(--line)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>❄️</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--t1)', marginBottom: '8px' }}>
              스트릭 프리즈
            </div>
            <div style={{ fontSize: '13px', color: 'var(--t3)', lineHeight: 1.5, marginBottom: '20px' }}>
              {STREAK_FREEZE_COST} BP를 소비해 내일 로그인하지 않아도
              <br />현재 {loginStreak}일 스트릭을 유지해요.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowFreezeConfirm(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  background: 'var(--bg3)', border: '1px solid var(--line)',
                  color: 'var(--t3)', fontSize: '13px', cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleFreezeConfirm}
                disabled={freezing}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4A9EFF, #7B6CF6)',
                  border: 'none', color: '#fff', fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer', opacity: freezing ? 0.6 : 1,
                }}
              >
                {freezing ? '발동 중...' : `발동 (${STREAK_FREEZE_COST} BP)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
