/**
 * dailyScoreEngine — 결정론적 별숨 점수 엔진 (0~100 전 구간)
 *
 * 원칙:
 *  - 같은 사람(userKey) + 같은 날(dateKey) = 항상 같은 점수 (순수함수, 미래·과거 즉시 계산 가능)
 *  - 분포는 설계된 역CDF 룩업이 지배: 일평균 ≈57, 90+ ≈ 월 1~2회, ≤22 ≈ 월 1회
 *  - 사주(일진×사용자 일주) 규칙은 ±10 가중 + AI 서술용 근거 문자열 담당
 *  - 21일 블록당 1회 대길일(88+) 승격, 28일 블록당 1회 흉일(≤22) 강등 — 희소 이벤트 보장
 *  - 저점(<45) 3일 연속 금지
 *
 * 이 파일은 앱 코드를 import하지 않는 self-contained 모듈 (node 시뮬레이션 가능).
 */

// ── 간지 테이블 (saju.js와 동일 체계) ──────────────────────────
const GANS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const JIS  = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const GAN_EL = { 갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수' };
const JI_EL  = { 자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화', 오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수' };
const SHENG = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }; // 상생(내가 생하는)
const KE    = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' }; // 상극(내가 극하는)

// 천간합: 갑기·을경·병신·정임·무계
const GAN_HAP = { 갑: '기', 기: '갑', 을: '경', 경: '을', 병: '신', 신: '병', 정: '임', 임: '정', 무: '계', 계: '무' };
// 지지 육합: 자축·인해·묘술·진유·사신·오미
const JI_YUKHAP = { 자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘', 진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오' };
// 지지 충: 자오·축미·인신·묘유·진술·사해
const JI_CHUNG = { 자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인', 묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사' };
// 삼합 그룹: 신자진(수)·해묘미(목)·인오술(화)·사유축(금)
const SAMHAP_GROUP = { 신: 0, 자: 0, 진: 0, 해: 1, 묘: 1, 미: 1, 인: 2, 오: 2, 술: 2, 사: 3, 유: 3, 축: 3 };

// ── 일진 계산 (saju.js _calcIlchin과 동일 공식) ─────────────────
export function calcDayPillar(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const df = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000) + 10;
  return { gan: GANS[(df % 10 + 10) % 10], ji: JIS[(df % 12 + 12) % 12] };
}

// ── 결정론적 난수: FNV-1a → [0,1) ──────────────────────────────
function hash32(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rand(userKey, dateKey, salt = '') {
  return (hash32(`${userKey}|${dateKey}${salt}`) % 100000) / 100000;
}

// ── 목표 분포 역CDF (인덱스 = 백분위 0~99) ───────────────────────
// ≤14: 0.7% / 15~22: 3% / 23~29: 3% / 30~44: 13% / 45~64: 36% / 65~79: 28% / 80~89: 12% / 90+: 4%
const SCORE_CDF = [];
(function buildCdf() {
  const bands = [
    [1,  10, 14],  // 대흉 1%
    [2,  17, 22],  // 흉 2% (+ 블록 강등 ≈1.5% → 총 ≤22 ≈ 3.5%)
    [3,  24, 29],  // 저기압 3%
    [17, 30, 44],  // 주의 17%
    [38, 45, 62],  // 보통 38%
    [23, 63, 77],  // 순풍 23%
    [12, 78, 87],  // 좋은 날 12%
    [4,  88, 99],  // 대길 4% (+ 블록 승격 ≈2% → 총 88+ ≈ 6%)
  ];
  for (const [n, lo, hi] of bands) {
    for (let i = 0; i < n; i++) {
      SCORE_CDF.push(Math.round(lo + (hi - lo) * (n === 1 ? 0.5 : i / (n - 1))));
    }
  }
})();

// 자연 발생 극단일 판정 — CDF 상 88+ 는 r≥0.96, ≤22 는 r<0.03
const NATURAL_LUCKY_R = 0.96;
const NATURAL_UNLUCKY_R = 0.03;

// ── 사주 가중 + 근거 (일진 × 사용자 일주) ───────────────────────
// 반환: { adj: -50~+50 근사(스케일 전), reasons: 서술용 근거 문자열[] }
export function sajuDayRelation(userSaju, dayPillar) {
  const reasons = [];
  let pts = 0;
  const uGan = userSaju?.ilgan, uJi = userSaju?.ilji;
  const dGan = dayPillar.gan, dJi = dayPillar.ji;
  if (!uGan || !uJi || !GAN_EL[uGan] || !JI_EL[uJi]) return { adj: 0, reasons };

  const uEl = GAN_EL[uGan], dEl = GAN_EL[dGan];

  // 천간 관계
  if (GAN_HAP[uGan] === dGan) { pts += 18; reasons.push('타고난 기질과 오늘의 기운이 합(合)을 이루는 날'); }
  else if (SHENG[dEl] === uEl) { pts += 12; reasons.push('오늘의 기운이 당신을 받쳐주는 상생의 날'); }
  else if (SHENG[uEl] === dEl) { pts += 6; reasons.push('표현하고 베풀수록 풀리는 날'); }
  else if (KE[dEl] === uEl) { pts -= 12; reasons.push('외부 압박이 느껴지기 쉬운 날'); }
  else if (KE[uEl] === dEl) { pts -= 6; reasons.push('힘을 쓰면 쓸수록 소모가 큰 날'); }
  else if (uEl === dEl) { pts += 4; reasons.push('자기 페이스를 지키기 좋은 날'); }

  // 지지 관계
  if (JI_YUKHAP[uJi] === dJi) { pts += 14; reasons.push('관계와 약속이 부드럽게 맞물리는 육합의 날'); }
  else if (SAMHAP_GROUP[uJi] !== undefined && SAMHAP_GROUP[uJi] === SAMHAP_GROUP[dJi] && uJi !== dJi) {
    pts += 10; reasons.push('주변과 호흡이 맞아 협력이 잘 풀리는 날');
  } else if (JI_CHUNG[uJi] === dJi) { pts -= 16; reasons.push('일정·관계가 어긋나기 쉬운 충(沖)의 날'); }
  else if (uJi === dJi) { pts -= 4; reasons.push('같은 자리를 맴돌기 쉬운 날'); }

  // 사용자 오행 균형 보정 (있을 때만)
  if (userSaju.lac && JI_EL[dJi] === userSaju.lac) { pts += 6; reasons.push('부족한 기운이 채워지는 날'); }
  if (userSaju.dom && JI_EL[dJi] === userSaju.dom) { pts -= 4; }

  return { adj: pts, reasons };
}

// ── 점수 파이프라인 ─────────────────────────────────────────────
function epochDay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
function keyOfEpoch(e) {
  const dt = new Date(e * 86400000);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

const PEAK_BLOCK = 21;   // 21일마다 대길일 1회 보장
const TROUGH_BLOCK = 28; // 28일마다 흉일 1회 보장
export const LUCKY_THRESHOLD = 88;
export const UNLUCKY_THRESHOLD = 22;

// 블록 내 극단일 판정 — 그 블록에 "자연 발생" 극단일이 이미 있으면 승격/강등 생략
// (중복 승격으로 희소 빈도가 목표를 초과하는 것 방지 — 시뮬레이션으로 캘리브레이션됨)
function isBlockExtreme(userKey, dateKey, blockLen, salt, pickMax) {
  const e = epochDay(dateKey);
  const start = Math.floor(e / blockLen) * blockLen;
  let bestVal = pickMax ? -1 : 2;
  let bestE = -1;
  for (let i = 0; i < blockLen; i++) {
    const k = keyOfEpoch(start + i);
    const rNat = rand(userKey, k);
    if (pickMax ? rNat >= NATURAL_LUCKY_R : rNat < NATURAL_UNLUCKY_R) return false; // 자연 극단일 존재 → 보장 불필요
    // 반대편 자연 극단일은 승격/강등 후보에서 제외 (그 날을 골라버리면 블록 보장이 빠짐)
    if (pickMax ? rNat < NATURAL_UNLUCKY_R : rNat >= NATURAL_LUCKY_R) continue;
    const r = rand(userKey, k, salt);
    if (pickMax ? r > bestVal : r < bestVal) { bestVal = r; bestE = start + i; }
  }
  return bestE === e;
}

// 보정 전 점수 (연속 저점 규칙 제외 — 이웃 날짜 판단용, 재귀 없음)
function preScore(userKey, dateKey, userSaju) {
  const r = rand(userKey, dateKey);
  const noise = SCORE_CDF[Math.min(99, Math.floor(r * 100))];
  const { adj } = sajuDayRelation(userSaju, calcDayPillar(dateKey));
  let s = Math.round(noise + Math.max(-10, Math.min(10, adj * 0.25)));
  // 사주 가중은 구간 내부에서만: 대길/흉 임계값 교차는 CDF·블록 보장만이 결정 (희소 빈도 통제)
  if (noise < LUCKY_THRESHOLD) s = Math.min(s, LUCKY_THRESHOLD - 1);
  else s = Math.max(s, LUCKY_THRESHOLD); // 자연 대길일은 가중으로 강등되지 않음 (블록 보장 무결성)
  if (noise > UNLUCKY_THRESHOLD) s = Math.max(s, UNLUCKY_THRESHOLD + 1);
  else s = Math.min(s, UNLUCKY_THRESHOLD); // 자연 흉일도 가중으로 승급되지 않음
  // 승격/강등은 자연 극단일과 충돌 금지 (자연 흉일을 승격하거나 자연 대길일을 강등하면 블록 보장이 깨짐)
  if (noise > UNLUCKY_THRESHOLD && isBlockExtreme(userKey, dateKey, PEAK_BLOCK, '#peak', true)) {
    s = Math.max(s, LUCKY_THRESHOLD + Math.floor(r * (100 - LUCKY_THRESHOLD + 1)));
  } else if (noise < LUCKY_THRESHOLD && isBlockExtreme(userKey, dateKey, TROUGH_BLOCK, '#trough', false)) {
    s = Math.min(s, 15 + Math.floor(r * (UNLUCKY_THRESHOLD - 15 + 1)));
  }
  return Math.max(1, Math.min(100, s));
}

/** 오늘의 별숨 점수 (1~100) — 결정론적 */
export function getByeolsoomScore(userKey, dateKey, userSaju) {
  let s = preScore(userKey, dateKey, userSaju);
  // 저점 3일 연속 금지: 직전 2일이 모두 45 미만이면 오늘은 45 이상으로 회복
  if (s < 45) {
    const e = epochDay(dateKey);
    const y1 = preScore(userKey, keyOfEpoch(e - 1), userSaju);
    const y2 = preScore(userKey, keyOfEpoch(e - 2), userSaju);
    if (y1 < 45 && y2 < 45) s = 45 + Math.floor(rand(userKey, dateKey, '#recover') * 15);
  }
  return s;
}

export function getScoreLabel(score) {
  if (score >= LUCKY_THRESHOLD) return '대길일';
  if (score >= 80) return '좋은 날';
  if (score >= 65) return '순풍';
  if (score >= 45) return '보통';
  if (score >= 30) return '주의';
  if (score > UNLUCKY_THRESHOLD) return '저기압';
  return '기운이 낮은 날';
}

/**
 * 길일/흉일 이벤트 스캔 — "N일 만의" 카운트와 예고 배너 정보
 * @returns {{
 *   score, label, reasons,
 *   isLuckyToday, isUnluckyToday,
 *   daysSinceLucky, daysSinceUnlucky,
 *   nextLucky: {inDays, dateKey}|null, nextUnlucky: {inDays, dateKey}|null,
 *   banner: {type, text}|null
 * }}
 */
export function scanScoreEvents(userKey, todayKey, userSaju, { pastDays = 60, horizon = 7 } = {}) {
  const e = epochDay(todayKey);
  const score = getByeolsoomScore(userKey, todayKey, userSaju);
  const { reasons } = sajuDayRelation(userSaju, calcDayPillar(todayKey));
  const isLuckyToday = score >= LUCKY_THRESHOLD;
  const isUnluckyToday = score <= UNLUCKY_THRESHOLD;

  // 과거 역산: 직전 길일/흉일로부터 며칠 지났나
  let daysSinceLucky = null, daysSinceUnlucky = null;
  for (let i = 1; i <= pastDays; i++) {
    const s = getByeolsoomScore(userKey, keyOfEpoch(e - i), userSaju);
    if (daysSinceLucky === null && s >= LUCKY_THRESHOLD) daysSinceLucky = i;
    if (daysSinceUnlucky === null && s <= UNLUCKY_THRESHOLD) daysSinceUnlucky = i;
    if (daysSinceLucky !== null && daysSinceUnlucky !== null) break;
  }

  // 미래 스캔
  let nextLucky = null, nextUnlucky = null;
  for (let i = 1; i <= horizon; i++) {
    const k = keyOfEpoch(e + i);
    const s = getByeolsoomScore(userKey, k, userSaju);
    if (!nextLucky && s >= LUCKY_THRESHOLD) nextLucky = { inDays: i, dateKey: k };
    if (!nextUnlucky && s <= UNLUCKY_THRESHOLD) nextUnlucky = { inDays: i, dateKey: k };
  }

  // 배너 (우선순위: 오늘 길일 > 오늘 흉일 > 길일 D-1~D-3 > 흉일 D-1)
  let banner = null;
  const gapLucky = daysSinceLucky ?? pastDays;
  const gapUnlucky = daysSinceUnlucky ?? pastDays;
  if (isLuckyToday) {
    banner = { type: 'lucky-today', text: `오늘이에요 — ${gapLucky}일 만의 대길일, 점수 ${score}점 💫 미뤄둔 일을 움직일 날이에요` };
  } else if (isUnluckyToday) {
    banner = { type: 'unlucky-today', text: `오늘은 ${gapUnlucky}일 만에 기운이 낮은 날이에요. 큰 결정은 내일로 미루고, 액막이로 든든하게 보내세요 🛡️` };
  } else if (nextLucky && nextLucky.inDays === 1) {
    banner = { type: 'lucky-d1', text: `내일은 ${gapLucky + 1}일 만의 대길일! 중요한 약속은 내일로 옮겨보세요 🌟` };
  } else if (nextLucky && nextLucky.inDays <= 3) {
    banner = { type: 'lucky-soon', text: `${nextLucky.inDays}일 뒤, ${gapLucky + nextLucky.inDays}일 만의 대길일이 와요 ✨` };
  } else if (nextUnlucky && nextUnlucky.inDays === 1) {
    banner = { type: 'unlucky-d1', text: `내일은 기운이 낮은 날이에요. 중요한 일은 오늘 처리해두면 든든해요 🛡️` };
  }

  return {
    score, label: getScoreLabel(score), reasons,
    isLuckyToday, isUnluckyToday,
    daysSinceLucky, daysSinceUnlucky,
    nextLucky, nextUnlucky,
    banner,
  };
}

/** AI 프롬프트 주입용 컨텍스트 블록 생성 */
export function buildScoreContextBlock(events) {
  const { score, label, reasons, isLuckyToday, isUnluckyToday, daysSinceLucky, daysSinceUnlucky } = events;
  let block = `[오늘의 별숨 점수 — 반드시 이 값을 [점수] 태그에 그대로 사용, AI 자체 배정 절대 금지]\n점수: ${score} (${label})`;
  if (isLuckyToday && daysSinceLucky) block += `\n오늘은 ${daysSinceLucky}일 만의 대길일이에요 — [요약]과 전체 톤에 이 희소함을 반영하세요.`;
  if (isUnluckyToday && daysSinceUnlucky) block += `\n오늘은 ${daysSinceUnlucky}일 만에 기운이 낮은 날이에요 — 겁주지 말고 "쉬어가는 날" 프레임으로, 회복·휴식 중심으로 쓰세요.`;
  if (reasons.length) block += `\n사주 근거(서술에 자연스럽게 활용): ${reasons.join(' / ')}`;
  return block;
}
