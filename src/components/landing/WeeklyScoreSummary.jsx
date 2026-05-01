function scoreColor(score) {
  if (score >= 80) return 'var(--gold)';
  if (score >= 60) return 'rgba(255,200,92,.72)';
  if (score >= 40) return 'rgba(212,204,230,.62)';
  return 'rgba(232,123,138,.72)';
}

export default function WeeklyScoreSummary({ scoreHistory = [], onClick }) {
  const validScores = scoreHistory.filter((s) => s.score !== null);
  if (!validScores.length) return null;

  const avg = Math.round(
    validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length,
  );

  const lastTwo = validScores.slice(-2);
  const delta =
    lastTwo.length === 2
      ? lastTwo[1].score - lastTwo[0].score
      : null;

  const deltaText =
    delta !== null
      ? delta > 0
        ? `어제보다 +${delta}점`
        : delta < 0
        ? `어제보다 ${delta}점`
        : '어제와 같아요'
      : null;

  // 막대 최대 높이 28px
  const maxScore = Math.max(...validScores.map((s) => s.score), 1);

  return (
    <button
      type="button"
      className="weekly-summary"
      onClick={onClick}
      aria-label={`최근 7일 운세 평균 ${avg}점, 통계 보기`}
    >
      <div className="weekly-summary-left">
        <div className="weekly-summary-label">최근 7일 운세 흐름</div>
        <div className="weekly-summary-text">
          평균 {avg}점{deltaText ? ` · ${deltaText}` : ''}
        </div>
      </div>

      <div className="weekly-mini-bars" aria-hidden="true">
        {scoreHistory.map((item, i) => {
          const hasScore = item.score !== null;
          const h = hasScore ? Math.max(4, Math.round((item.score / maxScore) * 28)) : 4;
          return (
            <div
              key={i}
              className="weekly-mini-bar"
              style={{
                height: h,
                background: hasScore ? scoreColor(item.score) : 'var(--line)',
                opacity: hasScore ? 1 : 0.35,
              }}
            />
          );
        })}
      </div>

      <span className="weekly-summary-arrow">›</span>
    </button>
  );
}
