import { ChatBubble } from "../components/AccItem.jsx";
import { CHAT_SUGG } from "../utils/constants.js";

export default function ChatStep({
  chatHistory, chatInput, setChatInput, chatLoading,
  chatLeft, latestChatIdx,
  selQs,
  profileNudge, setProfileNudge,
  setShowProfileModal,
  handleSendChat, handleSaveChatImage,
  chatEndRef,
}) {
  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="chat-page-title">💬 별숨과 대화하기</div>
          {chatHistory.length > 0 && (
            <button className="res-top-btn" style={{ flexShrink: 0, marginTop: 2 }} onClick={handleSaveChatImage}>🖼 저장</button>
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
            더 궁금한 게 있으면 자유롭게 물어봐요 🌙
          </div>
        )}
        {chatHistory.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <div className="chat-role">{m.role === 'ai' ? '✦ 별숨' : '나'}</div>
            {m.role === 'ai'
              ? <ChatBubble text={m.text} isNew={i === latestChatIdx} />
              : <div className="chat-bubble">{m.text}</div>
            }
          </div>
        ))}
        {chatLoading && (
          <div className="chat-msg ai">
            <div className="chat-role">✦ 별숨</div>
            <div className="typing-dots"><span /><span /><span /></div>
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
        {chatLeft > 0 && !chatLoading && (
          <div className="chat-sugg-wrap">
            {CHAT_SUGG.map((s, i) => <button key={i} className="sugg-btn" onClick={() => setChatInput(s)}>{s}</button>)}
          </div>
        )}
        <div className="chat-inp-row">
          <input className="chat-inp"
            placeholder={chatLeft > 0 ? '더 궁금한 게 있어요? 🌙' : '채팅을 모두 사용했어요'}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
            disabled={chatLeft <= 0 || chatLoading} />
          <button className="chat-send" onClick={handleSendChat} disabled={!chatInput.trim() || chatLeft <= 0 || chatLoading}>✦</button>
        </div>
      </div>
    </div>
  );
}
