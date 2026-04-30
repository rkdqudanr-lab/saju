import { useMemo } from 'react';
import { parseDailyLines } from '../../utils/parseDailyLines.js';
import { useSajuCtx } from '../../context/AppContext.jsx';

function scoreColor(score) {
  if (score >= 80) return '#f0b429';
  if (score >= 60) return '#7ec8e3';
  if (score >= 40) return '#a0c97b';
  return '#c9a0dc';
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
  const color = score ? scoreColor(score) : 'var(--gold)';

  // 로딩 중
  if (loading) {
    return (
      <div className="daily-mini-shimmer" aria-busy="true" aria-label="오늘의 별숨 불러오는 중" />
    );
  }

  // 운세 미조회
  if (!dailyResult) {
    return (
      <div className="daily-mini-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 8 }}>
          ✦ 오늘 하루 나의 별숨{dateLabel ? ` · ${dateLabel}` : ''}
        </div>
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7, marginBottom: 14 }}>
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
      style={{ width: '100%' }}
    >
      {/* 날짜 + 라벨 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '.06em' }}>
          ✦ 오늘 하루 나의 별숨{dateLabel ? ` · ${dateLabel}` : ''}
        </span>
        <span style={{ fontSize: 10, color: 'var(--t4)' }}>상세 보기 →</span>
      </div>

      {/* 점수 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <div className="daily-mini-score" style={{ color }}>
          {score}
        </div>
        <div style={{ paddingBottom: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>점</span>
          {scoreBoostDelta > 0 && (
            <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>
              +{scoreBoostDelta}↑
            </span>
          )}
        </div>
      </div>

      {/* 요약 */}
      {summary && (
        <div className="daily-mini-summary">"{summary}"</div>
      )}

      {/* 부스트 배지 */}
      {boostCount > 0 && (
        <div style={{
          marginTop: 10,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 9px',
          borderRadius: 999,
          background: 'var(--goldf)',
          border: '1px solid var(--acc)',
          fontSize: 10,
          color: 'var(--gold)',
          fontWeight: 700,
        }}>
          ✦ {boostCount}개 기운 적용 중
        </div>
      )}
    </button>
  );
}
