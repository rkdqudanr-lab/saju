import { ACTIONABLE_AXIS_KEYS, ASPECT_META, getAverageFortuneScore } from './getDailyAxisScores.js';
import { GRADE_ORDER, SAJU_GRADE_ORDER } from '../../utils/gachaItems.js';

export const TODAY_AXIS_TEXT_CACHE = 'today_axis_text_overrides_v2';

const SPACE_RARITY = Object.fromEntries(GRADE_ORDER.map((grade, index) => [grade, index]));
const SAJU_RARITY = Object.fromEntries(SAJU_GRADE_ORDER.map((grade, index) => [grade, index]));
const PICK_FIELDS = ['food', 'place', 'color', 'item', 'number', 'direction', 'communication', 'action'];

const PICK_THEME = {
  wealth: {
    food: ['유자차', '들깨 버섯 리소토', '고소한 견과 요거트'],
    place: ['채광 좋은 작업실', '조용한 서점 카페', '정리된 마켓 골목'],
    color: ['샴페인 골드', '웜 베이지', '버터 크림'],
    item: ['카드지갑', '메탈 펜', '슬림 노트'],
    direction: ['서쪽', '북서쪽'],
    communication: ['기준과 숫자를 먼저 말하기', '짧고 또렷하게 핵심만 정리하기'],
    action: ['미뤄둔 정산 하나 마감하기', '작은 지출 한 칸만 정리하기'],
  },
  love: {
    food: ['딸기 크림 토스트', '따뜻한 파스타', '부드러운 밀크티'],
    place: ['브런치 카페', '잔잔한 산책로', '작은 플라워 숍'],
    color: ['로즈 핑크', '피치 코랄', '웜 화이트'],
    item: ['향수', '작은 손거울', '실크 스카프'],
    direction: ['남서쪽', '서쪽'],
    communication: ['부드럽게 먼저 표현하기', '상대의 말 끝을 한 번 더 받아주기'],
    action: ['마음에 남은 한 문장을 바로 전하기', '한 사람에게 먼저 안부 보내기'],
  },
  career: {
    food: ['통곡물 샌드위치', '에그 베이글', '가벼운 곡물 샐러드'],
    place: ['집중용 데스크', '코워킹 라운지', '채광 좋은 회의실'],
    color: ['딥 네이비', '스틸 그레이', '샤프 화이트'],
    item: ['메모패드', '태블릿 스탠드', '노트북 파우치'],
    direction: ['북쪽', '북동쪽'],
    communication: ['한 문장 결론부터 말하기', '우선순위를 먼저 합의하기'],
    action: ['가장 중요한 일 하나부터 끝내기', '답을 미루던 메시지 하나 처리하기'],
  },
  study: {
    food: ['플레인 베이글', '말차 라테', '가벼운 샐러드 랩'],
    place: ['도서관 창가석', '스터디 카페', '조용한 라운지'],
    color: ['스카이 블루', '페일 민트', '아이스 그레이'],
    item: ['형광펜', '북마크', '타이머'],
    direction: ['동쪽', '북동쪽'],
    communication: ['모호한 부분을 질문으로 정리하기', '배운 내용을 한 줄로 설명하기'],
    action: ['25분만 몰입하고 바로 기록 남기기', '핵심 개념 한 묶음만 정리하기'],
  },
  health: {
    food: ['따뜻한 수프', '맑은 죽', '허브티'],
    place: ['공원 산책로', '햇빛 드는 창가', '조용한 휴식 공간'],
    color: ['세이지 그린', '오트밀 베이지', '소프트 아이보리'],
    item: ['텀블러', '스트레칭 밴드', '핸드크림'],
    direction: ['남쪽', '남동쪽'],
    communication: ['속도를 늦추고 차분히 말하기', '컨디션을 숨기지 말고 먼저 공유하기'],
    action: ['수분과 호흡부터 챙기기', '쉬는 시간 10분을 먼저 확보하기'],
  },
  social: {
    food: ['오픈 샌드위치', '브런치 플레이트', '과일 탄산수'],
    place: ['동네 카페', '작은 편집숍', '열린 라운지'],
    color: ['민트 블루', '샌드 베이지', '라이트 코랄'],
    item: ['엽서', '미니 파우치', '이어커프'],
    direction: ['동쪽', '남동쪽'],
    communication: ['한 박자 쉬고 상대 말을 받아주기', '가벼운 질문으로 분위기 열기'],
    action: ['한 사람에게 먼저 리액션 보내기', '관계가 필요한 일부터 짧게 연결하기'],
  },
  travel: {
    food: ['김밥', '미니 샌드위치', '상큼한 에이드'],
    place: ['강변 산책로', '탁 트인 전망대', '이동이 쉬운 카페'],
    color: ['클리어 블루', '라이트 그린', '선샤인 옐로'],
    item: ['캡 모자', '보조배터리', '크로스백'],
    direction: ['동쪽', '남쪽'],
    communication: ['약속 시간을 짧고 명확하게 맞추기', '이동 전에 한 번 더 체크하기'],
    action: ['동선을 하나만 정리하고 움직이기', '필수 짐만 가볍게 챙기기'],
  },
  create: {
    food: ['시나몬 라테', '브런치 플레이트', '다크 초콜릿'],
    place: ['복합문화공간', '조용한 갤러리 카페', '메모하기 좋은 창가석'],
    color: ['라일락', '살몬 오렌지', '코발트 블루'],
    item: ['스케치북', '태블릿 펜', '보이스 레코더'],
    direction: ['남서쪽', '서쪽'],
    communication: ['떠오른 아이디어를 바로 꺼내기', '완성보다 콘셉트를 먼저 말하기'],
    action: ['초안 한 장부터 거칠게 만들기', '생각난 키워드 세 개를 묶어보기'],
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getAxisLabel(score) {
  return ASPECT_META[score?.key]?.label || score?.label || score?.key || '';
}

function getItemBoost(row) {
  return Number(row?.item?.boost) || 0;
}

function getRarityRank(row) {
  const grade = row?.item?.grade;
  if (grade in SPACE_RARITY) return SPACE_RARITY[grade];
  if (grade in SAJU_RARITY) return SAJU_RARITY[grade];
  return 99;
}

function getSelectionStats(rows) {
  return rows.reduce((acc, row) => ({
    totalBoost: acc.totalBoost + getItemBoost(row),
    rarityCost: acc.rarityCost + getRarityRank(row),
    count: acc.count + 1,
  }), { totalBoost: 0, rarityCost: 0, count: 0 });
}

function compareSelections(nextRows, currentRows, targetBoost) {
  const next = getSelectionStats(nextRows);
  const current = getSelectionStats(currentRows);
  const nextReached = next.totalBoost >= targetBoost;
  const currentReached = current.totalBoost >= targetBoost;

  if (nextReached !== currentReached) {
    return nextReached ? -1 : 1;
  }

  if (nextReached) {
    if (next.totalBoost !== current.totalBoost) {
      return next.totalBoost - current.totalBoost;
    }
  } else if (next.totalBoost !== current.totalBoost) {
    return current.totalBoost - next.totalBoost;
  }

  if (next.count !== current.count) {
    return next.count - current.count;
  }

  if (next.rarityCost !== current.rarityCost) {
    return next.rarityCost - current.rarityCost;
  }

  return 0;
}

export function selectAutoRows(rows = [], currentScore = 0, maxScore = 100) {
  const safeRows = (rows || []).filter((row) => getItemBoost(row) > 0);
  const targetBoost = Math.max(0, maxScore - Math.min(maxScore, currentScore || 0));
  if (!safeRows.length || targetBoost <= 0) return [];

  const sortedRows = [...safeRows].sort((a, b) => {
    const boostDiff = getItemBoost(a) - getItemBoost(b);
    if (boostDiff !== 0) return boostDiff;
    const rarityDiff = getRarityRank(a) - getRarityRank(b);
    if (rarityDiff !== 0) return rarityDiff;
    return String(a?.item?.name || '').localeCompare(String(b?.item?.name || ''), 'ko');
  });

  let best = [];
  const states = new Map([[0, []]]);

  for (const row of sortedRows) {
    const snapshot = [...states.entries()];
    for (const [sum, selection] of snapshot) {
      const nextSum = sum + getItemBoost(row);
      const nextSelection = [...selection, row];
      const existing = states.get(nextSum);
      if (!existing || compareSelections(nextSelection, existing, targetBoost) < 0) {
        states.set(nextSum, nextSelection);
      }
      if (!best.length || compareSelections(nextSelection, best, targetBoost) < 0) {
        best = nextSelection;
      }
    }
  }

  return best;
}

export function mergeBoostEntry(prevEntry, rows = []) {
  const prevItems = Array.isArray(prevEntry?.items) ? prevEntry.items.filter(Boolean) : [];
  const nextItems = [
    ...prevItems,
    ...rows.map((row) => ({
      itemId: String(row?.rowId || row?.item?.id || ''),
      id: String(row?.item?.id || ''),
      boost: getItemBoost(row),
      name: row?.item?.name || '',
      emoji: row?.item?.emoji || '',
      grade: row?.item?.grade || '',
    })).filter((item) => item.itemId && item.boost > 0),
  ];
  const totalBoost = nextItems.reduce((sum, item) => sum + (item.boost || 0), 0);
  const latest = nextItems[nextItems.length - 1] || null;

  return {
    itemId: latest?.itemId || prevEntry?.itemId || '',
    boost: totalBoost,
    name: latest?.name || prevEntry?.name || '',
    emoji: latest?.emoji || prevEntry?.emoji || '✨',
    items: nextItems,
  };
}

export function getBoostItemsForAxis(boostMap, axisKey) {
  const entry = boostMap?.[axisKey];
  if (!entry || typeof entry !== 'object') return [];
  if (Array.isArray(entry.items)) return entry.items.filter(Boolean);
  if (entry.itemId && entry.boost) {
    return [{
      itemId: String(entry.itemId),
      id: String(entry.itemId),
      boost: Number(entry.boost) || 0,
      name: entry.name || '',
      emoji: entry.emoji || '',
      grade: entry.grade || '',
    }];
  }
  return [];
}

function getPoolValue(pool, seed, offset = 0) {
  const list = Array.isArray(pool) ? pool.filter(Boolean) : [pool].filter(Boolean);
  if (!list.length) return '';
  return list[Math.abs(seed + offset) % list.length];
}

function createPickSeed(scores = []) {
  return scores.reduce(
    (acc, score, index) => acc + (((score?.total || 0) * 13) + ((score?.bonus || 0) * 7) + ((index + 1) * 17)),
    0,
  );
}

function mergePickField(field, derivedValue, fallbackValue, preferFallback) {
  if (preferFallback && fallbackValue) return fallbackValue;
  return derivedValue || fallbackValue || (field === 'number' ? '7' : '');
}

export function deriveByeolsoomPick(scores = [], fallback = null) {
  const actionable = (scores || []).filter((score) => ACTIONABLE_AXIS_KEYS.includes(score.key));
  if (!actionable.length) return fallback;

  const rankedDesc = [...actionable].sort((a, b) => {
    if ((b.total || 0) !== (a.total || 0)) return (b.total || 0) - (a.total || 0);
    return (b.bonus || 0) - (a.bonus || 0);
  });
  const rankedAsc = [...actionable].sort((a, b) => {
    if ((a.total || 0) !== (b.total || 0)) return (a.total || 0) - (b.total || 0);
    return (a.bonus || 0) - (b.bonus || 0);
  });

  const strongest = rankedDesc[0];
  const backup = rankedDesc[1] || strongest;
  const weakest = rankedAsc[0];
  const booster = [...actionable].sort((a, b) => {
    if ((b.bonus || 0) !== (a.bonus || 0)) return (b.bonus || 0) - (a.bonus || 0);
    return (b.total || 0) - (a.total || 0);
  })[0];

  const average = getAverageFortuneScore(actionable);
  const spread = Math.max(0, (strongest?.total || 0) - (weakest?.total || 0));
  const totalBonus = actionable.reduce((sum, score) => sum + (score?.bonus || 0), 0);
  const isRecovery = (weakest?.total || 0) <= 46;
  const isBalanced = spread <= 10;
  const focusAxis = (booster?.bonus || 0) > 0 ? booster : strongest;
  const focusTheme = PICK_THEME[focusAxis?.key] || PICK_THEME.wealth;
  const careTheme = PICK_THEME[weakest?.key] || PICK_THEME.health;
  const backupTheme = PICK_THEME[backup?.key] || focusTheme;
  const boosterTheme = PICK_THEME[booster?.key] || focusTheme;
  const hasMomentum = (focusAxis?.bonus || 0) > 0 || (strongest?.total || 0) >= 78;
  const preferFallbackFields = Boolean(fallback) && !isRecovery && !hasMomentum && spread <= 14;
  const seed = createPickSeed(actionable);

  const derived = {
    food: isRecovery
      ? getPoolValue(careTheme.food, seed, 1)
      : getPoolValue([...careTheme.food, ...backupTheme.food], seed, 1),
    place: hasMomentum
      ? getPoolValue(focusTheme.place, seed, 3)
      : getPoolValue([...focusTheme.place, ...backupTheme.place], seed, 3),
    color: getPoolValue([...careTheme.color, ...focusTheme.color], seed, 5),
    item: getPoolValue((booster?.bonus || 0) > 0 ? boosterTheme.item : focusTheme.item, seed, 7),
    number: String((((average * 3) + ((focusAxis?.total || 0) * 2) + (weakest?.total || 0) + totalBonus + spread) % 45) + 1),
    direction: getPoolValue(focusTheme.direction, seed, 11),
    communication: getPoolValue(
      (isRecovery || weakest?.key === 'social' || weakest?.key === 'love')
        ? careTheme.communication
        : [...careTheme.communication, ...backupTheme.communication],
      seed,
      13,
    ),
    action: getPoolValue(
      isRecovery
        ? careTheme.action
        : ((booster?.bonus || 0) > 0 ? boosterTheme.action : [...focusTheme.action, ...careTheme.action]),
      seed,
      17,
    ),
  };

  const mergedFields = PICK_FIELDS.reduce((acc, field) => ({
    ...acc,
    [field]: mergePickField(field, derived[field], fallback?.[field], preferFallbackFields),
  }), {});

  const focusLabel = getAxisLabel(focusAxis);
  const careLabel = getAxisLabel(weakest);
  const boostLabel = (booster?.bonus || 0) > 0 ? getAxisLabel(booster) : '';
  const badge = (focusAxis?.bonus || 0) > 0
    ? '부스트 반영'
    : (isRecovery ? '보강 우선' : (isBalanced ? '밸런스 유지' : '상승 집중'));
  const strategyLabel = (focusAxis?.bonus || 0) > 0
    ? `${focusLabel} 탄력 유지`
    : (isRecovery ? `${careLabel} 회복 우선` : (isBalanced ? '균형 유지 모드' : `${focusLabel} 드라이브`));
  const summary = (focusAxis?.bonus || 0) > 0
    ? `${focusLabel}에 실린 부스트를 유지하면서 ${careLabel}의 마찰을 줄이는 조합이에요.`
    : (isRecovery
      ? `${careLabel} 회복을 먼저 챙기고, ${focusLabel}의 흐름은 끊기지 않게 잇는 조합이에요.`
      : (isBalanced
        ? `${focusLabel}과 ${careLabel}의 간격이 크지 않아 전체 리듬을 매끈하게 다듬는 조합이에요.`
        : `${focusLabel}의 추진력을 밀고 ${careLabel}의 긴장을 눌러주는 조합이에요.`));
  const reason = (focusAxis?.bonus || 0) > 0
    ? `장소와 아이템은 ${boostLabel || focusLabel}의 상승세에 맞추고, 음식과 소통, 행동은 ${careLabel} 쪽 피로를 낮추도록 골랐어요.`
    : `장소와 아이템은 ${focusLabel} 쪽 힘을 밀고, 음식과 소통, 행동은 ${careLabel} 쪽 균형을 회복하도록 골랐어요.`;

  return {
    ...mergedFields,
    summary: preferFallbackFields && fallback?.summary ? fallback.summary : summary,
    reason,
    badge,
    strategyLabel,
    blendTitle: `${focusLabel} 드라이브 x ${careLabel} 밸런스`,
    focusKey: focusAxis?.key || '',
    focusLabel,
    careKey: weakest?.key || '',
    careLabel,
    boostKey: (booster?.bonus || 0) > 0 ? booster.key : null,
    boostLabel,
    average,
    scoreSpread: clamp(spread, 0, 100),
    aiHint: fallback?.summary || '',
  };
}
