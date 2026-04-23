import { GRADE_CONFIG } from '../../utils/gachaItems.js';
import GachaGraphic from '../../components/GachaGraphic.jsx';
import { CAT_LABEL, FORTUNE_LABELS, isItemDailyActive } from './inventoryUtils.js';

export default function OwnedItemCard({ item, onToggleEquip, toggling, onUse, dailyActMap, onDailyActivate, onDetail, compact }) {
  const isTalisman = item.category === 'talisman';
  const isGachaItem = !!item.grade;
  const cfg = item.grade ? GRADE_CONFIG[item.grade] : null;
  const isDailyActive = isItemDailyActive(item, dailyActMap);

  if (compact) {
    return (
      <div onClick={() => onDetail?.(item)} style={{ background: item.is_equipped ? 'linear-gradient(180deg, rgba(232,176,72,0.12), rgba(232,176,72,0.04))' : 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))', border: `1px solid ${item.is_equipped ? 'var(--acc)' : (cfg?.border || 'var(--line)')}`, borderRadius: 14, padding: '10px 6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', cursor: 'pointer', boxShadow: item.is_equipped ? '0 10px 22px rgba(232,176,72,.16)' : 'none', minHeight: 92, justifyContent: 'flex-start', transition: 'all 0.15s' }}>
        {item.is_equipped && <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 5px', borderRadius: 999, background: 'rgba(232,176,72,0.18)', color: 'var(--gold)', fontSize: '8px', fontWeight: 700, letterSpacing: '.04em' }}>ON</div>}
        {cfg && <div style={{ position: 'absolute', top: 7, right: 7, fontSize: '8px', fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{cfg.label.slice(0, 1)}</div>}
        <div style={{ marginTop: cfg ? 10 : 6 }}>
          {isTalisman ? <div style={{ fontSize: 28, lineHeight: 1 }}>{item.emoji}</div> : <GachaGraphic item={item} size={34} />}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: item.affixColor || 'var(--t2)', textAlign: 'center', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'keep-all', width: '100%', marginTop: 2 }}>
          {item.name}
        </div>
        {(item.is_equipped || isDailyActive) && (
          <div style={{ marginTop: 'auto', fontSize: '8px', color: item.is_equipped ? 'var(--gold)' : '#B48EF0', fontWeight: 700, letterSpacing: '.03em' }}>
            {item.is_equipped ? 'EQUIPPED' : 'TODAY'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${item.is_equipped ? 'var(--acc)' : (cfg?.border || 'var(--line)')}`, borderRadius: 'var(--r2, 16px)', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 7, position: 'relative', transition: 'all 0.2s ease' }}>
      {cfg && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '10px', fontWeight: 700, color: cfg.color, letterSpacing: '.04em' }}>{cfg.label}</div>}
      {item.is_equipped && <div style={{ position: 'absolute', top: 8, left: 8, fontSize: '10px', fontWeight: 700, color: 'var(--gold)', background: 'var(--goldf)', padding: '2px 6px', borderRadius: 20, border: '1px solid var(--acc)' }}>장착 중</div>}

      <div onClick={onDetail ? () => onDetail(item) : undefined} style={{ marginTop: (item.is_equipped || cfg) ? 16 : 0, marginBottom: 8, display: 'flex', justifyContent: 'center', cursor: onDetail ? 'pointer' : 'default' }}>
        {isTalisman ? <div style={{ fontSize: 30, lineHeight: 1 }}>{item.emoji}</div> : <GachaGraphic item={item} size={46} />}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--t4)', letterSpacing: '.04em' }}>{CAT_LABEL[item.category] ?? item.category}</div>
      <div onClick={onDetail ? () => onDetail(item) : undefined} style={{ fontSize: 'var(--sm)', fontWeight: 700, color: item.affixColor || 'var(--t1)', lineHeight: 1.3, cursor: onDetail ? 'pointer' : 'default' }}>{item.name}</div>
      {item.aspectKey && <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.03em' }}>{FORTUNE_LABELS[item.aspectKey] || item.aspectKey}</div>}

      {item.effect && <div style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 20, background: cfg?.bg || 'var(--bg3)', border: `1px solid ${cfg?.border || 'var(--line)'}`, color: cfg?.color || 'var(--t3)', fontWeight: 600, display: 'inline-block', width: 'fit-content' }}>{item.effect}</div>}
      {!item.effect && <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.5 }}>{item.description}</div>}

      {isGachaItem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto' }}>
          <button onClick={() => onToggleEquip(item)} disabled={toggling} style={{ padding: '7px', background: item.is_equipped ? 'rgba(232,176,72,.15)' : (cfg?.bg || 'var(--bg3)'), border: `1.5px solid ${item.is_equipped ? 'var(--acc)' : (cfg?.border || 'var(--line)')}`, borderRadius: 'var(--r1)', color: item.is_equipped ? 'var(--gold)' : (cfg?.color || 'var(--t3)'), fontWeight: 700, fontSize: '10px', fontFamily: 'var(--ff)', cursor: toggling ? 'not-allowed' : 'pointer', width: '100%', transition: 'all .15s' }}>
            {toggling ? '...' : item.is_equipped ? '✦ 기운 장착 중' : '기운 장착'}
          </button>
          <button onClick={() => onDailyActivate(item)} style={{ padding: '7px', background: isDailyActive ? 'rgba(232,176,72,.25)' : 'var(--goldf)', border: `1.5px solid ${isDailyActive ? 'var(--gold)' : 'rgba(232,176,72,.4)'}`, borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: '10px', fontFamily: 'var(--ff)', cursor: 'pointer', width: '100%', transition: 'all .15s' }}>
            {isDailyActive ? '🔮 발동 중 (해제)' : '🔮 오늘 발동'}
          </button>
        </div>
      )}
      {isTalisman && (
        <button onClick={() => onToggleEquip(item)} disabled={toggling} style={{ marginTop: 'auto', padding: '8px', background: item.is_equipped ? 'rgba(232,176,72,.2)' : 'var(--goldf)', border: `1.5px solid ${item.is_equipped ? 'var(--acc)' : 'rgba(232,176,72,.4)'}`, borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: toggling ? 'not-allowed' : 'pointer', width: '100%', transition: 'all .15s' }}>
          {toggling ? '처리 중...' : item.is_equipped ? '🔮 발동 중 (해제)' : '🔮 부적 발동'}
        </button>
      )}
      {!isGachaItem && !isTalisman && (
        <button onClick={() => onUse(item)} style={{ marginTop: 'auto', padding: '8px', background: 'var(--goldf)', border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', width: '100%' }}>✦ 사용하기</button>
      )}
    </div>
  );
}
