// 별숨이 성장 단계 — 누적 미션 완료 수 기반 (백엔드 추적값)
// LevelCard와 PetMascot이 공유한다.
export const GROWTH_STAGES = [
  { minMissions: 0,   label: '새싹 별숨',   emoji: '🌱', color: '#74B77B', desc: '별숨과 첫 걸음을 내딛고 있어요' },
  { minMissions: 5,   label: '반짝 요정',   emoji: '✨', color: '#E58AAF', desc: '매일의 흐름을 기록하며 감각이 살아나요' },
  { minMissions: 20,  label: '별빛 항해자', emoji: '🌙', color: '#6E94D6', desc: '나만의 패턴이 보이기 시작했어요' },
  { minMissions: 50,  label: '황금 수호자', emoji: '👑', color: '#C99A3C', desc: '안정적인 루틴을 만들었어요' },
  { minMissions: 100, label: '우주 마스터', emoji: '🌌', color: '#9B7AE5', desc: '별숨 성장 시스템의 최상위 단계예요' },
];

export function getStage(total) {
  return GROWTH_STAGES.reduce(
    (cur, s) => (total >= s.minMissions ? s : cur),
    GROWTH_STAGES[0],
  );
}

export function getNextStage(total) {
  return GROWTH_STAGES.find((s) => total < s.minMissions) || null;
}

// 단계 인덱스 (0~4) — 펫 크기 보간 등에 사용
export function getStageIndex(total) {
  const stage = getStage(total);
  return GROWTH_STAGES.indexOf(stage);
}
