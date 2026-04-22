import { useState, useEffect } from "react";
import { getMoonPhase, DREAM_PROMPT } from "../utils/constants.js";
import FeatureLoadingScreen from "./FeatureLoadingScreen.jsx";
import { useStreamResponse } from "../hooks/useStreamResponse.js";

// ═══════════════════════════════════════════════════════════
//  🌙 꿈 해몽 — 별숨이 꿈을 읽어요
// ═══════════════════════════════════════════════════════════

const DREAM_MOODS = [
  { value: '행복한', emoji: '😊' },
  { value: '불안한', emoji: '😰' },
  { value: '무서운', emoji: '😨' },
  { value: '슬픈', emoji: '😢' },
  { value: '설레는', emoji: '🥰' },
  { value: '혼란스러운', emoji: '😵' },
  { value: '평온한', emoji: '😌' },
  { value: '기묘한', emoji: '🤔' },
];

const DREAM_TAGS = [
  { value: '사람', emoji: '👤' },
  { value: '물·바다', emoji: '🌊' },
  { value: '하늘·구름', emoji: '☁️' },
  { value: '동물', emoji: '🐾' },
  { value: '죽음', emoji: '💀' },
  { value: '쫓기는', emoji: '🏃' },
  { value: '날아다니는', emoji: '🕊️' },
  { value: '돈·재물', emoji: '💰' },
  { value: '불', emoji: '🔥' },
  { value: '가족', emoji: '👨‍👩‍👧' },
  { value: '집', emoji: '🏠' },
  { value: '시험·학교', emoji: '📚' },
];

/** [후속질문] 태그 파싱 */
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

export default function DreamPage({ user, form, buildCtx, callApi: callApiProp, setStep, showToast, onShareCard }) {
  const today = new Date();
  const moonPhase = getMoonPhase(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [dreamText, setDreamText] = useState('');
  const [mood, setMood] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const { streamText: result, isStreaming: loading, streamError, startStream, resetStream } = useStreamResponse();

  // 스트리밍 완료 후 후속 질문 파싱
  useEffect(() => {
    if (!loading && result) {
      const fus = parseFollowUp(result);
      if (fus.length) setFollowUps(fus);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTag = (tag) => {
    setSelectedTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
  };

  const handleAnalyze = async () => {
    if (!dreamText.trim()) { showToast('꿈 내용을 입력해주세요', 'info'); return; }
    if (!callApiProp) { showToast('로그인이 필요해요', 'info'); return; }
    resetStream();
    setFollowUps([]);
    const prompt = DREAM_PROMPT({
      dreamText,
      dreamMood: mood,
      dreamTags: selectedTags,
      moonPhaseLabel: moonPhase.label,
    }) + `\n\n[꿈 내용]\n${dreamText}`;
    await startStream({
      userMessage: prompt,
      context: buildCtx?.() || '',
      isChat: true,
      clientHour: new Date().getHours(),
    });
    // 스트리밍 완료 후 후속 질문 파싱 (result가 업데이트된 시점에 처리)
  };

  const handleFollowUp = async (q) => {
    setChatInput(q);
    await handleChat(q);
  };

  const handleChat = async (inputOverride) => {
    const msg = (inputOverride || chatInput).trim();
    if (!msg || chatLoading || !callApiProp) return;
    setChatInput('');
    setChatLoading(true);
    setChatHistory(p => [...p, { role: 'user', content: msg }]);
    try {
      const prevHistory = chatHistory.map(m => `${m.role === 'user' ? '유저' : '별숨'}: ${m.content}`).join('\n');
      const contextPrompt = `[시스템 지시: 친근한 채팅 스타일로 2~4문장 이내 짧게 답변해요. 격식 없이 편하게.]\n[꿈 맥락]\n꿈: ${dreamText}\n해몽: ${stripFollowUp(result)}${prevHistory ? `\n[이전 대화]\n${prevHistory}` : ''}\n\n[질문]\n${msg}`;
      const res = await callApiProp(contextPrompt, { isChat: true });
      setChatHistory(p => [...p, { role: 'assistant', content: res }]);
    } catch {
      setChatHistory(p => [...p, { role: 'assistant', content: '별이 잠시 쉬고 있어요 🌙' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const mainText = stripFollowUp(result);

  // 결과 없이 로딩 시작된 경우에만 풀페이지 로딩 표시
  if (loading && !result) return <FeatureLoadingScreen type="dream" />;

  return (
    <div className="page step-fade">
      <div className="inner" style={{ paddingBottom: 120 }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🌙</div>
          <h2 style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>꿈 해몽</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>
            오늘 밤 꾼 꿈을 별숨에게 들려주세요
          </p>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginTop: 4 }}>
            {moonPhase.icon} 오늘은 {moonPhase.label}
          </div>
        </div>

        {/* 결과가 없을 때만 입력 UI 표시 */}
        {!result && <>
        {/* 꿈 내용 입력 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
            ✦ 꿈 내용
          </div>
          <textarea
            value={dreamText}
            onChange={e => setDreamText(e.target.value)}
            placeholder="꿈에서 어떤 일이 있었나요? 기억나는 대로 자유롭게 적어주세요."
            style={{
              width: '100%', minHeight: 120, padding: '12px 14px', borderRadius: 'var(--r1)',
              border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--t1)',
              fontSize: 'var(--sm)', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
            }}
          />
        </div>

        {/* 깨어날 때 감정 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
            ✦ 꿈에서 깼을 때 기분
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DREAM_MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(prev => prev === m.value ? '' : m.value)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 'var(--xs)', cursor: 'pointer',
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

        {/* 꿈 속 요소 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
            ✦ 꿈 속 요소 (여러 개 선택 가능)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DREAM_TAGS.map(t => (
              <button
                key={t.value}
                onClick={() => toggleTag(t.value)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 'var(--xs)', cursor: 'pointer',
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

        {/* 해몽 버튼 */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !dreamText.trim()}
          style={{
            width: '100%', padding: '13px', borderRadius: 'var(--r1)', cursor: 'pointer',
            background: loading || !dreamText.trim() ? 'var(--line)' : 'linear-gradient(135deg, var(--gold), #c8953a)',
            color: loading || !dreamText.trim() ? 'var(--t3)' : '#1a1208',
            fontWeight: 700, fontSize: 'var(--sm)', border: 'none', transition: 'all .2s',
            marginBottom: 24,
          }}
        >
          🌙 꿈 해몽 받기
        </button>
        </>}

        {/* 결과 */}
        {result && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            {/* 다시 해몽하기 */}
            {!loading && (
              <button
                onClick={() => { resetStream(); setFollowUps([]); setChatHistory([]); }}
                style={{
                  width: '100%', padding: '10px', marginBottom: 12,
                  borderRadius: 'var(--r1)', border: '1px solid var(--line)',
                  background: 'transparent', color: 'var(--t3)',
                  fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                🌙 다른 꿈 해몽하기
              </button>
            )}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 'var(--r1)', padding: '16px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>
                🌙 별숨의 꿈 해몽
              </div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
                {mainText}{loading && <span className="typing-cursor" />}
              </div>
            </div>

            {/* 꿈 해몽 카드 공유 */}
            {onShareCard && mainText && (
              <button
                onClick={() => onShareCard(mainText, form?.name)}
                style={{
                  width: '100%', padding: '10px', marginBottom: 12,
                  borderRadius: 'var(--r1)', border: '1px solid var(--line)',
                  background: 'var(--bg2)', color: 'var(--t2)',
                  fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.color = 'var(--gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--t2)'; }}
              >
                📸 나의 길몽 리포트 카드로 저장
              </button>
            )}

            {/* 후속 질문 */}
            {followUps.length > 0 && chatHistory.length === 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 8 }}>💬 더 궁금한 점이 있나요?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {followUps.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleFollowUp(q)}
                      style={{
                        padding: '8px 12px', borderRadius: 'var(--r1)', textAlign: 'left',
                        border: '1px solid var(--line)', background: 'var(--card)',
                        color: 'var(--t2)', fontSize: 'var(--xs)', cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 채팅 히스토리 */}
            {chatHistory.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {chatHistory.map((m, i) => (
                  <div key={i} style={{
                    marginBottom: 10,
                    display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '85%', padding: '8px 12px', borderRadius: 12,
                      background: m.role === 'user' ? 'var(--goldf)' : 'var(--card)',
                      border: `1px solid ${m.role === 'user' ? 'var(--acc)' : 'var(--line)'}`,
                      color: m.role === 'user' ? 'var(--gold)' : 'var(--t1)',
                      fontSize: 'var(--xs)', lineHeight: 1.7, whiteSpace: 'pre-line', wordBreak: 'keep-all',
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>
                    <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
                  </div>
                )}
              </div>
            )}

            {/* 채팅 입력 — 결과 있으면 항상 표시 */}
            {!loading && (
              <div style={{ display: 'flex', gap: 8, marginTop: chatHistory.length > 0 ? 4 : 0 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                  placeholder="별숨에게 더 물어보세요"
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 'var(--r1)',
                    border: '1px solid var(--line)', background: 'var(--card)',
                    color: 'var(--t1)', fontSize: 'var(--xs)',
                  }}
                />
                <button
                  onClick={() => handleChat()}
                  disabled={!chatInput.trim() || chatLoading}
                  style={{
                    padding: '10px 16px', borderRadius: 'var(--r1)', cursor: 'pointer',
                    background: 'var(--gold)', color: '#1a1208', fontWeight: 700,
                    fontSize: 'var(--xs)', border: 'none',
                  }}
                >전송</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
