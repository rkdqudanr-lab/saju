import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import DailyStarCardV2 from '../components/DailyStarCardV2.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import '../styles/TodayDetailPage.css';
import {
  GACHA_POOL,
  GRADE_CONFIG as SPACE_GRADE_CONFIG,
  SAJU_POOL,
  SAJU_GRADE_CONFIG,
} from '../utils/gachaItems.js';

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

const AXES_8 = [
  { key: 'overall', label: '종합' },
  { key: 'wealth', label: '금전' },
  { key: 'love', label: '애정' },
  { key: 'career', label: '직장' },
  { key: 'study', label: '학업' },
  { key: 'health', label: '건강' },
  { key: 'social', label: '대인' },
  { key: 'travel', label: '이동' },
  { key: 'create', label: '창의' },
];

const ASPECT_META = {
  overall: { label: '종합', emoji: '✨' },
  wealth: { label: '금전', emoji: '💰' },
  love: { label: '애정', emoji: '💞' },
  career: { label: '직장', emoji: '📈' },
  study: { label: '학업', emoji: '📚' },
  health: { label: '건강', emoji: '🌿' },
  social: { label: '대인', emoji: '🤝' },
  travel: { label: '이동', emoji: '🧭' },
  create: { label: '창의', emoji: '🎨' },
};

const ALL_SPIRIT_MAP = Object.fromEntries(
  [...GACHA_POOL, ...SAJU_POOL].map((item) => [item.id, item])
);

function getItemGradeConfig(item) {
  if (!item?.grade) return {};
  return SPACE_GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG[item.grade] || {};
}

function getDailyAxisScores(baseScore, equippedItems) {
  const todayDate = new Date().toISOString().slice(0, 10);

  const getDailyNoise = (idx) => {
    const val = Number(todayDate.replace(/-/g, '')) + idx;
    return (((val * 9301 + 49297) % 233280) / 233280) * 16 - 8;
  };

  return AXES_8.map((axis, idx) => {
    const base = Math.max(20, Math.min(85, (baseScore || 60) + getDailyNoise(idx)));
    let bonus = 0;
    let boostItem = null;

    (equippedItems || []).forEach((item) => {
      if (item.aspectKey === axis.key) {
        bonus += item.boost || 0;
        if (!boostItem) boostItem = item;
      } else if (item.category === 'talisman' && item.type === axis.key) {
        const talismanBoost = item.boost || 10;
        bonus += talismanBoost;
        if (!boostItem) boostItem = item;
      }
    });

    return {
      key: axis.key,
      label: axis.label,
      base: Math.round(base),
      total: Math.min(100, Math.round(base + bonus)),
      bonus: Math.round(bonus),
      boostItem,
    };
  });
}

function DailyRadarChart({ baseScore, equippedItems }) {
  const scores = getDailyAxisScores(baseScore, equippedItems);
  const cx = 130;
  const cy = 130;
  const r = 90;
  const n = AXES_8.length;
  const angleStep = (2 * Math.PI) / n;
  const toXY = (angle, radius) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  const basePoints = scores.map((s, i) => {
    const pt = toXY(angleStep * i, (s.base / 100) * r);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const totalPoints = scores.map((s, i) => {
    const pt = toXY(angleStep * i, (s.total / 100) * r);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const bonusAcc = scores.reduce((acc, s) => acc + s.bonus, 0);

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>
            오늘의 운세 점수
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>
            {bonusAcc > 0
              ? <span style={{ color: 'var(--gold)' }}>아이템 효과가 점수에 바로 반영되고 있어요.</span>
              : '오늘 운세를 본 뒤 더 올리고 싶은 항목에 아이템을 사용할 수 있어요.'}
          </div>
        </div>
      </div>

      <svg viewBox="0 0 260 260" width="100%" style={{ maxWidth: 280, display: 'block', margin: '0 auto' }}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((level) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = toXY(angleStep * i, level * r);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={level} points={pts} fill="none" stroke="var(--line)" strokeWidth="1" />;
        })}

        {Array.from({ length: n }, (_, i) => {
          const outer = toXY(angleStep * i, r);
          return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--line)" strokeWidth="1" />;
        })}

        <polygon points={basePoints} fill="rgba(255,255,255,0.06)" stroke="var(--t4)" strokeWidth="1.5" strokeLinejoin="round" />

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

        {scores.map((s, i) => {
          const pt = toXY(angleStep * i, (s.total / 100) * r);
          return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill={s.bonus > 0 ? 'var(--gold)' : 'var(--t4)'} style={{ transition: 'all 0.5s ease' }} />;
        })}

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
              fill={hasBonus ? 'var(--gold)' : 'var(--t2)'}
              fontSize={hasBonus ? '12' : '10'}
              fontWeight={hasBonus ? '700' : '400'}
              fontFamily="var(--ff)"
            >
              {s.label}
            </text>
          );
        })}
      </svg>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {scores.map((s) => (
          <div key={s.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ minWidth: 34, fontSize: 11, color: s.bonus > 0 ? 'var(--gold)' : 'var(--t3)', fontWeight: s.bonus > 0 ? 700 : 400 }}>
                {s.label}
              </span>
              <div style={{ flex: 1, height: 5, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${s.total}%`,
                    background: s.bonus > 0 ? 'linear-gradient(90deg, var(--t4) 0%, var(--gold) 100%)' : 'var(--t4)',
                    borderRadius: 3,
                    transition: 'width 0.6s ease-out',
                  }}
                />
              </div>
              <span style={{ minWidth: 30, textAlign: 'right', fontSize: 11, fontWeight: 700, color: s.bonus > 0 ? 'var(--gold)' : 'var(--t3)' }}>
                {s.total}
              </span>
            </div>
            {s.bonus > 0 && s.boostItem && (
              <div style={{ paddingLeft: 42, marginTop: 2, fontSize: 10, color: 'var(--gold)', lineHeight: 1.4 }}>
                {s.boostItem.name} 효과로 +{s.bonus}점이 반영됐어요.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyTrendChart({ kakaoId, todayScore }) {
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    if (!kakaoId) {
      setTrend([]);
      return;
    }
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
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
        (data || []).forEach((row) => { map[row.cache_date] = Number(row.content); });
        const today = new Date().toISOString().slice(0, 10);
        if (todayScore != null) map[today] = todayScore;
        setTrend(last7.reverse().map((date) => map[date] ?? null));
      })
      .catch(() => setTrend([]));
  }, [kakaoId, todayScore]);

  useEffect(() => {
    if (todayScore == null || !trend) return;
    setTrend((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[6] = todayScore;
      return next;
    });
  }, [todayScore]);

  if (trend === null) {
    return (
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)', textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', margin: '0 auto 8px' }} />
        최근 점수를 불러오는 중...
      </div>
    );
  }

  const hasAnyScore = trend.some((v) => v !== null);
  if (!hasAnyScore) return null;

  const validVals = trend.filter((v) => v !== null);
  const max = Math.max(...validVals);
  const min = Math.min(...validVals);
  const range = max - min || 1;
  const toY = (val) => 100 - ((val - min) / range) * 80 - 10;

  const segments = [];
  let seg = [];
  trend.forEach((val, i) => {
    if (val !== null) {
      seg.push(`${(i / 6) * 100},${toY(val)}`);
    } else {
      if (seg.length > 1) segments.push(seg.join(' '));
      seg = [];
    }
  });
  if (seg.length > 1) segments.push(seg.join(' '));

  const todayVal = trend[6];
  const yesterdayVal = trend.slice(0, 6).reverse().find((v) => v !== null);
  const isUp = todayVal !== null && yesterdayVal !== null && todayVal >= yesterdayVal;

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>
            최근 운세 흐름
          </div>
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
          {segments.map((pts, idx) => (
            <polyline key={idx} fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pts} style={{ opacity: 0.8 }} />
          ))}
          {trend.map((val, i) => {
            if (val === null) return null;
            const x = (i / 6) * 100;
            const y = toY(val);
            return i === 6
              ? <circle key={i} cx={x} cy={y} r="4" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="2" />
              : <circle key={i} cx={x} cy={y} r="2.5" fill="var(--gold)" opacity="0.5" />;
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--t4)' }}>
        <span>6일 전</span>
        <span>오늘</span>
      </div>
    </div>
  );
}

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
        {['✦', '✧', '✦', '✧', '✦'].map((spark, idx) => (
          <span key={idx} className={`purify-spark purify-spark-${idx + 1}`}>{spark}</span>
        ))}
      </div>
      <div className="purify-text">정화 재점 중...</div>
    </div>
  );
}

function BoostCTA({ hasBoostedToday, canPurify, remaining, onPurify, isPurifying, setStep }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r1)',
      padding: '14px 16px',
      marginBottom: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div>
        <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>
          기운 보강
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>
          {hasBoostedToday
            ? '아이템을 쓴 뒤 다시 정화 재점을 눌러 오늘 흐름을 새로 확인할 수 있어요.'
            : '샵이나 보관함에서 오늘 점수를 올릴 아이템을 더 준비할 수 있어요.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setStep(38)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'transparent',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--r1)',
            color: 'var(--t3)',
            fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
          }}
        >
          내 아이템 보기
        </button>
        {canPurify ? (
          <button
            onClick={onPurify}
            disabled={isPurifying}
            style={{
              flex: 1.3,
              padding: '10px 12px',
              background: 'var(--goldf)',
              border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)',
              color: 'var(--gold)',
              fontWeight: 700,
              fontSize: 'var(--xs)',
              fontFamily: 'var(--ff)',
              cursor: isPurifying ? 'not-allowed' : 'pointer',
              opacity: isPurifying ? 0.6 : 1,
            }}
          >
            {isPurifying ? '재점 중...' : `정화재점 (${remaining}회 남음)`}
          </button>
        ) : (
          <div style={{
            flex: 1.1,
            padding: '10px 12px',
            background: 'var(--bg3)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--xs)',
            color: 'var(--t4)',
          }}>
            오늘 재점 완료
          </div>
        )}
      </div>
    </div>
  );
}

function ItemDetailModal({ row, onClose, onUse }) {
  if (!row?.item) return null;
  const item = row.item;
  const cfg = getItemGradeConfig(item);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(6, 8, 16, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--bg1)',
          borderRadius: 20,
          border: `1px solid ${cfg.border || 'var(--line)'}`,
          boxShadow: cfg.border ? `0 20px 50px ${cfg.border}` : '0 20px 50px rgba(0,0,0,.25)',
          padding: '22px 20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: cfg.bg || 'var(--bg2)',
            border: `1px solid ${cfg.border || 'var(--line)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            flexShrink: 0,
          }}>
            {item.emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: cfg.color || 'var(--gold)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 6 }}>
              {cfg.label || item.grade}
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 800, lineHeight: 1.35, marginBottom: 6 }}>
              {item.name}
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700 }}>
              {item.effectLabel || `+${item.boost} boost`}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
            ITEM STORY
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>
            {item.description || item.effect || '설명이 아직 준비되지 않았어요.'}
          </div>
        </div>

        {item.effect && (
          <div style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
              TODAY EFFECT
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>
              {item.effect}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px 12px',
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--t3)',
              fontSize: 'var(--xs)',
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
          <button
            onClick={() => onUse(row)}
            style={{
              flex: 1.4,
              padding: '11px 12px',
              borderRadius: 12,
              border: '1px solid var(--acc)',
              background: 'var(--goldf)',
              color: 'var(--gold)',
              fontSize: 'var(--xs)',
              fontWeight: 700,
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
            }}
          >
            이 아이템 쓰기
          </button>
        </div>
      </div>
    </div>
  );
}

function OneShotItemPicker({ scores, ownedRows, onUse, onInspect }) {
  const byAxis = {};
  for (const row of ownedRows) {
    const aspectKey = row.item?.aspectKey;
    if (!aspectKey || !ASPECT_META[aspectKey]) continue;
    if (!byAxis[aspectKey]) byAxis[aspectKey] = [];
    byAxis[aspectKey].push(row);
  }

  const hasAny = Object.values(byAxis).some((list) => list.length > 0);
  if (!hasAny) return null;

  return (
    <div style={{
      background: 'var(--bg2)',
      borderRadius: 'var(--r1)',
      border: '1px solid var(--line)',
      padding: 16,
      marginBottom: 16,
    }}>
      <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 6 }}>
        TODAY BOOST ITEMS
      </div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 14, lineHeight: 1.6 }}>
        오늘 별숨을 본 뒤 더 올리고 싶은 항목에 바로 아이템을 써보세요. 카드를 누르면 설명을 먼저 볼 수 있어요.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {scores.map((score) => {
          const rows = byAxis[score.key] || [];
          if (rows.length === 0) return null;

          return (
            <div key={score.key} style={{ padding: 12, borderRadius: 14, background: 'var(--bg1)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{ASPECT_META[score.key]?.emoji || '✦'}</span>
                  <div>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)' }}>{score.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>현재 {score.total}점</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>
                  사용 가능 {rows.length}개
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                {rows.map((row) => {
                  const item = row.item;
                  const cfg = getItemGradeConfig(item);
                  return (
                    <button
                      key={row.rowId}
                      onClick={() => onInspect(row)}
                      style={{
                        flexShrink: 0,
                        minWidth: 132,
                        textAlign: 'left',
                        borderRadius: 14,
                        border: `1px solid ${cfg.border || 'var(--line)'}`,
                        background: cfg.bg || 'var(--bg2)',
                        padding: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{item.emoji}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: cfg.color || 'var(--gold)', fontWeight: 700 }}>
                            {cfg.label || item.grade}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--t1)', fontWeight: 700, lineHeight: 1.3, wordBreak: 'keep-all' }}>
                            {item.name}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.45, minHeight: 28 }}>
                        {item.description || item.effect}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                        <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>
                          +{item.boost}점
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onUse(row);
                          }}
                          style={{
                            padding: '5px 9px',
                            borderRadius: 999,
                            border: '1px solid var(--acc)',
                            background: 'var(--goldf)',
                            color: 'var(--gold)',
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          사용
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const user = useAppStore((s) => s.user);
  const kakaoId = user?.kakaoId || user?.id;
  const equippedTalisman = useAppStore((s) => s.equippedTalisman);
  const storeEquippedItems = useAppStore((s) => s.equippedItems) || [];
  const [usedItems, setUsedItems] = useState([]);
  const [ownedRows, setOwnedRows] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isPurifying, setIsPurifying] = useState(false);

  const mergedEquippedItems = useMemo(() => ([
    ...(equippedTalisman
      ? [...storeEquippedItems.filter((item) => item.id !== equippedTalisman.id), equippedTalisman]
      : storeEquippedItems),
    ...usedItems,
  ]), [equippedTalisman, storeEquippedItems, usedItems]);

  const axisScores = useMemo(
    () => getDailyAxisScores(dailyResult?.score, mergedEquippedItems),
    [dailyResult?.score, mergedEquippedItems]
  );

  useEffect(() => {
    if (!kakaoId || !dailyResult) return;
    const client = getAuthenticatedClient(String(kakaoId));
    client.from('user_shop_inventory')
      .select('id, item_id')
      .eq('kakao_id', String(kakaoId))
      .then(({ data }) => {
        const rows = (data || [])
          .map((row) => ({ rowId: row.id, item: ALL_SPIRIT_MAP[String(row.item_id)] }))
          .filter((row) => row.item?.aspectKey);
        setOwnedRows(rows);
      })
      .catch(() => setOwnedRows([]));
  }, [kakaoId, dailyResult]);

  const handleUseItem = useCallback(async (row) => {
    if (!kakaoId) return;
    try {
      const client = getAuthenticatedClient(String(kakaoId));
      await client.from('user_shop_inventory').delete().eq('id', row.rowId);
      setOwnedRows((prev) => (prev || []).filter((item) => item.rowId !== row.rowId));
      setUsedItems((prev) => [...prev, row.item]);
      setSelectedRow(null);
    } catch {
      // ignore for now
    }
  }, [kakaoId]);

  const handlePurify = useCallback(async () => {
    if (isPurifying || dailyLoading || dailyCount >= DAILY_MAX) return;
    setIsPurifying(true);
    const animPromise = new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      await Promise.all([onRefresh?.(), animPromise]);
      setUsedItems([]);
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
      <PurifyOverlay visible={isPurifying} />

      <div className="today-detail-header">
        <button className="today-detail-back-btn" onClick={() => setStep(0)} aria-label="홈으로 돌아가기">
          ←
        </button>
        <span className="today-detail-title">오늘 하루 나의 별숨</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={`today-detail-content${isPurifying ? ' today-detail-content--blurred' : ''}`}>
        {dailyLoading && !dailyResult ? (
          <PageSpinner />
        ) : dailyResult ? (
          <Suspense fallback={<PageSpinner />}>
            <DailyRadarChart baseScore={dailyResult?.score} equippedItems={mergedEquippedItems} />

            {ownedRows && ownedRows.length > 0 && (
              <OneShotItemPicker
                scores={axisScores}
                ownedRows={ownedRows}
                onUse={handleUseItem}
                onInspect={setSelectedRow}
              />
            )}

            <WeeklyTrendChart kakaoId={kakaoId} todayScore={dailyResult?.score} />

            <BoostCTA
              hasBoostedToday={usedItems.length > 0}
              canPurify={canPurify}
              remaining={remaining}
              onPurify={handlePurify}
              isPurifying={isPurifying}
              setStep={setStep}
            />

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
              <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>아래 버튼으로 다시 시도해 주세요.</span>
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

      <div className="today-detail-footer">
        <button className="today-detail-btn-home" onClick={() => setStep(0)}>
          홈으로
        </button>
        {usedItems.length > 0 && canPurify && (
          <button
            className="today-detail-btn-home"
            onClick={handlePurify}
            disabled={isPurifying}
            style={{
              background: 'var(--goldf)',
              border: '1px solid var(--acc)',
              color: 'var(--gold)',
              marginLeft: 8,
              opacity: isPurifying ? 0.7 : 1,
            }}
          >
            {isPurifying ? '재점 중...' : `정화재점 (${remaining}회 남음)`}
          </button>
        )}
      </div>

      {selectedRow && (
        <ItemDetailModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onUse={handleUseItem}
        />
      )}
    </div>
  );
}
