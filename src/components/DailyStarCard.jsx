// DailyStarCard — 오늘 하루 별숨 카드 (메인 페이지 상시 표시)
// 응답 5항목: 색 / 음식 / 방향 / 해도 좋은 것 / 조심할 것

const ITEM_ICONS  = ['🎨', '🌿', '🧭', '✨', '🌙'];
const ITEM_COLORS = ['var(--lav)', 'var(--teal)', 'var(--gold)', 'var(--gold)', 'var(--rose)'];

function parseDailyLines(text) {
  if (!text) return { summary: '', items: [] };
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let summary = '';
  const items = [];
  let summaryFound = false;

  // Extract [요약] summary first
  const summaryIdx = lines.findIndex(l => l.startsWith('[요약]'));
  if (summaryIdx !== -1) {
    summary = lines[summaryIdx].replace('[요약]', '').trim();
    summaryFound = true;
  }

  // Find item start: first line with "오늘의 색은" (the color item).
  // This skips any intro paragraph the AI may insert between [요약] and the items.
  const colorStart = lines.findIndex(l => l.includes('오늘의 색은'));
  const itemStart = colorStart !== -1 ? colorStart : (summaryFound ? summaryIdx + 1 : 0);

  for (let i = itemStart; i < lines.length && items.length < 5; i++) {
    items.push(lines[i]);
  }

  return { summary, items };
}

export default function DailyStarCard({ result }) {
  const { summary, items } = parseDailyLines(result.text);

  return (
    <div className="dsc-wrap">
      {/* 별 파티클 */}
      <span className="dsc-spark dsc-spark-1">✦</span>
      <span className="dsc-spark dsc-spark-2">·</span>
      <span className="dsc-spark dsc-spark-3">✦</span>
      <span className="dsc-spark dsc-spark-4">·</span>

      <div className="dsc-card">
        {/* 상단 shimmer 라인 */}
        <div className="dsc-top-shimmer" />

        <div className="dsc-header">
          <span className="dsc-header-dot" />
          <span className="dsc-title">오늘 하루 나의 별숨</span>
          <span className="dsc-header-dot" />
        </div>

        {summary && (
          <div className="dsc-summary">{summary}</div>
        )}

        <div className="dsc-items">
          {items.map((item, i) => (
            <div
              key={i}
              className="dsc-item"
              style={{ '--dsc-delay': `${i * 0.08}s`, '--dsc-color': ITEM_COLORS[i] }}
            >
              <div className="dsc-item-icon-wrap">
                <span className="dsc-item-icon">{ITEM_ICONS[i]}</span>
              </div>
              <p className="dsc-item-text">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
