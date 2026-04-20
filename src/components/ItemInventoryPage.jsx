/**
 * ItemInventoryPage — 내 아이템 (step 38)
 * 구매한 아이템 목록 확인 및 부적 장착/해제
 */

import { useState, useEffect, useCallback } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';

const CAT_LABEL = {
  theme: '테마',
  avatar: '아바타',
  special_reading: '특별 상담',
  talisman: '부적',
  effect: '이펙트',
};

const RARITY_LABEL = { common: '일반', rare: '레어', legendary: '레전더리' };
const RARITY_COLOR = { common: 'var(--t4)', rare: '#7B9EC4', legendary: '#E8B048' };

const CATEGORIES = ['전체', '테마', '아바타', '부적', '특별 상담', '이펙트'];
const CAT_FILTER = {
  '테마': 'theme',
  '아바타': 'avatar',
  '부적': 'talisman',
  '특별 상담': 'special_reading',
  '이펙트': 'effect',
};

function OwnedItemCard({ item, onToggleEquip, toggling }) {
  const isTalisman = item.category === 'talisman';

  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${item.is_equipped ? 'var(--acc)' : 'var(--line)'}`,
      borderRadius: 'var(--r2, 16px)',
      padding: '16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      position: 'relative',
      boxShadow: item.is_equipped ? '0 0 10px rgba(232,176,72,0.2)' : 'none',
      transition: 'all 0.2s ease',
    }}>
      {/* 레어도 뱃지 */}
      {item.rarity && item.rarity !== 'common' && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: '10px', fontWeight: 700,
          color: RARITY_COLOR[item.rarity],
          letterSpacing: '.04em',
        }}>
          {RARITY_LABEL[item.rarity]}
        </div>
      )}

      {/* 장착 중 표시 */}
      {item.is_equipped && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          fontSize: '10px', fontWeight: 700,
          color: 'var(--gold)',
          background: 'var(--goldf)',
          padding: '2px 6px',
          borderRadius: 20,
          border: '1px solid var(--acc)',
        }}>
          장착 중
        </div>
      )}

      {/* 이모지 */}
      <div style={{ fontSize: 32, lineHeight: 1, marginTop: item.is_equipped ? 18 : 0 }}>
        {item.emoji}
      </div>

      {/* 카테고리 */}
      <div style={{ fontSize: '10px', color: 'var(--t4)', letterSpacing: '.04em' }}>
        {CAT_LABEL[item.category] ?? item.category}
      </div>

      {/* 이름 */}
      <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3 }}>
        {item.name}
      </div>

      {/* 설명 */}
      <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.5 }}>
        {item.description}
      </div>

      {/* 액션 버튼 */}
      {isTalisman && (
        <button
          onClick={() => onToggleEquip(item)}
          disabled={toggling}
          style={{
            marginTop: 4, padding: '9px',
            background: item.is_equipped ? 'rgba(232,176,72,0.15)' : 'var(--goldf)',
            border: `1.5px solid ${item.is_equipped ? 'var(--acc)' : 'var(--acc)'}`,
            borderRadius: 'var(--r1)',
            color: 'var(--gold)', fontWeight: 700,
            fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
            cursor: toggling ? 'not-allowed' : 'pointer',
            opacity: toggling ? 0.6 : 1,
            width: '100%',
            transition: 'all 0.2s ease',
          }}
        >
          {toggling ? '처리 중...' : item.is_equipped ? '✦ 장착 해제' : '장착하기'}
        </button>
      )}
      {!isTalisman && (
        <div style={{
          marginTop: 4, padding: '8px',
          textAlign: 'center', fontSize: 'var(--xs)',
          color: 'var(--t4)', borderTop: '1px solid var(--line)',
        }}>
          ✦ 보유 중
        </div>
      )}
    </div>
  );
}

export default function ItemInventoryPage({ showToast }) {
  const { user, setStep } = useAppStore();
  const kakaoId = user?.kakaoId || user?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('전체');
  const [toggling, setToggling] = useState(null); // item_id being toggled

  const loadInventory = useCallback(async () => {
    if (!kakaoId) return;
    setLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      // 보유 아이템 + 아이템 정보 join
      const { data: inv } = await client
        .from('user_shop_inventory')
        .select('item_id, is_equipped, shop_items(*)')
        .eq('kakao_id', String(kakaoId));

      const merged = (inv || [])
        .filter(r => r.shop_items)
        .map(r => ({ ...r.shop_items, is_equipped: r.is_equipped }));

      setItems(merged);
    } catch {
      showToast?.('아이템 목록을 불러오지 못했어요', 'error');
    } finally {
      setLoading(false);
    }
  }, [kakaoId, showToast]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  async function handleToggleEquip(item) {
    if (!kakaoId || toggling) return;
    setToggling(item.id);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const newEquipped = !item.is_equipped;

      if (newEquipped) {
        // 기존 장착 해제 후 새 장착
        await client
          .from('user_shop_inventory')
          .update({ is_equipped: false })
          .eq('kakao_id', String(kakaoId));
        await client
          .from('user_shop_inventory')
          .update({ is_equipped: true })
          .eq('kakao_id', String(kakaoId))
          .eq('item_id', item.id);
        useAppStore.getState().setEquippedTalisman(item);
        showToast?.(`${item.name} 장착됐어요 ✦`, 'success');
      } else {
        await client
          .from('user_shop_inventory')
          .update({ is_equipped: false })
          .eq('kakao_id', String(kakaoId))
          .eq('item_id', item.id);
        useAppStore.getState().setEquippedTalisman(null);
        showToast?.('부적 장착을 해제했어요', 'info');
      }

      setItems(prev => prev.map(i => ({
        ...i,
        is_equipped: i.category === 'talisman'
          ? (i.id === item.id ? newEquipped : false)
          : i.is_equipped,
      })));
    } catch {
      showToast?.('처리 중 오류가 발생했어요', 'error');
    } finally {
      setToggling(null);
    }
  }

  const filtered = category === '전체'
    ? items
    : items.filter(i => i.category === CAT_FILTER[category]);

  const equippedTalisman = items.find(i => i.category === 'talisman' && i.is_equipped);

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>
          🎁 내 아이템
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
          보유한 아이템 {items.length}개
          {equippedTalisman && (
            <span style={{ marginLeft: 8, color: 'var(--gold)', fontWeight: 600 }}>
              · {equippedTalisman.emoji} {equippedTalisman.name} 장착 중
            </span>
          )}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 20px 14px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 20,
              border: `1px solid ${category === cat ? 'var(--acc)' : 'var(--line)'}`,
              background: category === cat ? 'var(--goldf)' : 'var(--bg2)',
              color: category === cat ? 'var(--gold)' : 'var(--t3)',
              fontWeight: category === cat ? 700 : 400,
              fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 아이템 그리드 */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--t4)', fontSize: 'var(--sm)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'var(--bg2)', borderRadius: 'var(--r1)',
            border: '1px solid var(--line)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>
              {category === '전체' ? '🎁' : '🔍'}
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', fontWeight: 600, marginBottom: 6 }}>
              {category === '전체' ? '보유한 아이템이 없어요' : `${category} 아이템이 없어요`}
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 20 }}>
              별숨샵에서 BP로 아이템을 구매해보세요
            </div>
            <button
              onClick={() => setStep(31)}
              style={{
                padding: '10px 24px',
                background: 'var(--goldf)',
                border: '1.5px solid var(--acc)',
                borderRadius: 'var(--r1)',
                color: 'var(--gold)', fontWeight: 700,
                fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
                cursor: 'pointer',
              }}
            >
              별숨샵 가기 →
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}>
            {filtered.map(item => (
              <OwnedItemCard
                key={item.id}
                item={item}
                onToggleEquip={handleToggleEquip}
                toggling={toggling === item.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
