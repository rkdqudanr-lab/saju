import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/useAppStore.js';
import { GRADE_CONFIG, SAJU_GRADE_CONFIG, getItemResonanceReason } from '../../utils/gachaItems.js';
import GachaGraphic from '../../components/GachaGraphic.jsx';

export default function ItemDetailModal({ item, onClose }) {
  const saju = useAppStore((s) => s.saju);
  const today = useAppStore((s) => s.today);
  const cfg = item.grade ? (GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG?.[item.grade]) : null;
  const systemLabel = item.id?.startsWith('saju_') ? '사주 시스템' : item.grade ? '우주 시스템' : '';
  const isTalisman = item.category === 'talisman';

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, background: 'var(--bg1)', borderRadius: 'var(--r2)', border: `1px solid ${cfg?.border || 'var(--line)'}`, padding: '28px 24px', animation: 'fadeUp .28s ease', boxShadow: cfg ? `0 0 24px ${cfg.border}` : 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {isTalisman
            ? <div style={{ fontSize: 56, marginBottom: 10 }}>{item.emoji}</div>
            : <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><GachaGraphic item={item} size={72} /></div>}
          {cfg && (
            <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: '10px', color: cfg.color, fontWeight: 700, letterSpacing: '.05em', marginBottom: 8 }}>
              {cfg.label} {systemLabel && `· ${systemLabel}`}
            </div>
          )}
          <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: item.affixColor || 'var(--t1)' }}>{item.name}</div>
        </div>

        {item.description && (
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.8, background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '12px 14px', marginBottom: 12, border: '1px solid var(--line)' }}>
            {item.description}
          </div>
        )}
        {(item.effect || item.effectLabel) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 'var(--xs)', color: cfg?.color || 'var(--gold)' }}>
            <span>✦</span><span style={{ fontWeight: 600 }}>{item.effect || item.effectLabel}</span>
          </div>
        )}
        {item.grade && (
          <div style={{ fontSize: '11px', color: 'var(--t3)', lineHeight: 1.7, background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '10px 12px', marginBottom: 12, border: '1px solid var(--line)' }}>
            {getItemResonanceReason(item, { saju, today })}
          </div>
        )}
        <button onClick={onClose} style={{ width: '100%', padding: '11px', background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t3)', fontFamily: 'var(--ff)', fontSize: 'var(--xs)', cursor: 'pointer' }}>닫기</button>
      </div>
    </div>,
    document.body,
  );
}
