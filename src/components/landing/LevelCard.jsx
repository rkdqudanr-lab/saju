import { useAppStore } from '../../store/useAppStore.js';
import { STEP } from '../../utils/steps.js';

const GROWTH_STAGES = [
  { minMissions: 0,   label: '새싹 별숨',   emoji: '🌱', color: '#74B77B', desc: '별숨과 첫 걸음을 내딛고 있어요' },
  { minMissions: 5,   label: '반짝 요정',   emoji: '✨', color: '#E58AAF', desc: '매일의 흐름을 기록하며 감각이 살아나요' },
  { minMissions: 20,  label: '별빛 항해자', emoji: '🌙', color: '#6E94D6', desc: '나만의 패턴이 보이기 시작했어요' },
  { minMissions: 50,  label: '황금 수호자', emoji: '👑', color: '#C99A3C', desc: '안정적인 루틴을 만들었어요' },
  { minMissions: 100, label: '우주 마스터', emoji: '🌌', color: '#9B7AE5', desc: '별숨 성장 시스템의 최상위 단계예요' },
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

export default function LevelCard() {
  const setStep  = useAppStore((s) => s.setStep);
  const gamState = useAppStore((s) => s.gamificationState) ?? {};

  const totalCompleted = gamState.totalMissionsCompleted ?? 0;
  const stage  = getStage(totalCompleted);
  const next   = getNext(totalCompleted);
  const progress = next
    ? ((totalCompleted - stage.minMissions) / (next.minMissions - stage.minMissions)) * 100
    : 100;

  return (
    <button
      type="button"
      onClick={() => setStep(STEP.GROWTH_DASHBOARD)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: `radial-gradient(ellipse at left center, ${stage.color}16 0%, transparent 55%), var(--bg2)`,
        border: `1px solid ${stage.color}30`,
        borderRadius: 18,
        cursor: 'pointer',
        fontFamily: 'var(--ff)',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 글로우 */}
      <div style={{
        position: 'absolute',
        right: -24,
        top: -24,
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: `${stage.color}18`,
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      {/* 미니 행성 오브 */}
      <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
        {/* 코어 */}
        <div style={{
          position: 'absolute',
          inset: 10,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 28%, ${stage.color}90, ${stage.color}50, rgba(30,20,60,0.85))`,
          animation: 'orbPulse 5s infinite',
        }} />
        {/* 궤도 링 1 */}
        <div style={{
          position: 'absolute',
          inset: 2,
          borderRadius: '50%',
          border: `1px solid ${stage.color}55`,
          animation: 'orbSpin 9s linear infinite',
        }}>
          <div style={{
            position: 'absolute',
            top: -3,
            left: '50%',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: stage.color,
            transform: 'translateX(-50%)',
            boxShadow: `0 0 8px ${stage.color}, 0 0 16px ${stage.color}66`,
          }} />
        </div>
        {/* 궤도 링 2 (역방향) */}
        <div style={{
          position: 'absolute',
          inset: -6,
          borderRadius: '50%',
          border: `1px solid ${stage.color}20`,
          animation: 'orbSpin 16s linear infinite reverse',
        }}>
          <div style={{
            position: 'absolute',
            bottom: -2,
            right: '22%',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'rgba(200,160,255,0.8)',
            boxShadow: '0 0 6px rgba(200,160,255,0.6)',
          }} />
        </div>
        {/* 레벨 이모지 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          animation: 'floatGently 3.6s ease-in-out infinite',
        }}>
          {stage.emoji}
        </div>
      </div>

      {/* 텍스트 영역 */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{
          fontSize: 10,
          color: stage.color,
          fontWeight: 800,
          letterSpacing: '.1em',
          marginBottom: 3,
          textTransform: 'uppercase',
        }}>
          나의 별숨 레벨
        </div>
        <div style={{
          fontSize: 15,
          fontWeight: 800,
          color: 'var(--t1)',
          marginBottom: 7,
          lineHeight: 1,
        }}>
          {stage.label}
        </div>
        {/* 진행률 바 */}
        <div style={{
          height: 5,
          background: 'var(--bg3)',
          borderRadius: 999,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${stage.color}, color-mix(in srgb, ${stage.color} 72%, white 28%))`,
            borderRadius: 999,
            transition: 'width .4s ease',
            boxShadow: `0 0 8px ${stage.color}60`,
          }} />
        </div>
        {next ? (
          <div style={{ marginTop: 4, fontSize: 10, color: 'var(--t4)' }}>
            다음 단계까지 미션 <span style={{ color: stage.color, fontWeight: 700 }}>{next.minMissions - totalCompleted}개</span>
          </div>
        ) : (
          <div style={{ marginTop: 4, fontSize: 10, color: stage.color, fontWeight: 700 }}>
            최고 단계 달성! ✦
          </div>
        )}
      </div>

      {/* 화살표 */}
      <div style={{ color: 'var(--t4)', fontSize: 16, flexShrink: 0, position: 'relative' }}>›</div>
    </button>
  );
}
