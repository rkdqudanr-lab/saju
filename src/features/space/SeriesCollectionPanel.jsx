import { SPACE_SERIES, getSpaceObjectsBySeries } from '../../utils/byeolsoomSpaceItems.js';

function getNextBonus(series, ownedCount) {
  return (series.bonuses || []).find((bonus) => ownedCount < bonus.count) || null;
}

export default function SeriesCollectionPanel({ ownedObjects = [] }) {
  const ownedIds = new Set(ownedObjects.map((item) => item.id));

  return (
    <section style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 900, letterSpacing: '.08em', marginBottom: 4 }}>COLLECTION</div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 900 }}>시리즈 도감</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t4)' }}>세트 수집</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SPACE_SERIES.map((series) => {
          const objects = getSpaceObjectsBySeries(series.id);
          const ownedCount = objects.filter((item) => ownedIds.has(item.id)).length;
          const total = objects.length || 1;
          const pct = Math.round((ownedCount / total) * 100);
          const nextBonus = getNextBonus(series, ownedCount);

          return (
            <article key={series.id} style={{ border: '1px solid var(--line)', borderRadius: 18, background: 'var(--bg2)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 900 }}>{series.emoji} {series.name}</div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.55, marginTop: 3 }}>{series.description}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 900 }}>{ownedCount}/{total}</div>
                  <div style={{ fontSize: 10, color: 'var(--t4)' }}>{pct}%</div>
                </div>
              </div>

              <div style={{ height: 7, borderRadius: 999, background: 'var(--bg1)', border: '1px solid var(--line)', overflow: 'hidden', marginBottom: 9 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, rgba(232,176,72,0.55), var(--gold))', borderRadius: 999 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6, marginBottom: 10 }}>
                {objects.map((item) => {
                  const owned = ownedIds.has(item.id);
                  return (
                    <div key={item.id} title={item.name} style={{
                      aspectRatio: '1 / 1',
                      borderRadius: 10,
                      border: `1px solid ${owned ? 'var(--acc)' : 'var(--line)'}`,
                      background: owned ? 'var(--goldf)' : 'var(--bg1)',
                      color: owned ? 'var(--gold)' : 'var(--t4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      opacity: owned ? 1 : 0.35,
                    }}>
                      {owned ? item.emoji : '？'}
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: 10, color: nextBonus ? 'var(--t3)' : 'var(--gold)', lineHeight: 1.55 }}>
                {nextBonus
                  ? `다음 보상 ${nextBonus.count}개: ${nextBonus.label}`
                  : '시리즈 완성 보상을 모두 열었어요.'}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

