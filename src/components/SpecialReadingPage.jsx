/**
 * SpecialReadingPage — 특별 상담 (별숨 숍 special_reading 아이템 사용)
 * 구매한 아이템을 소비해 심층 프리미엄 AI 분석을 받습니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthToken } from '../hooks/useUserProfile.js';

const READING_TYPES = [
  {
    id: 'deep_saju',
    emoji: '🔮',
    title: '심층 사주 분석',
    desc: '타고난 사주 8자를 전체적으로 심층 분석해요. 인생 흐름, 강점과 약점, 앞으로의 방향을 짚어드려요.',
    flag: { isReport: true, responseStyle: 'F', precision_level: 'high' },
    prompt: '내 사주 전체를 심층 분석해줘요. 타고난 기질, 인생 흐름, 올해와 내년의 방향, 강점·약점, 조심해야 할 것들을 상세히 읽어주세요.',
  },
  {
    id: 'life_fortune',
    emoji: '🌟',
    title: '평생 대운 흐름',
    desc: '10년 단위 대운의 흐름을 AI가 풀어드려요. 언제 기회가 오고 언제 조심해야 하는지 알 수 있어요.',
    flag: { isDaeun: true, responseStyle: 'F', precision_level: 'high' },
    prompt: '내 평생 대운 흐름을 분석해줘요. 각 대운 시기의 특징, 기회, 주의사항을 상세하게 알려주세요.',
  },
  {
    id: 'comprehensive',
    emoji: '✨',
    title: '사주 × 별자리 종합 분석',
    desc: '동양 사주와 서양 별자리를 함께 읽어 더 깊은 자기 이해를 드려요.',
    flag: { isComprehensive: true, responseStyle: 'F', precision_level: 'high' },
    prompt: '내 사주와 별자리를 종합하여 깊이 있는 분석을 해줘요. 두 관점에서 공통적으로 나타나는 특징과 서로 보완하는 점을 중심으로요.',
  },
  {
    id: 'yearly',
    emoji: '📅',
    title: '올해 운세 심층 분석',
    desc: '올해 연도의 운세를 월별로 상세히 분석해드려요. 중요한 시점과 기회를 미리 파악하세요.',
    flag: { isWeekly: true, responseStyle: 'F', precision_level: 'high' },
    prompt: `올해(${new Date().getFullYear()}년) 운세를 심층 분석해줘요. 분기별 흐름, 중요 시점, 조심할 달, 기회가 오는 달을 상세히 알려주세요.`,
  },
];

export default function SpecialReadingPage({ callApi, showToast }) {
  const { user, form, buildCtx, setStep } = useAppStore();
  const [ownedItems, setOwnedItems] = useState(null); // null=로딩중
  const [selectedType, setSelectedType] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [usedItem, setUsedItem] = useState(null);

  const kakaoId = user?.kakaoId || user?.id;

  const loadInventory = useCallback(async () => {
    if (!kakaoId) { setOwnedItems([]); return; }
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { data } = await client
        .from('user_shop_inventory')
        .select('id, item_id, is_equipped, shop_items(name, description, emoji, category)')
        .eq('kakao_id', String(kakaoId))
        .eq('is_equipped', false);
      const specials = (data || []).filter(r => r.shop_items?.category === 'special_reading');
      setOwnedItems(specials);
    } catch {
      setOwnedItems([]);
    }
  }, [kakaoId]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  const handleUseItem = useCallback(async (inventoryId, readingType) => {
    if (!kakaoId || loading) return;
    if (!form?.by) {
      showToast?.('생년월일을 입력해야 이용할 수 있어요', 'info');
      setStep(1);
      return;
    }
    setLoading(true);
    setResult('');
    setUsedItem(inventoryId);
    setSelectedType(readingType);

    try {
      // 아이템 사용 처리 (is_equipped = true로 표시)
      const client = getAuthenticatedClient(kakaoId);
      await client
        .from('user_shop_inventory')
        .update({ is_equipped: true, equipped_at: new Date().toISOString() })
        .eq('id', inventoryId)
        .eq('kakao_id', String(kakaoId));

      // AI 특별 상담 호출
      const ctx = buildCtx ? buildCtx() : '';
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userMessage: readingType.prompt,
          context: ctx,
          kakaoId,
          clientHour: new Date().getHours(),
          ...readingType.flag,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.text || '');
      await loadInventory();
    } catch {
      showToast?.('특별 상담 중 오류가 발생했어요. 아이템은 소진되지 않았어요.', 'error');
      // 아이템 사용 취소
      try {
        const client = getAuthenticatedClient(kakaoId);
        await client
          .from('user_shop_inventory')
          .update({ is_equipped: false, equipped_at: null })
          .eq('id', usedItem)
          .eq('kakao_id', String(kakaoId));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [kakaoId, loading, form, buildCtx, showToast, setStep, loadInventory, usedItem]);

  const hasItems = ownedItems && ownedItems.length > 0;

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
          ✦ 특별 상담
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.3 }}>
          별숨 심층 분석
        </div>
        <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
          별숨 숍에서 구매한 특별 상담권으로<br />더 깊이 있는 AI 분석을 받아보세요.
        </div>
      </div>

      {/* 결과 표시 */}
      {result && (
        <div style={{ margin: '0 20px 20px' }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--acc)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>{selectedType?.emoji}</span>
              <div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700 }}>{selectedType?.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--t4)', marginTop: 2 }}>별숨 특별 상담 결과</div>
              </div>
            </div>
            <div style={{ padding: '14px 16px', fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
              {result}
            </div>
            <div style={{ padding: '0 16px 14px' }}>
              <button
                onClick={() => { setResult(''); setSelectedType(null); }}
                className="res-btn"
                style={{ width: '100%' }}
              >
                다른 특별 상담 받기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div style={{ margin: '20px', padding: '24px', background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--acc)', textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', fontWeight: 600 }}>{selectedType?.title} 분석 중</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 4 }}>별숨이 깊이 읽고 있어요...</div>
        </div>
      )}

      {/* 아이템 미보유 */}
      {!loading && !result && ownedItems !== null && !hasItems && (
        <div style={{ margin: '0 20px', padding: '28px 20px', background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔮</div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
            특별 상담권이 없어요
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.7, marginBottom: 20 }}>
            별숨 숍에서 특별 상담권을 구매하면<br />
            심층 사주·별자리 분석을 받을 수 있어요.
          </div>
          <button
            onClick={() => setStep(31)}
            style={{
              padding: '12px 24px',
              background: 'var(--goldf)',
              border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)',
              color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--sm)',
              fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            ✦ 별숨 숍 가기
          </button>
        </div>
      )}

      {/* 보유 아이템 + 상담 유형 선택 */}
      {!loading && !result && hasItems && (
        <div style={{ padding: '0 20px' }}>
          {/* 보유 상담권 */}
          <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--goldf)', borderRadius: 'var(--r1)', border: '1px solid var(--acc)' }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>보유 특별 상담권</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ownedItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg1)', borderRadius: 20, border: '1px solid var(--acc)' }}>
                  <span style={{ fontSize: 16 }}>{item.shop_items?.emoji || '🔮'}</span>
                  <span style={{ fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 600 }}>{item.shop_items?.name || '특별 상담권'}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: '11px', color: 'var(--gold)' }}>상담 유형을 선택하면 상담권 1개가 소비돼요.</div>
          </div>

          {/* 상담 유형 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {READING_TYPES.map(type => (
              <div key={type.id} style={{
                background: 'var(--bg2)',
                borderRadius: 'var(--r2)',
                border: '1px solid var(--line)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{type.emoji}</span>
                    <div>
                      <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>{type.title}</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6 }}>{type.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUseItem(ownedItems[0].id, type)}
                    style={{
                      width: '100%', padding: '11px',
                      background: 'var(--goldf)',
                      border: '1.5px solid var(--acc)',
                      borderRadius: 'var(--r1)',
                      color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)',
                      fontFamily: 'var(--ff)', cursor: 'pointer',
                    }}
                  >
                    ✦ 이 분석 받기 (상담권 1개 소비)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 로딩 스피너 (인벤토리 로드 중) */}
      {ownedItems === null && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)' }}>
          <div style={{ width: 28, height: 28, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', margin: '0 auto 10px' }} />
          불러오는 중...
        </div>
      )}
    </div>
  );
}
