import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { ReportBody } from './AccItem.jsx';
import { exportReadingAsTxt } from '../utils/constants.js';

function parseQuestions(raw) {
  if (!raw) return null;

  try {
    const arr = JSON.parse(raw.trim());
    if (Array.isArray(arr) && arr.length >= 3) return arr.map(String);
  } catch {}

  const m = raw.match(/\[[\s\S]*?\]/);
  if (m) {
    try {
      const arr = JSON.parse(m[0]);
      if (Array.isArray(arr) && arr.length >= 3) return arr.map(String);
    } catch {}
  }

  const lines = raw
    .split('\n')
    .map((l) => l.replace(/^[\d]+[.)]\s*/, '').replace(/^["']|["']$/g, '').trim())
    .filter((l) => (l.endsWith('?') && l.length > 5) || l.length > 8);

  if (lines.length >= 3) return lines.slice(0, 10);
  return null;
}

function ProgressBar({ value, max }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--gold)',
          borderRadius: 2,
          transition: 'width .3s ease',
        }}
      />
    </div>
  );
}

function QuestionCard({ index, question, answer, onChange, focused, onFocus }) {
  const filled = answer.trim().length > 0;

  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: `1.5px solid ${focused ? 'var(--acc)' : filled ? 'rgba(232,176,72,0.3)' : 'var(--line)'}`,
        borderRadius: 'var(--r2, 16px)',
        padding: '16px',
        transition: 'border-color .2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            flexShrink: 0,
            background: filled ? 'var(--goldf)' : 'var(--bg3)',
            border: `1.5px solid ${filled ? 'var(--acc)' : 'var(--line)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: filled ? 'var(--gold)' : 'var(--t4)',
            transition: 'all .2s',
          }}
        >
          {filled ? '✓' : index + 1}
        </div>
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.6, fontWeight: filled ? 500 : 400 }}>
          {question}
        </div>
      </div>
      <textarea
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="편하게, 솔직하게 적어주세요."
        maxLength={300}
        style={{
          width: '100%',
          minHeight: 72,
          resize: 'vertical',
          background: 'var(--bg1)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r1)',
          padding: '10px 12px',
          fontFamily: 'var(--ff)',
          fontSize: 'var(--xs)',
          color: 'var(--t1)',
          lineHeight: 1.7,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ fontSize: '10px', color: 'var(--t4)', textAlign: 'right', marginTop: 4 }}>
        {answer.length}/300
      </div>
    </div>
  );
}

function LoadingCard({ message }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: 20,
      }}
    >
      <div style={{ position: 'relative', width: 60, height: 60 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '2.5px solid var(--line)',
            borderTopColor: 'var(--gold)',
            animation: 'orbSpin .9s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
          }}
        >
          ✨
        </div>
      </div>
      <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', textAlign: 'center', lineHeight: 1.8 }}>
        {message}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="dsc-loading-dot" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function DeepInterviewPage({
  form, today,
  callApi,
  shareResult,
  saveReportImage,
}) {
  const setStep = useAppStore((s) => s.setStep);

  const [phase, setPhase] = useState('entry');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(Array(10).fill(''));
  const [focusedIdx, setFocusedIdx] = useState(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const topRef = useRef(null);

  useEffect(() => {
    if (phase !== 'entry') return;
    const t = setTimeout(() => setPhase('idle'), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  const filledCount = answers.filter((a, i) => i < questions.length && a.trim().length > 0).length;
  const totalQ = questions.length || 10;
  const canSubmit = filledCount >= Math.ceil(totalQ * 0.7);
  const displayName = form?.nickname || form?.name || '당신';

  const handleGenerateQuestions = useCallback(async () => {
    if (!callApi) return;
    setPhase('generating');
    setError('');

    try {
      const prompt = `[시스템]
반드시 JSON 배열만 출력하세요. 다른 설명은 쓰지 마세요.

[요청]
사용자는 이미 "별숨에게 나를 알려주기" 기본 질문에 답한 상태입니다.
이제 그 다음 단계인 심층인터뷰용 맞춤 질문 10개를 만들어주세요.

조건:
- 사주와 별자리 흐름을 바탕으로 지금의 사용자를 더 깊이 이해하기 위한 질문일 것
- 관계, 감정, 두려움, 목표, 회복 방식, 반복되는 패턴, 바라는 미래를 골고루 다룰 것
- 너무 일반적인 질문 말고 개인화된 질문처럼 느껴질 것
- 모든 질문은 한국어 자연어 문장으로 끝에 물음표를 붙일 것

출력 형식:
["질문1", "질문2", "질문3", "질문4", "질문5", "질문6", "질문7", "질문8", "질문9", "질문10"]`;

      const raw = await callApi(prompt, { isChat: true });
      const qs = parseQuestions(raw);
      const finalQuestions = qs && qs.length >= 3 ? qs : FALLBACK_QUESTIONS;

      setQuestions(finalQuestions);
      setAnswers(Array(finalQuestions.length).fill(''));
      setPhase('answering');
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      setError('질문을 준비하는 중 문제가 생겼어요. 다시 시도해볼게요.');
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
        .map((q, i) => (answers[i]?.trim() ? `Q${i + 1}. ${q}\nA. ${answers[i].trim()}` : null))
        .filter(Boolean)
        .join('\n\n');

      const prompt = `[역할]
너는 사용자의 답변을 바탕으로 깊이 있는 개인 해석을 들려주는 별숨이다.

[인터뷰 답변]
${qaPairs}

[요청]
- 단순한 운세 요약이 아니라 사용자의 내면 패턴, 관계 방식, 감정의 결, 강점과 과제를 깊이 읽어주세요
- "항목 1", "항목 2" 같은 보고서체보다 자연스럽게 읽히는 긴 해석으로 써주세요
- 사용자가 스스로를 더 잘 이해할 수 있게 설명해주세요
- 따뜻하지만 얕지 않게, 개인에게 직접 말하듯 써주세요
- 분량은 충분히 길고 밀도 있게 작성해주세요`;

      const text = await callApi(prompt, { isReport: true });
      setResult(text);
      setPhase('result');
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      setError('심층 해석을 정리하는 중 문제가 생겼어요. 다시 시도해볼게요.');
      setPhase('answering');
    }
  }, [answers, callApi, canSubmit, questions]);

  const handleReset = () => {
    setPhase('idle');
    setQuestions([]);
    setAnswers(Array(10).fill(''));
    setResult('');
    setError('');
  };

  return (
    <div className="page-top" ref={topRef}>
      <div className="inner" style={{ paddingBottom: 52, maxWidth: 860, margin: '0 auto' }}>
        <div className="report-header" style={{ marginBottom: 24 }}>
          {today && (
            <div className="report-date">{today.year}년 {today.month}월</div>
          )}
          <div className="report-title">{displayName}님과<br />별숨의 심층인터뷰</div>
          <div className="report-name">별숨에게 나를 알려준 뒤, 더 깊게 이어가는 맞춤 인터뷰예요</div>
        </div>

        {phase === 'entry' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              gap: 24,
              animation: 'fadeUp .4s ease',
            }}
          >
            <div style={{ fontSize: '3rem', animation: 'floatGently 2s ease-in-out infinite' }}>✨</div>
            <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', textAlign: 'center', lineHeight: 1.9, wordBreak: 'keep-all' }}>
              이제 별숨이<br />당신을 더 깊이 알아가기 위한<br />질문을 준비하고 있어요.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="dsc-loading-dot" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
          </div>
        )}

        {phase === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: 'var(--bg2)',
                borderRadius: 'var(--r2, 16px)',
                border: '1px solid var(--line)',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, marginBottom: 14 }}>
                이 인터뷰는 <strong style={{ color: 'var(--gold)' }}>별숨에게 나를 알려주기 다음 단계</strong>예요.
                <br />
                별숨이 지금의 당신을 더 깊이 이해하기 위해
                <strong style={{ color: 'var(--gold)' }}> 맞춤 질문 10개</strong>를 준비해요.
                <br />
                편하게 답해주시면 별숨이
                <strong style={{ color: 'var(--gold)' }}> 당신만의 깊은 해석</strong>을 들려드릴게요.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🜂', text: '별숨이 지금의 나에게 맞는 질문 10개를 준비해요' },
                  { icon: '✍', text: '질문에 답하면서 내 마음과 패턴을 더 보여줘요' },
                  { icon: '✦', text: '답변을 바탕으로 깊은 개인 해석을 받아요' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: 'var(--goldf)',
                        border: '1px solid var(--acc)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'var(--gold)',
                      }}
                    >
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

            <button className="up-btn" style={{ maxWidth: '100%' }} onClick={handleGenerateQuestions}>
              심층인터뷰 시작하기
            </button>

            <button
              style={{
                width: '100%',
                padding: '11px',
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r1)',
                color: 'var(--t4)',
                fontSize: 'var(--xs)',
                fontFamily: 'var(--ff)',
                cursor: 'pointer',
              }}
              onClick={() => setStep(4)}
            >
              결과로 돌아가기
            </button>
          </div>
        )}

        {phase === 'generating' && (
          <LoadingCard message={`${displayName}님에게 맞는 심층 질문을 준비하고 있어요.`} />
        )}

        {phase === 'answering' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', fontWeight: 600 }}>
                  {filledCount} / {questions.length} 답변 완료
                </div>
                <div style={{ fontSize: '10px', color: 'var(--t4)' }}>
                  70% 이상 답하면 심층 해석을 시작할 수 있어요
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
                onChange={(val) => setAnswers((prev) => {
                  const next = [...prev];
                  next[i] = val;
                  return next;
                })}
                focused={focusedIdx === i}
                onFocus={() => setFocusedIdx(i)}
              />
            ))}

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: '#ff6060' }}>
                {error}
              </div>
            )}

            <button className="up-btn" style={{ maxWidth: '100%', opacity: canSubmit ? 1 : 0.5 }} disabled={!canSubmit} onClick={handleSubmitAnswers}>
              {canSubmit
                ? `별숨에게 심층 해석 요청하기 (${filledCount}개 답변)`
                : `${Math.ceil(questions.length * 0.7) - filledCount}개 더 답하면 시작할 수 있어요`}
            </button>

            <button
              style={{
                width: '100%',
                padding: '11px',
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r1)',
                color: 'var(--t4)',
                fontSize: 'var(--xs)',
                fontFamily: 'var(--ff)',
                cursor: 'pointer',
              }}
              onClick={handleReset}
            >
              처음부터 다시 하기
            </button>
          </div>
        )}

        {phase === 'analyzing' && (
          <LoadingCard message={`${displayName}님의 답변과 흐름을 묶어서 깊은 해석을 정리하고 있어요.`} />
        )}

        {phase === 'result' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--goldf)',
                border: '1px solid var(--acc)',
                borderRadius: 'var(--r1)',
                fontSize: 'var(--xs)',
                color: 'var(--gold)',
                fontWeight: 600,
                lineHeight: 1.6,
              }}
            >
              {displayName}님의 답변을 바탕으로 정리한 심층 해석이에요.
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
                onClick={() => shareResult?.('report', result, '별숨 심층인터뷰')}
              >
                공유하기
              </button>
            </div>

            <button
              style={{
                width: '100%',
                padding: '11px',
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r1)',
                color: 'var(--t4)',
                fontSize: 'var(--xs)',
                fontFamily: 'var(--ff)',
                cursor: 'pointer',
              }}
              onClick={handleReset}
            >
              다시 인터뷰하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const FALLBACK_QUESTIONS = [
  '요즘의 나를 한 문장으로 표현한다면 어떤 말이 가장 가깝나요?',
  '지금 가장 마음이 자주 향하는 관계는 어떤 관계인가요?',
  '요즘 나를 움직이게 하는 바람 한 가지는 무엇인가요?',
  '혼자 있을 때 가장 자주 떠오르는 생각은 무엇인가요?',
  '내가 편안함을 느끼는 순간은 보통 언제인가요?',
  '스스로 강하다고 느끼는 면과 약하다고 느끼는 면은 무엇인가요?',
  '지금 삶에서 진짜 바뀌었으면 하는 부분이 있다면 무엇인가요?',
  '계속 마음에 남아 있는 두려움이나 망설임은 무엇인가요?',
  '앞으로 1년 뒤 나는 어떤 모습에 가까워지고 싶나요?',
  '아직 누구에게도 충분히 말하지 못한 감정이 있다면 무엇인가요?',
];
