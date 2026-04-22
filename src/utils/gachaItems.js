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
  overall: { label: '종합',  emoji: '🌟', effectTpl: (n) => `${n}의 기운이 오늘의 전반적인 행운을 끌어올려요` },
  wealth:  { label: '재물',  emoji: '💰', effectTpl: (n) => `${n}의 재물 기운이 오늘의 금전·사업운을 밝혀요` },
  love:    { label: '애정',  emoji: '💫', effectTpl: (n) => `${n}의 빛이 새로운 인연과 관계를 이어줘요` },
  career:  { label: '직장',  emoji: '👑', effectTpl: (n) => `${n}의 권위가 업무 성과와 인정받는 힘을 높여줘요` },
  study:   { label: '학업',  emoji: '📚', effectTpl: (n) => `${n}의 지혜가 집중력과 통찰력을 선명하게 해줘요` },
  health:  { label: '건강',  emoji: '✨', effectTpl: (n) => `${n}의 생명 에너지가 오늘의 활력을 충전해줘요` },
  social:  { label: '대인',  emoji: '🤝', effectTpl: (n) => `${n}의 조화된 파동이 새로운 귀인과의 만남을 도와줘요` },
  travel:  { label: '이동',  emoji: '🚀', effectTpl: (n) => `${n}의 역동적인 힘이 이동과 여행 중의 안전을 책임져요` },
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
      items.push({
        id: `${grade}_${body.id}_create`,
        grade,
        name: `${body.name}의 창의`,
        emoji: body.emoji,
        aspectEmoji: '🎨',
        description: body.lore,
        effect: `${body.name}의 창의 기운이 오늘의 영감과 표현력을 깨워줘요`,
        effectLabel: `창의운 +${minBoost}~${maxBoost}`,
        boost: minBoost + Math.round((maxBoost - minBoost) / 2),
        category: grade,
        bodyId: body.id,
        bodyName: body.name,
        aspectKey: 'create',
      });
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

  const baseItem = randomFrom(POOL_BY_GRADE[grade]);
  return applyAffix(baseItem);
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

// ═══════════════════════════════════════════════════════════════
//  ☯️  사주 뽑기 시스템
//  확장 전략: 천체(body) × 속성(aspect) 동일 구조
//  오행 5 × 6 = 30  /  천간 10 × 6 = 60
//  지지 12 × 6 = 72  /  육십갑자 12 × 6 = 72  합계 234종
// ═══════════════════════════════════════════════════════════════

export const SAJU_GRADE_CONFIG = {
  ohaeng: {
    label: '오행',
    color: '#82C988',
    bg: 'rgba(130,201,136,0.12)',
    border: 'rgba(130,201,136,0.35)',
    next: 'cheongan',
    synthCost: 3,
    boostRange: [5, 10],
  },
  cheongan: {
    label: '천간',
    color: '#7BA4D4',
    bg: 'rgba(123,164,212,0.14)',
    border: 'rgba(123,164,212,0.4)',
    next: 'jiji',
    synthCost: 3,
    boostRange: [12, 20],
  },
  jiji: {
    label: '지지',
    color: '#D4A56A',
    bg: 'rgba(212,165,106,0.15)',
    border: 'rgba(212,165,106,0.42)',
    next: 'gapja',
    synthCost: 3,
    boostRange: [25, 38],
  },
  gapja: {
    label: '육십갑자',
    color: '#E8B048',
    bg: 'rgba(232,176,72,0.15)',
    border: 'rgba(232,176,72,0.5)',
    next: null,
    synthCost: null,
    boostRange: [45, 65],
  },
};

export const SAJU_GRADE_ORDER = ['ohaeng', 'cheongan', 'jiji', 'gapja'];

// ─── 사주 천체 카탈로그 ────────────────────────────────────────
const SAJU_BODY_CATALOG = {
  // ── 오행 (5종) ────────────────────────────────────────────────
  ohaeng: [
    { id: 'mok',  name: '목(木)', emoji: '🌿', lore: '성장과 생명력, 봄의 기운을 품은 오행이에요' },
    { id: 'hwa',  name: '화(火)', emoji: '🔥', lore: '열정과 빛, 여름의 기운을 품은 오행이에요' },
    { id: 'to',   name: '토(土)', emoji: '🌍', lore: '안정과 포용, 환절기의 기운을 품은 오행이에요' },
    { id: 'geum', name: '금(金)', emoji: '⚡', lore: '결단과 정의, 가을의 기운을 품은 오행이에요' },
    { id: 'su',   name: '수(水)', emoji: '💧', lore: '지혜와 유연함, 겨울의 기운을 품은 오행이에요' },
  ],
  // ── 천간 (10종) ───────────────────────────────────────────────
  cheongan: [
    { id: 'gap',  name: '갑(甲)', emoji: '🌱', lore: '큰 나무처럼 곧고 강인한 의지의 기운' },
    { id: 'eul',  name: '을(乙)', emoji: '🍃', lore: '부드러운 넝쿨처럼 유연하게 뻗어가는 기운' },
    { id: 'byeong', name: '병(丙)', emoji: '☀️', lore: '태양처럼 밝고 따뜻하게 빛나는 기운' },
    { id: 'jeong',  name: '정(丁)', emoji: '🕯️', lore: '촛불처럼 은은하고 섬세하게 타오르는 기운' },
    { id: 'mu',   name: '무(戊)', emoji: '🏔️', lore: '높은 산처럼 듬직하고 안정적인 기운' },
    { id: 'gi',   name: '기(己)', emoji: '🌾', lore: '비옥한 들판처럼 풍요롭고 수용적인 기운' },
    { id: 'gyeong', name: '경(庚)', emoji: '⚔️', lore: '번쩍이는 검처럼 날카롭고 결단력 있는 기운' },
    { id: 'sin',  name: '신(辛)', emoji: '💿', lore: '세공된 보석처럼 정밀하고 빛나는 기운' },
    { id: 'im',   name: '임(壬)', emoji: '🌊', lore: '깊고 넓은 바다처럼 포용력 있는 기운' },
    { id: 'gye',  name: '계(癸)', emoji: '🌧️', lore: '봄비처럼 부드럽고 생명을 키우는 기운' },
  ],
  // ── 지지 (12종) ───────────────────────────────────────────────
  jiji: [
    { id: 'ja',   name: '자(子)', emoji: '🐭', lore: '한밤중의 쥐처럼 민첩하고 영리한 기운' },
    { id: 'chuk', name: '축(丑)', emoji: '🐮', lore: '소처럼 성실하고 묵묵히 나아가는 기운' },
    { id: 'in',   name: '인(寅)', emoji: '🐯', lore: '새벽의 호랑이처럼 용감하고 당당한 기운' },
    { id: 'myo',  name: '묘(卯)', emoji: '🐰', lore: '봄날의 토끼처럼 유연하고 민첩한 기운' },
    { id: 'jin',  name: '진(辰)', emoji: '🐲', lore: '하늘을 나는 용처럼 신비롭고 변화무쌍한 기운' },
    { id: 'sa',   name: '사(巳)', emoji: '🐍', lore: '지혜로운 뱀처럼 깊고 통찰력 있는 기운' },
    { id: 'o',    name: '오(午)', emoji: '🐴', lore: '달리는 말처럼 역동적이고 자유로운 기운' },
    { id: 'mi',   name: '미(未)', emoji: '🐑', lore: '온화한 양처럼 평화롭고 예술적인 기운' },
    { id: 'sin2', name: '신(申)', emoji: '🐒', lore: '재주 많은 원숭이처럼 영리하고 적응력 있는 기운' },
    { id: 'yu',   name: '유(酉)', emoji: '🐓', lore: '새벽을 알리는 닭처럼 정확하고 성실한 기운' },
    { id: 'sul',  name: '술(戌)', emoji: '🐕', lore: '충직한 개처럼 의리 있고 보호적인 기운' },
    { id: 'hae',  name: '해(亥)', emoji: '🐗', lore: '풍요로운 돼지처럼 복을 부르는 기운' },
  ],
  // ── 육십갑자 특선 (12종) ─────────────────────────────────────
  gapja: [
    { id: 'gapja',   name: '갑자(甲子)', emoji: '🌟', lore: '60년 주기의 첫 번째, 모든 새로운 시작의 기운' },
    { id: 'gapoh',   name: '갑오(甲午)', emoji: '🌿', lore: '목과 화가 만나 강렬한 창조력을 발산하는 기운' },
    { id: 'byeongoh',name: '병오(丙午)', emoji: '☀️', lore: '화기운이 두 겹으로 빛나는, 태양 중의 태양 기운' },
    { id: 'muoh',    name: '무오(戊午)', emoji: '🏔️', lore: '대지와 태양의 만남, 굳건한 번영의 기운' },
    { id: 'gyeongoh',name: '경오(庚午)', emoji: '⚡', lore: '금의 결단과 화의 열정이 만난 역동적 기운' },
    { id: 'imja',    name: '임자(壬子)', emoji: '🌊', lore: '수기운이 두 겹으로 흐르는, 깊은 지혜의 기운' },
    { id: 'gapin',   name: '갑인(甲寅)', emoji: '🌱', lore: '목기운이 두 겹으로 피어나는 힘찬 생명력의 기운' },
    { id: 'gyeongsin',name: '경신(庚申)', emoji: '💎', lore: '금기운이 두 겹으로 빛나는 날카로운 명철함의 기운' },
    { id: 'imsul',   name: '임술(壬戌)', emoji: '🌙', lore: '수와 토의 신비로운 조화, 깊은 내면의 기운' },
    { id: 'gapsul',  name: '갑술(甲戌)', emoji: '🌲', lore: '목의 의지와 토의 안정이 만난 든든한 기운' },
    { id: 'muja',    name: '무자(戊子)', emoji: '⚖️', lore: '토와 수의 음양이 완벽하게 조화를 이룬 기운' },
    { id: 'byeongja',name: '병자(丙子)', emoji: '❄️', lore: '화와 수의 역동적 대치에서 피어나는 극한의 기운' },
  ],
};

// ─── 사주 속성 (우주와 동일한 6가지) ─────────────────────────
const SAJU_ASPECTS = {
  overall: { label: '종합',  emoji: '🌟', effectTpl: (n) => `${n}의 기운이 오늘의 전반적인 운세를 끌어올려요` },
  wealth:  { label: '재물',  emoji: '💰', effectTpl: (n) => `${n}의 기운이 오늘의 금전·사업운을 밝혀요` },
  love:    { label: '애정',  emoji: '💫', effectTpl: (n) => `${n}의 기운이 새로운 연인과 관계를 이어줘요` },
  career:  { label: '직장',  emoji: '👑', effectTpl: (n) => `${n}의 기운이 업무 성과와 인정받는 힘을 높여줘요` },
  study:   { label: '학업',  emoji: '📚', effectTpl: (n) => `${n}의 기운이 집중력과 통찰력을 선명하게 해줘요` },
  health:  { label: '건강',  emoji: '✨', effectTpl: (n) => `${n}의 기운이 오늘의 활력을 충전해줘요` },
  social:  { label: '대인',  emoji: '🤝', effectTpl: (n) => `${n}의 조화로운 기운이 새로운 귀인과의 만남을 도와줘요` },
  travel:  { label: '이동',  emoji: '🚀', effectTpl: (n) => `${n}의 역동적인 기운이 이동과 여행 중의 안전을 책임져요` },
};

// ─── 사주 아이템 자동 생성 ────────────────────────────────────
function buildSajuItems() {
  const items = [];
  for (const [grade, bodies] of Object.entries(SAJU_BODY_CATALOG)) {
    const cfg = SAJU_GRADE_CONFIG[grade];
    const [minBoost, maxBoost] = cfg.boostRange;
    for (const body of bodies) {
      for (const [aspectKey, aspect] of Object.entries(SAJU_ASPECTS)) {
        items.push({
          id: `saju_${grade}_${body.id}_${aspectKey}`,
          grade,
          system: 'saju', // 우주 아이템과 구분
          name: `${body.name}의 ${aspect.label}`,
          emoji: body.emoji,
          aspectEmoji: aspect.emoji,
          description: body.lore,
          effect: aspect.effectTpl(body.name),
          effectLabel: `${aspect.label}운 +${minBoost}~${maxBoost}`,
          boost: minBoost + Math.round((maxBoost - minBoost) / 2),
          category: grade,
          bodyId: body.id,
          bodyName: body.name,
          aspectKey,
        });
      }
      items.push({
        id: `saju_${grade}_${body.id}_create`,
        grade,
        system: 'saju',
        name: `${body.name}의 창의`,
        emoji: body.emoji,
        aspectEmoji: '🎨',
        description: body.lore,
        effect: `${body.name}의 기운이 오늘의 창의력과 발상력을 깨워줘요`,
        effectLabel: `창의운 +${minBoost}~${maxBoost}`,
        boost: minBoost + Math.round((maxBoost - minBoost) / 2),
        category: grade,
        bodyId: body.id,
        bodyName: body.name,
        aspectKey: 'create',
      });
    }
  }
  return items;
}

export const SAJU_POOL = buildSajuItems();

// 사주 등급별 풀
const SAJU_POOL_BY_GRADE = {
  ohaeng:  SAJU_POOL.filter(i => i.grade === 'ohaeng'),
  cheongan: SAJU_POOL.filter(i => i.grade === 'cheongan'),
  jiji:    SAJU_POOL.filter(i => i.grade === 'jiji'),
  gapja:   SAJU_POOL.filter(i => i.grade === 'gapja'),
};

export const SAJU_PROB_TABLE = [
  { grade: 'ohaeng',   prob: 65, label: '오행',     color: SAJU_GRADE_CONFIG.ohaeng.color },
  { grade: 'cheongan', prob: 25, label: '천간',     color: SAJU_GRADE_CONFIG.cheongan.color },
  { grade: 'jiji',     prob: 8,  label: '지지',     color: SAJU_GRADE_CONFIG.jiji.color },
  { grade: 'gapja',    prob: 2,  label: '육십갑자', color: SAJU_GRADE_CONFIG.gapja.color },
];

function sajuGradeByRoll(r) {
  if (r < 2)  return 'gapja';
  if (r < 10) return 'jiji';
  if (r < 35) return 'cheongan';
  return 'ohaeng';
}

/** 사주 단일 뽑기 */
export function pullOneSaju(guaranteedMin = null) {
  const r = Math.random() * 100;
  let grade = sajuGradeByRoll(r);
  if (guaranteedMin && SAJU_GRADE_ORDER.indexOf(grade) < SAJU_GRADE_ORDER.indexOf(guaranteedMin)) {
    grade = guaranteedMin;
  }
  const baseItem = randomFrom(SAJU_POOL_BY_GRADE[grade]);
  return applyAffix(baseItem);
}

/** 사주 10연 뽑기 — 천간 이상 1개 보장 */
export function pull10Saju() {
  const results = [];
  for (let i = 0; i < 9; i++) results.push(pullOneSaju());
  const hasCheongganPlus = results.some(i => ['cheongan','jiji','gapja'].includes(i.grade));
  const hasJijiPlus      = results.some(i => ['jiji','gapja'].includes(i.grade));
  const lastGuarantee = !hasCheongganPlus ? 'cheongan' : (Math.random() < 0.05 && !hasJijiPlus ? 'jiji' : null);
  results.push(pullOneSaju(lastGuarantee));
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  return results;
}

/** 사주 합성 */
export function synthesizeSaju(grade) {
  const cfg = SAJU_GRADE_CONFIG[grade];
  if (!cfg.next) return null;
  return randomFrom(SAJU_POOL_BY_GRADE[cfg.next]);
}

/** ID로 사주 아이템 찾기 */
export function getSajuItem(id) {
  return SAJU_POOL.find(i => i.id === id) || null;
}

/** 통합 풀 */
export const ALL_GACHA_POOL = [...GACHA_POOL, ...SAJU_POOL];

// ═══════════════════════════════════════════════════════════════
//  💎  접두사 (Affix) 시스템
// ═══════════════════════════════════════════════════════════════

export const AFFIXES = [
  { id: 'ancient',    label: '오래된',   multiplier: 0.8, prob: 20, color: '#A0A0A0' },
  { id: 'normal',     label: '',         multiplier: 1.0, prob: 60, color: '' },
  { id: 'shining',    label: '빛나는',   multiplier: 1.2, prob: 15, color: '#FFFFAA' },
  { id: 'resonating', label: '공명하는', multiplier: 1.5, prob: 5,  color: '#FFCC00' }
];

export function applyAffix(item, forceAffixId = null) {
  if (!item) return null;
  let affix = AFFIXES[1]; // default: normal
  
  if (forceAffixId) {
    affix = AFFIXES.find(a => a.id === forceAffixId) || affix;
  } else {
    // 롤링
    const r = Math.random() * 100;
    let acc = 0;
    for (const a of AFFIXES) {
      acc += a.prob;
      if (r < acc) { affix = a; break; }
    }
  }

  // normal이면 그대로 리턴
  if (affix.id === 'normal') return item;

  // affix 적용 복제 객체
  return {
    ...item,
    id: `${item.id}::${affix.id}`,
    name: `${affix.label} ${item.name}`,
    boost: Math.round((item.boost || 0) * affix.multiplier),
    affixColor: affix.color,
    effectLabel: `${item.effectLabel.split(' ')[0]} +${Math.round((item.boost || 0) * affix.multiplier)}`,
  };
}

/** 통합 아이템 찾기 (우주 + 사주 + Affix) */
export function findItem(rawId) {
  const [baseId, affixId] = String(rawId).split('::');
  const baseItem = baseId.startsWith('saju_') ? getSajuItem(baseId) : getGachaItem(baseId);
  if (!baseItem) return null;
  return applyAffix(baseItem, affixId || 'normal');
}
