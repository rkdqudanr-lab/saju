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
        padding: '24px 20px',
        maxWidth: '600px',
        margin: '0 auto',
        minHeight: '80vh'
      }}
    >
      {/* 탭 네비게이션 */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-glass)',
          padding: '4px',
          borderRadius: 16,
          border: '0.5px solid var(--line)',
          marginBottom: 32,
          backdropFilter: 'blur(10px)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'progress', label: 'Ranking' },
          { id: 'history', label: 'Records' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 0',
              background: activeTab === tab.id ? 'var(--gold-grad)' : 'transparent',
              border: 'none',
              borderRadius: 12,
              color: activeTab === tab.id ? '#000' : 'var(--t4)',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 'var(--xxs)',
              fontFamily: 'var(--ff-inter)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
              padding: '24px',
              background: 'var(--bg-glass-heavy)',
              borderRadius: 'var(--r2)',
              border: '0.5px solid var(--line)',
              backdropFilter: 'blur(16px)',
              boxShadow: 'var(--shadow)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '120%', height: '140%', background: `radial-gradient(circle at 50% 50%, ${currentColor}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ fontSize: '10px', color: 'var(--gold)', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Current Balance
            </div>
            <div
              style={{
                fontSize: 'var(--xl)',
                fontWeight: '900',
                color: 'var(--t1)',
                marginBottom: '20px',
                fontFamily: 'var(--ff-inter)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <span style={{ fontSize: 'var(--lg)', opacity: 0.8 }}>💎</span> {currentBp}
            </div>
            <button
              onClick={onRechargeFreeBP}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--gold-grad)',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: 'var(--xs)',
                fontWeight: '800',
                fontFamily: 'var(--ff)',
                boxShadow: '0 4px 15px rgba(230,195,90,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              DAILY RECHARGE (+{freeRechargeAmount} BP)
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
                padding: '20px 16px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--r2)',
                border: `0.5px solid ${currentColor}66`,
                backdropFilter: 'blur(8px)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '9px', color: 'var(--t4)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Guardian Tier
              </div>
              <div
                style={{
                  fontSize: 'var(--lg)',
                  fontWeight: '900',
                  color: currentColor,
                  marginBottom: '4px',
                  fontFamily: 'var(--ff-inter)',
                  textShadow: `0 0 10px ${currentColor}44`
                }}
              >
                LV.{guardianLevel}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--t2)', fontWeight: 700 }}>
                {currentLevelData?.label}
              </div>
            </div>

            {/* 스트릭 */}
            <div
              style={{
                padding: '20px 16px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--r2)',
                border: '0.5px solid var(--line)',
                backdropFilter: 'blur(8px)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '9px', color: 'var(--t4)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Orbit Streak
              </div>
              <div
                style={{
                  fontSize: 'var(--lg)',
                  fontWeight: '900',
                  color: '#FF6D3F',
                  marginBottom: '4px',
                  fontFamily: 'var(--ff-inter)',
                  textShadow: '0 0 10px rgba(255,109,63,0.3)'
                }}
              >
                🔥 {loginStreak}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--t2)', fontWeight: 700 }}>
                {loginStreak} DAYS
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
                background: 'var(--bg-glass)',
                borderRadius: 'var(--r1)',
                border: '0.5px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ fontSize: '9px', color: 'var(--t4)', fontWeight: 600, letterSpacing: '0.05em' }}>COMPLETED MISSIONS</div>
              <div
                style={{
                  fontSize: 'var(--md)',
                  fontWeight: '800',
                  color: '#4A8EC4',
                  fontFamily: 'var(--ff-inter)',
                }}
              >
                🎯 {totalMissionsCompleted}
              </div>
            </div>

            {/* 액막이 */}
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--r1)',
                border: '0.5px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ fontSize: '9px', color: 'var(--t4)', fontWeight: 600, letterSpacing: '0.05em' }}>ORBIT DEFENSES</div>
              <div
                style={{
                  fontSize: 'var(--md)',
                  fontWeight: '800',
                  color: 'var(--rose)',
                  fontFamily: 'var(--ff-inter)',
                }}
              >
                🛡️ {badtimeBlocksCount}
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
              padding: '24px 20px',
              background: 'var(--bg-glass-heavy)',
              borderRadius: 'var(--r2)',
              border: `0.5px solid var(--line)`,
              backdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 800, marginBottom: '20px', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
              ✦ Path to Next Hierarchy (Lv.{Math.min(5, guardianLevel + 1)})
            </div>

            {/* 미션 진행도 */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--xxs)',
                  color: 'var(--t2)',
                  marginBottom: '8px',
                  fontWeight: 700
                }}
              >
                <span>🎯 MISSION COMPLETION</span>
                <span style={{ fontFamily: 'var(--ff-inter)', color: 'var(--gold)' }}>
                  {totalMissionsCompleted} / {nextLevelData?.missions}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'var(--line)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, missionProgressPercent)}%`,
                    height: '100%',
                    background: 'var(--gold-grad)',
                    boxShadow: '0 0 8px rgba(230,195,90,0.5)',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>

            {/* 액막이 진행도 */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--xxs)',
                  color: 'var(--t2)',
                  marginBottom: '8px',
                  fontWeight: 700
                }}
              >
                <span>🛡️ ORBIT PROTECTION</span>
                <span style={{ fontFamily: 'var(--ff-inter)', color: 'var(--rose)' }}>
                  {badtimeBlocksCount} / {nextLevelData?.badtimes}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'var(--line)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (badtimeBlocksCount / nextLevelData?.badtimes) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #FF7D7D, #FF4D4D)',
                    boxShadow: '0 0 8px rgba(255,77,77,0.4)',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
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
                  fontSize: 'var(--xxs)',
                  color: 'var(--t2)',
                  marginBottom: '8px',
                  fontWeight: 700
                }}
              >
                <span>🔥 LOGIN STREAK</span>
                <span style={{ fontFamily: 'var(--ff-inter)', color: '#FFAC4D' }}>
                  {loginStreak} / {nextLevelData?.streak}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'var(--line)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (loginStreak / nextLevelData?.streak) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #FFAC4D, #FF8C00)',
                    boxShadow: '0 0 8px rgba(255,172,77,0.4)',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 레벨 특성 */}
          <div
            style={{
              padding: '20px',
              background: 'var(--bg-glass)',
              borderRadius: 'var(--r2)',
              border: '0.5px solid var(--line)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--t4)', fontWeight: 700, marginBottom: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Tier Privileges
            </div>
            <div style={{ fontSize: 'var(--xs)', lineHeight: '1.8', color: 'var(--t2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: currentColor, fontSize: 'var(--sm)' }}>✦</span>
                <span style={{ fontWeight: 700 }}>Current Rank:</span> 
                <span style={{ color: currentColor }}>{currentLevelData?.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--gold)', fontSize: 'var(--sm)' }}>✦</span>
                <span style={{ fontWeight: 700 }}>BP Recharge:</span> 
                <span style={{ color: 'var(--gold)' }}>+{freeRechargeAmount} BP per Lunar Day</span>
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
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
            <div>곧 상세 이력이 추가됩니다</div>
          </div>
        </div>
      )}
    </div>
  );
}
