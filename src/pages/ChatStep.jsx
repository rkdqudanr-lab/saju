import { useRef, useState, useEffect, useCallback } from 'react';
import { ChatBubble } from '../components/AccItem.jsx';

function getContextualChips(chatHistory) {
  const hasHistory = chatHistory.length > 0;
  const lastAiMsg = [...chatHistory].reverse().find((message) => message.role === 'ai');

  if (!hasHistory) {
    return ['그럼 지금 제일 중요한 건 뭐야?', '언제쯤 흐름이 좋아질까?', '조금 더 자세히 설명해줘'];
  }

  const text = lastAiMsg?.text || '';

  if (text.includes('연애') || text.includes('사랑') || text.includes('관계')) {
    return ['지금 고백해도 괜찮을까?', '상대 마음은 어떻게 보여?', '관계가 더 좋아지려면 뭘 하면 좋을까?'];
  }

  if (text.includes('직장') || text.includes('일') || text.includes('커리어') || text.includes('취업')) {
    return ['언제가 움직이기 좋은 시기야?', '지금 이직해도 괜찮을까?', '조금 더 구체적으로 알려줘'];
  }

  if (text.includes('재물') || text.includes('돈') || text.includes('재정')) {
    return ['지출을 줄여야 할까?', '들어오는 돈의 흐름은 언제쯤 강해질까?', '지금 투자 흐름은 어때 보여?'];
  }

  return ['이 부분 조금 더 자세히 말해줘', '내가 어떻게 움직이면 좋을까?', '조심해야 할 신호도 있을까?'];
}

const isSpeechSupported = () =>
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

function useVoiceInput(onResult) {
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    if (!isSpeechSupported()) {
      setUnsupported(true);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
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
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { listening, unsupported, toggle };
}

export default function ChatStep({
  chatHistory,
  chatInput,
  setChatInput,
  chatLoading,
  chatLeft,
  latestChatIdx,
  selQs,
  profileNudge,
  setProfileNudge,
  setShowProfileModal,
  handleSendChat,
  handleSaveChatImage,
  chatEndRef,
  generateChatSuggestions,
}) {
  const [aiChips, setAiChips] = useState(null);
  const [aiChipsLoading, setAiChipsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (chatHistory.length === 0 && generateChatSuggestions && !aiChips && !aiChipsLoading) {
      setAiChipsLoading(true);
      generateChatSuggestions().then((result) => {
        if (!active) return;
        if (result && result.length > 0) setAiChips(result);
        setAiChipsLoading(false);
      });
    }

    return () => {
      active = false;
    };
  }, [chatHistory.length, generateChatSuggestions, aiChips, aiChipsLoading]);

  const chips = aiChips || getContextualChips(chatHistory);
  const lastMsg = chatHistory[chatHistory.length - 1];
  const lastMsgIsStreaming = lastMsg?.streaming === true;

  const { listening, unsupported, toggle: toggleVoice } = useVoiceInput((text) => {
    setChatInput((prev) => (prev ? `${prev} ${text}` : text));
  });

  function sendChip(chip) {
    handleSendChat(chip);
  }

  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="chat-page-title">별숨에게 더 물어보기</div>
          {chatHistory.length > 0 && (
            <button className="res-top-btn" style={{ flexShrink: 0, marginTop: 2 }} onClick={handleSaveChatImage}>
              저장
            </button>
          )}
        </div>
        <div className="chat-page-sub">
          {selQs.slice(0, 2).map((question, index) => (
            <div key={index} style={{ marginTop: 3 }}>
              Q{index + 1}. {question.length > 28 ? `${question.slice(0, 28)}...` : question}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-history">
        {chatHistory.length === 0 && (
          <div
            style={{
              color: 'var(--t4)',
              fontSize: 'var(--sm)',
              textAlign: 'center',
              padding: 'var(--sp4) var(--sp3)',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>✦</div>
            방금 본 흐름을 바탕으로 자연스럽게 이어서 물어보세요.
          </div>
        )}

        {chatHistory.map((message, index) => (
          <div key={index} className={`chat-msg ${message.role}`}>
            <div className="chat-role">{message.role === 'ai' ? '별숨' : '나'}</div>
            {message.role === 'ai' ? (
              message.streaming ? (
                <div style={{ padding: '8px 0' }}>
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              ) : (
                <ChatBubble text={message.text} isNew={index === latestChatIdx} />
              )
            ) : (
              <div className="chat-bubble">{message.text}</div>
            )}
          </div>
        ))}

        {chatLoading && !lastMsgIsStreaming && (
          <div className="chat-msg ai">
            <div className="chat-role">별숨</div>
            <div style={{ padding: '8px 0' }}>
              <div className="typing-dots"><span /><span /><span /></div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {profileNudge && (
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--bg2)',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ flex: 1, fontSize: 'var(--sm)', color: 'var(--t2)' }}>{profileNudge.label}</span>
          <button
            onClick={() => {
              setShowProfileModal(true);
              setProfileNudge(null);
            }}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: '1px solid var(--gold)',
              background: 'var(--goldf)',
              color: 'var(--gold)',
              fontSize: 'var(--xs)',
              fontFamily: 'var(--ff)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            입력하기
          </button>
          <button
            onClick={() => setProfileNudge(null)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: '1px solid var(--line)',
              background: 'none',
              color: 'var(--t4)',
              fontSize: 'var(--xs)',
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
            }}
          >
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
          <div
            style={{
              textAlign: 'center',
              padding: '8px 16px',
              fontSize: 'var(--xs)',
              color: 'var(--t4)',
              borderTop: '1px solid var(--line)',
            }}
          >
            오늘 채팅을 모두 사용했어요.
          </div>
        )}

        {chatLeft > 0 && !chatLoading && (
          <div
            style={{
              overflowX: 'auto',
              padding: '8px 16px 4px',
              display: 'flex',
              gap: 8,
              scrollbarWidth: 'none',
            }}
          >
            {aiChipsLoading ? (
              <div
                style={{
                  fontSize: 'var(--xs)',
                  color: 'var(--t4)',
                  padding: '6px 14px',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div className="typing-dots"><span /><span /><span /></div>
                질문을 고르는 중...
              </div>
            ) : (
              chips.map((chip, index) => (
                <button
                  key={index}
                  onClick={() => sendChip(chip)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid var(--line)',
                    background: 'var(--bg2)',
                    color: 'var(--t2)',
                    fontSize: 'var(--xs)',
                    fontFamily: 'var(--ff)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--trans-fast)',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor = 'var(--gold)';
                    event.currentTarget.style.color = 'var(--gold)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = 'var(--line)';
                    event.currentTarget.style.color = 'var(--t2)';
                  }}
                >
                  {chip}
                </button>
              ))
            )}
          </div>
        )}

        <div className="chat-inp-row">
          <input
            className="chat-inp"
            placeholder={
              chatLeft > 0
                ? listening
                  ? '말하고 있어요...'
                  : '별숨에게 이어서 물어보세요'
                : '오늘 채팅을 모두 사용했어요'
            }
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSendChat();
              }
            }}
            disabled={chatLeft <= 0 || chatLoading}
          />

          {!unsupported && chatLeft > 0 && (
            <button
              onClick={toggleVoice}
              disabled={chatLoading}
              title={listening ? '녹음 중지' : '음성으로 입력'}
              style={{
                flexShrink: 0,
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: listening ? '2px solid var(--rose)' : '1px solid var(--line)',
                background: listening ? 'rgba(224,90,58,0.12)' : 'var(--bg2)',
                color: listening ? 'var(--rose)' : 'var(--t3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: chatLoading ? 'not-allowed' : 'pointer',
                transition: 'all .2s ease',
                animation: listening ? 'mic-pulse 1.2s ease-in-out infinite' : 'none',
              }}
            >
              {listening ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
          )}

          <button
            className="chat-send"
            onClick={handleSendChat}
            disabled={!chatInput.trim() || chatLeft <= 0 || chatLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/>
            </svg>
          </button>
        </div>

        {listening && (
          <div
            style={{
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--xs)',
              color: 'var(--rose)',
            }}
          >
            <span style={{ animation: 'mic-pulse 1.2s ease-in-out infinite', display: 'inline-block' }}>●</span>
            <span>듣고 있어요. 말씀을 마치면 자동으로 입력돼요.</span>
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
