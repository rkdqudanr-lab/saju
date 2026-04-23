import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCache, writeDailyLocalCache } from '../lib/dailyDataAccess.js';
import { useAppStore } from '../store/useAppStore.js';
import {
  GRADE_CONFIG, GRADE_ORDER, SAJU_GRADE_CONFIG, SAJU_GRADE_ORDER,
  ALL_GACHA_POOL, findItem,
} from '../utils/gachaItems.js';
import ItemCollectionPage from './ItemCollectionPage.jsx';

import OwnedItemCard   from '../features/inventory/OwnedItemCard.jsx';
import ItemDetailModal from '../features/inventory/ItemDetailModal.jsx';
import UseItemModal    from '../features/inventory/UseItemModal.jsx';
import SynthesisModal  from '../features/inventory/SynthesisModal.jsx';
import { FORTUNE_LABELS, DAILY_AXIS_CACHE, isItemDailyActive } from '../features/inventory/inventoryUtils.js';

const CATEGORIES = ['전체', '🌌 우주', '☯️ 사주', '기타'];

export default function ItemInventoryPage({ showToast, callApi, spendBP }) {
  const { user, setStep } = useAppStore();
  const kakaoId = user?.kakaoId || user?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('전체');
  const [toggling, setToggling] = useState(null);
  const [useItem, setUseItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [showSynth, setShowSynth] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [sortMode, setSortMode] = useState('recommended');
  const [dailyActMap, setDailyActMap] = useState({});
  const today = getDailyDateKey();

  // 오늘 발동 이력 로드
  useEffect(() => {
    if (!kakaoId) return;
    if (!canUseDailySupabaseTables()) {
      try {
        const parsed = JSON.parse(readDailyLocalCache(kakaoId, DAILY_AXIS_CACHE, today) || '{}');
        setDailyActMap(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
      } catch { setDailyActMap({}); }
      return;
    }
    getAuthenticatedClient(kakaoId).from('daily_cache').select('content')
      .eq('kakao_id', String(kakaoId)).eq('cache_date', today).eq('cache_type', DAILY_AXIS_CACHE)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          try {
            const parsed = JSON.parse(data.content);
            setDailyActMap(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
          } catch { setDailyActMap({}); }
        }
      })
      .catch(() => setDailyActMap({}));
  }, [kakaoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInventory = useCallback(async () => {
    if (!kakaoId) return;
    setLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { data: allShopItems } = await client.from('shop_items').select('*');
      const shopItemsMap = new Map((allShopItems || []).map((i) => [i.id, i]));
      const { data: inv } = await client.from('user_shop_inventory').select('item_id, is_equipped, unlocked_at').eq('kakao_id', String(kakaoId)).order('unlocked_at', { ascending: false });
      setItems((inv || []).map((r) => {
        const info = shopItemsMap.get(r.item_id) || findItem(r.item_id);
        return info ? { ...info, is_equipped: r.is_equipped, _invItemId: r.item_id, id: info.id || r.item_id } : null;
      }).filter(Boolean));
    } catch { showToast?.('아이템 목록을 불러오지 못했어요', 'error'); }
    finally { setLoading(false); }
  }, [kakaoId, showToast]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  async function handleDailyActivate(item) {
    if (!kakaoId || !item?.aspectKey) return;
    const isActive = isItemDailyActive(item, dailyActMap);
    const nextMap = isActive ? (() => { const m = { ...dailyActMap }; delete m[item.aspectKey]; return m; })() : { ...dailyActMap, [item.aspectKey]: item.id };
    try {
      writeDailyLocalCache(kakaoId, DAILY_AXIS_CACHE, JSON.stringify(nextMap), today);
      if (canUseDailySupabaseTables()) {
        await getAuthenticatedClient(kakaoId).from('daily_cache').upsert({ kakao_id: String(kakaoId), cache_date: today, cache_type: DAILY_AXIS_CACHE, content: JSON.stringify(nextMap) }, { onConflict: 'kakao_id,cache_date,cache_type' });
      }
      setDailyActMap(nextMap);
      showToast?.(isActive ? '오늘 발동을 해제했어요.' : `${item.emoji} ${item.name} 오늘 발동! 재생성하면 별숨에 반영돼요 ✦`, isActive ? 'info' : 'success');
    } catch { showToast?.('처리 중 오류가 발생했어요.', 'error'); }
  }

  async function handleToggleEquip(item) {
    if (!kakaoId || toggling) return;
    setToggling(item.id);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const isTalisman = item.category === 'talisman';
      const isGacha = !!item.grade;
      const newEquipped = !item.is_equipped;

      if (isTalisman) {
        if (newEquipped) {
          for (const t of items.filter((i) => i.is_equipped && i.category === 'talisman')) {
            await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId)).eq('item_id', t.id);
          }
          await client.from('user_shop_inventory').update({ is_equipped: true }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
          useAppStore.getState().setEquippedTalisman(item);
          showToast?.(`${item.emoji} ${item.name} 부적 발동! ✦`, 'success');
        } else {
          await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
          useAppStore.getState().setEquippedTalisman(null);
          showToast?.('부적 효과를 해제했어요.', 'info');
        }
        setItems((prev) => prev.map((i) => {
          if (i.id === item.id) return { ...i, is_equipped: newEquipped };
          if (newEquipped && i.is_equipped && i.category === 'talisman') return { ...i, is_equipped: false };
          return i;
        }));
        return;
      }
      if (!isGacha) { showToast?.('이 아이템은 장착할 수 없어요.', 'error'); return; }

      if (newEquipped) {
        for (const t of items.filter((i) => i.is_equipped && !!i.grade)) {
          await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId)).eq('item_id', t.id);
        }
        await client.from('user_shop_inventory').update({ is_equipped: true }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
        useAppStore.getState().setEquippedSajuItem(item);
        showToast?.(`[${item.name}] 기운을 장착했어요! ✦`, 'success');
      } else {
        await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
        useAppStore.getState().setEquippedSajuItem(null);
        showToast?.('기운 착용을 해제했어요.', 'info');
      }
      setItems((prev) => prev.map((i) => {
        if (i.id === item.id) return { ...i, is_equipped: newEquipped };
        if (newEquipped && i.is_equipped && !!i.grade) return { ...i, is_equipped: false };
        return i;
      }));
    } catch { showToast?.('처리 중 오류가 발생했어요', 'error'); }
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

  const equippedSajuItem     = useAppStore((s) => s.equippedSajuItem);
  const equippedDailyItems   = items.filter((i) => isItemDailyActive(i, dailyActMap));
  const equippedDailyItem    = equippedDailyItems[0] || null;
  const equippedTalismanItem = items.find((i) => i.is_equipped && i.category === 'talisman') || null;
  const spiritCount          = gachaItems.length;
  const utilityCount         = shopItems.length;
  const equippedSpiritCount  = items.filter((i) => i.is_equipped && !!i.grade).length;
  const equippedUtilityCount = items.filter((i) => i.is_equipped && !i.grade).length;
  const todayActiveCount     = equippedDailyItems.length + (equippedTalismanItem && !equippedDailyItems.some((i) => i.id === equippedTalismanItem.id) ? 1 : 0);

  const gradeCountMap = {};
  for (const g of GRADE_ORDER)      gradeCountMap[g] = gachaItems.filter((i) => i.grade === g && !String(i.id).startsWith('saju_')).length;
  for (const g of SAJU_GRADE_ORDER) gradeCountMap[g] = gachaItems.filter((i) => i.grade === g && String(i.id).startsWith('saju_')).length;
  const synthableGrades = [
    ...GRADE_ORDER.filter((g) => GRADE_CONFIG[g].next && gradeCountMap[g] >= GRADE_CONFIG[g].synthCost),
    ...SAJU_GRADE_ORDER.filter((g) => SAJU_GRADE_CONFIG[g].next && gradeCountMap[g] >= SAJU_GRADE_CONFIG[g].synthCost),
  ];
  const canSynth = synthableGrades.length > 0;

  const recommendedItems = useMemo(() => {
    const picked = [], seen = new Set();
    const push = (item) => { if (!item || seen.has(item.id)) return; seen.add(item.id); picked.push(item); };
    push(equippedSajuItem); push(equippedDailyItem); push(equippedTalismanItem);
    items.filter((i) => !i.is_equipped && !!i.grade).sort((a, b) => (b.boost || 0) - (a.boost || 0)).slice(0, 4).forEach(push);
    return picked.slice(0, 4);
  }, [equippedDailyItem, equippedSajuItem, equippedTalismanItem, items]);

  const sortedFiltered = useMemo(() => {
    const gradeRank = (i) => GRADE_ORDER.includes(i.grade) ? 100 - GRADE_ORDER.indexOf(i.grade) : SAJU_GRADE_ORDER.includes(i.grade) ? 100 - SAJU_GRADE_ORDER.indexOf(i.grade) : 0;
    const priority = (i) => (i.is_equipped ? 100000 : 0) + (isItemDailyActive(i, dailyActMap) ? 50000 : 0) + (i.category === 'talisman' ? 10000 : 0) + (i.boost || 0) * 100 + gradeRank(i);
    return [...filtered].sort((a, b) => {
      if (sortMode === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
      if (sortMode === 'recent') return new Date(b.unlocked_at || 0).getTime() - new Date(a.unlocked_at || 0).getTime();
      if (sortMode === 'grade') return gradeRank(b) - gradeRank(a) || (b.boost || 0) - (a.boost || 0);
      return priority(b) - priority(a) || String(a.name || '').localeCompare(String(b.name || ''), 'ko');
    });
  }, [dailyActMap, filtered, sortMode]);

  const groupedItems = Object.entries(
    sortedFiltered.reduce((acc, item) => { const k = item.aspectKey || 'general'; if (!acc[k]) acc[k] = []; acc[k].push(item); return acc; }, {})
  ).sort(([a], [b]) => a === 'general' ? 1 : b === 'general' ? -1 : (FORTUNE_LABELS[a] || a).localeCompare(FORTUNE_LABELS[b] || b, 'ko'));

  const itemGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10, alignItems: 'stretch' };
  const cardProps = (item, idx, prefix) => ({
    key: `${prefix}-${item.id}-${idx}`,
    item, onToggleEquip: handleToggleEquip, toggling: toggling === item.id,
    onUse: setUseItem, dailyActMap, onDailyActivate: handleDailyActivate, onDetail: setDetailItem, compact: true,
  });

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ margin: '20px 24px 14px', padding: '18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, borderRadius: 'var(--r2)', border: '1px solid var(--line)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>🎁 내 아이템</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
            보유 {items.length}개
            {equippedSajuItem && <span style={{ marginLeft: 8, color: 'var(--gold)', fontWeight: 600 }}>· {equippedSajuItem.emoji} {equippedSajuItem.name}의 기운</span>}
          </div>
        </div>
        <button onClick={() => setShowCollection(true)} style={{ padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--acc)', borderRadius: 20, color: 'var(--gold)', fontSize: 'var(--xs)', fontWeight: 700, cursor: 'pointer' }}>📖 도감 보기</button>
      </div>

      <div style={{ padding: '0 24px 14px' }}>
        {/* 통계 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
          {[{ label: 'ALL', value: items.length, tone: 'var(--t1)' }, { label: 'SPIRIT', value: spiritCount, tone: 'var(--gold)' }, { label: 'ETC', value: utilityCount, tone: 'var(--t3)' }].map((s) => (
            <div key={s.label} style={{ padding: '10px 12px', borderRadius: 'var(--r1)', border: '1px solid var(--line)', background: 'var(--bg2)' }}>
              <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: s.tone }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
          {[{ label: 'MAIN', value: equippedSpiritCount, tone: 'var(--gold)' }, { label: 'TODAY', value: todayActiveCount, tone: '#B48EF0' }, { label: 'ACTIVE', value: equippedUtilityCount, tone: '#7EC8A4' }].map((s) => (
            <div key={s.label} style={{ padding: '10px 12px', borderRadius: 'var(--r1)', border: '1px solid var(--line)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))' }}>
              <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: s.tone }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* 퀵 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {[
            { label: 'MAIN SPIRIT', color: 'rgba(232,176,72,0.22)', bg: 'linear-gradient(135deg, rgba(232,176,72,0.12), rgba(232,176,72,0.04))', tc: 'var(--gold)', title: equippedSajuItem ? equippedSajuItem.name : '아직 메인 기운이 없어요', hint: equippedSajuItem ? '모든 AI 결과에 반영 중' : '내 아이템에서 바로 장착할 수 있어요', onClick: () => equippedSajuItem && setDetailItem(equippedSajuItem), cursor: equippedSajuItem ? 'pointer' : 'default' },
            { label: 'TODAY SLOT', color: 'rgba(180,142,240,0.22)', bg: 'linear-gradient(135deg, rgba(180,142,240,0.12), rgba(180,142,240,0.04))', tc: '#B48EF0', title: equippedDailyItems.length > 1 ? `${equippedDailyItems.length}개 축 아이템 발동 중` : (equippedDailyItem?.name || equippedTalismanItem?.name || '오늘 발동한 아이템이 없어요'), hint: equippedDailyItem || equippedTalismanItem ? '오늘 하루 결과에 반영 중' : '일일 발동 버튼으로 바로 적용해요', onClick: () => (equippedDailyItem || equippedTalismanItem) && setDetailItem(equippedDailyItem || equippedTalismanItem), cursor: equippedDailyItem || equippedTalismanItem ? 'pointer' : 'default' },
            { label: 'COLLECTION', color: 'var(--line)', bg: 'var(--bg2)', tc: 'var(--t4)', title: `${items.length}개 보유 중`, hint: `기운 ${spiritCount}개 · 기타 ${utilityCount}개`, onClick: () => setShowCollection(true), cursor: 'pointer' },
            { label: 'SYNTH LAB', color: canSynth ? 'rgba(126,200,164,0.35)' : 'var(--line)', bg: canSynth ? 'linear-gradient(135deg, rgba(126,200,164,0.14), rgba(126,200,164,0.05))' : 'var(--bg2)', tc: canSynth ? '#7EC8A4' : 'var(--t4)', title: canSynth ? `${synthableGrades.length}개 조합이 가능해요` : '합성 재료가 아직 부족해요', hint: canSynth ? '내 아이템에서 바로 합성하기' : '별숨샵에서 재료를 더 모아보세요', onClick: () => canSynth ? setShowSynth(true) : setStep(31), cursor: 'pointer' },
          ].map((card) => (
            <button key={card.label} onClick={card.onClick} style={{ textAlign: 'left', padding: '14px', borderRadius: 'var(--r2)', border: `1px solid ${card.color}`, background: card.bg, cursor: card.cursor, minHeight: 108, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '10px', color: card.tc, fontWeight: 700, letterSpacing: '.08em', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 700, lineHeight: 1.5 }}>{card.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 6 }}>{card.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 합성 가능 배너 */}
      {canSynth && (
        <div style={{ padding: '0 24px 14px' }}>
          <button onClick={() => setShowSynth(true)} style={{ padding: '8px 16px', background: 'var(--goldf)', border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, animation: 'gacha-count-pop .4s ease' }}>
            ⚗️ 합성 가능! ({synthableGrades.map((g) => { const cfg = GRADE_CONFIG[g] || SAJU_GRADE_CONFIG[g]; return `${cfg.label} ${gradeCountMap[g]}개`; }).join(' · ')})
          </button>
        </div>
      )}

      {/* 카테고리 + 정렬 필터 */}
      {[CATEGORIES, [{ id: 'recommended', label: '추천순' }, { id: 'recent', label: '최근획득' }, { id: 'grade', label: '등급순' }, { id: 'name', label: '이름순' }]].map((group, gi) => (
        <div key={gi} style={{ display: 'flex', gap: 6, padding: '0 24px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {group.map((item) => {
            const id = typeof item === 'string' ? item : item.id;
            const label = typeof item === 'string' ? item : item.label;
            const isActive = gi === 0 ? category === id : sortMode === id;
            return (
              <button key={id} onClick={() => gi === 0 ? setCategory(id) : setSortMode(id)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, border: `1px solid ${isActive ? 'var(--acc)' : 'var(--line)'}`, background: isActive ? 'var(--goldf)' : 'var(--bg2)', color: isActive ? 'var(--gold)' : 'var(--t3)', fontWeight: isActive ? 700 : 400, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {label}
              </button>
            );
          })}
        </div>
      ))}

      {/* 추천 아이템 */}
      {recommendedItems.length > 0 && (
        <div style={{ padding: '0 24px 14px' }}>
          <div style={{ borderRadius: 'var(--r2)', border: '1px solid rgba(232,176,72,0.18)', background: 'linear-gradient(180deg, rgba(232,176,72,0.08), rgba(255,255,255,0))', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>지금 보기 좋은 아이템</div>
                <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 2 }}>장착 중이거나 바로 활용하기 좋은 아이템을 먼저 보여드려요.</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>{recommendedItems.length}개</div>
            </div>
            <div style={itemGridStyle}>
              {recommendedItems.map((item, idx) => <OwnedItemCard {...cardProps(item, idx, 'rec')} />)}
            </div>
          </div>
        </div>
      )}

      {/* 아이템 목록 헤더 */}
      <div style={{ padding: '0 24px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 'var(--r2)', border: '1px solid var(--line)', background: 'var(--bg2)' }}>
          <div>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>{category === '전체' ? '전체 아이템' : `${category} 아이템`}</div>
            <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.6 }}>{category === '전체' ? '운세 축 기준으로 묶어서 필요한 아이템을 더 빨리 찾을 수 있어요.' : '현재 선택한 필터에 맞는 아이템만 보여드려요.'}</div>
          </div>
          <div style={{ flexShrink: 0, fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>{sortedFiltered.length}개</div>
        </div>
      </div>

      {/* 아이템 그리드 */}
      <div style={{ padding: '0 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--t4)', fontSize: 'var(--sm)' }}><div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>불러오는 중...</div>
        ) : sortedFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{category === '전체' ? '🎁' : '🔍'}</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', fontWeight: 600, marginBottom: 6 }}>{category === '전체' ? '보유한 아이템이 없어요' : `${category} 아이템이 없어요`}</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 20 }}>뽑기에서 아이템을 모아봐요!</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setStep(31)} style={{ padding: '9px 18px', background: 'var(--goldf)', border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>별숨샵 열기 →</button>
              <button onClick={() => setShowCollection(true)} style={{ padding: '9px 18px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>도감 보기 →</button>
            </div>
          </div>
        ) : category === '전체' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {groupedItems.map(([key, group]) => (
              <section key={key} style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))', border: '1px solid var(--line)', borderRadius: 'var(--r2)', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>{FORTUNE_LABELS[key] || key}</div>
                    <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 2 }}>눌러서 상세 설명을 보고, 필요한 기운을 바로 골라 쓸 수 있어요.</div>
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
      {detailItem && <ItemDetailModal item={detailItem} onClose={() => setDetailItem(null)} onToggleEquip={handleToggleEquip} toggling={toggling === detailItem?.id} onDailyActivate={handleDailyActivate} dailyActMap={dailyActMap} />}
      {useItem && <UseItemModal item={useItem} callApi={callApi} onClose={() => setUseItem(null)} showToast={showToast} />}
      {showSynth && <SynthesisModal inventory={gachaItems} kakaoId={kakaoId} onClose={() => setShowSynth(false)} onComplete={loadInventory} showToast={showToast} onSpendBP={spendBP} />}
      {showCollection && <ItemCollectionPage inventoryItems={items} onClose={() => setShowCollection(false)} />}
    </div>
  );
}
