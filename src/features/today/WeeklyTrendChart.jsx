import { useState, useEffect, useRef } from 'react';
import { getAuthenticatedClient } from '../../lib/supabase.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCacheMap } from '../../lib/dailyDataAccess.js';

const SVG_H = 120;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;   // x축 날짜 공간
const Y_AXIS_W = 28;     // 왼쪽 y축 레이블 폭
const PAD_RIGHT = 8;

export default function WeeklyTrendChart({ kakaoId, todayScore }) {
  const [trend, setTrend] = useState(null);
  const containerRef = useRef(null);
  const [svgWidth, setSvgWidth] = useState(280);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSvgWidth(Math.round(entry.contentRect.width)));
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
      setTrend(orderedDates.map((d) => (d === todayKey && todayScore != null ? todayScore : null)));
      return;
    }

    trendClient.from('daily_scores').select('score_date, score')
      .eq('kakao_id', String(kakaoId)).in('score_date', last7)
      .then(({ data, error }) => {
        if (cancelled) return;
        const map = {};
        if (!error) (data || []).forEach((r) => { map[r.score_date] = Number(r.score); });
        if (todayScore != null) map[todayKey] = todayScore;
        setTrend(buildTrend(map));
      })
      .catch(() => {
        if (!cancelled) setTrend(orderedDates.map((d) => (d === todayKey && todayScore != null ? todayScore : null)));
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
  const midVal = (rawMax + rawMin) / 2;
  const halfRange = Math.max((rawMax - rawMin) / 2, 10);
  const chartMin = Math.max(0, Math.floor((midVal - halfRange) / 10) * 10);
  const chartMax = Math.min(100, Math.ceil((midVal + halfRange) / 10) * 10);
  const range = chartMax - chartMin || 1;

  const plotW = svgWidth - Y_AXIS_W - PAD_RIGHT;
  const plotH = SVG_H - PAD_TOP - PAD_BOTTOM;

  const toX = (i) => Y_AXIS_W + (i / 6) * plotW;
  const toY = (val) => PAD_TOP + plotH - ((val - chartMin) / range) * plotH;

  // y축 눈금 (3개: min, mid, max)
  const yTicks = [chartMin, Math.round((chartMin + chartMax) / 2), chartMax];

  // x축 날짜 레이블
  const xDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  // 세그먼트 분리
  const segments = [];
  let seg = [];
  trend.forEach((val, i) => {
    if (val !== null) { seg.push({ i, val }); }
    else if (seg.length) { segments.push(seg); seg = []; }
  });
  if (seg.length) segments.push(seg);

  const todayVal = trend[6];
  const yesterdayVal = trend.slice(0, 6).reverse().find((v) => v !== null);
  const isUp = todayVal !== null && yesterdayVal !== null && todayVal >= yesterdayVal;

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
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

      <div ref={containerRef} style={{ width: '100%' }}>
        <svg width={svgWidth} height={SVG_H} viewBox={`0 0 ${svgWidth} ${SVG_H}`}>
          {/* y축 그리드 + 레이블 */}
          {yTicks.map((tick) => {
            const y = toY(tick);
            return (
              <g key={tick}>
                <line x1={Y_AXIS_W} y1={y} x2={svgWidth - PAD_RIGHT} y2={y}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
                <text x={Y_AXIS_W - 4} y={y + 3.5} textAnchor="end"
                  fontSize="8" fill="var(--t4)">{tick}</text>
              </g>
            );
          })}

          {/* y축 선 */}
          <line x1={Y_AXIS_W} y1={PAD_TOP} x2={Y_AXIS_W} y2={PAD_TOP + plotH}
            stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* 데이터 라인 */}
          {segments.map((s, si) => (
            <polyline key={si} fill="none" stroke="var(--gold)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              points={s.map(({ i, val }) => `${toX(i)},${toY(val)}`).join(' ')}
              style={{ opacity: 0.85 }} />
          ))}

          {/* 데이터 포인트 */}
          {trend.map((val, i) => {
            if (val === null) return null;
            const x = toX(i), y = toY(val);
            const isToday = i === 6;
            const labelY = y <= PAD_TOP + 10 ? y + 12 : y - 5;
            return (
              <g key={i}>
                {isToday
                  ? <circle cx={x} cy={y} r="4" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="2" />
                  : <circle cx={x} cy={y} r="2.5" fill="var(--gold)" opacity="0.55" />}
                <text x={x} y={labelY} textAnchor="middle" fontSize="8"
                  fill={isToday ? 'var(--gold)' : 'var(--t4)'}
                  fontWeight={isToday ? '700' : '400'}
                  style={{ pointerEvents: 'none' }}>{val}</text>
              </g>
            );
          })}

          {/* x축 날짜 레이블 — 첫날/마지막날 + 중간 표시 */}
          {xDates.map((label, i) => {
            // 7개 중 첫날·중간·마지막만 표시
            if (i !== 0 && i !== 3 && i !== 6) return null;
            return (
              <text key={i} x={toX(i)} y={SVG_H - 4}
                textAnchor={i === 0 ? 'start' : i === 6 ? 'end' : 'middle'}
                fontSize="8" fill="var(--t4)">{label}</text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
