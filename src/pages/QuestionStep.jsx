import { useRef, useState, useEffect, useCallback } from "react";
import { ON } from "../utils/saju.js";
import { CATS, CATS_ALL } from "../utils/constants.js";
import { TIME_CONFIG } from "../utils/time.js";
import { loadAnalysisCache, saveAnalysisCache } from "../lib/analysisCache.js";
import BPInsufficientModal from "../components/BPInsufficientModal.jsx";
import { useBPCostGate } from "../hooks/useBPCostGate.js";

export default function QuestionStep({
  form, saju, sun, moon,
  otherProfiles, activeProfileIdx,
  timeSlot,
  diy, setDiy,
  selQs, maxQ,
  cat, setCat,
  showAllCats, setShowAllCats,
  addQ, rmQ, askQuick, askClaude,
  askBtnRef,
  user,
  // 게이미피케이션 props
  gamificationState = {},
  earnBP = null,
  showToast = null,
  freeRechargeAvailable = false,
  freeRechargeTimeRemaining = null,
  onRechargeFreeBP = null,
}) {
  const [recentQs, setRecentQs] = useState([]);
  const [bpModal, setBpModal] = useState({ isOpen: false, isRecharging: false });

  // BP 비용 게이팅
  const { askQuestion, QUESTION_COST } = useBPCostGate(
    user,
    gamificationState,
    earnBP,
    showToast
  );

  useEffect(() => {
    if (!user?.id) return;
    loadAnalysisCache(user.id, 'recent_questions').then(s => {
      try { setRecentQs(JSON.parse(s || '[]')); } catch { setRecentQs([]); }
    });
  }, [user?.id]);

  const handleDeleteRecent = useCallback((q, e) => {
    e.stopPropagation();
    if (!user?.id) return;
    const next = recentQs.filter(r => r !== q);
    setRecentQs(next);
    saveAnalysisCache(user.id, 'recent_questions', JSON.stringify(next));
  }, [user?.id, recentQs]);

  const handleAskQuick = useCallback(async (q) => {
    if (!q.trim()) return;

    // BP 부족 확인
    if (earnBP) {
      const result = await askQuestion(q);
      if (result.blocked) {
        setBpModal({ isOpen: true, isRecharging: false });
        return;
      }
      if (!result.success) {
        if (showToast) showToast('질문을 할 수 없습니다', 'error');
        return;
      }
    }

    setDiy('');
    askQuick(q);
    if (user?.id) {
      setRecentQs(prev => {
        const deduped = prev.filter(r => r !== q);
        const next = [q, ...deduped].slice(0, 5);
        saveAnalysisCache(user.id, 'recent_questions', JSON.stringify(next));
        return next;
      });
    }
  }, [askQuick, setDiy, user?.id, askQuestion, earnBP, showToast]);
  return (
    <div className="page">
      <div className="inner">
        <div className="step-dots">
          {[0, 1, 2].map(i => <div key={i} className={`dot ${i < 1 ? 'done' : i === 1 ? 'active' : 'todo'}`} />)}
        </div>
        <div className="q-shell">
          <div className="combo-banner">
            <div className="combo-title">✦ 사주 × 별자리 통합 분석</div>
            <div className="combo-sub">
              {activeProfileIdx === 0
                ? (saju && sun ? `${ON[saju.dom]} 기운의 ${sun.n} · 달 ${moon?.n || ''}` : '동양과 서양의 별이 함께 읽어드려요')
                : (() => {
                    const op = otherProfiles[activeProfileIdx - 1];
                    return op ? `${op.name || '이 사람'}의 별숨` : '동양과 서양의 별이 함께 읽어드려요';
                  })()
              }
            </div>
            <div style={{ marginTop: 10, padding: '11px 14px', background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: TIME_CONFIG[timeSlot].bg, border: `1px solid ${TIME_CONFIG[timeSlot].border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                {TIME_CONFIG[timeSlot].emoji}
              </div>
              <div>
                <div style={{ fontSize: 'var(--xs)', color: TIME_CONFIG[timeSlot].color, fontWeight: 700, marginBottom: 2 }}>{TIME_CONFIG[timeSlot].label}</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.5 }}>{TIME_CONFIG[timeSlot].greeting(activeProfileIdx === 0 ? (form.nickname || form.name) : otherProfiles[activeProfileIdx - 1]?.name || '')}</div>
              </div>
            </div>
          </div>

          <div className="diy-wrap" style={{ marginBottom: diy.trim() ? 0 : 'var(--sp2)' }}>
            <div style={{ fontSize: '10px', color: 'var(--t4)', fontWeight: 600, marginBottom: 8, letterSpacing: '.1em', textTransform: 'uppercase' }}>직접 묻기</div>
            {recentQs.length > 0 && !diy.trim() && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 6, letterSpacing: '.04em' }}>최근 질문</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {recentQs.map((q) => (
                    <div key={q} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 20, border: '1px solid var(--line)', background: 'var(--bg2)', overflow: 'hidden' }}>
                      <button onClick={() => setDiy(q)}
                        style={{ padding: '5px 10px', background: 'none', border: 'none', color: 'var(--t2)', fontSize: 'var(--xs)', cursor: 'pointer', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.length > 20 ? q.slice(0, 20) + '…' : q}
                      </button>
                      <button onClick={(e) => handleDeleteRecent(q, e)}
                        aria-label={`"${q}" 삭제`}
                        style={{ padding: '5px 9px', background: 'none', border: 'none', borderLeft: '1px solid var(--line)', color: 'var(--t4)', fontSize: '10px', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <textarea className="diy-inp"
              placeholder="직접 묻고 싶은 게 있어요? 자유롭게 써봐요"
              maxLength={200} value={diy} onChange={e => setDiy(e.target.value)} />
            <div className="diy-row"><span className="hint">{diy.length}/200</span></div>
            {diy.trim() && (
              <button className="btn-main" style={{ marginTop: 8 }}
                onClick={() => handleAskQuick(diy.trim())}>
                ✦ 질문하기
              </button>
            )}
          </div>

          {!diy.trim() && (
            <>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 6, letterSpacing: '.06em' }}>또는 고민 카테고리에서 골라봐요</div>
              <div className="cat-tabs">
                {(showAllCats ? CATS_ALL : CATS).map((c, i) => <button key={c.id} className={`cat-tab ${cat === i ? 'on' : ''}`} onClick={() => { setCat(i); if (typeof window.gtag === 'function') window.gtag('event', 'category_select', { cat: CATS[i]?.id }); }}>{c.icon} {c.label}</button>)}
              </div>
              <button className="res-btn" style={{ margin: '0 0 var(--sp2)', fontSize: 'var(--xs)' }} onClick={() => setShowAllCats(p => !p)}>
                {showAllCats ? '주요 주제만 보기 ▲' : '더 많은 주제 보기 ▼ (9개)'}
              </button>

              {selQs.length < maxQ && (
                <div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, margin: '10px 0 6px', letterSpacing: '.04em' }}>✦ 이런 질문 어때요?</div>
                  <div className="suggest-row">
                    {(showAllCats ? CATS_ALL : CATS)[cat]?.qs.slice(0, 3).filter(q => !selQs.includes(q)).map((q, i) => (
                      <button key={i} className="suggest-chip" onClick={() => askQuick(q)}>
                        {q.length > 22 ? q.slice(0, 22) + '…' : q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="q-list">
                {(showAllCats ? CATS_ALL : CATS)[cat]?.qs.map((q, i) => {
                  const on = selQs.includes(q);
                  return <button key={i} className={`q-item ${on ? 'on' : ''}`}
                    disabled={!on && selQs.length >= maxQ}
                    onClick={() => {
                      if (on) rmQ(selQs.indexOf(q));
                      else { addQ(q); if (typeof window.gtag === 'function') window.gtag('event', 'question_add', { cat: CATS[cat]?.id }); setTimeout(() => askBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150); }
                    }}>{q}</button>;
                })}
              </div>

              {selQs.length > 0 && (
                <div className="sel-qs">
                  <div className="sel-lbl">선택한 질문 ({selQs.length}/{maxQ})</div>
                  {selQs.map((q, i) => (
                    <div key={i} className="sel-item">
                      <span className="sel-n">{i + 1}</span>
                      <span className="sel-t">{q}</span>
                      <button className="sel-del" onClick={() => rmQ(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="q-stat">
                {selQs.length === 0 && '질문을 하나 이상 골라봐요'}
                {selQs.length > 0 && selQs.length < maxQ && <><strong>{maxQ - selQs.length}개</strong> 더 고를 수 있어요</>}
                {selQs.length === maxQ && <><strong>준비 완료!</strong> 두 별이 읽어드릴게요</>}
              </div>
              <button ref={askBtnRef} className="btn-main" disabled={!selQs.length} onClick={askClaude}>
                {selQs.length === 0 ? '질문을 먼저 골라봐요' : `✦ 두 별에게 물어보기 (${selQs.length}개)`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* BP 부족 모달 */}
      <BPInsufficientModal
        isOpen={bpModal.isOpen}
        currentBp={gamificationState?.currentBp || 0}
        requiredBp={QUESTION_COST}
        freeRechargeAvailable={freeRechargeAvailable}
        freeRechargeTimeRemaining={freeRechargeTimeRemaining}
        onClose={() => setBpModal({ ...bpModal, isOpen: false })}
        onRecharge={async () => {
          if (onRechargeFreeBP) {
            setBpModal({ ...bpModal, isRecharging: true });
            await onRechargeFreeBP();
            setBpModal({ isOpen: false, isRecharging: false });
          }
        }}
        isRecharging={bpModal.isRecharging}
      />
    </div>
  );
}
