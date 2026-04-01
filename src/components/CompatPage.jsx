import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { getSaju, ON } from "../utils/saju.js";
import { getSun } from "../utils/astrology.js";
import { loadAnalysisCache, saveAnalysisCache } from "../lib/analysisCache.js";

function getDaysInMonth(year, month) {
  if (!month) return 31;
  if (!year || String(year).length < 4) return 31;
  return new Date(parseInt(year), parseInt(month), 0).getDate();
}

// ═══════════════════════════════════════════════════════════
//  💞 1대1 별숨 — 두 별의 인연 읽기
// ═══════════════════════════════════════════════════════════
export default function CompatPage({ myForm, mySaju, mySun, buildCtx, onBack, shareResult, user }) {
  const [partner, setPartner] = useState({ name: '', by: '', bm: '', bd: '', gender: '' });
  const [storyResult, setStoryResult] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const storyLoadingRef = useRef(false);
  const [recentPartners, setRecentPartners] = useState([]);

  // 최근 궁합 파트너 로드 (Supabase)
  useEffect(() => {
    if (!user?.id) return;
    loadAnalysisCache(user.id, 'compat_recent').then(s => {
      try { setRecentPartners(JSON.parse(s || '[]')); } catch { setRecentPartners([]); }
    });
  }, [user?.id]);

  const saveRecentPartner = useCallback((p) => {
    if (!user?.id || !p.by) return;
    setRecentPartners(prev => {
      const deduped = prev.filter(r => !(r.name === p.name && r.by === p.by && r.bm === p.bm && r.bd === p.bd));
      const next = [{ name: p.name, by: p.by, bm: p.bm, bd: p.bd, gender: p.gender }, ...deduped].slice(0, 3);
      saveAnalysisCache(user.id, 'compat_recent', JSON.stringify(next));
      return next;
    });
  }, [user?.id]);

  const partnerSaju = useMemo(() => {
    if (partner.by && partner.bm && partner.bd) {
      try { return getSaju(+partner.by, +partner.bm, +partner.bd, 12); } catch { return null; }
    }
    return null;
  }, [partner]);
  const partnerSun = useMemo(() => {
    if (partner.bm && partner.bd) {
      try { return getSun(+partner.bm, +partner.bd); } catch { return null; }
    }
    return null;
  }, [partner.bm, partner.bd]);
  const partnerOk = partner.by && partner.bm && partner.bd && partner.gender;

  const compatScore = useMemo(() => {
    if (!mySaju || !partnerSaju) return 75;
    const SENG = { 목: ['수', '목'], 화: ['목', '화'], 토: ['화', '토'], 금: ['토', '금'], 수: ['금', '수'] };
    const elements = ['목', '화', '토', '금', '수'];
    const a = mySaju.dom, b = partnerSaju.dom;
    const seed = (elements.indexOf(a) * 7 + elements.indexOf(b) * 11) % 100;
    if (SENG[a]?.includes(b) || SENG[b]?.includes(a)) return 80 + (seed % 15);
    if (a === b) return 75 + (seed % 10);
    return 60 + (seed % 20);
  }, [mySaju?.dom, partnerSaju?.dom]);

  const buildPartnerCtx = () => {
    let c = `[나 — ${myForm.name || 'A'}]\n`;
    c += `${buildCtx()}\n`;
    c += `[상대방 — ${partner.name || 'B'} · ${+new Date().getFullYear() - +partner.by}세 · ${partner.gender}]\n`;
    if (partnerSaju) {
      c += `연주: ${partnerSaju.yeon.g}${partnerSaju.yeon.j} / 월주: ${partnerSaju.wol.g}${partnerSaju.wol.j} / 일주: ${partnerSaju.il.g}${partnerSaju.il.j}\n`;
      c += `기질: ${partnerSaju.ilganDesc}\n강한 기운: ${ON[partnerSaju.dom]}\n\n`;
    }
    if (partnerSun) c += `별자리: ${partnerSun.n}(${partnerSun.s}) — ${partnerSun.desc}\n`;
    return c;
  };

  const runStory = async () => {
    if (storyLoadingRef.current) return;
    storyLoadingRef.current = true;
    setStoryLoading(true);
    setStoryResult(null);
    const now = new Date();
    const todayStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][now.getDay()]}요일)`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: `[두 별의 인연] 오늘(${todayStr}) 두 사람의 사주와 별자리를 바탕으로 두 사람의 관계와 인연에 대해 소설처럼 이야기해줘요.`,
          context: buildPartnerCtx(),
          isChat: false, isReport: false, isScenario: false, isStory: true,
          kakaoId: user?.id || null,
          clientHour: new Date().getHours(),
        }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      saveRecentPartner(partner);
      try {
        const raw = data.text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(raw);
        setStoryResult({
          todayVibe: parsed.todayVibe || '',
          story: parsed.story || '',
          moments: parsed.moments || [],
          tip: parsed.tip || '',
          chemistry: parsed.chemistry || '',
        });
      } catch {
        setStoryResult({ todayVibe: '', story: data.text, moments: [], tip: '', chemistry: '' });
      }
    } catch (fetchErr) {
      console.error('[CompatPage] fetch error:', fetchErr?.message);
      setStoryResult({
        todayVibe: '',
        story: '두 사람의 이야기를 불러오는 데 실패했어요. 잠시 후 다시 시도해봐요 🌙',
        moments: [], tip: '', chemistry: ''
      });
    } finally {
      clearTimeout(timeout);
      storyLoadingRef.current = false;
      setStoryLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="inner">
        <div className="compat-page">
          <div className="compat-header">
            <div className="compat-title">1대1 별숨 💞</div>
            <div className="compat-sub">두 사람의 사주와 별자리 기운으로<br />두 별의 인연을 읽어드려요</div>
          </div>

          {/* 두 사람 */}
          <div className="compat-section">
            <div className="compat-label">두 사람</div>
            {recentPartners.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 6 }}>최근 비교한 사람</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {recentPartners.map((p, i) => (
                    <button key={`${p.name}-${p.by}-${i}`}
                      onClick={() => setPartner({ name: p.name || '', by: p.by || '', bm: p.bm || '', bd: p.bd || '', gender: p.gender || '' })}
                      style={{ padding: '5px 10px', borderRadius: 20, border: '1px solid var(--line)', background: 'var(--bg2)', color: 'var(--t2)', fontSize: 'var(--xs)', cursor: 'pointer' }}>
                      {p.name || '이름없음'} ({p.by}년)
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="person-cards">
              <div className="person-card a-card">
                <span className="person-badge a">나 (A)</span>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>
                  <div>{myForm.name || '나'} · {+new Date().getFullYear() - +myForm.by}세</div>
                  {mySun && <div>{mySun.s} {mySun.n}</div>}
                  {mySaju && <div>{ON[mySaju.dom]} 기운</div>}
                </div>
              </div>
              <div className="person-card b-card">
                <span className="person-badge b">상대 (B)</span>
                <input className="inp" placeholder="이름(선택)" value={partner.name}
                  onChange={e => setPartner(p => ({ ...p, name: e.target.value }))}
                  style={{ marginBottom: 6, padding: '7px 10px', fontSize: 'var(--xs)' }} />
                <div className="row" style={{ gap: 4 }}>
                  <input className="inp" placeholder="년도" inputMode="numeric"
                    value={partner.by} onChange={e => setPartner(p => ({ ...p, by: e.target.value.replace(/\D/, '').slice(0, 4) }))}
                    style={{ marginBottom: 0, padding: '7px 6px', fontSize: 'var(--xs)' }} />
                  <select className="inp" value={partner.bm} onChange={e => { const nm = e.target.value; const max = getDaysInMonth(partner.by, nm); setPartner(p => ({ ...p, bm: nm, bd: p.bd && parseInt(p.bd) > max ? '' : p.bd })); }}
                    style={{ marginBottom: 0, padding: '7px 4px', fontSize: 'var(--xs)' }}>
                    <option value="">월</option>{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <select className="inp" value={partner.bd} onChange={e => setPartner(p => ({ ...p, bd: e.target.value }))}
                    style={{ marginBottom: 0, padding: '7px 4px', fontSize: 'var(--xs)' }}>
                    <option value="">일</option>{[...Array(getDaysInMonth(partner.by, partner.bm))].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </div>
                <div className="gender-group" style={{ marginTop: 6, marginBottom: 0 }}>
                  {['여성', '남성', '기타'].map(g => (
                    <button key={g} className={`gbtn ${partner.gender === g ? 'on' : ''}`}
                      onClick={() => setPartner(p => ({ ...p, gender: g }))}
                      style={{ padding: '6px 4px', fontSize: 'var(--xs)' }}>{g}</button>
                  ))}
                </div>
                {partnerSaju && (
                  <div style={{ marginTop: 8, fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
                    {partnerSun && <span>{partnerSun.s} {partnerSun.n} · </span>}
                    {ON[partnerSaju.dom]} 기운
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 궁합 점수 (상대 입력 시) */}
          {partnerOk && (
            <div className="compat-total" style={{ marginBottom: 'var(--sp2)' }}>
              <div className="compat-total-label">✦ 두 별의 공명 지수</div>
              <div className="kizmet-score">{compatScore}%</div>
              <div className="kizmet-bar"><div className="kizmet-fill" style={{ width: `${compatScore}%` }} /></div>
              {mySaju && partnerSaju && (
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>
                  {ON[mySaju.dom]} 기운 × {ON[partnerSaju.dom]} 기운
                </div>
              )}
            </div>
          )}

          {/* 별의 인연 읽기 */}
          <button
            className="btn-main"
            disabled={!partnerOk || storyLoading}
            onClick={runStory}
            style={{ marginBottom: 8 }}
          >
            {storyLoading ? '두 별의 인연을 읽고 있어요...' : '별숨에게 두 별의 인연 풀어보기 ✦'}
          </button>

          {/* 이야기 결과 */}
          {storyResult && (
            <div style={{
              background: 'var(--bg2)',
              borderRadius: 'var(--r1)',
              padding: 'var(--sp2)',
              marginBottom: 'var(--sp2)',
              border: '1px solid rgba(180,140,50,0.18)',
            }}>
              {storyLoading ? (
                <div className="scenario-loading">
                  <div className="scenario-typing-dots"><span /><span /><span /></div>
                  두 별의 인연을 읽고 있어요...
                </div>
              ) : (
                <>
                  {storyResult.todayVibe && (
                    <div style={{
                      fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--gold)',
                      marginBottom: 12, paddingBottom: 10,
                      borderBottom: '1px solid rgba(180,140,50,0.15)',
                    }}>
                      ✦ {storyResult.todayVibe}
                    </div>
                  )}
                  {storyResult.story && (
                    <div style={{
                      fontSize: 'var(--sm)', color: 'var(--t2)',
                      lineHeight: 1.85, marginBottom: 14, whiteSpace: 'pre-line',
                    }}>
                      {storyResult.story}
                    </div>
                  )}
                  {storyResult.moments?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 8 }}>
                        ✦ 별숨이 본 핵심 포인트
                      </div>
                      {storyResult.moments.map((m, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          marginBottom: i < storyResult.moments.length - 1 ? 8 : 0,
                          fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.65,
                        }}>
                          <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }}>✦</span>
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {storyResult.chemistry && (
                    <div style={{
                      fontSize: 'var(--xs)', color: 'var(--t3)', fontStyle: 'italic',
                      marginBottom: storyResult.tip ? 10 : 0,
                      paddingTop: 8, borderTop: '1px solid rgba(180,140,50,0.12)',
                    }}>
                      {storyResult.chemistry}
                    </div>
                  )}
                  {storyResult.tip && (
                    <div style={{
                      background: 'rgba(180,140,50,0.08)', borderRadius: 'var(--r1)',
                      padding: '10px 14px', fontSize: 'var(--sm)', color: 'var(--t2)',
                      lineHeight: 1.65, borderLeft: '3px solid var(--gold)', marginTop: 4,
                    }}>
                      💡 {storyResult.tip}
                    </div>
                  )}
                  {shareResult && storyResult.story && (
                    <button
                      className="res-top-btn primary"
                      style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 'var(--r1)', fontSize: 'var(--xs)' }}
                      onClick={() => shareResult('compat', storyResult.story?.slice(0, 100), `${myForm.name || '나'} × ${partner.name || '상대'}`)}
                    >
                      ↗ 공유하기
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <button className="res-btn" style={{ width: '100%', marginTop: 8 }} onClick={onBack}>← 돌아가기</button>
        </div>
      </div>
    </div>
  );
}
