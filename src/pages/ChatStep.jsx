import { useRef, useState, useEffect, useCallback } from 'react';
import { ChatBubble } from "../components/AccItem.jsx";

// 대화 맥락 기반 스마트 추천 질문 칩
function getContextualChips(chatHistory, selQs) {
  const hasHistory = chatHistory.length > 0;
  const lastAiMsg = [...chatHistory].reverse().find(m => m.role === 'ai');

  if (!hasHistory) {
    return ['그럼 조심해야 할 건 뭐야?', '언제쯤 좋아질까?', '자세히 설명해줘'];
  }

  const text = lastAiMsg?.text || '';
  if (text.includes('연애') || text.includes('사랑') || text.includes('관계')) {
    return ['지금 고백해도 될까?', '이 사람이 나를 어떻게 생각할까?', '관계가 더 좋아질 수 있을까?'];
  }
  if (text.includes('직장') || text.includes('일') || text.includes('커리어') || text.includes('취업')) {
    return ['언제가 변화하기 좋은 시기야?', '지금 이직해도 괜찮을까?', '더 구체적으로 알려줘'];
  }
  if (text.includes('재물') || text.includes('돈') || text.includes('재정')) {
    return ['투자 타이밍은 언제가 좋아?', '지출을 줄여야 할까?', '금전운이 좋아지는 때는?'];
  }
  return ['좀 더 자세히 알고 싶어요', '어떻게 행동하면 좋을까요?', '긍정적인 부분도 알고 싶어요'];
}

// Web Speech API 지원 여부 확인
const isSpeechSupported = () =>
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

/** 음성 입력 훅 */
function useVoiceInput(onResult) {
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    if (!isSpeechSupported()) { setUnsupported(true); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      if (transcript) onResult(transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    listening ? stop() : start();
  }, [listening, start, stop]);

  return { listening, unsupported, toggle };
}

export default function ChatStep({
  chatHistory, chatInput, setChatInput, chatLoading,
  chatLeft, latestChatIdx,
  selQs,
  profileNudge, setProfileNudge,
  setShowProfileModal,
  handleSendChat, handleSaveChatImage,
  chatEndRef,
}) {
  const chips = getContextualChips(chatHistory, selQs);
  const lastMsg = chatHistory[chatHistory.length - 1];
  const lastMsgIsStreaming = lastMsg?.streaming === true;

  const { listening, unsupported, toggle: toggleVoice } = useVoiceInput((text) => {
    setChatInput(prev => (prev ? prev + ' ' + text : text));
  });

  function sendChip(chip) {
    handleSendChat(chip);
  }

  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="chat-page-title">별숨과 대화하기</div>
          {chatHistory.length > 0 && (
            <button className="res-top-btn" style={{ flexShrink: 0, marginTop: 2 }} onClick={handleSaveChatImage}>저장</button>
          )}
        </div>
        <div className="chat-page-sub">
          {selQs.slice(0, 2).map((q, i) => <div key={i} style={{ marginTop: 3 }}>Q{i + 1}. {q.length > 28 ? q.slice(0, 28) + '…' : q}</div>)}
        </div>
      </div>

      <div className="chat-history">
        {chatHistory.length === 0 && (
          <div style={{ color: 'var(--t4)', fontSize: 'var(--sm)', textAlign: 'center', padding: 'var(--sp4) var(--sp3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>✦</div>
            더 궁금한 게 있으면 자유롭게 물어봐요
          </div>
        )}
        {chatHistory.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <div className="chat-role">{m.role === 'ai' ? '✦ 별숨' : '나'}</div>
            {m.role === 'ai'
              ? m.streaming
                ? m.text
                  ? <div className="chat-bubble" style={{ whiteSpace: 'pre-line' }}>{m.text}<span className="typing-cursor" /></div>
                  : <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                      <div className="typing-dots"><span /><span /><span /></div>
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontStyle: 'italic' }}>별숨이 운명의 궤도를 읽는 중...</span>
                    </div>
                : <ChatBubble text={m.text} isNew={i === latestChatIdx} />
              : <div className="chat-bubble">{m.text}</div>
            }
          </div>
        ))}
        {chatLoading && !lastMsgIsStreaming && (
          <div className="chat-msg ai">
            <div className="chat-role">✦ 별숨</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <div className="typing-dots"><span /><span /><span /></div>
              <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontStyle: 'italic' }}>별숨이 운명의 궤도를 읽는 중...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {profileNudge && (
        <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ flex: 1, fontSize: 'var(--sm)', color: 'var(--t2)' }}>✦ {profileNudge.label}</span>
          <button onClick={() => { setShowProfileModal(true); setProfileNudge(null); }}
            style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--gold)', background: 'var(--goldf)', color: 'var(--gold)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', fontWeight: 600, cursor: 'pointer' }}>
            저장하기
          </button>
          <button onClick={() => setProfileNudge(null)}
            style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--line)', background: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
            괜찮아요
          </button>
        </div>
      )}

      <div className="chat-input-area">
        {chatLeft > 0 && (
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', textAlign: 'right', padding: '4px 16px 0' }}>
            남은 채팅 {chatLeft}회
          </div>
        )}
        {chatLeft <= 0 && (
          <div style={{ textAlign: 'center', padding: '8px 16px', fontSize: 'var(--xs)', color: 'var(--t4)', borderTop: '1px solid var(--line)' }}>
            채팅을 모두 사용했어요 · 새 상담을 시작하거나 업그레이드하세요
          </div>
        )}
        {/* 스마트 추천 질문 칩 */}
        {chatLeft > 0 && !chatLoading && (
          <div style={{ overflowX: 'auto', padding: '8px 16px 4px', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => sendChip(chip)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                  border: '1px solid var(--line)', background: 'var(--bg2)',
                  color: 'var(--t2)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all var(--trans-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--t2)'; }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        <div className="chat-inp-row">
          <input className="chat-inp"
            placeholder={chatLeft > 0 ? (listening ? '말씀해보세요...' : '더 궁금한 게 있어요?') : '채팅을 모두 사용했어요'}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
            disabled={chatLeft <= 0 || chatLoading} />

          {/* 음성 입력 버튼 */}
          {!unsupported && chatLeft > 0 && (
            <button
              onClick={toggleVoice}
              disabled={chatLoading}
              title={listening ? '녹음 중지' : '음성으로 입력'}
              style={{
                flexShrink: 0,
                width: 36, height: 36,
                borderRadius: '50%',
                border: listening ? '2px solid var(--rose)' : '1px solid var(--line)',
                background: listening ? 'rgba(224,90,58,0.12)' : 'var(--bg2)',
                color: listening ? 'var(--rose)' : 'var(--t3)',
                fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: chatLoading ? 'not-allowed' : 'pointer',
                transition: 'all .2s ease',
                animation: listening ? 'mic-pulse 1.2s ease-in-out infinite' : 'none',
              }}
            >
              {listening ? '⏹' : '🎤'}
            </button>
          )}

          <button className="chat-send" onClick={handleSendChat} disabled={!chatInput.trim() || chatLeft <= 0 || chatLoading}>✦</button>
        </div>

        {/* 음성 입력 상태 표시 */}
        {listening && (
          <div style={{
            padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 'var(--xs)', color: 'var(--rose)',
          }}>
            <span style={{ animation: 'mic-pulse 1.2s ease-in-out infinite', display: 'inline-block' }}>●</span>
            <span>듣고 있어요 — 말씀을 마치면 자동으로 입력돼요</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes mic-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
