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

// ─────────────────────────────────────────────
// 8축 운세 레이더 차트 (오늘의 운세 + 장착 아이템 보너스)
// ─────────────────────────────────────────────
const AXES_8 = [
  { key: 'overall', label: '종합' },
  { key: 'wealth',  label: '금전' },
  { key: 'love',    label: '애정' },
  { key: 'career',  label: '직장' },
  { key: 'study',   label: '학업' },
  { key: 'health',  label: '건강' },
  { key: 'social',  label: '대인' },
  { key: 'travel',  label: '이동' },
  { key: 'create',  label: '창의' },
];

function DailyRadarChart({ baseScore, equippedItems }) {
  // 오늘 날짜 기반으로 약간의 노이즈(난수)를 만들어 카테고리별 기본 점수 편차 생성
  const todayDate = new Date().toISOString().slice(0, 10);
  const getDailyNoise = (idx) => {
    // 아주 간단한 일관성 있는 난수 생성
    const val = Number(todayDate.replace(/-/g, '')) + idx;
    return (((val * 9301 + 49297) % 233280) / 233280) * 16 - 8; // -8 ~ +8
  };

  const scores = AXES_8.map((axis, i) => {
    let base = Math.max(20, Math.min(85, (baseScore || 60) + getDailyNoise(i)));
    let bonus = 0;
    
    // 장착된 아이템의 효과(boost) 합산
    (equippedItems || []).forEach(item => {
      // 아이템의 aspectKey가 현재 축과 돌일하다면 합산
      if (item.aspectKey === axis.key) {
        bonus += item.boost || 0;
      } else if (item.category === 'talisman' && item.type === axis.key) {
        // 하위 호환
        bonus += 10;
      }
    });

    return {
      label: axis.label,
      base: Math.round(base),
      total: Math.min(100, Math.round(base + bonus)),
      bonus: Math.round(bonus)
    };
  });

  const cx = 130, cy = 130, r = 90;
  const n = AXES_8.length;
  const angleStep = (2 * Math.PI) / n;
  const toXY = (angle, radius) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  // 폴리곤 경로 계산
  const basePoints = scores.map((s, i) => {
    const pt = toXY(angleStep * i, (s.base / 100) * r);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const totalPoints = scores.map((s, i) => {
    const pt = toXY(angleStep * i, (s.total / 100) * r);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  // 아이템 장착 안내 문구 조립
  const bonusAcc = scores.reduce((acc, s) => acc + s.bonus, 0);

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', marginBottom: '16px', border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>
            ✦ 8대 기운 레이더
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>
            {bonusAcc > 0 ? (
              <span style={{ color: 'var(--gold)' }}>아이템 효과로 기운이 채워졌어요!</span>
            ) : (
              '아이템을 장착하면 찌그러진 기운을 채울 수 있어요'
            )}
          </div>
        </div>
      </div>
      
      <svg viewBox="0 0 260 260" width="100%" style={{ maxWidth: 280, display: 'block', margin: '0 auto' }}>
        {/* 배경 팔각형 격자 */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map(level => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = toXY(angleStep * i, level * r);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={level} points={pts} fill="none" stroke="var(--line)" strokeWidth="1" />;
        })}

        {/* 축 선 */}
        {Array.from({ length: n }, (_, i) => {
          const outer = toXY(angleStep * i, r);
          return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--line)" strokeWidth="1" />;
        })}

        {/* 기본 점수 영역 (회색) */}
        <polygon
          points={basePoints}
          fill="rgba(255,255,255,0.06)"
          stroke="var(--t4)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* 부스트 후 점수 영역 (골드) */}
        {bonusAcc > 0 && (
          <polygon
            points={totalPoints}
            fill="rgba(232,176,72,0.15)"
            stroke="var(--gold)"
            strokeWidth="2"
            strokeLinejoin="round"
            style={{ transition: 'all 0.5s ease-out' }}
          />
        )}

        {/* 데이터 포인트 */}
        {scores.map((s, i) => {
          const pt = toXY(angleStep * i, (s.total / 100) * r);
          return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill={s.bonus > 0 ? "var(--gold)" : "var(--t4)"} style={{ transition: 'all 0.5s ease' }} />;
        })}

        {/* 축 레이블 */}
        {scores.map((s, i) => {
          const pt = toXY(angleStep * i, r + 22);
          const hasBonus = s.bonus > 0;
          return (
            <text
              key={i}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={hasBonus ? "var(--gold)" : "var(--t2)"}
              fontSize={hasBonus ? "12" : "10"}
              fontWeight={hasBonus ? "700" : "400"}
              fontFamily="var(--ff)"
            >
              {s.label}
            </text>
          );
        })}
      </svg>
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
            <DailyRadarChart baseScore={dailyResult?.score} equippedItems={user?.equippedItems || useAppStore.getState().equippedItems} />
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

      </div>
    </div>
  );
}
