import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient } from '../../lib/supabase.js';
import {
  GRADE_CONFIG, GRADE_ORDER, SAJU_GRADE_CONFIG, SAJU_GRADE_ORDER,
  synthesize, synthesizeSaju,
} from '../../utils/gachaItems.js';
import { SYNTH_RATES } from './inventoryUtils.js';

export default function SynthesisModal({ inventory, kakaoId, onClose, onComplete, showToast, currentBp, onSpendBP }) {
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [activeSystem, setActiveSystem] = useState('space');
  const [synthesizing, setSynthesizing] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const spaceOptions = GRADE_ORDER
    .filter((g) => GRADE_CONFIG[g].next !== null)
    .map((g) => {
      const cfg = GRADE_CONFIG[g];
      const count = inventory.filter((i) => i.grade === g && !i.id?.startsWith('saju_')).length;
      const rate = SYNTH_RATES[g] ?? 1.0;
      return { grade: g, system: 'space', label: `🌌 ${cfg.label}`, count, cost: cfg.synthCost, yields: GRADE_CONFIG[cfg.next].label, color: cfg.color, rate };
    })
    .filter((o) => o.count >= o.cost);

  const sajuOptions = SAJU_GRADE_ORDER
    .filter((g) => SAJU_GRADE_CONFIG[g].next !== null)
    .map((g) => {
      const cfg = SAJU_GRADE_CONFIG[g];
      const count = inventory.filter((i) => i.grade === g && i.id?.startsWith('saju_')).length;
      const rate = SYNTH_RATES[g] ?? 1.0;
      return { grade: g, system: 'saju', label: `☯️ ${cfg.label}`, count, cost: cfg.synthCost, yields: SAJU_GRADE_CONFIG[cfg.next].label, color: cfg.color, rate };
    })
    .filter((o) => o.count >= o.cost);

  const options = activeSystem === 'saju' ? sajuOptions : spaceOptions;
  const selectedOpt = options.find((o) => o.grade === selectedGrade);

  useEffect(() => {
    if (activeSystem === 'saju' && sajuOptions.length === 0 && spaceOptions.length > 0) { setActiveSystem('space'); return; }
    if (activeSystem === 'space' && spaceOptions.length === 0 && sajuOptions.length > 0) { setActiveSystem('saju'); return; }
    if (selectedGrade && !options.some((o) => o.grade === selectedGrade)) setSelectedGrade(null);
  }, [activeSystem, options, sajuOptions.length, selectedGrade, spaceOptions.length]);

  async function handleSynthesize() {
    if (!selectedGrade || synthesizing || !selectedOpt) return;
    setSynthesizing(true);
    const isSaju = selectedOpt.system === 'saju';
    const success = Math.random() < selectedOpt.rate;
    try {
      const client = getAuthenticatedClient(kakaoId);
      if (success) {
        const toConsume = inventory
          .filter((i) => i.grade === selectedGrade && (isSaju ? i.id?.startsWith('saju_') : !i.id?.startsWith('saju_')))
          .slice(0, 3);
        for (const item of toConsume) {
          await client.from('user_shop_inventory').delete().eq('kakao_id', String(kakaoId)).eq('item_id', item.id).limit(1);
        }
        const newItem = isSaju ? synthesizeSaju(selectedGrade) : synthesize(selectedGrade);
        await client.from('user_shop_inventory').insert({ kakao_id: String(kakaoId), item_id: newItem.id, is_equipped: false, unlocked_at: new Date().toISOString() });
        setOutcome({ success: true, item: newItem });
      } else {
        if (onSpendBP) await onSpendBP(100, 'synthesis_fail');
        setOutcome({ success: false });
      }
    } catch {
      showToast?.('합성 중 오류가 발생했어요', 'error');
      setSynthesizing(false);
    }
  }

  // 로딩 화면
  if (synthesizing) return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 28px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRightColor: 'rgba(232,176,72,.3)', animation: 'synth-spin .9s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid transparent', borderBottomColor: 'rgba(200,130,255,.7)', borderLeftColor: 'rgba(200,130,255,.2)', animation: 'synth-spin .6s linear infinite reverse' }} />
          <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,176,72,.25), rgba(200,130,255,.1))', animation: 'synth-orb-pulse 1.4s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>⚗️</div>
        </div>
        <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>별의 기운을 합성하는 중…</div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>잠시만 기다려주세요</div>
      </div>
    </div>,
    document.body,
  );

  // 성공 화면
  if (outcome?.success && outcome.item) {
    const item = outcome.item;
    const cfg = GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG[item.grade] || {};
    const particles = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * 360, dist = 60 + Math.random() * 30;
      return { px: `${Math.cos(angle * Math.PI / 180) * dist}px`, py: `${Math.sin(angle * Math.PI / 180) * dist}px`, delay: `${i * 0.06}s`, emoji: ['✦', '✧', '◈', '★'][i % 4] };
    });
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ width: '100%', maxWidth: 340, textAlign: 'center', background: 'var(--bg1)', borderRadius: 'var(--r2)', border: `1px solid ${cfg.border || 'var(--acc)'}`, padding: '32px 24px', animation: 'fadeUp .35s ease, synth-success-glow .8s ease .1s both' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            {particles.map((p, i) => <span key={i} style={{ position: 'absolute', top: '50%', left: '50%', fontSize: '12px', color: cfg.color || 'var(--gold)', '--px': p.px, '--py': p.py, animation: `synth-particle .7s ease ${p.delay} both`, pointerEvents: 'none' }}>{p.emoji}</span>)}
            <div style={{ fontSize: 68, lineHeight: 1, animation: 'synth-star-pop .6s cubic-bezier(.34,1.56,.64,1) both' }}>{item.emoji}</div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: cfg.color || 'var(--gold)', marginBottom: 6, letterSpacing: '.05em' }}>✦ 합성 성공! {cfg.label} 아이템 획득</div>
          <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>{item.name}</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 20, lineHeight: 1.6 }}>{item.description}</div>
          <button onClick={() => { onComplete(); onClose(); }} style={{ width: '100%', padding: '12px', background: 'var(--goldf)', border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>✦ 보관함 확인</button>
        </div>
      </div>,
      document.body,
    );
  }

  // 실패 화면
  if (outcome?.success === false) return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ width: '100%', maxWidth: 340, textAlign: 'center', background: 'var(--bg1)', borderRadius: 'var(--r2)', border: '1px solid rgba(224,90,58,.4)', padding: '32px 24px', animation: 'fadeUp .35s ease, synth-shake .55s ease .2s both' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>💫</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#E05A3A', marginBottom: 8, letterSpacing: '.05em' }}>합성 실패</div>
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', marginBottom: 8, lineHeight: 1.6 }}>별이 잠시 빗나갔어요</div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 20, lineHeight: 1.6 }}>아이템은 보존됩니다. 100 BP가 소모됐어요.</div>
        <button onClick={() => { onComplete(); onClose(); }} style={{ width: '100%', padding: '12px', background: 'none', border: '1.5px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t2)', fontWeight: 600, fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>확인</button>
      </div>
    </div>,
    document.body,
  );

  // 합성 선택 화면
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ width: '100%', maxWidth: 360, background: 'var(--bg1)', borderRadius: 'var(--r2)', border: '1px solid var(--line)', padding: '24px', animation: 'fadeUp .3s ease' }}>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>✦ 아이템 합성</div>

        <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(232,176,72,0.08)', border: '1px solid rgba(232,176,72,0.2)', borderRadius: 'var(--r1)', fontSize: '11px', color: 'var(--t3)', lineHeight: 1.6 }}>
          일반 → 희귀는 100%, 희귀 → 영웅은 50%, 영웅 → 레전더리는 10%예요. 실패해도 재료 아이템은 유지되고 BP만 100 소모돼요.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[{ id: 'space', label: '우주 합성', count: spaceOptions.length }, { id: 'saju', label: '사주 합성', count: sajuOptions.length }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveSystem(tab.id)} style={{ flex: 1, padding: '10px 12px', borderRadius: 'var(--r1)', border: `1px solid ${activeSystem === tab.id ? 'var(--acc)' : 'var(--line)'}`, background: activeSystem === tab.id ? 'var(--goldf)' : 'var(--bg2)', color: activeSystem === tab.id ? 'var(--gold)' : 'var(--t3)', fontWeight: activeSystem === tab.id ? 700 : 500, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
              {tab.label} <span style={{ marginLeft: 6, opacity: 0.7 }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {options.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
            합성 가능한 아이템이 없어요<br /><span style={{ fontSize: '11px' }}>(같은 등급 3개 이상 필요)</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {options.map((opt) => {
              const rateColor = opt.rate === 1.0 ? '#7EC8A4' : opt.rate >= 0.5 ? '#E8B048' : '#E05A3A';
              const rateLabel = opt.rate === 1.0 ? '성공률 100%' : `성공률 ${Math.round(opt.rate * 100)}%`;
              return (
                <button key={opt.grade} onClick={() => setSelectedGrade(opt.grade === selectedGrade ? null : opt.grade)} style={{ padding: '12px 14px', borderRadius: 'var(--r1)', border: `1.5px solid ${selectedGrade === opt.grade ? opt.color : 'var(--line)'}`, background: selectedGrade === opt.grade ? `${opt.color}18` : 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'var(--ff)', transition: 'all .15s' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: opt.color }}>{opt.label} 3개 → {opt.yields} 1개</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: '11px', color: 'var(--t4)' }}>보유 {opt.count}개</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: rateColor }}>{rateLabel}</span>
                    </div>
                    {opt.rate < 1.0 && <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 2 }}>실패 시 아이템 보존 · 100 BP 소모</div>}
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selectedGrade === opt.grade ? opt.color : 'var(--line)'}`, background: selectedGrade === opt.grade ? opt.color : 'none', flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t3)', fontFamily: 'var(--ff)', cursor: 'pointer', fontSize: 'var(--xs)' }}>취소</button>
          <button onClick={handleSynthesize} disabled={!selectedGrade || synthesizing} style={{ flex: 2, padding: '11px', background: selectedGrade ? 'var(--goldf)' : 'var(--bg3)', border: `1.5px solid ${selectedGrade ? 'var(--acc)' : 'var(--line)'}`, borderRadius: 'var(--r1)', color: selectedGrade ? 'var(--gold)' : 'var(--t4)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: selectedGrade && !synthesizing ? 'pointer' : 'not-allowed' }}>
            {synthesizing ? '합성 중...' : selectedOpt && selectedOpt.rate < 1.0 ? `✦ 합성 시도 (${Math.round(selectedOpt.rate * 100)}%)` : '✦ 합성하기'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
