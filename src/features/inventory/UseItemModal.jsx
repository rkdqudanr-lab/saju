import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GRADE_CONFIG } from '../../utils/gachaItems.js';

export default function UseItemModal({ item, callApi, onClose, showToast }) {
  const [loading, setLoading] = useState(false);
  const [effect, setEffect] = useState('');
  const cfg = GRADE_CONFIG[item.grade] || GRADE_CONFIG.fragment;

  useEffect(() => {
    if (!callApi) return;
    setLoading(true);
    const prompt = `[시스템 지시: 친근한 채팅 스타일로 2~4문장 이내 짧게 답변해요. 격식 없이 편하게.]\n[아이템 사용 효과 안내]\n아이템명: ${item.name} ${item.emoji}\n등급: ${GRADE_CONFIG[item.grade]?.label || item.grade}\n설명: ${item.description || ''}\n효과: ${item.effect || ''}\n\n이 아이템을 오늘 사용했을 때 어떤 기운이 활성화되는지 사용자에게 친근하게 2~3문장으로 설명해주세요. 오늘 하루에 어떤 변화가 생길지 구체적으로 말해주세요.`;
    callApi(prompt, { isChat: true })
      .then((res) => setEffect(res))
      .catch(() => setEffect('별이 잠시 쉬고 있어요 🌙'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, background: 'var(--bg1)', borderRadius: 'var(--r2, 16px)', border: `1px solid ${cfg.border}`, padding: '28px 24px', animation: 'fadeUp .3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 10, animation: 'gacha-bounce .6s ease both' }}>{item.emoji}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, letterSpacing: '.05em', marginBottom: 4 }}>{cfg.label}</div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>{item.name}</div>
          <div style={{ display: 'inline-flex', padding: '5px 12px', borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: '11px', color: cfg.color, fontWeight: 600 }}>
            {item.effect}
          </div>
        </div>
        <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '14px', marginBottom: 16, minHeight: 72, border: '1px solid var(--line)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t4)', fontSize: 'var(--xs)' }}>
              <span style={{ width: 14, height: 14, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
              별숨이 아이템 기운을 해석하는 중...
            </div>
          ) : (
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', lineHeight: 1.7 }}>{effect}</div>
          )}
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: '11px', background: 'var(--goldf)', border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
          ✦ 확인했어요
        </button>
      </div>
    </div>,
    document.body,
  );
}
