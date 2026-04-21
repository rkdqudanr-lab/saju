/**
 * GrowthDashboardPage — 별숨성장 대시보드 (step 37)
 * 귀여운 SVG 캐릭터 기반 성장 시스템
 */

import { useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import MissionDashboard from './MissionDashboard.jsx';
import { FREE_BP_RECHARGE } from '../utils/gamificationLogic.js';

// ── 별숨 성장 단계 정의 (완료 미션 수 기준) ──────────────────────
const GROWTH_STAGES = [
  { minMissions: 0,   label: '새싹 별숨',   emoji: '🌱', color: '#7AC97A', desc: '별숨과 처음 인사했어요' },
  { minMissions: 5,   label: '꽃봉오리',    emoji: '🌸', color: '#F5A0C0', desc: '별숨의 따스함을 느끼기 시작했어요' },
  { minMissions: 20,  label: '반짝별',      emoji: '⭐', color: '#F5C842', desc: '별의 기운이 당신 주위를 감돌아요' },
  { minMissions: 50,  label: '별빛 수호자', emoji: '🌟', color: '#E8B048', desc: '별숨과 깊이 연결됐어요' },
  { minMissions: 100, label: '우주의 별',   emoji: '✨', color: '#C89FFF', desc: '별숨이 당신을 기억해요' },
];

function getGrowthStage(totalMissions) {
  let stage = GROWTH_STAGES[0];
  for (const s of GROWTH_STAGES) {
    if (totalMissions >= s.minMissions) stage = s;
  }
  return stage;
}

function getNextStage(totalMissions) {
  for (const s of GROWTH_STAGES) {
    if (totalMissions < s.minMissions) return s;
  }
  return null;
}

// ── 귀여운 별 캐릭터 SVG ─────────────────────────────────────────
function StarCharacter({ stage, size = 80 }) {
  const colors = {
    '🌱': { body: '#7AC97A', face: '#fff', eye: '#444' },
    '🌸': { body: '#F5A0C0', face: '#fff', eye: '#B05070' },
    '⭐': { body: '#F5C842', face: '#fff', eye: '#7A5500' },
    '🌟': { body: '#E8B048', face: '#fff', eye: '#7A4A00' },
    '✨': { body: '#C89FFF', face: '#fff', eye: '#5A3A9A' },
  };
  const c = colors[stage.emoji] || colors['🌱'];

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
      {/* 몸통 — 별 모양 */}
      <path
        d="M40 8 L44.7 28.3 L65.5 28.3 L49.4 41.7 L55.1 62 L40 48.6 L24.9 62 L30.6 41.7 L14.5 28.3 L35.3 28.3 Z"
        fill={c.body}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
        style={{ filter: `drop-shadow(0 4px 8px ${c.body}88)` }}
      />
      {/* 눈 */}
      <circle cx="34" cy="34" r="3" fill={c.eye} />
      <circle cx="46" cy="34" r="3" fill={c.eye} />
      {/* 눈 하이라이트 */}
      <circle cx="35.2" cy="33" r="1" fill="#fff" opacity="0.8" />
      <circle cx="47.2" cy="33" r="1" fill="#fff" opacity="0.8" />
      {/* 입 */}
      <path d="M35 40 Q40 45 45 40" fill="none" stroke={c.eye} strokeWidth="1.8" strokeLinecap="round" />
      {/* 볼 */}
      <circle cx="30" cy="40" r="4" fill="#FFB8C8" opacity="0.5" />
      <circle cx="50" cy="40" r="4" fill="#FFB8C8" opacity="0.5" />
      {/* 반짝임 효과 */}
      <circle cx="62" cy="14" r="2" fill={c.body} opacity="0.6" />
      <circle cx="68" cy="22" r="1.2" fill={c.body} opacity="0.4" />
      <circle cx="15" cy="18" r="1.5" fill={c.body} opacity="0.5" />
    </svg>
  );
}

// ── 성장 진행바 ───────────────────────────────────────────────────
function GrowthProgressBar({ totalMissions }) {
  const stage = getGrowthStage(totalMissions);
  const next = getNextStage(totalMissions);
  const pct = next
    ? Math.min(100, ((totalMissions - stage.minMissions) / (next.minMissions - stage.minMissions)) * 100)
    : 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: stage.color }}>{stage.label}</span>
        {next ? (
          <span style={{ fontSize: '11px', color: 'var(--t4)' }}>
            다음: {next.label} ({next.minMissions - totalMissions}개 남음)
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: stage.color, fontWeight: 700 }}>최고 단계 달성! ✦</span>
        )}
      </div>
      <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${stage.color}, ${stage.color}CC)`,
          borderRadius: 4,
          transition: 'width 0.5s ease',
          boxShadow: `0 0 8px ${stage.color}66`,
        }} />
      </div>
    </div>
  );
}

// ── 활동 카드 ─────────────────────────────────────────────────────
function ActivityCard({ icon, label, value, color, desc }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--line)',
      borderRadius: 12,
      padding: '14px 12px',
      textAlign: 'center',
      flex: 1,
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 3, fontWeight: 600 }}>{label}</div>
      {desc && <div style={{ fontSize: '9px', color: 'var(--t4)', marginTop: 2 }}>{desc}</div>}
    </div>
  );
}

// ── 연속 출석 표시 ────────────────────────────────────────────────
function StreakDisplay({ streak }) {
  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > streak);
  const remaining = nextMilestone ? nextMilestone - streak : 0;

  const getMilestoneEmoji = (days) => {
    if (days >= 100) return '👑';
    if (days >= 60) return '🌙';
    if (days >= 30) return '💫';
    if (days >= 14) return '⭐';
    if (days >= 7) return '🔥';
    return '✦';
  };

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--line)',
      borderRadius: 12,
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <div>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: '#FF7832' }}>
              {streak}일 연속 방문 중
            </div>
            <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 1 }}>
              별숨이 당신을 기다리고 있어요
            </div>
          </div>
        </div>
        {nextMilestone && (
          <div style={{
            padding: '5px 10px', borderRadius: 20,
            background: 'rgba(255,120,50,0.1)',
            border: '1px solid rgba(255,120,50,0.3)',
            fontSize: '11px', color: '#FF7832', fontWeight: 700,
          }}>
            {getMilestoneEmoji(nextMilestone)} +{remaining}일
          </div>
        )}
      </div>
      {/* 마일스톤 점 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {milestones.map(m => {
          const reached = streak >= m;
          return (
            <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: reached ? '#FF7832' : 'var(--bg3)',
                border: reached ? 'none' : '1px solid var(--line)',
                marginBottom: 3,
              }} />
              <div style={{ fontSize: '8px', color: reached ? '#FF7832' : 'var(--t4)' }}>{m}</div>
            </div>
          );
        })}
      </div>
      {streak === 0 && (
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--t4)', marginTop: 8 }}>
          오늘 별숨을 열면 스트릭이 시작돼요 ✦
        </div>
      )}
    </div>
  );
}

export default function GrowthDashboardPage({ onRechargeFreeBP }) {
  const { gamificationState, missions, setStep } = useAppStore();
  const [tab, setTab] = useState('growth'); // 'growth' | 'missions'

  const safe = gamificationState ?? { currentBp: 0, guardianLevel: 1, loginStreak: 0, totalMissionsCompleted: 0 };
  const {
    currentBp = 0,
    guardianLevel = 1,
    loginStreak = 0,
    totalMissionsCompleted = 0,
  } = safe;

  const freeRecharge = FREE_BP_RECHARGE[guardianLevel] || 5;
  const safeMissions = missions ?? [];
  const completedToday = safeMissions.filter(m => m.is_completed).length;

  const stage = getGrowthStage(totalMissionsCompleted);
  const TAB_COLOR = stage.color;

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 4 }}>
          ✦ 별숨성장
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 2 }}>
          나의 별숨 성장 기록
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
          매일 별숨과 함께하며 성장해요
        </div>
      </div>

      {/* 캐릭터 + 성장 단계 카드 */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          background: `linear-gradient(135deg, ${stage.color}18, ${stage.color}08)`,
          border: `1px solid ${stage.color}44`,
          borderRadius: 16,
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          {/* 별 캐릭터 */}
          <div style={{ flexShrink: 0, animation: 'floatGently 3s ease-in-out infinite' }}>
            <StarCharacter stage={stage} size={72} />
          </div>
          {/* 성장 정보 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '10px', fontWeight: 700,
              color: stage.color, letterSpacing: '.06em', marginBottom: 2,
            }}>
              {stage.emoji} {stage.label}
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 10, lineHeight: 1.5 }}>
              {stage.desc}
            </div>
            <GrowthProgressBar totalMissions={totalMissionsCompleted} />
          </div>
        </div>
      </div>

      {/* 활동 통계 */}
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 8 }}>
        <ActivityCard icon="💎" label="보유 BP" value={currentBp} color="var(--gold)" />
        <ActivityCard icon="✅" label="완료 미션" value={totalMissionsCompleted} color="#5FAD7A" />
        <ActivityCard icon="📓" label="오늘 미션" value={`${completedToday}/${safeMissions.length}`} color="#4A8EC4" />
      </div>

      {/* BP 충전 버튼 */}
      <div style={{ padding: '12px 20px 0' }}>
        <button
          onClick={onRechargeFreeBP}
          style={{
            width: '100%', padding: '13px',
            background: 'var(--goldf)',
            border: '1.5px solid var(--acc)',
            borderRadius: 12,
            color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--sm)',
            fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          ✦ 무료 BP 충전 (+{freeRecharge} BP) · 하루 1회
        </button>
      </div>

      {/* 탭 */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--line)',
        padding: '12px 20px 0', marginTop: 4,
      }}>
        {[
          { id: 'growth', label: '🌱 성장 현황' },
          { id: 'missions', label: '🎯 오늘 미션' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px',
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? `2px solid ${TAB_COLOR}` : '2px solid transparent',
              color: tab === t.id ? TAB_COLOR : 'var(--t4)',
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
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'growth' && (
          <>
            {/* 연속 출석 */}
            <StreakDisplay streak={loginStreak} />

            {/* 성장 단계 안내 */}
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t3)' }}>
                ✦ 성장 단계
              </div>
              {GROWTH_STAGES.map((s, i) => {
                const isReached = totalMissionsCompleted >= s.minMissions;
                const isCurrent = getGrowthStage(totalMissionsCompleted) === s;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 16px',
                      background: isCurrent ? `${s.color}12` : 'transparent',
                      borderBottom: i < GROWTH_STAGES.length - 1 ? '1px solid var(--line)' : 'none',
                      opacity: isReached ? 1 : 0.45,
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{s.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 'var(--xs)', fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? s.color : 'var(--t2)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {s.label}
                        {isCurrent && (
                          <span style={{
                            fontSize: '9px', padding: '1px 6px',
                            borderRadius: 8, background: s.color + '22',
                            color: s.color, fontWeight: 700,
                          }}>현재</span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--t4)', flexShrink: 0 }}>
                      {s.minMissions === 0 ? '시작' : `미션 ${s.minMissions}개`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 바로가기 */}
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid var(--line)',
              borderRadius: 12,
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
