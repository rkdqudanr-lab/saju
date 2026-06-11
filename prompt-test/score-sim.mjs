// 별숨 점수 엔진 분포 시뮬레이션 — 출시 게이트 5지표 검증
import { getByeolsoomScore, LUCKY_THRESHOLD, UNLUCKY_THRESHOLD } from '../src/utils/dailyScoreEngine.js';

const GANS = ['갑','을','병','정','무','기','경','신','임','계'];
const JIS  = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const ELS  = ['목','화','토','금','수'];

const USERS = 1000, DAYS = 365;
const start = Date.UTC(2026, 0, 1);
const dateKeys = Array.from({ length: DAYS }, (_, i) => {
  const d = new Date(start + i * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
});

// 가상 유저: userKey + 무작위 일주/오행 (시드 고정)
function lcg(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32; }
const rng = lcg(42);
const users = Array.from({ length: USERS }, (_, i) => ({
  key: `user_${i}`,
  saju: {
    ilgan: GANS[Math.floor(rng() * 10)],
    ilji: JIS[Math.floor(rng() * 12)],
    dom: ELS[Math.floor(rng() * 5)],
    lac: ELS[Math.floor(rng() * 5)],
  },
}));

let sum = 0, n = 0, hi90 = 0, lo22 = 0, hi88 = 0;
const hist = new Array(10).fill(0);
let maxLuckyGap = 0, maxLowStreak = 0;
const perDayScores = dateKeys.map(() => []);

users.forEach((u, ui) => {
  let lastLucky = -1, lowStreak = 0;
  dateKeys.forEach((dk, di) => {
    const s = getByeolsoomScore(u.key, dk, u.saju);
    sum += s; n++;
    hist[Math.min(9, Math.floor(s / 10))]++;
    if (s >= 90) hi90++;
    if (s >= LUCKY_THRESHOLD) { hi88++; if (lastLucky >= 0) maxLuckyGap = Math.max(maxLuckyGap, di - lastLucky); lastLucky = di; }
    if (s <= UNLUCKY_THRESHOLD) lo22++;
    if (s < 45) { lowStreak++; maxLowStreak = Math.max(maxLowStreak, lowStreak); } else lowStreak = 0;
    if (ui < 200) perDayScores[di].push(s); // 유저 간 SD는 200명 샘플
  });
});

// 동일 날짜 유저 간 표준편차
const dailySDs = perDayScores.map(arr => {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
});
const avgDailySD = dailySDs.reduce((a, b) => a + b, 0) / dailySDs.length;

const mean = sum / n;
const sdAll = (() => { return null; })();
console.log('━━━ 별숨 점수 엔진 시뮬레이션 (1,000명 × 365일) ━━━');
console.log(`평균: ${mean.toFixed(1)} (목표 57±2.5 → ${Math.abs(mean - 57) <= 2.5 ? 'PASS' : 'FAIL'})`);
console.log(`90+ 비율: ${(hi90 / n * 100).toFixed(2)}% (참고)`);
console.log(`88+ 대길일 비율: ${(hi88 / n * 100).toFixed(2)}% (목표 4.5~7% = 월 1.4~2.1회 → ${hi88 / n >= 0.045 && hi88 / n <= 0.07 ? 'PASS' : 'FAIL'})`);
console.log(`≤22 흉일 비율: ${(lo22 / n * 100).toFixed(2)}% (목표 3~5% → ${lo22 / n >= 0.03 && lo22 / n <= 0.05 ? 'PASS' : 'FAIL'})`);
console.log(`대길일(88+) 최대 간격: ${maxLuckyGap}일 (목표 ≤42 → ${maxLuckyGap <= 42 ? 'PASS' : 'FAIL'})`);
console.log(`저점(<45) 최장 연속: ${maxLowStreak}일 (목표 ≤2 → ${maxLowStreak <= 2 ? 'PASS' : 'FAIL'})`);
console.log(`동일 날짜 유저 간 평균 SD: ${avgDailySD.toFixed(1)} (목표 ≥12 → ${avgDailySD >= 12 ? 'PASS' : 'FAIL'})`);
console.log('히스토그램(10점 구간):', hist.map((c, i) => `${i * 10}~${i * 10 + 9}: ${(c / n * 100).toFixed(1)}%`).join(' | '));
