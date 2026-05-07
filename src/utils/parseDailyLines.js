function extractLabeledValue(lines, patterns) {
  const line = lines.find((entry) => patterns.some((pattern) => pattern.test(entry)));
  if (!line) return '';
  return line
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/^[^:]+:\s*/, '')
    .trim();
}

export function parseCategoryLine(line) {
  const afterColon = line.split(':').slice(1).join(':').trim();
  const leadingNumMatch = afterColon.match(/^(\d{1,3})\s*[—–-]+\s*/);
  const numericMatch = line.match(/(\d{1,3})\s*점/);
  const starCount = (line.match(/[⭐★]/g) || []).length;

  let stars = null;
  let score = null;
  let desc = '';

  if (starCount) {
    stars = starCount;
    desc = line.split('-').slice(1).join('-').trim() || afterColon;
  } else if (leadingNumMatch) {
    const n = Number(leadingNumMatch[1]);
    if (n <= 5) { stars = n; } else { score = Math.max(20, Math.min(100, n)); }
    desc = afterColon.replace(leadingNumMatch[0], '').trim();
  } else if (numericMatch) {
    const n = Number(numericMatch[1]);
    if (n <= 5) { stars = n; } else { score = Math.max(20, Math.min(100, n)); }
    desc = afterColon.replace(/\d{1,3}\s*점/, '').trim();
  } else {
    desc = afterColon;
  }

  return {
    stars,
    score,
    desc: desc && !/^\d+\s*점?$/.test(desc) ? desc : '',
  };
}

export function parseDailyLines(text) {
  const empty = {
    score: null, summary: '', synergy: null, categories: null,
    badtime: null, closingAdvice: '', items: [],
    easternKi: null, westernSky: null,
  };

  if (!text || typeof text !== 'string') return empty;

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  const scoreLine = lines.find((line) => /^\[(점수|score)\]/i.test(line));
  const scoreMatch = scoreLine?.match(/(\d{1,3})/);
  const score = scoreMatch ? Math.max(0, Math.min(100, Number(scoreMatch[1]))) : null;

  const summaryLine = lines.find((line) => /^\[(요약|summary)\]/i.test(line));
  const summary = summaryLine ? summaryLine.replace(/^\[(요약|summary)\]\s*/i, '').trim() : '';

  const categories = {};
  const categoryPatterns = [
    { key: 'overall', regexes: [/^종합운[:\s]/, /^종합[:\s]/] },
    { key: 'love', regexes: [/^애정운[:\s]/, /^애정[:\s]/] },
    { key: 'wealth', regexes: [/^금전운[:\s]/, /^금전[:\s]/] },
    { key: 'career', regexes: [/^직장운[:\s]/, /^직장[:\s]/] },
    { key: 'study', regexes: [/^학업운[:\s]/, /^학업[:\s]/] },
    { key: 'health', regexes: [/^건강운[:\s]/, /^건강[:\s]/] },
    { key: 'social', regexes: [/^대인운[:\s]/, /^대인[:\s]/] },
    { key: 'travel', regexes: [/^이동운[:\s]/, /^이동[:\s]/] },
    { key: 'create', regexes: [/^창의운[:\s]/, /^창의[:\s]/] },
  ];

  for (const { key, regexes } of categoryPatterns) {
    const line = lines.find((entry) => regexes.some((regex) => regex.test(entry)));
    if (line) categories[key] = parseCategoryLine(line);
  }

  const normalizedCategories = Object.keys(categories).length > 0 ? categories : null;

  const easternKi = {
    sinshin: extractLabeledValue(lines, [/^십신[:\s]/]),
    kiun: extractLabeledValue(lines, [/^기운[:\s]/]),
    doAction: extractLabeledValue(lines, [/^DO[:\s]/i]),
    dontAction: extractLabeledValue(lines, [/^DONT[:\s]/i]),
  };
  const normalizedEasternKi = Object.values(easternKi).some(Boolean) ? easternKi : null;

  const westernSky = {
    planet: extractLabeledValue(lines, [/^행성[:\s]/]),
    flow: extractLabeledValue(lines, [/^흐름[:\s]/]),
  };
  const normalizedWesternSky = Object.values(westernSky).some(Boolean) ? westernSky : null;

  const synergy = {
    food: extractLabeledValue(lines, [/^음식[:\s]/, /^추천 음식[:\s]/]),
    place: extractLabeledValue(lines, [/^장소[:\s]/, /^추천 장소[:\s]/]),
    color: extractLabeledValue(lines, [/^색[:\s]/, /^컬러[:\s]/, /^색상[:\s]/]),
    item: extractLabeledValue(lines, [/^아이템[:\s]/]),
    number: extractLabeledValue(lines, [/^숫자[:\s]/, /^행운 숫자[:\s]/]),
    direction: extractLabeledValue(lines, [/^방향[:\s]/, /^행운 방향[:\s]/]),
    communication: extractLabeledValue(lines, [/^소통[:\s]/]),
    action: extractLabeledValue(lines, [/^행동[:\s]/]),
    summary: extractLabeledValue(lines, [/^요약[:\s]/, /^\[별숨 시너지\]/, /^\[시너지\]/, /^시너지[:\s]/]),
  };
  const normalizedSynergy = Object.values(synergy).some(Boolean) ? synergy : null;

  const badtimeLine = lines.find((line) => /배드타임|액막이|주의/.test(line));
  const badtime = badtimeLine ? { symptom: badtimeLine.replace(/^\[[^\]]+\]\s*/, '').trim(), transformation: '' } : null;

  const FIELD_PREFIXES = /^(종합운|애정운|금전운|직장운|학업운|건강운|대인운|이동운|창의운|음식|장소|색|컬러|색상|아이템|숫자|행운 숫자|방향|행운 방향|소통|행동|요약|시너지|십신|기운|DO|DONT|행성|흐름)[:\s]/i;

  const closingAdvice = [...lines].reverse().find((line) => {
    if (line.startsWith('[')) return false;
    if (FIELD_PREFIXES.test(line)) return false;
    return true;
  }) || '';

  const items = lines
    .filter((line) => !line.startsWith('['))
    .filter((line) => !FIELD_PREFIXES.test(line))
    .slice(0, 5);

  return {
    score, summary,
    easternKi: normalizedEasternKi,
    westernSky: normalizedWesternSky,
    synergy: normalizedSynergy,
    categories: normalizedCategories,
    badtime, closingAdvice, items,
  };
}
