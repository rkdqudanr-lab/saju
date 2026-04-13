// 일진 테스트: node test-iljin.mjs
import { getMonthJijiIndex } from './lib/jeolgi.js';
import { getSaju } from './src/utils/saju.js';
// 2026년 3월 19일 일진 확인

const CG = ["갑","을","병","정","무","기","경","신","임","계"];
const JJ = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const CGH = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JJH = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CGO = ["목","목","화","화","토","토","금","금","수","수"];

const GAPJA_60 = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥',
];

const ILGAN_ENERGY = { 갑:5,을:4,병:4,정:3,무:3,기:2,경:2,신:1,임:2,계:1 };

function getDailyInfo(date) {
  const y = date.getFullYear(), m = date.getMonth()+1, d = date.getDate();
  // 만세력 기준 에포크 보정: 1900-01-01 실제 일진 = 甲戌(index 10), +10 오프셋 적용
  // Date.UTC: Asia/Seoul LMT(+8:27:52) 역사적 오프셋 32분 오차 제거
  const df = Math.round((Date.UTC(y,m-1,d) - Date.UTC(1900,0,1)) / 86400000) + 10;
  const ig = (df % 10 + 10) % 10;
  const ij = (df % 12 + 12) % 12;
  const idx60 = ((df % 60) + 60) % 60;
  return {
    iljin: GAPJA_60[idx60],
    cheongan: CG[ig],
    jiji: JJ[ij],
    ohaeng: CGO[ig],
    energy: ILGAN_ENERGY[CG[ig]] || 3,
  };
}

// 테스트 날짜들
const testDates = [
  new Date(1900, 0, 1),   // 1900-01-01 → 甲子(갑자) 기대
  new Date(2026, 2, 19),  // 2026-03-19 → ?
  new Date(2026, 0, 1),   // 2026-01-01
  new Date(2025, 11, 31), // 2025-12-31
];

for (const date of testDates) {
  const info = getDailyInfo(date);
  console.log(`${date.toISOString().slice(0,10)}: ${info.iljin} (${info.cheongan}${info.jiji}) | 오행:${info.ohaeng} | 에너지:${info.energy}`);
}

// 기대값 검증
const ref = getDailyInfo(new Date(1900, 0, 1));
console.log('\n=== 검증 ===');
// 만세력 기준: 1900-01-01 = 甲戌 (과거 코드의 甲子 가정은 오류였음)
console.log(`1900-01-01 일진: ${ref.iljin} (기대: 甲戌) → ${ref.iljin === '甲戌' ? '✅ 정확' : '❌ 오류'}`);

// 만세력 교차 검증: 1991-08-31 = 癸酉
const test1991 = getDailyInfo(new Date(1991, 7, 31));
console.log(`1991-08-31 일진: ${test1991.iljin} (기대: 癸酉) → ${test1991.iljin === '癸酉' ? '✅ 정확' : '❌ 오류'}`);

// 1991-09-08 (백로 당일) 일진 확인
const test1991Sep8 = getDailyInfo(new Date(1991, 8, 8));
console.log(`1991-09-08 일진: ${test1991Sep8.iljin} (${test1991Sep8.cheongan}${test1991Sep8.jiji})`);

const mar19 = getDailyInfo(new Date(2026, 2, 19));
console.log(`2026-03-19 일진: ${mar19.iljin} (${mar19.cheongan}${mar19.jiji}) | 오행: ${mar19.ohaeng} | 에너지: ${mar19.energy}`);

// ═══════════════════════════════════════════════════════════
// 월주(월지) 검증 — getMonthJijiIndex() 10개 케이스
// JJ = ["자","축","인","묘","진","사","오","미","신","유","술","해"]
// 입춘 2025: 2025-02-03 22:10 KST
// 소한 2025: 2025-01-05 04:32 KST  (JEOLGI_TABLE[2024][11])
// 입춘 2026: 2026-02-04 03:57 KST
// ═══════════════════════════════════════════════════════════
console.log('\n=== 월주(월지) 검증 ===');

const wjCases = [
  // [label, y, m, d, h, min, expected지지]
  // ── 입춘 2025 경계 ──
  ['①입춘전날  2025-02-02 12:00', 2025, 2, 2, 12,  0, '축'],  // 입춘(2/3 22:10) 이전 → 축월
  ['②입춘당일전 2025-02-03 12:00', 2025, 2, 3, 12,  0, '축'],  // 절기 시각 이전 → 축월
  ['③입춘당일후 2025-02-03 23:00', 2025, 2, 3, 23,  0, '인'],  // 절기(22:10) 이후 → 인월
  ['④입춘다음날 2025-02-04 12:00', 2025, 2, 4, 12,  0, '인'],  // 이미 인월
  // ── 소한 2025 경계 (1월 — 버그1 검증) ──
  ['⑤소한전날  2025-01-04 12:00', 2025, 1, 4, 12,  0, '자'],  // 소한(1/5 04:32) 이전 → 자월
  ['⑥소한당일전 2025-01-05 04:00', 2025, 1, 5,  4,  0, '자'],  // 절기 시각(04:32) 이전 → 자월
  ['⑦소한당일후 2025-01-05 05:00', 2025, 1, 5,  5,  0, '축'],  // 절기 이후 → 축월
  ['⑧소한다음날 2025-01-06 12:00', 2025, 1, 6, 12,  0, '축'],  // 축월
  // ── 입춘 2026 분(min) 경계 — 버그2 검증 ──
  ['⑨입춘직전  2026-02-04 03:56', 2026, 2, 4,  3, 56, '축'],  // 03:57 직전 → 축월
  ['⑩입춘직후  2026-02-04 03:58', 2026, 2, 4,  3, 58, '인'],  // 03:57 직후 → 인월
];

let wjPass = 0, wjFail = 0;
for (const [label, y, m, d, h, min, expected] of wjCases) {
  const idx = getMonthJijiIndex(y, m, d, h, min);
  const got = JJ[idx];
  const ok = got === expected;
  console.log(`${ok ? '✅' : '❌'} ${label} → ${got}월 (기대: ${expected}월)`);
  if (ok) wjPass++; else wjFail++;
}
console.log(`\n월주 검증: ${wjPass}/10 통과${wjFail > 0 ? ` (실패 ${wjFail}개)` : ''}`);

// ═══════════════════════════════════════════════════════════
// getSaju 4기둥(사주 원국) 통합 검증
// 기준: 1991년 8월 31일 오전 09:30 (양력, KST)
// 정확한 원국: 辛未년 · 丙申월 · 癸酉일 · 丁巳시
// ─────────────────────────────────────────────────────────
// [검증 포인트]
// 1. 월주(月柱): 입추(8/8경) 이후 · 백로(9/8경) 이전 → 반드시 丙申月
// 2. 일주(日柱): KST 기준 1991-08-31 일진 → 반드시 癸酉日 (하루 밀림 없음)
// 3. 시주(時柱): 일간 癸(계) + 사시(09~11시) → 오호둔시법 → 반드시 丁巳時
// ═══════════════════════════════════════════════════════════
console.log('\n=== 4기둥(사주 원국) 통합 검증: 1991-08-31 09:30 KST ===');
const saju1991 = getSaju(1991, 8, 31, 9, 30);
const expected4 = { yeon: '辛未', wol: '丙申', il: '癸酉', si: '丁巳' };
const got4 = {
  yeon: saju1991.yeon.gh + saju1991.yeon.jh,
  wol:  saju1991.wol.gh  + saju1991.wol.jh,
  il:   saju1991.il.gh   + saju1991.il.jh,
  si:   saju1991.si.gh   + saju1991.si.jh,
};
const labels4 = { yeon: '연주(年柱)', wol: '월주(月柱)', il: '일주(日柱)', si: '시주(時柱)' };
let allPass4 = true;
for (const [k, exp] of Object.entries(expected4)) {
  const g = got4[k];
  const ok = g === exp;
  if (!ok) allPass4 = false;
  console.log(`${ok ? '✅' : '❌'} ${labels4[k]}: ${g} (기대: ${exp})`);
}
console.log(allPass4
  ? '\n✅ 1991-08-31 09:30 사주 4기둥 완전 일치 — 辛未 丙申 癸酉 丁巳'
  : '\n❌ 4기둥 불일치 발생 — 위 항목 확인 필요');
