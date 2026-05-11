const LUNAR_TABLE = {
  2020: [[2020, 1, 25], [30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29, 30], 0],
  2021: [[2021, 2, 12], [29, 30, 29, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29], 4],
  2022: [[2022, 2, 1], [30, 29, 30, 29, 30, 29, 29, 30, 29, 30, 29, 30], 0],
  2023: [[2023, 1, 22], [29, 30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30], 2],
  2024: [[2024, 2, 10], [29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 30, 29], 0],
  2025: [[2025, 1, 29], [30, 29, 30, 29, 30, 29, 29, 29, 30, 30, 30, 30, 29], 6],
  2026: [[2026, 2, 17], [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29], 0],
  2027: [[2027, 2, 6], [30, 29, 30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29], 5],
  2028: [[2028, 1, 26], [30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29, 30], 0],
  2029: [[2029, 2, 13], [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29], 0],
  2030: [[2030, 2, 3], [29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30], 0],
};

export const LUNAR_SUPPORT_RANGE = Object.freeze({
  startYear: 2020,
  endYear: 2030,
});

export const LUNAR_UNSUPPORTED_MESSAGE =
  `음력 정보 없음(지원 범위: ${LUNAR_SUPPORT_RANGE.startYear}~${LUNAR_SUPPORT_RANGE.endYear})`;

export function solarToLunar(y, m, d) {
  const target = new Date(y, m - 1, d);

  // 당해 연도 먼저 시도: 신년 첫날(newYear == target)이 전년도 마지막 날과 겹치지 않도록
  for (const ly of [y, y - 1]) {
    const row = LUNAR_TABLE[ly];
    if (!row) continue;

    const [startArr, months, leap] = row;
    const newYear = new Date(startArr[0], startArr[1] - 1, startArr[2]);
    if (target < newYear) continue;

    let diff = Math.round((target - newYear) / 86400000);
    let cumul = 0;

    for (let i = 0; i < months.length; i += 1) {
      if (diff < cumul + months[i]) {
        const ld = diff - cumul + 1;
        let lm;
        let isLeap;

        if (leap > 0) {
          if (i < leap) {
            lm = i + 1;
            isLeap = false;
          } else if (i === leap) {
            lm = leap;
            isLeap = true;
          } else {
            lm = i;
            isLeap = false;
          }
        } else {
          lm = i + 1;
          isLeap = false;
        }

        // lunarYear: lunarToSolar 역변환 시 사용할 LUNAR_TABLE 키
        return { lm, ld, isLeap, lunarYear: ly, supported: true };
      }
      cumul += months[i];
    }
  }

  return { lm: null, ld: null, isLeap: false, lunarYear: null, supported: false };
}

export function formatLunarDate(lunar) {
  if (!lunar?.supported) return LUNAR_UNSUPPORTED_MESSAGE;
  return `음력 ${lunar.isLeap ? "윤" : ""}${lunar.lm}월 ${lunar.ld}일`;
}

/**
 * 음력 날짜 → 양력 날짜 변환
 * @param {number} lunarYear  LUNAR_TABLE 키 (음력 정월이 속한 양력 연도)
 * @param {number} lm         음력 월 (1~12)
 * @param {number} ld         음력 일 (1~30)
 * @param {boolean} isLeap    윤달 여부
 * @returns {{ year, month, day, supported }}
 */
export function lunarToSolar(lunarYear, lm, ld, isLeap = false) {
  const row = LUNAR_TABLE[lunarYear];
  if (!row) return { year: null, month: null, day: null, supported: false };

  const [startArr, months, leap] = row;
  const newYear = new Date(startArr[0], startArr[1] - 1, startArr[2]);

  let cumul = 0;
  for (let i = 0; i < months.length; i++) {
    let lm_i, isLeap_i;
    if (leap > 0) {
      if (i < leap)        { lm_i = i + 1; isLeap_i = false; }
      else if (i === leap) { lm_i = leap;  isLeap_i = true;  }
      else                 { lm_i = i;     isLeap_i = false; }
    } else {
      lm_i = i + 1; isLeap_i = false;
    }

    if (lm_i === lm && isLeap_i === isLeap) {
      if (ld < 1 || ld > months[i]) return { year: null, month: null, day: null, supported: false };
      const target = new Date(newYear.getTime() + (cumul + ld - 1) * 86400000);
      return { year: target.getFullYear(), month: target.getMonth() + 1, day: target.getDate(), supported: true };
    }
    cumul += months[i];
  }
  return { year: null, month: null, day: null, supported: false };
}
