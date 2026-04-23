export const SANGSAENG = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
export const SANGGEUK  = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' };
export const REL_COLOR = { good: '#B4963C', caution: '#C47A48', bad: '#9B4EC4' };
export const REL_LABEL = { good: '좋은 별숨', caution: '주의 별숨', bad: '나쁜 별숨' };
export const OHAENG_COLOR = { 목: '#5FAD7A', 화: '#E06040', 토: '#C4A040', 금: '#A09EC4', 수: '#4A90D9' };
export const OHAENG_CHAR  = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };
export const BIRTH_HOURS = [
  '자시(23-1시)', '축시(1-3시)', '인시(3-5시)', '묘시(5-7시)', '진시(7-9시)', '사시(9-11시)',
  '오시(11-13시)', '미시(13-15시)', '신시(15-17시)', '유시(17-19시)', '술시(19-21시)', '해시(21-23시)',
];

export function getDaysInMonth(year, month) {
  if (!month) return 31;
  if (!year || String(year).length < 4) return 31;
  return new Date(parseInt(year), parseInt(month), 0).getDate();
}

export function genInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function pairScore(sajuA, sajuB) {
  if (!sajuA || !sajuB) return 50;
  const domA = sajuA.dom, domB = sajuB.dom;
  let score = 50;
  if (SANGSAENG[domA] === domB || SANGSAENG[domB] === domA) score += 15;
  else if (SANGGEUK[domA] === domB || SANGGEUK[domB] === domA) score -= 15;
  if (domA === domB) score += 5;
  const JJI_ORDER = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
  const idxA = JJI_ORDER.indexOf(sajuA.il?.j);
  const idxB = JJI_ORDER.indexOf(sajuB.il?.j);
  if (idxA !== -1 && idxB !== -1) {
    const diff = Math.abs(idxA - idxB);
    if (diff === 4 || diff === 8) score += 10;
  }
  return Math.max(20, Math.min(95, score));
}

export function relType(score) {
  if (score >= 70) return 'good';
  if (score >= 50) return 'caution';
  return 'bad';
}

export function roleOf(saju) {
  if (!saju) return '별님';
  const roles = { 목: '창의적인 리더', 화: '열정적인 추진자', 토: '든든한 조율자', 금: '분석적인 전략가', 수: '공감 능력자' };
  return roles[saju.dom] || '별님';
}

export function calcNodePositions(count, cx, cy, r) {
  if (count === 1) return [{ x: cx, y: cy }];
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i / count) - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

export function getCompatTier(score) {
  if (score >= 90) return { label: '환상의 티키타카', emoji: '✨', color: '#E8B048' };
  if (score >= 75) return { label: '천생연분에 가까운 두 별', emoji: '💫', color: '#B4963C' };
  if (score >= 60) return { label: '서로를 성장시키는 빛나는 인연', emoji: '🌱', color: '#5FAD7A' };
  if (score >= 45) return { label: '창과 방패 — 서로를 단단하게', emoji: '🛡️', color: '#7B9EC4' };
  if (score >= 30) return { label: '서로가 서로의 브레이크', emoji: '⚖️', color: '#C47A48' };
  return { label: '도전적이지만 성장하는 관계', emoji: '🔥', color: '#9B4EC4' };
}

export function calcNodeEnergy(members, pairs) {
  const totals = members.map(() => ({ sum: 0, count: 0 }));
  pairs.forEach((p) => {
    totals[p.idxA].sum += p.score; totals[p.idxA].count++;
    totals[p.idxB].sum += p.score; totals[p.idxB].count++;
  });
  return totals.map((t) => t.count ? Math.round(t.sum / t.count) : 50);
}

export function isValidBirthDate(y, m, d) {
  const year = parseInt(y, 10), month = parseInt(m, 10), day = parseInt(d, 10);
  if (!year || !month || !day) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  return day >= 1 && day <= new Date(year, month, 0).getDate();
}

export function stripMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^[-─━]+$/gm, '');
}

export function getGroupLocalKey(code) { return `byeolsoom_group_${code}`; }
