import { solarToLunar } from "./lunar.js";

const JEOLGI = ["소한","대한","입춘","우수","경칩","춘분","청명","곡우","입하","소만","망종","하지","소서","대서","입추","처서","백로","추분","한로","상강","입동","소설","대설","동지"];

export function getTodayStr(clientHour) {
  const now = new Date();
  // 한국 표준시(KST = UTC+9) 기준 날짜 계산
  // Vercel 서버는 UTC로 동작하므로 +9시간 오프셋 적용
  // getUTCFullYear/Month/Date를 사용해 이중 offset 방지
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + KST_OFFSET);
  const y = kst.getUTCFullYear(), m = kst.getUTCMonth() + 1, d = kst.getUTCDate();
  const h = (typeof clientHour === 'number' && clientHour >= 0 && clientHour <= 23)
    ? clientHour
    : kst.getUTCHours(); // KST 시간 fallback (UTC 대신)
  const week   = ["일","월","화","수","목","금","토"][kst.getUTCDay()]; // KST 요일
  const jeolgi = JEOLGI[((m - 1) * 2 + (d > 20 ? 1 : 0)) % 24];
  const { lm, ld, isLeap } = solarToLunar(y, m, d);
  const lunarStr = `음력 ${isLeap ? '윤' : ''}${lm}월 ${ld}일`;

  // 시간 슬롯 — src/utils/time.js getTimeSlot()과 동일한 경계값 유지
  // dawn: 0~4시 / morning: 5~11시 / afternoon: 12~17시 / evening: 18~23시
  let timeSlot;
  if (h >= 5  && h < 12) timeSlot = 'morning';
  else if (h >= 12 && h < 18) timeSlot = 'afternoon';
  else if (h >= 18) timeSlot = 'evening';
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
  if (/오늘|지금|이 순간|당장|지금 당장/.test(userMessage))         return "오늘 하루 범위로 구체적으로";
  if (/이번\s*주|이번\s*며칠|며칠\s*(안에|내로|내)|이번\s*주말/.test(userMessage)) return "이번 주 범위로";
  if (/이번\s*달|이달|이번\s*월/.test(userMessage))                  return "이번 달 범위로";
  if (/올해|이번\s*년|올 한 해|연말/.test(userMessage))              return "올해 범위로";
  if (/곧|빨리|빠른\s*시일|가까운\s*시일/.test(userMessage))         return "가장 가까운 시일 (1~2주) 범위로";
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
① 핵심 결론·수치·날짜를 맨 앞(첫 문단)에. 감정 공감은 생략하거나 한 문장 이하로.
② "왜 지금 이런 상황인지", "어떻게 하면 달라지는지"를 수치로 명확하게 짚어줘요.
③ 사주·별자리 데이터는 결론 뒤의 근거로 제시해요. 논리적 흐름이 보여야 해요.
④ "다 잘 될 거예요" 같은 추상적 위로 금지. 날짜·확률·금액·기간으로 구체적으로 마무리.
⑤ 문장은 간결하고 직접적으로. 감성적 수식어 최소화.`;
  }
  if (responseStyle === 'F') {
    return `
━━━ 응답 스타일: 공감형 ━━━
이 사람은 따뜻한 공감과 위로를 원해요. 두괄식 원칙은 유지하되, 수치보다 방향이 먼저예요.
① [요약]과 첫 문단에 핵심 방향을 짚되, 따뜻하게 표현해요.
② "지금 많이 힘드셨겠어요", "그럴 수 있어요" 같은 공감 언어를 자연스럽게 녹여요.
③ 별과 사주 해석은 따뜻한 위로의 언어로. 별빛이 이 사람 편이라는 느낌으로.
④ 행동 제안은 딱 하나만, "~해봐도 좋을 것 같아요" 처럼 강요 없이 부드럽게.
⑤ 마지막 문장은 반드시 위로와 응원으로 마무리해요.`;
  }
  // 'M' - 균형형
  return `
━━━ 응답 스타일: 균형형 ━━━
분석과 공감을 균형 있게 담아요. 핵심 제언 먼저, 공감은 마무리에.
① 첫 문단에 핵심 제언과 수치·날짜를 먼저. 감정 공감은 뒤에.
② 사주·별자리 해석은 제언의 근거로, 따뜻한 언어로.
③ 실용적인 행동 제안 1가지 — 시간, 날짜, 금액, 확률 등 수치를 포함해요.
④ 차갑게 분석만 하거나, 막연하게 위로만 하는 것 둘 다 피해요.`;
}

// 결정형(YES/NO) 질문 감지: "~갈까?", "~할까?", "~해도 될까?" 등
// 주의: "어때요?" / "어떨까?" 단독은 감정 표현 오탐 → 동사 앞 문맥 필요
export function isDecisionQuestion(userMessage) {
  // 명확한 YES/NO 결정 요청 패턴만 허용
  return /갈까|할까|해도\s*(될까|괜찮을까|좋을까)|말할까|연락할까|시작할까|해야\s*(할까|하나)|가야\s*(할까|하나)|사도\s*(될까|괜찮을까)|만날까|헤어질까|바꿀까|그만할까|참을까|말해야\s*할까|해도\s*될까|가도\s*될까/.test(userMessage);
}
