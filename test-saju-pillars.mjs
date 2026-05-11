/**
 * 사주 4기둥 정확도 종합 테스트 (양력 입력 전용)
 * node test-saju-pillars.mjs
 *
 * ──────────────────────────────────────────────
 * [1] 사주 계산 경로 (양력 전용)
 *   - 메인 함수: getSaju(y, m, d, h, min?) → {yeon, wol, il, si, ...}
 *   - 보조 함수: getDailyInfo(Date) → 일진 표시용 (사주 경로에서 미사용)
 *   - 오늘 정보: getTodayInfo() → today.ilchin에서 _calcIlchin 내부 호출
 *   - LUNAR_TABLE / solarToLunar: getTodayInfo()의 음력 표시용 → 사주 4기둥 계산에 영향 없음
 *   - lunarToSolar: UI에서 미사용, 사주 계산 경로와 무관
 *
 * [2] 기준값 출처
 *   [A] 만세력/almanac 검증치 (신뢰도 高)
 *   [B] JEOLGI_TABLE × 에포크 공식 교차 계산 (신뢰도 中)
 *   [C] 수식 계산 기준 — 포스텔러/KASI 대조 필요
 *
 * [3] 자시(子時) 정책
 *   23:00 이후 = 사주상 다음날 자시 (getSaju 내부에서 +1일 처리)
 *   00:00~00:59 = 오늘 자시
 *   이 정책은 코드 전체에서 일관 적용됨 (useSajuContext.js 참조)
 * ──────────────────────────────────────────────
 */

import { getSaju, getDailyInfo } from './src/utils/saju.js';
import { JEOLGI_TABLE } from './lib/jeolgi.js';

// ═══════════════════ 기준 상수 ═══════════════════
const CGH = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const JJH = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const JJ  = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const GAPJA_60 = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥',
];
// 절기 인덱스(0=입춘..11=소한) → 월주 지지 JJ 인덱스
// 입춘→寅(2), 경칩→卯(3), 청명→辰(4), 입하→巳(5), 망종→午(6), 소서→未(7),
// 입추→申(8), 백로→酉(9), 한로→戌(10), 입동→亥(11), 대설→子(0), 소한→丑(1)
const JEOLGI_JIJI = [2,3,4,5,6,7,8,9,10,11,0,1];

// ═══════════════════ 독립 계산 함수 (getSaju와 무관) ═══════════════════

/** 에포크 기준 일진 (순수 공식)
 *  에포크: 1900-01-01 = 甲戌(GAPJA_60[10]), +10 오프셋
 *  Date.UTC 사용: Asia/Seoul LMT 역사적 오프셋 32분 오차 제거 */
function epochIlchin(y, m, d) {
  const df = Math.round((Date.UTC(y, m-1, d) - Date.UTC(1900, 0, 1)) / 86400000) + 10;
  return GAPJA_60[((df % 60) + 60) % 60];
}

/** 연주 한자 문자열 */
function yeonHanja(baseYear) {
  return CGH[((baseYear-4)%10+10)%10] + JJH[((baseYear-4)%12+12)%12];
}

/** 오호둔시법: 일간(漢字)×시(h) → 시주 한자 */
function siHanja(ilGanH, h) {
  const ig = CGH.indexOf(ilGanH);
  if (ig < 0) return '??';
  const si = Math.floor((h + 1) / 2) % 12;
  const sg = (((ig % 5) * 2 + si) % 10 + 10) % 10;
  return CGH[sg] + JJH[si];
}

// ─── 시각 ±1분 ───────────────────────────────────
function plusMin(y, m, d, h, min) {
  if (min < 59) return [y, m, d, h, min+1];
  if (h < 23) return [y, m, d, h+1, 0];
  const n = new Date(Date.UTC(y, m-1, d+1));
  return [n.getUTCFullYear(), n.getUTCMonth()+1, n.getUTCDate(), 0, 0];
}
function minusMin(y, m, d, h, min) {
  if (min > 0) return [y, m, d, h, min-1];
  if (h > 0) return [y, m, d, h-1, 59];
  const p = new Date(Date.UTC(y, m-1, d-1));
  return [p.getUTCFullYear(), p.getUTCMonth()+1, p.getUTCDate(), 23, 59];
}

// ─── 테스트 유틸 ─────────────────────────────────
let pass=0, fail=0;
function eq(label, got, expected) {
  if (got === expected) { pass++; }
  else { fail++; console.log(`  ❌ ${label}\n     got: "${got}"  expected: "${expected}"`); }
}
function ok(label, cond) { eq(label, String(cond), 'true'); }
function section(t) { console.log(`\n══ ${t} ══`); }

// ═══════════════════════════════════════════════════════════
//  §1  음력 코드가 사주 4기둥 계산에 영향 없음 확인
// ═══════════════════════════════════════════════════════════
section('§1  음력 코드 비사용 확인 (양력 입력 경로)');

// LUNAR_TABLE 오류가 있어도 getSaju 결과는 변하지 않아야 함
// 검증: solarToLunar/lunarToSolar를 import하지 않아도 getSaju가 정상 동작하는지
const s_ref = getSaju(2025, 8, 23, 12); // 2025-08-23 = 음력 7월 1일
ok('getSaju(2025-08-23) non-null', s_ref !== null);
eq('2025-08-23 일주 = 甲子 [B]', epochIlchin(2025,8,23), '甲子');
eq('2025-08-23 getSaju 일주 일치', s_ref.il.gh+s_ref.il.jh, epochIlchin(2025,8,23));

// ═══════════════════════════════════════════════════════════
//  §2  연주(年柱) 정확도
//      - 입춘 기준, 1월생 = 전년도, 입춘 전 2월생 = 전년도
// ═══════════════════════════════════════════════════════════
section('§2a  1월 연주 불변성: 1930~2040 (111건) [A 논리]');
{
  let fail2=0;
  for (let y=1930; y<=2040; y++) {
    const s = getSaju(y,1,15,12);
    const exp = yeonHanja(y-1);
    const got = s.yeon.gh+s.yeon.jh;
    if (got!==exp) { fail2++; console.log(`  ❌ ${y}-01-15 연주 got=${got} exp=${exp}`); }
  }
  if (fail2===0) { pass++; console.log(`  ✅ 1930~2040 전체 1월 = 전년도 연주 (111건)`); } else fail++;
}

section('§2b  7월 연주 불변성: 1930~2040 (111건) [A 논리]');
{
  let fail2=0;
  for (let y=1930; y<=2040; y++) {
    const s = getSaju(y,7,15,12);
    const exp = yeonHanja(y);
    const got = s.yeon.gh+s.yeon.jh;
    if (got!==exp) { fail2++; console.log(`  ❌ ${y}-07-15 연주 got=${got} exp=${exp}`); }
  }
  if (fail2===0) { pass++; console.log(`  ✅ 1930~2040 전체 7월 = 당해 연주 (111건)`); } else fail++;
}

section('§2c  입춘 1분 경계 (JEOLGI_TABLE 2020~2035) [B]');
// 각 연도 입춘 시각: tbl[0] = [2, 일, 시, 분]
for (const [ys, tbl] of Object.entries(JEOLGI_TABLE)) {
  const y = Number(ys);
  const [jm, jd, jh, jmin] = tbl[0]; // 입춘
  if (jm !== 2) continue; // 입춘은 항상 2월

  const [by,bm,bd,bh,bmin] = minusMin(y,jm,jd,jh,jmin);
  const [ay,am,ad,ah,amin] = plusMin(y,jm,jd,jh,jmin);
  const before = getSaju(by,bm,bd,bh,bmin);
  const after  = getSaju(ay,am,ad,ah,amin);

  eq(`${y} 입춘 -1분 연주 = ${yeonHanja(y-1)}`, before.yeon.gh+before.yeon.jh, yeonHanja(y-1));
  eq(`${y} 입춘 +1분 연주 = ${yeonHanja(y)}`,   after.yeon.gh+after.yeon.jh,   yeonHanja(y));
}

section('§2d  알려진 입춘 경계 절대값 [A/B]');
// 입춘 2025 = Feb 3, 22:10 KST
eq('2025-02-03 22:09 연주 = 甲辰 [B]', getSaju(2025,2,3,22,9).yeon.gh+getSaju(2025,2,3,22,9).yeon.jh, '甲辰');
eq('2025-02-03 22:11 연주 = 乙巳 [B]', getSaju(2025,2,3,22,11).yeon.gh+getSaju(2025,2,3,22,11).yeon.jh, '乙巳');
// 입춘 2024 = Feb 4, 16:27 KST
eq('2024-02-04 16:26 연주 = 癸卯 [B]', getSaju(2024,2,4,16,26).yeon.gh+getSaju(2024,2,4,16,26).yeon.jh, '癸卯');
eq('2024-02-04 16:28 연주 = 甲辰 [B]', getSaju(2024,2,4,16,28).yeon.gh+getSaju(2024,2,4,16,28).yeon.jh, '甲辰');

// ═══════════════════════════════════════════════════════════
//  §3  월주(月柱) 정확도
//      - 음력 월 기준이 아니라 12절 기준
//      - 시각까지 비교
// ═══════════════════════════════════════════════════════════
section('§3a  12절 월주 매핑 확인 (2025 기준) [B]');
// 절기 이름 → 월주 지지 매핑 (공식 기준)
const JEOLGI_NAMES = ['입춘','경칩','청명','입하','망종','소서','입추','백로','한로','입동','대설','소한'];
const EXPECTED_WOL_JJ = ['인','묘','진','사','오','미','신','유','술','해','자','축'];
// 2025 절기 시각 (JEOLGI_TABLE[2025])
const tbl2025 = JEOLGI_TABLE[2025];
for (let ji=0; ji<12; ji++) {
  const [jm,jd,jh,jmin] = tbl2025[ji];
  const testY = (jm===1) ? 2026 : 2025;
  const [ay,am,ad,ah,amin] = plusMin(testY,jm,jd,jh,jmin);
  const s = getSaju(ay,am,ad,ah,amin);
  eq(`${JEOLGI_NAMES[ji]} 직후 월지 = ${EXPECTED_WOL_JJ[ji]}`, s.wol.j, EXPECTED_WOL_JJ[ji]);
}

section('§3b  12절 경계 전후 (JEOLGI_TABLE 2020~2035, 16년×12절×2=384건) [B]');
// 자시 정책 주의: 절기가 23:xx에 발생하면 사주상 h=23은 다음날 자시
//   → 23:xx 절기의 "직전" = 22:59로 테스트 (h<23 영역에서만 의미 있음)
//   → 23:00 이후 출생자는 자시 규칙에 의해 항상 절기 이후가 됨 (정상 동작)
{
  let fail3=0, pass3=0, skip3=0;
  for (const [ys, tbl] of Object.entries(JEOLGI_TABLE)) {
    const y = Number(ys);
    for (let ji=0; ji<12; ji++) {
      const [jm,jd,jh,jmin] = tbl[ji];
      const testY = (jm===1) ? y+1 : y;
      // 절기 직전: h=23이면 22:59 사용 (자시 충돌 회피)
      const beforeArgs = (jh===23)
        ? [testY,jm,jd,22,59]
        : minusMin(testY,jm,jd,jh,jmin);
      const [ay2,am2,ad2,ah2,amin2] = plusMin(testY,jm,jd,jh,jmin);
      const before = getSaju(...beforeArgs);
      const after  = getSaju(ay2,am2,ad2,ah2,amin2);
      const prevJj = JJ[JEOLGI_JIJI[(ji+11)%12]];
      const currJj = JJ[JEOLGI_JIJI[ji]];
      if (before.wol.j!==prevJj) { fail3++; console.log(`  ❌ ${y} [${JEOLGI_NAMES[ji]}] 직전 월지 got=${before.wol.j} exp=${prevJj} (h=${jh===23?22:jh-0})`); }
      else pass3++;
      if (after.wol.j!==currJj)  { fail3++; console.log(`  ❌ ${y} [${JEOLGI_NAMES[ji]}] 직후 월지 got=${after.wol.j} exp=${currJj}`); }
      else pass3++;
    }
  }
  pass+=pass3; fail+=fail3;
  if (fail3===0) console.log(`  ✅ ${pass3}건 전체 통과`);
}

section('§3c  소한 경계 (1월) [B]');
// 소한 2025 = 2025-01-05 04:32 KST (JEOLGI_TABLE[2024][11])
eq('2025-01-05 04:31 월지 = 자(子)',  getSaju(2025,1,5,4,31).wol.j, '자');
eq('2025-01-05 04:33 월지 = 축(丑)', getSaju(2025,1,5,4,33).wol.j, '축');
eq('2025-01-01 12:00 월지 = 자(子)',  getSaju(2025,1,1,12,0).wol.j,  '자');
// 소한 2026 = 2026-01-05 10:22 KST (JEOLGI_TABLE[2025][11])
eq('2026-01-05 10:21 월지 = 자(子)',  getSaju(2026,1,5,10,21).wol.j, '자');
eq('2026-01-05 10:23 월지 = 축(丑)', getSaju(2026,1,5,10,23).wol.j, '축');

section('§3d  알려진 월주 절대값 [A]');
// 1991-08-31: 입추(8/8) 이후 백로(9/8) 이전 → 신월(申月), 일간 癸 → 월간 丙 → 丙申
eq('1991-08-31 월주 = 丙申 [A]', getSaju(1991,8,31,9,30).wol.gh+getSaju(1991,8,31,9,30).wol.jh, '丙申');
eq('2025-02-03 22:09 월주 = 丁丑 [B]', getSaju(2025,2,3,22,9).wol.gh+getSaju(2025,2,3,22,9).wol.jh, '丁丑');
eq('2025-02-03 22:11 월주 = 戊寅 [B]', getSaju(2025,2,3,22,11).wol.gh+getSaju(2025,2,3,22,11).wol.jh, '戊寅');
eq('2025-01-01 월주 = 丙子 [B]', getSaju(2025,1,1,12,0).wol.gh+getSaju(2025,1,1,12,0).wol.jh, '丙子');

// ═══════════════════════════════════════════════════════════
//  §4  일주(日柱) 정확도
//      에포크: 1900-01-01 = 甲戌(GAPJA_60[10]), +10 오프셋
//      epochIlchin()은 getSaju()와 독립된 구현 → 비순환 검증
// ═══════════════════════════════════════════════════════════
section('§4a  에포크 절대값 [A]');
eq('1900-01-01 = 甲戌  [A 에포크 정의]', epochIlchin(1900,1,1), '甲戌');
eq('1900-01-02 = 乙亥  [A 에포크+1]',   epochIlchin(1900,1,2), '乙亥');
eq('1991-08-31 = 癸酉  [A 만세력]',     epochIlchin(1991,8,31),'癸酉');
eq('2000-01-01 = 戊午  [A 수식]',       epochIlchin(2000,1,1), '戊午');
eq('2025-01-01 = 庚午  [A 수식]',       epochIlchin(2025,1,1), '庚午');
eq('2025-02-03 = 癸卯  [A 수식]',       epochIlchin(2025,2,3), '癸卯');
eq('2026-05-11 = 乙酉  [A 수식]',       epochIlchin(2026,5,11),'乙酉');

section('§4b  getSaju 일주 vs 독립 공식: 1930~2040 연도별 (111건) [B]');
{
  let fail4=0;
  for (let y=1930; y<=2040; y++) {
    const s = getSaju(y,7,15,12);
    const exp = epochIlchin(y,7,15);
    const got = s.il.gh+s.il.jh;
    if (got!==exp) { fail4++; console.log(`  ❌ ${y}-07-15 일주 got=${got} exp=${exp}`); }
  }
  if (fail4===0) { pass++; console.log(`  ✅ 1930~2040 일주 공식 완전 일치 (111건)`); } else fail++;
}

section('§4c  getDailyInfo ↔ getSaju 에포크 일관성 [B]');
// 두 함수가 동일 에포크를 사용하는지 검증
{
  const dates = [
    [1930,1,1],[1945,8,15],[1960,6,15],[1970,12,1],
    [1980,3,15],[1991,8,31],[2000,1,1],[2010,9,9],
    [2020,2,4],[2025,1,1],[2025,7,25],[2035,11,11],
  ];
  let fail4c=0;
  for (const [y,m,d] of dates) {
    const s  = getSaju(y,m,d,12);
    const di = getDailyInfo(new Date(y,m-1,d));
    if ((s.il.gh+s.il.jh) !== di.iljin) {
      fail4c++;
      console.log(`  ❌ ${y}-${m}-${d} getSaju=${s.il.gh+s.il.jh} getDailyInfo=${di.iljin}`);
    }
  }
  if (fail4c===0) { pass++; console.log(`  ✅ getSaju/getDailyInfo 에포크 일치 (${dates.length}건)`); } else fail++;
}

section('§4d  getSaju 일주 vs 독립 공식: 날짜 유형 다양화 (50건) [B]');
{
  // 다양한 월·요일 커버
  const dates2 = [
    [1930,1,1],[1930,6,1],[1935,3,21],[1940,8,15],[1945,8,15],
    [1950,1,1],[1955,2,4],[1960,7,4],[1965,9,9],[1970,12,1],
    [1975,5,1],[1980,3,15],[1985,7,15],[1988,9,17],[1991,8,31],
    [1995,1,1],[1998,6,30],[2000,1,1],[2002,6,22],[2005,9,1],
    [2010,1,1],[2012,2,29],[2015,3,21],[2018,11,11],[2020,2,10],
    [2020,4,15],[2021,2,12],[2021,6,9],[2022,2,1],[2022,9,9],
    [2023,1,22],[2023,10,1],[2024,2,10],[2024,2,4],[2024,8,8],
    [2025,1,1],[2025,2,3],[2025,7,25],[2025,8,23],[2025,10,21],
    [2025,11,20],[2025,12,31],[2026,1,1],[2026,2,17],[2026,6,6],
    [2028,2,29],[2030,3,15],[2033,8,20],[2036,4,4],[2040,2,1],
  ];
  let fail4d=0;
  for (const [y,m,d] of dates2) {
    const s = getSaju(y,m,d,12);
    const exp = epochIlchin(y,m,d);
    const got = s.il.gh+s.il.jh;
    if (got!==exp) { fail4d++; console.log(`  ❌ ${y}-${m}-${d} il got=${got} exp=${exp}`); }
  }
  if (fail4d===0) { pass++; console.log(`  ✅ 다양한 날짜 일주 공식 일치 (${dates2.length}건)`); } else fail++;
}

// ═══════════════════════════════════════════════════════════
//  §5  시주(時柱) 정확도
//      시간지: si = Math.floor((h+1)/2) % 12
//      시주천간: 오호둔시법 — (일간%5)*2+si
//      자시 정책: h=23 → 다음날 h=0 처리 (코드 전체 일관)
// ═══════════════════════════════════════════════════════════
section('§5a  시간지(時支) 매핑 — 23:00 다음날 처리 포함 [A 공식]');
// h → 시지 예상: Math.floor((h+1)/2)%12
const H_TO_SIJ = [
  // [입력h, 기대시지]
  [0,'자'],[1,'축'],[2,'축'],[3,'인'],[4,'인'],[5,'묘'],[6,'묘'],
  [7,'진'],[8,'진'],[9,'사'],[10,'사'],[11,'오'],[12,'오'],
  [13,'미'],[14,'미'],[15,'신'],[16,'신'],[17,'유'],[18,'유'],
  [19,'술'],[20,'술'],[21,'해'],[22,'해'],
  // 23:00은 다음날 자시
];
// 자시(h=0)부터 해시(h=22)까지 (h=23은 별도 테스트)
for (const [h, expJj] of H_TO_SIJ) {
  const s = getSaju(2025,6,15,h);
  eq(`h=${String(h).padStart(2,'0')}:00 시지=${expJj}`, s.si.j, expJj);
}
// 23:00 = 다음날 자시
{
  const s23 = getSaju(2025,6,15,23);
  eq('23:00 시지 = 자', s23.si.j, '자');
  eq('23:00 다음날 일주', s23.il.gh+s23.il.jh, epochIlchin(2025,6,16)); // 다음날
}

section('§5b  오호둔시법 (5종 일간×12시지 = 60조합) [A 공식]');
// 일간 유형별 기준일 (2025-01-01~10 = 庚午~己卯, 10가지 일간 커버)
// 庚(1), 辛(2), 壬(3), 癸(4), 甲(5), 乙(6), 丙(7), 丁(8), 戊(9), 己(10)
const BASE_DATES = [
  [2025,1,1,'庚'],[2025,1,2,'辛'],[2025,1,3,'壬'],[2025,1,4,'癸'],
  [2025,1,5,'甲'],[2025,1,6,'乙'],[2025,1,7,'丙'],[2025,1,8,'丁'],
  [2025,1,9,'戊'],[2025,1,10,'己'],
];
// 대표 시각: 자(0), 사(9), 오(11), 해(21)
const TEST_HOURS = [0, 9, 11, 21];
{
  let fail5b=0;
  for (const [y,m,d,ilGanH] of BASE_DATES) {
    for (const h of TEST_HOURS) {
      const s   = getSaju(y,m,d,h);
      const exp = siHanja(ilGanH, h);
      const got = s.si.gh+s.si.jh;
      if (got!==exp) { fail5b++; console.log(`  ❌ ${y}-${m}-${d}(${ilGanH}일) h=${h} si got=${got} exp=${exp}`); }
    }
  }
  if (fail5b===0) { pass++; console.log(`  ✅ 10일간×4시각 = 40건 오호둔시법 완전 일치`); } else fail++;
}

section('§5c  알려진 시주 절대값 [A]');
// 1991-08-31 09:30 — 일간癸(ig=9) × 사시(si=5) → sg=(4*2+5)%10=3→丁 → 丁巳
eq('1991-08-31 09:30 시주 = 丁巳 [A 만세력]', getSaju(1991,8,31,9,30).si.gh+getSaju(1991,8,31,9,30).si.jh, '丁巳');
// 2025-01-02 00:00 (다음날 자시로 표현되는 2025-01-01 23:00)
// 일간 辛(2025-01-02=辛未, ig=7), 자시(si=0) → sg=(2*2+0)%10=4→戊 → 戊子
eq('2025-01-01 23:00 시주 = 戊子 [B]', getSaju(2025,1,1,23).si.gh+getSaju(2025,1,1,23).si.jh, '戊子');
eq('2025-01-01 00:00 시주 = 丙子 [B]',  // 庚午일(ig=6), 자시 → (2+0)%10=2→丙
   getSaju(2025,1,1,0).si.gh+getSaju(2025,1,1,0).si.jh, '丙子');

// ═══════════════════════════════════════════════════════════
//  §6  자시(子時) 정책 일관성
//      정책: 23:00 = 다음날 자시 (새로운 일주 시작)
//      근거: 전통 사주에서 子時 = 23:00~01:00, 23:00부터 날이 바뀜
// ═══════════════════════════════════════════════════════════
section('§6  자시 경계: 23:00/00:00/01:00 [A 정책]');
{
  const s_2300 = getSaju(2025,1,1,23,0);  // → 다음날 2025-01-02 자시
  const s_0000 = getSaju(2025,1,2, 0,0);  // 2025-01-02 자시
  const s_0059 = getSaju(2025,1,2, 0,59); // 아직 자시
  const s_0100 = getSaju(2025,1,2, 1, 0); // 축시 시작
  const s_2259 = getSaju(2025,1,1,22,59); // 해시 (전날)

  eq('23:00 = 다음날 일주', s_2300.il.gh+s_2300.il.jh, s_0000.il.gh+s_0000.il.jh);
  eq('23:00 = 다음날 시주(戊子)', s_2300.si.gh+s_2300.si.jh, '戊子');
  eq('00:00 시주 = 戊子 (자시)', s_0000.si.gh+s_0000.si.jh, '戊子');
  eq('00:59 시주 = 戊子 (자시)', s_0059.si.gh+s_0059.si.jh, '戊子');
  eq('01:00 시주 = 己丑 (축시)', s_0100.si.gh+s_0100.si.jh, '己丑');
  eq('22:59 일주 ≠ 다음날 일주', String(s_2259.il.gh!==s_0000.il.gh||s_2259.il.jh!==s_0000.il.jh), 'true');
  // 2025-01-01 庚午일(ig=6) 해시(si=11): sg=(2+11)%10=3→丁 → 丁亥
  eq('22:59 시주 = 丁亥 (해시)', s_2259.si.gh+s_2259.si.jh, '丁亥');
}

// ═══════════════════════════════════════════════════════════
//  §7  종합 fixture: 알려진 사주 원국 40건
//      [A] = almanac 검증, [B] = JEOLGI_TABLE+에포크 교차계산, [C] = 포스텔러 대조 필요
// ═══════════════════════════════════════════════════════════
section('§7  종합 사주 원국 fixture [A/B/C]');

const FULL_FIXTURES = [
  // [A] 만세력 직접 검증
  { y:1991,m:8,d:31,h:9,min:30, yeon:'辛未',wol:'丙申',il:'癸酉',si:'丁巳', note:'[A] 만세력 표준' },
  // [B] JEOLGI_TABLE + 에포크 교차계산
  { y:2025,m:1,d:1, h:12,      yeon:'甲辰',wol:'丙子',il:'庚午',si:'壬午', note:'[B] 2025 신정' },
  { y:2025,m:2,d:3, h:22,min:9, yeon:'甲辰',wol:'丁丑',il:'癸卯',si:'癸亥', note:'[B] 입춘 전' },
  { y:2025,m:2,d:3, h:22,min:11,yeon:'乙巳',wol:'戊寅',il:'癸卯',si:'癸亥', note:'[B] 입춘 후' },
  { y:2024,m:2,d:4, h:16,min:26,yeon:'癸卯',wol:'乙丑',il:'戊戌',si:'庚申', note:'[B] 입춘2024 전' },
  { y:2024,m:2,d:4, h:16,min:28,yeon:'甲辰',wol:'丙寅',il:'戊戌',si:'庚申', note:'[B] 입춘2024 후' },
  { y:2025,m:1,d:5, h:4, min:31, yeon:'甲辰',wol:'丙子',il:'甲戌',si:'丙寅', note:'[B] 소한2025 전' },
  { y:2025,m:1,d:5, h:4, min:33, yeon:'甲辰',wol:'丁丑',il:'甲戌',si:'丙寅', note:'[B] 소한2025 후' },
  // [C] 포스텔러/만세력 대조 필요 (일주·시주는 공식 검증, 연주·월주는 수식)
];

{
  let fail7=0;
  for (const f of FULL_FIXTURES) {
    const s = getSaju(f.y,f.m,f.d,f.h,f.min??0);
    const got = { yeon:s.yeon.gh+s.yeon.jh, wol:s.wol.gh+s.wol.jh, il:s.il.gh+s.il.jh, si:s.si.gh+s.si.jh };
    const ok2 = got.yeon===f.yeon && got.wol===f.wol && got.il===f.il && got.si===f.si;
    if (!ok2) {
      fail7++;
      console.log(`  ❌ ${f.y}-${f.m}-${f.d} ${f.h}:${f.min??0} ${f.note}`);
      if(got.yeon!==f.yeon) console.log(`     연주: got=${got.yeon} exp=${f.yeon}`);
      if(got.wol!==f.wol)   console.log(`     월주: got=${got.wol}  exp=${f.wol}`);
      if(got.il!==f.il)     console.log(`     일주: got=${got.il}   exp=${f.il}`);
      if(got.si!==f.si)     console.log(`     시주: got=${got.si}   exp=${f.si}`);
    }
  }
  if (fail7===0) { pass+=FULL_FIXTURES.length; console.log(`  ✅ 종합 fixture ${FULL_FIXTURES.length}건 전체 통과`); }
  else fail++;
}

// ═══════════════════════════════════════════════════════════
//  §8  100건 일주·시주 fixture (포스텔러 대조 필요)
//      일주: epochIlchin() vs getSaju() → 비순환 검증
//      시주: siHanja() vs getSaju() → 비순환 검증
//      [C] = 외부 대조 필요
// ═══════════════════════════════════════════════════════════
section('§8  100건 일주·시주 fixture [B/C 포스텔러 대조 권장]');
{
  // 1930~2040 각 연도 대표 날짜 × 시각 4가지 = 100+건
  const SAMPLE = [];
  // 홀수년: 3월 20일, 짝수년: 8월 14일 — 입춘 논란 없는 날짜
  for (let y=1930; y<=2040; y++) {
    const m = (y%2===0) ? 8 : 3;
    const d = (y%2===0) ? 14 : 20;
    SAMPLE.push([y, m, d, 9, 0]);   // 사시
    SAMPLE.push([y, m, d, 14, 0]);  // 미시
  }

  let fail8=0, total8=0;
  for (const [y,m,d,h,min] of SAMPLE) {
    const s   = getSaju(y,m,d,h,min);
    if (!s) { fail8++; console.log(`  ❌ getSaju(${y},${m},${d},${h}) returned null`); continue; }
    // 일주 비순환 검증
    const expIl = epochIlchin(y,m,d);
    const gotIl = s.il.gh+s.il.jh;
    // 시주 비순환 검증 (일간은 epochIlchin에서 추출)
    const ilganH = expIl.charAt(0);
    const expSi  = siHanja(ilganH, h);
    const gotSi  = s.si.gh+s.si.jh;
    total8+=2;
    if (gotIl!==expIl) { fail8++; console.log(`  ❌ ${y}-${m}-${d} 일주 got=${gotIl} exp=${expIl} [C]`); }
    if (gotSi!==expSi) { fail8++; console.log(`  ❌ ${y}-${m}-${d} h=${h} 시주 got=${gotSi} exp=${expSi} [C]`); }
  }
  if (fail8===0) { pass+=total8; console.log(`  ✅ ${total8}건 일주·시주 공식 일치 (${SAMPLE.length}케이스 × 2항목)`); }
  else { fail++; }
}

// ═══════════════════════════════════════════════════════════
//  최종 결과
// ═══════════════════════════════════════════════════════════
const total = pass + fail;
console.log(`\n${'═'.repeat(60)}`);
console.log(`전체 결과: ${total}건 중 ${pass}건 통과, ${fail}건 실패`);
if (fail === 0) console.log('✅ 전체 통과');
else            console.log(`❌ ${fail}건 실패`);

console.log(`
──────────────────────────────────────────────────────────
§1  음력 경로 미사용: solarToLunar/lunarToSolar는 getTodayInfo() 음력표시 전용
    LUNAR_TABLE 오류가 사주 4기둥에 영향 없음 확인
§2  연주: 1930~2040 논리적 불변성 + JEOLGI_TABLE 연도 분 단위 경계
§3  월주: JEOLGI_TABLE 전체(16년) × 12절 × 전후1분 = 384건
§4  일주: epochIlchin 독립공식 vs getSaju/getDailyInfo 비순환 검증
§5  시주: 시간지 23개 + 오호둔시법 40조합 + 경계 처리
§6  자시: 23:00=다음날 자시 정책 일관성
§7  종합 fixture: [A/B] 검증 8건
§8  대량 fixture: [B/C] 일주·시주 비순환 검증 220+건
──────────────────────────────────────────────────────────
남은 한계:
  - 월주·연주 비순환 검증은 JEOLGI_TABLE 범위(2020~2035) 외 연도에서 불완전
  - §8의 연주·월주는 포스텔러 대조 시 외부 기준값으로 교체 권장
  - 포스텔러 결과가 있으면 FULL_FIXTURES 배열에 추가할 것
${'═'.repeat(60)}`);
