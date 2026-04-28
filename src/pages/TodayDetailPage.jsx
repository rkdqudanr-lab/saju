import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DailyStarCardV2 from '../components/DailyStarCardV2.jsx';
import { parseDailyLines } from '../utils/parseDailyLines.js';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { STEP } from '../utils/steps.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCache, writeDailyLocalCache } from '../lib/dailyDataAccess.js';
import '../styles/TodayDetailPage.css';
import { findItem, pullOne, pullOneSaju } from '../utils/gachaItems.js';

import { getDailyAxisScores, TODAY_AXIS_CACHE, ASPECT_META } from '../features/today/getDailyAxisScores.js';
import AxisInsightPanel  from '../features/today/AxisInsightPanel.jsx';
import DailyRadarChart   from '../features/today/DailyRadarChart.jsx';
import WeeklyTrendChart  from '../features/today/WeeklyTrendChart.jsx';
import PurifyOverlay     from '../features/today/PurifyOverlay.jsx';
import BoostCTA          from '../features/today/BoostCTA.jsx';
import ItemDetailModal   from '../features/today/ItemDetailModal.jsx';
import OneShotItemPicker from '../features/today/OneShotItemPicker.jsx';
import InstantBoostModal from '../features/today/InstantBoostModal.jsx';
import GoldenParticles   from '../features/today/GoldenParticles.jsx';

const INSTANT_BOOST_COST = 10;

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

function animateScore(from, to, durationMs, onTick, onComplete) {
  const start = performance.now();
  function tick(now) {
    const t     = Math.min((now - start) / durationMs, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    onTick(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(tick);
    else onComplete?.();
  }
  requestAnimationFrame(tick);
}

// boostMap 캐시 저장 헬퍼
async function saveBoostMap(kakaoId, boostMap) {
  const content = JSON.stringify(boostMap);
  writeDailyLocalCache(String(kakaoId), TODAY_AXIS_CACHE, content, getDailyDateKey());
  if (canUseDailySupabaseTables()) {
    const client = getAuthenticatedClient(String(kakaoId));
    if (client) {
      await client.from('daily_cache').upsert(
        { kakao_id: String(kakaoId), cache_date: getDailyDateKey(), cache_type: TODAY_AXIS_CACHE, content },
        { onConflict: 'kakao_id,cache_date,cache_type' },
      );
    }
  }
}

export default function TodayDetailPage({
  dailyResult,
  dailyLoading,
  gamificationState,
  onBlockBadtime = null,
  isBlockingBadtime,
  setStep,
  onRefresh,
  onSpendBp,
  showToast = null,
}) {
  const user = useAppStore((s) => s.user);
  const kakaoId = user?.kakaoId || user?.id;

  // boostMap: { [aspectKey]: { itemId, boost, name, emoji } }
  const [boostMap,     setBoostMap]     = useState({});
  const [ownedRows,    setOwnedRows]    = useState(null);
  const [selectedRow,  setSelectedRow]  = useState(null);
  const [isPurifying,  setIsPurifying]  = useState(false);

  // 즉시 부스트 state
  const [boostPhase,    setBoostPhase]   = useState(null);
  const [pulledItem,    setPulledItem]   = useState(null);
  const [displayScore,  setDisplayScore] = useState(null);
  const [showParticles, setShowParticles] = useState(false);
  const rafRef = useRef(null);

  const baseScore  = displayScore ?? (dailyResult?.score || 0);
  const axisScores = useMemo(
    () => getDailyAxisScores(baseScore, boostMap),
    [baseScore, boostMap],
  );

  // 오늘 boostMap 로드 (item_boosts 캐시)
  useEffect(() => {
    if (!kakaoId) return;
    if (!canUseDailySupabaseTables()) {
      try {
        const parsed = JSON.parse(readDailyLocalCache(String(kakaoId), TODAY_AXIS_CACHE, getDailyDateKey()) || '{}');
        setBoostMap(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
      } catch { setBoostMap({}); }
      return;
    }
    getAuthenticatedClient(String(kakaoId))
      ?.from('daily_cache')
      .select('content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_date', getDailyDateKey())
      .eq('cache_type', TODAY_AXIS_CACHE)
      .maybeSingle()
      .then(({ data }) => {
        try {
          const parsed = JSON.parse(data?.content || '{}');
          setBoostMap(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
        } catch { setBoostMap({}); }
      })
      .catch(() => setBoostMap({}));
  }, [kakaoId]);

  // 보유 아이템 로드 (aspectKey 있는 것만)
  useEffect(() => {
    if (!kakaoId || !dailyResult) return;
    getAuthenticatedClient(String(kakaoId))
      ?.from('user_shop_inventory')
      .select('id, item_id')
      .eq('kakao_id', String(kakaoId))
      .then(({ data, error }) => {
        if (error) { setOwnedRows([]); return; }
          setOwnedRows(
          (data || [])
            .map((row) => ({ rowId: String(row.id), item: findItem(String(row.item_id)) }))
            .filter((row) => row.item?.aspectKey),
        );
      })
      .catch(() => setOwnedRows([]));
  }, [kakaoId, dailyResult]);

  const currentScore = dailyResult?.score || 0;
  const isScoreMaxed = currentScore >= 100;
  const canPurify    = !isPurifying && !dailyLoading && !isScoreMaxed && !!onRefresh;
  const canUseItems  = !isPurifying && !dailyLoading && !!dailyResult && !isScoreMaxed;

  // 아이템 발동: 소비 + 즉시 점수 반영 (AI 재호출 없음)
  const handleUseItem = useCallback(async (row) => {
    if (!kakaoId || !row?.item || !canUseItems) return;
    const item = row.item;
    if (!item.aspectKey || !item.boost) return;

    setIsPurifying(true);
    try {
      // 인벤토리에서 삭제 (소비)
      if (canUseDailySupabaseTables()) {
        await getAuthenticatedClient(String(kakaoId))
          ?.from('user_shop_inventory')
          .delete()
          .eq('kakao_id', String(kakaoId))
          .eq('id', String(row.rowId));
      }

      const nextBoostMap = {
        ...boostMap,
        [item.aspectKey]: { itemId: String(item.id), boost: item.boost, name: item.name, emoji: item.emoji },
      };

      await saveBoostMap(kakaoId, nextBoostMap);
      setBoostMap(nextBoostMap);
      setOwnedRows((prev) => (prev || []).filter((r) => r.rowId !== row.rowId));
      setSelectedRow(null);

      const label = ASPECT_META[item.aspectKey]?.label || item.aspectKey;
      showToast?.(`${item.emoji} ${item.name} 발동! ${label}운 +${item.boost}점 반영됐어요`, 'success');
    } catch {
      showToast?.('아이템 발동 중 오류가 발생했어요.', 'error');
    } finally {
      setIsPurifying(false);
    }
  }, [kakaoId, boostMap, canUseItems, showToast]);

  // 정화재점: boostMap 컨텍스트 전달 후 전체 AI 재호출
  const handlePurify = useCallback(async () => {
    if (isPurifying || dailyLoading || isScoreMaxed) return;
    setIsPurifying(true);
    const animPromise = new Promise((r) => setTimeout(r, 1200));
    try {
      await Promise.all([
        onRefresh?.({ boostMap, skipBpCharge: true, skipConfirm: true, saveHistory: false }),
        animPromise,
      ]);
    } catch {
      await animPromise;
    } finally {
      setIsPurifying(false);
    }
  }, [isPurifying, dailyLoading, isScoreMaxed, onRefresh, boostMap]);

  // 즉시 부스트 (BP 소모 랜덤 뽑기 — 인벤토리 소비 없음)
  const handleInstantBoost = useCallback(async () => {
    if ((gamificationState?.currentBp || 0) < INSTANT_BOOST_COST) return;
    if (isScoreMaxed || boostPhase) return;
    setBoostPhase('pulling');
    if (typeof onSpendBp === 'function') {
      await onSpendBp(INSTANT_BOOST_COST, `instant_boost_${Date.now()}`);
    }
    const item = Math.random() < 0.5 ? pullOne() : pullOneSaju();
    await new Promise((r) => setTimeout(r, 380));
    setPulledItem(item);
    setBoostPhase('reveal');
  }, [gamificationState, isScoreMaxed, boostPhase, onSpendBp]);

  const handleBoostConfirm = useCallback(async (item) => {
    if (!item || !kakaoId) { setBoostPhase(null); return; }
    setBoostPhase('confirming');
    setIsPurifying(true);
    const animPromise = new Promise((r) => setTimeout(r, 1200));
    const prevScore   = currentScore;

    try {
      const nextBoostMap = item.aspectKey ? {
        ...boostMap,
        [item.aspectKey]: { itemId: String(item.id), boost: item.boost || 10, name: item.name, emoji: item.emoji },
      } : boostMap;

      await Promise.all([saveBoostMap(kakaoId, nextBoostMap), animPromise]);

      setBoostMap(nextBoostMap);
      setBoostPhase(null);
      setPulledItem(null);

      const newScore = Math.min(100, prevScore + (item.boost || 10));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setDisplayScore(prevScore);
      animateScore(prevScore, newScore, 1300, setDisplayScore, () => {
        setDisplayScore(null);
        if (newScore >= 100) setShowParticles(true);
      });
    } catch {
      await animPromise;
      setBoostPhase(null);
      setPulledItem(null);
    } finally {
      setIsPurifying(false);
    }
  }, [kakaoId, boostMap, currentScore]);

  const hasBoostsToday = Object.keys(boostMap).length > 0;

  const today = useAppStore((s) => s.today);
  const handleShareDaily = useCallback(async () => {
    if (!dailyResult) return;
    const parsed = parseDailyLines(dailyResult.text || '');
    const score = parsed.score ?? dailyResult.score;
    const summary = parsed.summary || (dailyResult.text || '').slice(0, 80);
    const dateStr = today ? `${today.month}월 ${today.day}일` : '';
    const text = `✦ 오늘의 별숨${dateStr ? ` · ${dateStr}` : ''}\n${summary}${score != null ? `\n\n별숨점수 ${score}점` : ''}\n\n— 별숨 앱`;
    if (navigator.share) {
      try { await navigator.share({ title: '별숨 ✦', text }); } catch {}
    } else {
      await navigator.clipboard?.writeText(text);
      showToast?.('클립보드에 복사됐어요', 'success');
    }
  }, [dailyResult, today, showToast]);

  return (
    <div className="today-detail-container">
      <PurifyOverlay visible={isPurifying && !boostPhase} />
      <GoldenParticles active={showParticles} onComplete={() => setShowParticles(false)} />
      <InstantBoostModal
        phase={boostPhase}
        pulledItem={pulledItem}
        cost={INSTANT_BOOST_COST}
        currentBp={gamificationState?.currentBp || 0}
        onConfirm={handleBoostConfirm}
        onClose={() => { setBoostPhase(null); setPulledItem(null); }}
      />

      <div className="today-detail-header">
        <button className="today-detail-back-btn" onClick={() => setStep(STEP.HOME)} aria-label="홈으로 돌아가기">←</button>
        <span className="today-detail-title">오늘 하루 나의 별숨</span>
        {dailyResult ? (
          <button
            onClick={handleShareDaily}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'none', border: '1px solid var(--line)',
              color: 'var(--t3)', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
            aria-label="공유하기"
          >
            ↑
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </div>

      <div className={`today-detail-content${(isPurifying && !boostPhase) ? ' today-detail-content--blurred' : ''}`}>
        {dailyLoading && !dailyResult ? (
          <PageSpinner />
        ) : dailyResult ? (
          <Suspense fallback={<PageSpinner />}>
            <DailyRadarChart baseScore={baseScore} boostMap={boostMap} />
            <AxisInsightPanel
              scores={axisScores}
              ownedRows={ownedRows}
              onUseItem={handleUseItem}
              onInspectItem={setSelectedRow}
              setStep={setStep}
              canUseItems={canUseItems}
            />
            {ownedRows && ownedRows.length > 0 && (
              <OneShotItemPicker scores={axisScores} ownedRows={ownedRows} onUse={handleUseItem} onInspect={setSelectedRow} canUseItems={canUseItems} />
            )}
            <WeeklyTrendChart kakaoId={kakaoId} todayScore={baseScore} />
            <BoostCTA
              hasBoostedToday={hasBoostsToday}
              canPurify={canPurify}
              todayScore={baseScore}
              onPurify={handlePurify}
              isPurifying={isPurifying}
              setStep={setStep}
              currentBp={gamificationState?.currentBp || 0}
              boostCost={INSTANT_BOOST_COST}
              onInstantBoost={!isScoreMaxed ? handleInstantBoost : undefined}
            />
            <DailyStarCardV2
              result={dailyResult}
              onBlockBadtime={onBlockBadtime}
              isBlocking={isBlockingBadtime}
              canBlockBadtime={onBlockBadtime != null}
              currentBp={gamificationState?.currentBp || 0}
              axisScores={axisScores}
              boostMap={boostMap}
              ownedRows={ownedRows}
              onUseItem={canUseItems ? handleUseItem : null}
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
              <button className="today-intro-btn-primary" style={{ marginTop: 8, width: 'auto', padding: '12px 28px' }} onClick={onRefresh} disabled={dailyLoading}>
                다시 불러오기
              </button>
            )}
          </div>
        )}
      </div>

      <div className="today-detail-footer">
        <button className="today-detail-btn-home" onClick={() => setStep(STEP.HOME)}>홈으로</button>
        {hasBoostsToday && canPurify && (
          <button
            className="today-detail-btn-home"
            onClick={handlePurify}
            disabled={isPurifying}
            style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', color: 'var(--gold)', marginLeft: 8, opacity: isPurifying ? 0.7 : 1 }}
          >
            {isPurifying ? '재점 중...' : '정화재점'}
          </button>
        )}
      </div>

      {selectedRow && (
        <ItemDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} onUse={handleUseItem} canUseItems={canUseItems} />
      )}
    </div>
  );
}
