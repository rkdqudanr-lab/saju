/**
 * SynergyDashboard 컴포넌트
 * CompatPage에 통합되는 시너지 미션 대시보드
 */

import React, { useState } from 'react';
import SocialSynergyMission from './SocialSynergyMission.jsx';

export default function SynergyDashboard({
  compatScore = 0,
  friendName = '친구',
  missions = [],
  onAcceptMission = null,
  onCompleteMission = null,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('missions'); // 'missions' | 'stats'

  const totalMissionsCompleted = missions.filter(m => m.status === 'completed').length;

  return (
    <div
      className={`synergy-dashboard ${className}`}
      style={{
        padding: '16px 0',
      }}
    >
      {/* 시너지 점수 카드 */}
      <div
        style={{
          padding: '20px',
          background: `linear-gradient(135deg, #4A8EC4 0%, #5FAD7A 100%)`,
          borderRadius: '12px',
          color: '#fff',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>
          ✦ 오늘의 시너지 지수
        </div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '4px',
          }}
        >
          {compatScore}%
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>
          {friendName}님과의 궁합
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid #eee',
          marginBottom: '20px',
          paddingBottom: '0px',
        }}
      >
        <button
          onClick={() => setActiveTab('missions')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'missions' ? '2px solid #4A8EC4' : 'none',
            color: activeTab === 'missions' ? '#4A8EC4' : '#999',
            cursor: 'pointer',
            fontWeight: activeTab === 'missions' ? '600' : '400',
            fontSize: '13px',
            textAlign: 'center',
          }}
        >
          ◇ 미션 ({missions.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'stats' ? '2px solid #4A8EC4' : 'none',
            color: activeTab === 'stats' ? '#4A8EC4' : '#999',
            cursor: 'pointer',
            fontWeight: activeTab === 'stats' ? '600' : '400',
            fontSize: '13px',
            textAlign: 'center',
          }}
        >
          ◇ 통계
        </button>
      </div>

      {/* 미션 탭 */}
      {activeTab === 'missions' && (
        <SocialSynergyMission
          missions={missions}
          onAcceptMission={onAcceptMission}
          onCompleteMission={onCompleteMission}
        />
      )}

      {/* 통계 탭 */}
      {activeTab === 'stats' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {/* 완료한 미션 */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#F0F5FF',
                borderRadius: '8px',
                border: '1px solid #D0E0FF',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                완료한 미션
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#4A8EC4',
                }}
              >
                {totalMissionsCompleted}
              </div>
            </div>

            {/* 총 획득 BP */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#FFE5E5',
                borderRadius: '8px',
                border: '1px solid #FFCCCC',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                획득한 BP
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#E05A3A',
                }}
              >
                {totalMissionsCompleted * 30}
              </div>
            </div>
          </div>

          {/* 다음 미션 안내 */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #eee',
              fontSize: '12px',
              color: '#666',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>✦ 시너지 미션 안내</div>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li>매일 새로운 미션이 추가돼요</li>
              <li>미션을 완료하면 쌍방 모두에게 BP가 지급돼요</li>
              <li>7일 내에 완료하지 않으면 미션이 만료돼요</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
