import { useAppStore } from '../../store/useAppStore.js';
import { STEP } from '../../utils/steps.js';
import { getStage, getNextStage as getNext } from '../../utils/growthStages.js';

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
            최고 단계 달성!
          </div>
        )}
      </div>

      <div className="level-card-arrow">›</div>
    </button>
  );
}
