// ═══════════════════════════════════════════════════════════
//  🌌 대운(大運) 계산 모듈
//  10년 주기 대운 기둥을 절기 기반으로 계산합니다.
//  - 양남/음녀: 순행 (생일 → 다음 절기)
//  - 음남/양녀: 역행 (이전 절기 → 생일)
//  - 일수 ÷ 3 = 대운 시작 나이
// ═══════════════════════════════════════════════════════════

import { JEOLGI_TABLE, getMonthJijiIndex } from './jeolgi.js';

const CG  = ["갑","을","병","정","무","기","경","신","임","계"];
const JJ  = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const CGO = ["목","목","화","화","토","토","금","금","수","수"];
const JJO = ["수","토","목","목","토","화","화","토","금","금","토","수"];

// 오행별 대표 색상 (DaeunPage 카드에 사용)
export const EL_COLOR = {
  목: { bg: 'rgba(95,173,122,0.15)',  border: '#5FAD7A', text: '#3a8a57' },
  화: { bg: 'rgba(224,90,58,0.12)',   border: '#E05A3A', text: '#c04420' },
  토: { bg: 'rgba(192,136,48,0.12)',  border: '#C08830', text: '#9a6a10' },
  금: { bg: 'rgba(184,160,53,0.15)',  border: '#B8A035', text: '#8a7820' },
  수: { bg: 'rgba(74,142,196,0.12)',  border: '#4A8EC4', text: '#2a6ea4' },
};

// 절기 근사값 (테이블에 없는 연도 대비)
// [월, 일, 시] — KST 기준
const JEOLGI_APPROX = [
  [2, 4,10],[3, 6, 6],[4, 5, 8],[5, 5,10],[6, 6, 0],[7, 7,10],
  [8, 7,16],[9, 8, 0],[10,8,12],[11,7,12],[12,7, 5],[1, 6, 8],
];

/**
 * 생년도 ±1년 범위의 절기 날짜 목록을 수집합니다.
 * 테이블에 없는 연도는 근사값을 사용합니다.
 */
function collectJeolgiDates(birthYear) {
  const dates = [];
  for (let y = birthYear - 1; y <= birthYear + 1; y++) {
    const table = JEOLGI_TABLE[y];
    if (table) {
      table.forEach(([m, d, h, min]) => {
        const ay = (m === 1) ? y + 1 : y;
        dates.push(new Date(ay, m - 1, d, h, min));
      });
    } else {
      JEOLGI_APPROX.forEach(([m, d, h]) => {
        const ay = (m === 1) ? y + 1 : y;
        dates.push(new Date(ay, m - 1, d, h, 0));
      });
    }
  }
  return dates.sort((a, b) => a - b);
}

/**
 * 대운 시작 나이 계산
 * @param {number} birthYear
 * @param {number} birthMonth
 * @param {number} birthDay
 * @param {boolean} isForward 순행 여부
 * @returns {number} 대운 시작 나이 (최소 1)
 */
function calcStartAge(birthYear, birthMonth, birthDay, isForward) {
  const birthDate  = new Date(birthYear, birthMonth - 1, birthDay, 12, 0);
  const jeolgiList = collectJeolgiDates(birthYear);

  let daysDiff;
  if (isForward) {
    // 순행: 생일 이후 가장 가까운 절기까지
    const next = jeolgiList.find(d => d > birthDate);
    if (!next) return 3;
    daysDiff = (next - birthDate) / 86400000;
  } else {
    // 역행: 생일 이전 가장 가까운 절기까지
    const prev = [...jeolgiList].reverse().find(d => d <= birthDate);
    if (!prev) return 3;
    daysDiff = (birthDate - prev) / 86400000;
  }

  return Math.max(1, Math.round(daysDiff / 3));
}

/**
 * 대운 전체 정보를 계산합니다.
 *
 * @param {number} birthYear
 * @param {number} birthMonth
 * @param {number} birthDay
 * @param {number} [birthHour=12]
 * @param {number} [birthMin=0]
 * @param {'M'|'F'} [gender='M']
 * @returns {{ startAge: number, isForward: boolean, periods: Array, wg: number, wj: number }}
 */
export function getDaeun(birthYear, birthMonth, birthDay, birthHour = 12, birthMin = 0, gender = 'M') {
  // 연간 인덱스
  const yg = ((birthYear - 4) % 10 + 10) % 10;
  // 월지 인덱스 (절기 기준)
  const wj = getMonthJijiIndex(birthYear, birthMonth, birthDay, birthHour, birthMin);
  // 월간 인덱스 (오호둔월법)
  const wg = (((yg % 5) * 2 + 2) + (wj - 2 + 12) % 12) % 10;

  // 순행/역행 결정
  // 양간 연도(yg 짝수): 남=순행, 여=역행
  // 음간 연도(yg 홀수): 남=역행, 여=순행
  const isYangYear = (yg % 2 === 0);
  const isForward  = (isYangYear && gender === 'M') || (!isYangYear && gender === 'F');

  const startAge = calcStartAge(birthYear, birthMonth, birthDay, isForward);

  // 10개 대운 기둥 생성 (100세까지)
  const periods = [];
  for (let i = 0; i < 10; i++) {
    const cgIdx = isForward
      ? (wg + i + 1) % 10
      : (wg - i - 1 + 100) % 10;
    const jjIdx = isForward
      ? (wj + i + 1) % 12
      : (wj - i - 1 + 120) % 12;

    const age    = startAge + i * 10;
    const ageEnd = age + 9;
    const year   = birthYear + age;

    periods.push({
      index: i,
      age,
      ageEnd,
      year,
      yearEnd: year + 9,
      cg:    CG[cgIdx],
      jj:    JJ[jjIdx],
      cgEl:  CGO[cgIdx],
      jjEl:  JJO[jjIdx],
      // 대운 기둥의 주된 오행 (천간 기준)
      mainEl: CGO[cgIdx],
    });
  }

  return { startAge, isForward, wg, wj, yg, periods };
}

/**
 * 현재 대운 인덱스를 반환합니다.
 * @param {Array} periods getDaeun().periods
 * @param {number} birthYear
 * @param {number} currentYear
 * @returns {number} 현재 대운 인덱스 (0-9)
 */
export function getCurrentDaeunIndex(periods, birthYear, currentYear) {
  const age = currentYear - birthYear;
  // 대운 시작 나이 이전이면 -1 (아직 첫 대운 전)
  if (age < periods[0].age) return -1;
  for (let i = periods.length - 1; i >= 0; i--) {
    if (age >= periods[i].age) return i;
  }
  return 0;
}
