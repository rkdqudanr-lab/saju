/**
 * 게이미피케이션 시스템 - 상수 및 유틸 함수
 * BP 시스템, 레벨 시스템, 배드타임 감지 로직
 */

// ════════════════════════════════════════════════════════════════
// BP 획득 규칙
// ════════════════════════════════════════════════════════════════
export const BP_EARNING_RULES = {
  DAILY_LOGIN: 5,         // 일일 출석
  MISSION_COMPLETE: 10,   // 미션 완료
  FRIEND_SHARE: 3,        // 친구 공유
};

// ════════════════════════════════════════════════════════════════
// 배드타임 액막이 비용
// ════════════════════════════════════════════════════════════════
export const BADTIME_BLOCK_COST = {
  DEFAULT: 20,            // 기본 비용
  MULTIPLE: 30,           // 다중 배드타임
};

// ════════════════════════════════════════════════════════════════
// Guardian Level (1~5) 승격 조건
// ════════════════════════════════════════════════════════════════
export const GUARDIAN_LEVEL_THRESHOLDS = {
  1: { missions: 0, badtimes: 0, streak: 0, label: '초급 액막이사' },
  2: { missions: 15, badtimes: 5, streak: 7, label: '중급 액막이사' },
  3: { missions: 30, badtimes: 10, streak: 14, label: '고급 액막이사' },
  4: { missions: 50, badtimes: 20, streak: 21, label: '마스터 액막이사' },
  5: { missions: 100, badtimes: 50, streak: 30, label: '별숨의 수호자' },
};

// ════════════════════════════════════════════════════════════════
// 레벨별 무료 BP 충전량 (1회/일)
// ════════════════════════════════════════════════════════════════
export const FREE_BP_RECHARGE = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 30,
};

// ════════════════════════════════════════════════════════════════
// 레벨별 액막이 효율도 (배드타임 감지 시 표시)
// ════════════════════════════════════════════════════════════════
export const GUARDIAN_LEVEL_EFFECTS = {
  1: '100%',
  2: '110%',
  3: '120%',
  4: '130%',
  5: '150%',
};

// ════════════════════════════════════════════════════════════════
// 배드타임 감지 기준 (점수 50 미만)
// ════════════════════════════════════════════════════════════════
export const BADTIME_THRESHOLD = 50;

// ════════════════════════════════════════════════════════════════
// 손실 회피 심리 메시지
// ════════════════════════════════════════════════════════════════
export const LOSS_AVERSION_MESSAGES = {
  BADTIME_DETECTED: '악운 시간대가 감지됐어요. 액막이를 발동하시겠어요?',
  NO_BP: 'BP가 부족합니다. 무료 충전을 기다리거나 미션을 완료해주세요.',
  MISSED_MISSION: '오늘의 미션을 완료하지 않으면 내일 BP 획득이 어려워져요.',
  LEVEL_DOWN_WARNING: '로그인 스트릭이 끊기면 레벨 유지에 영향을 줄 수 있어요.',
};

// ════════════════════════════════════════════════════════════════
// 함수: 배드타임 감지
// ════════════════════════════════════════════════════════════════
/**
 * AI 응답에서 배드타임 여부를 판단
 * @param {number} score - 운세 점수 (0~100)
 * @param {string} horoscopeText - AI 응답 텍스트
 * @returns {Object|null} 배드타임 객체 또는 null
 *
 * 배드타임 객체:
 * { detected: true, cost: 20, symptom: '...' }
 */
export function detectBadtime(score, horoscopeText = '') {
  // 점수 50 이상이면 배드타임 없음
  if (score >= BADTIME_THRESHOLD) {
    return null;
  }

  // "조심할 것" 섹션 추출 (또는 "⚠️" "주의" 등 키워드)
  const cautionMatch = horoscopeText.match(/조심할 것[^\n]*\n([^\n]+)/i) ||
                       horoscopeText.match(/⚠️[^\n]+/) ||
                       horoscopeText.match(/주의[:\s]+([^\n]+)/i);

  const symptom = cautionMatch ? cautionMatch[1]?.trim() || cautionMatch[0] : '부정적 기운';

  return {
    detected: true,
    cost: BADTIME_BLOCK_COST.DEFAULT,
    symptom: symptom.substring(0, 30), // 최대 30자
    reward: '악운을 피할 수 있어요 🛡️',
  };
}

// ════════════════════════════════════════════════════════════════
// 함수: 레벨 승격 조건 계산
// ════════════════════════════════════════════════════════════════
/**
 * 현재 수치로 도달 가능한 최대 레벨 계산
 * @param {number} totalMissions - 누적 미션 완료 수
 * @param {number} badtimeBlocks - 누적 배드타임 액막이 수
 * @param {number} longestStreak - 최대 로그인 스트릭
 * @returns {number} 달성 가능한 최대 레벨 (1~5)
 */
export function calculateLevelPromotion(totalMissions, badtimeBlocks, longestStreak) {
  let maxLevel = 1;

  // 역순 검사: Lv5 → Lv1
  for (let level = 5; level >= 1; level--) {
    const threshold = GUARDIAN_LEVEL_THRESHOLDS[level];
    if (
      totalMissions >= threshold.missions &&
      badtimeBlocks >= threshold.badtimes &&
      longestStreak >= threshold.streak
    ) {
      maxLevel = level;
      break;
    }
  }

  return maxLevel;
}

// ════════════════════════════════════════════════════════════════
// 함수: 레벨 텍스트 포맷
// ════════════════════════════════════════════════════════════════
/**
 * 레벨 번호를 텍스트로 변환
 * @param {number} level - 레벨 (1~5)
 * @returns {string} 레벨 라벨
 */
export function formatGuardianLevelText(level) {
  return GUARDIAN_LEVEL_THRESHOLDS[level]?.label || '초급 액막이사';
}

// ════════════════════════════════════════════════════════════════
// 함수: 다음 레벨 진행률 계산
// ════════════════════════════════════════════════════════════════
/**
 * 다음 레벨까지 남은 미션/배드타임/스트릭 수
 * @param {number} currentLevel - 현재 레벨
 * @param {number} totalMissions - 누적 미션
 * @param {number} badtimeBlocks - 누적 배드타임
 * @param {number} longestStreak - 최대 스트릭
 * @returns {Object} { nextLevel, missionProgress, badtimeProgress, streakProgress }
 */
export function calculateLevelProgress(currentLevel, totalMissions, badtimeBlocks, longestStreak) {
  const nextLevel = currentLevel + 1;

  if (nextLevel > 5) {
    // 최대 레벨 도달
    return {
      nextLevel: 5,
      missionProgress: { current: totalMissions, required: GUARDIAN_LEVEL_THRESHOLDS[5].missions, remaining: 0 },
      badtimeProgress: { current: badtimeBlocks, required: GUARDIAN_LEVEL_THRESHOLDS[5].badtimes, remaining: 0 },
      streakProgress: { current: longestStreak, required: GUARDIAN_LEVEL_THRESHOLDS[5].streak, remaining: 0 },
      isMaxLevel: true,
    };
  }

  const nextThreshold = GUARDIAN_LEVEL_THRESHOLDS[nextLevel];

  return {
    nextLevel,
    missionProgress: {
      current: totalMissions,
      required: nextThreshold.missions,
      remaining: Math.max(0, nextThreshold.missions - totalMissions),
    },
    badtimeProgress: {
      current: badtimeBlocks,
      required: nextThreshold.badtimes,
      remaining: Math.max(0, nextThreshold.badtimes - badtimeBlocks),
    },
    streakProgress: {
      current: longestStreak,
      required: nextThreshold.streak,
      remaining: Math.max(0, nextThreshold.streak - longestStreak),
    },
    isMaxLevel: false,
  };
}

// ════════════════════════════════════════════════════════════════
// 함수: 로그인 스트릭 업데이트 로직
// ════════════════════════════════════════════════════════════════
/**
 * 마지막 로그인 날짜를 기준으로 스트릭 계산
 * @param {string} lastLoginDateStr - YYYY-MM-DD 형식
 * @returns {Object} { newStreak, bpGain, isFirstLoginToday }
 */
export function calculateLoginStreak(lastLoginDateStr) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  if (!lastLoginDateStr) {
    // 첫 로그인
    return { newStreak: 1, bpGain: BP_EARNING_RULES.DAILY_LOGIN, isFirstLoginToday: true };
  }

  if (lastLoginDateStr === todayStr) {
    // 오늘 이미 로그인함
    return { newStreak: -1, bpGain: 0, isFirstLoginToday: false };
  }

  // 어제와 비교
  const lastDate = new Date(lastLoginDateStr + 'T00:00:00Z');
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const isConsecutive = lastLoginDateStr === yesterdayStr;

  return {
    newStreak: isConsecutive ? -1 : 1, // -1은 DB에서 업데이트할 값 (increment 필요)
    bpGain: BP_EARNING_RULES.DAILY_LOGIN,
    isFirstLoginToday: true,
    isConsecutiveDay: isConsecutive,
  };
}

// ════════════════════════════════════════════════════════════════
// 함수: BP 게이지 색상 결정
// ════════════════════════════════════════════════════════════════
/**
 * 현재 BP와 최대 BP를 바탕으로 게이지 색상 결정
 * @param {number} currentBp - 현재 BP
 * @param {number} level - 현재 레벨
 * @returns {string} CSS 색상 (hex 또는 rgb)
 */
export function getBPGaugeColor(currentBp, level) {
  const levelColors = {
    1: '#4A8EC4', // 수(파란색)
    2: '#5FAD7A', // 목(초록색)
    3: '#C08830', // 토(갈색)
    4: '#E05A3A', // 화(빨간색)
    5: '#B8A035', // 금(금색)
  };

  return levelColors[level] || '#4A8EC4';
}

// ════════════════════════════════════════════════════════════════
// 함수: 미션 타입별 설명
// ════════════════════════════════════════════════════════════════
export const MISSION_TYPE_LABELS = {
  color: { label: '색상 처방', emoji: '🎨' },
  menu: { label: '음식 처방', emoji: '🍽️' },
  item: { label: '라이프 아이템', emoji: '🌿' },
};

/**
 * 미션 타입을 라벨 + 이모지로 변환
 * @param {string} type - mission_type ('color' | 'menu' | 'item')
 * @returns {Object} { label, emoji }
 */
export function getMissionTypeLabel(type) {
  return MISSION_TYPE_LABELS[type] || { label: '미션', emoji: '✨' };
}

// ════════════════════════════════════════════════════════════════
// 함수: 액막이 후 변환된 운명 메시지 생성
// ════════════════════════════════════════════════════════════════
/**
 * 배드타임 증상 → 긍정적 운명으로 변환
 * @param {string} badtimeSymptom - 배드타임 증상 (예: '불안감')
 * @returns {string} 변환된 운명 메시지
 */
export function generateTransformedFortuneMessage(badtimeSymptom) {
  const transformations = {
    '불안감': '안정감',
    '혼란': '명확함',
    '갈등': '조화',
    '실수': '정확함',
    '지연': '신속함',
    '손실': '이득',
    '외로움': '연결',
    '피로': '활기',
  };

  const positive = transformations[badtimeSymptom] || '긍정적 기운';
  return `별숨이 ${badtimeSymptom}을(를) ${positive}으로 바꿨어요 ✨`;
}

// ════════════════════════════════════════════════════════════════
// 함수: 손실 회피 심리 강화 메시지
// ════════════════════════════════════════════════════════════════
/**
 * 배드타임 감지 시 사용자의 행동을 유도하는 메시지
 * @param {number} score - 운세 점수
 * @param {number} currentBp - 현재 BP
 * @returns {string} 유도 메시지
 */
export function generateLossAversionMessage(score, currentBp) {
  if (score < 30) {
    return '⚠️ 심각한 악운이 감지되었어요. 지금 액막이를 발동하세요!';
  }
  if (score < BADTIME_THRESHOLD) {
    if (currentBp >= BADTIME_BLOCK_COST.DEFAULT) {
      return '⚠️ 악운이 감지되었어요. 액막이로 운명을 바꿀 수 있습니다.';
    }
    return '⚠️ 악운이 감지되었어요. BP를 충전하고 액막이를 발동하세요.';
  }
  return '✨ 오늘은 모든 시간이 안전해요!';
}

export default {
  BP_EARNING_RULES,
  BADTIME_BLOCK_COST,
  GUARDIAN_LEVEL_THRESHOLDS,
  FREE_BP_RECHARGE,
  BADTIME_THRESHOLD,
  LOSS_AVERSION_MESSAGES,
  detectBadtime,
  calculateLevelPromotion,
  formatGuardianLevelText,
  calculateLevelProgress,
  calculateLoginStreak,
  getBPGaugeColor,
  getMissionTypeLabel,
  generateTransformedFortuneMessage,
  generateLossAversionMessage,
};
