/**
 * biorhythm.js — 생체리듬 계산 유틸
 *
 * 신체(23일), 감성(28일), 지성(33일) 사인 주기를 생년월일 기준으로 계산해요.
 * SajuCalendar 날짜 패널 오버레이에 사용해요.
 */

/** 각 리듬 채널 정의 */
export const BIORHYTHM_CHANNELS = [
  { key: 'physical',   label: '신체', period: 23, color: '#E05A3A', emoji: '💪' },
  { key: 'emotional',  label: '감성', period: 28, color: '#7B6CF6', emoji: '💜' },
  { key: 'intellectual', label: '지성', period: 33, color: '#4A9EFF', emoji: '🔵' },
];

/**
 * 특정 날짜의 생체리듬 값을 계산해요 (-100 ~ 100).
 *
 * @param {Date} birthDate  - 생년월일
 * @param {Date} targetDate - 확인할 날짜
 * @returns {{ physical: number, emotional: number, intellectual: number, daysSinceBirth: number }}
 */
export function calcBiorhythm(birthDate, targetDate) {
  const msPerDay = 86400000;
  const daysSinceBirth = Math.floor((targetDate - birthDate) / msPerDay);

  const calc = (period) => Math.round(Math.sin((2 * Math.PI * daysSinceBirth) / period) * 100);

  return {
    physical:     calc(23),
    emotional:    calc(28),
    intellectual: calc(33),
    daysSinceBirth,
  };
}

/**
 * 값을 상태 레이블로 변환해요.
 * @param {number} value - -100 ~ 100
 * @returns {'high' | 'normal' | 'low' | 'critical'}
 */
export function getBiorhythmStatus(value) {
  const abs = Math.abs(value);
  if (abs <= 10) return 'critical'; // 임계점 (±10% 이내)
  if (value >= 50) return 'high';
  if (value <= -50) return 'low';
  return 'normal';
}

/**
 * 상태별 한국어 설명을 반환해요.
 */
export const BIORHYTHM_STATUS_LABEL = {
  high:     '상승',
  normal:   '보통',
  low:      '저하',
  critical: '임계점',
};

/**
 * 0~100 퍼센트 바 너비로 변환 (UI 표시용).
 * -100~100 → 0~100
 */
export function toBarWidth(value) {
  return Math.round((value + 100) / 2);
}

/**
 * 날짜 범위의 생체리듬 배열을 반환해요 (캘린더 월간 뷰용).
 *
 * @param {Date} birthDate
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {Array<{ date: string, physical: number, emotional: number, intellectual: number }>}
 */
export function calcMonthlyBiorhythm(birthDate, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const results = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    results.push({ date: dateStr, ...calcBiorhythm(birthDate, date) });
  }
  return results;
}
