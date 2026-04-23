export const FORTUNE_LABELS = {
  wealth: '재물운', love: '애정운', career: '직장운',
  study: '학업운', health: '건강운', social: '대인운',
  travel: '이동운', general: '기타 아이템',
};

export const CAT_LABEL = {
  theme: '테마', avatar: '아바타', special_reading: '특별 상담',
  talisman: '부적', effect: '이펙트',
  satellite: '위성', planet: '행성', galaxy: '은하', nebula: '성운',
  ohaeng: '오행', cheongan: '천간', jiji: '지지', gapja: '육십갑자',
  fragment: '조각', rare: '희귀', legendary: '전설',
};

export const DAILY_AXIS_CACHE = 'daily_axis_activations';

export const SYNTH_RATES = {
  satellite: 1.0, planet: 0.5, galaxy: 0.1,
  ohaeng: 1.0, cheongan: 0.5, jiji: 0.1,
};

export function isItemDailyActive(item, dailyActMap) {
  if (!item?.aspectKey || !dailyActMap || typeof dailyActMap !== 'object') return false;
  const activeId = dailyActMap[item.aspectKey];
  return !!activeId && (activeId === item.id || activeId === item.id.split('::')[0]);
}
