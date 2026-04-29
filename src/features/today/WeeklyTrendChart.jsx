import { useState, useEffect } from 'react';
import { getAuthenticatedClient } from '../../lib/supabase.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCacheMap } from '../../lib/dailyDataAccess.js';

export default function WeeklyTrendChart({ kakaoId, todayScore }) {
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    if (!kakaoId) { setTrend([]); return; }
    let cancelled = false;

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return getDailyDateKey(d);
    });
    // oldest→today order, non-mutating
    const orderedDates = [...last7].reverse();
    const todayKey = orderedDates[6];

    const buildTrend = (map) => orderedDates.map((date) => (map[date] != null ? Number(map[date]) : null));

    if (!canUseDailySupabaseTables()) {
      const cachedMap = readDailyLocalCacheMap(String(kakaoId), 'horoscope_score', last7);
      if (todayScore != null) cachedMap[todayKey] = String(todayScore);
      setTrend(buildTrend(cachedMap));
      return;
    }

    const trendClient = getAuthenticatedClient(String(kakaoId));
    if (!trendClient) {
      const fallback = orderedDates.map((date) => (date === todayKey && todayScore != null ? todayScore : null));
      setTrend(fallback);
      return;
    }

    trendClient
      .from('daily_cache')
      .select('cache_date, content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_type', 'horoscope_score')
      .in('cache_date', last7)
      .then(({ data, error }) => {
        if (cancelled) return;
        const map = {};
        if (!error) {
          (data || []).forEach((row) => { map[row.cache_date] = Number(row.content); });
        }
        if (todayScore != null) map[todayKey] = todayScore;
        setTrend(buildTrend(map));
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = orderedDates.map((date) => (date === todayKey && todayScore != null ? todayScore : null));
        setTrend(fallback);
      });

    return () => { cancelled = true; };
  }, [kakaoId, todayScore]);

  if (trend === null) {
    return (
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)', textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', margin: '0 auto 8px' }} />
        최근 점수를 불러오는 중...
      </div>
    );
  }

  if (!trend.some((v) => v !== null)) return null;

  const validVals = trend.filter((v) => v !== null);
  const max = Math.max(...validVals), min = Math.min(...validVals);
  const range = max - min || 1;
  const toY = (val) => 100 - ((val - min) / range) * 80 - 10;
  const toX = (i) => 8 + (i / 6) * 84;

  // Split into contiguous segments so gaps don't produce cross-gap lines
  const segments = [];
  let seg = [];
  trend.forEach((val, i) => {
    if (val !== null) {
      seg.push({ i, val });
    } else if (seg.length) {
      segments.push(seg);
      seg = [];
    }
  });
  if (seg.length) segments.push(seg);

  // Identify indices that are the first point of a new segment (after a gap)
  const segmentStarts = new Set(segments.filter((s) => s.length > 0).map((s) => s[0].i));

  const todayVal = trend[6];
  const yesterdayVal = trend.slice(0, 6).reverse().find((v) => v !== null);
  const isUp = todayVal !== null && yesterdayVal !== null && todayVal >= yesterdayVal;

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>최근 운세 흐름</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>
            {todayVal !== null && yesterdayVal !== null
              ? <>어제보다 <strong style={{ color: isUp ? '#ff7832' : '#7b9ec4' }}>{isUp ? '상승' : '하락'}</strong>했어요.</>
              : '오늘 점수가 쌓이면 흐름이 함께 기록돼요.'}
          </div>
        </div>
        {todayVal !== null && <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700 }}>{todayVal}점</div>}
      </div>
      <div style={{ position: 'relative', width: '100%', height: 60 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          {segments.map((s, si) => {
            const pts = s.map(({ i, val }) => `${toX(i)},${toY(val)}`).join(' ');
            return <polyline key={si} fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pts} style={{ opacity: 0.8 }} />;
          })}
          {trend.map((val, i) => {
            if (val === null) return null;
            const x = toX(i), y = toY(val);
            if (i === 6)
              return <circle key={i} cx={x} cy={y} r="4" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="2" />;
            // segment starts (after a gap) get a slightly more visible dot
            if (segmentStarts.has(i) && i !== 0)
              return <circle key={i} cx={x} cy={y} r="3" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="1.5" opacity="0.8" />;
            return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--gold)" opacity="0.5" />;
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--t4)' }}>
        <span>6일 전</span><span>오늘</span>
      </div>
    </div>
  );
}
