import { useState, useMemo } from "react";
import { getSaju, ON } from "../utils/saju.js";
import { getSun } from "../utils/astrology.js";
import { PLACES } from "../utils/constants.js";

// ═══════════════════════════════════════════════════════════
//  💞 오늘 우리가 만나면 — 시나리오 궁합 페이지
// ═══════════════════════════════════════════════════════════
export default function CompatPage({ myForm, mySaju, mySun, callApi, buildCtx, onBack, shareResult, saveCompatImage }) {
  const [partner, setPartner] = useState({ name: '', by: '', bm: '', bd: '', gender: '' });
  const [place, setPlace] = useState('burger');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('input');

  const partnerSaju = useMemo(() => (partner.by && partner.bm && partner.bd) ? getSaju(+partner.by, +partner.bm, +partner.bd, 12) : null, [partner]);
  const partnerSun = useMemo(() => (partner.bm && partner.bd) ? getSun(+partner.bm, +partner.bd) : null, [partner.bm, partner.bd]);
  const partnerOk = partner.by && partner.bm && partner.bd && partner.gender;
  const selectedPlace = PLACES.find(p => p.id === place) || PLACES[0];

  const compatScore = useMemo(() => {
    if (!mySaju || !partnerSaju) return 75;
    const SENG = { 목: ['수', '목'], 화: ['목', '화'], 토: ['화', '토'], 금: ['토', '금'], 수: ['금', '수'] };
    const a = mySaju.dom, b = partnerSaju.dom;
    if (SENG[a]?.includes(b) || SENG[b]?.includes(a)) return Math.floor(Math.random() * 15) + 80;
    if (a === b) return Math.floor(Math.random() * 10) + 75;
    return Math.floor(Math.random() * 20) + 60;
  }, [mySaju, partnerSaju]);

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

  const run = async () => {
    setLoading(true);
    setPhase('result');
    setResult(null);
    const placeObj = PLACES.find(p => p.id === place) || PLACES[0];
    const now = new Date();
    const todayStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][now.getDay()]}요일)`;

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: `[오늘 우리가 만나면] 두 사람이 오늘 ${placeObj.label}에서 만났을 때의 시나리오를 써주세요.

오늘: ${todayStr}

규칙:
- A(${myForm.name || '나'})와 B(${partner.name || '상대'})가 번갈아가며 자연스럽게 대화
- 반드시 A→B→A→B 순으로 번갈아 말함 (한 사람이 연속으로 말하면 안 됨)
- JSON 객체로만 응답: {"topic":"오늘 두 사람 대화의 핵심 장면 (구체적 상황, 20자 이내)","bubbles":[{"who":"A","text":"..."},{"who":"B","text":"..."},...],"todayEvents":["오늘 두 사람이 함께 겪을 구체적 상황 1","상황 2","상황 3"],"recommendedFood":"추천 음식 이름 + 한 줄 이유","recommendedPlace":"추천 데이트 장소 이름 + 한 줄 이유","summary":"총평","reason":"설명"}
- 두 사람의 성격 차이를 설명하지 말고 말 한마디와 반응으로 직접 보여줄 것
- 웃음 포인트 1개, 공감 포인트 1개
- reason에는 왜 이런 대화가 일어났는지 사주와 별자리를 바탕으로 쉽게 설명 (존댓말)`,
          context: buildPartnerCtx(),
          isChat: false, isReport: false, isScenario: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      try {
        const raw = data.text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setResult({
            bubbles: parsed.filter(b => b.who),
            summary: parsed.find(b => b.summary)?.summary || '',
            reason: '',
            topic: '',
            todayEvents: [],
            recommendedFood: '',
            recommendedPlace: '',
          });
        } else {
          setResult({
            bubbles: (parsed.bubbles || []).filter(b => b.who),
            summary: parsed.summary || '',
            reason: parsed.reason || '',
            topic: parsed.topic || '',
            todayEvents: parsed.todayEvents || [],
            recommendedFood: parsed.recommendedFood || '',
            recommendedPlace: parsed.recommendedPlace || '',
          });
        }
      } catch {
        setResult({ bubbles: [{ who: 'A', text: data.text }], summary: '', reason: '', topic: '', todayEvents: [], recommendedFood: '', recommendedPlace: '' });
      }
    } catch {
      setResult({ bubbles: [{ who: 'A', text: '별이 잠시 쉬고 있어요 🌙 다시 시도해봐요!' }], summary: '', reason: '', topic: '', todayEvents: [], recommendedFood: '', recommendedPlace: '' });
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'result') {
    return (
      <div className="page-top">
        <div className="compat-page">
          <div className="compat-header">
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{selectedPlace.emoji}</div>
            <div className="compat-title">{myForm.name || '나'} × {partner.name || '상대'}</div>
            <div className="compat-sub">{selectedPlace.label}에서 만난다면</div>
          </div>

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

          <div className="scenario-wrap">
            <div className="scenario-header">
              <span className="scenario-place-icon">{selectedPlace.emoji}</span>
              <div>
                <div className="scenario-place-name">{selectedPlace.label} 시나리오</div>
                <div className="scenario-sub">{myForm.name || 'A'} × {partner.name || 'B'}</div>
              </div>
            </div>

            {/* 오늘의 대화 주제 */}
            {result?.topic && !loading && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(180,140,50,0.08)',
                borderRadius: 'var(--r1)',
                marginBottom: 'var(--sp2)',
                fontSize: 'var(--sm)',
                color: 'var(--t2)',
                borderLeft: '3px solid var(--gold)',
                lineHeight: 1.6,
              }}>
                <span style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, display: 'block', marginBottom: 4 }}>오늘의 장면</span>
                {result.topic}
              </div>
            )}

            {loading ? (
              <div className="scenario-loading">
                <div className="scenario-typing-dots"><span /><span /><span /></div>
                오늘의 이야기를 쓰고 있어요...
              </div>
            ) : (
              <>
                <div className="bubble-list">
                  {result?.bubbles.map((b, i) => (
                    <div key={i} className={`bubble-row ${b.who === 'B' ? 'b-row' : 'a-row'}`} style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className={`bubble-avatar ${b.who === 'B' ? 'b-av' : 'a-av'}`}>
                        {b.who === 'A' ? (myForm.name || 'A').slice(0, 1) : (partner.name || 'B').slice(0, 1)}
                      </div>
                      <div>
                        <div className="bubble-name">{b.who === 'A' ? myForm.name || 'A' : partner.name || 'B'}</div>
                        <div className="bubble-text">{b.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {result?.summary && (
                  <div className="scenario-summary">✦ {result.summary}</div>
                )}

                {/* 오늘 두 사람에게 일어날 일 */}
                {result?.todayEvents?.length > 0 && (
                  <div style={{
                    marginTop: 'var(--sp2)',
                    padding: 'var(--sp2)',
                    background: 'var(--bg2)',
                    borderRadius: 'var(--r1)',
                  }}>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 10 }}>
                      ✦ 오늘 두 사람에게 일어날 일
                    </div>
                    {result.todayEvents.map((event, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        marginBottom: i < result.todayEvents.length - 1 ? 10 : 0,
                        fontSize: 'var(--sm)',
                        color: 'var(--t2)',
                        lineHeight: 1.65,
                      }}>
                        <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }}>✦</span>
                        <span>{event}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 오늘 가까이 하면 좋은 것 */}
                {(result?.recommendedFood || result?.recommendedPlace) && (
                  <div style={{
                    marginTop: 'var(--sp2)',
                    padding: 'var(--sp2)',
                    background: 'var(--bg2)',
                    borderRadius: 'var(--r1)',
                  }}>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 10 }}>
                      ✦ 오늘 가까이 하면 좋은 것
                    </div>
                    {result.recommendedFood && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginBottom: result.recommendedPlace ? 10 : 0,
                        fontSize: 'var(--sm)',
                        color: 'var(--t2)',
                        lineHeight: 1.65,
                      }}>
                        <span style={{ flexShrink: 0 }}>🍽</span>
                        <span>{result.recommendedFood}</span>
                      </div>
                    )}
                    {result.recommendedPlace && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: 'var(--sm)',
                        color: 'var(--t2)',
                        lineHeight: 1.65,
                      }}>
                        <span style={{ flexShrink: 0 }}>📍</span>
                        <span>{result.recommendedPlace}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 왜 이런 대화가 이뤄졌을까요 */}
                {result?.reason && (
                  <div style={{
                    marginTop: 'var(--sp2)',
                    padding: 'var(--sp2)',
                    background: 'var(--bg2)',
                    borderRadius: 'var(--r1)',
                    borderLeft: '3px solid var(--gold)',
                  }}>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 8 }}>
                      ✦ 왜 이런 대화가 이뤄졌을까요?
                    </div>
                    <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.75 }}>
                      {result.reason}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 저장 / 공유 버튼 */}
          {!loading && result && (
            <div style={{ display: 'flex', gap: 8, marginTop: 'var(--sp2)' }}>
              {saveCompatImage && (
                <button
                  className="res-top-btn"
                  style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)', fontSize: 'var(--xs)' }}
                  onClick={() => saveCompatImage(result, myForm, partner, selectedPlace, compatScore)}
                >
                  🖼 이미지 저장
                </button>
              )}
              {shareResult && (
                <button
                  className="res-top-btn primary"
                  style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)', fontSize: 'var(--xs)' }}
                  onClick={() => shareResult('compat', result?.summary, `${myForm.name || '나'} × ${partner.name || '상대'}`)}
                >
                  ↗ 공유하기
                </button>
              )}
            </div>
          )}

          <div className="compat-btns">
            <button className="res-btn" style={{ flex: 1 }} onClick={() => { setPhase('input'); setResult(null); }}>↩ 다시 하기</button>
            <button className="res-btn" style={{ flex: 1 }} onClick={onBack}>← 결과로</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="inner">
        <div className="compat-page">
          <div className="compat-header">
            <div className="compat-title">오늘 우리가 만나면 💞</div>
            <div className="compat-sub">오늘의 사주와 별자리 기운으로<br />두 사람이 만나면 어떤 일이 펼쳐질지 보여드려요</div>
          </div>

          <div className="compat-section">
            <div className="compat-label">두 사람</div>
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
                  <input className="inp" placeholder="년도" maxLength={4} inputMode="numeric"
                    value={partner.by} onChange={e => setPartner(p => ({ ...p, by: e.target.value.replace(/\D/, '') }))}
                    style={{ marginBottom: 0, padding: '7px 6px', fontSize: 'var(--xs)' }} />
                  <select className="inp" value={partner.bm} onChange={e => setPartner(p => ({ ...p, bm: e.target.value }))}
                    style={{ marginBottom: 0, padding: '7px 4px', fontSize: 'var(--xs)' }}>
                    <option value="">월</option>{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <select className="inp" value={partner.bd} onChange={e => setPartner(p => ({ ...p, bd: e.target.value }))}
                    style={{ marginBottom: 0, padding: '7px 4px', fontSize: 'var(--xs)' }}>
                    <option value="">일</option>{[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </div>
                <div className="gender-group" style={{ marginTop: 6, marginBottom: 0 }}>
                  {['여성', '남성', '기타'].map(g => (
                    <button key={g} className={`gbtn ${partner.gender === g ? 'on' : ''}`}
                      onClick={() => setPartner(p => ({ ...p, gender: g }))}
                      style={{ padding: '6px 4px', fontSize: 'var(--xs)' }}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="compat-section">
            <div className="compat-label">오늘 여기서 만난다면?</div>
            <div className="place-grid">
              {PLACES.map(p => (
                <button key={p.id} className={`place-btn ${place === p.id ? 'on' : ''}`} onClick={() => setPlace(p.id)}>
                  <span className="place-emoji">{p.emoji}</span>
                  <span className="place-label">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="btn-main" disabled={!partnerOk || loading} onClick={run}>
            {loading ? '오늘의 이야기를 쓰고 있어요...' : '✦ 오늘의 만남 보기'}
          </button>
          <button className="res-btn" style={{ width: '100%', marginTop: 8 }} onClick={onBack}>← 돌아가기</button>
        </div>
      </div>
    </div>
  );
}
