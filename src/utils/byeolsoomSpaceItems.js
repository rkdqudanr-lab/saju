export const SPACE_SLOT_TYPES = Object.freeze({
  BACKGROUND: 'background',
  FLOOR: 'floor',
  CORE: 'core',
  LARGE: 'large',
  SMALL: 'small',
  LIGHT: 'light',
  DECO: 'deco',
  EFFECT: 'effect',
  PET: 'pet',
});

export const SPACE_RARITY = Object.freeze({
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
});

export const SPACE_SERIES = Object.freeze([
  {
    id: 'gemini',
    name: '쌍둥이자리 시리즈',
    theme: 'zodiac',
    emoji: '♊',
    description: '말과 생각이 별처럼 오가는 가벼운 대화의 방이에요.',
    bonuses: [
      { count: 2, label: '별말풍선 연출 해금' },
      { count: 4, label: '펫 대화 대사 추가' },
      { count: 6, label: '칭호: 말이 별이 되는 방' },
    ],
  },
  {
    id: 'pisces',
    name: '물고기자리 시리즈',
    theme: 'zodiac',
    emoji: '♓',
    description: '꿈과 감정이 물결처럼 번지는 달빛 공간이에요.',
    bonuses: [
      { count: 2, label: '물결 이펙트 해금' },
      { count: 4, label: '일기 보상 별가루 추가' },
      { count: 6, label: '칭호: 꿈이 쉬어가는 방' },
    ],
  },
  {
    id: 'leo',
    name: '사자자리 시리즈',
    theme: 'zodiac',
    emoji: '♌',
    description: '태양과 무대의 빛으로 자신감을 채우는 공간이에요.',
    bonuses: [
      { count: 2, label: '따뜻한 조명 연출 해금' },
      { count: 4, label: '프로필 배지 해금' },
      { count: 6, label: '칭호: 태양이 머무는 방' },
    ],
  },
  {
    id: 'wood',
    name: '목기운 시리즈',
    theme: 'element',
    emoji: '🌱',
    description: '새싹과 대나무가 자라는 성장의 별숨공간이에요.',
    bonuses: [
      { count: 2, label: '새싹 이펙트 해금' },
      { count: 4, label: '별가루 생산 +3%' },
      { count: 6, label: '칭호: 새싹이 자라는 별방' },
    ],
  },
  {
    id: 'rabbit',
    name: '묘토끼 시리즈',
    theme: 'zodiac_pet',
    emoji: '🐇',
    description: '달 위를 뛰어다니는 묘토끼의 포근한 쉼터예요.',
    bonuses: [
      { count: 2, label: '묘토끼 점프 모션 해금' },
      { count: 4, label: '묘토끼 대사 추가' },
      { count: 6, label: '묘토끼 달망토 스킨 해금' },
    ],
  },
]);

export const SPACE_OBJECTS = Object.freeze([
  { id: 'gemini_wallpaper', name: '쌍둥이 별무리 벽지', series: 'gemini', slotType: SPACE_SLOT_TYPES.BACKGROUND, rarity: SPACE_RARITY.RARE, emoji: '♊', description: '두 별이 마주 보며 반짝이는 벽지예요.', production: { stardustPerHour: 1 } },
  { id: 'gemini_floor', name: '은빛 대화의 바닥', series: 'gemini', slotType: SPACE_SLOT_TYPES.FLOOR, rarity: SPACE_RARITY.COMMON, emoji: '💬', description: '발걸음마다 작은 말풍선이 피어나는 바닥이에요.', production: { stardustPerHour: 1 } },
  { id: 'gemini_star_desk', name: '쌍둥이 별책상', series: 'gemini', slotType: SPACE_SLOT_TYPES.LARGE, rarity: SPACE_RARITY.RARE, emoji: '✒️', description: '두 개의 생각이 나란히 앉는 별빛 책상이에요.', production: { stardustPerHour: 2 } },
  { id: 'gemini_teacup_table', name: '두 개의 찻잔 테이블', series: 'gemini', slotType: SPACE_SLOT_TYPES.SMALL, rarity: SPACE_RARITY.COMMON, emoji: '☕', description: '대화가 끊기지 않도록 찻잔이 나란히 놓여 있어요.', production: { stardustPerHour: 1 } },
  { id: 'gemini_messenger_lamp', name: '메신저 별등', series: 'gemini', slotType: SPACE_SLOT_TYPES.LIGHT, rarity: SPACE_RARITY.EPIC, emoji: '💡', description: '떠오른 문장을 별빛으로 띄워주는 조명이에요.', production: { stardustPerHour: 3 } },
  { id: 'gemini_letterbox', name: '반짝이는 편지함', series: 'gemini', slotType: SPACE_SLOT_TYPES.DECO, rarity: SPACE_RARITY.COMMON, emoji: '💌', description: '별숨에게 남긴 말들이 조용히 쌓이는 편지함이에요.', production: { stardustPerHour: 1 } },

  { id: 'pisces_wallpaper', name: '물결 꿈벽지', series: 'pisces', slotType: SPACE_SLOT_TYPES.BACKGROUND, rarity: SPACE_RARITY.RARE, emoji: '🌊', description: '꿈결 같은 물빛이 천천히 흐르는 벽지예요.', production: { stardustPerHour: 1 } },
  { id: 'pisces_floor', name: '깊은 바다 카펫', series: 'pisces', slotType: SPACE_SLOT_TYPES.FLOOR, rarity: SPACE_RARITY.COMMON, emoji: '🫧', description: '마음을 차분히 가라앉히는 푸른 카펫이에요.', production: { stardustPerHour: 1 } },
  { id: 'pisces_moon_aquarium', name: '달빛 어항', series: 'pisces', slotType: SPACE_SLOT_TYPES.LARGE, rarity: SPACE_RARITY.EPIC, emoji: '🐠', description: '작은 별물고기가 달빛 사이를 헤엄쳐요.', production: { stardustPerHour: 3 } },
  { id: 'pisces_shell_lamp', name: '몽환 조개등', series: 'pisces', slotType: SPACE_SLOT_TYPES.LIGHT, rarity: SPACE_RARITY.RARE, emoji: '🐚', description: '조개 안쪽에서 부드러운 빛이 번지는 조명이에요.', production: { stardustPerHour: 2 } },
  { id: 'pisces_dream_diary', name: '작은 꿈일기장', series: 'pisces', slotType: SPACE_SLOT_TYPES.SMALL, rarity: SPACE_RARITY.COMMON, emoji: '📘', description: '밤에 본 꿈을 별가루 글씨로 적어두는 일기장이에요.', production: { stardustPerHour: 1 } },
  { id: 'pisces_quiet_pond', name: '고요한 연못', series: 'pisces', slotType: SPACE_SLOT_TYPES.DECO, rarity: SPACE_RARITY.LEGENDARY, emoji: '💧', description: '흔들린 감정이 조용히 가라앉는 작은 연못이에요.', production: { stardustPerHour: 4 } },

  { id: 'leo_sun_wall', name: '태양문 벽지', series: 'leo', slotType: SPACE_SLOT_TYPES.BACKGROUND, rarity: SPACE_RARITY.RARE, emoji: '☀️', description: '공간 전체를 따뜻하게 여는 태양문 벽지예요.', production: { stardustPerHour: 1 } },
  { id: 'leo_stage_floor', name: '황금 무대 바닥', series: 'leo', slotType: SPACE_SLOT_TYPES.FLOOR, rarity: SPACE_RARITY.COMMON, emoji: '🟨', description: '한 걸음마다 자신감이 올라오는 무대 바닥이에요.', production: { stardustPerHour: 1 } },
  { id: 'leo_sun_throne', name: '태양 왕좌', series: 'leo', slotType: SPACE_SLOT_TYPES.LARGE, rarity: SPACE_RARITY.LEGENDARY, emoji: '👑', description: '별숨공간의 중심을 환하게 밝히는 왕좌예요.', production: { stardustPerHour: 4 } },
  { id: 'leo_mane_rug', name: '사자 갈기 러그', series: 'leo', slotType: SPACE_SLOT_TYPES.SMALL, rarity: SPACE_RARITY.COMMON, emoji: '🦁', description: '포근하지만 당당한 기운이 담긴 러그예요.', production: { stardustPerHour: 1 } },
  { id: 'leo_spotlight', name: '스포트라이트 별등', series: 'leo', slotType: SPACE_SLOT_TYPES.LIGHT, rarity: SPACE_RARITY.EPIC, emoji: '🔆', description: '오늘의 주인공 자리를 조용히 비춰주는 조명이에요.', production: { stardustPerHour: 3 } },
  { id: 'leo_crown_stand', name: '왕관 보관대', series: 'leo', slotType: SPACE_SLOT_TYPES.DECO, rarity: SPACE_RARITY.RARE, emoji: '💫', description: '작은 성취를 왕관처럼 보관하는 장식대예요.', production: { stardustPerHour: 2 } },

  { id: 'wood_sprout_wall', name: '새싹 벽지', series: 'wood', slotType: SPACE_SLOT_TYPES.BACKGROUND, rarity: SPACE_RARITY.COMMON, emoji: '🌿', description: '작은 새싹들이 벽면을 따라 자라나는 벽지예요.', production: { stardustPerHour: 1 } },
  { id: 'wood_bamboo_floor', name: '대나무 바닥', series: 'wood', slotType: SPACE_SLOT_TYPES.FLOOR, rarity: SPACE_RARITY.COMMON, emoji: '🎋', description: '곧게 뻗는 마음을 닮은 대나무 바닥이에요.', production: { stardustPerHour: 1 } },
  { id: 'wood_forest_bookshelf', name: '작은 숲 책장', series: 'wood', slotType: SPACE_SLOT_TYPES.LARGE, rarity: SPACE_RARITY.RARE, emoji: '📚', description: '읽은 이야기마다 잎이 하나씩 돋아나는 책장이에요.', production: { stardustPerHour: 2 } },
  { id: 'wood_grain_desk', name: '나무결 책상', series: 'wood', slotType: SPACE_SLOT_TYPES.SMALL, rarity: SPACE_RARITY.COMMON, emoji: '🪵', description: '계획을 천천히 뿌리내리게 해주는 책상이에요.', production: { stardustPerHour: 1 } },
  { id: 'wood_branch_lamp', name: '가지 램프', series: 'wood', slotType: SPACE_SLOT_TYPES.LIGHT, rarity: SPACE_RARITY.RARE, emoji: '🌳', description: '가지 끝마다 작은 별빛이 맺히는 램프예요.', production: { stardustPerHour: 2 } },
  { id: 'wood_star_planter', name: '초록 별화분', series: 'wood', slotType: SPACE_SLOT_TYPES.DECO, rarity: SPACE_RARITY.EPIC, emoji: '🪴', description: '별가루를 먹고 자라는 초록빛 화분이에요.', production: { stardustPerHour: 3 } },

  { id: 'rabbit_moon_cushion', name: '묘토끼 달방석', series: 'rabbit', slotType: SPACE_SLOT_TYPES.SMALL, rarity: SPACE_RARITY.COMMON, emoji: '🌙', description: '묘토끼가 가장 좋아하는 초승달 모양 방석이에요.', production: { stardustPerHour: 1 } },
  { id: 'rabbit_carrot_lamp', name: '당근 별램프', series: 'rabbit', slotType: SPACE_SLOT_TYPES.LIGHT, rarity: SPACE_RARITY.COMMON, emoji: '🥕', description: '당근 꼭지에서 별빛이 톡톡 튀는 램프예요.', production: { stardustPerHour: 1 } },
  { id: 'rabbit_moon_burrow', name: '초승달 토끼굴', series: 'rabbit', slotType: SPACE_SLOT_TYPES.LARGE, rarity: SPACE_RARITY.EPIC, emoji: '🐇', description: '묘토끼가 쉬어가는 반짝이는 토끼굴이에요.', production: { stardustPerHour: 3 } },
  { id: 'rabbit_cloud_step', name: '구름 점프대', series: 'rabbit', slotType: SPACE_SLOT_TYPES.DECO, rarity: SPACE_RARITY.RARE, emoji: '☁️', description: '폴짝 뛰면 작은 별가루가 흩어지는 점프대예요.', production: { stardustPerHour: 2 } },
  { id: 'rabbit_pink_blanket', name: '분홍 별담요', series: 'rabbit', slotType: SPACE_SLOT_TYPES.SMALL, rarity: SPACE_RARITY.COMMON, emoji: '🧺', description: '별숨공간을 부드럽게 데워주는 담요예요.', production: { stardustPerHour: 1 } },
  { id: 'rabbit_ear_deco', name: '토끼 귀 벽장식', series: 'rabbit', slotType: SPACE_SLOT_TYPES.DECO, rarity: SPACE_RARITY.RARE, emoji: '✨', description: '달의 소식을 잘 듣게 해주는 벽장식이에요.', production: { stardustPerHour: 2 } },
]);

const OBJECTS_BY_ID = new Map(SPACE_OBJECTS.map((item) => [item.id, item]));
const OBJECTS_BY_SERIES = SPACE_OBJECTS.reduce((acc, item) => {
  if (!acc[item.series]) acc[item.series] = [];
  acc[item.series].push(item);
  return acc;
}, {});

const LEGACY_ASPECT_TO_SERIES = Object.freeze({
  social: 'gemini',
  travel: 'gemini',
  love: 'pisces',
  health: 'pisces',
  career: 'leo',
  overall: 'leo',
  study: 'wood',
  wealth: 'wood',
  create: 'rabbit',
});

const LEGACY_GRADE_TO_SLOT = Object.freeze({
  satellite: SPACE_SLOT_TYPES.SMALL,
  planet: SPACE_SLOT_TYPES.LIGHT,
  galaxy: SPACE_SLOT_TYPES.LARGE,
  nebula: SPACE_SLOT_TYPES.DECO,
  saju_common: SPACE_SLOT_TYPES.SMALL,
  saju_rare: SPACE_SLOT_TYPES.LIGHT,
  saju_epic: SPACE_SLOT_TYPES.LARGE,
  saju_legend: SPACE_SLOT_TYPES.DECO,
});

export function findSpaceObject(id) {
  return OBJECTS_BY_ID.get(id) || null;
}

export function getSpaceObjectsBySeries(seriesId) {
  return OBJECTS_BY_SERIES[seriesId] || [];
}

export function getSpaceSeries(seriesId) {
  return SPACE_SERIES.find((series) => series.id === seriesId) || null;
}

export function mapLegacyGachaToSpaceObject(item) {
  if (!item) return null;
  if (findSpaceObject(item.id)) return findSpaceObject(item.id);

  const seriesId = LEGACY_ASPECT_TO_SERIES[item.aspectKey] || 'gemini';
  const preferredSlot = LEGACY_GRADE_TO_SLOT[item.grade] || SPACE_SLOT_TYPES.DECO;
  const pool = getSpaceObjectsBySeries(seriesId);
  return pool.find((object) => object.slotType === preferredSlot) || pool[0] || null;
}

