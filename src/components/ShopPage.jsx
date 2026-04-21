/**
 * ShopPage — 별숨 숍
 * BP를 소비해 테마·아바타·특별 상담·이펙트 아이템을 구매하거나 랜덤 뽑기
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import { spendBP } from '../utils/gamificationLogic.js';

const CAT_DESC = {
  theme:           '앱 전체 색감과 분위기가 바뀌어요',
  avatar:          '내 프로필 아바타가 바뀌어요',
  effect:          '화면에 아름다운 이펙트가 표시돼요',
  special_reading: '특별한 AI 상담을 1회 사용할 수 있어요',
};

const CATEGORIES = ['전체', '테마', '아바타', '특별 상담', '이펙트', '보관함'];
const CAT_MAP    = { '테마': 'theme', '아바타': 'avatar', '특별 상담': 'special_reading', '이펙트': 'effect' };

const RARITY_LABEL = { common: '일반', rare: '레어', legendary: '레전더리' };
const RARITY_COLOR = { common: 'var(--t4)', rare: '#7B9EC4', legendary: '#E8B048' };

const SHOP_GACHA_COST_1  = 20;
const SHOP_GACHA_COST_10 = 180;
const DUPLICATE_REFUND   = 5;

// 뽑기 풀에서 개수만큼 뽑기 (10연 시 레어 이상 1개 보장)
function pickFromPool(pool, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random() * 100;
    let rarity = 'common';
    if (roll < 5)  rarity = 'legendary';
    else if (roll < 40) rarity = 'rare';
    const bucket = pool.filter(item => item.rarity === rarity);
    const src    = bucket.length > 0 ? bucket : pool;
    results.push(src[Math.floor(Math.random() * src.length)]);
  }
  if (count === 10) {
    const hasRarePlus = results.some(i => i.rarity === 'rare' || i.rarity === 'legendary');
    if (!hasRarePlus) {
      const rareBucket = pool.filter(i => i.rarity === 'rare' || i.rarity === 'legendary');
      if (rareBucket.length > 0) {
        results[Math.floor(Math.random() * count)] =
          rareBucket[Math.floor(Math.random() * rareBucket.length)];
      }
    }
  }
  return results;
}

// ── 숍 뽑기 결과 모달 ───────────────────────────────────────
function ShopGachaResultModal({ results, ownedIds, onClose }) {
  if (!results) return null;
  const isSingle = results.length === 1;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(13,11,20,0.96)',
      display: 'flex', flexDirection: 'column',
      animation: 'gacha-result-bg .3s ease',
    }}>
      <div style={{ padding: '22px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: '#fff' }}>
          {isSingle ? '✦ 숍 뽑기 결과' : '✦ 숍 10연 뽑기 결과'}
        </div>
        <button onClick={onClose} style={{
          padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,.2)',
          background: 'none', color: 'rgba(255,255,255,.6)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
        }}>닫기</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', alignItems: isSingle ? 'center' : 'flex-start', justifyContent: 'center' }}>
        {isSingle ? (() => {
          const item  = results[0];
          const isDup = ownedIds.has(item.id);
          const rc    = RARITY_COLOR[item.rarity];
          return (
            <div style={{
              width: 210, borderRadius: 22,
              border: `2px solid ${rc}`,
              background: `linear-gradient(160deg, ${rc}1A, ${rc}06)`,
              padding: '36px 22px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              boxShadow: `0 0 36px ${rc}44`,
              animation: 'gacha-card-in .5s cubic-bezier(.34,1.56,.64,1) both',
            }}>
              <div style={{ fontSize: 56 }}>{item.emoji}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: rc, letterSpacing: '.07em' }}>{RARITY_LABEL[item.rarity]}</div>
              <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: '#fff', textAlign: 'center' }}>{item.name}</div>
              <div style={{ fontSize: 'var(--xs)', color: 'rgba(255,255,255,.5)', textAlign: 'center', lineHeight: 1.6 }}>{item.description}</div>
              {CAT_DESC[item.category] && (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.35)', textAlign: 'center', fontStyle: 'italic' }}>{CAT_DESC[item.category]}</div>
              )}
              <div style={{
                fontSize: '11px', padding: '5px 14px', borderRadius: 20,
                background: isDup ? 'rgba(123,196,160,0.12)' : 'var(--goldf)',
                border: `1px solid ${isDup ? 'rgba(123,196,160,0.35)' : 'var(--acc)'}`,
                color: isDup ? '#7BC4A0' : 'var(--gold)', fontWeight: 600,
              }}>
                {isDup ? `중복 아이템 · +${DUPLICATE_REFUND}BP 환불` : '✦ 새 아이템!'}
              </div>
            </div>
          );
        })() : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, width: '100%', maxWidth: 360 }}>
            {results.map((item, i) => {
              const isDup = ownedIds.has(item.id);
              const rc    = RARITY_COLOR[item.rarity];
              return (
                <div key={i} style={{
                  borderRadius: 14, border: `1.5px solid ${rc}80`,
                  background: `${rc}0C`,
                  padding: '14px 12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  animation: `gacha-card-in .4s cubic-bezier(.34,1.56,.64,1) ${i * 0.06}s both`,
                }}>
                  <div style={{ fontSize: 30 }}>{item.emoji}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: rc, letterSpacing: '.05em' }}>{RARITY_LABEL[item.rarity]}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.25 }}>{item.name}</div>
                  <div style={{ fontSize: '9px', color: isDup ? '#7BC4A0' : 'var(--gold)', fontWeight: 600 }}>
                    {isDup ? `중복 +${DUPLICATE_REFUND}BP` : '✦ NEW'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 20px 32px' }}>
        <button onClick={onClose} style={{
          width: '100%', padding: '13px', background: 'var(--goldf)', border: '1.5px solid var(--acc)',
          borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
          fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer',
        }}>보관함에서 확인하기 →</button>
      </div>
    </div>,
    document.body,
  );
}

// ── 숍 뽑기 배너 ───────────────────────────────────────────
function ShopGachaSection({ currentBP, pulling, onPull, hasItems }) {
  return (
    <div style={{
      margin: '0 20px',
      background: 'linear-gradient(135deg, #0e0b1e 0%, #14112c 60%, #0e0b1e 100%)',
      border: '1px solid rgba(180,142,240,.4)',
      borderRadius: 'var(--r2)',
      padding: '18px 16px', position: 'relative', overflow: 'hidden',
    }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${8 + (i * 14) % 84}%`, left: `${5 + (i * 17) % 90}%`,
          width: i % 2 === 0 ? 3 : 2, height: i % 2 === 0 ? 3 : 2,
          borderRadius: '50%', background: 'rgba(180,142,240,0.8)',
          opacity: 0.3 + (i % 3) * 0.2,
          animation: `floatGently ${2.2 + i % 3}s ease infinite ${i * 0.28}s`,
        }} />
      ))}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 'var(--xs)', color: 'rgba(180,142,240,0.9)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 4 }}>
          🎰 숍 아이템 랜덤 뽑기
        </div>
        <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: '#fff', marginBottom: 3 }}>
          테마 · 아바타 · 이펙트를 뽑아봐요
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.38)', marginBottom: 14, lineHeight: 1.6 }}>
          레전더리 5% · 레어 35% · 일반 60% · 중복 시 {DUPLICATE_REFUND}BP 환불
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onPull(1)}
            disabled={!!pulling || currentBP < SHOP_GACHA_COST_1 || !hasItems}
            style={{
              flex: 1, padding: '12px 6px', borderRadius: 'var(--r1)',
              background: currentBP >= SHOP_GACHA_COST_1 ? 'rgba(180,142,240,0.18)' : 'rgba(255,255,255,.04)',
              border: `1.5px solid ${currentBP >= SHOP_GACHA_COST_1 ? 'rgba(180,142,240,0.55)' : 'rgba(255,255,255,.08)'}`,
              color: currentBP >= SHOP_GACHA_COST_1 ? 'rgba(180,142,240,0.9)' : 'rgba(255,255,255,.25)',
              fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
              cursor: currentBP >= SHOP_GACHA_COST_1 && !pulling && hasItems ? 'pointer' : 'not-allowed',
              transition: 'all .2s',
            }}
          >
            {pulling === 'shop1' ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, border: '2px solid rgba(180,142,240,.3)', borderTopColor: 'rgba(180,142,240,.9)', borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block' }} />
                뽑는 중...
              </span>
            ) : (
              <>✦ 1회 뽑기<br /><span style={{ fontSize: '11px', fontWeight: 400 }}>{SHOP_GACHA_COST_1} BP</span></>
            )}
          </button>
          <button
            onClick={() => onPull(10)}
            disabled={!!pulling || currentBP < SHOP_GACHA_COST_10 || !hasItems}
            style={{
              flex: 1.4, padding: '12px 6px', borderRadius: 'var(--r1)',
              background: currentBP >= SHOP_GACHA_COST_10 ? 'rgba(180,142,240,0.28)' : 'rgba(255,255,255,.04)',
              border: `1.5px solid ${currentBP >= SHOP_GACHA_COST_10 ? 'rgba(180,142,240,0.5)' : 'rgba(255,255,255,.08)'}`,
              color: currentBP >= SHOP_GACHA_COST_10 ? 'rgba(180,142,240,0.9)' : 'rgba(255,255,255,.25)',
              fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
              cursor: currentBP >= SHOP_GACHA_COST_10 && !pulling && hasItems ? 'pointer' : 'not-allowed',
              transition: 'all .2s', position: 'relative', overflow: 'hidden',
            }}
          >
            {pulling === 'shop10' ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, border: '2px solid rgba(180,142,240,.3)', borderTopColor: 'rgba(180,142,240,.9)', borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block' }} />
                뽑는 중...
              </span>
            ) : (
              <>
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 'inherit',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent)',
                  animation: currentBP >= SHOP_GACHA_COST_10 ? 'gacha-shine 2.5s ease infinite' : 'none',
                }} />
                ✦ 10연 뽑기<br />
                <span style={{ fontSize: '11px' }}>{SHOP_GACHA_COST_10} BP</span>
                <span style={{ display: 'block', fontSize: '10px', color: 'rgba(232,176,72,.8)', marginTop: 2 }}>
                  레어 이상 1개 보장
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 구매 확인 모달 ──────────────────────────────────────────
function ConfirmModal({ item, currentBP, onConfirm, onClose, buying }) {
  const canAfford = currentBP >= item.bp_cost;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--bg1)',
        borderRadius: 'var(--r2, 16px)',
        padding: '28px 24px',
        border: '1px solid var(--line)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{item.emoji}</div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>
            {item.name}
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 12 }}>
            {item.description}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: 'var(--goldf)', borderRadius: 20, border: '1px solid var(--acc)',
          }}>
            <span style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--gold)' }}>
              {item.bp_cost} BP
            </span>
          </div>
        </div>

        <div style={{
          padding: '12px', background: 'var(--bg2)', borderRadius: 'var(--r1)',
          marginBottom: 16, textAlign: 'center', fontSize: 'var(--xs)',
          color: canAfford ? 'var(--t3)' : 'var(--rose)',
        }}>
          현재 보유 BP: <strong style={{ color: canAfford ? 'var(--t1)' : 'var(--rose)' }}>{currentBP} BP</strong>
          {!canAfford && (
            <div style={{ marginTop: 4, color: 'var(--rose)' }}>
              BP가 {item.bp_cost - currentBP} 부족해요
            </div>
          )}
        </div>

        <button
          onClick={onConfirm}
          disabled={!canAfford || buying}
          style={{
            width: '100%', padding: '13px',
            background: canAfford ? 'var(--goldf)' : 'var(--bg3)',
            border: `1.5px solid ${canAfford ? 'var(--acc)' : 'var(--line)'}`,
            borderRadius: 'var(--r1)',
            color: canAfford ? 'var(--gold)' : 'var(--t4)',
            fontWeight: 700, fontSize: 'var(--sm)', fontFamily: 'var(--ff)',
            cursor: canAfford ? 'pointer' : 'not-allowed',
            marginBottom: 8,
          }}
        >
          {buying ? '구매 중...' : canAfford ? `✦ 구매하기 (${item.bp_cost} BP)` : 'BP 부족'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px', background: 'none', border: 'none',
            color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ── 아이템 카드 ────────────────────────────────────────────
function ItemCard({ item, owned, onBuy, onUse }) {
  const canEquip  = item.category === 'theme' || item.category === 'avatar' || item.category === 'effect';
  const isSpecial = item.category === 'special_reading';

  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${owned ? 'var(--acc)' : 'var(--line)'}`,
      borderRadius: 'var(--r2, 16px)',
      padding: '18px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
      position: 'relative',
    }}>
      {item.rarity !== 'common' && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: '10px', fontWeight: 700,
          color: RARITY_COLOR[item.rarity], letterSpacing: '.04em',
        }}>
          {RARITY_LABEL[item.rarity]}
        </div>
      )}

      <div style={{ fontSize: 32, lineHeight: 1 }}>{item.emoji}</div>
      <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>{item.name}</div>
      <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.5 }}>{item.description}</div>

      {CAT_DESC[item.category] && (
        <div style={{
          fontSize: '10px', color: 'var(--t4)', lineHeight: 1.5,
          padding: '5px 8px',
          background: 'rgba(232,176,72,0.04)',
          borderRadius: 8, borderLeft: '2px solid var(--acc)',
        }}>
          {CAT_DESC[item.category]}
        </div>
      )}

      {owned ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {canEquip && (
            <button
              onClick={() => onBuy(item)}
              style={{
                padding: '9px', textAlign: 'center', fontSize: 'var(--xs)', width: '100%',
                color: 'var(--gold)', fontWeight: 700, cursor: 'pointer',
                border: '1px solid var(--acc)', borderRadius: 'var(--r1)',
                background: item.is_equipped ? 'rgba(232,176,72,0.2)' : 'var(--goldf)',
                fontFamily: 'var(--ff)',
                boxShadow: item.is_equipped ? '0 0 8px rgba(232,176,72,0.4)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {item.is_equipped ? '✦ 장착 중 (해제)' : '장착하기'}
            </button>
          )}
          {isSpecial && (
            <button
              onClick={onUse}
              style={{
                padding: '9px', textAlign: 'center', fontSize: 'var(--xs)', width: '100%',
                color: 'var(--gold)', fontWeight: 700, cursor: 'pointer',
                border: '1px solid var(--acc)', borderRadius: 'var(--r1)',
                background: 'var(--goldf)', fontFamily: 'var(--ff)',
              }}
            >
              ✦ 지금 사용하기 →
            </button>
          )}
          {!canEquip && !isSpecial && (
            <div style={{ padding: '9px', textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)' }}>
              ✦ 보유 중
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => onBuy(item)}
          style={{
            marginTop: 4, padding: '9px',
            background: 'var(--goldf)', border: '1.5px solid var(--acc)',
            borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
            fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', width: '100%',
          }}
        >
          {item.bp_cost} BP
        </button>
      )}
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────
export default function ShopPage({ showToast }) {
  const user    = useAppStore((s) => s.user);
  const setStep = useAppStore((s) => s.setStep);

  const [category, setCategory]       = useState('전체');
  const [items, setItems]             = useState([]);
  const [ownedIds, setOwnedIds]       = useState(new Set());
  const [currentBP, setCurrentBP]     = useState(0);
  const [confirmItem, setConfirmItem] = useState(null);
  const [buying, setBuying]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [equippedIds, setEquippedIds] = useState({ theme: null, avatar: null, effect: null });

  // 숍 뽑기 state
  const [shopGachaPulling, setShopGachaPulling] = useState(false);
  const [shopGachaResults, setShopGachaResults] = useState(null);
  // ownedIds snapshot at pull time (for duplicate badge in modal)
  const [pullTimeOwnedIds, setPullTimeOwnedIds] = useState(new Set());

  const kakaoId = user?.kakaoId || user?.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);

      const [itemsRes, bpRes, invRes] = await Promise.all([
        client.from('shop_items').select('*').eq('is_active', true).order('bp_cost'),
        kakaoId
          ? client.from('users').select('current_bp').eq('kakao_id', String(kakaoId)).single()
          : Promise.resolve({ data: null }),
        kakaoId
          ? client.from('user_shop_inventory').select('item_id, is_equipped').eq('kakao_id', String(kakaoId))
          : Promise.resolve({ data: [] }),
      ]);

      const allItems = itemsRes.data || [];
      const userInv  = invRes.data || [];
      setItems(allItems.filter(i => i.category !== 'talisman'));
      setCurrentBP(bpRes.data?.current_bp ?? 0);
      setOwnedIds(new Set(userInv.map(r => r.item_id)));

      const equippedMap     = { theme: null, avatar: null, effect: null };
      const equippedFromDB  = userInv.filter(r => r.is_equipped).map(r => r.item_id);
      for (const eid of equippedFromDB) {
        const itemObj = allItems.find(i => i.id === eid);
        if (itemObj && equippedMap[itemObj.category] === null) {
          equippedMap[itemObj.category] = eid;
        }
      }
      setEquippedIds(equippedMap);

      const store = useAppStore.getState();
      store.setEquippedTheme?.(allItems.find(i => i.id === equippedMap.theme)  || null);
      store.setEquippedAvatar?.(allItems.find(i => i.id === equippedMap.avatar) || null);
    } catch {
      showToast?.('숍 정보를 불러오지 못했어요', 'error');
    } finally {
      setLoading(false);
    }
  }, [kakaoId, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // 직접 구매
  async function handlePurchase(item) {
    if (!kakaoId) { showToast?.('로그인 후 구매할 수 있어요', 'info'); return; }
    setBuying(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok, newBP } = await spendBP(client, kakaoId, item.bp_cost, 'SHOP_PURCHASE', item.name);
      if (!ok) { showToast?.('BP가 부족해요', 'error'); setBuying(false); return; }

      await client.from('user_shop_inventory').insert({
        kakao_id: String(kakaoId), item_id: item.id, is_equipped: false,
      });

      setCurrentBP(newBP ?? currentBP - item.bp_cost);
      setOwnedIds(prev => new Set([...prev, item.id]));
      setConfirmItem(null);

      if (item.category === 'special_reading') {
        showToast?.(`${item.name} 구매 완료! 지금 바로 사용하러 가볼까요? ✦`, 'success');
        setTimeout(() => setStep(33), 800);
      } else {
        showToast?.(`${item.name} 구매 완료! ✦`, 'success');
      }
    } catch {
      showToast?.('구매에 실패했어요. 다시 시도해봐요.', 'error');
    } finally {
      setBuying(false);
    }
  }

  // 장착/해제
  async function handleEquipItem(item) {
    if (!kakaoId) return;
    const cat        = item.category;
    const isEquipping = equippedIds[cat] !== item.id;
    try {
      const client          = getAuthenticatedClient(kakaoId);
      const categoryItemIds = items.filter(i => i.category === cat).map(i => i.id);

      if (isEquipping) {
        const othersToUnequip = categoryItemIds.filter(id => id !== item.id);
        if (othersToUnequip.length > 0) {
          await client.from('user_shop_inventory')
            .update({ is_equipped: false })
            .eq('kakao_id', String(kakaoId))
            .in('item_id', othersToUnequip);
        }
        await client.from('user_shop_inventory')
          .update({ is_equipped: true })
          .eq('kakao_id', String(kakaoId))
          .eq('item_id', item.id);

        setEquippedIds(prev => ({ ...prev, [cat]: item.id }));
        if (cat === 'theme')  useAppStore.getState().setEquippedTheme(item);
        if (cat === 'avatar') useAppStore.getState().setEquippedAvatar(item);
        showToast?.(`${item.name} 장착 완료! ✦`, 'success');
      } else {
        await client.from('user_shop_inventory')
          .update({ is_equipped: false })
          .eq('kakao_id', String(kakaoId))
          .eq('item_id', item.id);

        setEquippedIds(prev => ({ ...prev, [cat]: null }));
        if (cat === 'theme')  useAppStore.getState().setEquippedTheme(null);
        if (cat === 'avatar') useAppStore.getState().setEquippedAvatar(null);
        showToast?.(`${item.name} 장착을 해제했어요.`, 'success');
      }
    } catch {
      showToast?.('장착 상태 변경에 실패했어요.', 'error');
    }
  }

  // 숍 뽑기 (랜덤)
  async function doShopGachaPull(count) {
    if (!kakaoId) { showToast?.('로그인 후 이용 가능해요', 'info'); return; }
    const cost     = count === 1 ? SHOP_GACHA_COST_1 : SHOP_GACHA_COST_10;
    if (currentBP < cost) { showToast?.(`BP가 부족해요 (필요: ${cost} BP)`, 'error'); return; }

    // special_reading은 뽑기 풀에서 제외 (직접 구매만)
    const gachaPool = items.filter(i => i.category !== 'special_reading');
    if (gachaPool.length === 0) { showToast?.('뽑기 가능한 아이템이 없어요', 'error'); return; }

    const pulling = count === 1 ? 'shop1' : 'shop10';
    setShopGachaPulling(pulling);

    // pull 시작 시점의 ownedIds 스냅샷 (중복 뱃지 표시용)
    const ownedSnapshot = new Set(ownedIds);
    setPullTimeOwnedIds(ownedSnapshot);

    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok, newBP } = await spendBP(client, kakaoId, cost, `SHOP_GACHA_${count}_${Date.now()}`, `숍 뽑기 ${count}회`);
      if (!ok) { showToast?.('BP가 부족해요', 'error'); return; }

      const pulled = pickFromPool(gachaPool, count);

      // 중복 분리 (이번 뽑기 내에서도 중복 방지)
      let   refundTotal    = 0;
      const toInsert       = [];
      const newThisPull    = new Set();

      for (const item of pulled) {
        if (ownedSnapshot.has(item.id) || newThisPull.has(item.id)) {
          refundTotal += DUPLICATE_REFUND;
        } else {
          toInsert.push(item);
          newThisPull.add(item.id);
        }
      }

      if (toInsert.length > 0) {
        await client.from('user_shop_inventory').insert(
          toInsert.map(item => ({ kakao_id: String(kakaoId), item_id: item.id, is_equipped: false }))
        );
        setOwnedIds(prev => new Set([...prev, ...toInsert.map(i => i.id)]));
      }

      // 중복 환불
      let finalBP = newBP ?? currentBP - cost;
      if (refundTotal > 0) {
        // 안전하게 DB에서 최신 BP 읽어서 업데이트
        const { data: freshData } = await client
          .from('users').select('current_bp')
          .eq('kakao_id', String(kakaoId)).single();
        const freshBP = freshData?.current_bp ?? finalBP;
        await client.from('users')
          .update({ current_bp: freshBP + refundTotal })
          .eq('kakao_id', String(kakaoId));
        finalBP = freshBP + refundTotal;
      }
      setCurrentBP(finalBP);
      setShopGachaResults(pulled);
    } catch {
      showToast?.('뽑기 중 오류가 발생했어요', 'error');
    } finally {
      setShopGachaPulling(false);
    }
  }

  const filtered = category === '전체'
    ? items.filter(i => i.category !== 'special_reading')
    : category === '보관함'
      ? Array.from(ownedIds).map(id => items.find(i => i.id === id)).filter(Boolean)
      : items.filter(i => i.category === CAT_MAP[category]);

  const gachaHasItems = items.filter(i => i.category !== 'special_reading').length > 0;

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em' }}>
            ✦ 별숨 숍
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', background: 'var(--goldf)', borderRadius: 20, border: '1px solid var(--acc)',
          }}>
            <span style={{ fontSize: '14px', color: 'var(--gold)' }}>✦</span>
            <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)' }}>{currentBP} BP</span>
          </div>
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.3 }}>
          BP로 나만의<br />별숨을 꾸며봐요
        </div>
        <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
          직접 구매하거나 랜덤 뽑기로 아이템을 모아봐요
        </div>
      </div>

      {/* 숍 뽑기 배너 */}
      <ShopGachaSection
        currentBP={currentBP}
        pulling={shopGachaPulling}
        onPull={doShopGachaPull}
        hasItems={gachaHasItems && !loading}
      />

      {/* 카테고리 탭 */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        padding: '16px 20px 12px', scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 20,
              border: `1px solid ${category === cat ? 'var(--acc)' : 'var(--line)'}`,
              background: category === cat ? 'var(--goldf)' : 'none',
              color: category === cat ? 'var(--gold)' : 'var(--t3)',
              fontSize: 'var(--xs)', fontWeight: category === cat ? 700 : 400,
              cursor: 'pointer', fontFamily: 'var(--ff)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 특별 상담 탭: 안내 배너 */}
      {category === '특별 상담' && (
        <div style={{
          margin: '0 20px 12px', padding: '12px 14px',
          background: 'rgba(232,176,72,0.06)', border: '1px solid var(--acc)',
          borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6,
        }}>
          ✦ 특별 상담 아이템은 구매 즉시 사용할 수 있어요. 뽑기로는 제공되지 않아요.
        </div>
      )}

      {/* 아이템 그리드 */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)' }}>
            <div style={{
              width: 28, height: 28, border: '2px solid var(--line)', borderTopColor: 'var(--gold)',
              borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', margin: '0 auto 10px',
            }} />
            불러오는 중...
          </div>
        ) : category === '보관함' && filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t4)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗃️</div>
            <div style={{ fontSize: 'var(--sm)' }}>아직 수집한 아이템이 없어요</div>
            <div style={{ fontSize: 'var(--xs)', marginTop: 6, color: 'var(--t4)' }}>뽑기나 구매로 모아봐요</div>
          </div>
        ) : filtered.length === 0 && category !== '보관함' ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t4)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>
            <div style={{ fontSize: 'var(--sm)' }}>준비 중인 아이템이에요</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={{ ...item, is_equipped: equippedIds[item.category] === item.id }}
                owned={ownedIds.has(item.id)}
                onBuy={
                  ownedIds.has(item.id) && (item.category === 'theme' || item.category === 'avatar' || item.category === 'effect')
                    ? () => handleEquipItem(item)
                    : setConfirmItem
                }
                onUse={() => setStep(33)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 별숨 뽑기 교차 안내 */}
      <div style={{
        margin: '20px 20px 0', padding: '12px 14px',
        background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t2)', marginBottom: 2 }}>
            🌌 우주 · 사주 기운 아이템도 있어요
          </div>
          <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.5 }}>
            뽑기에서만 구할 수 있는 기운 아이템을 모아봐요
          </div>
        </div>
        <button
          onClick={() => setStep(40)}
          style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 20,
            background: 'none', border: '1px solid var(--line)',
            color: 'var(--t3)', fontSize: '11px', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          별숨 뽑기 →
        </button>
      </div>

      {/* BP 획득 안내 */}
      <div style={{
        margin: '14px 20px 0', padding: '14px 16px',
        background: 'var(--bg2)', borderRadius: 'var(--r1)',
        fontSize: '11px', color: 'var(--t4)', lineHeight: 1.7,
      }}>
        <div style={{ fontWeight: 700, color: 'var(--t3)', marginBottom: 6 }}>✦ BP 획득 방법</div>
        일일 출석 +5 · 미션 완료 +10 · 일기 작성 +5 · 앱 설치 +20 · 친구 공유 +3
      </div>

      {/* 구매 확인 모달 */}
      {confirmItem && (
        <ConfirmModal
          item={confirmItem}
          currentBP={currentBP}
          onConfirm={() => handlePurchase(confirmItem)}
          onClose={() => setConfirmItem(null)}
          buying={buying}
        />
      )}

      {/* 숍 뽑기 결과 모달 */}
      {shopGachaResults && (
        <ShopGachaResultModal
          results={shopGachaResults}
          ownedIds={pullTimeOwnedIds}
          onClose={() => { setShopGachaResults(null); loadData(); }}
        />
      )}
    </div>
  );
}
