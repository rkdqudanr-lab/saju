/**
 * MissionDashboard 컴포넌트
 * 오늘의 3가지 미션 표시 (색상/음식/라이프 아이템)
 */

import React, { useCallback, useState } from 'react';

export default function MissionDashboard({
  missions = [],
  onMissionComplete = null,
  className = '',
}) {
  const [completingId, setCompletingId] = useState(null);

  // 미션 타입별 이모지
  const missionEmojis = {
    color: '🎨',
    menu: '🍽️',
    item: '🌿',
  };

  const missionLabels = {
    color: '색상 처방',
    menu: '음식 처방',
    item: '라이프 아이템',
  };

  const handleMissionClick = useCallback(
    async (missionId) => {
      if (!onMissionComplete || completingId) return;

      setCompletingId(missionId);
      try {
        await onMissionComplete(missionId);
      } finally {
        setCompletingId(null);
      }
    },
    [onMissionComplete, completingId]
  );

  if (missions.length === 0) {
    return (
      <div className={`mission-dashboard ${className}`}>
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: 'var(--t4)',
          fontSize: 'var(--xs)',
        }}>
          오늘의 미션을 불러오는 중... ✨
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mission-dashboard ${className}`}
      style={{
        padding: '20px',
        background: 'var(--bg-glass-heavy)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 'var(--r2)',
        border: '0.5px solid var(--line)',
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* 제목 */}
      <div style={{
        fontSize: 'var(--sm)',
        fontWeight: 700,
        marginBottom: '14px',
        color: 'var(--t1)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        🎯 오늘의 미션
      </div>

      {/* 미션 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {missions.map((mission) => {
          const isCompleted = mission.is_completed;
          const emoji = missionEmojis[mission.mission_type] || '✨';
          const label = missionLabels[mission.mission_type] || '미션';

          return (
            <div
              key={mission.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: isCompleted ? 'var(--tealf)' : 'var(--bg-glass)',
                borderRadius: 'var(--r1)',
                border: `0.5px solid ${isCompleted ? 'var(--tealacc)' : 'var(--line)'}`,
                transition: 'all 0.3s var(--ease-cosmic)',
                cursor: !isCompleted ? 'pointer' : 'default',
                opacity: completingId === mission.id ? 0.7 : 1,
              }}
              onClick={() => !isCompleted && handleMissionClick(mission.id)}
            >
              {/* 체크박스 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  background: isCompleted ? 'var(--teal)' : 'var(--bg-glass-heavy)',
                  border: isCompleted ? 'none' : '0.5px solid var(--line)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: 'all 0.3s',
                }}
              >
                {isCompleted ? '✓' : ''}
              </div>

              {/* 미션 내용 */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 'var(--sm)',
                  fontWeight: 500,
                  color: isCompleted ? 'var(--t4)' : 'var(--t1)',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  transition: 'color 0.2s',
                }}>
                  {emoji} {mission.mission_content}
                </div>
                <div style={{
                  fontSize: 'var(--xxs)',
                  color: 'var(--t4)',
                  marginTop: '3px',
                }}>
                  {label}
                </div>
              </div>

              {/* BP 보상 */}
              <div style={{
                fontSize: 'var(--xs)',
                fontWeight: 700,
                color: isCompleted ? 'var(--teal)' : 'var(--gold)',
                flexShrink: 0,
                fontFamily: 'var(--ff-inter)',
              }}>
                +{mission.bp_reward} BP
              </div>
            </div>
          );
        })}
      </div>

      {/* 완료율 표시 */}
      <div style={{
        marginTop: '14px',
        padding: '10px 14px',
        background: 'var(--bg-glass)',
        border: '0.5px solid var(--line)',
        borderRadius: 'var(--r1)',
        fontSize: 'var(--xs)',
        color: 'var(--t3)',
        textAlign: 'center',
        fontWeight: 500,
      }}>
        {missions.filter(m => m.is_completed).length} / {missions.length} 미션 완료
      </div>
    </div>
  );
}
