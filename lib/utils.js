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
