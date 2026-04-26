import { useState, useEffect } from "react";
import { getMoonPhase, DREAM_PROMPT } from "../utils/constants.js";
import FeatureLoadingScreen from "./FeatureLoadingScreen.jsx";
import { useStreamResponse } from "../hooks/useStreamResponse.js";
import { saveConsultationHistoryEntry } from "../utils/consultationHistory.js";
import { ChatBubble } from "./AccItem.jsx";
import { getAuthenticatedClient } from "../lib/supabase.js";
import { spendBP } from "../utils/gamificationLogic.js";
import { useAppStore } from "../store/useAppStore.js";
import { readStreamResponse } from "../lib/streamTransport.js";
import { getAuthToken } from "../hooks/useUserProfile.js";

const FEATURE_COST = 10;

const DREAM_MOODS = [
  { value: '행복한', emoji: '😊' },
  { value: '불안한', emoji: '😟' },
  { value: '무서운', emoji: '😨' },
  { value: '신비한', emoji: '✨' },
  { value: '설레는', emoji: '💓' },
  { value: '이상한', emoji: '🌀' },
  { value: '따뜻한', emoji: '🌤️' },
  { value: '기쁜', emoji: '🎉' },
];

const DREAM_TAGS = [
  { value: '사람', emoji: '🧑' },
  { value: '물', emoji: '💧' },
  { value: '하늘과 구름', emoji: '☁️' },
  { value: '동물', emoji: '🐾' },
  { value: '죽음', emoji: '🕯️' },
  { value: '추락', emoji: '🕳️' },
  { value: '아기', emoji: '👶' },
  { value: '돈과 재물', emoji: '💰' },
  { value: '불', emoji: '🔥' },
  { value: '가족', emoji: '🏠' },
  { value: '집', emoji: '🏡' },
  { value: '시험과 학교', emoji: '📚' },
];

function parseFollowUp(text) {
  if (!text) return [];
  const m = text.match(/\[후속질문\]\s*(.+)/);
  if (!m) return [];
  return m[1].split('/').map(q => q.trim()).filter(Boolean).slice(0, 2);
}

function stripFollowUp(text) {
  if (!text) return text;
  return text.replace(/\[후속질문\].*/s, '').trim();
}

const DREAM_SEC_TAGS = ['꿈요약','감정점수','한줄해석','꿈요소','무의식해석','현실연결','주의할점','오늘할일','나에게묻기','별숨한마디'];

function parseDreamSections(text) {
  if (!text) return {};
  const result = {};
  for (let i = 0; i < DREAM_SEC_TAGS.length; i++) {
    const tag = `[${DREAM_SEC_TAGS[i]}]`;
    const start = text.indexOf(tag);
    if (start === -1) continue;
    const contentStart = start + tag.length;
    let end = text.length;
    for (let j = 0; j < DREAM_SEC_TAGS.length; j++) {
      if (j === i) continue;
      const nx = text.indexOf(`[${DREAM_SEC_TAGS[j]}]`, contentStart);
      if (nx !== -1 && nx < end) end = nx;
    }
    result[DREAM_SEC_TAGS[i]] = text.slice(contentStart, end).trim();
  }
  return result;
}

function DreamSectionCard({ eyebrow, body, highlight }) {
  if (!body) return null;
  return (
    <div style={{
      background: highlight ? 'linear-gradient(135deg,rgba(232,176,72,.1),rgba(200,160,255,.06))' : 'var(--card)',
      border: `1px solid ${highlight ? 'var(--acc)' : 'var(--line)'}`,
      borderRadius: 'var(--r1)', padding: '14px 16px', marginBottom: 10,
    }}>
      <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.05em' }}>{eyebrow}</div>
      <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.85, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{body}</div>
    </div>
  );
}

function DreamActionCard({ title, body }) {
  if (!body) return null;
  const items = body.split('\n').filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.05em' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 700, flexShrink: 0, fontSize: 'var(--xs)' }}>{i + 1}.</span>
            <span style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DreamPage({ user, form, buildCtx, callApi: callApiProp, setStep, showToast, onShareCard, consentFlags }) {
  const today = new Date();
  const moonPhase = getMoonPhase(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [dreamText, setDreamText] = useState('');
  const [mood, setMood] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const { streamText: result, isStreaming: loading, streamError, startStream, resetStream } = useStreamResponse();

  useEffect(() => {
    if (!loading && result) {
      setFollowUps(parseFollowUp(result));
    }
  }, [loading, result]);

  useEffect(() => {
    if (!result || loading || !dreamText.trim()) return;

    saveConsultationHistoryEntry({
      user,
      consentFlags,
      questions: [`꿈해몽: ${dreamText.trim()}`],
      answers: [stripFollowUp(result)],
    }).catch(() => {});
  }, [consentFlags, dreamText, loading, result, user]);

  const toggleTag = (tag) => {
    setSelectedTags(p => (p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]));
  };

  const handleAnalyze = async () => {
    if (!dreamText.trim()) { showToast('꿈 내용을 입력해주세요', 'info'); return; }
    if (!callApiProp) { showToast('로그인이 필요해요', 'info'); return; }

    if (user?.id) {
      const confirmed = await useAppStore.getState().showBPConfirm(FEATURE_COST, 1);
      if (!confirmed) return;
      const currentBp = useAppStore.getState().gamificationState?.currentBp ?? 0;
      if (currentBp < FEATURE_COST) {
        showToast(`BP가 부족해요 (필요: ${FEATURE_COST} BP, 보유: ${currentBp} BP)`, 'error');
        return;
      }
      const client = getAuthenticatedClient(user.id);
      const { ok, newBP } = await spendBP(client, user.id, FEATURE_COST, 'DREAM_READING', '꿈해몽');
      if (!ok) {
        showToast('BP가 부족해요', 'error');
        return;
      }
      const cur = useAppStore.getState().gamificationState || {};
      useAppStore.getState().setGamificationData({
        gamificationState: { ...cur, currentBp: newBP ?? (currentBp - FEATURE_COST) },
        missions: useAppStore.getState().missions || [],
      });
    }

    resetStream();
    setFollowUps([]);
    setChatOpen(false);
    setChatInput('');
    setChatHistory([]);

    const prompt = DREAM_PROMPT({
      dreamMood: mood,
      dreamTags: selectedTags,
      moonPhaseLabel: moonPhase.label,
    }) + `\n\n[꿈 내용]\n${dreamText}`;

    await startStream({
      userMessage: prompt,
      context: buildCtx?.() || '',
      isChat: true,
      isDream: true,
      clientHour: new Date().getHours(),
    });
  };

  const handleChat = async (inputOverride) => {
    const msg = (inputOverride || chatInput).trim();
    if (!msg || chatLoading || isThinking || !callApiProp) return;

    setChatInput('');
    setChatLoading(true);
    setIsThinking(true);
    setChatHistory(p => [...p, { role: 'user', content: msg }, { role: 'assistant', content: '', isStreaming: true }]);

    // 2초 지연 (AI가 생각하는 시간)
    await new Promise(r => setTimeout(r, 2000));
    setIsThinking(false);

    try {
      const prevHistory = chatHistory
        .map(m => `[${m.role === 'user' ? '나' : '별숨'}] ${m.content}`)
        .join('\n');
      
      const contextPrompt = `[시스템 지시]
너는 사용자의 꿈 해몽을 이어서 대화하는 별숨이다.
- 자연스러운 채팅처럼 2~4문장으로 답할 것
- 제목, 항목 구분, 보고서체 표현을 쓰지 말 것
- 방금 해몽과 이전 대화 맥락을 이어서 설명할 것

[꿈 맥락]
꿈: ${dreamText}
해몽: ${stripFollowUp(result)}${prevHistory ? `\n[이전 대화]\n${prevHistory}` : ''}

[질문]
${msg}`;

      const token = getAuthToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const chatContext = `${buildCtx?.() || ''}\n\n[채팅 응답 규칙]\n이번 응답은 채팅 모드입니다. [요약], 제목, 섹션 헤더를 쓰지 말고 바로 대화체로 이어서 말해주세요.`;

      const res = await fetch("/api/stream", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userMessage: contextPrompt,
          context: chatContext,
          kakaoId: user?.id,
          isChat: true,
          clientHour: new Date().getHours(),
        }),
      });

      if (!res.ok) throw new Error("STREAM_ERROR");

      await readStreamResponse(res, {
        onText: (text) => {
          setChatHistory(prev => {
            const lastIdx = prev.length - 1;
            if (prev[lastIdx]?.role === 'assistant') {
              return prev.map((m, i) => i === lastIdx ? { ...m, content: text } : m);
            }
            return prev;
          });
        }
      });

      setChatHistory(prev => {
        const lastIdx = prev.length - 1;
        return prev.map((m, i) => i === lastIdx ? { ...m, isStreaming: false } : m);
      });
    } catch (err) {
      console.error("[DreamPage] Chat error:", err);
      setChatHistory(p => {
        const lastIdx = p.length - 1;
        return p.map((m, i) => i === lastIdx ? { ...m, content: '별빛이 잠시 흐려졌어요. 다시 한 번 물어봐주세요.', isStreaming: false } : m);
      });
    } finally {
      setChatLoading(false);
      setIsThinking(false);
    }
  };

  const handleFollowUp = async (q) => {
    if (chatLoading || isThinking) return;
    setChatOpen(true);
    await handleChat(q);
  };

  const mainText = stripFollowUp(result);

  if (loading && !result) return <FeatureLoadingScreen type="dream" />;

  return (
    <div className="page step-fade">
      <div className="inner" style={{ paddingBottom: 120 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🌙</div>
          <h2 style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>꿈해몽</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>
            오늘 밤 꾼 꿈을 별숨에게 들려주세요
          </p>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginTop: 4 }}>
            {moonPhase.icon} 오늘은 {moonPhase.label}
          </div>
        </div>

        {!result && !streamError && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
                꿈 내용
              </div>
              <textarea
                value={dreamText}
                onChange={e => setDreamText(e.target.value)}
                placeholder="꿈에서 어떤 일이 있었나요? 기억나는 대로 편하게 적어주세요."
                style={{
                  width: '100%',
                  minHeight: 120,
                  padding: '12px 14px',
                  borderRadius: 'var(--r1)',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  color: 'var(--t1)',
                  fontSize: 'var(--sm)',
                  fontFamily: 'var(--ff)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  lineHeight: 1.6,
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
                꿈에서 느낀 감정
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DREAM_MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMood(prev => (prev === m.value ? '' : m.value))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 'var(--xs)',
                      cursor: 'pointer',
                      border: `1px solid ${mood === m.value ? 'var(--gold)' : 'var(--line)'}`,
                      background: mood === m.value ? 'var(--goldf)' : 'var(--card)',
                      color: mood === m.value ? 'var(--gold)' : 'var(--t2)',
                      transition: 'all .15s',
                    }}
                  >
                    {m.emoji} {m.value}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
                꿈의 핵심 요소
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DREAM_TAGS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => toggleTag(t.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 'var(--xs)',
                      cursor: 'pointer',
                      border: `1px solid ${selectedTags.includes(t.value) ? 'var(--gold)' : 'var(--line)'}`,
                      background: selectedTags.includes(t.value) ? 'var(--goldf)' : 'var(--card)',
                      color: selectedTags.includes(t.value) ? 'var(--gold)' : 'var(--t2)',
                      transition: 'all .15s',
                    }}
                  >
                    {t.emoji} {t.value}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !dreamText.trim()}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 'var(--r1)',
                cursor: 'pointer',
                background: loading || !dreamText.trim() ? 'var(--line)' : 'linear-gradient(135deg, var(--gold), #c8953a)',
                color: loading || !dreamText.trim() ? 'var(--t3)' : '#1a1208',
                fontWeight: 700,
                fontSize: 'var(--sm)',
                border: 'none',
                transition: 'all .2s',
                marginBottom: 24,
              }}
            >
              꿈해몽 받기
            </button>
          </>
        )}

        {(result || streamError) && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            {!loading && (
              <button
                onClick={() => { resetStream(); setFollowUps([]); setChatHistory([]); setChatInput(''); setChatOpen(false); setIsThinking(false); }}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: 12,
                  borderRadius: 'var(--r1)',
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--t3)',
                  fontSize: 'var(--xs)',
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                다른 꿈 해몽하기
              </button>
            )}

            {loading && !result ? null : streamError ? (
              <div style={{ background: 'var(--card)', border: '1px solid var(--rose)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, color: 'var(--rose)', fontSize: 'var(--sm)' }}>{streamError}</div>
            ) : (() => {
              const secs = parseDreamSections(mainText);
              const hasStructure = !!(secs['한줄해석'] || secs['무의식해석']);
              if (!hasStructure) {
                return (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>별숨의 꿈해몽</div>
                    <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
                      {mainText}{loading && <span className="typing-cursor" />}
                    </div>
                  </div>
                );
              }
              const score = parseInt(secs['감정점수'] || '0', 10) || null;
              return (
                <>
                  {/* 히어로 카드 */}
                  <div style={{
                    background: 'linear-gradient(135deg,rgba(180,140,200,.12),rgba(232,176,72,.08))',
                    border: '1px solid var(--acc)', borderRadius: 'var(--r1)',
                    padding: '16px', marginBottom: 10, textAlign: 'center',
                  }}>
                    {score > 0 && (
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 4 }}>
                        {score}<span style={{ fontSize: '.9rem', fontWeight: 400, color: 'var(--t3)', marginLeft: 3 }}>점</span>
                      </div>
                    )}
                    {secs['한줄해석'] && (
                      <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.6 }}>{secs['한줄해석']}</div>
                    )}
                    {loading && !secs['한줄해석'] && <span className="typing-cursor" />}
                  </div>

                  <DreamSectionCard eyebrow="꿈 요소 분석" body={secs['꿈요소']} />
                  <DreamSectionCard eyebrow="무의식 해석" body={secs['무의식해석']} highlight />
                  <DreamSectionCard eyebrow="현실과의 연결" body={secs['현실연결']} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <DreamActionCard title="오늘 할 일" body={secs['오늘할일']} />
                    <DreamActionCard title="주의할 점" body={secs['주의할점']} />
                  </div>
                  <DreamActionCard title="나에게 묻기" body={secs['나에게묻기']} />
                  {secs['별숨한마디'] && (
                    <div style={{
                      textAlign: 'center', padding: '12px 16px', marginTop: 4,
                      background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r1)',
                      fontSize: 'var(--sm)', color: 'var(--t2)', fontStyle: 'italic',
                    }}>
                      {secs['별숨한마디']}
                    </div>
                  )}
                  {loading && <div style={{ textAlign: 'center', marginTop: 4 }}><span className="typing-cursor" /></div>}
                </>
              );
            })()}

            {!streamError && <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 8 }}>더 궁금한 점이 있나요?</div>
              <button
                onClick={() => setChatOpen(true)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r1)',
                  border: '1px solid var(--acc)',
                  background: 'linear-gradient(135deg, var(--goldf), rgba(155,142,196,.08))',
                  color: 'var(--gold)',
                  fontSize: 'var(--xs)',
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                별숨에게 더 물어보기
              </button>
            </div>}

            {!streamError && chatOpen && followUps.length > 0 && chatHistory.length === 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {followUps.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleFollowUp(q)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--r1)',
                        textAlign: 'left',
                        border: '1px solid var(--line)',
                        background: 'var(--card)',
                        color: 'var(--t2)',
                        fontSize: 'var(--xs)',
                        cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!streamError && chatHistory.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {chatHistory.map((m, i) => (
                  <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {m.role === 'user' ? (
                      <div style={{
                        maxWidth: '85%',
                        padding: '8px 12px',
                        borderRadius: 12,
                        background: 'var(--goldf)',
                        border: '1px solid var(--acc)',
                        color: 'var(--gold)',
                        fontSize: 'var(--xs)',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-line',
                        wordBreak: 'keep-all',
                      }}>
                        {m.content}
                      </div>
                    ) : (
                      <div style={{ maxWidth: '85%' }}>
                        <ChatBubble text={m.content} isNew={i === chatHistory.length - 1} isStreaming={m.isStreaming} />
                      </div>
                    )}
                  </div>
                ))}
                {isThinking && (
                  <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                )}
              </div>
            )}

            {!loading && !streamError && chatOpen && (
              <div style={{ display: 'flex', gap: 8, marginTop: chatHistory.length > 0 ? 4 : 0 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                  placeholder="별숨에게 더 물어보세요"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 'var(--r1)',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--t1)',
                    fontSize: 'var(--xs)',
                  }}
                />
                <button
                  onClick={() => handleChat()}
                  disabled={!chatInput.trim() || chatLoading || isThinking}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--r1)',
                    cursor: 'pointer',
                    background: !chatInput.trim() || chatLoading || isThinking ? 'var(--line)' : 'var(--gold)',
                    color: '#1a1208',
                    fontWeight: 700,
                    fontSize: 'var(--xs)',
                    border: 'none',
                    transition: 'all .2s',
                  }}
                >
                  전송
                </button>
              </div>
            )}

            {!streamError && onShareCard && mainText && (
              <button
                onClick={() => onShareCard(mainText, form?.name)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: 12,
                  marginBottom: 12,
                  borderRadius: 'var(--r1)',
                  border: '1px solid var(--line)',
                  background: 'var(--bg2)',
                  color: 'var(--t2)',
                  fontSize: 'var(--xs)',
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.color = 'var(--gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--t2)'; }}
              >
                📸 나의 길몽 리포트 카드로 저장
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
