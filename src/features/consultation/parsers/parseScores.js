export function parseScores(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?):\s*(\d{1,3})\s*점?\s*-\s*(.+)$/);
      if (!match) return null;
      const raw = parseInt(match[2], 10);
      return {
        label: match[1].trim(),
        score: Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0,
        description: match[3].trim(),
      };
    })
    .filter(Boolean);
}
