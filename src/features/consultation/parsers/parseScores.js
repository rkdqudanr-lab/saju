export function parseScores(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?):\s*(\d{1,3})\s*점?\s*-\s*(.+)$/);
      if (!match) return null;
      return {
        label: match[1].trim(),
        score: Math.max(0, Math.min(100, parseInt(match[2], 10) || 0)),
        description: match[3].trim(),
      };
    })
    .filter(Boolean);
}
