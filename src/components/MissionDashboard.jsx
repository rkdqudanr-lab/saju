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
      <div className={`mission-dashboard ${className}`} style={{ padding: '0' }}>
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: '#999',
          fontSize: '13px',
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
        padding: '16px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
      }}
    >
      {/* 제목 */}
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '12px',
        color: '#333',
      }}>
        오늘의 미션 🎯
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
                padding: '12px',
                backgroundColor: isCompleted ? '#f0f8f4' : '#fafafa',
                borderRadius: '6px',
                border: `1px solid ${isCompleted ? '#5FAD7A' : '#e0e0e0'}`,
                transition: 'all 0.3s ease',
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
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: isCompleted ? '#5FAD7A' : '#e0e0e0',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '600',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? '✓' : ''}
              </div>

              {/* 미션 내용 */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: isCompleted ? '#999' : '#333',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                }}>
                  {emoji} {mission.mission_content}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#999',
                  marginTop: '3px',
                }}>
                  {label}
                </div>
              </div>

              {/* BP 보상 */}
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: isCompleted ? '#5FAD7A' : '#E05A3A',
                flexShrink: 0,
              }}>
                +{mission.bp_reward} BP
              </div>
            </div>
          );
        })}
      </div>

      {/* 완료율 표시 */}
      <div style={{
        marginTop: '12px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center',
      }}>
        {missions.filter(m => m.is_completed).length} / {missions.length} 미션 완료
      </div>
    </div>
  );
}
