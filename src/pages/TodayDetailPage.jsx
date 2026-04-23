import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import DailyStarCardV2 from '../components/DailyStarCardV2.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCache, writeDailyLocalCache } from '../lib/dailyDataAccess.js';
import '../styles/TodayDetailPage.css';
import { findItem } from '../utils/gachaItems.js';

import { getDailyAxisScores, TODAY_AXIS_CACHE } from '../features/today/getDailyAxisScores.js';
import AxisInsightPanel  from '../features/today/AxisInsightPanel.jsx';
import DailyRadarChart   from '../features/today/DailyRadarChart.jsx';
import WeeklyTrendChart  from '../features/today/WeeklyTrendChart.jsx';
import PurifyOverlay     from '../features/today/PurifyOverlay.jsx';
import BoostCTA          from '../features/today/BoostCTA.jsx';
import ItemDetailModal   from '../features/today/ItemDetailModal.jsx';
import OneShotItemPicker from '../features/today/OneShotItemPicker.jsx';

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
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

  // 오늘 아이템 활성화 이력 로드
  useEffect(() => {
    if (!kakaoId) return;
    if (!canUseDailySupabaseTables()) {
      try {
        const map = JSON.parse(readDailyLocalCache(String(kakaoId), TODAY_AXIS_CACHE, getDailyDateKey()) || '{}');
        setUsedItems(
          Array.isArray(map) || typeof map !== 'object' ? [] :
          Object.values(map).map((id) => findItem(id)).filter(Boolean)
        );
      } catch { setUsedItems([]); }
      return;
    }
    getAuthenticatedClient(String(kakaoId))
      .from('daily_cache')
      .select('content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_date', new Date().toISOString().slice(0, 10))
      .eq('cache_type', TODAY_AXIS_CACHE)
      .maybeSingle()
      .then(({ data }) => {
        try {
          const map = JSON.parse(data?.content || '{}');
          setUsedItems(
            Array.isArray(map) || typeof map !== 'object' ? [] :
            Object.values(map).map((id) => findItem(id)).filter(Boolean)
          );
        } catch { setUsedItems([]); }
      })
      .catch(() => setUsedItems([]));
  }, [kakaoId]);

  // 보유 아이템 로드
  useEffect(() => {
    if (!kakaoId || !dailyResult) return;
    getAuthenticatedClient(String(kakaoId))
      .from('user_shop_inventory')
      .select('item_id')
      .eq('kakao_id', String(kakaoId))
      .then(({ data }) => {
        setOwnedRows(
          (data || [])
            .map((row) => ({ rowId: String(row.item_id), item: findItem(String(row.item_id)) }))
            .filter((row) => row.item?.aspectKey)
        );
      })
      .catch(() => setOwnedRows([]));
  }, [kakaoId, dailyResult]);

  const isScoreMaxed = (dailyResult?.score || 0) >= 100;
  const canPurify = !isPurifying && !dailyLoading && !isScoreMaxed && !!onRefresh;
  const canUseItems = canPurify;

  const handleUseItem = useCallback(async (row) => {
    if (!kakaoId || !row?.item || !canUseItems) return;
    setIsPurifying(true);
    const nextUsedItems = [
      ...usedItems.filter((item) => item.aspectKey !== row.item.aspectKey),
      row.item,
    ];
    const animPromise = new Promise((r) => setTimeout(r, 1200));
    try {
      await Promise.all([
        onRefresh?.({ transientItems: nextUsedItems, skipBpCharge: true, skipConfirm: true, saveHistory: false }),
        animPromise,
      ]);
      const nextMap = Object.fromEntries(
        nextUsedItems.filter((i) => i?.aspectKey).map((i) => [i.aspectKey, i.id])
      );
      writeDailyLocalCache(String(kakaoId), TODAY_AXIS_CACHE, JSON.stringify(nextMap), getDailyDateKey());
      if (canUseDailySupabaseTables()) {
        await getAuthenticatedClient(String(kakaoId))
          .from('daily_cache')
          .upsert({ kakao_id: String(kakaoId), cache_date: getDailyDateKey(), cache_type: TODAY_AXIS_CACHE, content: JSON.stringify(nextMap) }, { onConflict: 'kakao_id,cache_date,cache_type' });
      }
      setUsedItems(nextUsedItems);
      setSelectedRow(null);
    } catch {
      await animPromise;
    } finally {
      setIsPurifying(false);
    }
  }, [kakaoId, canUseItems, onRefresh, usedItems]);

  const handlePurify = useCallback(async () => {
    if (isPurifying || dailyLoading || isScoreMaxed) return;
    setIsPurifying(true);
    const animPromise = new Promise((r) => setTimeout(r, 1200));
    try {
      await Promise.all([
        onRefresh?.({ transientItems: usedItems, skipBpCharge: true, skipConfirm: true, saveHistory: false }),
        animPromise,
      ]);
    } catch {
      await animPromise;
    } finally {
      setIsPurifying(false);
    }
  }, [isPurifying, dailyLoading, isScoreMaxed, onRefresh, usedItems]);

  return (
    <div className="today-detail-container">
      <PurifyOverlay visible={isPurifying} />

      <div className="today-detail-header">
        <button className="today-detail-back-btn" onClick={() => setStep(0)} aria-label="홈으로 돌아가기">←</button>
        <span className="today-detail-title">오늘 하루 나의 별숨</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={`today-detail-content${isPurifying ? ' today-detail-content--blurred' : ''}`}>
        {dailyLoading && !dailyResult ? (
          <PageSpinner />
        ) : dailyResult ? (
          <Suspense fallback={<PageSpinner />}>
            <DailyRadarChart baseScore={dailyResult?.score} equippedItems={mergedEquippedItems} />
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
            <WeeklyTrendChart kakaoId={kakaoId} todayScore={dailyResult?.score} />
            <BoostCTA hasBoostedToday={usedItems.length > 0} canPurify={canPurify} todayScore={dailyResult?.score} onPurify={handlePurify} isPurifying={isPurifying} setStep={setStep} />
            <DailyStarCardV2
              result={dailyResult}
              onBlockBadtime={onBlockBadtime}
              isBlocking={isBlockingBadtime}
              canBlockBadtime={onBlockBadtime != null}
              currentBp={gamificationState?.currentBp || 0}
              axisScores={axisScores}
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
        <button className="today-detail-btn-home" onClick={() => setStep(0)}>홈으로</button>
        {usedItems.length > 0 && canPurify && (
          <button className="today-detail-btn-home" onClick={handlePurify} disabled={isPurifying} style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', color: 'var(--gold)', marginLeft: 8, opacity: isPurifying ? 0.7 : 1 }}>
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
