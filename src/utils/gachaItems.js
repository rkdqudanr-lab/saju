/**
 * gachaItems.js — 별숨 가챠 아이템 + 컬렉션 체계
 *
 * 구조: body × grade = 아이템 (body당 4등급 모두 존재)
 * 컬렉션: 같은 body의 일반/레어/영웅/전설 4개 보유 시 완성
 *
 * 등급 (우주):  satellite(일반) 65% / planet(레어) 25% / galaxy(영웅) 8% / nebula(전설) 2%
 * 등급 (사주):  ohaeng(일반)   65% / cheongan(레어) 25% / jiji(영웅)  8% / gapja(전설) 2%
 * 합성: 같은 등급 3개 → 다음 등급 1개
 */

// ─── 등급 설정 ─────────────────────────────────────────────────
export const GRADE_CONFIG = {
  satellite: { label: '일반', color: '#9BADCE', bg: 'rgba(155,173,206,0.12)', border: 'rgba(155,173,206,0.35)', next: 'planet',  synthCost: 3, boostRange: [0, 0] },
  planet:    { label: '레어', color: '#7EC8A4', bg: 'rgba(126,200,164,0.14)', border: 'rgba(126,200,164,0.40)', next: 'galaxy',  synthCost: 3, boostRange: [0, 0] },
  galaxy:    { label: '영웅', color: '#B48EF0', bg: 'rgba(180,142,240,0.15)', border: 'rgba(180,142,240,0.45)', next: 'nebula',  synthCost: 3, boostRange: [0, 0] },
  nebula:    { label: '전설', color: '#E8B048', bg: 'rgba(232,176,72,0.15)',  border: 'rgba(232,176,72,0.50)',  next: null,     synthCost: null, boostRange: [0, 0] },
};

export const SAJU_GRADE_CONFIG = {
  ohaeng:   { label: '일반', color: '#82C988', bg: 'rgba(130,201,136,0.12)', border: 'rgba(130,201,136,0.35)', next: 'cheongan', synthCost: 3, boostRange: [0, 0] },
  cheongan: { label: '레어', color: '#7BA4D4', bg: 'rgba(123,164,212,0.14)', border: 'rgba(123,164,212,0.40)', next: 'jiji',     synthCost: 3, boostRange: [0, 0] },
  jiji:     { label: '영웅', color: '#D4A56A', bg: 'rgba(212,165,106,0.15)', border: 'rgba(212,165,106,0.42)', next: 'gapja',    synthCost: 3, boostRange: [0, 0] },
  gapja:    { label: '전설', color: '#E8B048', bg: 'rgba(232,176,72,0.15)',  border: 'rgba(232,176,72,0.50)',  next: null,       synthCost: null, boostRange: [0, 0] },
};

export const GRADE_ORDER      = ['satellite', 'planet', 'galaxy', 'nebula'];
export const SAJU_GRADE_ORDER = ['ohaeng', 'cheongan', 'jiji', 'gapja'];

// ─── 속성 (컬렉션 완성도 관계 없음, 풍미 텍스트용) ─────────────
export const ASPECTS = {
  overall: { label: '종합',  emoji: '🌟', effectTpl: (n) => `${n}의 기운이 오늘의 전반적인 운세를 높여요` },
  wealth:  { label: '재물',  emoji: '💰', effectTpl: (n) => `${n}의 기운이 금전·사업운을 밝혀요` },
  love:    { label: '애정',  emoji: '💫', effectTpl: (n) => `${n}의 빛이 새로운 인연을 이어줘요` },
  career:  { label: '직장',  emoji: '👑', effectTpl: (n) => `${n}의 권위가 업무 성과를 높여줘요` },
  study:   { label: '학업',  emoji: '📚', effectTpl: (n) => `${n}의 지혜가 집중력을 선명하게 해줘요` },
  health:  { label: '건강',  emoji: '✨', effectTpl: (n) => `${n}의 에너지가 오늘의 활력을 충전해요` },
  social:  { label: '대인',  emoji: '🤝', effectTpl: (n) => `${n}의 조화된 파동이 귀인 만남을 도와요` },
  travel:  { label: '이동',  emoji: '🚀', effectTpl: (n) => `${n}의 역동적인 힘이 이동 중 안전을 지켜요` },
  create:  { label: '창의',  emoji: '🎨', effectTpl: (n) => `${n}의 기운이 영감과 표현력을 깨워요` },
};

// 등급별 고정 속성 (우주/사주 공통 → 풍미 텍스트 결정)
const COSMIC_GRADE_ASPECT = { satellite: 'overall', planet: 'wealth', galaxy: 'love', nebula: 'career' };
const SAJU_GRADE_ASPECT   = { ohaeng: 'overall', cheongan: 'study', jiji: 'health', gapja: 'career' };

// ─── 천체 카탈로그 (12종 · 각 4등급) ──────────────────────────
const COSMIC_BODY_DEFS = [
  { id: 'moon',      name: '달',       emoji: '🌙', lore: '지구를 품은 은빛 수호자, 감정과 직관을 다스려요' },
  { id: 'sun',       name: '태양',     emoji: '☀️', lore: '모든 빛의 근원, 생명력과 자신감의 별이에요' },
  { id: 'jupiter',   name: '목성',     emoji: '🪐', lore: '태양계의 왕, 강한 인력으로 풍요를 품어요' },
  { id: 'saturn',    name: '토성',     emoji: '💍', lore: '황금 고리를 두른 태양계의 보석이에요' },
  { id: 'mars',      name: '화성',     emoji: '🔴', lore: '용기와 전진을 상징하는 붉은 전사의 별이에요' },
  { id: 'venus',     name: '금성',     emoji: '⭐', lore: '새벽과 저녁을 밝히는 가장 밝은 행성이에요' },
  { id: 'mercury',   name: '수성',     emoji: '☿',  lore: '가장 빠르게 달리는 첫 번째 행성이에요' },
  { id: 'andromeda', name: '안드로메다', emoji: '🌌', lore: '우리 은하를 향해 달려오는 가장 가까운 은하' },
  { id: 'orion',     name: '오리온',   emoji: '🔥', lore: '별이 태어나는 우주의 요람, 천문학의 상징이에요' },
  { id: 'polaris',   name: '북극성',   emoji: '🌟', lore: '흔들리지 않는 길잡이, 방향의 별이에요' },
  { id: 'sirius',    name: '시리우스', emoji: '💫', lore: '밤하늘에서 가장 밝게 빛나는 별이에요' },
  { id: 'milkyway',  name: '밀키웨이', emoji: '✨', lore: '2천억 개의 별이 흐르는 우리의 은하예요' },
];

// ─── 사주 카탈로그 (10종 · 각 4등급) ─────────────────────────
const SAJU_BODY_DEFS = [
  { id: 'saju_mok',   name: '木(목)',     emoji: '🌿', lore: '성장과 생명력, 봄의 기운을 품은 오행이에요' },
  { id: 'saju_hwa',   name: '火(화)',     emoji: '🔥', lore: '열정과 빛, 여름의 기운을 품은 오행이에요' },
  { id: 'saju_to',    name: '土(토)',     emoji: '🌍', lore: '안정과 포용, 환절기의 기운을 품은 오행이에요' },
  { id: 'saju_geum',  name: '金(금)',     emoji: '⚡', lore: '결단과 정의, 가을의 기운을 품은 오행이에요' },
  { id: 'saju_su',    name: '水(수)',     emoji: '💧', lore: '지혜와 유연함, 겨울의 기운을 품은 오행이에요' },
  { id: 'saju_gap',   name: '甲(갑)',     emoji: '🌱', lore: '큰 나무처럼 곧고 강인한 의지의 기운이에요' },
  { id: 'saju_eul',   name: '乙(을)',     emoji: '🍃', lore: '넝쿨처럼 유연하게 뻗어가는 기운이에요' },
  { id: 'saju_ja',    name: '子(자)',     emoji: '🐭', lore: '한밤중의 쥐처럼 민첩하고 영리한 기운이에요' },
  { id: 'saju_myo',   name: '卯(묘)',     emoji: '🐰', lore: '봄날의 토끼처럼 유연하고 민첩한 기운이에요' },
  { id: 'saju_gapja', name: '甲子(갑자)', emoji: '🌟', lore: '60년 주기의 첫 번째, 새로운 시작의 기운이에요' },
];

// ─── 아이템 생성 ────────────────────────────────────────────────
function buildCosmicItems() {
  return COSMIC_BODY_DEFS.flatMap((body) =>
    GRADE_ORDER.map((grade) => {
      const aspectKey = COSMIC_GRADE_ASPECT[grade];
      const aspect = ASPECTS[aspectKey];
      return {
        id: `${body.id}_${grade}`,
        grade,
        system: 'cosmic',
        name: `${body.name} [${GRADE_CONFIG[grade].label}]`,
        emoji: body.emoji,
        aspectEmoji: aspect.emoji,
        description: body.lore,
        effect: aspect.effectTpl(body.name),
        effectLabel: aspect.label,
        boost: 0,
        category: grade,
        bodyId: body.id,
        bodyName: body.name,
        aspectKey,
        seriesId: body.id,
      };
    })
  );
}

function buildSajuItems() {
  return SAJU_BODY_DEFS.flatMap((body) =>
    SAJU_GRADE_ORDER.map((grade) => {
      const aspectKey = SAJU_GRADE_ASPECT[grade];
      const aspect = ASPECTS[aspectKey];
      return {
        id: `${body.id}_${grade}`,
        grade,
        system: 'saju',
        name: `${body.name} [${SAJU_GRADE_CONFIG[grade].label}]`,
        emoji: body.emoji,
        aspectEmoji: aspect.emoji,
        description: body.lore,
        effect: aspect.effectTpl(body.name),
        effectLabel: aspect.label,
        boost: 0,
        category: grade,
        bodyId: body.id,
        bodyName: body.name,
        aspectKey,
        seriesId: body.id,
      };
    })
  );
}

export const GACHA_POOL = buildCosmicItems();
export const SAJU_POOL  = buildSajuItems();
export const ALL_GACHA_POOL = [...GACHA_POOL, ...SAJU_POOL];

// 오늘의 인연 오브제 — userId + today 기반 결정론적 선택
export function getDailyResonanceItem({ system = 'cosmic', userId = 'guest', today = '' }) {
  const pool = system === 'saju' ? SAJU_POOL : GACHA_POOL;
  if (!pool.length) return null;
  const seed = String(userId) + String(today);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const item = pool[hash % pool.length];
  return { ...item, resonanceAxis: item.aspectKey };
}

// ─── 컬렉션 정의 ────────────────────────────────────────────────
export const COLLECTION_DEFS = [
  ...COSMIC_BODY_DEFS.map((body) => ({
    id: body.id,
    name: `${body.name} 컬렉션`,
    system: 'cosmic',
    emoji: body.emoji,
    description: body.lore,
    requiredIds: GRADE_ORDER.map((g) => `${body.id}_${g}`),
    reward: { bp: 50, title: `${body.name}의 기운을 담은 자` },
  })),
  ...SAJU_BODY_DEFS.map((body) => ({
    id: body.id,
    name: `${body.name} 컬렉션`,
    system: 'saju',
    emoji: body.emoji,
    description: body.lore,
    requiredIds: SAJU_GRADE_ORDER.map((g) => `${body.id}_${g}`),
    reward: { bp: 50, title: `${body.name}의 기운을 담은 자` },
  })),
];

// ─── 뽑기 확률표 ────────────────────────────────────────────────
export const PROB_TABLE = [
  { grade: 'satellite', prob: 65, label: '일반', color: GRADE_CONFIG.satellite.color },
  { grade: 'planet',    prob: 25, label: '레어', color: GRADE_CONFIG.planet.color },
  { grade: 'galaxy',    prob: 8,  label: '영웅', color: GRADE_CONFIG.galaxy.color },
  { grade: 'nebula',    prob: 2,  label: '전설', color: GRADE_CONFIG.nebula.color },
];

export const SAJU_PROB_TABLE = [
  { grade: 'ohaeng',   prob: 65, label: '일반', color: SAJU_GRADE_CONFIG.ohaeng.color },
  { grade: 'cheongan', prob: 25, label: '레어', color: SAJU_GRADE_CONFIG.cheongan.color },
  { grade: 'jiji',     prob: 8,  label: '영웅', color: SAJU_GRADE_CONFIG.jiji.color },
  { grade: 'gapja',    prob: 2,  label: '전설', color: SAJU_GRADE_CONFIG.gapja.color },
];

// ─── 등급별 풀 ─────────────────────────────────────────────────
const COSMIC_BY_GRADE = Object.fromEntries(GRADE_ORDER.map((g) => [g, GACHA_POOL.filter((i) => i.grade === g)]));
const SAJU_BY_GRADE   = Object.fromEntries(SAJU_GRADE_ORDER.map((g) => [g, SAJU_POOL.filter((i) => i.grade === g)]));

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function cosmicGradeByRoll(r) {
  if (r < 2)  return 'nebula';
  if (r < 10) return 'galaxy';
  if (r < 35) return 'planet';
  return 'satellite';
}

function sajuGradeByRoll(r) {
  if (r < 2)  return 'gapja';
  if (r < 10) return 'jiji';
  if (r < 35) return 'cheongan';
  return 'ohaeng';
}

// ─── 접두사 (Affix) 시스템 ─────────────────────────────────────
export const AFFIXES = [
  { id: 'ancient',    label: '오래된',   multiplier: 0.8, prob: 20, color: '#A0A0A0' },
  { id: 'normal',     label: '',         multiplier: 1.0, prob: 60, color: '' },
  { id: 'shining',    label: '빛나는',   multiplier: 1.2, prob: 15, color: '#FFFFAA' },
  { id: 'resonating', label: '공명하는', multiplier: 1.5, prob: 5,  color: '#FFCC00' },
];

export function applyAffix(item, forceAffixId = null) {
  if (!item) return null;
  let affix = AFFIXES[1];
  if (forceAffixId) {
    affix = AFFIXES.find((a) => a.id === forceAffixId) || affix;
  } else {
    const r = Math.random() * 100;
    let acc = 0;
    for (const a of AFFIXES) { acc += a.prob; if (r < acc) { affix = a; break; } }
  }
  if (affix.id === 'normal') return item;
  return {
    ...item,
    id: `${item.id}::${affix.id}`,
    name: `${affix.label} ${item.name}`,
    affixColor: affix.color,
  };
}

// ─── 뽑기 함수 ─────────────────────────────────────────────────
export function pullOne(guaranteedMin = null) {
  const r = Math.random() * 100;
  let grade = cosmicGradeByRoll(r);
  if (guaranteedMin && GRADE_ORDER.indexOf(grade) < GRADE_ORDER.indexOf(guaranteedMin)) grade = guaranteedMin;
  return applyAffix(randomFrom(COSMIC_BY_GRADE[grade]));
}

export function pull10() {
  const results = [];
  for (let i = 0; i < 9; i++) results.push(pullOne());
  const hasPlanetPlus = results.some((i) => ['planet', 'galaxy', 'nebula'].includes(i.grade));
  const hasGalaxyPlus = results.some((i) => ['galaxy', 'nebula'].includes(i.grade));
  const guarantee = !hasPlanetPlus ? 'planet' : (Math.random() < 0.05 && !hasGalaxyPlus ? 'galaxy' : null);
  results.push(pullOne(guarantee));
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  return results;
}

export function pullOneSaju(guaranteedMin = null) {
  const r = Math.random() * 100;
  let grade = sajuGradeByRoll(r);
  if (guaranteedMin && SAJU_GRADE_ORDER.indexOf(grade) < SAJU_GRADE_ORDER.indexOf(guaranteedMin)) grade = guaranteedMin;
  return applyAffix(randomFrom(SAJU_BY_GRADE[grade]));
}

export function pull10Saju() {
  const results = [];
  for (let i = 0; i < 9; i++) results.push(pullOneSaju());
  const hasCheonganPlus = results.some((i) => ['cheongan', 'jiji', 'gapja'].includes(i.grade));
  const hasJijiPlus     = results.some((i) => ['jiji', 'gapja'].includes(i.grade));
  const guarantee = !hasCheonganPlus ? 'cheongan' : (Math.random() < 0.05 && !hasJijiPlus ? 'jiji' : null);
  results.push(pullOneSaju(guarantee));
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  return results;
}

// ─── 합성 ─────────────────────────────────────────────────────
export function synthesize(grade) {
  const cfg = GRADE_CONFIG[grade];
  if (!cfg?.next) return null;
  return randomFrom(COSMIC_BY_GRADE[cfg.next]) || null;
}

export function synthesizeSaju(grade) {
  const cfg = SAJU_GRADE_CONFIG[grade];
  if (!cfg?.next) return null;
  return randomFrom(SAJU_BY_GRADE[cfg.next]) || null;
}

// ─── 아이템 조회 ───────────────────────────────────────────────
const POOL_MAP = new Map(ALL_GACHA_POOL.map((i) => [i.id, i]));

export function findItem(rawId) {
  if (!rawId) return null;
  const [baseId, affixId] = String(rawId).split('::');
  const base = POOL_MAP.get(baseId);
  if (base) return applyAffix(base, affixId || 'normal');
  // 레거시 ID 호환 (구형 형식: satellite_moon_overall 등)
  const fallback = ALL_GACHA_POOL.find((i) => baseId.includes(i.bodyId)) || null;
  if (fallback) return applyAffix(fallback, affixId || 'normal');
  return null;
}

export function getGachaItem(id) { return findItem(id); }
export function getSajuItem(id)  { return findItem(id); }

// 레거시 호환 export (일부 파일이 이 이름으로 참조)
export const GRADE_ORDER_LEGACY  = GRADE_ORDER;
export const SAJU_GRADE_ORDER_LEGACY = SAJU_GRADE_ORDER;
