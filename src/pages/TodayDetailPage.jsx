import { Suspense, useMemo } from 'react';
import DailyStarCardV2 from '../components/DailyStarCardV2.jsx';
import { useAppStore } from '../store/useAppStore.js';
import '../styles/TodayDetailPage.css';

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

// 간단한 주간 추세선 (Sparkline)
function WeeklyTrendChart({ kakaoId }) {
  // kakaoId 기반 해시를 사용해 이번 주 운세 흐름(점수 배열) 생성
  const trend = useMemo(() => {
    let hash = 0;
    const str = String(kakaoId || 'guest') + new Date().toISOString().slice(0, 10);
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = Math.abs(hash);

    const pts = [];
    let start = 50 + (hash % 30);
    for (let i = 0; i < 7; i++) {
      pts.push(start);
      const diff = ((hash >> i) % 30) - 15;
      start = Math.max(10, Math.min(100, start + diff));
    }
    return pts; // 7개의 점수 배열
  }, [kakaoId]);

  const max = Math.max(...trend);
  const min = Math.min(...trend);
  const range = max - min || 1;
  const points = trend.map((val, i) => {
    const x = (i / 6) * 100;
    const y = 100 - ((val - min) / range) * 80 - 10; // 10% ~ 90% 사이 패딩
    return `${x},${y}`;
  }).join(' ');

  const currentScore = trend[6];
  const prevScore = trend[5];
  const isUp = currentScore >= prevScore;

  return (
    <div style={{ 
      background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', 
      marginBottom: '16px', border: '1px solid var(--line)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>
            ✦ 나의 주간 운세 흐름
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>
            어제보다 <strong style={{ color: isUp ? '#ff7832' : '#7b9ec4' }}>{isUp ? '상승' : '하락'}세</strong>에 있어요
          </div>
        </div>
        <div style={{ fontSize: 24, lineHeight: 1 }}>{isUp ? '📈' : '📉'}</div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 60 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="var(--gold)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            style={{ opacity: 0.8 }}
          />
          {trend.map((val, i) => {
            const x = (i / 6) * 100;
            const y = 100 - ((val - min) / range) * 80 - 10;
            return i === 6 ? (
              <circle key={i} cx={x} cy={y} r="4" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="2" />
            ) : null;
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '9px', color: 'var(--t4)' }}>
        <span>6일 전</span>
        <span>오늘</span>
      </div>
    </div>
  );
}

/**
 * TodayDetailPage - "오늘 하루 나의 별숨" 운세 상세 페이지
 */
export default function TodayDetailPage({
  dailyResult,
  dailyLoading,
  gamificationState,
  onBlockBadtime = null,
  isBlockingBadtime,
  setStep,
  onRefresh,
}) {
  const kakaoId = useAppStore(s => s.user?.kakaoId || s.user?.id);

  return (
    <div className="today-detail-container">
      {/* 헤더 */}
      <div className="today-detail-header">
        <button
          className="today-detail-back-btn"
          onClick={() => setStep(0)}
          aria-label="홈으로 돌아가기"
        >
          ←
        </button>
        <span className="today-detail-title">오늘 하루 나의 별숨</span>
        <button
          className="today-detail-refresh-btn"
          onClick={onRefresh}
          aria-label="새로 불러오기"
          disabled={dailyLoading}
        >
          {dailyLoading ? '…' : '↻'}
        </button>
      </div>

      {/* 메인 카드 영역 */}
      <div className="today-detail-content">
        {dailyLoading && !dailyResult ? (
          <PageSpinner />
        ) : dailyResult ? (
          <Suspense fallback={<PageSpinner />}>
            <WeeklyTrendChart kakaoId={kakaoId} />
            <DailyStarCardV2
              result={dailyResult}
              onBlockBadtime={onBlockBadtime}
              isBlocking={isBlockingBadtime}
              canBlockBadtime={onBlockBadtime != null}
              currentBp={gamificationState?.currentBp || 0}
            />
          </Suspense>
        ) : (
          <div className="today-detail-empty">
            <div className="today-detail-empty-icon">🌙</div>
            <div className="today-detail-empty-text">
              운세를 불러오지 못했어요.<br />
              <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>아래 버튼을 눌러 다시 시도해봐요.</span>
            </div>
            {onRefresh && (
              <button
                className="today-intro-btn-primary"
                style={{ marginTop: 8, width: 'auto', padding: '12px 28px' }}
                onClick={onRefresh}
                disabled={dailyLoading}
              >
                다시 불러오기
              </button>
            )}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="today-detail-footer">
        <button
          className="today-detail-btn-home"
          onClick={() => setStep(0)}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
