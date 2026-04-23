import { ASPECT_META } from './getDailyAxisScores.js';
import { GRADE_CONFIG as SPACE_GRADE_CONFIG, SAJU_GRADE_CONFIG } from '../../utils/gachaItems.js';

function getItemGradeConfig(item) {
  if (!item?.grade) return {};
  return SPACE_GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG[item.grade] || {};
}

export default function OneShotItemPicker({ scores, ownedRows, onUse, onInspect, canUseItems = true }) {
  const byAxis = {};
  for (const row of ownedRows) {
    const key = row.item?.aspectKey;
    if (!key || !ASPECT_META[key]) continue;
    if (!byAxis[key]) byAxis[key] = [];
    byAxis[key].push(row);
  }
  if (!Object.values(byAxis).some((list) => list.length > 0)) return null;

  const sortedScores = [...scores].sort((a, b) => a.total !== b.total ? a.total - b.total : b.bonus - a.bonus);

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 6 }}>TODAY BOOST ITEMS</div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 14, lineHeight: 1.6 }}>
        점수가 낮은 영역 순서로 정렬했어요. 아이템을 눌러 세부 정보를 확인하고 바로 쓸 수 있어요.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sortedScores.map((score) => {
          const rows = byAxis[score.key] || [];
          if (!rows.length) return null;
          return (
            <div key={score.key} style={{ padding: 12, borderRadius: 14, background: 'var(--bg1)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{ASPECT_META[score.key]?.emoji || '?'}</span>
                  <div>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)' }}>{score.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>점수 {score.total}점</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>보유 아이템 {rows.length}개</div>
              </div>

              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                {rows.map((row) => {
                  const item = row.item;
                  const cfg = getItemGradeConfig(item);
                  return (
                    <button key={row.rowId} onClick={() => onInspect(row)} style={{ flexShrink: 0, minWidth: 132, textAlign: 'left', borderRadius: 14, border: `1px solid ${cfg.border || 'var(--line)'}`, background: cfg.bg || 'var(--bg2)', padding: 10, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{item.emoji}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: cfg.color || 'var(--gold)', fontWeight: 700 }}>{cfg.label || item.grade}</div>
                          <div style={{ fontSize: 11, color: 'var(--t1)', fontWeight: 700, lineHeight: 1.3, wordBreak: 'keep-all' }}>{item.name}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.45, minHeight: 28 }}>{item.description || item.effect}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                        <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>+{item.boost}점</span>
                        <button type="button" onClick={(e) => { if (!canUseItems) return; e.stopPropagation(); onUse(row); }} style={{ padding: '5px 9px', borderRadius: 999, border: '1px solid var(--acc)', background: 'var(--goldf)', color: 'var(--gold)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--ff)', cursor: canUseItems ? 'pointer' : 'not-allowed', opacity: canUseItems ? 1 : 0.45 }}>
                          쓰기
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
