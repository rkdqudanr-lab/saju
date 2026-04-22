/**
 * ItemInventoryPage — 내 아이템 (step 38)
 * 보유 아이템 확인 + 부적 장착/해제 + 합성 + 아이템 사용
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import {
  GACHA_POOL, GRADE_CONFIG, synthesize, getGachaItem, GRADE_ORDER,
  SAJU_POOL, SAJU_GRADE_CONFIG, synthesizeSaju, getSajuItem, SAJU_GRADE_ORDER,
  findItem, ALL_GACHA_POOL,
} from '../utils/gachaItems.js';
import GachaGraphic from './GachaGraphic.jsx';
import ItemCollectionPage from './ItemCollectionPage.jsx';

const FORTUNE_LABELS = {
  wealth: '재물운',
  love: '애정운',
  career: '직장운',
  study: '학업운',
  health: '건강운',
  social: '대인운',
  travel: '이동운',
  general: '기타 아이템',
};

const CAT_LABEL = {
  theme: '테마', avatar: '아바타', special_reading: '특별 상담',
  talisman: '부적', effect: '이펙트',
  // 우주
  satellite: '위성', planet: '행성', galaxy: '은하', nebula: '성운',
  // 사주
  ohaeng: '오행', cheongan: '천간', jiji: '지지', gapja: '육십갑자',
  // old (fallback)
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
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
        }}
      >
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

// ─── 합성 성공률 ─────────────────────────────────────────────────
// satellite→planet: 100%, planet→galaxy: 50%, galaxy→nebula: 10%
const SYNTH_RATES = { satellite: 1.0, planet: 0.5, galaxy: 0.1, ohaeng: 1.0, cheongan: 0.5, jiji: 0.1 };

// ─── 합성 모달 ─────────────────────────────────────────────────
function SynthesisModal({ inventory, kakaoId, onClose, onComplete, showToast, currentBp, onSpendBP }) {
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [activeSystem, setActiveSystem] = useState('space');
  const [synthesizing, setSynthesizing] = useState(false);
  const [outcome, setOutcome] = useState(null); // null | { success: boolean, item?: object }

  // 우주 + 사주 합성 가능 옵션 통합
  const spaceOptions = GRADE_ORDER
    .filter(grade => GRADE_CONFIG[grade].next !== null)
    .map(grade => {
      const cfg = GRADE_CONFIG[grade];
      const count = inventory.filter(i => i.grade === grade && !i.id?.startsWith('saju_')).length;
      const rate = SYNTH_RATES[grade] ?? 1.0;
      return { grade, system: 'space', label: `🌌 ${cfg.label}`, count, cost: cfg.synthCost, yields: GRADE_CONFIG[cfg.next].label, color: cfg.color, rate };
    })
    .filter(o => o.count >= o.cost);

  const sajuOptions = SAJU_GRADE_ORDER
    .filter(grade => SAJU_GRADE_CONFIG[grade].next !== null)
    .map(grade => {
      const cfg = SAJU_GRADE_CONFIG[grade];
      const count = inventory.filter(i => i.grade === grade && i.id?.startsWith('saju_')).length;
      const rate = SYNTH_RATES[grade] ?? 1.0;
      return { grade, system: 'saju', label: `☯️ ${cfg.label}`, count, cost: cfg.synthCost, yields: SAJU_GRADE_CONFIG[cfg.next].label, color: cfg.color, rate };
    })
    .filter(o => o.count >= o.cost);

  const options = activeSystem === 'saju' ? sajuOptions : spaceOptions;
  const selectedOpt = options.find(o => o.grade === selectedGrade);

  useEffect(() => {
    if (activeSystem === 'saju' && sajuOptions.length === 0 && spaceOptions.length > 0) {
      setActiveSystem('space');
      return;
    }
    if (activeSystem === 'space' && spaceOptions.length === 0 && sajuOptions.length > 0) {
      setActiveSystem('saju');
      return;
    }
    if (selectedGrade && !options.some(o => o.grade === selectedGrade)) {
      setSelectedGrade(null);
    }
  }, [activeSystem, options, sajuOptions.length, selectedGrade, spaceOptions.length]);

  async function handleSynthesize() {
    if (!selectedGrade || synthesizing || !selectedOpt) return;
    setSynthesizing(true);
    const isSaju = selectedOpt.system === 'saju';
    const rate = selectedOpt.rate;
    const success = Math.random() < rate;

    try {
      const client = getAuthenticatedClient(kakaoId);

      if (success) {
        // 성공: 재료 소모 후 새 아이템 지급
        const toConsume = inventory
          .filter(i => i.grade === selectedGrade && (isSaju ? i.id?.startsWith('saju_') : !i.id?.startsWith('saju_')))
          .slice(0, 3);
        for (const item of toConsume) {
          await client.from('user_shop_inventory')
            .delete()
            .eq('kakao_id', String(kakaoId))
            .eq('item_id', item.id)
            .limit(1);
        }
        const newItem = isSaju ? synthesizeSaju(selectedGrade) : synthesize(selectedGrade);
        await client.from('user_shop_inventory').insert({
          kakao_id: String(kakaoId),
          item_id: newItem.id,
          is_equipped: false,
          unlocked_at: new Date().toISOString(),
        });
        setOutcome({ success: true, item: newItem });
      } else {
        // 실패: 아이템 보존, 100 BP 차감
        if (onSpendBP) await onSpendBP(100, 'synthesis_fail');
        setOutcome({ success: false });
      }
    } catch {
      showToast?.('합성 중 오류가 발생했어요', 'error');
      setSynthesizing(false);
    }
  }

  // 합성 진행 중 로딩 화면
  if (synthesizing) {
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}>
        <div style={{ textAlign: 'center' }}>
          {/* 이중 회전 링 */}
          <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 28px' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--gold)', borderRightColor: 'rgba(232,176,72,.3)',
              animation: 'synth-spin .9s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 10, borderRadius: '50%',
              border: '2px solid transparent',
              borderBottomColor: 'rgba(200,130,255,.7)', borderLeftColor: 'rgba(200,130,255,.2)',
              animation: 'synth-spin .6s linear infinite reverse',
            }} />
            <div style={{
              position: 'absolute', inset: 20, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(232,176,72,.25), rgba(200,130,255,.1))',
              animation: 'synth-orb-pulse 1.4s ease-in-out infinite',
            }}>
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
              }}>⚗️</div>
            </div>
          </div>
          <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
            별의 기운을 합성하는 중…
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
            잠시만 기다려주세요
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // 결과 화면 (성공)
  if (outcome?.success && outcome.item) {
    const item = outcome.item;
    const cfg = GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG[item.grade] || {};
    const particles = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * 360;
      const dist = 60 + Math.random() * 30;
      return {
        px: `${Math.cos(angle * Math.PI / 180) * dist}px`,
        py: `${Math.sin(angle * Math.PI / 180) * dist}px`,
        delay: `${i * 0.06}s`,
        emoji: ['✦', '✧', '◈', '★'][i % 4],
      };
    });
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}>
        <div style={{
          width: '100%', maxWidth: 340, textAlign: 'center',
          background: 'var(--bg1)', borderRadius: 'var(--r2)',
          border: `1px solid ${cfg.border || 'var(--acc)'}`, padding: '32px 24px',
          animation: 'fadeUp .35s ease, synth-success-glow .8s ease .1s both',
        }}>
          {/* 파티클 */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            {particles.map((p, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  fontSize: '12px', color: cfg.color || 'var(--gold)',
                  '--px': p.px, '--py': p.py,
                  animation: `synth-particle .7s ease ${p.delay} both`,
                  pointerEvents: 'none',
                }}
              >
                {p.emoji}
              </span>
            ))}
            <div style={{ fontSize: 68, lineHeight: 1, animation: 'synth-star-pop .6s cubic-bezier(.34,1.56,.64,1) both' }}>
              {item.emoji}
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: cfg.color || 'var(--gold)', marginBottom: 6, letterSpacing: '.05em' }}>
            ✦ 합성 성공! {cfg.label} 아이템 획득
          </div>
          <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>
            {item.name}
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 20, lineHeight: 1.6 }}>
            {item.description}
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
            ✦ 보관함 확인
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  // 결과 화면 (실패)
  if (outcome?.success === false) {
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}>
        <div style={{
          width: '100%', maxWidth: 340, textAlign: 'center',
          background: 'var(--bg1)', borderRadius: 'var(--r2)',
          border: '1px solid rgba(224,90,58,.4)', padding: '32px 24px',
          boxShadow: '0 0 30px rgba(224,90,58,.12)',
          animation: 'fadeUp .35s ease, synth-shake .55s ease .2s both',
        }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>
            💫
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#E05A3A', marginBottom: 8, letterSpacing: '.05em' }}>
            합성 실패
          </div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', marginBottom: 8, lineHeight: 1.6 }}>
            별이 잠시 빗나갔어요
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 20, lineHeight: 1.6 }}>
            아이템은 보존됩니다. 100 BP가 소모됐어요.
          </div>
          <button
            onClick={() => { onComplete(); onClose(); }}
            style={{
              width: '100%', padding: '12px',
              background: 'none', border: '1.5px solid var(--line)',
              borderRadius: 'var(--r1)', color: 'var(--t2)', fontWeight: 600,
              fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            확인
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

        <div style={{
          marginBottom: 14,
          padding: '10px 12px',
          background: 'rgba(232,176,72,0.08)',
          border: '1px solid rgba(232,176,72,0.2)',
          borderRadius: 'var(--r1)',
          fontSize: '11px',
          color: 'var(--t3)',
          lineHeight: 1.6,
        }}>
          일반 → 희귀는 100%, 희귀 → 영웅은 50%, 영웅 → 레전더리는 10%예요. 실패해도 재료 아이템은 유지되고 BP만 100 소모돼요.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { id: 'space', label: '우주 합성', count: spaceOptions.length },
            { id: 'saju', label: '사주 합성', count: sajuOptions.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSystem(tab.id)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 'var(--r1)',
                border: `1px solid ${activeSystem === tab.id ? 'var(--acc)' : 'var(--line)'}`,
                background: activeSystem === tab.id ? 'var(--goldf)' : 'var(--bg2)',
                color: activeSystem === tab.id ? 'var(--gold)' : 'var(--t3)',
                fontWeight: activeSystem === tab.id ? 700 : 500,
                fontSize: 'var(--xs)',
                fontFamily: 'var(--ff)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
              <span style={{ marginLeft: 6, opacity: 0.7 }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {options.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
            합성 가능한 아이템이 없어요<br />
            <span style={{ fontSize: '11px' }}>(같은 등급 3개 이상 필요)</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {options.map(opt => {
              const rateLabel = opt.rate === 1.0 ? '성공률 100%' : opt.rate === 0.5 ? '성공률 50%' : `성공률 ${Math.round(opt.rate * 100)}%`;
              const rateColor = opt.rate === 1.0 ? '#7EC8A4' : opt.rate >= 0.5 ? '#E8B048' : '#E05A3A';
              return (
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
                    boxShadow: selectedGrade === opt.grade ? `0 0 18px ${opt.color}22` : 'none',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: opt.color }}>
                      {opt.label} 3개 → {opt.yields} 1개
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: '11px', color: 'var(--t4)' }}>
                        보유 {opt.count}개
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: rateColor }}>
                        {rateLabel}
                      </span>
                    </div>
                    {opt.rate < 1.0 && (
                      <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 2 }}>
                        실패 시 아이템 보존 · 100 BP 소모
                      </div>
                    )}
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${selectedGrade === opt.grade ? opt.color : 'var(--line)'}`,
                    background: selectedGrade === opt.grade ? opt.color : 'none',
                    flexShrink: 0,
                  }} />
                </button>
              );
            })}
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
              cursor: selectedGrade && !synthesizing ? 'pointer' : 'not-allowed',
            }}
          >
            {synthesizing ? '합성 중...' : selectedOpt && selectedOpt.rate < 1.0
              ? `✦ 합성 시도 (${Math.round(selectedOpt.rate * 100)}%)`
              : '✦ 합성하기'
            }
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── 아이템 상세 모달 ─────────────────────────────────────────────
function ItemDetailModal({ item, onClose, onToggleEquip, toggling, onDailyActivate, dailyActId }) {
  const cfg = item.grade ? (GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG?.[item.grade]) : null;
  const systemLabel = item.id?.startsWith('saju_') ? '사주 시스템' : item.grade ? '우주 시스템' : '';
  const isGachaItem = !!item.grade;
  const isTalisman = item.category === 'talisman';
  const isDailyActive = dailyActId && (dailyActId === item.id || dailyActId === item.id.split('::')[0]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 320,
          background: 'var(--bg1)',
          borderRadius: 'var(--r2)',
          border: `1px solid ${cfg?.border || 'var(--line)'}`,
          padding: '28px 24px',
          animation: 'fadeUp .28s ease',
          boxShadow: cfg ? `0 0 24px ${cfg.border}` : 'none',
        }}
      >
        {/* 이모지/그래픽 */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {item.category === 'talisman'
            ? <div style={{ fontSize: 56, marginBottom: 10 }}>{item.emoji}</div>
            : <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><GachaGraphic item={item} size={72} /></div>
          }
          {cfg && (
            <div style={{
              display: 'inline-flex', padding: '4px 12px', borderRadius: 20,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              fontSize: '10px', color: cfg.color, fontWeight: 700,
              letterSpacing: '.05em', marginBottom: 8,
            }}>
              {cfg.label} {systemLabel && `· ${systemLabel}`}
            </div>
          )}
          <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: item.affixColor || 'var(--t1)' }}>
            {item.name}
          </div>
        </div>

        {/* 설명 */}
        {item.description && (
          <div style={{
            fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.8,
            background: 'var(--bg2)', borderRadius: 'var(--r1)',
            padding: '12px 14px', marginBottom: 12,
            border: '1px solid var(--line)',
          }}>
            {item.description}
          </div>
        )}

        {/* 효과 */}
        {(item.effect || item.effectLabel) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            fontSize: 'var(--xs)', color: cfg?.color || 'var(--gold)',
          }}>
            <span>✦</span>
            <span style={{ fontWeight: 600 }}>{item.effect || item.effectLabel}</span>
          </div>
        )}

        {/* 부스트 정보 */}
        {item.boost && (
          <div style={{ fontSize: '11px', color: 'var(--t4)', marginBottom: 12 }}>
            운세 부스트: <strong style={{ color: 'var(--gold)' }}>+{item.boost}점</strong>
            {item.aspectKey && ` (${item.aspectKey} 축)`}
          </div>
        )}

        {/* 장착/발동 버튼 */}
        {onToggleEquip && isGachaItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            <button
              onClick={() => { onToggleEquip(item); onClose(); }}
              disabled={toggling}
              style={{
                width: '100%', padding: '10px',
                background: item.is_equipped ? 'rgba(232,176,72,.15)' : (cfg?.bg || 'var(--bg3)'),
                border: `1.5px solid ${item.is_equipped ? 'var(--acc)' : (cfg?.border || 'var(--line)')}`,
                borderRadius: 'var(--r1)',
                color: item.is_equipped ? 'var(--gold)' : (cfg?.color || 'var(--t3)'),
                fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
              }}
            >
              {toggling ? '...' : item.is_equipped ? '✦ 기운 장착 중 (해제)' : '✦ 기운 장착'}
            </button>
            {onDailyActivate && (
              <button
                onClick={() => { onDailyActivate(item); onClose(); }}
                style={{
                  width: '100%', padding: '10px',
                  background: isDailyActive ? 'rgba(232,176,72,.25)' : 'var(--goldf)',
                  border: `1.5px solid ${isDailyActive ? 'var(--gold)' : 'rgba(232,176,72,.4)'}`,
                  borderRadius: 'var(--r1)',
                  color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
                }}
              >
                {isDailyActive ? '🔮 발동 중 (해제)' : '🔮 오늘 발동'}
              </button>
            )}
          </div>
        )}
        {onToggleEquip && isTalisman && (
          <button
            onClick={() => { onToggleEquip(item); onClose(); }}
            disabled={toggling}
            style={{
              width: '100%', padding: '10px', marginBottom: 10,
              background: item.is_equipped ? 'rgba(232,176,72,.2)' : 'var(--goldf)',
              border: `1.5px solid ${item.is_equipped ? 'var(--acc)' : 'rgba(232,176,72,.4)'}`,
              borderRadius: 'var(--r1)',
              color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            {toggling ? '처리 중...' : item.is_equipped ? '🔮 발동 중 (해제)' : '🔮 부적 발동'}
          </button>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '11px',
            background: 'none', border: '1px solid var(--line)',
            borderRadius: 'var(--r1)', color: 'var(--t3)',
            fontFamily: 'var(--ff)', fontSize: 'var(--xs)', cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ─── 아이템 카드 ────────────────────────────────────────────────
function OwnedItemCard({ item, onToggleEquip, toggling, onUse, dailyActId, onDailyActivate, onDetail, compact }) {
  const isTalisman = item.category === 'talisman';
  const isGachaItem = !!item.grade; // grade 있으면 가챠 아이템
  const cfg = item.grade ? GRADE_CONFIG[item.grade] : null;
  const isDailyActive = dailyActId && (dailyActId === item.id || dailyActId === item.id.split('::')[0]);

  if (compact) {
    return (
      <div
        onClick={() => onDetail?.(item)}
        style={{
          background: 'var(--bg2)',
          border: `1px solid ${item.is_equipped ? 'var(--acc)' : (cfg?.border || 'var(--line)')}`,
          borderRadius: 10,
          padding: '8px 4px 6px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          position: 'relative',
          cursor: 'pointer',
          boxShadow: item.is_equipped ? '0 0 8px rgba(232,176,72,.25)' : 'none',
          minHeight: 76,
          justifyContent: 'flex-start',
          transition: 'all 0.15s',
        }}
      >
        {item.is_equipped && (
          <div style={{
            position: 'absolute', top: 4, left: 4,
            width: 5, height: 5, borderRadius: '50%',
            background: 'var(--gold)',
          }} />
        )}
        {cfg && (
          <div style={{
            position: 'absolute', top: 3, right: 4,
            fontSize: '8px', fontWeight: 700, color: cfg.color,
            lineHeight: 1,
          }}>
            {cfg.label.slice(0, 1)}
          </div>
        )}
        <div style={{ marginTop: cfg ? 6 : 2 }}>
          {item.category === 'talisman' ? (
            <div style={{ fontSize: 26, lineHeight: 1 }}>{item.emoji}</div>
          ) : (
            <GachaGraphic item={item} size={30} />
          )}
        </div>
        <div style={{
          fontSize: '9px', fontWeight: 600, color: item.affixColor || 'var(--t2)',
          textAlign: 'center', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          wordBreak: 'break-all', width: '100%',
        }}>
          {item.name}
        </div>
      </div>
    );
  }

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

      {/* 이모지(SVG 파티클 렌더러 교체) — 클릭 시 상세 모달 */}
      <div
        onClick={onDetail ? () => onDetail(item) : undefined}
        style={{
          marginTop: (item.is_equipped || cfg) ? 16 : 0,
          marginBottom: 8,
          display: 'flex', justifyContent: 'center',
          cursor: onDetail ? 'pointer' : 'default',
        }}
      >
        {item.category === 'talisman' ? (
          <div style={{ fontSize: 30, lineHeight: 1 }}>{item.emoji}</div>
        ) : (
          <GachaGraphic item={item} size={46} />
        )}
      </div>

      {/* 카테고리 */}
      <div style={{ fontSize: '10px', color: 'var(--t4)', letterSpacing: '.04em' }}>
        {CAT_LABEL[item.category] ?? item.category}
      </div>

      {/* 이름 — 클릭 시 상세 */}
      <div
        onClick={onDetail ? () => onDetail(item) : undefined}
        style={{ fontSize: 'var(--sm)', fontWeight: 700, color: item.affixColor || 'var(--t1)', lineHeight: 1.3, cursor: onDetail ? 'pointer' : 'default' }}
      >
        {item.name}
      </div>

      {item.aspectKey && (
        <div style={{
          fontSize: '10px',
          color: 'var(--gold)',
          fontWeight: 700,
          letterSpacing: '.03em',
        }}>
          {FORTUNE_LABELS[item.aspectKey] || item.aspectKey}
        </div>
      )}

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
      {isGachaItem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto' }}>
          {/* 메인 기운 장착 */}
          <button
            onClick={() => onToggleEquip(item)}
            disabled={toggling}
            style={{
              padding: '7px',
              background: item.is_equipped ? 'rgba(232,176,72,.15)' : (cfg?.bg || 'var(--bg3)'),
              border: `1.5px solid ${item.is_equipped ? 'var(--acc)' : (cfg?.border || 'var(--line)')}`,
              borderRadius: 'var(--r1)',
              color: item.is_equipped ? 'var(--gold)' : (cfg?.color || 'var(--t3)'),
              fontWeight: 700, fontSize: '10px', fontFamily: 'var(--ff)',
              cursor: toggling ? 'not-allowed' : 'pointer', width: '100%', transition: 'all .15s',
            }}
          >
            {toggling ? '...' : item.is_equipped ? '✦ 기운 장착 중' : '기운 장착'}
          </button>
          {/* 오늘 발동 */}
          <button
            onClick={() => onDailyActivate(item)}
            style={{
              padding: '7px',
              background: isDailyActive ? 'rgba(232,176,72,.25)' : 'var(--goldf)',
              border: `1.5px solid ${isDailyActive ? 'var(--gold)' : 'rgba(232,176,72,.4)'}`,
              borderRadius: 'var(--r1)',
              color: 'var(--gold)', fontWeight: 700, fontSize: '10px',
              fontFamily: 'var(--ff)', cursor: 'pointer', width: '100%', transition: 'all .15s',
            }}
          >
            {isDailyActive ? '🔮 발동 중 (해제)' : '🔮 오늘 발동'}
          </button>
        </div>
      )}

      {isTalisman && (
        <button
          onClick={() => onToggleEquip(item)}
          disabled={toggling}
          style={{
            marginTop: 'auto', padding: '8px',
            background: item.is_equipped ? 'rgba(232,176,72,.2)' : 'var(--goldf)',
            border: `1.5px solid ${item.is_equipped ? 'var(--acc)' : 'rgba(232,176,72,.4)'}`,
            borderRadius: 'var(--r1)',
            color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)', cursor: toggling ? 'not-allowed' : 'pointer',
            width: '100%', transition: 'all .15s',
          }}
        >
          {toggling ? '처리 중...' : item.is_equipped ? '🔮 발동 중 (해제)' : '🔮 부적 발동'}
        </button>
      )}

      {!isGachaItem && !isTalisman && (
        <button
          onClick={() => onUse(item)}
          style={{
            marginTop: 'auto', padding: '8px',
            background: 'var(--goldf)', border: '1.5px solid var(--acc)',
            borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
            fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', width: '100%',
          }}
        >
          ✦ 사용하기
        </button>
      )}
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────────
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

  // 오늘 발동 — Supabase daily_cache (cache_type: 'daily_activation')
  const today = new Date().toISOString().slice(0, 10);
  const [dailyActId, setDailyActId] = useState(null);

  // 마운트 시 오늘 발동 내역 로드
  useEffect(() => {
    if (!kakaoId) return;
    const client = getAuthenticatedClient(kakaoId);
    client.from('daily_cache')
      .select('content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_date', today)
      .eq('cache_type', 'daily_activation')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          setDailyActId(data.content);
          import('../utils/gachaItems.js').then(m => {
            const item = m.findItem(data.content);
            if (item) useAppStore.getState().setEquippedTalisman(item);
          });
        }
      })
      .catch(() => {});
  }, [kakaoId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDailyActivate(item) {
    if (!kakaoId) return;
    const isActive = dailyActId && (dailyActId === item.id || dailyActId === item.id.split('::')[0]);
    const client = getAuthenticatedClient(kakaoId);
    try {
      if (isActive) {
        await client.from('daily_cache')
          .delete()
          .eq('kakao_id', String(kakaoId))
          .eq('cache_date', today)
          .eq('cache_type', 'daily_activation');
        setDailyActId(null);
        useAppStore.getState().setEquippedTalisman(null);
        showToast?.('오늘 발동을 해제했어요.', 'info');
      } else {
        await client.from('daily_cache').upsert({
          kakao_id: String(kakaoId),
          cache_date: today,
          cache_type: 'daily_activation',
          content: item.id,
        }, { onConflict: 'kakao_id,cache_date,cache_type' });
        setDailyActId(item.id);
        useAppStore.getState().setEquippedTalisman(item);
        showToast?.(`${item.emoji} ${item.name} 오늘 발동! 재생성하면 별숨에 반영돼요 ✦`, 'success');
      }
    } catch {
      showToast?.('처리 중 오류가 발생했어요', 'error');
    }
  }

  const CATEGORIES = ['전체', '🌌 우주', '☯️ 사주', '기타'];

  const loadInventory = useCallback(async () => {
    if (!kakaoId) return;
    setLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);

      const { data: allShopItems } = await client.from('shop_items').select('*');
      const shopItemsMap = new Map((allShopItems || []).map(i => [i.id, i]));

      const { data: inv } = await client
        .from('user_shop_inventory')
        .select('item_id, is_equipped, unlocked_at')
        .eq('kakao_id', String(kakaoId))
        .order('unlocked_at', { ascending: false });

      const merged = (inv || []).map(r => {
        const itemInfo = shopItemsMap.get(r.item_id) || findItem(r.item_id);
        if (itemInfo) {
          return { ...itemInfo, is_equipped: r.is_equipped, _invItemId: r.item_id, id: itemInfo.id || r.item_id };
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
      const isTalismanItem = item.category === 'talisman';
      const isGachaItem = !!item.grade;
      const newEquipped = !item.is_equipped;

      // ── 부적 장착/해제 ──────────────────────────────────────
      if (isTalismanItem) {
        if (newEquipped) {
          // 기존 장착 부적 해제
          const prevTalismans = items.filter(i => i.is_equipped && i.category === 'talisman');
          for (const t of prevTalismans) {
            await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId)).eq('item_id', t.id);
          }
          await client.from('user_shop_inventory').update({ is_equipped: true }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
          useAppStore.getState().setEquippedTalisman(item);
          showToast?.(`${item.emoji} ${item.name} 부적 발동! 오늘의 운세에 반영돼요 ✦`, 'success');
        } else {
          await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
          useAppStore.getState().setEquippedTalisman(null);
          showToast?.('부적 효과를 해제했어요.', 'info');
        }
        setItems(prev => prev.map(i => {
          if (i.id === item.id) return { ...i, is_equipped: newEquipped };
          if (newEquipped && i.is_equipped && i.category === 'talisman') return { ...i, is_equipped: false };
          return i;
        }));
        return;
      }

      // ── 가챠 기운 장착/해제 ─────────────────────────────────
      if (!isGachaItem) {
        showToast?.('이 아이템은 장착할 수 없어요.', 'error');
        return;
      }

      if (newEquipped) {
        // 단일 메인 기운 슬롯: 다른 장착된 가챠 아이템 전부 해제
        const targetsToUnequip = items.filter(i => i.is_equipped && !!i.grade);
        for (const t of targetsToUnequip) {
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
      setItems(prev => prev.map(i => {
        if (i.id === item.id) return { ...i, is_equipped: newEquipped };
        if (newEquipped && i.is_equipped && !!i.grade) return { ...i, is_equipped: false };
        return i;
      }));
    } catch {
      showToast?.('처리 중 오류가 발생했어요', 'error');
    } finally {
      setToggling(null);
    }
  }

  const isGachaId  = (id) => ALL_GACHA_POOL.some(g => g.id === id);
  const gachaItems = items.filter(i => isGachaId(i._invItemId || i.id));
  const shopItems  = items.filter(i => !isGachaId(i._invItemId || i.id));

  const filtered = (() => {
    if (category === '전체')    return items;
    if (category === '🌌 우주') return items.filter(i => GRADE_ORDER.includes(i.grade));
    if (category === '☯️ 사주') return items.filter(i => SAJU_GRADE_ORDER.includes(i.grade));
    return shopItems; // 기타
  })();

  const equippedSajuItem = useAppStore(s => s.equippedSajuItem);

  // 합성 가능 여부 (우주 + 사주 통합)
  const gradeCountMap = {};
  for (const g of GRADE_ORDER)      gradeCountMap[g] = gachaItems.filter(i => i.grade === g && !String(i.id).startsWith('saju_')).length;
  for (const g of SAJU_GRADE_ORDER) gradeCountMap[g] = gachaItems.filter(i => i.grade === g && String(i.id).startsWith('saju_')).length;

  const synthableGrades = [
    ...GRADE_ORDER.filter(g => GRADE_CONFIG[g].next && gradeCountMap[g] >= GRADE_CONFIG[g].synthCost),
    ...SAJU_GRADE_ORDER.filter(g => SAJU_GRADE_CONFIG[g].next && gradeCountMap[g] >= SAJU_GRADE_CONFIG[g].synthCost),
  ];
  const canSynth = synthableGrades.length > 0;

  const groupedItems = Object.entries(
    filtered.reduce((acc, item) => {
      const key = item.aspectKey || 'general';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {})
  ).sort(([a], [b]) => {
    if (a === 'general') return 1;
    if (b === 'general') return -1;
    return (FORTUNE_LABELS[a] || a).localeCompare(FORTUNE_LABELS[b] || b, 'ko');
  });

  const itemGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: 8,
    alignItems: 'stretch',
  };

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '24px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>
            🎁 내 아이템
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
            보유 {items.length}개
            {equippedSajuItem && (
              <span style={{ marginLeft: 8, color: 'var(--gold)', fontWeight: 600 }}>
                · {equippedSajuItem.emoji} {equippedSajuItem.name}의 기운
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCollection(true)}
          style={{
            padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--acc)',
            borderRadius: 20, color: 'var(--gold)', fontSize: 'var(--xs)', fontWeight: 700,
            cursor: 'pointer', transition: 'all .2s'
          }}
        >
          📖 도감 보기
        </button>
      </div>

      {/* 합성 버튼 */}
      {canSynth && (
        <div style={{ padding: '0 24px 14px' }}>
          <button
            onClick={() => setShowSynth(true)}
            style={{
              padding: '8px 16px',
              background: 'var(--goldf)', border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
              fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              animation: 'gacha-count-pop .4s ease',
            }}
          >
            ⚗️ 합성 가능! ({synthableGrades.map(g => {
              const cfg = GRADE_CONFIG[g] || SAJU_GRADE_CONFIG[g];
              return `${cfg.label} ${gradeCountMap[g]}개`;
            }).join(' · ')})
          </button>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 24px 14px',
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
      <div style={{ padding: '0 24px' }}>
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
        ) : category === '전체' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {groupedItems.map(([groupKey, group]) => (
              <section
                key={groupKey}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r2)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>
                      {FORTUNE_LABELS[groupKey] || groupKey}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 2 }}>
                      눌러서 상세 설명을 보고, 필요한 기운을 바로 골라 쓸 수 있어요.
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>
                    {group.length}개
                  </div>
                </div>
                <div style={itemGridStyle}>
                  {group.map((item, idx) => (
                    <OwnedItemCard
                      key={`${groupKey}-${item.id}-${idx}`}
                      item={item}
                      onToggleEquip={handleToggleEquip}
                      toggling={toggling === item.id}
                      onUse={setUseItem}
                      dailyActId={dailyActId}
                      onDailyActivate={handleDailyActivate}
                      onDetail={setDetailItem}
                      compact
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div style={itemGridStyle}>
            {filtered.map((item, idx) => (
              <OwnedItemCard
                key={`${item.id}-${idx}`}
                item={item}
                onToggleEquip={handleToggleEquip}
                toggling={toggling === item.id}
                onUse={setUseItem}
                dailyActId={dailyActId}
                onDailyActivate={handleDailyActivate}
                onDetail={setDetailItem}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* 아이템 상세 모달 */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onToggleEquip={handleToggleEquip}
          toggling={toggling === detailItem?.id}
          onDailyActivate={handleDailyActivate}
          dailyActId={dailyActId}
        />
      )}

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
          onSpendBP={spendBP}
        />
      )}

      {/* 도감 모달 */}
      {showCollection && (
        <ItemCollectionPage inventoryItems={items} onClose={() => setShowCollection(false)} />
      )}
    </div>
  );
}
