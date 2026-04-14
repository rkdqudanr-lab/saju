/**
 * synergyLogic.js
 * 익명 랜선 궁합 시너지 점수 계산기 (가벼운 운세용)
 */

// 오행 생극 요소 점수 보정용 매핑
const ILGAN_ELEMENTS = {
  '갑(甲)': '목', '을(乙)': '목',
  '병(丙)': '화', '정(丁)': '화',
  '무(戊)': '토', '기(己)': '토',
  '경(庚)': '금', '신(辛)': '금',
  '임(壬)': '수', '계(癸)': '수',
};

// 원소별 상생 (좋음)
const HARMONY = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목', // 내가 생해줌 (순조로움)
};

const SYNERGY_KEYWORDS = [
  "서로를 밀어주는 폭발적 시너지!",
  "같이 있으면 마음이 편안해지는 조합",
  "티키타카가 완벽해요!",
  "운명의 장난처럼 끌리는 사이",
  "다를수록 더 매력적인 조합",
  "환상의 호흡을 자랑합니다",
  "같이 밥 먹으면 입맛이 도는 사이",
  "어딘가 모르게 자꾸 신경 쓰이는 조합",
  "대화가 끝없이 이어질 것 같아요"
];

// 문자열 해시 (항상 같은 결과를 위해)
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function calculateAnonSynergy(meIlgan, meSign, otherIlgan, otherSign) {
  // 기준 데이터가 아예 없으면 기본 50
  if (!meIlgan && !meSign) return { score: 50, keyword: "평범하지만 편안한 사이" };
  if (!otherIlgan && !otherSign) return { score: 50, keyword: "비밀에 싸인 유저네요!" };

  // 조합 해시
  const combineStr = `${meIlgan || ''}-${meSign || ''}-${otherIlgan || ''}-${otherSign || ''}`;
  const h = hashString(combineStr);

  // 기본 베이스 점수 (60 ~ 95 무작위성 배치)
  let score = 60 + (h % 36); 

  // 일간 소속 오행이 상생이면 보너스
  const meEl = ILGAN_ELEMENTS[meIlgan];
  const otherEl = ILGAN_ELEMENTS[otherIlgan];
  if (meEl && otherEl) {
    if (HARMONY[meEl] === otherEl || HARMONY[otherEl] === meEl) {
      score = Math.min(100, score + 12);
    } else if (meEl === otherEl) {
      score = Math.min(100, score + 8);
    }
  }

  // 별자리 같은 원소(불, 불)나 상호 보완적(불, 공기)인 경우 (간단 로직은 생략하고 운의 다채로움을 위해 해시 유지)
  
  // 가끔 나오는 대박 점수 보정 (99, 100)
  if (h % 10 === 0) {
    score = 99;
  } else if (h % 23 === 0) {
    score = 100;
  }

  const keyword = SYNERGY_KEYWORDS[h % SYNERGY_KEYWORDS.length];

  return {
    score,
    keyword
  };
}
