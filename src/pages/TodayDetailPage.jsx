import { Suspense } from 'react';
import DailyStarCardV2 from '../components/DailyStarCardV2.jsx';
import PageSpinner from '../components/PageSpinner.jsx';
import '../styles/TodayDetailPage.css';

/**
 * TodayDetailPage - "오늘 하루 나의 별숨" 운세 상세 페이지
 * 전체 화면 모드에서 오늘의 운세를 상세히 보여주는 페이지
 */
export default function TodayDetailPage({
  dailyResult,
  gamificationState,
  onBlockBadtime,
  isBlockingBadtime,
  setStep,
}) {
  return (
    <div className="today-detail-container">
      {/* 헤더 */}
      <div className="today-detail-header">
        <button
          className="today-detail-back-btn"
          onClick={() => setStep(22)}
          aria-label="뒤로 가기"
        >
          ←
        </button>
        <span className="today-detail-title">오늘 하루 나의 별숨</span>
        <button
          className="today-detail-refresh-btn"
          onClick={() => window.location.reload()}
          aria-label="새로고침"
        >
          🔄
        </button>
      </div>

      {/* 메인 카드 영역 */}
      <div className="today-detail-content">
        <Suspense fallback={<PageSpinner />}>
          <DailyStarCardV2
            result={dailyResult}
            onBlockBadtime={onBlockBadtime}
            isBlocking={isBlockingBadtime}
            canBlockBadtime={onBlockBadtime !== null}
            currentBp={gamificationState?.currentBp || 0}
          />
        </Suspense>
      </div>

      {/* 하단 버튼 */}
      <div className="today-detail-footer">
        <button
          className="today-detail-btn-primary"
          onClick={() => setStep(0)}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
