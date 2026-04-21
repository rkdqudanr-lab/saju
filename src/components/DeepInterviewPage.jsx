/**
 * DeepInterviewPage — 별숨 심층 인터뷰 (step 6)
 * AI가 사주·별자리 기반 맞춤 질문 10개를 생성 →
 * 유저가 답변 → AI가 깊고 길게 분석
 */

import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { ReportBody } from './AccItem.jsx';
import { exportReadingAsTxt } from '../utils/constants.js';

// ── JSON 배열 robust 파싱 ───────────────────────────────────────
function parseQuestions(raw) {
  if (!raw) return null;
  // 1) 직접 JSON 파싱
  try {
    const arr = JSON.parse(raw.trim());
    if (Array.isArray(arr) && arr.length >= 3) return arr.map(String);
  } catch {}
  // 2) JSON 배열 패턴 추출
  const m = raw.match(/\[[\s\S]*?\]/);
  if (m) {
    try {
      const arr = JSON.parse(m[0]);
      if (Array.isArray(arr) && arr.length >= 3) return arr.map(String);
    } catch {}
  }
  // 3) 번호 목록으로 파싱 ("1. 질문" 또는 "1) 질문")
  const lines = raw.split('\n')
    .map(l => l.replace(/^[\d]+[.)]\s*/, '').replace(/^["']|["']$/g, '').trim())
    .filter(l => l.length > 5 && l.endsWith('?') || l.length > 8);
  if (lines.length >= 3) return lines.slice(0, 10);
  return null;
}

// ── 진행 바 ────────────────────────────────────────────────────
function ProgressBar({ value, max }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: 'var(--gold)',
        borderRadius: 2,
        transition: 'width .3s ease',
      }} />
    </div>
  );
}

// ── 질문 카드 ──────────────────────────────────────────────────
function QuestionCard({ index, question, answer, onChange, focused, onFocus }) {
  const filled = answer.trim().length > 0;
  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1.5px solid ${focused ? 'var(--acc)' : filled ? 'rgba(232,176,72,0.3)' : 'var(--line)'}`,
      borderRadius: 'var(--r2, 16px)',
      padding: '16px',
      transition: 'border-color .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: filled ? 'var(--goldf)' : 'var(--bg3)',
          border: `1.5px solid ${filled ? 'var(--acc)' : 'var(--line)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700,
          color: filled ? 'var(--gold)' : 'var(--t4)',
          transition: 'all .2s',
        }}>
          {filled ? '✓' : index + 1}
        </div>
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.6, fontWeight: filled ? 500 : 400 }}>
          {question}
        </div>
      </div>
      <textarea
        value={answer}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="자유롭게 솔직하게 답해봐요 ✦"
        maxLength={300}
        style={{
          width: '100%', minHeight: 72, resize: 'vertical',
          background: 'var(--bg1)', border: '1px solid var(--line)',
          borderRadius: 'var(--r1)', padding: '10px 12px',
          fontFamily: 'var(--ff)', fontSize: 'var(--xs)',
          color: 'var(--t1)', lineHeight: 1.7,
          outline: 'none', boxSizing: 'border-box',
        }}
      />
      <div style={{ fontSize: '10px', color: 'var(--t4)', textAlign: 'right', marginTop: 4 }}>
        {answer.length}/300
      </div>
    </div>
  );
}

// ── 로딩 화면 ──────────────────────────────────────────────────
function LoadingCard({ message }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', gap: 20,
    }}>
      <div style={{ position: 'relative', width: 60, height: 60 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          border: '2.5px solid var(--line)', borderTopColor: 'var(--gold)',
          animation: 'orbSpin .9s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
        }}>✦</div>
      </div>
      <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', textAlign: 'center', lineHeight: 1.8 }}>
        {message}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="dsc-loading-dot" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function DeepInterviewPage({
  form, today,
  callApi,
  shareResult,
  saveReportImage,
}) {
  const setStep = useAppStore(s => s.setStep);
  const user    = useAppStore(s => s.user);

  // phase: 'idle' | 'generating' | 'answering' | 'analyzing' | 'result'
  const [phase, setPhase] = useState('idle');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(Array(10).fill(''));
  const [focusedIdx, setFocusedIdx] = useState(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const topRef = useRef(null);

  const filledCount = answers.filter((a, i) => i < questions.length && a.trim().length > 0).length;
  const totalQ = questions.length || 10;
  const canSubmit = filledCount >= Math.ceil(totalQ * 0.7); // 70% 이상 답변 시 제출 가능

  const handleGenerateQuestions = useCallback(async () => {
    if (!callApi) return;
    setPhase('generating');
    setError('');
    try {
      const prompt = `[시스템 지시: 반드시 JSON 배열만 출력. 다른 설명 텍스트 없이.]
이 사람의 사주와 별자리를 바탕으로, 마치 처음 만나 깊이 알아가듯 개인화된 질문 10개를 만들어줘.
출력 형식: ["질문1", "질문2", "질문3", "질문4", "질문5", "질문6", "질문7", "질문8", "질문9", "질문10"]
조건:
- 이 사람의 일간·오행 강약·태양별자리 특성이 반영된 질문
- 관계/사랑, 일/목표, 감정/내면, 가치관, 두려움, 꿈 영역 골고루 포함
- 단답 아닌 자기 성찰이 담길 수 있는 깊이 있는 질문
- 구체적이고 개인적인 느낌 (일반적인 설문지 느낌 X)
- 모든 질문은 반드시 한국어, 물음표(?)로 끝낼 것`;

      const raw = await callApi(prompt, { isChat: true });
      const qs = parseQuestions(raw);

      if (!qs || qs.length < 3) {
        // fallback: 기본 질문 세트
        setQuestions(FALLBACK_QUESTIONS);
        setAnswers(Array(FALLBACK_QUESTIONS.length).fill(''));
      } else {
        setQuestions(qs);
        setAnswers(Array(qs.length).fill(''));
      }
      setPhase('answering');
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      setError('질문 생성 중 오류가 발생했어요. 다시 시도해봐요.');
      setPhase('idle');
    }
  }, [callApi]);

  const handleSubmitAnswers = useCallback(async () => {
    if (!callApi || !canSubmit) return;
    setPhase('analyzing');
    setError('');
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    try {
      const qaPairs = questions
        .map((q, i) => answers[i]?.trim() ? `Q${i + 1}. ${q}\n→ ${answers[i].trim()}` : null)
        .filter(Boolean)
        .join('\n\n');

      const prompt = `이 분이 아래 질문들에 직접 솔직하게 답변해주셨어요.
이 답변들과 사주·별자리를 모두 종합해서, 이 분만을 위한 깊고 진솔한 분석을 써주세요.

[인터뷰 답변]
${qaPairs}

[분석 요청]
단순한 운세 나열이 아닌, 이 답변들에 담긴 이 분만의 이야기를 별과 사주의 언어로 풀어주세요.
내면의 패턴, 관계 방식, 삶의 방향성, 숨겨진 강점과 과제를 깊이 있게 다뤄주세요.
분량은 충분히 길고 풍부하게 (여러 섹션으로 나눠서), 딱딱한 분석보다는 이 분에게 쓰는 개인적인 편지 같은 따뜻한 톤으로.`;

      const text = await callApi(prompt, { isReport: true });
      setResult(text);
      setPhase('result');
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      setError('분석 중 오류가 발생했어요. 다시 시도해봐요.');
      setPhase('answering');
    }
  }, [callApi, questions, answers, canSubmit]);

  const handleReset = () => {
    setPhase('idle');
    setQuestions([]);
    setAnswers(Array(10).fill(''));
    setResult('');
    setError('');
  };

  const displayName = form?.nickname || form?.name || '당신';

  return (
    <div className="page-top" ref={topRef}>
      <div className="inner" style={{ paddingBottom: 52 }}>

        {/* ── 헤더 ── */}
        <div className="report-header" style={{ marginBottom: 24 }}>
          {today && (
            <div className="report-date">{today.year}년 {today.month}월</div>
          )}
          <div className="report-title">{displayName}님을 위한<br />심층 인터뷰</div>
          <div className="report-name">별숨이 당신을 더 깊이 알아가요</div>
        </div>

        {/* ── Phase: idle ── */}
        {phase === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--bg2)', borderRadius: 'var(--r2, 16px)',
              border: '1px solid var(--line)', padding: '20px',
            }}>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, marginBottom: 14 }}>
                별숨이 당신의 사주와 별자리를 읽고,
                <strong style={{ color: 'var(--gold)' }}> 당신만을 위한 10가지 질문</strong>을 만들어드려요.<br />
                솔직하게 답해주시면, 그 답변들을 바탕으로
                <strong style={{ color: 'var(--gold)' }}> 깊고 풍부한 분석</strong>을 드릴게요.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '✦', text: 'AI가 사주·별자리 기반 맞춤 질문 생성' },
                  { icon: '✎', text: '10개 질문에 자유롭게 솔직하게 답변' },
                  { icon: '◎', text: '답변 기반 깊은 분석 에세이 제공' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--goldf)', border: '1px solid var(--acc)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', color: 'var(--gold)',
                    }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: '#ff6060' }}>
                {error}
              </div>
            )}

            <button
              className="up-btn"
              style={{ maxWidth: '100%' }}
              onClick={handleGenerateQuestions}
            >
              ✦ 별숨 심층 인터뷰 시작하기
            </button>

            <button
              style={{
                width: '100%', padding: '11px',
                background: 'none', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', color: 'var(--t4)',
                fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
              }}
              onClick={() => setStep(4)}
            >
              ← 결과로 돌아가기
            </button>
          </div>
        )}

        {/* ── Phase: generating ── */}
        {phase === 'generating' && (
          <LoadingCard message={`${displayName}님의 사주와 별자리를 읽고\n맞춤 질문을 만들고 있어요`} />
        )}

        {/* ── Phase: answering ── */}
        {phase === 'answering' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', fontWeight: 600 }}>
                  {filledCount} / {questions.length} 답변 완료
                </div>
                <div style={{ fontSize: '10px', color: 'var(--t4)' }}>
                  70% 이상 답변하면 분석 시작 가능
                </div>
              </div>
              <ProgressBar value={filledCount} max={questions.length} />
            </div>

            {questions.map((q, i) => (
              <QuestionCard
                key={i}
                index={i}
                question={q}
                answer={answers[i]}
                onChange={val => setAnswers(prev => { const next = [...prev]; next[i] = val; return next; })}
                focused={focusedIdx === i}
                onFocus={() => setFocusedIdx(i)}
              />
            ))}

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: '#ff6060' }}>
                {error}
              </div>
            )}

            <button
              className="up-btn"
              style={{ maxWidth: '100%', opacity: canSubmit ? 1 : 0.5 }}
              disabled={!canSubmit}
              onClick={handleSubmitAnswers}
            >
              {canSubmit
                ? `✦ 별숨에게 분석 요청하기 (${filledCount}개 답변)`
                : `✦ ${Math.ceil(questions.length * 0.7) - filledCount}개 더 답변해봐요`}
            </button>

            <button
              style={{
                width: '100%', padding: '11px',
                background: 'none', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', color: 'var(--t4)',
                fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
              }}
              onClick={handleReset}
            >
              ← 처음으로
            </button>
          </div>
        )}

        {/* ── Phase: analyzing ── */}
        {phase === 'analyzing' && (
          <LoadingCard message={`${displayName}님의 답변을 별과 사주로\n깊이 읽고 있어요`} />
        )}

        {/* ── Phase: result ── */}
        {phase === 'result' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              padding: '12px 16px',
              background: 'var(--goldf)', border: '1px solid var(--acc)',
              borderRadius: 'var(--r1)',
              fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600,
              lineHeight: 1.6,
            }}>
              ✦ {displayName}님의 답변을 바탕으로 작성된 심층 분석이에요
            </div>

            <ReportBody text={result} />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="res-top-btn"
                style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 'var(--r1)' }}
                onClick={() => saveReportImage ? saveReportImage(result) : null}
              >
                이미지 저장
              </button>
              <button
                className="res-top-btn"
                style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 'var(--r1)' }}
                onClick={() => exportReadingAsTxt('심층인터뷰', result)}
              >
                텍스트 저장
              </button>
              <button
                className="res-top-btn primary"
                style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 'var(--r1)' }}
                onClick={() => shareResult?.('report', result, '별숨 심층 인터뷰')}
              >
                ↗ 공유하기
              </button>
            </div>

            <button
              style={{
                width: '100%', padding: '11px',
                background: 'none', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', color: 'var(--t4)',
                fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
              }}
              onClick={handleReset}
            >
              ↺ 새로 인터뷰하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 질문 생성 실패 시 fallback 질문 세트 ──────────────────────
const FALLBACK_QUESTIONS = [
  '요즘 당신의 하루를 한 단어로 표현한다면 무엇인가요?',
  '지금 가장 마음에 걸리는 관계가 있다면 어떤 관계인가요?',
  '올해 꼭 이루고 싶은 한 가지가 있다면 무엇인가요?',
  '혼자 있을 때 당신은 주로 무슨 생각을 하나요?',
  '가장 편안함을 느끼는 순간은 언제인가요?',
  '스스로 가장 잘한다고 생각하는 것과 가장 부족하다고 느끼는 것은 무엇인가요?',
  '지금의 일(또는 공부)에서 진짜 원하는 것이 있다면 무엇인가요?',
  '가장 두려운 것이 있다면 무엇이고, 그 두려움은 언제부터 생겼나요?',
  '10년 후 나는 어떤 모습으로 살고 있으면 좋겠나요?',
  '지금 이 순간, 가장 솔직하게 말하지 못한 감정이나 바람이 있다면 무엇인가요?',
];
