import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCache, writeDailyLocalCache } from '../lib/dailyDataAccess.js';
import { useAppStore } from '../store/useAppStore.js';
import { STEP } from '../utils/steps.js';
import {
  GRADE_CONFIG, GRADE_ORDER, SAJU_GRADE_CONFIG, SAJU_GRADE_ORDER,
  ALL_GACHA_POOL, findItem,
} from '../utils/gachaItems.js';
import ItemCollectionPage from './ItemCollectionPage.jsx';

import OwnedItemCard   from '../features/inventory/OwnedItemCard.jsx';
import ItemDetailModal from '../features/inventory/ItemDetailModal.jsx';
import UseItemModal    from '../features/inventory/UseItemModal.jsx';
import SynthesisModal  from '../features/inventory/SynthesisModal.jsx';
import { FORTUNE_LABELS, ITEM_BOOSTS_CACHE } from '../features/inventory/inventoryUtils.js';

function buildBoostEntry(prevEntry, item) {
  const prevItems = Array.isArray(prevEntry?.items) ? prevEntry.items.filter(Boolean) : [];
  const boost = Number(item?.boost) || 0;
  if (!item?.id || !boost) return prevEntry || { itemId: '', boost: 0, name: '', emoji: '✨', items: [] };
  const newItem = { itemId: String(item.id), id: String(item.id), boost, name: item.name || '', emoji: item.emoji || '', grade: item.grade || '' };
  const nextItems = [...prevItems, newItem];
  const totalBoost = nextItems.reduce((s, i) => s + (i.boost || 0), 0);
  const latest = nextItems[nextItems.length - 1];
  return { itemId: latest?.itemId || '', boost: totalBoost, name: latest?.name || '', emoji: latest?.emoji || '✨', items: nextItems };
}

const SEGMENTS = [
  { id: '전체',   label: '전체' },
  { id: '🌌 우주', label: '🌌 우주' },
  { id: '☯️ 사주', label: '☯️ 사주' },
  { id: '기타',   label: '상점' },
];

export default function ItemInventoryPage({ showToast, callApi, spendBP }) {
  const { user, setStep } = useAppStore();
  const kakaoId = user?.kakaoId || user?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('전체');
  const [showSortRow, setShowSortRow] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [useItem, setUseItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [showSynth, setShowSynth] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [sortMode, setSortMode] = useState('recommended');
  const [fortuneFilter, setFortuneFilter] = useState('all');
  // boostMap: { [aspectKey]: { itemId, boost, name, emoji } }
  const [boostMap, setBoostMap] = useState({});
  const today = getDailyDateKey();

  // 오늘 발동 이력 로드
  useEffect(() => {
    if (!kakaoId) return;
    if (!canUseDailySupabaseTables()) {
      try {
        const parsed = JSON.parse(readDailyLocalCache(kakaoId, ITEM_BOOSTS_CACHE, today) || '{}');
        setBoostMap(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
      } catch { setBoostMap({}); }
      return;
    }
    getAuthenticatedClient(kakaoId)?.from('daily_cache').select('content')
      .eq('kakao_id', String(kakaoId)).eq('cache_date', today).eq('cache_type', ITEM_BOOSTS_CACHE)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          try {
            const parsed = JSON.parse(data.content);
            setBoostMap(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
          } catch { setBoostMap({}); }
        }
      })
      .catch(() => setBoostMap({}));
  }, [kakaoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInventory = useCallback(async () => {
    if (!kakaoId) return;
    setLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { data: allShopItems } = await client.from('shop_items').select('*');
      const shopItemsMap = new Map((allShopItems || []).map((i) => [i.id, i]));
      const { data: inv } = await client.from('user_shop_inventory').select('item_id, unlocked_at').eq('kakao_id', String(kakaoId)).order('unlocked_at', { ascending: false });
      setItems((inv || []).map((r) => {
        const info = shopItemsMap.get(r.item_id) || findItem(r.item_id);
        return info ? { ...info, _invItemId: r.item_id, id: info.id || r.item_id, unlocked_at: r.unlocked_at } : null;
      }).filter(Boolean));
    } catch { showToast?.('아이템 목록을 불러오지 못했어요', 'error'); }
    finally { setLoading(false); }
  }, [kakaoId, showToast]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  useEffect(() => {
    if (category !== '전체' && fortuneFilter !== 'all') {
      setFortuneFilter('all');
    }
  }, [category, fortuneFilter]);

  useEffect(() => {
    if (fortuneFilter === 'all') return;
    if (!groupedItems.some(([key]) => key === fortuneFilter)) {
      setFortuneFilter('all');
    }
  }, [fortuneFilter, groupedItems]);

  // 아이템 발동 = 소비: 인벤토리 삭제 + boostMap 캐시 저장
  async function handleActivate(item) {
    if (!kakaoId || !item?.aspectKey || !item?.boost) return;
    setToggling(item.id);
    try {
      await getAuthenticatedClient(kakaoId)
        ?.from('user_shop_inventory')
        .delete()
        .eq('kakao_id', String(kakaoId))
        .eq('item_id', String(item.id));
      const nextMap = {
        ...boostMap,
        [item.aspectKey]: buildBoostEntry(boostMap?.[item.aspectKey], item),
      };
      writeDailyLocalCache(kakaoId, ITEM_BOOSTS_CACHE, JSON.stringify(nextMap), today);
      if (canUseDailySupabaseTables()) {
        await getAuthenticatedClient(kakaoId)?.from('daily_cache').upsert(
          { kakao_id: String(kakaoId), cache_date: today, cache_type: ITEM_BOOSTS_CACHE, content: JSON.stringify(nextMap) },
          { onConflict: 'kakao_id,cache_date,cache_type' },
        );
      }
      setBoostMap(nextMap);
      setItems((prev) => prev.filter((i) => String(i.id) !== String(item.id)));
      showToast?.(`${item.emoji} ${item.name} 발동! 오늘 하루 상세에서 확인해보세요 ✦`, 'success');
    } catch { showToast?.('처리 중 오류가 발생했어요.', 'error'); }
    finally { setToggling(null); }
  }

  // 파생 상태
  const isGachaId = (id) => ALL_GACHA_POOL.some((g) => g.id === id);
  const gachaItems = items.filter((i) => isGachaId(i._invItemId || i.id));
  const shopItems  = items.filter((i) => !isGachaId(i._invItemId || i.id));

  const filtered = category === '전체' ? items
    : category === '🌌 우주' ? items.filter((i) => GRADE_ORDER.includes(i.grade))
    : category === '☯️ 사주' ? items.filter((i) => SAJU_GRADE_ORDER.includes(i.grade))
    : shopItems;

  const gradeCountMap = {};
  for (const g of GRADE_ORDER)      gradeCountMap[g] = gachaItems.filter((i) => i.grade === g && !String(i.id).startsWith('saju_')).length;
  for (const g of SAJU_GRADE_ORDER) gradeCountMap[g] = gachaItems.filter((i) => i.grade === g && String(i.id).startsWith('saju_')).length;
  const synthableGrades = [
    ...GRADE_ORDER.filter((g) => GRADE_CONFIG[g].next && gradeCountMap[g] >= GRADE_CONFIG[g].synthCost),
    ...SAJU_GRADE_ORDER.filter((g) => SAJU_GRADE_CONFIG[g].next && gradeCountMap[g] >= SAJU_GRADE_CONFIG[g].synthCost),
  ];
  const canSynth = synthableGrades.length > 0;

  const todayBoostEntries = Object.entries(boostMap);

  const sortedFiltered = useMemo(() => {
    const gradeRank = (i) => GRADE_ORDER.includes(i.grade) ? 100 - GRADE_ORDER.indexOf(i.grade) : SAJU_GRADE_ORDER.includes(i.grade) ? 100 - SAJU_GRADE_ORDER.indexOf(i.grade) : 0;
    const priority = (i) => (i.boost || 0) * 100 + gradeRank(i);
    return [...filtered].sort((a, b) => {
      if (sortMode === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
      if (sortMode === 'recent') return new Date(b.unlocked_at || 0).getTime() - new Date(a.unlocked_at || 0).getTime();
      if (sortMode === 'grade') return gradeRank(b) - gradeRank(a) || (b.boost || 0) - (a.boost || 0);
      return priority(b) - priority(a) || String(a.name || '').localeCompare(String(b.name || ''), 'ko');
    });
  }, [boostMap, filtered, sortMode]);

  const groupedItems = Object.entries(
    sortedFiltered.reduce((acc, item) => { const k = item.aspectKey || 'general'; if (!acc[k]) acc[k] = []; acc[k].push(item); return acc; }, {})
  ).sort(([a], [b]) => a === 'general' ? 1 : b === 'general' ? -1 : (FORTUNE_LABELS[a] || a).localeCompare(FORTUNE_LABELS[b] || b, 'ko'));

  const fortuneOptions = useMemo(() => ([
    { id: 'all', label: '전체' },
    ...groupedItems.map(([key, group]) => ({
      id: key,
      label: `${FORTUNE_LABELS[key] || key} (${group.length})`,
    })),
  ]), [groupedItems]);

  const visibleGroupedItems = useMemo(() => {
    if (fortuneFilter === 'all') return groupedItems;
    return groupedItems.filter(([key]) => key === fortuneFilter);
  }, [fortuneFilter, groupedItems]);

  const itemGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10, alignItems: 'stretch' };
  const cardProps = (item, idx, prefix) => ({
    key: `${prefix}-${item.id}-${idx}`,
    item, toggling: toggling === item.id,
    onUse: setUseItem, boostMap, onActivate: handleActivate, onDetail: setDetailItem, compact: true,
  });

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ margin: '20px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)' }}>🎁 내 아이템</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 3 }}>보유 {items.length}개</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowSynth(true)}
            style={{ padding: '8px 12px', background: canSynth ? 'var(--goldf)' : 'var(--bg2)', border: `1px solid ${canSynth ? 'var(--acc)' : 'var(--line)'}`, borderRadius: 20, color: canSynth ? 'var(--gold)' : 'var(--t4)', fontSize: 'var(--xs)', fontWeight: 700, cursor: 'pointer', position: 'relative' }}
          >
            ⚗️ 합성{canSynth && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />}
          </button>
          <button
            onClick={() => setShowCollection(true)}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 20, color: 'var(--t3)', fontSize: 'var(--xs)', fontWeight: 700, cursor: 'pointer' }}
          >
            📖 도감
          </button>
        </div>
      </div>

      {/* 오늘 발동 현황 */}
      {todayBoostEntries.length > 0 && (
        <div style={{ margin: '0 24px 14px', padding: '12px 14px', borderRadius: 'var(--r2)', border: '1px solid rgba(232,176,72,0.3)', background: 'linear-gradient(135deg, rgba(232,176,72,0.08), rgba(232,176,72,0.02))' }}>
          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 8 }}>✨ 오늘 발동된 기운</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {todayBoostEntries.map(([key, entry]) => (
              <div key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(232,176,72,0.15)', border: '1px solid rgba(232,176,72,0.3)', fontSize: '11px', color: 'var(--gold)', fontWeight: 600 }}>
                {entry.emoji} {FORTUNE_LABELS[key] || key} +{entry.boost}점
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 8 }}>정화재점 시 오늘 운세 전체에 반영돼요</div>
        </div>
      )}

      {/* 세그먼트 컨트롤 + 정렬 */}
      <div style={{ margin: '0 24px 10px' }}>
        {/* 3탭 세그먼트 */}
        <div style={{ display: 'flex', gap: 3, background: 'var(--bg3)', borderRadius: 'var(--r1)', padding: 3, border: '1px solid var(--line)' }}>
          {SEGMENTS.map((seg) => {
            const isActive = category === seg.id;
            return (
              <button
                key={seg.id}
                onClick={() => setCategory(seg.id)}
                style={{
                  flex: 1, padding: '7px 4px',
                  borderRadius: 'calc(var(--r1) - 2px)',
                  border: 'none', fontFamily: 'var(--ff)',
                  fontSize: '11px', fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer', transition: 'all .15s',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  background: isActive ? 'var(--goldf)' : 'transparent',
                  color: isActive ? 'var(--gold)' : 'var(--t4)',
                  outline: isActive ? '1px solid var(--acc)' : 'none',
                }}
              >
                {seg.label}
              </button>
            );
          })}
          <button
            onClick={() => setShowSortRow((p) => !p)}
            style={{
              flexShrink: 0, padding: '7px 10px',
              borderRadius: 'calc(var(--r1) - 2px)',
              border: 'none', fontFamily: 'var(--ff)',
              fontSize: '11px', cursor: 'pointer',
              background: showSortRow ? 'var(--bg2)' : 'transparent',
              color: 'var(--t4)', transition: 'all .15s',
            }}
            aria-label="정렬"
          >
            ⇅
          </button>
        </div>
        {/* 정렬 행 (토글) */}
        {showSortRow && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
            {[{ id: 'recommended', label: '추천순' }, { id: 'recent', label: '최근' }, { id: 'grade', label: '등급순' }].map((s) => {
              const isActive = sortMode === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { setSortMode(s.id); setShowSortRow(false); }}
                  style={{
                    padding: '5px 10px', borderRadius: 20,
                    border: `1px solid ${isActive ? 'var(--acc)' : 'var(--line)'}`,
                    background: isActive ? 'var(--goldf)' : 'var(--bg2)',
                    color: isActive ? 'var(--gold)' : 'var(--t4)',
                    fontWeight: isActive ? 700 : 400,
                    fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 아이템 그리드 */}
      <div style={{ padding: '6px 24px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--t4)', fontSize: 'var(--sm)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>불러오는 중...
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{category === '전체' ? '🎁' : '🔍'}</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', fontWeight: 600, marginBottom: 6 }}>
              {category === '전체' ? '보유한 아이템이 없어요' : `${category} 아이템이 없어요`}
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 20 }}>뽑기에서 아이템을 모아봐요!</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setStep(STEP.SHOP)} style={{ padding: '9px 18px', background: 'var(--goldf)', border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>별숨샵 열기 →</button>
              <button onClick={() => setShowCollection(true)} style={{ padding: '9px 18px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>도감 보기 →</button>
            </div>
          </div>
        ) : category === '전체' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {fortuneOptions.map((option) => {
                const isActive = fortuneFilter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFortuneFilter(option.id)}
                    style={{
                      flexShrink: 0,
                      padding: '7px 11px',
                      borderRadius: 999,
                      border: `1px solid ${isActive ? 'var(--acc)' : 'var(--line)'}`,
                      background: isActive ? 'var(--goldf)' : 'var(--bg2)',
                      color: isActive ? 'var(--gold)' : 'var(--t4)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 'var(--xs)',
                      fontFamily: 'var(--ff)',
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {visibleGroupedItems.map(([key, group]) => (
              <section key={key} style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))', border: '1px solid var(--line)', borderRadius: 'var(--r2)', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>{FORTUNE_LABELS[key] || key}</div>
                    {boostMap[key] && (
                      <div style={{ fontSize: '10px', color: 'var(--gold)', marginTop: 2 }}>
                        ✨ 오늘 {boostMap[key].name} 발동됨 (+{boostMap[key].boost}점)
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>{group.length}개</div>
                </div>
                <div style={itemGridStyle}>{group.map((item, idx) => <OwnedItemCard {...cardProps(item, idx, key)} />)}</div>
              </section>
            ))}
          </div>
        ) : (
          <div style={itemGridStyle}>{sortedFiltered.map((item, idx) => <OwnedItemCard {...cardProps(item, idx, 'all')} />)}</div>
        )}
      </div>

      {/* 모달들 */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onActivate={handleActivate}
          toggling={toggling === detailItem?.id}
          boostMap={boostMap}
        />
      )}
      {useItem && <UseItemModal item={useItem} callApi={callApi} onClose={() => setUseItem(null)} showToast={showToast} />}
      {showSynth && <SynthesisModal inventory={gachaItems} kakaoId={kakaoId} onClose={() => setShowSynth(false)} onComplete={loadInventory} showToast={showToast} onSpendBP={spendBP} />}
      {showCollection && <ItemCollectionPage inventoryItems={items} onClose={() => setShowCollection(false)} />}
    </div>
  );
}
