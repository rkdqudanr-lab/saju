/**
 * shopGachaItems.js — 별숨 숍 아이템 가챠 풀
 * 테마 / 아바타 / 이펙트 아이템 로컬 정의
 *
 * item.id는 문자열 (user_shop_inventory.item_id에 text로 저장)
 * item.rarity: 'common' | 'rare' | 'legendary'
 * item.category: 'theme' | 'avatar' | 'effect'
 */

export const SHOP_GRADE_CONFIG = {
  common:    { label: '일반',     color: '#9BADCE', bg: 'rgba(155,173,206,0.10)', border: 'rgba(155,173,206,0.30)' },
  rare:      { label: '레어',     color: '#B48EF0', bg: 'rgba(180,142,240,0.14)', border: 'rgba(180,142,240,0.40)' },
  legendary: { label: '레전더리', color: '#E8B048', bg: 'rgba(232,176,72, 0.15)', border: 'rgba(232,176,72, 0.50)' },
};
export const SHOP_GRADE_ORDER = ['common', 'rare', 'legendary'];

export const SHOP_PROB_TABLE = [
  { rarity: 'common',    prob: 60, label: '일반',     color: SHOP_GRADE_CONFIG.common.color    },
  { rarity: 'rare',      prob: 35, label: '레어',     color: SHOP_GRADE_CONFIG.rare.color      },
  { rarity: 'legendary', prob: 5,  label: '레전더리', color: SHOP_GRADE_CONFIG.legendary.color },
];

// ─── 테마 (10종) ───────────────────────────────────────────────
// colors: { primary, bg, accent } — CSS 변수 오버라이드 값
export const THEME_POOL = [
  { id: 'theme_starlight', rarity: 'common',    name: '별빛 테마',      emoji: '⭐', category: 'theme',
    description: '황금빛 별들이 밤하늘을 수놓는 클래식 별숨 테마',
    effect: '기본 황금 × 딥 네이비 배색',
    colors: { primary: '#E8B048', bg: '#0d0b18', accent: '#E8B048', bg2: '#13112a' } },
  { id: 'theme_dawn',      rarity: 'common',    name: '새벽 테마',      emoji: '🌅', category: 'theme',
    description: '밝아오는 새벽빛으로 물든 청량한 테마',
    effect: '시안 × 딥 블루 배색',
    colors: { primary: '#5FC4D8', bg: '#060e1a', accent: '#5FC4D8', bg2: '#0a1520' } },
  { id: 'theme_rose',      rarity: 'common',    name: '장미 테마',      emoji: '🌹', category: 'theme',
    description: '붉은 장미처럼 열정적이고 따뜻한 테마',
    effect: '로즈골드 × 다크 퍼플 배색',
    colors: { primary: '#D4748A', bg: '#0f0810', accent: '#D4748A', bg2: '#1a0d14' } },
  { id: 'theme_maple',     rarity: 'common',    name: '단풍 테마',      emoji: '🍁', category: 'theme',
    description: '가을 단풍처럼 따뜻하고 포근한 테마',
    effect: '앰버 × 딥 브라운 배색',
    colors: { primary: '#D4874A', bg: '#100a05', accent: '#D4874A', bg2: '#1a1008' } },
  { id: 'theme_emerald',   rarity: 'rare',      name: '에메랄드 테마',  emoji: '💚', category: 'theme',
    description: '에메랄드빛 숲속 같은 신비로운 테마',
    effect: '에메랄드 그린 × 다크 포레스트 배색',
    colors: { primary: '#4DC9A0', bg: '#050f0c', accent: '#4DC9A0', bg2: '#081510' } },
  { id: 'theme_lavender',  rarity: 'rare',      name: '라벤더 테마',    emoji: '💜', category: 'theme',
    description: '라벤더 향기처럼 부드럽고 몽환적인 테마',
    effect: '라벤더 × 딥 인디고 배색',
    colors: { primary: '#A98ECF', bg: '#080612', accent: '#A98ECF', bg2: '#0e0a1e' } },
  { id: 'theme_ruby',      rarity: 'rare',      name: '루비 테마',      emoji: '🔴', category: 'theme',
    description: '루비처럼 강렬하고 붉게 타오르는 테마',
    effect: '크림슨 × 다크 레드 배색',
    colors: { primary: '#D44A4A', bg: '#100505', accent: '#D44A4A', bg2: '#1a0808' } },
  { id: 'theme_sapphire',  rarity: 'rare',      name: '사파이어 테마',  emoji: '💙', category: 'theme',
    description: '사파이어처럼 깊고 투명한 프리미엄 테마',
    effect: '로얄 블루 × 딥 오션 배색',
    colors: { primary: '#4A7BD4', bg: '#050a18', accent: '#4A7BD4', bg2: '#081020' } },
  { id: 'theme_aurora',    rarity: 'legendary', name: '오로라 테마',    emoji: '🌌', category: 'theme',
    description: '오로라가 흐르듯 황홀한 레전더리 테마',
    effect: '오로라 그린↔퍼플 그라데이션 배색',
    colors: { primary: '#5FFAAB', bg: '#040d0a', accent: '#B45FFB', bg2: '#080f12' } },
  { id: 'theme_prism',     rarity: 'legendary', name: '프리즘 테마',    emoji: '🔮', category: 'theme',
    description: '모든 빛을 담은 찬란한 레전더리 테마',
    effect: '프리즘 레인보우 배색',
    colors: { primary: '#FF8C5A', bg: '#080408', accent: '#FF8C5A', bg2: '#120a0c' } },
];

// ─── 아바타 (9종) ──────────────────────────────────────────────
export const AVATAR_POOL = [
  { id: 'avatar_starspirit',    rarity: 'common',    name: '별빛 수호령',   emoji: '✦',  category: 'avatar',
    description: '밤하늘의 별처럼 조용히 당신을 지키는 수호령',
    effect: '황금빛 별 문양 아바타 · 은은한 별빛 후광',
    svgType: 'star_spirit' },
  { id: 'avatar_moonelf',       rarity: 'common',    name: '달의 정령',     emoji: '🌙', category: 'avatar',
    description: '달빛 아래 춤추는 신비로운 정령',
    effect: '은빛 달 문양 아바타 · 고요한 달빛 후광',
    svgType: 'moon_elf' },
  { id: 'avatar_cloudfox',      rarity: 'common',    name: '구름 여우',     emoji: '🦊', category: 'avatar',
    description: '흰 구름 위를 달리는 신비로운 여우 정령',
    effect: '하늘색 여우 문양 아바타 · 솜구름 후광',
    svgType: 'cloud_fox' },
  { id: 'avatar_windsprite',    rarity: 'common',    name: '바람의 요정',   emoji: '🍃', category: 'avatar',
    description: '바람을 타고 나타나는 자유로운 요정',
    effect: '초록 소용돌이 문양 아바타 · 바람 후광',
    svgType: 'wind_sprite' },
  { id: 'avatar_galaxycat',     rarity: 'rare',      name: '은하 고양이',   emoji: '🐱', category: 'avatar',
    description: '은하수를 가로질러 달리는 신비로운 우주 고양이',
    effect: '보라빛 고양이 문양 아바타 · 별 궤적 후광',
    svgType: 'galaxy_cat' },
  { id: 'avatar_timeowl',       rarity: 'rare',      name: '시간의 부엉이', emoji: '🦉', category: 'avatar',
    description: '시간의 흐름을 꿰뚫어보는 지혜로운 부엉이',
    effect: '황금 부엉이 문양 아바타 · 모래시계 후광',
    svgType: 'time_owl' },
  { id: 'avatar_flamephoenix',  rarity: 'rare',      name: '불꽃 봉황',     emoji: '🦅', category: 'avatar',
    description: '불꽃 속에서 다시 태어나는 전설의 봉황',
    effect: '주홍빛 봉황 문양 아바타 · 화염 날개 후광',
    svgType: 'flame_phoenix' },
  { id: 'avatar_abyssdragon',   rarity: 'legendary', name: '심연의 용',     emoji: '🐉', category: 'avatar',
    description: '우주의 심연에 깃든 전설의 흑룡',
    effect: '심흑빛 용 문양 아바타 · 심연 소용돌이 후광',
    svgType: 'abyss_dragon' },
  { id: 'avatar_cosmicgoddess', rarity: 'legendary', name: '우주의 여신',   emoji: '✨', category: 'avatar',
    description: '우주 그 자체의 의지를 담은 신성한 여신',
    effect: '성운빛 여신 문양 아바타 · 우주 탄생 후광',
    svgType: 'cosmic_goddess' },
];

// ─── 이펙트 (9종) ──────────────────────────────────────────────
export const EFFECT_POOL = [
  { id: 'effect_starparticle', rarity: 'common',    name: '별빛 입자',   emoji: '✧',  category: 'effect',
    description: '화면에 작은 별빛 입자가 반짝이며 떠다녀요',
    effect: '은은한 별빛 파티클 · 고요한 분위기',
    animType: 'star_particle' },
  { id: 'effect_snowflake',    rarity: 'common',    name: '눈꽃',        emoji: '❄️', category: 'effect',
    description: '하얀 눈꽃이 천천히 내려오는 이펙트',
    effect: '눈꽃 낙하 · 청명한 겨울 분위기',
    animType: 'snowflake' },
  { id: 'effect_springrain',   rarity: 'common',    name: '봄비',        emoji: '🌧️', category: 'effect',
    description: '봄비가 부드럽게 내리는 촉촉한 이펙트',
    effect: '봄비 낙하 · 따뜻한 봄날 분위기',
    animType: 'spring_rain' },
  { id: 'effect_firefly',      rarity: 'common',    name: '반딧불',      emoji: '✨', category: 'effect',
    description: '밤하늘에 반딧불이 날아다니는 이펙트',
    effect: '반딧불 유영 · 여름 밤의 낭만',
    animType: 'firefly' },
  { id: 'effect_sakura',       rarity: 'rare',      name: '벚꽃',        emoji: '🌸', category: 'effect',
    description: '벚꽃잎이 흩날리는 아름다운 봄 이펙트',
    effect: '벚꽃 낙화 · 화사하고 설레는 분위기',
    animType: 'sakura' },
  { id: 'effect_aurora',       rarity: 'rare',      name: '오로라',      emoji: '🌌', category: 'effect',
    description: '화면 위로 오로라 빛이 넘실대는 이펙트',
    effect: '오로라 물결 · 신비로운 북극광 분위기',
    animType: 'aurora' },
  { id: 'effect_orbit',        rarity: 'rare',      name: '행성 궤도',   emoji: '🪐', category: 'effect',
    description: '작은 행성들이 화면 주변을 공전하는 이펙트',
    effect: '행성 궤도 · 우주적이고 신비로운 분위기',
    animType: 'orbit' },
  { id: 'effect_supernova',    rarity: 'legendary', name: '우주 폭발',   emoji: '💥', category: 'effect',
    description: '초신성 폭발처럼 강렬한 에너지의 레전더리 이펙트',
    effect: '초신성 버스트 · 압도적인 우주 에너지',
    animType: 'supernova' },
  { id: 'effect_divinelight',  rarity: 'legendary', name: '신성한 빛',   emoji: '☀️', category: 'effect',
    description: '신성한 빛줄기가 화면을 가득 채우는 레전더리 이펙트',
    effect: '신성 광선 · 숭고한 빛의 기운',
    animType: 'divine_light' },
];

// ─── 부적 (24종 — 8개 운 영역 × 3등급) ──────────────────────────
// type: TodayDetailPage AXES_8의 key와 일치 → 해당 축 점수 +보정
// description: useConsultation isDaily 시 AI 컨텍스트에 주입됨
export const TALISMAN_POOL = [
  // ── 금전 부적 ──
  { id: 'talisman_wealth_c', rarity: 'common',    name: '황금 재물 부적',   emoji: '💰', category: 'talisman', type: 'wealth',
    description: '황금빛 기운으로 오늘 하루 금전 흐름을 부드럽게 열어줘요.',
    effect: '금전 운 +8점', boost: 8 },
  { id: 'talisman_wealth_r', rarity: 'rare',      name: '황금 복덩이 부적', emoji: '🏆', category: 'talisman', type: 'wealth',
    description: '복이 몰려드는 강한 재물 기운으로 오늘의 금전 흐름을 크게 열어줘요.',
    effect: '금전 운 +15점', boost: 15 },
  { id: 'talisman_wealth_l', rarity: 'legendary', name: '금룡 재운 부적',   emoji: '🐉', category: 'talisman', type: 'wealth',
    description: '금룡의 기운이 깃든 레전더리 부적. 재물과 풍요의 기운이 폭발적으로 열려요.',
    effect: '금전 운 +25점', boost: 25 },

  // ── 애정 부적 ──
  { id: 'talisman_love_c',   rarity: 'common',    name: '홍실 인연 부적',   emoji: '❤️', category: 'talisman', type: 'love',
    description: '붉은 실로 이어지는 인연의 기운으로 오늘의 애정 흐름을 따뜻하게 해줘요.',
    effect: '애정 운 +8점', boost: 8 },
  { id: 'talisman_love_r',   rarity: 'rare',      name: '월하 연정 부적',   emoji: '🌹', category: 'talisman', type: 'love',
    description: '달빛 아래 깊어지는 연정의 기운으로 오늘 설레는 애정 에너지가 흘러요.',
    effect: '애정 운 +15점', boost: 15 },
  { id: 'talisman_love_l',   rarity: 'legendary', name: '천생연분 부적',    emoji: '💞', category: 'talisman', type: 'love',
    description: '하늘이 맺어준 인연의 기운. 레전더리 애정 부적으로 오늘 강한 인연 기운이 열려요.',
    effect: '애정 운 +25점', boost: 25 },

  // ── 직장 부적 ──
  { id: 'talisman_career_c', rarity: 'common',    name: '승진 길운 부적',   emoji: '📈', category: 'talisman', type: 'career',
    description: '직장과 사업의 기운을 열어 오늘의 커리어 흐름을 순탄하게 해줘요.',
    effect: '직장 운 +8점', boost: 8 },
  { id: 'talisman_career_r', rarity: 'rare',      name: '관운 대통 부적',   emoji: '🎖️', category: 'talisman', type: 'career',
    description: '관운이 트이는 강한 기운으로 오늘 직장·사업에서 좋은 결과를 기대할 수 있어요.',
    effect: '직장 운 +15점', boost: 15 },
  { id: 'talisman_career_l', rarity: 'legendary', name: '왕관 출세 부적',   emoji: '👑', category: 'talisman', type: 'career',
    description: '왕관의 기운이 깃든 레전더리 부적. 오늘 직장과 커리어에서 최고의 기운이 흘러요.',
    effect: '직장 운 +25점', boost: 25 },

  // ── 학업 부적 ──
  { id: 'talisman_study_c',  rarity: 'common',    name: '문창 학업 부적',   emoji: '📚', category: 'talisman', type: 'study',
    description: '문창성의 기운으로 오늘의 집중력과 학습 효율을 높여줘요.',
    effect: '학업 운 +8점', boost: 8 },
  { id: 'talisman_study_r',  rarity: 'rare',      name: '지혜 총명 부적',   emoji: '🦉', category: 'talisman', type: 'study',
    description: '총명한 지혜의 기운으로 오늘 시험·학습·자격증에서 강한 집중력이 발휘돼요.',
    effect: '학업 운 +15점', boost: 15 },
  { id: 'talisman_study_l',  rarity: 'legendary', name: '장원급제 부적',    emoji: '🏅', category: 'talisman', type: 'study',
    description: '과거 장원급제의 기운이 깃든 레전더리 부적. 오늘 학업과 시험에서 최상의 결과를 기대해요.',
    effect: '학업 운 +25점', boost: 25 },

  // ── 건강 부적 ──
  { id: 'talisman_health_c', rarity: 'common',    name: '수복 건강 부적',   emoji: '🍀', category: 'talisman', type: 'health',
    description: '수(壽)와 복(福)의 기운으로 오늘 하루 몸의 기운을 회복시켜줘요.',
    effect: '건강 운 +8점', boost: 8 },
  { id: 'talisman_health_r', rarity: 'rare',      name: '장수 무병 부적',   emoji: '⚕️', category: 'talisman', type: 'health',
    description: '무병장수의 기운으로 오늘 활력이 넘치고 몸과 마음이 건강해져요.',
    effect: '건강 운 +15점', boost: 15 },
  { id: 'talisman_health_l', rarity: 'legendary', name: '불로장생 부적',    emoji: '🌿', category: 'talisman', type: 'health',
    description: '불로장생의 기운이 깃든 레전더리 부적. 오늘 최상의 활력과 건강 에너지가 흘러요.',
    effect: '건강 운 +25점', boost: 25 },

  // ── 대인 부적 ──
  { id: 'talisman_social_c', rarity: 'common',    name: '귀인 인맥 부적',   emoji: '🤝', category: 'talisman', type: 'social',
    description: '귀인이 찾아오는 기운으로 오늘의 대인 관계가 원만해져요.',
    effect: '대인 운 +8점', boost: 8 },
  { id: 'talisman_social_r', rarity: 'rare',      name: '화합 귀인 부적',   emoji: '✨', category: 'talisman', type: 'social',
    description: '강한 귀인 기운으로 오늘 뜻하지 않게 귀한 사람을 만날 수 있어요.',
    effect: '대인 운 +15점', boost: 15 },
  { id: 'talisman_social_l', rarity: 'legendary', name: '천하화합 부적',    emoji: '🌟', category: 'talisman', type: 'social',
    description: '천하가 화합하는 레전더리 부적. 오늘 모든 인간관계에서 최상의 기운이 흘러요.',
    effect: '대인 운 +25점', boost: 25 },

  // ── 이동 부적 ──
  { id: 'talisman_travel_c', rarity: 'common',    name: '순풍 여행 부적',   emoji: '🧭', category: 'talisman', type: 'travel',
    description: '순풍의 기운으로 오늘의 이동·여행이 안전하고 순탄해져요.',
    effect: '이동 운 +8점', boost: 8 },
  { id: 'talisman_travel_r', rarity: 'rare',      name: '여행 길조 부적',   emoji: '🗺️', category: 'talisman', type: 'travel',
    description: '길조의 기운으로 오늘 이동과 여행에서 뜻밖의 좋은 일이 생겨요.',
    effect: '이동 운 +15점', boost: 15 },
  { id: 'talisman_travel_l', rarity: 'legendary', name: '팔방통달 부적',    emoji: '🚀', category: 'talisman', type: 'travel',
    description: '팔방으로 통하는 레전더리 부적. 오늘 어디를 가든 최고의 기운이 함께해요.',
    effect: '이동 운 +25점', boost: 25 },

  // ── 창의 부적 (8번째 영역) ──
  { id: 'talisman_create_c', rarity: 'common',    name: '창작 영감 부적',   emoji: '🎨', category: 'talisman', type: 'create',
    description: '창의성과 영감의 기운으로 오늘 새로운 아이디어가 샘솟아요.',
    effect: '창의 운 +8점', boost: 8 },
  { id: 'talisman_create_r', rarity: 'rare',      name: '뮤즈 영감 부적',   emoji: '🎭', category: 'talisman', type: 'create',
    description: '뮤즈의 기운으로 오늘 창의력과 예술적 감각이 최고조로 깨어나요.',
    effect: '창의 운 +15점', boost: 15 },
  { id: 'talisman_create_l', rarity: 'legendary', name: '천재 영감 부적',   emoji: '💡', category: 'talisman', type: 'create',
    description: '천재적 영감이 깃든 레전더리 부적. 오늘 창의·예술·기획에서 놀라운 기운이 열려요.',
    effect: '창의 운 +25점', boost: 25 },
];

// 카테고리별 풀
export const SHOP_GACHA_POOL = { theme: THEME_POOL, avatar: AVATAR_POOL, effect: EFFECT_POOL, talisman: TALISMAN_POOL };

// ─── 뽑기 함수 ────────────────────────────────────────────────
function pickOne(pool, guaranteedMin = null) {
  const r = Math.random() * 100;
  let rarity = r < 5 ? 'legendary' : r < 40 ? 'rare' : 'common';
  if (guaranteedMin) {
    const order = SHOP_GRADE_ORDER;
    if (order.indexOf(rarity) < order.indexOf(guaranteedMin)) rarity = guaranteedMin;
  }
  const bucket = pool.filter(i => i.rarity === rarity);
  const src    = bucket.length > 0 ? bucket : pool;
  return src[Math.floor(Math.random() * src.length)];
}

export function pullOneShop(pool)  { return pickOne(pool); }

export function pull10Shop(pool) {
  const results = [];
  for (let i = 0; i < 9; i++) results.push(pickOne(pool));
  const hasRarePlus = results.some(i => i.rarity === 'rare' || i.rarity === 'legendary');
  results.push(pickOne(pool, hasRarePlus ? null : 'rare'));
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  return results;
}

// ID로 아이템 찾기
const ALL_SHOP_POOL = [...THEME_POOL, ...AVATAR_POOL, ...EFFECT_POOL, ...TALISMAN_POOL];
export function findShopItem(id) {
  return ALL_SHOP_POOL.find(i => i.id === id) || null;
}
export { ALL_SHOP_POOL };
