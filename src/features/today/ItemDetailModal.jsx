import { GRADE_CONFIG as SPACE_GRADE_CONFIG, SAJU_GRADE_CONFIG } from '../../utils/gachaItems.js';

function getItemGradeConfig(item) {
  if (!item?.grade) return {};
  return SPACE_GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG[item.grade] || {};
}

export default function ItemDetailModal({ row, onClose, onUse, canUseItems = true }) {
  if (!row?.item) return null;
  const item = row.item;
  const cfg = getItemGradeConfig(item);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(6,8,16,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, background: 'var(--bg1)', borderRadius: 20, border: `1px solid ${cfg.border || 'var(--line)'}`, boxShadow: cfg.border ? `0 20px 50px ${cfg.border}` : '0 20px 50px rgba(0,0,0,.25)', padding: '22px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: cfg.bg || 'var(--bg2)', border: `1px solid ${cfg.border || 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
            {item.emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: cfg.color || 'var(--gold)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 6 }}>{cfg.label || item.grade}</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 800, lineHeight: 1.35, marginBottom: 6 }}>{item.name}</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700 }}>{item.effectLabel || `+${item.boost} boost`}</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>ITEM STORY</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>{item.description || item.effect || '설명이 아직 준비되지 않았어요.'}</div>
        </div>

        {item.effect && (
          <div style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>TODAY EFFECT</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>{item.effect}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
            닫기
          </button>
          <button onClick={() => onUse(row)} disabled={!canUseItems} style={{ flex: 1.4, padding: '11px 12px', borderRadius: 12, border: '1px solid var(--acc)', background: 'var(--goldf)', color: 'var(--gold)', fontSize: 'var(--xs)', fontWeight: 700, fontFamily: 'var(--ff)', cursor: canUseItems ? 'pointer' : 'not-allowed', opacity: canUseItems ? 1 : 0.45 }}>
            이 아이템 쓰기
          </button>
        </div>
      </div>
    </div>
  );
}
