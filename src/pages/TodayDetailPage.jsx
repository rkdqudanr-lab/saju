import { Suspense } from 'react';
import DailyStarCardV2 from '../components/DailyStarCardV2.jsx';
import '../styles/TodayDetailPage.css';

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
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
  onBlockBadtime,
  isBlockingBadtime,
  setStep,
  onRefresh,
}) {
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
            <DailyStarCardV2
              result={dailyResult}
              onBlockBadtime={onBlockBadtime}
              isBlocking={isBlockingBadtime}
              canBlockBadtime={onBlockBadtime !== null}
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
