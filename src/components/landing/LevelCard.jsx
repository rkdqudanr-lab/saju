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
      className="level-card"
      style={{
        '--level-color': stage.color,
        '--level-progress': `${Math.min(100, Math.max(0, progress))}%`,
      }}
    >
      <div className="level-card-symbol" aria-hidden="true">
        <span>{stage.emoji}</span>
      </div>

      <div className="level-card-body">
        <div className="level-card-kicker">나의 별숨 레벨</div>
        <div className="level-card-title">{stage.label}</div>
        <div className="level-card-progress" aria-hidden="true">
          <span />
        </div>
        {next ? (
          <div className="level-card-meta">
            다음 단계까지 미션 <strong>{next.minMissions - totalCompleted}개</strong>
          </div>
        ) : (
          <div className="level-card-meta level-card-meta--done">
            최고 단계 달성! ✦
          </div>
        )}
      </div>

      <div className="level-card-arrow">›</div>
    </button>
  );
}
