import { useMemo } from 'react';
import { parseDailyLines } from '../../utils/parseDailyLines.js';
import { useSajuCtx } from '../../context/AppContext.jsx';

function scoreTone(score) {
  if (score >= 85) {
    return { label: '강한 흐름' };
  }
  if (score >= 70) {
    return { label: '좋은 흐름' };
  }
  if (score >= 55) {
    return { label: '안정 흐름' };
  }
  if (score >= 40) {
    return { label: '조율 필요' };
  }
  return { label: '차분히 보기' };
}

export default function DailyMiniCard({
  dailyResult,
  todayScore,
  loading = false,
  onAsk,
  onClick,
  boostCount = 0,
  scoreBoostDelta = 0,
}) {
  const { today } = useSajuCtx();

  const parsed = useMemo(
    () => parseDailyLines(dailyResult?.text || ''),
    [dailyResult?.text],
  );

  const score = todayScore || parsed.score || dailyResult?.score;
  const summary = parsed.summary || (dailyResult?.text || '').slice(0, 60);
  const dateLabel = today ? `${today.month}월 ${today.day}일` : '';
  const tone = score ? scoreTone(score) : scoreTone(0);
  const scorePct = Math.max(0, Math.min(100, Number(score) || 0));

  // 로딩 중
  if (loading) {
    return (
      <div className="daily-mini-loading" aria-busy="true" aria-label="오늘의 별숨 불러오는 중">
        <div className="daily-mini-loading-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="daily-mini-loading-text">오늘의 별숨을 읽는 중</div>
        <div className="daily-mini-loading-sub">사주와 별자리 흐름을 맞춰보고 있어요</div>
      </div>
    );
  }

  // 운세 미조회
  if (!dailyResult) {
    return (
      <div className="daily-mini-card daily-mini-card--empty" style={{ textAlign: 'center' }}>
        <div className="daily-mini-eyebrow">
          ✦ 오늘 하루 나의 별숨{dateLabel ? ` · ${dateLabel}` : ''}
        </div>
        <div className="daily-mini-empty-copy">
          별이 오늘의 기운을 알려드릴게요
        </div>
        <button
          type="button"
          className="daily-mini-cta"
          onClick={onAsk}
          aria-label="오늘 별숨의 기운 확인하기"
        >
          오늘 별숨의 기운 확인하기 ✦
        </button>
      </div>
    );
  }

  // 운세 조회 완료
  return (
    <button
      type="button"
      className="daily-mini-card"
      onClick={onClick}
      aria-label={`오늘의 별숨 ${score}점, 상세 보기`}
      style={{
        width: '100%',
        '--daily-score-pct': `${scorePct}%`,
      }}
    >
      <div className="daily-mini-glow" aria-hidden="true" />

      <div className="daily-mini-topline">
        <span className="daily-mini-eyebrow">
          ✦ 오늘 하루 나의 별숨{dateLabel ? ` · ${dateLabel}` : ''}
        </span>
        <span className="daily-mini-link">상세 보기 →</span>
      </div>

      <div className="daily-mini-main">
        <div className="daily-mini-score-wrap">
          <div className="daily-mini-score">
            <span>{score}</span>
            <small>점</small>
          </div>
          <div className="daily-mini-score-state">{tone.label}</div>
        </div>
      </div>

      {(scoreBoostDelta > 0 || boostCount > 0) && (
        <div className="daily-mini-badges">
          {scoreBoostDelta > 0 && (
            <span className="daily-mini-badge">
              +{scoreBoostDelta}↑
            </span>
          )}
          {boostCount > 0 && (
            <span className="daily-mini-badge">
              ✦ {boostCount}개 기운 적용 중
            </span>
          )}
        </div>
      )}

      {summary && (
        <div className="daily-mini-summary">"{summary}"</div>
      )}

      <div className="daily-mini-meter" aria-hidden="true">
        <span />
      </div>
    </button>
  );
}
