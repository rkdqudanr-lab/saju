import { useAppStore } from '../store/useAppStore.js';
import { STEP } from '../utils/steps.js';
import MissionDashboard from '../components/MissionDashboard.jsx';

const GROWTH_STAGES = [
  { minMissions: 0,   label: '새싹 별숨',   emoji: '🌱', color: '#74B77B' },
  { minMissions: 5,   label: '반짝 요정',   emoji: '✨', color: '#E58AAF' },
  { minMissions: 20,  label: '별빛 항해자', emoji: '🌙', color: '#6E94D6' },
  { minMissions: 50,  label: '황금 수호자', emoji: '👑', color: '#C99A3C' },
  { minMissions: 100, label: '우주 마스터', emoji: '🌌', color: '#9B7AE5' },
];

function getStage(total) {
  return GROWTH_STAGES.reduce(
    (cur, s) => (total >= s.minMissions ? s : cur),
    GROWTH_STAGES[0],
  );
}

function getNext(total) {
  return GROWTH_STAGES.find((s) => total < s.minMissions) || null;
}

export default function MissionPage({ onCompleteMission, hasDiaryToday }) {
  const setStep   = useAppStore((s) => s.setStep);
  const missions  = useAppStore((s) => s.missions) ?? [];
  const gamState  = useAppStore((s) => s.gamificationState) ?? {};

  const totalCompleted = gamState.totalMissionsCompleted ?? 0;
  const stage  = getStage(totalCompleted);
  const next   = getNext(totalCompleted);
  const progress = next
    ? ((totalCompleted - stage.minMissions) / (next.minMissions - stage.minMissions)) * 100
    : 100;

  const completedToday = missions.filter((m) => m.is_completed).length;
  const totalBpLeft    = missions
    .filter((m) => !m.is_completed)
    .reduce((sum, m) => sum + (m.bp_reward || 0), 0);

  return (
    <div className="page step-fade" style={{ justifyContent: 'flex-start', padding: '0 0 36px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* 상단 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '18px 16px 12px',
        }}>
          <button
            type="button"
            onClick={() => setStep(STEP.HOME)}
            style={{
              background: 'none',
              border: '1px solid var(--line)',
              borderRadius: 999,
              padding: '5px 12px',
              color: 'var(--t3)',
              fontSize: '12px',
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
            }}
          >
            ← 홈
          </button>
          <div style={{ flex: 1, fontSize: 'var(--md)', fontWeight: 800, color: 'var(--t1)' }}>
            오늘 미션
          </div>
          {totalBpLeft > 0 && (
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--gold)',
              background: 'var(--goldf)',
              border: '1px solid var(--acc)',
              borderRadius: 999,
              padding: '4px 10px',
            }}>
              +{totalBpLeft} BP 획득 가능
            </div>
          )}
        </div>

        {/* 오늘 미션이 없는 경우 */}
        {missions.length === 0 ? (
          <div style={{ padding: '0 16px' }}>
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: '32px 20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🌟</div>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                오늘의 별숨을 확인하면 미션이 나타나요
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.7, marginBottom: 20 }}>
                별숨이 오늘 하루의 기운을 읽고<br />맞춤 미션을 준비해드릴게요
              </div>
              <button
                type="button"
                onClick={() => setStep(STEP.TODAY_DETAIL)}
                style={{
                  padding: '12px 24px',
                  background: 'var(--goldf)',
                  border: '1.5px solid var(--acc)',
                  borderRadius: 'var(--r1)',
                  color: 'var(--gold)',
                  fontSize: 'var(--sm)',
                  fontWeight: 700,
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                }}
              >
                ✦ 오늘의 별숨 보기
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            {/* 오늘 진행 요약 */}
            <div style={{
              display: 'flex',
              gap: 10,
              marginBottom: 12,
            }}>
              <div style={{
                flex: 1,
                background: 'var(--bg2)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: '12px 14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>
                  {completedToday}<span style={{ fontSize: 13, color: 'var(--t4)' }}>/{missions.length}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 3, fontWeight: 700 }}>오늘 완료</div>
              </div>
              <div style={{
                flex: 1,
                background: 'var(--bg2)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: '12px 14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#74B77B' }}>
                  {totalCompleted}
                </div>
                <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 3, fontWeight: 700 }}>누적 완료</div>
              </div>
            </div>

            {/* 미션 목록 */}
            <MissionDashboard
              missions={missions}
              onMissionComplete={onCompleteMission}
              hasDiaryToday={hasDiaryToday}
              onDiaryClick={() => setStep(STEP.DIARY)}
            />
          </div>
        )}

        {/* 성장 단계 미니 배지 */}
        <div style={{ padding: '14px 16px 0' }}>
          <button
            type="button"
            onClick={() => setStep(STEP.GROWTH_DASHBOARD)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              background: `linear-gradient(135deg, ${stage.color}12 0%, transparent 60%), var(--bg2)`,
              border: `1px solid ${stage.color}30`,
              borderRadius: 14,
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 24 }}>{stage.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: stage.color, fontWeight: 800, letterSpacing: '.08em', marginBottom: 3 }}>
                현재 성장 단계
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>
                {stage.label}
              </div>
              <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${stage.color}, color-mix(in srgb, ${stage.color} 75%, white 25%))`,
                  borderRadius: 999,
                  transition: 'width .35s ease',
                }} />
              </div>
              {next ? (
                <div style={{ marginTop: 4, fontSize: 10, color: 'var(--t4)' }}>
                  다음 단계까지 미션 {next.minMissions - totalCompleted}개
                </div>
              ) : (
                <div style={{ marginTop: 4, fontSize: 10, color: stage.color, fontWeight: 700 }}>최고 단계 달성! ✦</div>
              )}
            </div>
            <div style={{ color: 'var(--t4)', fontSize: 14 }}>›</div>
          </button>
        </div>

      </div>
    </div>
  );
}
