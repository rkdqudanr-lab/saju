/**
 * GrowthDashboardPage — 별숨성장 대시보드 (step 37)
 * 게이미피케이션 현황, 미션, 레벨 진행도를 한 화면에서 확인
 */

import { useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import GamificationDashboard from './GamificationDashboard.jsx';
import MissionDashboard from './MissionDashboard.jsx';
import { getStreakTier, getNextStreakMilestone, GUARDIAN_LEVEL_THRESHOLDS, FREE_BP_RECHARGE } from '../utils/gamificationLogic.js';

const LEVEL_COLORS = { 1: '#4A8EC4', 2: '#5FAD7A', 3: '#C08830', 4: '#E05A3A', 5: '#B8A035' };

function StatCard({ icon, label, value, color = 'var(--gold)', sub }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: 'var(--bg2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r1)',
      padding: '14px 12px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 3, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StreakBar({ loginStreak }) {
  const tier = getStreakTier(loginStreak);
  const next = getNextStreakMilestone(loginStreak);
  const pct = next ? Math.min(100, (loginStreak / next.days) * 100) : 100;

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r1)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>
          {tier.icon} {loginStreak}일 스트릭
        </div>
        <div style={{
          fontSize: '10px', fontWeight: 700,
          color: tier.color,
          background: tier.color + '22',
          padding: '3px 8px', borderRadius: 20,
        }}>
          {tier.label}
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: tier.color,
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>
      {next && (
        <div style={{ fontSize: '10px', color: 'var(--t4)' }}>
          다음 마일스톤까지 <strong style={{ color: tier.color }}>{next.days - loginStreak}일</strong> 남음 · {next.days}일 달성 시 {next.reward}
        </div>
      )}
      {!next && (
        <div style={{ fontSize: '10px', color: tier.color, fontWeight: 700 }}>✦ 최고 티어 달성!</div>
      )}
    </div>
  );
}

function LevelProgress({ guardianLevel, gamificationState }) {
  const color = LEVEL_COLORS[guardianLevel] || '#4A8EC4';
  const nextLevel = Math.min(5, guardianLevel + 1);
  const nextData = GUARDIAN_LEVEL_THRESHOLDS[nextLevel];
  const curData = GUARDIAN_LEVEL_THRESHOLDS[guardianLevel];
  const { totalMissionsCompleted = 0, badtimeBlocksCount = 0, loginStreak = 0 } = gamificationState ?? {};

  const bars = [
    { label: '미션', icon: '🎯', cur: totalMissionsCompleted, max: nextData?.missions, color: '#4A8EC4' },
    { label: '액막이', icon: '🛡️', cur: badtimeBlocksCount, max: nextData?.badtimes, color: '#E05A3A' },
    { label: '스트릭', icon: '🔥', cur: loginStreak, max: nextData?.streak, color: '#FFA500' },
  ];

  if (guardianLevel >= 5) {
    return (
      <div style={{
        background: `${color}11`,
        border: `1px solid ${color}44`,
        borderRadius: 'var(--r1)',
        padding: '16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>🌟</div>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color }}>별숨의 수호자</div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 4 }}>최고 레벨에 도달했어요</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r1)',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t3)', marginBottom: 12 }}>
        Lv{guardianLevel} → Lv{nextLevel} 승급 조건
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bars.map(({ label, icon, cur, max, color: c }) => {
          const pct = max ? Math.min(100, (cur / max) * 100) : 100;
          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 4 }}>
                <span style={{ color: 'var(--t2)' }}>{icon} {label}</span>
                <span style={{ color: 'var(--t4)' }}>{cur} / {max}</span>
              </div>
              <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: '10px', color: 'var(--t4)' }}>
        현재: <strong style={{ color }}>{curData?.label}</strong>
        {' → '}다음: <strong style={{ color: LEVEL_COLORS[nextLevel] }}>{nextData?.label}</strong>
      </div>
    </div>
  );
}

export default function GrowthDashboardPage({ onRechargeFreeBP }) {
  const { gamificationState, missions, setStep } = useAppStore();
  const [tab, setTab] = useState('overview'); // 'overview' | 'missions'

  const safe = gamificationState ?? { currentBp: 0, guardianLevel: 1, loginStreak: 0, totalMissionsCompleted: 0, badtimeBlocksCount: 0 };
  const { currentBp = 0, guardianLevel = 1, loginStreak = 0 } = safe;
  const color = LEVEL_COLORS[guardianLevel] || '#4A8EC4';
  const freeRecharge = FREE_BP_RECHARGE[guardianLevel] || 5;
  const safeMissions = missions ?? [];
  const completedCount = safeMissions.filter(m => m.is_completed).length;

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>
          🌱 별숨성장
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
          매일 미션을 완료하고 수호자 레벨을 올려보세요
        </div>
      </div>

      {/* 상단 스탯 카드 */}
      <div style={{ padding: '0 20px', display: 'flex', gap: 8, marginBottom: 16 }}>
        <StatCard icon="💎" label="보유 BP" value={currentBp} color="var(--gold)" />
        <StatCard icon="⚡" label="수호자 레벨" value={`Lv${guardianLevel}`} color={color} />
        <StatCard icon="✅" label="오늘 미션" value={`${completedCount}/${safeMissions.length}`} color="#5FAD7A" />
      </div>

      {/* BP 충전 버튼 */}
      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <button
          onClick={onRechargeFreeBP}
          style={{
            width: '100%', padding: '12px',
            background: 'var(--goldf)',
            border: '1.5px solid var(--acc)',
            borderRadius: 'var(--r1)',
            color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--sm)',
            fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          ✦ 무료 BP 충전 (+{freeRecharge} BP)
        </button>
      </div>

      {/* 탭 */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--line)',
        padding: '0 20px', marginBottom: 16,
      }}>
        {[
          { id: 'overview', label: '📊 성장 현황' },
          { id: 'missions', label: '🎯 오늘 미션' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px',
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? `2px solid ${color}` : '2px solid transparent',
              color: tab === t.id ? color : 'var(--t4)',
              fontWeight: tab === t.id ? 700 : 400,
              fontSize: 'var(--sm)', fontFamily: 'var(--ff)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'overview' && (
          <>
            <StreakBar loginStreak={loginStreak} />
            <LevelProgress guardianLevel={guardianLevel} gamificationState={safe} />
            {/* 빠른 이동 */}
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r1)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t3)' }}>
                바로가기
              </div>
              {[
                { icon: '📊', label: '나의 별숨 분석', step: 13 },
                { icon: '📈', label: '별숨 통계', step: 28 },
                { icon: '🛍️', label: '별숨샵', step: 31 },
                { icon: '🎁', label: '내 아이템', step: 38 },
              ].map(({ icon, label, step }) => (
                <button
                  key={step}
                  onClick={() => setStep(step)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    background: 'none', border: 'none', borderBottom: '1px solid var(--line)',
                    cursor: 'pointer', fontFamily: 'var(--ff)', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ flex: 1, fontSize: 'var(--sm)', color: 'var(--t1)' }}>{label}</span>
                  <span style={{ fontSize: 14, color: 'var(--t4)' }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'missions' && (
          <MissionDashboard
            missions={safeMissions}
            onDiaryClick={() => setStep(22)}
            hasDiaryToday={safeMissions.some(m => m.mission_type === 'diary' && m.is_completed)}
          />
        )}
      </div>
    </div>
  );
}
