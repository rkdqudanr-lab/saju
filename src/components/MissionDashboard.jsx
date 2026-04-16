/**
 * MissionDashboard 컴포넌트
 * 오늘의 미션 표시 (색상/음식/라이프 아이템 + DO 실천/DONT 주의)
 */

import React, { useCallback, useState } from 'react';

const MISSION_CONFIG = {
  color: { emoji: '◇', label: '색상 처방', color: 'var(--teal)', bg: 'rgba(95,173,122,0.08)' },
  menu:  { emoji: '◇', label: '음식 처방', color: '#c08830', bg: 'rgba(192,136,48,0.08)' },
  item:  { emoji: '✧', label: '라이프 아이템', color: '#7B9EC4', bg: 'rgba(123,158,196,0.08)' },
  do:    { emoji: '◈', label: '오늘의 실천', color: '#5FAD7A', bg: 'rgba(95,173,122,0.10)' },
  dont:  { emoji: '△', label: '오늘의 주의', color: '#E08830', bg: 'rgba(224,136,48,0.10)' },
};

export default function MissionDashboard({
  missions = [],
  onMissionComplete = null,
  onDiaryClick = null,
  hasDiaryToday = false,
  className = '',
}) {
  const [completingId, setCompletingId] = useState(null);

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

  const completedCount = missions.filter(m => m.is_completed).length;
  const total = missions.length;
  const completionPct = Math.round((completedCount / total) * 100);
  const milestoneReached = completionPct >= 50;

  // 미션을 do/dont와 처방(color/menu/item)으로 분리해서 표시
  const prescriptions = missions.filter(m => ['color', 'menu', 'item'].includes(m.mission_type));
  const behavioral = missions.filter(m => ['do', 'dont'].includes(m.mission_type));

  if (missions.length === 0) {
    return (
      <div className={`mission-dashboard ${className}`}>
        <div style={{
          padding: '14px 16px',
          textAlign: 'center',
          color: 'var(--t4)',
          fontSize: '13px',
          background: 'var(--bg2)',
          borderRadius: 'var(--r1)',
          border: '1px solid var(--line)',
        }}>
          오늘의 별숨 기운을 확인하면 미션이 나타나요 ✦
        </div>
      </div>
    );
  }

  function MissionRow({ mission }) {
    const cfg = MISSION_CONFIG[mission.mission_type] || { emoji: '✦', label: '미션', color: 'var(--gold)', bg: 'var(--goldf)' };
    const isCompleted = mission.is_completed;
    const isLoading = completingId === mission.id;

    return (
      <div
        onClick={() => !isCompleted && handleMissionClick(mission.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 12px',
          backgroundColor: isCompleted ? 'var(--bg3)' : cfg.bg,
          borderRadius: '8px',
          border: `1px solid ${isCompleted ? 'var(--line)' : cfg.color + '44'}`,
          transition: 'all 0.2s ease',
          cursor: !isCompleted ? 'pointer' : 'default',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {/* 체크박스 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
          backgroundColor: isCompleted ? cfg.color : 'var(--bg3)',
          border: isCompleted ? 'none' : `1.5px solid ${cfg.color}66`,
          color: '#fff', fontSize: '11px', fontWeight: 700,
          transition: 'all 0.2s ease',
        }}>
          {isCompleted ? '✓' : ''}
        </div>

        {/* 내용 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '13px', fontWeight: 500,
            color: isCompleted ? 'var(--t4)' : 'var(--t1)',
            textDecoration: isCompleted ? 'line-through' : 'none',
            lineHeight: 1.4,
          }}>
            {cfg.emoji} {mission.mission_content}
          </div>
          <div style={{ fontSize: '11px', color: cfg.color, marginTop: '2px', opacity: 0.8 }}>
            {cfg.label}
          </div>
        </div>

        {/* BP */}
        <div style={{
          fontSize: '12px', fontWeight: 700, flexShrink: 0,
          color: isCompleted ? 'var(--t4)' : cfg.color,
        }}>
          {isCompleted ? '✓' : `+${mission.bp_reward} BP`}
        </div>
      </div>
    );
  }

  return (
    <div className={`mission-dashboard ${className}`} style={{
      backgroundColor: 'var(--bg2)',
      borderRadius: 'var(--r1)',
      border: '1px solid var(--line)',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)' }}>
            ✦ 오늘의 미션
          </div>
          <div style={{ fontSize: '12px', color: milestoneReached ? 'var(--teal)' : 'var(--t4)', fontWeight: milestoneReached ? 700 : 400 }}>
            {completedCount} / {total} 완료
          </div>
        </div>

        {/* 진행률 바 */}
        <div style={{ height: '5px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${completionPct}%`,
            background: milestoneReached ? 'var(--teal)' : 'var(--gold)',
            borderRadius: '3px',
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* 마일스톤 달성 메시지 */}
        {milestoneReached && (
          <div style={{
            marginTop: 6, fontSize: '11px', color: 'var(--teal)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ✦ 50% 달성 보너스 +5 BP 지급!
          </div>
        )}
      </div>

      {/* 미션 목록 */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {/* 처방 미션 (색상/음식/아이템) */}
        {prescriptions.length > 0 && (
          <>
            {prescriptions.map(m => <MissionRow key={m.id} mission={m} />)}
          </>
        )}

        {/* 실천/주의 미션 */}
        {behavioral.length > 0 && (
          <>
            {prescriptions.length > 0 && (
              <div style={{ height: '1px', background: 'var(--line)', margin: '2px 0' }} />
            )}
            {behavioral.map(m => <MissionRow key={m.id} mission={m} />)}
          </>
        )}

        {/* 일기 쓰기 유도 */}
        {!hasDiaryToday && (
          <button
            onClick={onDiaryClick}
            style={{
              marginTop: 2,
              width: '100%',
              padding: '10px 12px',
              background: 'var(--goldf)',
              border: '1px dashed var(--acc)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: onDiaryClick ? 'pointer' : 'default',
              fontFamily: 'var(--ff)',
            }}
          >
            <span style={{ fontSize: '16px', color: 'var(--gold)' }}>◇</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)' }}>오늘 일기를 쓰면 +5 BP</div>
              <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 1 }}>별숨에게 오늘 하루를 들려주세요</div>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--acc)', fontWeight: 700 }}>→</span>
          </button>
        )}
        {hasDiaryToday && (
          <div style={{
            padding: '9px 12px', background: 'rgba(95,173,122,0.08)',
            borderRadius: '8px', border: '1px solid rgba(95,173,122,0.3)',
            fontSize: '12px', color: '#5FAD7A', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ◇ 오늘 일기 작성 완료 · +5 BP 적립됨
          </div>
        )}
      </div>
    </div>
  );
}
