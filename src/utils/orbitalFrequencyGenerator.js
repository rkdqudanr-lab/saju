/**
 * orbitalFrequencyGenerator.js
 * 사주 기반 일일 행운 번호 생성 및 검증 로직
 */

/**
 * 심플 해시 함수: 문자열을 숫자로 변환
 * @param {string} str - 입력 문자열
 * @returns {number} 해시값
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 오늘의 행운 번호 6자리 생성
 * @param {string} kakaoId - 사용자 카카오 ID
 * @param {string} dateStr - 날짜 문자열 (YYYY-MM-DD)
 * @returns {string} 6자리 행운 번호 (예: "123456")
 */
export function generateDailyLuckyNumber(kakaoId, dateStr) {
  // 시드 생성: kakaoId + 날짜
  const seed = `${kakaoId}:${dateStr}`;
  const baseHash = simpleHash(seed);

  // 6개 숫자 생성
  const digits = [];
  for (let i = 0; i < 6; i++) {
    const hash = simpleHash(`${seed}:${i}`);
    // 0-9 사이의 숫자 생성
    const digit = (hash % 10);
    digits.push(digit.toString());
  }

  return digits.join('');
}

/**
 * 오늘의 행운 번호에 3개는 열려있고 3개는 잠겨있는 상태로 변환
 * @param {string} luckyNumber - 6자리 행운 번호
 * @returns {Object} { visible: "123---", locked: [3,4,5] }
 */
export function initializeLockedState(luckyNumber) {
  // 처음 3개만 표시, 나머지는 잠금
  const visible = luckyNumber.slice(0, 3) + '---';
  const locked = [3, 4, 5]; // 잠금 위치 인덱스

  return { visible, locked };
}

/**
 * 사용자의 추측 번호와 실제 번호를 비교해서 일치도와 보상 계산
 * @param {string} guess - 사용자 입력 (6자리, _ 포함 가능)
 * @param {string} lucky - 실제 행운 번호
 * @param {number[]} locked - 현재 잠금된 위치 배열
 * @returns {Object} { matchCount, matchPercent, bpReward, isCorrect }
 */
export function validateOrbitalGuess(guess, lucky, locked = []) {
  // 유효성 검사
  if (!guess || guess.length !== 6) {
    return {
      matchCount: 0,
      matchPercent: 0,
      bpReward: 0,
      isCorrect: false,
      error: '6자리 숫자를 입력해야 합니다',
    };
  }

  // 모두 숫자인지 확인 (잠금 해제된 부분만)
  let validInput = true;
  for (let i = 0; i < 6; i++) {
    if (!locked.includes(i) && (guess[i] < '0' || guess[i] > '9')) {
      validInput = false;
      break;
    }
  }

  if (!validInput) {
    return {
      matchCount: 0,
      matchPercent: 0,
      bpReward: 0,
      isCorrect: false,
      error: '0-9 사이의 숫자만 입력 가능합니다',
    };
  }

  // 일치도 계산 (잠금된 부분은 무시)
  let matchCount = 0;
  const checkablePositions = [];

  for (let i = 0; i < 6; i++) {
    if (!locked.includes(i)) {
      checkablePositions.push(i);
      if (guess[i] === lucky[i]) {
        matchCount++;
      }
    }
  }

  const totalCheckable = checkablePositions.length;
  const matchPercent = totalCheckable > 0 ? Math.round((matchCount / totalCheckable) * 100) : 0;
  const isCorrect = matchPercent === 100 && totalCheckable === 6;

  // BP 보상 계산
  let bpReward = 0;
  if (matchCount >= 4) {
    bpReward = 40; // 4-5개 일치
  } else if (matchCount >= 2) {
    bpReward = 15; // 2-3개 일치
  }

  if (isCorrect) {
    bpReward = 200; // 완벽 일치 (모든 6자리)
  }

  return {
    matchCount,
    matchPercent,
    bpReward,
    isCorrect,
  };
}

/**
 * 일일 시드 기반으로 오늘의 숫자를 가져오거나 새로 생성
 * @param {string} kakaoId - 사용자 카카오 ID
 * @param {Date} date - 기준 날짜
 * @returns {string} 6자리 행운 번호
 */
export function getTodaysLuckyNumber(kakaoId, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return generateDailyLuckyNumber(kakaoId, dateStr);
}

/**
 * 보상 메시지 생성
 * @param {number} bpReward - 받은 BP
 * @param {boolean} isCorrect - 완벽 일치 여부
 * @returns {string} 축하 메시지
 */
export function getRewardMessage(bpReward, isCorrect) {
  if (isCorrect) {
    return '✦ 완벽한 일치! 운의 선택자가 되셨어요!';
  }
  if (bpReward === 40) {
    return '✦ 훌륭해요! 별이 당신을 도왔어요!';
  }
  if (bpReward === 15) {
    return '✦ 좋아요! 별숨이 반응했어요!';
  }
  return '☽ 내일 다시 도전해보세요!';
}
