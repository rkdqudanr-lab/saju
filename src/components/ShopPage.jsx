/**
 * ShopPage — 별숨 숍
 * BP를 소비해 테마·아바타·특별 상담·이펙트 아이템을 구매
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import { spendBP } from '../utils/gamificationLogic.js';

const CAT_MAP_REVERSE = { theme: '테마', avatar: '아바타', special_reading: '특별 상담', effect: '이펙트' };

const CATEGORIES = ['전체', '테마', '아바타', '특별 상담', '부적', '보관함'];
const CAT_MAP = { '테마': 'theme', '아바타': 'avatar', '특별 상담': 'special_reading', '부적': 'talisman', '이펙트': 'effect' };

const RARITY_LABEL = { common: '일반', rare: '레어', legendary: '레전더리' };
const RARITY_COLOR = { common: 'var(--t4)', rare: '#7B9EC4', legendary: '#E8B048' };

// ── 구매 확인 모달 ─────────────────────────────────────────────
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
            padding: '8px 16px',
            background: 'var(--goldf)',
            borderRadius: 20,
            border: '1px solid var(--acc)',
          }}>
            <span style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--gold)' }}>
              {item.bp_cost} BP
            </span>
          </div>
        </div>

        <div style={{
          padding: '12px',
          background: 'var(--bg2)',
          borderRadius: 'var(--r1)',
          marginBottom: 16,
          textAlign: 'center',
          fontSize: 'var(--xs)',
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
            fontWeight: 700, fontSize: 'var(--sm)',
            fontFamily: 'var(--ff)',
            cursor: canAfford ? 'pointer' : 'not-allowed',
            marginBottom: 8,
          }}
        >
          {buying ? '구매 중...' : canAfford ? `✦ 구매하기 (${item.bp_cost} BP)` : 'BP 부족'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px',
            background: 'none', border: 'none',
            color: 'var(--t4)', fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ── 아이템 카드 ────────────────────────────────────────────────
function ItemCard({ item, owned, onBuy }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${owned ? 'var(--acc)' : 'var(--line)'}`,
      borderRadius: 'var(--r2, 16px)',
      padding: '18px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      position: 'relative',
    }}>
      {/* 레어도 뱃지 */}
      {item.rarity !== 'common' && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: '10px', fontWeight: 700,
          color: RARITY_COLOR[item.rarity],
          letterSpacing: '.04em',
        }}>
          {RARITY_LABEL[item.rarity]}
        </div>
      )}

      {/* 이모지 */}
      <div style={{ fontSize: 32, lineHeight: 1 }}>{item.emoji}</div>

      {/* 이름 */}
      <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>
        {item.name}
      </div>

      {/* 설명 */}
      <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.5 }}>
        {item.description}
      </div>

      {/* 가격 & 버튼 */}
      {owned ? (
        <button
          onClick={() => item.category === 'talisman' ? onBuy(item) : undefined}
          style={{
            marginTop: 4, padding: '9px',
            textAlign: 'center', fontSize: 'var(--xs)',
            width: '100%',
            color: item.category === 'talisman' ? 'var(--gold)' : 'var(--t4)',
            fontWeight: item.category === 'talisman' ? 700 : 400,
            cursor: item.category === 'talisman' ? 'pointer' : 'default',
            border: item.category === 'talisman' ? '1px solid var(--acc)' : '1px solid transparent',
            borderRadius: 'var(--r1)',
            background: item.category === 'talisman'
              ? (item.is_equipped ? 'rgba(232,176,72,0.2)' : 'var(--goldf)')
              : 'transparent',
            fontFamily: 'var(--ff)',
            boxShadow: item.is_equipped ? '0 0 8px rgba(232,176,72,0.4)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {item.category === 'talisman'
            ? (item.is_equipped ? '✦ 장착 중 (해제)' : '장착하기')
            : '✦ 보유 중'}
        </button>
      ) : (
        <button
          onClick={() => onBuy(item)}
          style={{
            marginTop: 4, padding: '9px',
            background: 'var(--goldf)',
            border: '1.5px solid var(--acc)',
            borderRadius: 'var(--r1)',
            color: 'var(--gold)', fontWeight: 700,
            fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {item.bp_cost} BP
        </button>
      )}
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────
export default function ShopPage({ showToast }) {
  const user    = useAppStore((s) => s.user);
  const setStep = useAppStore((s) => s.setStep);
  const [category, setCategory] = useState('전체');
  const [items, setItems] = useState([]);
  const [ownedIds, setOwnedIds] = useState(new Set());
  const [currentBP, setCurrentBP] = useState(0);
  const [confirmItem, setConfirmItem] = useState(null);
  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [equippedId, setEquippedId] = useState(null);

  const kakaoId = user?.kakaoId || user?.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // shop_items는 공개 테이블이므로 인증 없이도 가능하지만 일관성을 위해 client 사용
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
      setItems(allItems);
      setCurrentBP(bpRes.data?.current_bp ?? 0);
      setOwnedIds(new Set((invRes.data || []).map(r => r.item_id)));

      // 장착 중인 부적 감지 — category 기준으로 찾기
      const talismanItemIds = new Set(allItems.filter(i => i.category === 'talisman').map(i => i.id));
      const equippedInv = (invRes.data || []).find(r => r.is_equipped && talismanItemIds.has(r.item_id));
      const equippedItemId = equippedInv?.item_id || null;
      setEquippedId(equippedItemId);
      // Zustand store에도 동기화 (LandingPage·useConsultation에서 읽음)
      useAppStore.getState().setEquippedTalisman(
        equippedItemId ? (allItems.find(i => i.id === equippedItemId) || null) : null
      );
    } catch {
      showToast?.('숍 정보를 불러오지 못했어요', 'error');
    } finally {
      setLoading(false);
    }
  }, [kakaoId, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handlePurchase(item) {
    if (!kakaoId) { showToast?.('로그인 후 구매할 수 있어요', 'info'); return; }
    setBuying(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok, newBP } = await spendBP(client, kakaoId, item.bp_cost, 'SHOP_PURCHASE', item.name);
      if (!ok) {
        showToast?.('BP가 부족해요', 'error');
        setBuying(false);
        return;
      }

      await client.from('user_shop_inventory').insert({
        kakao_id: String(kakaoId),
        item_id: item.id,
        is_equipped: false,
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

  // 가이드용 랜덤 행운 부적 목록
  const GACHA_CHARMS = [
    { id: 'talisman_1', category: 'talisman', name: '재입고 금두꺼비', emoji: '🐸', description: '오늘의 재물운 폭발 부적', bp_cost: 15, rarity: 'rare' },
    { id: 'talisman_2', category: 'talisman', name: '은하수 타로카드', emoji: '🌌', description: '생각지도 못한 인연을 끌어당깁니다', bp_cost: 15, rarity: 'legendary' },
    { id: 'talisman_3', category: 'talisman', name: '만사형통 부적', emoji: '🧧', description: '모든 일이 막힘 없이 스르륵 풀려요', bp_cost: 15, rarity: 'common' },
  ];

  async function handleGacha() {
    if (!kakaoId) { showToast?.('로그인 후 이용 가능해요', 'info'); return; }
    setBuying(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok, newBP } = await spendBP(client, kakaoId, 15, `GACHA_PULL_${Date.now()}`, '행운 부적 가챠');
      if (!ok) {
        showToast?.('BP가 부족해요', 'error');
        setBuying(false);
        return;
      }
      
      const wonItem = GACHA_CHARMS[Math.floor(Math.random() * GACHA_CHARMS.length)];

      await client.from('user_shop_inventory').insert({
        kakao_id: String(kakaoId),
        item_id: wonItem.id, // Supabase에 없어도 외래키가 없으면 저장 가설
        is_equipped: false,
      });

      setCurrentBP(newBP ?? currentBP - 15);
      setOwnedIds(prev => new Set([...prev, wonItem.id]));
      showToast?.(`🎉 [${wonItem.name}] 부적 획득 성공! ✦`, 'success');
    } catch {
      showToast?.('뽑기에 실패했어요. 다시 시도해봐요.', 'error');
    } finally {
      setBuying(false);
    }
  }

  async function handleEquipTalisman(item) {
    if (!kakaoId || item.category !== 'talisman') return;
    try {
      const client = getAuthenticatedClient(kakaoId);
      // 부적 장착/해제 토글
      const isEquipping = equippedId !== item.id;
      
      // 부적 아이템 ID 목록 (items state 기준)
      const talismanItemIds = items.filter(i => i.category === 'talisman').map(i => i.id);

      if (isEquipping) {
        // 기존 장착된 다른 부적 해제 (category 기반 ID 목록 사용)
        const othersToUnequip = talismanItemIds.filter(id => id !== item.id);
        if (othersToUnequip.length > 0) {
          await client
            .from('user_shop_inventory')
            .update({ is_equipped: false })
            .eq('kakao_id', String(kakaoId))
            .in('item_id', othersToUnequip);
        }
        // 새로 장착
        await client
          .from('user_shop_inventory')
          .update({ is_equipped: true })
          .eq('kakao_id', String(kakaoId))
          .eq('item_id', item.id);

        setEquippedId(item.id);
        useAppStore.getState().setEquippedTalisman(item);
        showToast?.(`${item.name} 장착 완료! 메인 화면에서 확인해보세요 ✦`, 'success');
      } else {
        // 장착 해제
        await client
          .from('user_shop_inventory')
          .update({ is_equipped: false })
          .eq('kakao_id', String(kakaoId))
          .eq('item_id', item.id);

        setEquippedId(null);
        useAppStore.getState().setEquippedTalisman(null);
        showToast?.(`${item.name} 장착을 해제했어요.`, 'success');
      }
    } catch {
      showToast?.('부적 장착 상태 변경에 실패했어요.', 'error');
    }
  }

  const filtered = category === '전체'
    ? items.filter(i => i.category !== 'talisman')
    : category === '보관함'
      ? Array.from(ownedIds)
          .map(id => items.find(i => i.id === id) || GACHA_CHARMS.find(c => c.id === id))
          .filter(Boolean)
      : category === '부적'
        ? [] // 부적 탭은 뽑기 UI만
        : items.filter(i => i.category === CAT_MAP[category]);

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em' }}>
            ✦ 별숨 숍
          </div>
          {/* 보유 BP */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            background: 'var(--goldf)',
            borderRadius: 20,
            border: '1px solid var(--acc)',
          }}>
            <span style={{ fontSize: '14px' }}>⭐</span>
            <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)' }}>
              {currentBP} BP
            </span>
          </div>
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.3 }}>
          BP로 나만의<br />별숨을 꾸며봐요
        </div>
        <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
          미션 완료, 일기 작성, 앱 설치로 BP를 모아 아이템을 구매해요
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        padding: '0 20px 16px',
        scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              flexShrink: 0, padding: '7px 14px',
              borderRadius: 20,
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

      {/* 아이템 그리드 */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)' }}>
            <div style={{
              width: 28, height: 28,
              border: '2px solid var(--line)',
              borderTopColor: 'var(--gold)',
              borderRadius: '50%',
              animation: 'orbSpin 0.8s linear infinite',
              margin: '0 auto 10px',
            }} />
            불러오는 중...
          </div>
        ) : category === '부적' ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--gold)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧧</div>
            <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>행운 부적 랜덤 뽑기</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', marginBottom: 20 }}>15 BP로 하루의 기운을 밝히는 한정판 부적을 수집해보세요!</div>
            <button
              onClick={handleGacha}
              disabled={buying || currentBP < 15}
              style={{ padding: '14px 28px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer' }}
            >
              {buying ? '뽑는 중...' : '✦ 부적 뽑기 (15 BP)'}
            </button>
          </div>
        ) : category === '보관함' && filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t4)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗃️</div>
            <div style={{ fontSize: 'var(--sm)' }}>아직 수집한 아이템이 없어요</div>
          </div>
        ) : filtered.length === 0 && category !== '보관함' ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t4)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>
            <div style={{ fontSize: 'var(--sm)' }}>준비 중인 아이템이에요</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}>
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={{ ...item, is_equipped: equippedId === item.id }}
                owned={ownedIds.has(item.id)}
                onBuy={ownedIds.has(item.id) && item.category === 'talisman' ? () => handleEquipTalisman(item) : setConfirmItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* BP 획득 안내 */}
      <div style={{
        margin: '24px 20px 0',
        padding: '14px 16px',
        background: 'var(--bg2)',
        borderRadius: 'var(--r1)',
        fontSize: '11px',
        color: 'var(--t4)',
        lineHeight: 1.7,
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
    </div>
  );
}
