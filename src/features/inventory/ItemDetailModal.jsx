import { createPortal } from 'react-dom';
import { GRADE_CONFIG, SAJU_GRADE_CONFIG } from '../../utils/gachaItems.js';
import GachaGraphic from '../../components/GachaGraphic.jsx';
import { isItemDailyActive } from './inventoryUtils.js';

export default function ItemDetailModal({ item, onClose, onToggleEquip, toggling, onDailyActivate, dailyActMap }) {
  const cfg = item.grade ? (GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG?.[item.grade]) : null;
  const systemLabel = item.id?.startsWith('saju_') ? '사주 시스템' : item.grade ? '우주 시스템' : '';
  const isGachaItem = !!item.grade;
  const isTalisman = item.category === 'talisman';
  const isDailyActive = isItemDailyActive(item, dailyActMap);

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
        {item.boost && (
          <div style={{ fontSize: '11px', color: 'var(--t4)', marginBottom: 12 }}>
            운세 부스트: <strong style={{ color: 'var(--gold)' }}>+{item.boost}점</strong>{item.aspectKey && ` (${item.aspectKey} 축)`}
          </div>
        )}

        {onToggleEquip && isGachaItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            <button onClick={() => { onToggleEquip(item); onClose(); }} disabled={toggling} style={{ width: '100%', padding: '10px', background: item.is_equipped ? 'rgba(232,176,72,.15)' : (cfg?.bg || 'var(--bg3)'), border: `1.5px solid ${item.is_equipped ? 'var(--acc)' : (cfg?.border || 'var(--line)')}`, borderRadius: 'var(--r1)', color: item.is_equipped ? 'var(--gold)' : (cfg?.color || 'var(--t3)'), fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
              {toggling ? '...' : item.is_equipped ? '✦ 기운 장착 중 (해제)' : '✦ 기운 장착'}
            </button>
            {onDailyActivate && (
              <button onClick={() => { onDailyActivate(item); onClose(); }} style={{ width: '100%', padding: '10px', background: isDailyActive ? 'rgba(232,176,72,.25)' : 'var(--goldf)', border: `1.5px solid ${isDailyActive ? 'var(--gold)' : 'rgba(232,176,72,.4)'}`, borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
                {isDailyActive ? '🔮 발동 중 (해제)' : '🔮 오늘 발동'}
              </button>
            )}
          </div>
        )}
        {onToggleEquip && isTalisman && (
          <button onClick={() => { onToggleEquip(item); onClose(); }} disabled={toggling} style={{ width: '100%', padding: '10px', marginBottom: 10, background: item.is_equipped ? 'rgba(232,176,72,.2)' : 'var(--goldf)', border: `1.5px solid ${item.is_equipped ? 'var(--acc)' : 'rgba(232,176,72,.4)'}`, borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
            {toggling ? '처리 중...' : item.is_equipped ? '🔮 발동 중 (해제)' : '🔮 부적 발동'}
          </button>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: '11px', background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t3)', fontFamily: 'var(--ff)', fontSize: 'var(--xs)', cursor: 'pointer' }}>닫기</button>
      </div>
    </div>,
    document.body,
  );
}
