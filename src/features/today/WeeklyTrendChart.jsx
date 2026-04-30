import { useState, useEffect, useRef } from 'react';
import { getAuthenticatedClient } from '../../lib/supabase.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCacheMap } from '../../lib/dailyDataAccess.js';

const PAD_X = 10;
const SVG_H = 80;
const PAD_Y = 18;
const LABEL_H = 14;

export default function WeeklyTrendChart({ kakaoId, todayScore }) {
  const [trend, setTrend] = useState(null);
  const containerRef = useRef(null);
  const [svgWidth, setSvgWidth] = useState(280);

  // Measure container width to avoid preserveAspectRatio="none" distortion
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSvgWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(el);
    setSvgWidth(Math.round(el.getBoundingClientRect().width) || 280);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!kakaoId) { setTrend([]); return; }
    let cancelled = false;

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return getDailyDateKey(d);
    });
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
      .from('daily_scores')
      .select('score_date, score')
      .eq('kakao_id', String(kakaoId))
      .in('score_date', last7)
      .then(({ data, error }) => {
        if (cancelled) return;
        const map = {};
        if (!error) {
          (data || []).forEach((row) => { map[row.score_date] = Number(row.score); });
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
  const rawMax = Math.max(...validVals);
  const rawMin = Math.min(...validVals);
  // Ensure minimum visible range so small differences don't exaggerate
  const midVal = (rawMax + rawMin) / 2;
  const halfRange = Math.max((rawMax - rawMin) / 2, 10);
  const chartMin = Math.max(0, midVal - halfRange);
  const chartMax = Math.min(100, midVal + halfRange);
  const range = chartMax - chartMin || 1;

  const plotH = SVG_H - 2 * PAD_Y;
  const toX = (i) => PAD_X + (i / 6) * (svgWidth - 2 * PAD_X);
  const toY = (val) => PAD_Y + plotH - ((val - chartMin) / range) * plotH;

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
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: SVG_H }}>
        <svg width={svgWidth} height={SVG_H} viewBox={`0 0 ${svgWidth} ${SVG_H}`}>
          {segments.map((s, si) => {
            const pts = s.map(({ i, val }) => `${toX(i)},${toY(val)}`).join(' ');
            return <polyline key={si} fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} style={{ opacity: 0.8 }} />;
          })}
          {trend.map((val, i) => {
            if (val === null) return null;
            const x = toX(i), y = toY(val);
            const isToday = i === 6;
            const labelY = y <= PAD_Y + LABEL_H ? y + LABEL_H + 2 : y - 6;
            return (
              <g key={i}>
                {isToday
                  ? <circle cx={x} cy={y} r="4" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="2" />
                  : segmentStarts.has(i) && i !== 0
                    ? <circle cx={x} cy={y} r="3" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="1.5" opacity="0.8" />
                    : <circle cx={x} cy={y} r="2.5" fill="var(--gold)" opacity="0.5" />}
                <text
                  x={x} y={labelY}
                  textAnchor="middle"
                  fontSize="8"
                  fill={isToday ? 'var(--gold)' : 'var(--t4)'}
                  fontWeight={isToday ? '700' : '400'}
                  style={{ pointerEvents: 'none' }}
                >
                  {val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--t4)' }}>
        <span>6일 전</span><span>오늘</span>
      </div>
    </div>
  );
}
