import { GRADE_CONFIG, SAJU_GRADE_CONFIG } from '../../utils/gachaItems.js';
import GachaGraphic from '../../components/GachaGraphic.jsx';
import { CAT_LABEL, FORTUNE_LABELS } from './inventoryUtils.js';

export default function OwnedItemCard({ item, onUse, onDetail, compact }) {
  const isTalisman = item.category === 'talisman';
  const isGachaItem = !!item.grade;
  const cfg = item.grade ? (GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG[item.grade]) : null;
  const compactNameColor = item.affixColor || 'var(--t1)';

  if (compact) {
    return (
      <div
        onClick={() => onDetail?.(item)}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.68)), var(--bg1)',
          border: `1px solid ${cfg?.border || 'var(--line)'}`,
          borderRadius: 14,
          padding: '10px 6px 8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          position: 'relative', cursor: 'pointer',
          minHeight: 92, justifyContent: 'flex-start',
          transition: 'all 0.15s',
          boxShadow: '0 8px 18px rgba(25, 18, 32, 0.05)',
        }}
      >
        {cfg && (
          <div style={{ position: 'absolute', top: 7, right: 7, fontSize: '8px', fontWeight: 700, color: cfg.color, lineHeight: 1 }}>
            {cfg.label.slice(0, 1)}
          </div>
        )}
        <div style={{ marginTop: cfg ? 10 : 6 }}>
          {isTalisman
            ? <div style={{ fontSize: 28, lineHeight: 1 }}>{item.emoji}</div>
            : <GachaGraphic item={item} size={34} />}
        </div>
        <div style={{
          fontSize: '10px', fontWeight: 800, color: compactNameColor,
          textAlign: 'center', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          wordBreak: 'keep-all', width: '100%', marginTop: 2,
          padding: '2px 4px', borderRadius: 8,
          background: 'rgba(255,255,255,0.72)',
          textShadow: '0 1px 0 rgba(255,255,255,0.85)',
        }}>
          {item.name}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${cfg?.border || 'var(--line)'}`,
      borderRadius: 'var(--r2, 16px)',
      padding: '14px 12px',
      display: 'flex', flexDirection: 'column', gap: 7,
      position: 'relative', transition: 'all 0.2s ease',
    }}>
      {cfg && (
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '10px', fontWeight: 700, color: cfg.color, letterSpacing: '.04em' }}>
          {cfg.label}
        </div>
      )}

      <div
        onClick={onDetail ? () => onDetail(item) : undefined}
        style={{ marginTop: cfg ? 16 : 0, marginBottom: 8, display: 'flex', justifyContent: 'center', cursor: onDetail ? 'pointer' : 'default' }}
      >
        {isTalisman
          ? <div style={{ fontSize: 30, lineHeight: 1 }}>{item.emoji}</div>
          : <GachaGraphic item={item} size={46} />}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--t4)', letterSpacing: '.04em' }}>{CAT_LABEL[item.category] ?? item.category}</div>
      <div
        onClick={onDetail ? () => onDetail(item) : undefined}
        style={{ fontSize: 'var(--sm)', fontWeight: 700, color: item.affixColor || 'var(--t1)', lineHeight: 1.3, cursor: onDetail ? 'pointer' : 'default' }}
      >
        {item.name}
      </div>
      {item.aspectKey && (
        <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.03em' }}>
          {FORTUNE_LABELS[item.aspectKey] || item.aspectKey}
        </div>
      )}

      {item.effect && (
        <div style={{
          fontSize: '10px', padding: '3px 8px', borderRadius: 20,
          background: cfg?.bg || 'var(--bg3)', border: `1px solid ${cfg?.border || 'var(--line)'}`,
          color: cfg?.color || 'var(--t3)', fontWeight: 600, display: 'inline-block', width: 'fit-content',
        }}>
          {item.effect}
        </div>
      )}
      {!item.effect && (
        <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.5 }}>{item.description}</div>
      )}

      <div style={{ marginTop: 'auto' }}>
        {!isGachaItem && !isTalisman ? (
          <button
            onClick={() => onUse?.(item)}
            style={{
              width: '100%', padding: '9px',
              background: 'var(--goldf)', border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)', color: 'var(--gold)',
              fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            ✦ 살펴보기
          </button>
        ) : null}
      </div>
    </div>
  );
}
