import { useState, useEffect } from 'react';
import { getAuthenticatedClient } from '../../lib/supabase.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCacheMap } from '../../lib/dailyDataAccess.js';

export default function WeeklyTrendChart({ kakaoId, todayScore }) {
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    if (!kakaoId) { setTrend([]); return; }
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10);
    });
    if (!canUseDailySupabaseTables()) {
      const cachedMap = readDailyLocalCacheMap(String(kakaoId), 'horoscope_score', last7);
      const today = getDailyDateKey();
      if (todayScore != null) cachedMap[today] = String(todayScore);
      setTrend(last7.reverse().map((date) => { const v = cachedMap[date]; return v == null ? null : Number(v); }));
      return;
    }
    getAuthenticatedClient(String(kakaoId))
      .from('daily_cache')
      .select('cache_date, content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_type', 'horoscope_score')
      .in('cache_date', last7)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((row) => { map[row.cache_date] = Number(row.content); });
        const today = new Date().toISOString().slice(0, 10);
        if (todayScore != null) map[today] = todayScore;
        setTrend(last7.reverse().map((date) => map[date] ?? null));
      })
      .catch(() => setTrend([]));
  }, [kakaoId, todayScore]);

  useEffect(() => {
    if (todayScore == null || !trend) return;
    setTrend((prev) => { if (!prev) return prev; const next = [...prev]; next[6] = todayScore; return next; });
  }, [todayScore]);

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

  const segments = [];
  let seg = [];
  trend.forEach((val, i) => {
    if (val !== null) { seg.push(`${(i / 6) * 100},${toY(val)}`); }
    else { if (seg.length > 1) segments.push(seg.join(' ')); seg = []; }
  });
  if (seg.length > 1) segments.push(seg.join(' '));

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
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {segments.map((pts, idx) => <polyline key={idx} fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pts} style={{ opacity: 0.8 }} />)}
          {trend.map((val, i) => {
            if (val === null) return null;
            const x = (i / 6) * 100, y = toY(val);
            return i === 6
              ? <circle key={i} cx={x} cy={y} r="4" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="2" />
              : <circle key={i} cx={x} cy={y} r="2.5" fill="var(--gold)" opacity="0.5" />;
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--t4)' }}>
        <span>6일 전</span><span>오늘</span>
      </div>
    </div>
  );
}
