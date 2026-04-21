/**
 * ItemInventoryPage — 내 아이템 (step 38)
 * 보유 아이템 확인 + 부적 장착/해제 + 합성 + 아이템 사용
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import { GACHA_POOL, GRADE_CONFIG, synthesize, getGachaItem, GRADE_ORDER } from '../utils/gachaItems.js';

const CAT_LABEL = {
  theme: '테마', avatar: '아바타', special_reading: '특별 상담',
  talisman: '부적', effect: '이펙트',
  fragment: '조각', rare: '희귀', legendary: '전설',
};

// ─── 아이템 사용 모달 ──────────────────────────────────────────
function UseItemModal({ item, callApi, onClose, showToast }) {
  const [loading, setLoading] = useState(false);
  const [effect, setEffect] = useState('');

  async function handleUse() {
    if (!callApi || loading) return;
    setLoading(true);
    try {
      const prompt = `[시스템 지시: 친근한 채팅 스타일로 2~4문장 이내 짧게 답변해요. 격식 없이 편하게.]\n[아이템 사용 효과 안내]\n아이템명: ${item.name} ${item.emoji}\n등급: ${GRADE_CONFIG[item.grade]?.label || item.grade}\n설명: ${item.description || ''}\n효과: ${item.effect || ''}\n\n이 아이템을 오늘 사용했을 때 어떤 기운이 활성화되는지 사용자에게 친근하게 2~3문장으로 설명해주세요. 오늘 하루에 어떤 변화가 생길지 구체적으로 말해주세요.`;
      const res = await callApi(prompt, { isChat: true });
      setEffect(res);
    } catch {
      setEffect('별이 잠시 쉬고 있어요 🌙');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { handleUse(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cfg = GRADE_CONFIG[item.grade] || GRADE_CONFIG.fragment;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--bg1)',
        borderRadius: 'var(--r2, 16px)',
        border: `1px solid ${cfg.border}`,
        padding: '28px 24px',
        animation: 'fadeUp .3s ease',
        boxShadow: item.grade === 'legendary'
          ? '0 0 30px rgba(232,176,72,.25)'
          : item.grade === 'rare'
          ? '0 0 20px rgba(123,158,196,.2)'
          : 'none',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 52, marginBottom: 10,
            animation: 'gacha-bounce .6s ease both',
          }}>
            {item.emoji}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, letterSpacing: '.05em', marginBottom: 4 }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>
            {item.name}
          </div>
          <div style={{
            display: 'inline-flex', padding: '5px 12px', borderRadius: 20,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            fontSize: '11px', color: cfg.color, fontWeight: 600,
          }}>
            {item.effect}
          </div>
        </div>

        <div style={{
          background: 'var(--bg2)', borderRadius: 'var(--r1)',
          padding: '14px', marginBottom: 16, minHeight: 72,
          border: '1px solid var(--line)',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t4)', fontSize: 'var(--xs)' }}>
              <span style={{ width: 14, height: 14, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
              별숨이 아이템 기운을 해석하는 중...
            </div>
          ) : (
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', lineHeight: 1.7 }}>
              {effect}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '11px',
            background: 'var(--goldf)', border: '1.5px solid var(--acc)',
            borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
            fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          ✦ 확인했어요
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ─── 합성 모달 ─────────────────────────────────────────────────
function SynthesisModal({ inventory, kakaoId, onClose, onComplete, showToast }) {
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [result, setResult] = useState(null);

  // 합성 가능 옵션 (next가 있는 등급만)
  const options = GRADE_ORDER
    .filter(grade => GRADE_CONFIG[grade].next !== null)
    .map(grade => {
      const cfg     = GRADE_CONFIG[grade];
      const nextCfg = GRADE_CONFIG[cfg.next];
      const count   = inventory.filter(i => i.grade === grade).length;
      return { grade, label: cfg.label, count, cost: cfg.synthCost, yields: nextCfg.label, color: cfg.color };
    })
    .filter(o => o.count >= o.cost);

  async function handleSynthesize() {
    if (!selectedGrade || synthesizing) return;
    setSynthesizing(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      // 소비할 아이템 3개 찾기
      const toConsume = inventory
        .filter(i => i.grade === selectedGrade)
        .slice(0, 3);

      // DB에서 해당 inventory 행들 삭제
      for (const item of toConsume) {
        await client.from('user_shop_inventory')
          .delete()
          .eq('kakao_id', String(kakaoId))
          .eq('item_id', item.id)
          .limit(1);
      }

      // 새 아이템 획득
      const newItem = synthesize(selectedGrade);
      await client.from('user_shop_inventory').insert({
        kakao_id: String(kakaoId),
        item_id: newItem.id,
        is_equipped: false,
        acquired_at: new Date().toISOString(),
      });

      setResult(newItem);
    } catch {
      showToast?.('합성 중 오류가 발생했어요', 'error');
      setSynthesizing(false);
    }
  }

  if (result) {
    const cfg = GRADE_CONFIG[result.grade];
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}>
        <div style={{
          width: '100%', maxWidth: 340, textAlign: 'center',
          background: 'var(--bg1)', borderRadius: 'var(--r2)',
          border: `1px solid ${cfg.border}`, padding: '32px 24px',
          boxShadow: result.grade === 'legendary' ? '0 0 40px rgba(232,176,72,.3)' : 'none',
          animation: 'fadeUp .35s ease',
        }}>
          <div style={{ fontSize: 64, marginBottom: 12, animation: 'gacha-bounce .6s ease both' }}>
            {result.emoji}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: cfg.color, marginBottom: 6, letterSpacing: '.05em' }}>
            합성 성공! {cfg.label} 아이템 획득
          </div>
          <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>
            {result.name}
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 20, lineHeight: 1.6 }}>
            {result.description}
          </div>
          <button
            onClick={() => { onComplete(); onClose(); }}
            style={{
              width: '100%', padding: '12px',
              background: 'var(--goldf)', border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
              fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            ✦ 확인
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--bg1)', borderRadius: 'var(--r2)',
        border: '1px solid var(--line)', padding: '24px',
        animation: 'fadeUp .3s ease',
      }}>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>
          ✦ 아이템 합성
        </div>

        {options.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
            합성 가능한 아이템이 없어요<br />
            <span style={{ fontSize: '11px' }}>(같은 등급 3개 이상 필요)</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {options.map(opt => (
              <button
                key={opt.grade}
                onClick={() => setSelectedGrade(opt.grade === selectedGrade ? null : opt.grade)}
                style={{
                  padding: '12px 14px', borderRadius: 'var(--r1)',
                  border: `1.5px solid ${selectedGrade === opt.grade ? opt.color : 'var(--line)'}`,
                  background: selectedGrade === opt.grade ? `${opt.color}18` : 'var(--bg2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', fontFamily: 'var(--ff)',
                  transition: 'all .15s',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: opt.color }}>
                    {opt.label} 3개 → {opt.yields} 1개
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 2 }}>
                    보유 {opt.count}개 (합성 후 {opt.count - 3}개 남음)
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${selectedGrade === opt.grade ? opt.color : 'var(--line)'}`,
                  background: selectedGrade === opt.grade ? opt.color : 'none',
                  flexShrink: 0,
                }} />
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px',
              background: 'none', border: '1px solid var(--line)',
              borderRadius: 'var(--r1)', color: 'var(--t3)',
              fontFamily: 'var(--ff)', cursor: 'pointer', fontSize: 'var(--xs)',
            }}
          >취소</button>
          <button
            onClick={handleSynthesize}
            disabled={!selectedGrade || synthesizing}
            style={{
              flex: 2, padding: '11px',
              background: selectedGrade ? 'var(--goldf)' : 'var(--bg3)',
              border: `1.5px solid ${selectedGrade ? 'var(--acc)' : 'var(--line)'}`,
              borderRadius: 'var(--r1)',
              color: selectedGrade ? 'var(--gold)' : 'var(--t4)',
              fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
              cursor: selectedGrade ? 'pointer' : 'not-allowed',
            }}
          >
            {synthesizing ? '합성 중...' : '✦ 합성하기'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── 아이템 카드 ────────────────────────────────────────────────
function OwnedItemCard({ item, onToggleEquip, toggling, onUse }) {
  const isTalisman = item.category === 'talisman';
  const isGachaItem = !!item.grade; // grade 있으면 가챠 아이템
  const cfg = item.grade ? GRADE_CONFIG[item.grade] : null;

  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${item.is_equipped ? 'var(--acc)' : (cfg?.border || 'var(--line)')}`,
      borderRadius: 'var(--r2, 16px)',
      padding: '14px 12px',
      display: 'flex', flexDirection: 'column', gap: 7,
      position: 'relative',
      boxShadow: item.is_equipped
        ? '0 0 10px rgba(232,176,72,.2)'
        : item.grade === 'nebula'
        ? '0 0 10px rgba(232,176,72,.18)'
        : item.grade === 'galaxy'
        ? '0 0 8px rgba(180,142,240,.18)'
        : item.grade === 'planet'
        ? '0 0 6px rgba(126,200,164,.14)'
        : 'none',
      transition: 'all 0.2s ease',
    }}>
      {/* 등급 뱃지 */}
      {cfg && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: '10px', fontWeight: 700, color: cfg.color,
          letterSpacing: '.04em',
        }}>
          {cfg.label}
        </div>
      )}

      {/* 장착 중 표시 */}
      {item.is_equipped && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          fontSize: '10px', fontWeight: 700, color: 'var(--gold)',
          background: 'var(--goldf)', padding: '2px 6px',
          borderRadius: 20, border: '1px solid var(--acc)',
        }}>
          장착 중
        </div>
      )}

      {/* 이모지 */}
      <div style={{
        fontSize: 30, lineHeight: 1,
        marginTop: (item.is_equipped || cfg) ? 16 : 0,
      }}>
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

      {/* 효과 태그 */}
      {item.effect && (
        <div style={{
          fontSize: '10px', padding: '3px 8px', borderRadius: 20,
          background: cfg?.bg || 'var(--bg3)',
          border: `1px solid ${cfg?.border || 'var(--line)'}`,
          color: cfg?.color || 'var(--t3)',
          fontWeight: 600, display: 'inline-block', width: 'fit-content',
        }}>
          {item.effect}
        </div>
      )}

      {/* 설명 */}
      {!item.effect && (
        <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.5 }}>
          {item.description}
        </div>
      )}

      {/* 액션 버튼 */}
      {isTalisman && (
        <button
          onClick={() => onToggleEquip(item)}
          disabled={toggling}
          style={{
            marginTop: 'auto', padding: '8px',
            background: item.is_equipped ? 'rgba(232,176,72,.15)' : 'var(--goldf)',
            border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)',
            color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)', cursor: toggling ? 'not-allowed' : 'pointer',
            opacity: toggling ? 0.6 : 1, width: '100%', transition: 'all .2s ease',
          }}
        >
          {toggling ? '처리 중...' : item.is_equipped ? '✦ 장착 해제' : '장착하기'}
        </button>
      )}

      {isGachaItem && !isTalisman && (
        <button
          onClick={() => onUse(item)}
          style={{
            marginTop: 'auto', padding: '8px',
            background: cfg?.bg || 'var(--bg3)',
            border: `1px solid ${cfg?.border || 'var(--line)'}`,
            borderRadius: 'var(--r1)',
            color: cfg?.color || 'var(--t3)', fontWeight: 700,
            fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
            cursor: 'pointer', width: '100%', transition: 'all .15s',
          }}
        >
          ✦ 사용하기
        </button>
      )}

      {!isGachaItem && !isTalisman && (
        <div style={{
          marginTop: 'auto', padding: '7px', textAlign: 'center',
          fontSize: 'var(--xs)', color: 'var(--t4)',
          borderTop: '1px solid var(--line)',
        }}>
          ✦ 보유 중
        </div>
      )}
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────────
export default function ItemInventoryPage({ showToast, callApi }) {
  const { user, setStep } = useAppStore();
  const kakaoId = user?.kakaoId || user?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('전체');
  const [toggling, setToggling] = useState(null);
  const [useItem, setUseItem] = useState(null);
  const [showSynth, setShowSynth] = useState(false);

  const CATEGORIES = ['전체', '위성', '행성', '은하', '성운', '부적', '기타'];

  const loadInventory = useCallback(async () => {
    if (!kakaoId) return;
    setLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { data: inv } = await client
        .from('user_shop_inventory')
        .select('item_id, is_equipped, acquired_at, shop_items(*)')
        .eq('kakao_id', String(kakaoId))
        .order('acquired_at', { ascending: false });

      const merged = (inv || []).map(r => {
        // shop_items에 있는 아이템
        if (r.shop_items) {
          return { ...r.shop_items, is_equipped: r.is_equipped, _invItemId: r.item_id };
        }
        // 가챠 아이템 (shop_items에 없을 수 있음)
        const gachaItem = getGachaItem(r.item_id);
        if (gachaItem) {
          return { ...gachaItem, id: r.item_id, is_equipped: r.is_equipped, _invItemId: r.item_id };
        }
        return null;
      }).filter(Boolean);

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
        await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId));
        await client.from('user_shop_inventory').update({ is_equipped: true }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
        useAppStore.getState().setEquippedTalisman(item);
        showToast?.(`${item.name} 장착됐어요 ✦`, 'success');
      } else {
        await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
        useAppStore.getState().setEquippedTalisman(null);
        showToast?.('부적 장착을 해제했어요', 'info');
      }
      setItems(prev => prev.map(i => ({
        ...i,
        is_equipped: i.category === 'talisman' ? (i.id === item.id ? newEquipped : false) : i.is_equipped,
      })));
    } catch {
      showToast?.('처리 중 오류가 발생했어요', 'error');
    } finally {
      setToggling(null);
    }
  }

  const gachaItems = items.filter(i => GACHA_POOL.some(g => g.id === i._invItemId || g.id === i.id));
  const shopItems  = items.filter(i => !GACHA_POOL.some(g => g.id === i._invItemId || g.id === i.id));

  const filtered = (() => {
    if (category === '전체') return items;
    if (category === '위성')  return items.filter(i => i.grade === 'satellite');
    if (category === '행성')  return items.filter(i => i.grade === 'planet');
    if (category === '은하')  return items.filter(i => i.grade === 'galaxy');
    if (category === '성운')  return items.filter(i => i.grade === 'nebula');
    if (category === '부적')  return items.filter(i => i.category === 'talisman');
    return shopItems; // 기타
  })();

  const equippedTalisman = items.find(i => i.category === 'talisman' && i.is_equipped);

  // 합성 가능 여부 — synthable grades
  const gradeCountMap = {};
  for (const g of GRADE_ORDER) {
    gradeCountMap[g] = gachaItems.filter(i => i.grade === g).length;
  }
  const synthableGrades = GRADE_ORDER.filter(g => {
    const cfg = GRADE_CONFIG[g];
    return cfg.next && gradeCountMap[g] >= cfg.synthCost;
  });
  const canSynth = synthableGrades.length > 0;

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '22px 20px 14px' }}>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>
          🎁 내 아이템
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
          보유 {items.length}개
          {equippedTalisman && (
            <span style={{ marginLeft: 8, color: 'var(--gold)', fontWeight: 600 }}>
              · {equippedTalisman.emoji} {equippedTalisman.name} 장착 중
            </span>
          )}
        </div>

        {/* 합성 버튼 */}
        {canSynth && (
          <button
            onClick={() => setShowSynth(true)}
            style={{
              marginTop: 10, padding: '8px 16px',
              background: 'var(--goldf)', border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
              fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              animation: 'gacha-count-pop .4s ease',
            }}
          >
            ⚗️ 합성 가능! ({synthableGrades.map(g => `${GRADE_CONFIG[g].label} ${gradeCountMap[g]}개`).join(' · ')})
          </button>
        )}
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
              flexShrink: 0, padding: '6px 12px', borderRadius: 20,
              border: `1px solid ${category === cat ? 'var(--acc)' : 'var(--line)'}`,
              background: category === cat ? 'var(--goldf)' : 'var(--bg2)',
              color: category === cat ? 'var(--gold)' : 'var(--t3)',
              fontWeight: category === cat ? 700 : 400,
              fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            {cat}
            {cat === '위성' && gradeCountMap.satellite > 0 && (
              <span style={{ marginLeft: 4, fontSize: '10px', color: GRADE_CONFIG.satellite.color }}>{gradeCountMap.satellite}</span>
            )}
            {cat === '행성' && gradeCountMap.planet > 0 && (
              <span style={{ marginLeft: 4, fontSize: '10px', color: GRADE_CONFIG.planet.color }}>{gradeCountMap.planet}</span>
            )}
            {cat === '은하' && gradeCountMap.galaxy > 0 && (
              <span style={{ marginLeft: 4, fontSize: '10px', color: GRADE_CONFIG.galaxy.color }}>{gradeCountMap.galaxy}</span>
            )}
            {cat === '성운' && gradeCountMap.nebula > 0 && (
              <span style={{ marginLeft: 4, fontSize: '10px', color: GRADE_CONFIG.nebula.color }}>{gradeCountMap.nebula}</span>
            )}
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
            textAlign: 'center', padding: '40px 20px',
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
              뽑기에서 아이템을 모아봐요!
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => setStep(40)}
                style={{
                  padding: '9px 18px', background: 'var(--goldf)',
                  border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)',
                  color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)',
                  fontFamily: 'var(--ff)', cursor: 'pointer',
                }}
              >
                별숨 뽑기 →
              </button>
              <button
                onClick={() => setStep(31)}
                style={{
                  padding: '9px 18px', background: 'var(--bg3)',
                  border: '1px solid var(--line)', borderRadius: 'var(--r1)',
                  color: 'var(--t3)', fontSize: 'var(--xs)',
                  fontFamily: 'var(--ff)', cursor: 'pointer',
                }}
              >
                별숨샵 →
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
          }}>
            {filtered.map((item, idx) => (
              <OwnedItemCard
                key={`${item.id}-${idx}`}
                item={item}
                onToggleEquip={handleToggleEquip}
                toggling={toggling === item.id}
                onUse={setUseItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* 아이템 사용 모달 */}
      {useItem && (
        <UseItemModal
          item={useItem}
          callApi={callApi}
          onClose={() => setUseItem(null)}
          showToast={showToast}
        />
      )}

      {/* 합성 모달 */}
      {showSynth && (
        <SynthesisModal
          inventory={gachaItems}
          kakaoId={kakaoId}
          onClose={() => setShowSynth(false)}
          onComplete={loadInventory}
          showToast={showToast}
        />
      )}
    </div>
  );
}
