import { useState, useMemo, useCallback } from "react";
import { getSaju, ON } from "../utils/saju.js";
import { getSun } from "../utils/astrology.js";
import { PLACES } from "../utils/constants.js";

// ═══════════════════════════════════════════════════════════
//  💞 시나리오 궁합 페이지
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
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: `[요청] 두 사람이 ${placeObj.label}에 갔을 때의 짧은 대화 시나리오를 써주세요.

규칙:
- A(${myForm.name || '나'})와 B(${partner.name || '상대'})가 번갈아가며 자연스럽게 대화
- 반드시 A→B→A→B 순으로 번갈아 말함 (한 사람이 연속으로 말하면 안 됨)
- JSON 객체로만 응답: {"bubbles":[{"who":"A","text":"..."},{"who":"B","text":"..."},...],"summary":"총평","reason":"설명"}
- 두 사람의 기질 차이가 자연스럽게 드러남
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
        // 새 형식 (객체) 또는 구 형식 (배열) 모두 지원
        if (Array.isArray(parsed)) {
          setResult({
            bubbles: parsed.filter(b => b.who),
            summary: parsed.find(b => b.summary)?.summary || '',
            reason: '',
          });
        } else {
          setResult({
            bubbles: (parsed.bubbles || []).filter(b => b.who),
            summary: parsed.summary || '',
            reason: parsed.reason || '',
          });
        }
      } catch {
        setResult({ bubbles: [{ who: 'A', text: data.text }], summary: '', reason: '' });
      }
    } catch {
      setResult({ bubbles: [{ who: 'A', text: '별이 잠시 쉬고 있어요 🌙 다시 시도해봐요!' }], summary: '', reason: '' });
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
            <div className="compat-sub">{selectedPlace.label}에서 만났을 때</div>
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
            {loading ? (
              <div className="scenario-loading">
                <div className="scenario-typing-dots"><span /><span /><span /></div>
                두 별의 이야기를 쓰고 있어요...
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

                {/* 설명 섹션 (타이핑 애니메이션 없이 바로 표시) */}
                {result?.reason && !loading && (
                  <div style={{
                    marginTop: 'var(--sp2)',
                    padding: 'var(--sp2) var(--sp2)',
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
            <div className="compat-title">우리가 만나면 💞</div>
            <div className="compat-sub">상대방의 생년월일을 입력하면<br />두 별이 만나는 장면을 보여드려요</div>
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
            <div className="compat-label">어디서 만날까요?</div>
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
            {loading ? '두 별이 만나는 중...' : '✦ 시나리오 보기'}
          </button>
          <button className="res-btn" style={{ width: '100%', marginTop: 8 }} onClick={onBack}>← 돌아가기</button>
        </div>
      </div>
    </div>
  );
}
