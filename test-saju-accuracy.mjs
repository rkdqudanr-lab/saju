/**
 * 사주 정확도 종합 테스트
 * node test-saju-accuracy.mjs
 *
 * 기준값 출처:
 *  [A] 만세력 검증 / 수식 직접 계산 (에포크 1900-01-01=甲戌)
 *  [B] JEOLGI_TABLE 절기 데이터 기반 경계 계산
 *  [C] KASI 음양력 서비스 (https://astro.kasi.re.kr) 대조 필요 항목
 *  [D] 포스텔러 등 검증된 만세력 앱 교차 확인 필요 항목
 *
 * [C][D] 표시 항목은 KASI 또는 포스텔러 결과와 대조 후 기준값을 최종 확정해야 함.
 */

import { getSaju, getDailyInfo } from './src/utils/saju.js';
import { solarToLunar, lunarToSolar } from './lib/lunarCalendar.js';

// ─── 유틸리티 ───────────────────────────────────────────────
let pass = 0, fail = 0;

function eq(label, got, expected) {
  // 객체의 경우 expected의 키만 검사 (got에 추가 필드가 있어도 무시)
  let ok;
  if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
    ok = Object.keys(expected).every(k => JSON.stringify(got?.[k]) === JSON.stringify(expected[k]));
  } else {
    ok = JSON.stringify(got) === JSON.stringify(expected);
  }
  if (ok) { pass++; console.log(`  ✅ ${label}`); }
  else    { fail++; console.log(`  ❌ ${label}\n     got:      ${JSON.stringify(got)}\n     expected: ${JSON.stringify(expected)}`); }
}

function saju4(y, m, d, h, min = 0) {
  const s = getSaju(y, m, d, h, min);
  if (!s) return null;
  return {
    yeon: s.yeon.gh + s.yeon.jh,
    wol:  s.wol.gh  + s.wol.jh,
    il:   s.il.gh   + s.il.jh,
    si:   s.si.gh   + s.si.jh,
  };
}

// ─── 1. 에포크 일관성: getSaju ↔ getDailyInfo ────────────────
console.log('\n══ 1. 일주 에포크 일관성 ══');
// getDailyInfo와 getSaju 일주(日柱)가 같은 에포크를 써야 함 [A]
{
  const cases = [
    [1900, 1, 1], [1991, 8, 31], [2000, 1, 1],
    [2025, 1, 1], [2025, 7, 25], [2026, 5, 11],
  ];
  for (const [y, m, d] of cases) {
    const di = getDailyInfo(new Date(y, m - 1, d));
    const sj = getSaju(y, m, d, 12);
    eq(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} 일주 일치`,
       di.cheongan + di.jiji, sj.il.g + sj.il.j);
  }
}

// ─── 2. 에포크 절대값 검증 ──────────────────────────────────
console.log('\n══ 2. 에포크 절대값 ══');
// 1900-01-01 = 甲戌 [A: 만세력 에포크 기준]
eq('1900-01-01 일진 = 甲戌', getDailyInfo(new Date(1900, 0, 1)).iljin, '甲戌');
// 1991-08-31 = 癸酉 [A: 만세력 교차 검증]
eq('1991-08-31 일진 = 癸酉', getDailyInfo(new Date(1991, 7, 31)).iljin, '癸酉');
// 2025-01-01 = 庚午 [A: 수식 계산]
eq('2025-01-01 일진 = 庚午', getDailyInfo(new Date(2025, 0, 1)).iljin, '庚午');

// ─── 3. 입춘 기준 연주/월주 경계 ────────────────────────────
console.log('\n══ 3. 입춘 기준 연주/월주 경계 ══');
// 입춘 2025 = 2월 3일 22:10 KST [B: JEOLGI_TABLE[2025][0]]

// 입춘 1분 전: 甲辰년 丁丑월 [B]
eq('2025-02-03 22:09 연주 = 甲辰', saju4(2025,2,3,22,9).yeon, '甲辰');
eq('2025-02-03 22:09 월주 = 丁丑', saju4(2025,2,3,22,9).wol,  '丁丑');
// 입춘 1분 후: 乙巳년 戊寅월 [B]
eq('2025-02-03 22:11 연주 = 乙巳', saju4(2025,2,3,22,11).yeon, '乙巳');
eq('2025-02-03 22:11 월주 = 戊寅', saju4(2025,2,3,22,11).wol,  '戊寅');
// 같은 날 같은 시각 → 일주는 동일
eq('2025-02-03 22:09/11 일주 동일', saju4(2025,2,3,22,9).il, saju4(2025,2,3,22,11).il);

// 입춘 2024 = 2월 4일 16:27 KST [B: JEOLGI_TABLE[2024][0]]
eq('2024-02-04 16:26 연주 = 癸卯', saju4(2024,2,4,16,26).yeon, '癸卯');
eq('2024-02-04 16:28 연주 = 甲辰', saju4(2024,2,4,16,28).yeon, '甲辰');
eq('2024-02-04 16:26 월주 = 乙丑', saju4(2024,2,4,16,26).wol,  '乙丑');
eq('2024-02-04 16:28 월주 = 丙寅', saju4(2024,2,4,16,28).wol,  '丙寅');

// ─── 4. 1월 연주 불변성 (1930~2040 전체) ────────────────────
console.log('\n══ 4. 1월 연주 불변성: 1930~2040 ══');
// 1월은 입춘 이전이므로 반드시 전년도 연주를 써야 함 [A: 입춘은 항상 2월]
const CG = ['갑','을','병','정','무','기','경','신','임','계'];
const JJ = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
let yearInvFail = 0;
for (let y = 1930; y <= 2040; y++) {
  const s = getSaju(y, 1, 15, 12);
  if (!s) { yearInvFail++; continue; }
  const expectedYg = ((y - 1 - 4) % 10 + 10) % 10;
  const expectedYj = ((y - 1 - 4) % 12 + 12) % 12;
  const expected = CG[expectedYg] + JJ[expectedYj] + '년';
  const got = s.yeon.g + s.yeon.j + '년';
  if (got !== expected) {
    console.log(`  ❌ ${y}-01-15 연주 got=${got} expected=${expected}`);
    yearInvFail++;
  }
}
if (yearInvFail === 0) {
  pass++; console.log(`  ✅ 1930~2040 전체 1월 연주 전년도 기준 정상 (${2040-1930+1}개년)`);
} else {
  fail++;
}

// ─── 5. 3월 이후 연주 불변성 (입춘 이후 확인) ───────────────
console.log('\n══ 5. 3월 이후 연주 불변성 ══');
// 3월은 항상 입춘 이후 → 해당 연도 연주 사용 [A]
let march_fail = 0;
for (let y = 1930; y <= 2040; y++) {
  const s = getSaju(y, 7, 15, 12);
  if (!s) { march_fail++; continue; }
  const expectedYg = ((y - 4) % 10 + 10) % 10;
  const expectedYj = ((y - 4) % 12 + 12) % 12;
  const got = s.yeon.g + s.yeon.j;
  const expected = CG[expectedYg] + JJ[expectedYj];
  if (got !== expected) { march_fail++; }
}
if (march_fail === 0) {
  pass++; console.log(`  ✅ 1930~2040 전체 7월 연주 당해년도 기준 정상`);
} else {
  fail++; console.log(`  ❌ 7월 연주 오류 ${march_fail}건`);
}

// ─── 6. 소한 월주 경계 ──────────────────────────────────────
console.log('\n══ 6. 소한 월주 경계 ══');
// 소한 2025 = 1월 5일 04:32 KST [B: JEOLGI_TABLE[2024][11]]
eq('2025-01-05 04:31 월주 = 丙子', saju4(2025,1,5,4,31).wol, '丙子'); // 소한 前 → 자월
eq('2025-01-05 04:33 월주 = 丁丑', saju4(2025,1,5,4,33).wol, '丁丑'); // 소한 後 → 축월
eq('2025-01-01 12:00 월주 = 丙子', saju4(2025,1,1,12,0).wol,  '丙子'); // 소한 전 1월 초 → 자월

// 소한 2026 = 1월 5일 10:22 KST [B: JEOLGI_TABLE[2025][11]]
// 2026년 1월은 _yBase=2025(乙巳,yg=1) → 자월 wg=戊, 축월 wg=己
eq('2026-01-05 10:21 월주 = 戊子', saju4(2026,1,5,10,21).wol, '戊子');
eq('2026-01-05 10:23 월주 = 己丑', saju4(2026,1,5,10,23).wol, '己丑');

// ─── 7. 자시(子時) 경계: 23:00 = 다음날 자시 ────────────────
console.log('\n══ 7. 자시(子時) 경계 ══');
// 23:00은 사주상 다음날 자시 → 일주가 다음날과 같아야 함 [A]
const s_jan1_23 = saju4(2025, 1, 1, 23);
const s_jan2_0  = saju4(2025, 1, 2, 0);
eq('2025-01-01 23:00 일주 = 2025-01-02 00:00 일주', s_jan1_23.il, s_jan2_0.il);
// 2025-01-02 일간=辛(ig=7), 자시(si=0): 오호둔시법 辛일 子시 = 戊子 [A]
eq('2025-01-01 23:00 시주 = 戊子', s_jan1_23.si, '戊子');

// ─── 8. 알려진 사주 원국 종합 검증 ─────────────────────────
console.log('\n══ 8. 알려진 사주 원국 ══');
// 1991-08-31 09:30 → 辛未 丙申 癸酉 丁巳 [A: 만세력 표준 검증치]
eq('1991-08-31 09:30', saju4(1991,8,31,9,30), { yeon:'辛未', wol:'丙申', il:'癸酉', si:'丁巳' });

// 2025-01-01 12:00 → 甲辰 丙子 庚午 壬午 [A: 수식 계산]
eq('2025-01-01 12:00', saju4(2025,1,1,12,0),  { yeon:'甲辰', wol:'丙子', il:'庚午', si:'壬午' });

// 입춘 직전·직후 [B]
eq('2025-02-03 22:09', saju4(2025,2,3,22,9),  { yeon:'甲辰', wol:'丁丑', il:'癸卯', si:'癸亥' });
eq('2025-02-03 22:11', saju4(2025,2,3,22,11), { yeon:'乙巳', wol:'戊寅', il:'癸卯', si:'癸亥' });
eq('2024-02-04 16:26', saju4(2024,2,4,16,26), { yeon:'癸卯', wol:'乙丑', il:'戊戌', si:'庚申' });
eq('2024-02-04 16:28', saju4(2024,2,4,16,28), { yeon:'甲辰', wol:'丙寅', il:'戊戌', si:'庚申' });

// 소한 경계 [B]
eq('2025-01-05 04:31', saju4(2025,1,5,4,31),  { yeon:'甲辰', wol:'丙子', il:'甲戌', si:'丙寅' });
eq('2025-01-05 04:33', saju4(2025,1,5,4,33),  { yeon:'甲辰', wol:'丁丑', il:'甲戌', si:'丙寅' });

// TODO [C][D]: 아래 기준값은 KASI/포스텔러와 대조 필요
// eq('1930-01-01 12:00', saju4(1930,1,1,12,0), { yeon:'己巳', wol:'丙子', il:'辛亥', si:'壬午' });

// ─── 9. LUNAR_TABLE solarToLunar 검증 ───────────────────────
console.log('\n══ 9. solarToLunar ══');
// 2025년 기준점 [C: KASI 기준 — 양력 날짜는 천문연 확인 필요]
eq('2025-01-29 = 음력 1월 1일',   solarToLunar(2025,1,29),  { lm:1,  ld:1,  isLeap:false, supported:true });
eq('2025-02-27 = 음력 1월 30일',  solarToLunar(2025,2,27),  { lm:1,  ld:30, isLeap:false, supported:true });
eq('2025-02-28 = 음력 2월 1일',   solarToLunar(2025,2,28),  { lm:2,  ld:1,  isLeap:false, supported:true });

// 윤6월 경계 [C: 핵심 — 기존 버그 수정 검증]
eq('2025-07-25 = 음력 윤6월 1일', solarToLunar(2025,7,25),  { lm:6,  ld:1,  isLeap:true,  supported:true });
eq('2025-08-22 = 음력 윤6월 29일',solarToLunar(2025,8,22),  { lm:6,  ld:29, isLeap:true,  supported:true });
// 기존 버그: 이 날짜가 윤6월 30일로 잘못 표시됐었음
eq('2025-08-23 = 음력 7월 1일',   solarToLunar(2025,8,23),  { lm:7,  ld:1,  isLeap:false, supported:true });
eq('2025-09-20 = 음력 7월 29일',  solarToLunar(2025,9,20),  { lm:7,  ld:29, isLeap:false, supported:true });
eq('2025-09-21 = 음력 8월 1일',   solarToLunar(2025,9,21),  { lm:8,  ld:1,  isLeap:false, supported:true });
eq('2025-10-21 = 음력 9월 1일',   solarToLunar(2025,10,21), { lm:9,  ld:1,  isLeap:false, supported:true });
eq('2025-11-19 = 음력 9월 30일',  solarToLunar(2025,11,19), { lm:9,  ld:30, isLeap:false, supported:true });
eq('2025-11-20 = 음력 10월 1일',  solarToLunar(2025,11,20), { lm:10, ld:1,  isLeap:false, supported:true });

// 2021년 윤4월: 4월=29일(i=3,cumul=117), 윤4월 1일=Feb12+117=Jun9 [B: LUNAR_TABLE 역산]
eq('2021-06-09 = 음력 윤4월 1일', solarToLunar(2021,6,9),   { lm:4,  ld:1,  isLeap:true,  lunarYear:2021, supported:true });
// 2023년 윤2월 [C: KASI 확인 필요]
eq('2023-03-22 = 음력 윤2월 1일', solarToLunar(2023,3,22),  { lm:2,  ld:1,  isLeap:true,  lunarYear:2023, supported:true });

// 신년 첫날 — 이전 버그: [y-1,y] 순서 때문에 전년도 12월로 잘못 반환됐었음
eq('2022-02-01 = 음력 1월 1일',   solarToLunar(2022,2,1),   { lm:1,  ld:1,  isLeap:false, lunarYear:2022, supported:true });

// 범위 밖 → supported:false
eq('1990-01-01 미지원',           solarToLunar(1990,1,1).supported, false);
// 2030 LUNAR_TABLE 마지막 날 = Jan 22, 2031. Feb 1, 2031은 범위 밖
eq('2031-02-01 미지원',           solarToLunar(2031,2,1).supported, false);

// ─── 10. lunarToSolar 검증 ──────────────────────────────────
console.log('\n══ 10. lunarToSolar ══');
eq('음력 2025년 1월 1일 → 2025-01-29',   lunarToSolar(2025,1,1),       { year:2025, month:1,  day:29, supported:true });
eq('음력 2022년 1월 1일 → 2022-02-01',   lunarToSolar(2022,1,1),       { year:2022, month:2,  day:1,  supported:true });
eq('음력 2025년 윤6월 1일 → 2025-07-25', lunarToSolar(2025,6,1,true),  { year:2025, month:7,  day:25, supported:true });
eq('음력 2025년 윤6월 29일 → 2025-08-22',lunarToSolar(2025,6,29,true), { year:2025, month:8,  day:22, supported:true });
eq('음력 2025년 7월 1일 → 2025-08-23',   lunarToSolar(2025,7,1),       { year:2025, month:8,  day:23, supported:true });
eq('음력 2025년 9월 1일 → 2025-10-21',   lunarToSolar(2025,9,1),       { year:2025, month:10, day:21, supported:true });
eq('음력 2025년 12월 29일 → 2026-02-16', lunarToSolar(2025,12,29),     { year:2026, month:2,  day:16, supported:true });
eq('음력 2021년 윤4월 1일 → 2021-06-09', lunarToSolar(2021,4,1,true),  { year:2021, month:6,  day:9,  supported:true });
// 존재하지 않는 날짜
eq('음력 2025년 윤6월 30일 → 미지원',    lunarToSolar(2025,6,30,true).supported, false);
// 범위 밖
eq('음력 1990년 → 미지원',               lunarToSolar(1990,1,1).supported, false);

// ─── 11. solarToLunar ↔ lunarToSolar 역변환 일관성 ──────────
console.log('\n══ 11. 역변환 일관성 ══');
// solar→lunar→solar 왕복: lunarYear 필드로 정확한 LUNAR_TABLE 키 참조 [A]
{
  const testDates = [
    [2025,1,29],[2025,7,25],[2025,8,22],[2025,8,23],
    [2025,10,21],[2025,11,20],[2026,2,16],
    [2024,2,10],[2023,1,22],[2022,2,1],[2021,6,9],
  ];
  let roundFail = 0;
  for (const [y,m,d] of testDates) {
    const lunar = solarToLunar(y,m,d);
    if (!lunar.supported) continue;
    const back = lunarToSolar(lunar.lunarYear, lunar.lm, lunar.ld, lunar.isLeap);
    const ok = back.supported && back.year===y && back.month===m && back.day===d;
    if (!ok) { roundFail++; console.log(`  ❌ 역변환 ${y}-${m}-${d}: ${JSON.stringify(back)}`); }
  }
  if (roundFail === 0) { pass++; console.log(`  ✅ 왕복 역변환 전체 정상 (${testDates.length}건)`); }
  else fail++;
}

// ─── 결과 ────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
console.log(`결과: ${pass + fail}개 중 ${pass}개 통과, ${fail}개 실패`);
if (fail === 0) console.log('✅ 전체 통과');
else            console.log(`❌ ${fail}개 실패 — 위 항목 확인 필요`);
console.log(`${'═'.repeat(50)}\n`);
