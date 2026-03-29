import { useState, useEffect, useRef } from "react";
import { DAILY_QUESTIONS, PROFILE_QUESTIONS_IDS } from "../utils/constants.js";

// 20문 20답용 질문 목록 (DAILY_QUESTIONS에서 선별)
const PROFILE_QS = DAILY_QUESTIONS.filter(q => PROFILE_QUESTIONS_IDS.includes(q.id));

// profile.qa_answers 에서 answered count 계산
function countAnswered(qa) {
  if (!qa) return 0;
  return Object.keys(qa).length;
}

// ═══════════════════════════════════════════════════════════
//  👤 별숨에게 나를 알려주기 — 20문 20답
// ═══════════════════════════════════════════════════════════
export default function ProfileModal({ profile, setProfile, onClose, user, saveUserProfileExtra }) {
  // qa_answers: { [questionId]: answerString }
  const [qa, setQa] = useState(() => {
    try { return profile?.qa_answers ? { ...profile.qa_answers } : {}; } catch { return {}; }
  });
  const [currentIdx, setCurrentIdx] = useState(() => {
    // 마지막으로 답한 질문 다음부터 시작
    try {
      const existing = profile?.qa_answers ? { ...profile.qa_answers } : {};
      const lastAnsweredIdx = PROFILE_QS.reduce((acc, q, i) => existing[q.id] ? i : acc, -1);
      return Math.min(lastAnsweredIdx + 1, PROFILE_QS.length - 1);
    } catch { return 0; }
  });
  const [textInput, setTextInput] = useState('');
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiQa, setAiQa] = useState({});
  const [aiIdx, setAiIdx] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'ai' | 'done'
  const sheetRef = useRef(null);

  const answeredCount = countAnswered(qa);
  const totalQ = PROFILE_QS.length;
  const currentQ = PROFILE_QS[currentIdx];
  const allPresetDone = answeredCount >= totalQ;

  // ── 포커스 트랩 ──
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const focusable = () => [...el.querySelectorAll('button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(n => !n.disabled);
    const first = focusable()[0];
    first?.focus();
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === items[0]) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); items[0].focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  // 텍스트 입력 초기화 (질문 바뀔 때)
  useEffect(() => {
    const q = PROFILE_QS[currentIdx];
    if (q) setTextInput(qa[q.id] || '');
  }, [currentIdx]);

  const saveAndApply = (updatedQa) => {
    // qa_answers를 profile 필드에도 매핑
    const mapped = { qa_answers: updatedQa };
    PROFILE_QS.forEach(q => {
      if (q.field && updatedQa[q.id]) mapped[q.field] = updatedQa[q.id];
    });
    const newProfile = { ...profile, ...mapped };
    setProfile(newProfile);
    if (user && saveUserProfileExtra) saveUserProfileExtra(newProfile, user);
  };

  const answerChip = (val) => {
    const q = PROFILE_QS[currentIdx];
    const updatedQa = { ...qa, [q.id]: val };
    setQa(updatedQa);
    saveAndApply(updatedQa);
    if (currentIdx < totalQ - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      // 20개 완성 → AI 질문 단계
      triggerAiQuestions(updatedQa);
    }
  };

  const answerText = () => {
    const val = textInput.trim();
    if (!val) return;
    const q = PROFILE_QS[currentIdx];
    const updatedQa = { ...qa, [q.id]: val };
    setQa(updatedQa);
    saveAndApply(updatedQa);
    setTextInput('');
    if (currentIdx < totalQ - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      triggerAiQuestions(updatedQa);
    }
  };

  const triggerAiQuestions = async (finalQa) => {
    setAiLoading(true);
    setPhase('ai');
    try {
      // 답변 요약 컨텍스트 생성
      const summary = PROFILE_QS.map(q => `${q.q} → ${finalQa[q.id] || '(미답변)'}`).join('\n');
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: `사용자의 20가지 답변을 읽고, 이 사람에게 맞춤형 심층 질문 5개를 JSON 배열로만 답해주세요.
          형식: [{"id":"aq_1","q":"질문 내용"},...]
          각 질문은 사주와 별자리 관점에서 더 깊이 이해하기 위한 것으로, 개인적이고 구체적으로 만들어주세요.

          사용자 답변:
          ${summary}`,
          isProfileQuestion: true,
          clientHour: new Date().getHours(),
        }),
      });
      const data = await res.json();
      try {
        const raw = data.text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAiQuestions(parsed);
        } else {
          setPhase('done');
        }
      } catch {
        setPhase('done');
      }
    } catch {
      setPhase('done');
    } finally {
      setAiLoading(false);
    }
  };

  const answerAiChipOrText = (val) => {
    const q = aiQuestions[aiIdx];
    if (!q) return;
    const updatedAiQa = { ...aiQa, [q.id]: val };
    setAiQa(updatedAiQa);
    // AI 답변도 profile qa_answers에 병합 저장
    const mergedQa = { ...qa, ...updatedAiQa };
    saveAndApply(mergedQa);
    if (aiIdx < aiQuestions.length - 1) {
      setAiIdx(i => i + 1);
      setTextInput('');
    } else {
      setPhase('done');
    }
  };

  const skipQuestion = () => {
    if (phase === 'quiz') {
      if (currentIdx < totalQ - 1) setCurrentIdx(i => i + 1);
      else triggerAiQuestions(qa);
    } else if (phase === 'ai') {
      if (aiIdx < aiQuestions.length - 1) { setAiIdx(i => i + 1); setTextInput(''); }
      else setPhase('done');
    }
  };

  const goBack = () => {
    if (phase === 'quiz' && currentIdx > 0) {
      setCurrentIdx(i => i - 1);
    } else if (phase === 'ai' && aiIdx > 0) {
      setAiIdx(i => i - 1);
      setTextInput('');
    }
  };

  // ── 완료 화면 ──
  if (phase === 'done') {
    return (
      <div className="profile-overlay" role="dialog" aria-modal="true" aria-label="별숨에게 나를 알려주기"
        onClick={e => { if (e.target.className === 'profile-overlay') onClose(); }}>
        <div className="profile-sheet" ref={sheetRef} style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✦</div>
          <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>
            별숨이 이제 당신을 잘 알아요
          </div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.8, marginBottom: 32 }}>
            {answeredCount}개의 이야기를 들었어요.<br />
            앞으로 모든 운세에 자동으로 반영될 거예요.
          </div>
          <button className="profile-save-btn" onClick={onClose}>
            별숨에게 물어보러 가기 ✦
          </button>
          <button className="profile-close-btn" onClick={() => { setPhase('quiz'); setCurrentIdx(0); }}>
            처음부터 다시 하기
          </button>
        </div>
      </div>
    );
  }

  // ── AI 질문 로딩 ──
  if (phase === 'ai' && aiLoading) {
    return (
      <div className="profile-overlay" role="dialog" aria-modal="true" aria-label="별숨에게 나를 알려주기"
        onClick={e => { if (e.target.className === 'profile-overlay') onClose(); }}>
        <div className="profile-sheet" ref={sheetRef} style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>🌟</div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8 }}>
            별숨이 당신만을 위한<br />맞춤 질문을 만들고 있어요...
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--gold)', opacity: 0.6,
                animation: `orbPulse 1.2s ease-in-out ${i * 0.3}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── AI 맞춤 질문 단계 ──
  const activeQ = phase === 'ai' ? aiQuestions[aiIdx] : currentQ;
  const activeIdx = phase === 'ai' ? aiIdx : currentIdx;
  const activeTotal = phase === 'ai' ? aiQuestions.length : totalQ;
  const progressPct = phase === 'ai'
    ? 100 + ((aiIdx / aiQuestions.length) * 0)  // AI 단계는 100% 이후
    : Math.round((answeredCount / totalQ) * 100);

  if (!activeQ) {
    // 데이터 없으면 닫기
    return null;
  }

  return (
    <div className="profile-overlay" role="dialog" aria-modal="true" aria-label="별숨에게 나를 알려주기"
      onClick={e => { if (e.target.className === 'profile-overlay') onClose(); }}>
      <div className="profile-sheet" ref={sheetRef}>
        <div className="profile-handle" />

        {/* 헤더 */}
        <div style={{ padding: '0 4px 16px', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="profile-title" style={{ marginBottom: 0 }}>
              {phase === 'ai' ? '✦ 맞춤 질문' : '✦ 별숨에게 나를 알려주기'}
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
              {phase === 'ai'
                ? `${aiIdx + 1} / ${aiQuestions.length}`
                : `${Math.min(activeIdx + 1, totalQ)} / ${totalQ}`}
            </div>
          </div>
          {/* 진행 바 */}
          <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: phase === 'ai' ? 'linear-gradient(90deg, var(--gold), #C4A8D8)' : 'var(--gold)',
              width: phase === 'ai'
                ? `${Math.round(((aiIdx + 1) / aiQuestions.length) * 100)}%`
                : `${Math.round((Math.min(activeIdx + 1, totalQ) / totalQ) * 100)}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
          {phase === 'ai' && (
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginTop: 6, fontWeight: 600 }}>
              🌟 별숨이 당신만을 위해 준비한 질문이에요
            </div>
          )}
        </div>

        {/* 질문 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.6, marginBottom: 6 }}>
            {activeQ.q}
          </div>
          {activeQ.sub && (
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6 }}>
              {activeQ.sub}
            </div>
          )}
        </div>

        {/* 이미 답한 경우 표시 */}
        {phase === 'quiz' && qa[activeQ.id] && (
          <div style={{
            padding: '8px 12px', background: 'var(--goldf)',
            borderRadius: 'var(--r1)', border: '1px solid var(--acc)',
            fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 12,
          }}>
            ✦ 이전 답변: {qa[activeQ.id]}
          </div>
        )}

        {/* 칩 선택 */}
        {(activeQ.type === 'chips' || activeQ.type === 'mixed') && activeQ.chips && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: activeQ.type === 'mixed' ? 12 : 0 }}>
            {activeQ.chips.map(chip => {
              const isSelected = (phase === 'quiz' ? qa[activeQ.id] : aiQa[activeQ.id]) === chip;
              return (
                <button key={chip}
                  onClick={() => phase === 'quiz' ? answerChip(chip) : answerAiChipOrText(chip)}
                  style={{
                    padding: '8px 14px', borderRadius: 20,
                    border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--line)'}`,
                    background: isSelected ? 'var(--goldf)' : 'transparent',
                    color: isSelected ? 'var(--gold)' : 'var(--t2)',
                    fontSize: 'var(--sm)', fontFamily: 'var(--ff)',
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer', transition: 'all .15s',
                  }}>
                  {chip}
                </button>
              );
            })}
          </div>
        )}

        {/* 텍스트 입력 */}
        {(activeQ.type === 'text' || activeQ.type === 'mixed') && (
          <div style={{ marginTop: activeQ.type === 'mixed' ? 0 : 0 }}>
            <textarea
              className="diy-inp"
              placeholder={activeQ.placeholder || '자유롭게 적어주세요'}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); answerText(); } }}
              style={{ height: 80, marginBottom: 8 }}
            />
            <button
              className="btn-main"
              disabled={!textInput.trim()}
              onClick={() => phase === 'quiz' ? answerText() : answerAiChipOrText(textInput.trim())}
              style={{ width: '100%' }}
            >
              이렇게 답할게요 →
            </button>
          </div>
        )}

        {/* 건너뛰기 / 뒤로 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {((phase === 'quiz' && currentIdx > 0) || (phase === 'ai' && aiIdx > 0)) && (
            <button onClick={goBack}
              style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
              ← 이전
            </button>
          )}
          <button onClick={skipQuestion}
            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
            {phase === 'ai' && aiIdx === aiQuestions.length - 1 ? '완료' : '다음에 할게요 →'}
          </button>
        </div>

        <button className="profile-close-btn" onClick={onClose} style={{ marginTop: 8 }}>
          나중에 할게요
        </button>
      </div>
    </div>
  );
}
