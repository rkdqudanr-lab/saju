import { Suspense, useState, useEffect, useCallback } from 'react';
import DailyStarCardV2 from '../components/DailyStarCardV2.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import '../styles/TodayDetailPage.css';

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

// 간단한 주간 추세선 (Sparkline) — 실제 daily_cache 데이터 사용
function WeeklyTrendChart({ kakaoId, todayScore }) {
  const [trend, setTrend] = useState(null); // null=로딩, []=[데이터없음]

  useEffect(() => {
    if (!kakaoId) { setTrend([]); return; }
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    const client = getAuthenticatedClient(String(kakaoId));
    client.from('daily_cache')
      .select('cache_date, content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_type', 'horoscope_score')
      .in('cache_date', last7)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(r => { map[r.cache_date] = Number(r.content); });
        const today = new Date().toISOString().slice(0, 10);
        if (todayScore != null) map[today] = todayScore;
        const pts = last7.reverse().map(date => map[date] ?? null);
        setTrend(pts);
      })
      .catch(() => setTrend([]));
  }, [kakaoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // todayScore prop이 바뀌면 마지막 포인트만 업데이트
  useEffect(() => {
    if (todayScore == null || !trend) return;
    setTrend(prev => {
      if (!prev) return prev;
      const next = [...prev];
      next[6] = todayScore;
      return next;
    });
  }, [todayScore]); // eslint-disable-line react-hooks/exhaustive-deps

  // 로딩 중
  if (trend === null) {
    return (
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', marginBottom: '16px', border: '1px solid var(--line)', textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', margin: '0 auto 8px' }} />
        점수 히스토리 불러오는 중...
      </div>
    );
  }

  // 실제 점수가 하나도 없으면 차트 숨김
  const hasAnyScore = trend.some(v => v !== null);
  if (!hasAnyScore) return null;

  // null 점수(기록 없는 날)는 선 연결에서 제외하고 도트만 표시
  const filled = trend.map(v => v ?? null);
  const validVals = filled.filter(v => v !== null);
  const max = Math.max(...validVals);
  const min = Math.min(...validVals);
  const range = max - min || 1;

  const toY = (val) => 100 - ((val - min) / range) * 80 - 10;

  // 연속된 non-null 구간을 polyline 세그먼트로 나눔
  const segments = [];
  let seg = [];
  filled.forEach((val, i) => {
    if (val !== null) {
      seg.push(`${(i / 6) * 100},${toY(val)}`);
    } else {
      if (seg.length > 1) segments.push(seg.join(' '));
      seg = [];
    }
  });
  if (seg.length > 1) segments.push(seg.join(' '));

  const todayVal = filled[6];
  const yesterdayVal = filled.slice(0, 6).reverse().find(v => v !== null);
  const isUp = todayVal !== null && yesterdayVal !== null && todayVal >= yesterdayVal;
  const hasTodayScore = todayVal !== null;

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', marginBottom: '16px', border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>
            ✦ 나의 주간 운세 흐름
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>
            {hasTodayScore && yesterdayVal !== null
              ? <>어제보다 <strong style={{ color: isUp ? '#ff7832' : '#7b9ec4' }}>{isUp ? '상승' : '하락'}세</strong>에 있어요</>
              : '오늘 운세를 확인하면 기록돼요'}
          </div>
        </div>
        {hasTodayScore && (
          <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: isUp ? '#ff7832' : '#7b9ec4', lineHeight: 1 }}>
            {isUp ? '↑' : '↓'}
          </div>
        )}
        {hasTodayScore && <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700 }}>{todayVal}점</div>}
      </div>
      <div style={{ position: 'relative', width: '100%', height: 60 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {segments.map((pts, si) => (
            <polyline key={si} fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pts} style={{ opacity: 0.8 }} />
          ))}
          {filled.map((val, i) => {
            if (val === null) return null;
            const x = (i / 6) * 100;
            const y = toY(val);
            return i === 6
              ? <circle key={i} cx={x} cy={y} r="4" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="2" />
              : <circle key={i} cx={x} cy={y} r="2.5" fill="var(--gold)" opacity="0.5" />;
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

// 정화 재점 오버레이 컴포넌트
function PurifyOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div className="purify-overlay" aria-hidden="true">
      <div className="purify-orb">
        <div className="purify-orb-core" />
        <div className="purify-ring purify-ring-1" />
        <div className="purify-ring purify-ring-2" />
        <div className="purify-ring purify-ring-3" />
      </div>
      <div className="purify-sparks">
        {['✦','·','✦','·','✦','·'].map((s, i) => (
          <span key={i} className={`purify-spark purify-spark-${i + 1}`}>{s}</span>
        ))}
      </div>
      <div className="purify-text">정화 중...</div>
    </div>
  );
}

/**
 * TodayDetailPage - "오늘 하루 나의 별숨" 운세 상세 페이지
 */
export default function TodayDetailPage({
  dailyResult,
  dailyLoading,
  dailyCount = 0,
  DAILY_MAX = 3,
  gamificationState,
  onBlockBadtime = null,
  isBlockingBadtime,
  setStep,
  onRefresh,
}) {
  const user = useAppStore(s => s.user);
  const kakaoId = user?.kakaoId || user?.id;
  const [isPurifying, setIsPurifying] = useState(false);

  const handlePurify = useCallback(async () => {
    if (isPurifying || dailyLoading || dailyCount >= DAILY_MAX) return;
    setIsPurifying(true);
    // 애니메이션 최소 1.2초 보장
    const animPromise = new Promise(r => setTimeout(r, 1200));
    try {
      await Promise.all([onRefresh?.(), animPromise]);
    } catch {
      await animPromise;
    } finally {
      setIsPurifying(false);
    }
  }, [isPurifying, dailyLoading, dailyCount, DAILY_MAX, onRefresh]);

  const canPurify = !isPurifying && !dailyLoading && dailyCount < DAILY_MAX;
  const remaining = DAILY_MAX - dailyCount;

  return (
    <div className="today-detail-container">
      {/* 정화 애니메이션 오버레이 */}
      <PurifyOverlay visible={isPurifying} />

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
        {/* 헤더 우측 빈 공간 (레이아웃 균형) */}
        <div style={{ width: 40 }} />
      </div>

      {/* 메인 카드 영역 */}
      <div className={`today-detail-content${isPurifying ? ' today-detail-content--blurred' : ''}`}>
        {dailyLoading && !dailyResult ? (
          <PageSpinner />
        ) : dailyResult ? (
          <Suspense fallback={<PageSpinner />}>
            <WeeklyTrendChart kakaoId={kakaoId} todayScore={dailyResult?.score} />
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
            <div className="today-detail-empty-icon" style={{ fontSize: '2rem', color: 'var(--t4)', marginBottom: 8 }}>✦</div>
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
          홈으로
        </button>

        {/* 정화 재점 버튼 — 결과가 있고 횟수 남아있을 때만 표시 */}
        {dailyResult && (
          canPurify ? (
            <button
              className="today-detail-btn-purify"
              onClick={handlePurify}
              disabled={!canPurify}
              aria-label={`정화 재점 (${remaining}회 남음)`}
            >
              <span className="purify-btn-icon">✦</span>
              정화 재점
              <span className="purify-btn-count">{remaining}/{DAILY_MAX}</span>
            </button>
          ) : dailyCount >= DAILY_MAX ? (
            <div className="today-detail-repoint-limit">
              오늘 재점 완료 · 내일 새로 만나요
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
