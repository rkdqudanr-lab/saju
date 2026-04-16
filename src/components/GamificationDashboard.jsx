/**
 * GamificationDashboard 컴포넌트
 * 게이미피케이션 상세 대시보드: BP 통계, 레벨 진행도, 미션 현황, 배드타임 이력
 */

import React, { useState } from 'react';
import { GUARDIAN_LEVEL_THRESHOLDS, FREE_BP_RECHARGE } from '../utils/gamificationLogic.js';

export default function GamificationDashboard({
  gamificationState,
  missions = [],
  onRechargeFreeBP,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'progress' | 'history'

  if (!gamificationState) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        게이미피케이션 정보를 불러오는 중...
      </div>
    );
  }

  const {
    currentBp,
    guardianLevel,
    loginStreak,
    totalMissionsCompleted,
    badtimeBlocksCount,
    nextLevelMissions,
    lastLoginDate,
  } = gamificationState;

  const levelColors = {
    1: '#4A8EC4',
    2: '#5FAD7A',
    3: '#C08830',
    4: '#E05A3A',
    5: '#B8A035',
  };

  const currentColor = levelColors[guardianLevel] || '#4A8EC4';
  const currentLevelData = GUARDIAN_LEVEL_THRESHOLDS[guardianLevel];
  const nextLevelData = GUARDIAN_LEVEL_THRESHOLDS[Math.min(5, guardianLevel + 1)];
  const freeRechargeAmount = FREE_BP_RECHARGE[guardianLevel] || 5;

  // 레벨 진행도 계산
  const missionProgress = nextLevelData?.missions ? totalMissionsCompleted % nextLevelData.missions : 0;
  const missionProgressPercent = nextLevelData?.missions ? (missionProgress / nextLevelData.missions) * 100 : 0;

  return (
    <div
      className={`gamification-dashboard ${className}`}
      style={{
        padding: '16px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      {/* 탭 네비게이션 */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #eee',
          marginBottom: '20px',
        }}
      >
        {[
          { id: 'overview', label: '📊 개요' },
          { id: 'progress', label: '📈 진행도' },
          { id: 'history', label: '📋 이력' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${currentColor}` : 'none',
              color: activeTab === tab.id ? currentColor : '#999',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? '600' : '400',
              fontSize: '14px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 1: 개요 */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* BP 카드 */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: `1px solid ${currentColor}20`,
            }}
          >
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
              현재 BP
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: currentColor,
                marginBottom: '12px',
              }}
            >
              💎 {currentBp}
            </div>
            <button
              onClick={onRechargeFreeBP}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#5FAD7A',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              무료 BP 충전 (+{freeRechargeAmount})
            </button>
          </div>

          {/* 레벨 & 스트릭 카드 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            {/* 레벨 */}
            <div
              style={{
                padding: '16px',
                backgroundColor: `${currentColor}10`,
                borderRadius: '8px',
                border: `1px solid ${currentColor}30`,
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                현재 레벨
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: currentColor,
                  marginBottom: '4px',
                }}
              >
                Lv{guardianLevel}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {currentLevelData?.label}
              </div>
            </div>

            {/* 스트릭 */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#FFF5E610',
                borderRadius: '8px',
                border: '1px solid #FFF5E630',
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                로그인 스트릭
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#E05A3A',
                  marginBottom: '4px',
                }}
              >
                🔥 {loginStreak}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {loginStreak}일 연속
              </div>
            </div>
          </div>

          {/* 미션 & 액막이 카드 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            {/* 미션 */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#F0F5FF',
                borderRadius: '8px',
                border: '1px solid #D0E0FF',
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                완료한 미션
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#4A8EC4',
                  marginBottom: '4px',
                }}
              >
                🎯 {totalMissionsCompleted}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                총 {missions.length}개 진행 중
              </div>
            </div>

            {/* 액막이 */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#FFE5E5',
                borderRadius: '8px',
                border: '1px solid #FFCCCC',
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                액막이 발동
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#E05A3A',
                  marginBottom: '4px',
                }}
              >
                🛡️ {badtimeBlocksCount}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                배드타임 차단
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 2: 진행도 */}
      {activeTab === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 다음 레벨까지 필요한 것 */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: `1px solid ${currentColor}20`,
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
              다음 레벨까지 필요한 것 (Lv{Math.min(5, guardianLevel + 1)})
            </div>

            {/* 미션 진행도 */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                <span>🎯 미션</span>
                <span>
                  {totalMissionsCompleted} / {nextLevelData?.missions}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#eee',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, missionProgressPercent)}%`,
                    height: '100%',
                    backgroundColor: '#4A8EC4',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* 액막이 진행도 */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                <span>🛡️ 액막이</span>
                <span>
                  {badtimeBlocksCount} / {nextLevelData?.badtimes}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#eee',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (badtimeBlocksCount / nextLevelData?.badtimes) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#E05A3A',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* 로그인 스트릭 진행도 */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                <span>🔥 로그인 스트릭</span>
                <span>
                  {loginStreak} / {nextLevelData?.streak}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#eee',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (loginStreak / nextLevelData?.streak) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#FFA500',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 레벨 특성 */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #eee',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
              현재 레벨 특성
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#666' }}>
              <div>
                <strong>레벨:</strong> {currentLevelData?.label}
              </div>
              <div style={{ marginTop: '8px' }}>
                <strong>무료 충전:</strong> +{freeRechargeAmount} BP (1회/일)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 3: 이력 */}
      {activeTab === 'history' && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #eee',
            textAlign: 'center',
            color: '#999',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'var(--t4)' }}>✦</div>
            <div>곧 상세 이력이 추가됩니다</div>
          </div>
        </div>
      )}
    </div>
  );
}
