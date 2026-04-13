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
      <div className="chat-page-header" style={{ background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid var(--line)', padding: '12px 16px', sticky: 'top', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="chat-page-title" style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>💬 별숨과 대화하기</div>
          {chatHistory.length > 0 && (
            <button className="res-top-btn" style={{ padding: '4px 10px', fontSize: 'var(--xxs)', height: 'auto' }} onClick={handleSaveChatImage}>🖼 저장</button>
          )}
        </div>
        <div className="chat-page-sub" style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selQs.slice(0, 1).map((q, i) => <span key={i}>✦ {q.length > 35 ? q.slice(0, 35) + '…' : q}</span>)}
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

      <div className="chat-input-area" style={{ background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(16px)', borderTop: '0.5px solid var(--line)', paddingBottom: 'calc(var(--sp3) + env(safe-area-inset-bottom))' }}>
        {chatLeft > 0 && (
          <div style={{ fontSize: 'var(--xxs)', color: 'var(--t4)', textAlign: 'right', padding: '6px 16px 4px', fontWeight: 500, letterSpacing: '0.02em' }}>
            남은 채팅: {chatLeft}회
          </div>
        )}
        {chatLeft <= 0 && (
          <div style={{ textAlign: 'center', padding: '12px 16px', fontSize: 'var(--xxs)', color: 'var(--rose)', fontWeight: 600 }}>
             채팅을 모두 사용했어요 · 새 상담을 시작해주세요
          </div>
        )}
        {chatLeft > 0 && !chatLoading && (
          <div className="chat-sugg-wrap" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 16px 12px', scrollbarWidth: 'none' }}>
            {CHAT_SUGG.map((s, i) => <button key={i} className="sugg-btn" onClick={() => setChatInput(s)} style={{ background: 'var(--bg-glass)', border: '0.5px solid var(--line)', borderRadius: 20, padding: '6px 14px', fontSize: 'var(--xxs)', whiteSpace: 'nowrap', color: 'var(--t2)' }}>{s}</button>)}
          </div>
        )}
        <div className="chat-inp-row" style={{ padding: '0 12px 0 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="chat-inp"
            style={{ background: 'var(--bg3)', border: '0.5px solid var(--line)', borderRadius: 12, padding: '12px 16px', fontSize: 'var(--sm)', flex: 1 }}
            placeholder={chatLeft > 0 ? '더 궁금한 게 있어요? 🌙' : '채팅을 모두 사용했어요'}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
            disabled={chatLeft <= 0 || chatLoading} />
          <button className="chat-send" onClick={handleSendChat} disabled={!chatInput.trim() || chatLeft <= 0 || chatLoading} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold-grad)', border: 'none', color: '#000', fontSize: 'var(--lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✦</button>
        </div>
      </div>
    </div>
  );
}
