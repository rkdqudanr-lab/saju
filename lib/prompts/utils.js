import { solarToLunar } from "./lunar.js";

const JEOLGI = ["소한","대한","입춘","우수","경칩","춘분","청명","곡우","입하","소만","망종","하지","소서","대서","입추","처서","백로","추분","한로","상강","입동","소설","대설","동지"];

// ── 오늘의 일진(日辰) 계산 — 60甲子 순환 ──
// 기준일: 2000-01-01 = 甲戌日 (천간 index 0=갑, 지지 index 10=술)
const _GANS = ['갑','을','병','정','무','기','경','신','임','계'];
const _JIS  = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const _GAN_EL = { '갑':'목','을':'목','병':'화','정':'화','무':'토','기':'토','경':'금','신':'금','임':'수','계':'수' };
const _EL_DESC = { 목:'추진·시작하기 좋은 날', 화:'표현·활발하게 나서기 좋은 날', 토:'신중하게 기다리기 좋은 날', 금:'결단·마무리하기 좋은 날', 수:'직관을 믿고 조용히 준비하기 좋은 날' };

export function getTodayIlchin(y, m, d) {
  const ref   = new Date(Date.UTC(2000, 0, 1)); // 갑술일 기준 (UTC 고정)
  const today = new Date(Date.UTC(y, m - 1, d));
  const diff  = Math.round((today - ref) / 86400000);
  const gan   = _GANS[((0 + diff) % 10 + 10) % 10];
  const ji    = _JIS [((10 + diff) % 12 + 12) % 12];
  const el    = _GAN_EL[gan];
  return { gan, ji, text: `${gan}${ji}일`, element: el, desc: _EL_DESC[el] };
}

// ── 향후 7일 날짜 목록 (AI가 구체적 날짜로 언급하도록) ──
const _DAYS = ['일','월','화','수','목','금','토'];

export function getUpcomingDates(y, m, d) {
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(Date.UTC(y, m - 1, d + i + 1));
    return `${dt.getUTCMonth()+1}월 ${dt.getUTCDate()}일 (${_DAYS[dt.getUTCDay()]}요일)`;
  }).join(', ');
}

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

  const ilchin       = getTodayIlchin(y, m, d);
  const upcomingDates = getUpcomingDates(y, m, d);
  return { solar: `${y}년 ${m}월 ${d}일 (${week}요일)`, lunar: lunarStr, jeolgi, y, m, d, h, timeSlot, ilchin, upcomingDates };
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
━━━ 응답 스타일: 분석형(T) — 공감 없음, 원인→근거→해결 순서 ━━━
T형의 핵심: 공감·위로·감정 공명 표현 전면 금지. 오직 원인 진단 → 사주·별자리 근거 → 구체적 해결책 순서로만.
① 핵심 제언 첫 문장: "지금 [X] 상황이 나타나는 이유는 [Y] 기질이 강해지는 시기이기 때문이에요" 형식으로 원인부터. '힘드셨겠어요' '충분히 이해해요' 등 공감 표현 절대 금지.
② 사주·별자리 근거: "이 기질이 [X] 결과를 만들어요" 형식. 감정 묘사 없이 조건과 결과만.
③ 행동 제안: 언제·무엇을·어떻게 포함. 날짜·횟수·금액 등 수치 포함.
④ "다 잘 될 거예요" 등 막연한 위로·격려 전면 금지. 시적 비유 전면 금지.
⑤ 문장 끝: "~해요" "~이에요" "~됩니다" — 단호하고 간결하게.
[F형 전용 구조 오버라이드 없음 — 핵심 제언 첫 문장은 반드시 원인·결론·수치로 시작]`;
  }
  if (responseStyle === 'F') {
    return `
━━━ 응답 스타일: 공감형(F) — 공감 먼저, 이후 원인→해결 순서 ━━━
F형의 핵심: 첫 문장은 반드시 감정 공감. 이후 원인 → 해결 순서. T형과 내용은 같되 공감 유무가 차이.
① 핵심 제언 첫 문장 오버라이드: 위 응답 필수 구조의 "첫 문장은 반드시 결론·수치·날짜로" 규칙은 F형에서 적용하지 않습니다. 대신 반드시 감정 공감 문장으로 시작: "많이 [X]하셨겠어요", "그 마음 충분히 이해해요", "오늘 [X] 상황이 힘드셨을 것 같아요" — 오늘 사용자의 구체적 상황과 연결된 공감.
② 두 번째 문장부터: "그 이유는 지금 [X] 기질이 강해지는 시기라서예요" 형식으로 원인 설명.
③ 사주·별자리는 이 상황을 이해하는 맥락으로. 추상 묘사 금지.
④ 행동 제안 딱 하나. "~해봐도 좋을 것 같아요" 또는 "~해보는 건 어때요" 형식.
⑤ 마무리: "잘 될 거예요" 대신 "지금 [X]하는 게 맞는 방향이에요" 처럼 근거 있는 응원.
⑥ '포근한' '따스한' '별빛이' '흙처럼' '불꽃처럼' 등 시적 표현 절대 금지.`;
  }
  // 'M' - 균형형
  return `
━━━ 응답 스타일: 균형형(M) — 결론 먼저, 공감은 마무리에 ━━━
① 두괄식: 첫 문단에 핵심 제언·수치·날짜 먼저. 감정 공감은 마무리에 한 문장.
② 사주·별자리는 제언의 근거로 — 행동·성향 중심으로 설명. 자연 비유 금지.
③ 행동 제안 1가지 — 시간, 날짜, 금액, 횟수 등 수치 포함.
④ '섬세한' '그대의 별빛이' '이 별빛은' '포근한' '따스한' '신비롭게' '~처럼' 절대 금지.`;
}

// 결정형(YES/NO) 질문 감지: "~갈까?", "~할까?", "~해도 될까?" 등
// 주의: "어때요?" / "어떨까?" 단독은 감정 표현 오탐 → 동사 앞 문맥 필요
export function isDecisionQuestion(userMessage) {
  // 명확한 YES/NO 결정 요청 패턴만 허용
  return /갈까|할까|해도\s*(될까|괜찮을까|좋을까)|말할까|연락할까|시작할까|해야\s*(할까|하나)|가야\s*(할까|하나)|사도\s*(될까|괜찮을까)|만날까|헤어질까|바꿀까|그만할까|참을까|말해야\s*할까|해도\s*될까|가도\s*될까/.test(userMessage);
}
