import { solarToLunar } from "./lunar.js";

const JEOLGI = ["소한","대한","입춘","우수","경칩","춘분","청명","곡우","입하","소만","망종","하지","소서","대서","입추","처서","백로","추분","한로","상강","입동","소설","대설","동지"];

export function getTodayStr() {
  const now  = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const h = now.getHours();
  const week   = ["일","월","화","수","목","금","토"][now.getDay()];
  const jeolgi = JEOLGI[((m - 1) * 2 + (d > 20 ? 1 : 0)) % 24];
  const { lm, ld, isLeap } = solarToLunar(y, m, d);
  const lunarStr = `음력 ${isLeap ? '윤' : ''}${lm}월 ${ld}일`;

  let timeSlot = 'afternoon';
  if (h >= 5  && h < 11) timeSlot = 'morning';
  else if (h >= 11 && h < 18) timeSlot = 'afternoon';
  else if (h >= 18 && h < 24) timeSlot = 'evening';
  else timeSlot = 'dawn';

  return { solar: `${y}년 ${m}월 ${d}일 (${week}요일)`, lunar: lunarStr, jeolgi, y, m, d, h, timeSlot };
}

export function getSeasonDesc(m) {
  if (m === 12 || m === 1)  return "한겨울의 한복판, 찬바람이 볼을 스치는 시기예요.";
  if (m === 2)              return "아직 바람은 차지만 발끝 어딘가에서 봄기운이 슬그머니 밀려오는 시기예요.";
  if (m === 3)              return "눈이 녹고 땅이 깨어나는 초봄이에요.";
  if (m === 4)              return "꽃이 피고 바람이 따뜻해지는 봄의 한가운데예요.";
  if (m === 5)              return "연두빛이 짙어지고 하늘이 높아지는 늦봄이에요.";
  if (m === 6)              return "여름이 문을 두드리는 시기예요.";
  if (m === 7)              return "한여름의 한복판, 뜨거운 태양 아래 모든 것이 선명하게 드러나는 시기예요.";
  if (m === 8)              return "더위가 절정을 지나 조금씩 수그러드는 시기예요.";
  if (m === 9)              return "선선한 바람이 불어오는 초가을이에요.";
  if (m === 10)             return "단풍이 물들고 하늘이 높아지는 깊은 가을이에요.";
  if (m === 11)             return "가을이 저물고 겨울의 문턱에 선 시기예요.";
  return "";
}

export function getTimeHorizon(userMessage) {
  if (/오늘|지금|이 순간|당장/.test(userMessage))      return "오늘 하루 범위로 구체적으로";
  if (/이번 주|이번주|이번 며칠/.test(userMessage))     return "이번 주 범위로";
  if (/이번 달|이번달|이달/.test(userMessage))          return "이번 달 범위로";
  if (/올해|이번 년/.test(userMessage))                 return "올해 범위로";
  return "가장 가까운 시일 (1~2주) 범위로";
}

/**
 * 별숨 스타일 지침 반환
 * @param {'T'|'M'|'F'} responseStyle
 * @returns {string}
 */
export function getStyleInstruction(responseStyle) {
  if (responseStyle === 'T') {
    return `
━━━ 응답 스타일: 분석형 ━━━
이 사람은 논리적이고 구체적인 분석을 원해요.
① 감정 공감은 딱 한 문장만. 나머지는 전부 분석과 인사이트로 채워요.
② "왜 지금 이런 상황인지", "어떻게 하면 달라지는지"를 명확하게 짚어줘요.
③ 사주·별자리 데이터를 근거로 제시하되, 논리적 흐름이 보여야 해요.
④ "다 잘 될 거예요" 같은 추상적 위로 금지. 구체적 행동과 타이밍으로 마무리.
⑤ 문장은 간결하고 직접적으로. 감성적 수식어 남발 금지.`;
  }
  if (responseStyle === 'F') {
    return `
━━━ 응답 스타일: 공감형 ━━━
이 사람은 분석보다 따뜻한 공감과 위로를 원해요.
① 첫 문단은 반드시 이 사람의 감정을 충분히 인정하고 공감하는 내용으로 시작해요.
② "지금 많이 힘드셨겠어요", "그럴 수 있어요", "충분히 그럴 만해요" 같은 공감 언어를 자연스럽게 녹여요.
③ 별과 사주 해석은 분석 도구가 아니라 따뜻한 위로의 언어로 써요. 별빛이 이 사람 편이라는 느낌으로.
④ 행동 제안은 딱 하나만, "~해봐도 좋을 것 같아요" 처럼 강요 없이 부드럽게.
⑤ 마지막 문장은 반드시 위로와 응원으로 마무리해요. "잘 하고 있어요", "곁에 있을게요" 같은 느낌으로.`;
  }
  // 'M' - 균형형
  return `
━━━ 응답 스타일: 균형형 ━━━
분석과 공감을 균형 있게 담아요.
① 먼저 이 사람의 감정이나 상황을 한 문장으로 인정해요.
② 사주·별자리 해석은 "왜 그런지" 근거를 보여주되, 따뜻한 언어로.
③ 실용적인 행동 제안 1가지를 부드럽게 권해요.
④ 차갑게 분석만 하거나, 막연하게 위로만 하는 것 둘 다 피해요.`;
}

// 결정형(YES/NO) 질문 감지: "~갈까?", "~할까?", "~해도 될까?" 등
export function isDecisionQuestion(userMessage) {
  return /갈까|할까|해도\s*(될까|괜찮을까|좋을까)|말할까|연락할까|시작할까|어떨까|어때[요?]|해야\s*(할까|하나)|가야\s*(할까|하나)|사도\s*(될까|괜찮을까)|만날까|헤어질까|바꿀까|그만할까|참을까|말해야|해도\s*돼|가도\s*돼/.test(userMessage);
}
