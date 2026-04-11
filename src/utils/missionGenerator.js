/**
 * 미션 생성기
 * AI 응답 텍스트에서 색상, 음식, 라이프 아이템을 추출하여 미션 객체로 변환
 */

// ════════════════════════════════════════════════════════════════
// 함수: AI 응답에서 미션 생성
// ════════════════════════════════════════════════════════════════
/**
 * 운세 텍스트에서 색상, 음식, 라이프 아이템을 추출하여 미션 배열로 변환
 *
 * @param {string} horoscopeText - AI 응답 텍스트
 * @returns {Array} 미션 객체 배열
 *
 * 미션 객체 형태:
 * {
 *   type: 'color' | 'menu' | 'item',
 *   content: '파란색 옷 입기',
 *   originalValue: '파란색',
 *   bpReward: 10
 * }
 */
export function generateMissionsFromHoroscope(horoscopeText) {
  const missions = [];

  // ─────────────────────────────────────────────────────────────
  // 1. 색상 추출
  // 현재 AI 응답 포맷: "색: 하늘색 — 사주·별자리 근거."
  //   또는 구형 포맷: "오늘의 색: 파란색"
  // ─────────────────────────────────────────────────────────────
  const colorPatterns = [
    /^색[:\s]+([^—\-\n]+?)(?:\s*[—\-]|\n|$)/im,    // 신형: 색: 하늘색 — 이유
    /^컬러[:\s]+([^—\-\n]+?)(?:\s*[—\-]|\n|$)/im,  // 신형(서양): 컬러: 민트그린 — 이유
    /오늘의 색[:\s]+([가-힣0-9a-zA-Z\s]+?)(?:\n|$)/i,
    /색상[:\s]+([가-힣0-9a-zA-Z\s]+?)(?:\n|$)/i,
  ];

  let colorMatch = null;
  for (const pattern of colorPatterns) {
    const match = horoscopeText.match(pattern);
    if (match) {
      colorMatch = match;
      break;
    }
  }

  if (colorMatch) {
    const color = colorMatch[1].trim().split(/[,\n]/)[0].trim();
    if (color && color.length > 0 && color.length < 20) {
      missions.push({
        type: 'color',
        content: `${color} 옷이나 소품 사용하기`,
        originalValue: color,
        bpReward: 10,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. 음식 추출
  // 현재 AI 응답 포맷: "음식: 한식 + 안 매운 것 + 밥 ▶ 된장찌개 — 이유"
  //   → ▶ 뒤 구체적 메뉴명을 추출
  // 구형 포맷: "오늘의 음식: 김치찌개"
  // ─────────────────────────────────────────────────────────────
  const foodPatterns = [
    /^음식:[^\n]*?▶\s*([^—\-\n]+?)(?:\s*[—\-]|\n|$)/im,  // 신형: ▶ 뒤 메뉴명
    /오늘의 음식[:\s]+([가-힣0-9a-zA-Z\s]+?)(?:\n|$)/i,
    /음식[:\s]+([가-힣0-9a-zA-Z\s]+?)(?:\n|$)/i,
  ];

  let foodMatch = null;
  for (const pattern of foodPatterns) {
    const match = horoscopeText.match(pattern);
    if (match) {
      foodMatch = match;
      break;
    }
  }

  if (foodMatch) {
    const food = foodMatch[1].trim().split(/[,\n]/)[0].trim();
    if (food && food.length > 0 && food.length < 30) {
      missions.push({
        type: 'menu',
        content: `${food} 먹기`,
        originalValue: food,
        bpReward: 10,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. 장소/라이프 아이템 추출
  // 현재 AI 응답 포맷: "장소: 조용한 독립서점 — 이유"
  // 구형 포맷: "해도 좋은 것", "행운의 아이템" 등
  // ─────────────────────────────────────────────────────────────
  const itemPatterns = [
    /^장소[:\s]+([^—\-\n]+?)(?:\s*[—\-]|\n|$)/im,  // 신형: 장소: 카페 — 이유
    /해도 좋은 것[^\n]*\n([^\n]+)/i,
    /행운의 아이템[:\s]+([^\n]+)/i,
    /오늘의 아이템[:\s]+([^\n]+)/i,
    /라이프 아이템[:\s]+([^\n]+)/i,
  ];

  let itemMatch = null;
  let isPlace = false;
  for (let i = 0; i < itemPatterns.length; i++) {
    const match = horoscopeText.match(itemPatterns[i]);
    if (match) {
      itemMatch = match;
      isPlace = i === 0; // 첫 번째 패턴이 장소 패턴
      break;
    }
  }

  if (itemMatch) {
    const item = itemMatch[1].trim().split(/[,\n]/)[0].trim();
    const itemContent = isPlace
      ? `${item} 방문하기`
      : (item.endsWith('하기') ? item : `${item}하기`);
    if (item && item.length > 0 && item.length < 30) {
      missions.push({
        type: 'item',
        content: itemContent,
        originalValue: item,
        bpReward: 10,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. DO 실천 미션 추출 (5 BP)
  // ─────────────────────────────────────────────────────────────
  const doPatterns = [
    /^DO:\s*(.+)/im,
    /^✅\s*(.+)/im,
  ];

  let doMatch = null;
  for (const pattern of doPatterns) {
    const match = horoscopeText.match(pattern);
    if (match) { doMatch = match; break; }
  }

  if (doMatch) {
    const doContent = doMatch[1].trim().split(/[,\n]/)[0].trim();
    if (doContent && doContent.length > 0 && doContent.length < 60) {
      missions.push({
        type: 'do',
        content: doContent,
        originalValue: doContent,
        bpReward: 5,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. DONT 주의 미션 추출 (5 BP)
  // ─────────────────────────────────────────────────────────────
  const dontPatterns = [
    /^DON'?T:\s*(.+)/im,
    /^❌\s*(.+)/im,
  ];

  let dontMatch = null;
  for (const pattern of dontPatterns) {
    const match = horoscopeText.match(pattern);
    if (match) { dontMatch = match; break; }
  }

  if (dontMatch) {
    const dontContent = dontMatch[1].trim().split(/[,\n]/)[0].trim();
    if (dontContent && dontContent.length > 0 && dontContent.length < 60) {
      missions.push({
        type: 'dont',
        content: dontContent,
        originalValue: dontContent,
        bpReward: 5,
      });
    }
  }

  // 최대 5개 미션까지 반환 (color/menu/item + do/dont)
  return missions.slice(0, 5);
}

// ════════════════════════════════════════════════════════════════
// 함수: 배드타임 생성
// ════════════════════════════════════════════════════════════════
/**
 * 운세 텍스트와 점수에서 배드타임 객체 생성
 *
 * @param {string} horoscopeText - AI 응답 텍스트
 * @param {number} score - 운세 점수 (0~100)
 * @returns {Object|null} 배드타임 객체 또는 null
 *
 * 배드타임 객체:
 * {
 *   detected: true,
 *   score: 45,
 *   symptom: '불안감',
 *   originalCaution: '빠른 판단 주의',
 *   cost: 20
 * }
 */
export function generateBadtimeFromHoroscope(horoscopeText, score) {
  // 점수 50 이상이면 배드타임 없음
  if (score >= 50) {
    return null;
  }

  // "조심할 것" 섹션 추출
  const cautionPatterns = [
    /조심할 것[^\n]*\n([^\n]+)/i,
    /⚠️\s*([^\n]+)/i,
    /주의[:\s]+([^\n]+)/i,
  ];

  let cautionMatch = null;
  for (const pattern of cautionPatterns) {
    const match = horoscopeText.match(pattern);
    if (match) {
      cautionMatch = match;
      break;
    }
  }

  if (!cautionMatch) {
    // 기본값 사용
    return {
      detected: true,
      score,
      symptom: '부정적 기운',
      originalCaution: '주의 필요',
      cost: 20,
    };
  }

  const caution = cautionMatch[1].trim();

  // "감" 또는 "함" 같은 키워드로 단어 추출
  // 예: "불안감 주의" → "불안감"
  const symptomMatch = caution.match(/([가-힣0-9]+감|[가-힣0-9]+함|[가-힣0-9a-zA-Z\s]+)/);
  const symptom = symptomMatch ? symptomMatch[1].trim().substring(0, 20) : '부정적 기운';

  return {
    detected: true,
    score,
    symptom,
    originalCaution: caution.substring(0, 50), // 최대 50자
    cost: 20,
  };
}

// ════════════════════════════════════════════════════════════════
// 함수: 오늘의 운세 요약 추출
// ════════════════════════════════════════════════════════════════
/**
 * AI 응답에서 [점수]와 [요약] 섹션 추출
 *
 * @param {string} horoscopeText - AI 응답 텍스트
 * @returns {Object} { score: number, summary: string }
 */
export function extractHoroscopeScore(horoscopeText) {
  // [점수] 패턴: [점수] 65, [점수] 65/100, [점수] 65 점 등
  const scorePattern = /\[점수\][^\d]*(\d+)/i;
  const scoreMatch = horoscopeText.match(scorePattern);

  let score = 50; // 기본값
  if (scoreMatch) {
    score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));
  }

  // [요약] 패턴
  const summaryPattern = /\[요약\][^\n]*\n?([^\n]+)/i;
  const summaryMatch = horoscopeText.match(summaryPattern);

  let summary = '오늘 하루의 운세입니다';
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  return { score, summary };
}

// ════════════════════════════════════════════════════════════════
// 함수: 럭키 타임 추출
// ════════════════════════════════════════════════════════════════
/**
 * AI 응답에서 럭키 타임 정보 추출
 *
 * @param {string} horoscopeText - AI 응답 텍스트
 * @returns {Object|null} { timeSlot: '오전 10-12시', action: '...' } 또는 null
 */
export function extractLuckyTime(horoscopeText) {
  // 럭키 타임 패턴들
  const patterns = [
    /럭키타임[^\n]*\n([^\n]+)\n?([^\n]*)/i,
    /럭키 타임[^\n]*\n([^\n]+)\n?([^\n]*)/i,
    /행운의 시간[^\n]*\n([^\n]+)\n?([^\n]*)/i,
  ];

  for (const pattern of patterns) {
    const match = horoscopeText.match(pattern);
    if (match) {
      return {
        timeSlot: match[1].trim().substring(0, 30),
        action: match[2]?.trim() || '좋은 일을 시작하세요',
      };
    }
  }

  return null;
}

// ════════════════════════════════════════════════════════════════
// 함수: 사주/별자리 근거 추출
// ════════════════════════════════════════════════════════════════
/**
 * AI 응답에서 사주와 별자리 근거 추출
 *
 * @param {string} horoscopeText - AI 응답 텍스트
 * @returns {Object} { sajuReason: string, astrologyReason: string }
 */
export function extractReasons(horoscopeText) {
  const sajuMatch = horoscopeText.match(/🀄([^\n]+)/);
  const astrologyMatch = horoscopeText.match(/✦([^\n]+)/);

  return {
    sajuReason: sajuMatch ? sajuMatch[1].trim() : '',
    astrologyReason: astrologyMatch ? astrologyMatch[1].trim() : '',
  };
}

// ════════════════════════════════════════════════════════════════
// 함수: 한 줄 비책 추출
// ════════════════════════════════════════────────────────────────
/**
 * AI 응답의 마지막 한 줄 비책 추출
 *
 * @param {string} horoscopeText - AI 응답 텍스트
 * @returns {string} 한 줄 비책 (또는 마지막 문단)
 */
export function extractClosingAdvice(horoscopeText) {
  // 마지막 문단을 추출 (마지막 빈 줄 기준)
  const lines = horoscopeText.split('\n').filter(line => line.trim());
  const lastLines = lines.slice(-2); // 마지막 2줄

  // "📍", "⏰" 등 이모지가 있는 줄 찾기
  const adviceLine = lastLines.find(line => /📍|⏰|✨|🌟/.test(line));

  return adviceLine || lastLines[lastLines.length - 1] || '오늘 하루 화이팅!';
}

// ════════════════════════════════════════════════════════════════
// 통합 함수: 운세 전체 파싱
// ════════════════════════════════════════════════════════════════
/**
 * AI 응답을 완전히 파싱하여 게이미피케이션 데이터 추출
 *
 * @param {string} horoscopeText - AI 응답 텍스트
 * @returns {Object} 파싱된 게이미피케이션 데이터
 */
export function parseHoroscopeForGamification(horoscopeText) {
  const { score, summary } = extractHoroscopeScore(horoscopeText);
  const missions = generateMissionsFromHoroscope(horoscopeText);
  const badtime = generateBadtimeFromHoroscope(horoscopeText, score);
  const luckyTime = extractLuckyTime(horoscopeText);
  const { sajuReason, astrologyReason } = extractReasons(horoscopeText);
  const closingAdvice = extractClosingAdvice(horoscopeText);

  return {
    score,
    summary,
    missions,
    badtime,
    luckyTime,
    sajuReason,
    astrologyReason,
    closingAdvice,
  };
}

export default {
  generateMissionsFromHoroscope,
  generateBadtimeFromHoroscope,
  extractHoroscopeScore,
  extractLuckyTime,
  extractReasons,
  extractClosingAdvice,
  parseHoroscopeForGamification,
};
