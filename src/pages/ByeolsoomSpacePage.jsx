import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { STEP } from '../utils/steps.js';
import {
  COLLECTION_DEFS,
  GRADE_CONFIG, GRADE_ORDER,
  SAJU_GRADE_CONFIG, SAJU_GRADE_ORDER,
  findItem,
} from '../utils/gachaItems.js';

const GRADE_LABEL_MAP = {
  ...Object.fromEntries(GRADE_ORDER.map((g) => [g, GRADE_CONFIG[g].label])),
  ...Object.fromEntries(SAJU_GRADE_ORDER.map((g) => [g, SAJU_GRADE_CONFIG[g].label])),
};

const GRADE_COLOR_MAP = {
  ...Object.fromEntries(GRADE_ORDER.map((g) => [g, GRADE_CONFIG[g].color])),
  ...Object.fromEntries(SAJU_GRADE_ORDER.map((g) => [g, SAJU_GRADE_CONFIG[g].color])),
};

const GRADE_BORDER_MAP = {
  ...Object.fromEntries(GRADE_ORDER.map((g) => [g, GRADE_CONFIG[g].border])),
  ...Object.fromEntries(SAJU_GRADE_ORDER.map((g) => [g, SAJU_GRADE_CONFIG[g].border])),
};

function GradeSlot({ gradeKey, item, owned }) {
  const label = GRADE_LABEL_MAP[gradeKey] || gradeKey;
  const color = GRADE_COLOR_MAP[gradeKey] || 'var(--t4)';
  const border = GRADE_BORDER_MAP[gradeKey] || 'var(--line)';
  return (
    <div style={{
      flex: 1,
      borderRadius: 12,
      border: `1.5px solid ${owned ? border : 'var(--line)'}`,
      background: owned ? `rgba(${hexToRgb(color)}, 0.10)` : 'var(--bg1)',
      padding: '8px 4px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      opacity: owned ? 1 : 0.45,
    }}>
      <div style={{ fontSize: owned ? 20 : 16 }}>{owned ? (item?.emoji || '✦') : '？'}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: owned ? color : 'var(--t4)', letterSpacing: '.03em' }}>
        {label}
      </div>
    </div>
  );
}

function hexToRgb(color) {
  if (!color || !color.startsWith('#')) return '155,173,206';
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function CollectionCard({ def, ownedIds, onComplete, completedSet }) {
  const gradeOrder = def.system === 'saju' ? SAJU_GRADE_ORDER : GRADE_ORDER;
  const ownedCount = def.requiredIds.filter((id) => ownedIds.has(id)).length;
  const total = def.requiredIds.length;
  const complete = ownedCount === total;
  const alreadyClaimed = completedSet.has(def.id);
  const pct = Math.round((ownedCount / total) * 100);

  return (
    <article style={{
      borderRadius: 18,
      border: `1.5px solid ${complete ? 'var(--acc)' : 'var(--line)'}`,
      background: complete ? 'var(--goldf)' : 'var(--bg2)',
      padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 900 }}>
            {def.emoji} {def.name}
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.5, marginTop: 3 }}>
            {def.description}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {complete ? (
            <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 900 }}>완성 ✦</div>
          ) : (
            <div style={{ fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 900 }}>{ownedCount}/{total}</div>
          )}
        </div>
      </div>

      <div style={{ height: 6, borderRadius: 999, background: 'var(--bg1)', border: '1px solid var(--line)', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: complete ? 'var(--gold)' : 'linear-gradient(90deg, rgba(232,176,72,0.45), var(--gold))', borderRadius: 999, transition: 'width .4s ease' }} />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {def.requiredIds.map((reqId, i) => {
          const gradeKey = gradeOrder[i];
          const owned = ownedIds.has(reqId);
          const resolvedItem = owned ? findItem(reqId) : null;
          return <GradeSlot key={reqId} gradeKey={gradeKey} item={resolvedItem} owned={owned} />;
        })}
      </div>

      {complete && !alreadyClaimed && (
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'var(--bg1)',
          border: '1px solid var(--acc)',
          fontSize: '11px',
          color: 'var(--t3)',
          lineHeight: 1.6,
        }}>
          <div style={{ color: 'var(--gold)', fontWeight: 900, marginBottom: 3 }}>
            해금 보상: {def.reward.title}
          </div>
          <div>{def.reward.frame} · {def.reward.passive}</div>
        </div>
      )}

      {complete && !alreadyClaimed && (
        <button
          type="button"
          onClick={() => onComplete(def)}
          style={{
            marginTop: 12, width: '100%',
            padding: '10px', borderRadius: 12,
            border: '1.5px solid var(--acc)', background: 'var(--gold)',
            color: '#1a1108', fontWeight: 800, fontSize: 'var(--sm)',
            fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          보상 받기 — BP {def.reward.bp}
        </button>
      )}
      {complete && alreadyClaimed && (
        <div style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'var(--bg1)',
          border: '1px solid var(--acc)',
          fontSize: 'var(--xs)',
          color: 'var(--t3)',
          lineHeight: 1.6,
        }}>
          <div style={{ color: 'var(--gold)', fontWeight: 900 }}>칭호: {def.reward.title}</div>
          <div>{def.reward.frame}</div>
          <div>{def.reward.story}</div>
        </div>
      )}
    </article>
  );
}

export default function ByeolsoomSpacePage() {
  const setStep = useAppStore((s) => s.setStep);
  const user = useAppStore((s) => s.user);
  const earnBP = useAppStore((s) => s.earnBP);
  const kakaoId = user?.kakaoId || user?.id;

  const [tab, setTab] = useState('cosmic');
  const [ownedIds, setOwnedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [completedSet, setCompletedSet] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`byeolsoom_completed_${kakaoId || 'guest'}`) || '[]');
      return new Set(Array.isArray(saved) ? saved : []);
    } catch { return new Set(); }
  });
  const [claimToast, setClaimToast] = useState(null);

  useEffect(() => {
    if (!kakaoId) { setOwnedIds(new Set()); return; }
    const client = getAuthenticatedClient(String(kakaoId));
    if (!client) { setOwnedIds(new Set()); return; }
    setLoading(true);
    client
      .from('user_shop_inventory')
      .select('item_id')
      .eq('kakao_id', String(kakaoId))
      .then(({ data }) => {
        const ids = new Set((data || []).map((r) => String(r.item_id).split('::')[0]));
        setOwnedIds(ids);
      })
      .catch(() => setOwnedIds(new Set()))
      .finally(() => setLoading(false));
  }, [kakaoId]);

  const handleComplete = useCallback((def) => {
    if (completedSet.has(def.id)) return;
    const next = new Set([...completedSet, def.id]);
    setCompletedSet(next);
    try {
      localStorage.setItem(`byeolsoom_completed_${kakaoId || 'guest'}`, JSON.stringify([...next]));
    } catch {}
    earnBP?.(def.reward.bp, `컬렉션 완성: ${def.name}`);
    setClaimToast(`✦ ${def.reward.title} 해금! BP +${def.reward.bp}`);
    setTimeout(() => setClaimToast(null), 2800);
  }, [completedSet, earnBP, kakaoId]);

  const cosmicDefs = useMemo(() => COLLECTION_DEFS.filter((d) => d.system === 'cosmic'), []);
  const sajuDefs   = useMemo(() => COLLECTION_DEFS.filter((d) => d.system === 'saju'), []);

  const cosmicComplete = cosmicDefs.filter((d) => d.requiredIds.every((id) => ownedIds.has(id))).length;
  const sajuComplete   = sajuDefs.filter((d) => d.requiredIds.every((id) => ownedIds.has(id))).length;
  const totalComplete  = cosmicComplete + sajuComplete;
  const totalDefs      = cosmicDefs.length + sajuDefs.length;

  const displayedDefs = tab === 'cosmic' ? cosmicDefs : sajuDefs;

  return (
    <div className="page">
      <div className="inner" style={{ paddingBottom: 48 }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setStep(STEP.HOME)}
            aria-label="홈으로"
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--bg2)', color: 'var(--t3)', cursor: 'pointer' }}
          >
            ←
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--lg)', color: 'var(--t1)', fontWeight: 900 }}>별숨 도감</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 3 }}>일반 · 레어 · 영웅 · 전설을 모아 컬렉션 완성</div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        {/* 전체 진행도 */}
        <section style={{ borderRadius: 20, border: '1px solid var(--acc)', background: 'var(--goldf)', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 900, color: 'var(--t1)' }}>전체 컬렉션</div>
            <div style={{ fontSize: 'var(--lg)', fontWeight: 900, color: 'var(--gold)' }}>{totalComplete}<span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', fontWeight: 500 }}>/{totalDefs}</span></div>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round((totalComplete / totalDefs) * 100)}%`, background: 'var(--gold)', borderRadius: 999, transition: 'width .5s ease' }} />
          </div>
        </section>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'var(--bg2)', borderRadius: 12, padding: 4, border: '1px solid var(--line)' }}>
          {[
            { key: 'cosmic', label: `🌌 우주 컬렉션`, count: cosmicComplete, total: cosmicDefs.length },
            { key: 'saju',   label: `☯️ 사주 컬렉션`, count: sajuComplete,   total: sajuDefs.length },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '9px 8px', borderRadius: 9,
                border: 'none',
                background: tab === t.key ? 'var(--goldf)' : 'none',
                color: tab === t.key ? 'var(--gold)' : 'var(--t3)',
                fontWeight: tab === t.key ? 700 : 400,
                fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
                outline: tab === t.key ? '1px solid var(--acc)' : 'none',
                transition: 'all .15s',
              }}
            >
              {t.label} {t.count}/{t.total}
            </button>
          ))}
        </div>

        {/* 컬렉션 카드 목록 */}
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>불러오는 중...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayedDefs.map((def) => (
              <CollectionCard
                key={def.id}
                def={def}
                ownedIds={ownedIds}
                onComplete={handleComplete}
                completedSet={completedSet}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          <button
            type="button"
            onClick={() => setStep(STEP.GACHA)}
            style={{ padding: '13px 14px', borderRadius: 16, border: '1px solid var(--acc)', background: 'var(--goldf)', color: 'var(--gold)', fontWeight: 800, fontFamily: 'var(--ff)', cursor: 'pointer' }}
          >
            뽑기 →
          </button>
          <button
            type="button"
            onClick={() => setStep(STEP.ITEM_INVENTORY)}
            style={{ padding: '13px 14px', borderRadius: 16, border: '1px solid var(--line)', background: 'var(--bg2)', color: 'var(--t2)', fontWeight: 800, fontFamily: 'var(--ff)', cursor: 'pointer' }}
          >
            내 오브제함
          </button>
        </div>
      </div>

      {/* 클레임 토스트 */}
      {claimToast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--gold)', color: '#1a1108',
          padding: '10px 20px', borderRadius: 24,
          fontSize: 'var(--sm)', fontWeight: 800,
          boxShadow: '0 4px 20px rgba(232,176,72,0.45)',
          animation: 'fadeUp .3s ease',
          zIndex: 9999, whiteSpace: 'nowrap',
        }}>
          {claimToast}
        </div>
      )}
    </div>
  );
}
