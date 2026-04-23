export const AXES_9 = [
  { key: 'overall', label: '종합' },
  { key: 'wealth',  label: '금전' },
  { key: 'love',    label: '애정' },
  { key: 'career',  label: '직장' },
  { key: 'study',   label: '학업' },
  { key: 'health',  label: '건강' },
  { key: 'social',  label: '대인' },
  { key: 'travel',  label: '이동' },
  { key: 'create',  label: '창의' },
];

export const ASPECT_META = {
  overall: { label: '종합', emoji: '✨' },
  wealth:  { label: '금전', emoji: '💰' },
  love:    { label: '애정', emoji: '💞' },
  career:  { label: '직장', emoji: '📈' },
  study:   { label: '학업', emoji: '📚' },
  health:  { label: '건강', emoji: '🌿' },
  social:  { label: '대인', emoji: '🤝' },
  travel:  { label: '이동', emoji: '🧭' },
  create:  { label: '창의', emoji: '🎨' },
};

export const LOW_AXIS_SCORE_THRESHOLD = 45;
export const TODAY_AXIS_CACHE = 'daily_axis_activations';

const AXIS_GUIDE_COPY = {
  overall: {
    do: '오늘 흐름을 한 번에 정리하고 가장 중요한 한 가지에 힘을 모아보세요.',
    caution: '여러 가지를 동시에 벌리면 전체 리듬이 쉽게 흐트러질 수 있어요.',
    high: '전반 흐름이 안정적이라 작은 선택도 좋은 결과로 이어질 가능성이 커요.',
    mid: '기복은 크지 않지만 집중 방향에 따라 체감이 달라질 수 있는 날이에요.',
    low: '전체 밸런스가 조금 처져 있어서 일정과 에너지 배분을 가볍게 가져가는 편이 좋아요.',
  },
  wealth: {
    do: '지출과 수입을 짧게 점검하고, 작은 이득도 놓치지 않게 기록해두세요.',
    caution: '기분 따라 결제하거나 즉흥적으로 판단하면 만족도가 떨어질 수 있어요.',
    high: '금전 감각이 또렷해서 실속 있는 선택을 하기 좋은 흐름이에요.',
    mid: '큰 손실은 아니지만 꼼꼼함이 있어야 체감 운이 올라가는 구간이에요.',
    low: '재물 흐름이 예민해서 소비와 계약은 한 번 더 확인하는 편이 안전해요.',
  },
  love: {
    do: '마음을 먼저 정리한 뒤 부드럽고 분명하게 표현해보세요.',
    caution: '상대의 반응을 너무 빨리 단정하면 서운함이 커질 수 있어요.',
    high: '감정 교류가 잘 붙는 날이라 관계를 따뜻하게 만들기 쉬워요.',
    mid: '작은 표현 하나가 분위기를 좌우하는 무난하지만 섬세한 흐름이에요.',
    low: '애정 에너지가 흔들릴 수 있어 감정보다 태도와 말투를 안정시키는 게 중요해요.',
  },
  career: {
    do: '업무 우선순위를 선명하게 정하고, 끝낼 일부터 정리해보세요.',
    caution: '성과를 서두르다 보면 실수나 커뮤니케이션 누락이 생길 수 있어요.',
    high: '일 처리 감각과 존재감이 살아나는 흐름이라 추진력이 붙기 쉬워요.',
    mid: '평소 하던 일은 무난하지만 한 번 더 정리해야 결과가 좋아져요.',
    low: '업무 피로감이나 압박이 커질 수 있으니 속도보다 정확도를 챙기는 게 좋아요.',
  },
  study: {
    do: '짧게 끊어서 집중하고, 오늘 얻은 핵심만 남기는 방식이 잘 맞아요.',
    caution: '한 번에 많이 하려 하면 집중력이 금방 퍼질 수 있어요.',
    high: '이해력과 몰입감이 올라와서 공부나 정보 정리에 힘이 실리기 쉬워요.',
    mid: '집중 시간만 잘 관리하면 성과를 무난하게 낼 수 있는 흐름이에요.',
    low: '머리가 쉽게 분산될 수 있으니 학습량보다 리듬 회복을 먼저 챙겨보세요.',
  },
  health: {
    do: '수면, 수분, 식사 같은 기본 리듬을 안정적으로 챙겨보세요.',
    caution: '무리한 일정이나 회복 없는 강행군은 컨디션 저하로 바로 이어질 수 있어요.',
    high: '몸의 반응이 비교적 가벼워서 생활 리듬을 잘 유지하면 더 좋아져요.',
    mid: '큰 무리는 아니지만 피로 누적을 방치하지 않는 게 중요한 날이에요.',
    low: '체력과 회복력이 예민할 수 있어 휴식 우선 전략이 특히 중요해요.',
  },
  social: {
    do: '짧더라도 먼저 안부를 건네고, 편한 관계부터 연결을 넓혀보세요.',
    caution: '분위기에 맞추느라 내 페이스를 잃으면 피로가 커질 수 있어요.',
    high: '사람 운이 부드럽게 열려서 도움과 연결이 자연스럽게 붙기 쉬워요.',
    mid: '무난한 흐름이지만 먼저 움직일수록 체감이 좋아지는 날이에요.',
    low: '대인 에너지가 쉽게 소모될 수 있어 약속과 감정 소모를 줄이는 편이 좋아요.',
  },
  travel: {
    do: '이동 전후 시간을 여유 있게 잡고 준비물을 미리 체크해두세요.',
    caution: '서두르거나 즉흥적으로 경로를 바꾸면 피곤함이 커질 수 있어요.',
    high: '이동과 변화에 유연하게 대응하기 좋은 흐름이라 발걸음이 가벼워질 수 있어요.',
    mid: '보통 수준의 흐름이라 준비만 잘하면 무난하게 지나가기 쉬워요.',
    low: '이동 중 변수에 예민할 수 있어 일정 압축보다 여유를 두는 쪽이 좋아요.',
  },
  create: {
    do: '떠오르는 생각을 바로 적고, 완성보다 초안을 만드는 데 집중해보세요.',
    caution: '처음부터 완벽하게 만들려 하면 오히려 흐름이 끊길 수 있어요.',
    high: '영감과 표현력이 살아 있어 창작이나 기획 아이디어를 펼치기 좋은 날이에요.',
    mid: '아이디어는 나오지만 정리 방식에 따라 결과 차이가 생기기 쉬운 흐름이에요.',
    low: '창의 에너지가 잠깐 막힐 수 있으니 억지 생산보다 입력과 환기가 더 효과적이에요.',
  },
};

export function getDailyAxisScores(baseScore, equippedItems) {
  const todayDate = new Date().toISOString().slice(0, 10);
  const getDailyNoise = (idx) => {
    const val = Number(todayDate.replace(/-/g, '')) + idx;
    return (((val * 9301 + 49297) % 233280) / 233280) * 16 - 8;
  };

  return AXES_9.map((axis, idx) => {
    const base = Math.max(20, Math.min(85, (baseScore || 60) + getDailyNoise(idx)));
    let bonus = 0;
    let boostItem = null;
    (equippedItems || []).forEach((item) => {
      if (item.aspectKey === axis.key) {
        bonus += item.boost || 0;
        if (!boostItem) boostItem = item;
      } else if (item.category === 'talisman' && item.type === axis.key) {
        bonus += item.boost || 10;
        if (!boostItem) boostItem = item;
      }
    });
    return {
      key: axis.key,
      label: axis.label,
      base: Math.round(base),
      total: Math.min(100, Math.round(base + bonus)),
      bonus: Math.round(bonus),
      boostItem,
    };
  });
}

export function getAxisInsight(score) {
  const guide = AXIS_GUIDE_COPY[score.key] || AXIS_GUIDE_COPY.overall;
  const reason = score.total >= 75 ? guide.high : score.total >= 50 ? guide.mid : guide.low;
  const itemReason = score.bonus > 0 && score.boostItem
    ? `${score.boostItem.name} 효과로 +${score.bonus}점 보정이 들어가 있어요.`
    : '오늘은 아직 이 영역에 아이템 보정이 직접 들어가진 않았어요.';
  const baseReason = score.bonus > 0
    ? `기본 흐름은 ${score.base}점이고, 아이템/부적으로 ${score.total}점까지 올라왔어요.`
    : `기본 흐름이 ${score.base}점으로 형성돼 있고 현재 총점은 ${score.total}점이에요.`;
  return { reason, itemReason, baseReason, do: guide.do, caution: guide.caution };
}

export function getRecommendedRow(score, ownedRows) {
  if (!ownedRows?.length) return null;
  const matched = ownedRows.filter((row) => row.item?.aspectKey === score.key);
  if (!matched.length) return null;
  return [...matched].sort((a, b) => (b.item?.boost || 0) - (a.item?.boost || 0))[0];
}
