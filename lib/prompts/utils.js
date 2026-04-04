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
① 두괄식: 핵심 결론·수치·날짜 맨 앞. 감정 공감 한 문장 이하.
② "왜 지금"과 "어떻게 달라지는지"를 수치로 명확히.
③ 사주·별자리는 결론 뒤 근거로.
④ "다 잘 될 거예요" 같은 막연한 위로 금지.
⑤ 간결하고 직접적인 문장. '섬세한' '별빛이' '포근한' 절대 금지.`;
  }
  if (responseStyle === 'F') {
    return `
━━━ 응답 스타일: 공감형 ━━━
① 두괄식 유지: [요약]·첫 문단에 핵심 방향 먼저.
② 공감 언어: "지금 많이 힘드셨겠어요", "그럴 수 있어요" — 단, '별빛이' '포근한' '따스한' 금지.
③ 사주·별자리는 이 사람 편이라는 느낌으로 따뜻하게. 단, 모호한 시적 수사 없이.
④ 행동 제안 딱 하나. "~해봐도 좋을 것 같아요" 형식.
⑤ 마지막은 위로·응원으로.`;
  }
  // 'M' - 균형형
  return `
━━━ 응답 스타일: 균형형 ━━━
① 두괄식: 첫 문단에 핵심 제언·수치·날짜 먼저. 감정 공감은 마무리에.
② 사주·별자리는 제언의 근거로.
③ 행동 제안 1가지 — 시간, 날짜, 금액, 횟수 등 수치 포함.
④ '섬세한' '그대의 별빛이' '이 별빛은' '포근한' '따스한' '신비롭게' 절대 금지.`;
}

// 결정형(YES/NO) 질문 감지: "~갈까?", "~할까?", "~해도 될까?" 등
// 주의: "어때요?" / "어떨까?" 단독은 감정 표현 오탐 → 동사 앞 문맥 필요
export function isDecisionQuestion(userMessage) {
  // 명확한 YES/NO 결정 요청 패턴만 허용
  return /갈까|할까|해도\s*(될까|괜찮을까|좋을까)|말할까|연락할까|시작할까|해야\s*(할까|하나)|가야\s*(할까|하나)|사도\s*(될까|괜찮을까)|만날까|헤어질까|바꿀까|그만할까|참을까|말해야\s*할까|해도\s*될까|가도\s*될까/.test(userMessage);
}
