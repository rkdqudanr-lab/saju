/**
 * SocialSynergyMission 컴포넌트
 * 친구로부터 받은 시너지 미션 리스트 및 초대
 */

import React from 'react';
import { getTimeRemaining, getStatusLabel } from '../utils/synergyMissionLogic.js';

export default function SocialSynergyMission({
  missions = [],
  activeMissions = [],
  onAcceptMission = null,
  onCompleteMission = null,
  className = '',
}) {
  const pendingMissions = missions.filter(m => m.status === 'pending');
  const activeMissionsList = missions.filter(m => m.status === 'active');

  if (missions.length === 0) {
    return (
      <div
        className={`social-synergy-mission ${className}`}
        style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          color: '#999',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✦</div>
        <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
          친구로부터 받은 시너지 미션이 없어요
          <br />
          궁합을 본 친구와 함께 미션에 도전해봐요!
        </div>
      </div>
    );
  }

  return (
    <div className={`social-synergy-mission ${className}`}>
      {/* 대기 중인 미션 */}
      {pendingMissions.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#999',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            📬 받은 미션 ({pendingMissions.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingMissions.map(mission => (
              <div
                key={mission.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#FFF5E5',
                  borderRadius: '8px',
                  border: '1px solid #FFE5CC',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0D0B14' }}>
                      {mission.icon} {mission.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '4px',
                        lineHeight: 1.4,
                      }}
                    >
                      {mission.proposerName}님이 제안했어요
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#E05A3A',
                      fontWeight: '600',
                    }}
                  >
                    +{mission.reward} BP
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  {mission.description}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <button
                    onClick={() => onAcceptMission?.(mission.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#4A8EC4',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    수락하기
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    나중에
                  </button>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#999',
                    marginTop: '8px',
                    textAlign: 'right',
                  }}
                >
                  남은 시간: {getTimeRemaining(mission.expiresAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 진행 중인 미션 */}
      {activeMissionsList.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#999',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            ⚡ 진행 중 ({activeMissionsList.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeMissionsList.map(mission => (
              <div
                key={mission.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#E5F5FF',
                  borderRadius: '8px',
                  border: '1px solid #CCE5FF',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0D0B14' }}>
                      {mission.icon} {mission.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '4px',
                      }}
                    >
                      {mission.proposerName}님과 함께하는 중
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#5FAD7A',
                      fontWeight: '600',
                    }}
                  >
                    +{mission.reward} BP
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  {mission.description}
                </div>

                <button
                  onClick={() => onCompleteMission?.(mission.id)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#5FAD7A',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  완료했어요!
                </button>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#999',
                    marginTop: '8px',
                    textAlign: 'right',
                  }}
                >
                  남은 시간: {getTimeRemaining(mission.expiresAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
