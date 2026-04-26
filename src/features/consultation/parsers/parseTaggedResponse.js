export function parseTaggedResponse(text, allowedTags = []) {
  const raw = String(text || "");
  const tagSet = new Set(allowedTags);
  const sections = {};
  const rawSections = {};
  const matches = [...raw.matchAll(/\[([^\]]+)\]/g)];

  if (!matches.length) {
    return { sections: {}, rawSections: {}, rawText: raw };
  }

  for (let i = 0; i < matches.length; i += 1) {
    const tag = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const body = raw.slice(start, end).trim();
    if (!body) continue;
    if (!allowedTags.length || tagSet.has(tag)) sections[tag] = body;
    else rawSections[tag] = body;
  }

  return { sections, rawSections, rawText: raw };
}
