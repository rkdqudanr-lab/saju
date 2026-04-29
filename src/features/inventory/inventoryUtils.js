export const FORTUNE_LABELS = {
  overall: '종합운',
  wealth: '재물운',
  love: '애정운',
  career: '직장운',
  study: '학업운',
  health: '건강운',
  social: '대인운',
  travel: '이동운',
  create: '창의운',
  general: '기타 아이템',
};

export const CAT_LABEL = {
  theme: '테마', avatar: '아바타', special_reading: '특별 상담',
  talisman: '부적', effect: '이펙트',
  satellite: '위성', planet: '행성', galaxy: '은하', nebula: '성운',
  ohaeng: '오행', cheongan: '천간', jiji: '지지', gapja: '육십갑자',
  fragment: '조각', rare: '희귀', legendary: '전설',
};

// 구버전 캐시 키 (하위호환용, 실제 사용 안 함)
export const DAILY_AXIS_CACHE = 'daily_axis_activations';
// 신규 캐시 키: { [aspectKey]: { itemId, boost, name, emoji } }
export const ITEM_BOOSTS_CACHE = 'item_boosts';

export const SYNTH_RATES = {
  satellite: 1.0, planet: 0.5, galaxy: 0.1,
  ohaeng: 1.0, cheongan: 0.5, jiji: 0.1,
};

// boostMap: { [aspectKey]: { itemId, boost, name, emoji } }
export function isItemDailyActive(item, boostMap) {
  if (!item?.aspectKey || !boostMap || typeof boostMap !== 'object') return false;
  const entry = boostMap[item.aspectKey];
  return !!entry && String(entry.itemId) === String(item.id);
}
