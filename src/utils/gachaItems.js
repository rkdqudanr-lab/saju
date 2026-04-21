/**
 * gachaItems.js — 별숨 우주 가챠 아이템 체계
 *
 * 확장 전략:
 *   천체(body) × 속성(aspect) = 아이템
 *   → 천체 목록에 이름 하나 추가할 때마다 6개 아이템 자동 생성
 *
 * 등급:
 *   위성 (Satellite) — Common  65%  boost +5~+10
 *   행성 (Planet)    — Rare    25%  boost +12~+20
 *   은하 (Galaxy)    — Epic     8%  boost +25~+38
 *   성운 (Nebula)    — Legend   2%  boost +45~+65
 *
 * 합성:
 *   위성 3 → 행성  /  행성 3 → 은하  /  은하 3 → 성운
 */

// ─── 등급 설정 ────────────────────────────────────────────────
export const GRADE_CONFIG = {
  satellite: {
    label: '위성',
    color: '#9BADCE',
    bg: 'rgba(155,173,206,0.12)',
    border: 'rgba(155,173,206,0.35)',
    next: 'planet',
    synthCost: 3,
    boostRange: [5, 10],
  },
  planet: {
    label: '행성',
    color: '#7EC8A4',
    bg: 'rgba(126,200,164,0.14)',
    border: 'rgba(126,200,164,0.4)',
    next: 'galaxy',
    synthCost: 3,
    boostRange: [12, 20],
  },
  galaxy: {
    label: '은하',
    color: '#B48EF0',
    bg: 'rgba(180,142,240,0.15)',
    border: 'rgba(180,142,240,0.45)',
    next: 'nebula',
    synthCost: 3,
    boostRange: [25, 38],
  },
  nebula: {
    label: '성운',
    color: '#E8B048',
    bg: 'rgba(232,176,72,0.15)',
    border: 'rgba(232,176,72,0.5)',
    next: null,
    synthCost: null,
    boostRange: [45, 65],
  },
};

// ─── 속성(aspect) 설정 ────────────────────────────────────────
// 속성별 효과 텍스트 + 대표 이모지
const ASPECTS = {
  wealth:  { label: '재물',  emoji: '💰', effectTpl: (n) => `${n}의 재물 기운이 오늘의 금전·사업운을 밝혀요` },
  love:    { label: '인연',  emoji: '💫', effectTpl: (n) => `${n}의 인연 빛이 새로운 만남과 관계를 이어줘요` },
  health:  { label: '건강',  emoji: '✨', effectTpl: (n) => `${n}의 생명 에너지가 오늘의 활력을 충전해줘요` },
  wisdom:  { label: '지혜',  emoji: '🔮', effectTpl: (n) => `${n}의 빛이 통찰력과 판단력을 선명하게 해줘요` },
  luck:    { label: '행운',  emoji: '⭐', effectTpl: (n) => `${n}의 행운 파동이 뜻밖의 기회를 불러들여요` },
  harmony: { label: '균형',  emoji: '🌀', effectTpl: (n) => `${n}의 균형 에너지가 오늘 하루를 안정시켜줘요` },
};

// ─── 천체 카탈로그 ─────────────────────────────────────────────
// grade·emoji·lore만 정의하면 ASPECTS와 곱해져 아이템 자동 생성
// lore: 아이템 설명에 쓰이는 짧은 특징 문장

const BODY_CATALOG = {
  // ── 위성 (20종) ──────────────────────────────────────────────
  satellite: [
    { id: 'moon',      name: '달',       emoji: '🌙', lore: '지구를 품은 은빛 수호자' },
    { id: 'titan',     name: '타이탄',   emoji: '🪐', lore: '토성의 가장 큰 위성, 황금빛 대기를 품었어요' },
    { id: 'europa',    name: '유로파',   emoji: '🧊', lore: '목성의 얼음 위성, 신비로운 바다가 숨어 있어요' },
    { id: 'ganymede',  name: '가니메데', emoji: '🌑', lore: '태양계 최대 위성, 강한 자기장을 지녔어요' },
    { id: 'io',        name: '이오',     emoji: '🌋', lore: '끊임없이 불꽃을 내뿜는 목성의 화산 위성' },
    { id: 'callisto',  name: '칼리스토', emoji: '💠', lore: '오래된 충돌 흔적이 가득한 목성의 위성' },
    { id: 'enceladus', name: '엔셀라두스',emoji: '💧', lore: '토성의 위성, 얼음 아래에서 물기둥을 내뿜어요' },
    { id: 'mimas',     name: '미마스',   emoji: '⚪', lore: '데스스타를 닮은 신비로운 토성의 위성' },
    { id: 'triton',    name: '트리톤',   emoji: '🌊', lore: '해왕성을 역방향으로 공전하는 역동적인 위성' },
    { id: 'charon',    name: '카론',     emoji: '⚫', lore: '명왕성과 함께 춤추는 쌍성 위성' },
    { id: 'deimos',    name: '데이모스', emoji: '🌓', lore: '화성의 작은 위성, 두려움의 신에서 이름을 땄어요' },
    { id: 'phobos',    name: '포보스',   emoji: '🌒', lore: '화성과 점점 가까워지는 공포의 위성' },
    { id: 'oberon',    name: '오베론',   emoji: '🌘', lore: '천왕성의 위성, 요정왕의 이름을 지녔어요' },
    { id: 'titania',   name: '티타니아', emoji: '🌗', lore: '천왕성 최대 위성, 요정여왕의 이름을 지녔어요' },
    { id: 'ariel',     name: '아리엘',   emoji: '🌟', lore: '천왕성의 위성 중 가장 밝은 빛을 내요' },
    { id: 'miranda',   name: '미란다',   emoji: '🎭', lore: '천왕성의 작은 위성, 신기한 협곡을 품었어요' },
    { id: 'rhea',      name: '레아',     emoji: '🌫️', lore: '토성의 두 번째 큰 위성, 산소 대기를 지녔어요' },
    { id: 'tethys',    name: '테티스',   emoji: '🫧', lore: '물로 이루어진 것으로 보이는 토성의 위성' },
    { id: 'dione',     name: '디오네',   emoji: '🔷', lore: '토성의 위성, 트로이 소행성을 거느렸어요' },
    { id: 'hyperion',  name: '히페리온', emoji: '🧽', lore: '스펀지처럼 생긴 불규칙한 모양의 위성' },
  ],

  // ── 행성 (10종) ──────────────────────────────────────────────
  planet: [
    { id: 'mercury', name: '수성',   emoji: '☿',  lore: '가장 빠르게 달리는 태양계 첫 번째 행성' },
    { id: 'venus',   name: '금성',   emoji: '⭐',  lore: '새벽과 저녁을 밝히는 가장 밝은 행성' },
    { id: 'earth',   name: '지구',   emoji: '🌍',  lore: '생명과 에너지의 근원, 우리의 어머니 행성' },
    { id: 'mars',    name: '화성',   emoji: '🔴',  lore: '용기와 전진을 상징하는 붉은 전사의 행성' },
    { id: 'jupiter', name: '목성',   emoji: '🪐',  lore: '태양계의 왕, 강한 인력으로 소행성을 품어요' },
    { id: 'saturn',  name: '토성',   emoji: '💍',  lore: '황금 고리를 두른 태양계의 보석' },
    { id: 'uranus',  name: '천왕성', emoji: '🫐',  lore: '옆으로 누워 공전하는 독특한 얼음 행성' },
    { id: 'neptune', name: '해왕성', emoji: '🌀',  lore: '태양계 끝을 지키는 신비로운 푸른 행성' },
    { id: 'pluto',   name: '명왕성', emoji: '❄️',  lore: '작지만 강인한 기운을 품은 왜소행성' },
    { id: 'kepler22b', name: '케플러-22b', emoji: '🟢', lore: '태양을 닮은 별을 공전하는 슈퍼지구' },
  ],

  // ── 은하 (7종) ────────────────────────────────────────────────
  galaxy: [
    { id: 'andromeda',   name: '안드로메다',   emoji: '🌌', lore: '우리 은하와 마주 달려오는 가장 가까운 은하' },
    { id: 'milkyway',    name: '밀키웨이',     emoji: '✨', lore: '우리가 속한 나선 은하, 2천억 개의 별이 있어요' },
    { id: 'largeMagel',  name: '대마젤란 성운', emoji: '🌠', lore: '밀키웨이의 위성 은하, 새 별이 태어나는 곳' },
    { id: 'whirlpool',   name: '소용돌이 은하', emoji: '🌀', lore: '완벽한 나선 구조를 가진 아름다운 은하' },
    { id: 'sombrero',    name: '솜브레로 은하', emoji: '🎩', lore: '중심에 거대한 블랙홀을 품은 모자 모양의 은하' },
    { id: 'triangulum',  name: '삼각형 은하',  emoji: '🔺', lore: '로컬 그룹 세 번째 은하, 순수한 나선 구조' },
    { id: 'cartwheel',   name: '수레바퀴 은하', emoji: '⭕', lore: '충돌로 생겨난 극적인 고리 구조의 은하' },
  ],

  // ── 성운 (5종) ────────────────────────────────────────────────
  nebula: [
    { id: 'orion',      name: '오리온 성운',  emoji: '🔥', lore: '별이 태어나는 우주의 요람, 천문학의 상징' },
    { id: 'eagle',      name: '독수리 성운',  emoji: '🦅', lore: '"창조의 기둥"이 있는 생명력의 성운' },
    { id: 'crab',       name: '게 성운',      emoji: '💥', lore: '1054년 초신성 폭발의 잔해, 강렬한 에너지' },
    { id: 'helix',      name: '헬릭스 성운',  emoji: '👁️', lore: '"신의 눈"이라 불리는 신비로운 행성상 성운' },
    { id: 'pillars',    name: '창조의 기둥',  emoji: '🏛️', lore: '허블이 촬영한 가장 유명한 별 탄생의 현장' },
  ],
};

// ─── 아이템 자동 생성 ─────────────────────────────────────────
function buildItems() {
  const items = [];
  for (const [grade, bodies] of Object.entries(BODY_CATALOG)) {
    const cfg = GRADE_CONFIG[grade];
    const [minBoost, maxBoost] = cfg.boostRange;
    for (const body of bodies) {
      for (const [aspectKey, aspect] of Object.entries(ASPECTS)) {
        const boost = minBoost + Math.floor(Math.random() * (maxBoost - minBoost + 1));
        items.push({
          id: `${grade}_${body.id}_${aspectKey}`,
          grade,
          name: `${body.name}의 ${aspect.label}`,
          emoji: body.emoji,
          aspectEmoji: aspect.emoji,
          description: body.lore,
          effect: aspect.effectTpl(body.name),
          effectLabel: `${aspect.label}운 +${minBoost}~${maxBoost}`,
          boost: minBoost + Math.round((maxBoost - minBoost) / 2), // 표시용 고정값
          category: grade,
          bodyId: body.id,
          bodyName: body.name,
          aspectKey,
        });
      }
    }
  }
  return items;
}

export const GACHA_POOL = buildItems();

// 등급별 풀
const POOL_BY_GRADE = {
  satellite: GACHA_POOL.filter(i => i.grade === 'satellite'),
  planet:    GACHA_POOL.filter(i => i.grade === 'planet'),
  galaxy:    GACHA_POOL.filter(i => i.grade === 'galaxy'),
  nebula:    GACHA_POOL.filter(i => i.grade === 'nebula'),
};

// ─── 뽑기 확률 ────────────────────────────────────────────────
// satellite 65% / planet 25% / galaxy 8% / nebula 2%
export const PROB_TABLE = [
  { grade: 'satellite', prob: 65, label: '위성', color: GRADE_CONFIG.satellite.color },
  { grade: 'planet',    prob: 25, label: '행성', color: GRADE_CONFIG.planet.color },
  { grade: 'galaxy',    prob: 8,  label: '은하', color: GRADE_CONFIG.galaxy.color },
  { grade: 'nebula',    prob: 2,  label: '성운', color: GRADE_CONFIG.nebula.color },
];

function randomFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function gradeByRoll(r) {
  if (r < 2)  return 'nebula';
  if (r < 10) return 'galaxy';
  if (r < 35) return 'planet';
  return 'satellite';
}

/** 단일 뽑기 — guaranteedMin: 최소 등급 강제 */
export function pullOne(guaranteedMin = null) {
  const r = Math.random() * 100;
  let grade = gradeByRoll(r);

  // 최소 등급 보장
  const order = ['satellite', 'planet', 'galaxy', 'nebula'];
  if (guaranteedMin && order.indexOf(grade) < order.indexOf(guaranteedMin)) {
    grade = guaranteedMin;
  }

  return randomFrom(POOL_BY_GRADE[grade]);
}

/** 10연 뽑기 — 행성 이상 1개 보장, 2% 확률로 은하 1개 보장 */
export function pull10() {
  const results = [];
  for (let i = 0; i < 9; i++) results.push(pullOne());

  const hasPlanetPlus = results.some(i => i.grade === 'planet' || i.grade === 'galaxy' || i.grade === 'nebula');
  const hasGalaxyPlus = results.some(i => i.grade === 'galaxy' || i.grade === 'nebula');

  // 10번째: 행성 미보장이면 행성 보장, 이미 있으면 자유 뽑기
  const lastGuarantee = !hasPlanetPlus ? 'planet' : (Math.random() < 0.05 && !hasGalaxyPlus ? 'galaxy' : null);
  results.push(pullOne(lastGuarantee));

  // 셔플
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  return results;
}

/** 합성: grade의 다음 등급 아이템 반환 */
export function synthesize(grade) {
  const cfg = GRADE_CONFIG[grade];
  if (!cfg.next) return null;
  return randomFrom(POOL_BY_GRADE[cfg.next]);
}

/** ID로 풀에서 찾기 */
export function getGachaItem(id) {
  return GACHA_POOL.find(i => i.id === id) || null;
}

/** 등급 순서 (낮→높) */
export const GRADE_ORDER = ['satellite', 'planet', 'galaxy', 'nebula'];

/** 등급별 통계 정보 */
export function getGradeStats() {
  return Object.entries(POOL_BY_GRADE).map(([grade, items]) => ({
    grade,
    ...GRADE_CONFIG[grade],
    count: items.length,
    bodies: BODY_CATALOG[grade].length,
    aspects: Object.keys(ASPECTS).length,
  }));
}
