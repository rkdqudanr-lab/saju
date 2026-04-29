import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseDailyLines } from '../utils/parseDailyLines.js';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { STEP } from '../utils/steps.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCache, writeDailyLocalCache } from '../lib/dailyDataAccess.js';
import '../styles/TodayDetailPage.css';
import { findItem } from '../utils/gachaItems.js';

import DailyRadarChart from '../features/today/DailyRadarChart.jsx';
import WeeklyTrendChart from '../features/today/WeeklyTrendChart.jsx';
import GoldenParticles from '../features/today/GoldenParticles.jsx';
import AxisItemPickerModal from '../features/today/AxisItemPickerModal.jsx';
import { ACTIONABLE_AXIS_KEYS, ASPECT_META, TODAY_AXIS_CACHE, getAverageFortuneScore, getDailyAxisScores } from '../features/today/getDailyAxisScores.js';
import { TODAY_AXIS_TEXT_CACHE, deriveByeolsoomPick, mergeBoostEntry } from '../features/today/fortuneAxisTools.js';

const PICK_FIELD_META = [
  { key: 'food', label: '음식', icon: '🍽', tone: 'gold' },
  { key: 'place', label: '장소', icon: '📍', tone: 'teal' },
  { key: 'color', label: '색', icon: '🎨', tone: 'coral' },
  { key: 'item', label: '아이템', icon: '🪄', tone: 'plum' },
  { key: 'number', label: '숫자', icon: '🔢', tone: 'sky' },
  { key: 'direction', label: '방향', icon: '🧭', tone: 'lime' },
  { key: 'communication', label: '소통', icon: '💬', tone: 'rose' },
  { key: 'action', label: '행동', icon: '✨', tone: 'gold' },
];

const AXIS_TONE_META = {
  focus: {
    accent: '#7ec8e3',
    soft: 'rgba(126, 200, 227, 0.18)',
    glow: 'rgba(126, 200, 227, 0.3)',
  },
  boost: {
    accent: 'var(--gold)',
    soft: 'rgba(232, 176, 72, 0.18)',
    glow: 'rgba(232, 176, 72, 0.34)',
  },
  care: {
    accent: '#d57c58',
    soft: 'rgba(213, 124, 88, 0.18)',
    glow: 'rgba(213, 124, 88, 0.3)',
  },
  watch: {
    accent: '#a18ec8',
    soft: 'rgba(161, 142, 200, 0.16)',
    glow: 'rgba(161, 142, 200, 0.26)',
  },
  steady: {
    accent: '#91a0bb',
    soft: 'rgba(145, 160, 187, 0.14)',
    glow: 'rgba(145, 160, 187, 0.22)',
  },
};

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

function getFortuneLabel(axisKey) {
  const base = ASPECT_META[axisKey]?.label || axisKey;
  return base.endsWith('운') ? base : `${base}운`;
}

function getFallbackHeadline(axisKey, parsedDaily) {
  const direct = parsedDaily?.categories?.[axisKey]?.desc?.trim();
  if (direct) return direct;
  return `${getFortuneLabel(axisKey)}의 흐름을 다시 읽는 중이에요.`;
}

function parseAxisRefreshHeadline(text) {
  const match = String(text || '').match(/\[한줄\]\s*([\s\S]+)/);
  return (match?.[1] || text || '').split('\n')[0].trim();
}

async function loadJsonCache(kakaoId, cacheType) {
  if (!kakaoId) return {};
  if (!canUseDailySupabaseTables()) {
    try {
      return JSON.parse(readDailyLocalCache(String(kakaoId), cacheType, getDailyDateKey()) || '{}');
    } catch {
      return {};
    }
  }

  try {
    const client = getAuthenticatedClient(String(kakaoId));
    const { data } = await client
      ?.from('daily_cache')
      .select('content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_date', getDailyDateKey())
      .eq('cache_type', cacheType)
      .maybeSingle();
    return JSON.parse(data?.content || '{}');
  } catch {
    return {};
  }
}

async function saveJsonCache(kakaoId, cacheType, payload) {
  if (!kakaoId) return;
  const content = JSON.stringify(payload || {});
  writeDailyLocalCache(String(kakaoId), cacheType, content, getDailyDateKey());
  if (!canUseDailySupabaseTables()) return;
  const client = getAuthenticatedClient(String(kakaoId));
  await client?.from('daily_cache').upsert(
    { kakao_id: String(kakaoId), cache_date: getDailyDateKey(), cache_type: cacheType, content },
    { onConflict: 'kakao_id,cache_date,cache_type' },
  );
}

async function saveTodayScore(kakaoId, score) {
  if (!kakaoId || !Number.isFinite(score)) return;
  const content = String(Math.max(0, Math.min(100, Math.round(score))));
  writeDailyLocalCache(String(kakaoId), 'horoscope_score', content, getDailyDateKey());
  if (!canUseDailySupabaseTables()) return;
  const client = getAuthenticatedClient(String(kakaoId));
  await client?.from('daily_cache').upsert(
    { kakao_id: String(kakaoId), cache_date: getDailyDateKey(), cache_type: 'horoscope_score', content },
    { onConflict: 'kakao_id,cache_date,cache_type' },
  );
}

function splitPickValue(value) {
  const text = String(value || '').trim();
  if (!text) return { primary: '', description: '' };
  const [primary, ...rest] = text.split(/\s*[-–—:]\s*/);
  if (!rest.length) return { primary: text, description: '' };
  return {
    primary: primary.trim(),
    description: rest.join(' · ').trim(),
  };
}

function getAxisCardState(axis, pick, rankByKey) {
  const isCare = axis.key === pick?.careKey;
  const isFocus = axis.key === pick?.focusKey;
  const isBoosted = (axis.bonus || 0) > 0;

  if (isCare && axis.total <= 46) {
    return { tone: 'care', badge: '보강 필요', caption: '오늘 가장 예민한 축이에요' };
  }
  if (isBoosted && isFocus) {
    return { tone: 'boost', badge: '상승 반영', caption: `아이템으로 +${axis.bonus}점 올라왔어요` };
  }
  if (isBoosted) {
    return { tone: 'boost', badge: '부스트 반영', caption: `아이템으로 +${axis.bonus}점 보정됐어요` };
  }
  if (isFocus || rankByKey[axis.key] === 1) {
    return { tone: 'focus', badge: '오늘 강세', caption: '반응이 빠르게 오는 구간이에요' };
  }
  if ((rankByKey[axis.key] || 99) >= 6 || axis.total <= 52) {
    return { tone: 'watch', badge: '체크 권장', caption: '살짝만 손봐도 체감이 큰 축이에요' };
  }
  return { tone: 'steady', badge: '균형권', caption: '지금은 무리 없이 유지되는 축이에요' };
}

function getAxisActionCopy(axis, pick) {
  if (!axis.availableRows.length) {
    return {
      title: '먼저 아이템 풀을 채우기',
      description: `${axis.fullLabel}용 아이템이 아직 없어 뽑기에서 기반을 채워두면 좋아요.`,
      button: '별숨 뽑기',
    };
  }
  if (axis.key === pick?.careKey) {
    return {
      title: '오늘 가장 먼저 받쳐줄 축',
      description: '별숨픽도 이 축의 긴장을 낮추는 방향으로 맞춰졌어요.',
      button: '보강 아이템 고르기',
    };
  }
  if ((axis.bonus || 0) > 0) {
    return {
      title: '이미 올린 흐름에 가속 붙이기',
      description: '지금 탄력을 더 얹으면 한줄 체감이 가장 크게 바뀔 축이에요.',
      button: '추가 조합하기',
    };
  }
  if (axis.key === pick?.focusKey) {
    return {
      title: '상승세를 더 멀리 보내기',
      description: '오늘 점수가 잘 반응하는 축이라 선택 체감이 빠르게 와요.',
      button: '아이템 조합하기',
    };
  }
  return {
    title: '필요할 때만 가볍게 조정',
    description: '밸런스를 해치지 않는 선에서 한두 개만 얹어도 충분해요.',
    button: '아이템 고르기',
  };
}

function PickField({ label, value, icon, tone }) {
  if (!value) return null;
  const { primary, description } = splitPickValue(value);
  return (
    <div className={`today-pick-field today-pick-field--${tone}`}>
      <div className="today-pick-field__top">
        <span className="today-pick-field__icon" aria-hidden="true">{icon}</span>
        <span className="today-pick-field__label">{label}</span>
      </div>
      <div className="today-pick-field__value">{primary}</div>
      {description && <div className="today-pick-field__desc">{description}</div>}
    </div>
  );
}

export default function TodayDetailPage({
  dailyResult,
  dailyLoading,
  gamificationState,
  onBlockBadtime = null,
  isBlockingBadtime,
  setStep,
  onRefresh,
  showToast = null,
  callApi = null,
}) {
  const user = useAppStore((s) => s.user);
  const today = useAppStore((s) => s.today);
  const kakaoId = user?.kakaoId || user?.id;
  const prevTodayScoreRef = useRef(0);

  const [boostMap, setBoostMap] = useState({});
  const [axisTextOverrides, setAxisTextOverrides] = useState({});
  const [ownedRows, setOwnedRows] = useState([]);
  const [pickerAxisKey, setPickerAxisKey] = useState(null);
  const [isApplyingAxis, setIsApplyingAxis] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const parsedDaily = useMemo(
    () => parseDailyLines(dailyResult?.text || ''),
    [dailyResult?.text],
  );

  const axisScores = useMemo(
    () => getDailyAxisScores(dailyResult?.score || 0, boostMap, parsedDaily.categories),
    [dailyResult?.score, boostMap, parsedDaily.categories],
  );

  const actionableScores = useMemo(
    () => axisScores.filter((score) => ACTIONABLE_AXIS_KEYS.includes(score.key)),
    [axisScores],
  );

  const todayScore = useMemo(
    () => getAverageFortuneScore(axisScores),
    [axisScores],
  );

  const overallGuide = useMemo(() => ({
    summary: parsedDaily.summary || parsedDaily.categories?.overall?.desc || parsedDaily.closingAdvice || '오늘 흐름을 가볍게 정리하면서 리듬을 맞춰보세요.',
    do: parsedDaily.easternKi?.doAction || '오늘 잘 풀리는 쪽에 에너지를 먼저 써보세요.',
    caution: parsedDaily.easternKi?.dontAction || '과하게 힘을 주기보다 균형을 챙기는 편이 좋아요.',
  }), [parsedDaily]);

  const byeolsoomPick = useMemo(
    () => deriveByeolsoomPick(actionableScores, parsedDaily.synergy),
    [actionableScores, parsedDaily.synergy],
  );

  const axisRankMap = useMemo(
    () => Object.fromEntries(
      [...actionableScores]
        .sort((a, b) => (b.total || 0) - (a.total || 0))
        .map((score, index) => [score.key, index + 1]),
    ),
    [actionableScores],
  );

  const rowsByAxis = useMemo(() => (
    (ownedRows || []).reduce((acc, row) => {
      const key = row.item?.aspectKey;
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {})
  ), [ownedRows]);

  const axisCards = useMemo(() => actionableScores.map((score) => {
    const fullLabel = getFortuneLabel(score.key);
    const availableRows = rowsByAxis[score.key] || [];
    const status = getAxisCardState(score, byeolsoomPick, axisRankMap);
    const toneMeta = AXIS_TONE_META[status.tone] || AXIS_TONE_META.steady;
    const actionCopy = getAxisActionCopy({ ...score, fullLabel, availableRows }, byeolsoomPick);
    const baseFillWidth = Math.max(0, Math.min(100, (score.total || 0) - (score.bonus || 0)));
    const bonusFillWidth = Math.max(0, Math.min(100 - baseFillWidth, score.bonus || 0));

    return {
      ...score,
      rank: axisRankMap[score.key] || actionableScores.length,
      fullLabel,
      headline: axisTextOverrides?.[score.key] || getFallbackHeadline(score.key, parsedDaily),
      availableRows,
      status,
      toneMeta,
      actionCopy,
      baseFillWidth,
      bonusFillWidth,
    };
  }), [actionableScores, axisRankMap, axisTextOverrides, byeolsoomPick, parsedDaily, rowsByAxis]);

  const pickerAxis = axisCards.find((axis) => axis.key === pickerAxisKey) || null;

  useEffect(() => {
    let cancelled = false;
    if (!kakaoId) return undefined;

    (async () => {
      const [loadedBoostMap, loadedTextOverrides] = await Promise.all([
        loadJsonCache(kakaoId, TODAY_AXIS_CACHE),
        loadJsonCache(kakaoId, TODAY_AXIS_TEXT_CACHE),
      ]);
      if (cancelled) return;
      setBoostMap(loadedBoostMap && typeof loadedBoostMap === 'object' ? loadedBoostMap : {});
      setAxisTextOverrides(loadedTextOverrides && typeof loadedTextOverrides === 'object' ? loadedTextOverrides : {});
    })();

    return () => {
      cancelled = true;
    };
  }, [kakaoId]);

  useEffect(() => {
    if (!kakaoId || !dailyResult) return;
    getAuthenticatedClient(String(kakaoId))
      ?.from('user_shop_inventory')
      .select('item_id')
      .eq('kakao_id', String(kakaoId))
      .then(({ data, error }) => {
        if (error) {
          setOwnedRows([]);
          return;
        }
        setOwnedRows(
          (data || [])
            .map((row) => ({ rowId: String(row.item_id), item: findItem(String(row.item_id)) }))
            .filter((row) => row.item?.aspectKey && ACTIONABLE_AXIS_KEYS.includes(row.item.aspectKey)),
        );
      })
      .catch(() => setOwnedRows([]));
  }, [kakaoId, dailyResult]);

  useEffect(() => {
    if (!dailyResult || !kakaoId || !Number.isFinite(todayScore)) return;
    saveTodayScore(kakaoId, todayScore).catch(() => {});
  }, [dailyResult, kakaoId, todayScore]);

  useEffect(() => {
    if (todayScore >= 100 && prevTodayScoreRef.current < 100) {
      setShowParticles(true);
    }
    prevTodayScoreRef.current = todayScore;
  }, [todayScore]);

  const handleShareDaily = useCallback(async () => {
    if (!dailyResult) return;
    const dateStr = today ? `${today.month}월 ${today.day}일` : '';
    const text = `✦ 오늘의 별숨${dateStr ? ` · ${dateStr}` : ''}\n${overallGuide.summary}\n\n별숨점수 ${todayScore}점\n\n— 별숨 앱`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '별숨 ✦', text });
      } catch {}
    } else {
      await navigator.clipboard?.writeText(text);
      showToast?.('클립보드에 복사됐어요', 'success');
    }
  }, [dailyResult, overallGuide.summary, showToast, today, todayScore]);

  const refreshAxisHeadline = useCallback(async (axisKey, nextAxisScore, selectedRows, nextTotalScore) => {
    if (!callApi || !nextAxisScore) return null;
    const axisLabel = getFortuneLabel(axisKey);
    const currentHeadline = axisTextOverrides?.[axisKey] || getFallbackHeadline(axisKey, parsedDaily);
    const itemSummary = selectedRows
      .map((row) => `${row.item?.name || '이름 없는 아이템'}(+${row.item?.boost || 0})`)
      .join(', ');
    const scoreSummary = actionableScores
      .map((score) => `${getFortuneLabel(score.key)} ${score.key === axisKey ? nextAxisScore.total : score.total}점`)
      .join(' / ');

    const context = [
      `[선택된 운세 항목] ${axisLabel}`,
      `[새 점수] ${nextAxisScore.total}점`,
      `[오늘 전체 평균 점수] ${nextTotalScore}점`,
      `[기존 한줄] ${currentHeadline}`,
      `[사용한 아이템] ${itemSummary}`,
      `[전체 항목 점수] ${scoreSummary}`,
      `[오늘 전체 요약] ${overallGuide.summary}`,
      `[DO] ${overallGuide.do}`,
      `[주의] ${overallGuide.caution}`,
    ].join('\n');

    try {
      const answer = await callApi(`${axisLabel} 한줄만 다시 써줘`, {
        isDailyAxisRefresh: true,
        context,
      });
      const headline = parseAxisRefreshHeadline(answer);
      return headline || null;
    } catch {
      return null;
    }
  }, [actionableScores, axisTextOverrides, callApi, overallGuide, parsedDaily]);

  const handleApplyAxisItems = useCallback(async (selectedRows) => {
    if (!pickerAxis || !selectedRows.length || !kakaoId) return;
    const rowIds = selectedRows.map((row) => String(row.rowId));
    const axisKey = pickerAxis.key;

    setIsApplyingAxis(true);

    try {
      if (canUseDailySupabaseTables()) {
        await getAuthenticatedClient(String(kakaoId))
          ?.from('user_shop_inventory')
          .delete()
          .eq('kakao_id', String(kakaoId))
          .in('item_id', rowIds);
      }

      const nextBoostMap = {
        ...boostMap,
        [axisKey]: mergeBoostEntry(boostMap?.[axisKey], selectedRows),
      };

      await saveJsonCache(kakaoId, TODAY_AXIS_CACHE, nextBoostMap);

      const nextScores = getDailyAxisScores(dailyResult?.score || 0, nextBoostMap, parsedDaily.categories);
      const nextAxisScore = nextScores.find((score) => score.key === axisKey);
      const nextTotalScore = getAverageFortuneScore(nextScores);

      setBoostMap(nextBoostMap);
      setOwnedRows((prev) => prev.filter((row) => !rowIds.includes(String(row.rowId))));
      setPickerAxisKey(null);

      const nextHeadline = await refreshAxisHeadline(axisKey, nextAxisScore, selectedRows, nextTotalScore);
      if (nextHeadline) {
        const nextOverrides = {
          ...axisTextOverrides,
          [axisKey]: nextHeadline,
        };
        setAxisTextOverrides(nextOverrides);
        await saveJsonCache(kakaoId, TODAY_AXIS_TEXT_CACHE, nextOverrides);
      }

      showToast?.(
        `${pickerAxis.fullLabel}에 ${selectedRows.length}개 아이템을 적용했어요. 지금 ${nextAxisScore?.total || pickerAxis.total}점이에요.`,
        'success',
      );
    } catch (error) {
      console.error('[오늘 상세] axis item apply failed:', error);
      showToast?.('아이템 적용 중 오류가 발생했어요.', 'error');
    } finally {
      setIsApplyingAxis(false);
    }
  }, [axisTextOverrides, boostMap, dailyResult?.score, kakaoId, parsedDaily.categories, pickerAxis, refreshAxisHeadline, showToast]);

  if (dailyLoading && !dailyResult) {
    return <PageSpinner />;
  }

  void gamificationState;

  return (
    <div className="today-detail-container">
      <GoldenParticles active={showParticles} onComplete={() => setShowParticles(false)} />
      <AxisItemPickerModal
        axis={pickerAxis}
        currentScore={pickerAxis?.total || 0}
        rows={pickerAxis?.availableRows || []}
        isApplying={isApplyingAxis}
        onClose={() => !isApplyingAxis && setPickerAxisKey(null)}
        onApply={handleApplyAxisItems}
        onGoGacha={() => setStep(STEP.GACHA)}
      />

      {isApplyingAxis && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          <div style={{ width: 42, height: 42, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', marginBottom: 12 }} />
          <div style={{ fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 700 }}>항목 한줄을 다시 읽는 중...</div>
        </div>
      )}

      <div className="today-detail-header">
        <button className="today-detail-back-btn" onClick={() => setStep(STEP.HOME)} aria-label="홈으로 돌아가기">←</button>
        <span className="today-detail-title">오늘 하루 나의 별숨</span>
        {dailyResult ? (
          <button
            onClick={handleShareDaily}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'none',
              border: '1px solid var(--line)',
              color: 'var(--t3)',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="공유하기"
          >
            ↗
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </div>

      <div className="today-detail-content">
        {dailyResult ? (
          <Suspense fallback={<PageSpinner />}>
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 18, marginBottom: 16, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>TODAY SCORE</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--t1)', lineHeight: 1 }}>{todayScore}점</div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 6 }}>
                    세부 운세 {actionableScores.length}개 평균으로 계산되는 오늘의 총점이에요.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRefresh?.({ skipBpCharge: true, skipConfirm: true, saveHistory: false, incrementCount: false })}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 12,
                    border: '1px solid var(--line)',
                    background: 'transparent',
                    color: 'var(--t3)',
                    fontSize: 'var(--xs)',
                    fontFamily: 'var(--ff)',
                    cursor: 'pointer',
                  }}
                >
                  기본 운세 다시 보기
                </button>
              </div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7 }}>{overallGuide.summary}</div>
            </div>

            <DailyRadarChart scores={actionableScores} />

            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 10 }}>OVERALL GUIDE</div>
              <div style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 12, padding: '11px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>DO</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>{overallGuide.do}</div>
              </div>
              <div style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 12, padding: '11px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, marginBottom: 4 }}>주의</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>{overallGuide.caution}</div>
              </div>
            </div>

            <section className="today-axis-section">
              <div className="today-axis-section__header">
                <div>
                  <div className="today-axis-section__kicker">AXIS FORTUNES</div>
                  <div className="today-axis-section__copy">
                    필요한 축만 골라 점수를 보강하고, 그 축의 한줄 흐름만 더 날카롭게 바꿀 수 있어요.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(STEP.ITEM_INVENTORY)}
                  className="today-axis-section__ghost-btn"
                >
                  내 아이템 정리 보기
                </button>
              </div>

              <div className="today-axis-list">
                {axisCards.map((axis) => (
                  <article
                    key={axis.key}
                    className={`today-axis-card today-axis-card--${axis.status.tone}`}
                    style={{
                      '--axis-accent': axis.toneMeta.accent,
                      '--axis-soft': axis.toneMeta.soft,
                      '--axis-glow': axis.toneMeta.glow,
                    }}
                  >
                    <div className="today-axis-card__inner">
                      <div className="today-axis-card__header">
                        <div className="today-axis-card__lead">
                          <div className="today-axis-card__rank">#{axis.rank}</div>
                          <div className="today-axis-card__icon" aria-hidden="true">
                            {ASPECT_META[axis.key]?.emoji || '✨'}
                          </div>
                          <div className="today-axis-card__title-wrap">
                            <div className="today-axis-card__title-row">
                              <div className="today-axis-card__title">{axis.fullLabel}</div>
                              <span className="today-axis-card__badge">{axis.status.badge}</span>
                            </div>
                            <div className="today-axis-card__meta">
                              기본 {axis.base}점
                              {axis.bonus > 0 ? ` · 아이템 +${axis.bonus}점` : ' · 아직 부스트 없음'}
                            </div>
                          </div>
                        </div>

                        <div className="today-axis-card__score-wrap">
                          <div className="today-axis-card__score">{axis.total}점</div>
                          <div className="today-axis-card__score-caption">{axis.status.caption}</div>
                        </div>
                      </div>

                      <div className="today-axis-card__meter">
                        <div className="today-axis-card__meter-base" style={{ width: `${axis.baseFillWidth}%` }} />
                        {axis.bonus > 0 && (
                          <div
                            className="today-axis-card__meter-bonus"
                            style={{
                              left: `${axis.baseFillWidth}%`,
                              width: `${axis.bonusFillWidth}%`,
                            }}
                          />
                        )}
                      </div>

                      <div className="today-axis-card__headline">{axis.headline}</div>

                      <div className="today-axis-card__chips">
                        <span className="today-axis-card__meta-chip">보유 {axis.availableRows.length}개</span>
                        {axis.key === byeolsoomPick?.careKey && (
                          <span className="today-axis-card__meta-chip today-axis-card__meta-chip--accent">
                            오늘 별숨픽 보강 축
                          </span>
                        )}
                        {axis.key === byeolsoomPick?.focusKey && axis.key !== byeolsoomPick?.careKey && (
                          <span className="today-axis-card__meta-chip today-axis-card__meta-chip--accent">
                            오늘 별숨픽 드라이브 축
                          </span>
                        )}
                        {axis.appliedItems?.length > 0
                          ? axis.appliedItems.map((item, index) => (
                              <span key={`${axis.key}-${item.itemId}-${index}`} className="today-axis-card__boost-chip">
                                {item.emoji || '✨'} {item.name || '아이템'} +{item.boost}
                              </span>
                            ))
                          : (
                              <span className="today-axis-card__meta-chip">적용 아이템 없음</span>
                            )}
                      </div>

                      <div className="today-axis-card__footer">
                        <div className="today-axis-card__footer-copy">
                          <div className="today-axis-card__footer-title">{axis.actionCopy.title}</div>
                          <div className="today-axis-card__footer-desc">{axis.actionCopy.description}</div>
                        </div>
                        <button
                          type="button"
                          className="today-axis-card__cta"
                          onClick={() => (axis.availableRows.length ? setPickerAxisKey(axis.key) : setStep(STEP.GACHA))}
                          disabled={isApplyingAxis}
                          aria-label={axis.availableRows.length ? `${axis.fullLabel} 아이템 선택` : `${axis.fullLabel} 아이템 뽑기`}
                        >
                          {axis.availableRows.length ? axis.actionCopy.button : '별숨 뽑기'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="today-pick-shell">
              <div className="today-pick-hero">
                <div>
                  <div className="today-pick-kicker">BYEOLSOOM PICK</div>
                  <div className="today-pick-title">{byeolsoomPick?.blendTitle || '오늘의 별숨픽'}</div>
                  <div className="today-pick-subtitle">
                    {byeolsoomPick?.summary || '오늘 흐름을 밀고 눌러줄 조합을 골랐어요.'}
                  </div>
                </div>
                <div className="today-pick-badges">
                  {byeolsoomPick?.badge && <span className="today-pick-badge today-pick-badge--primary">{byeolsoomPick.badge}</span>}
                  {byeolsoomPick?.strategyLabel && <span className="today-pick-badge">{byeolsoomPick.strategyLabel}</span>}
                  {byeolsoomPick?.scoreSpread > 0 && <span className="today-pick-badge">격차 {byeolsoomPick.scoreSpread}점</span>}
                </div>
              </div>

              <div className="today-pick-pivot">
                {byeolsoomPick?.focusLabel && (
                  <div className="today-pick-pivot__card">
                    <div className="today-pick-pivot__label">밀어줄 축</div>
                    <div className="today-pick-pivot__value">{byeolsoomPick.focusLabel}</div>
                  </div>
                )}
                {byeolsoomPick?.careLabel && (
                  <div className="today-pick-pivot__card">
                    <div className="today-pick-pivot__label">받쳐줄 축</div>
                    <div className="today-pick-pivot__value">{byeolsoomPick.careLabel}</div>
                  </div>
                )}
                {byeolsoomPick?.boostLabel && (
                  <div className="today-pick-pivot__card">
                    <div className="today-pick-pivot__label">부스트 축</div>
                    <div className="today-pick-pivot__value">{byeolsoomPick.boostLabel}</div>
                  </div>
                )}
              </div>

              <div className="today-pick-grid">
                {PICK_FIELD_META.map((field) => (
                  <PickField
                    key={field.key}
                    label={field.label}
                    value={byeolsoomPick?.[field.key]}
                    icon={field.icon}
                    tone={field.tone}
                  />
                ))}
              </div>

              <div className="today-pick-reason">
                <div className="today-pick-reason__title">왜 이렇게 골랐냐면</div>
                <div className="today-pick-reason__body">
                  {byeolsoomPick?.reason || byeolsoomPick?.aiHint || '오늘 점수 흐름에 맞춰 강한 축은 밀고 약한 축은 받치는 방식으로 조합했어요.'}
                </div>
              </div>
            </section>

            <WeeklyTrendChart kakaoId={kakaoId} todayScore={todayScore} />

            {(dailyResult?.badtime || parsedDaily.badtime) && (
              <div style={{ background: 'rgba(201,160,220,0.08)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid rgba(201,160,220,0.18)' }}>
                <div style={{ fontSize: 10, color: '#c9a0dc', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>주의 흐름</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7, marginBottom: 10 }}>
                  {(dailyResult?.badtime || parsedDaily.badtime)?.symptom || '오늘은 예민한 흐름이 살짝 감지돼요.'}
                </div>
                {onBlockBadtime && (
                  <button
                    type="button"
                    onClick={onBlockBadtime}
                    disabled={isBlockingBadtime}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(201,160,220,0.22)',
                      background: 'rgba(201,160,220,0.12)',
                      color: '#c9a0dc',
                      fontSize: 'var(--xs)',
                      fontWeight: 700,
                      fontFamily: 'var(--ff)',
                      cursor: isBlockingBadtime ? 'not-allowed' : 'pointer',
                      opacity: isBlockingBadtime ? 0.45 : 1,
                    }}
                  >
                    {isBlockingBadtime ? '액막이 발동 중...' : '액막이 발동하기'}
                  </button>
                )}
              </div>
            )}
          </Suspense>
        ) : (
          <div className="today-detail-empty">
            <div className="today-detail-empty-icon" style={{ fontSize: '2rem', color: 'var(--t4)', marginBottom: 8 }}>☆</div>
            <div className="today-detail-empty-text">
              운세를 불러오지 못했어요.<br />
              <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>아래 버튼으로 다시 시도해 주세요.</span>
            </div>
            {onRefresh && (
              <button className="today-intro-btn-primary" style={{ marginTop: 8, width: 'auto', padding: '12px 28px' }} onClick={() => onRefresh({ skipBpCharge: true, skipConfirm: true, saveHistory: false, incrementCount: false })} disabled={dailyLoading}>
                다시 불러오기
              </button>
            )}
          </div>
        )}
      </div>

      <div className="today-detail-footer">
        <button className="today-detail-btn-home" onClick={() => setStep(STEP.HOME)}>홈으로</button>
        <button
          className="today-detail-btn-home"
          onClick={() => setStep(STEP.GACHA)}
          style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', color: 'var(--gold)', marginLeft: 8 }}
        >
          별숨 뽑기
        </button>
      </div>
    </div>
  );
}
