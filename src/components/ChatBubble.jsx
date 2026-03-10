import { useWordTyping } from '../hooks/useTyping';

// ═══════════════════════════════════════════════════════════
//  채팅 AI 버블 (타이핑 + 바로보기)
// ═══════════════════════════════════════════════════════════
function ChatBubble({text,isNew}){
  const{shown,done,skipToEnd}=useWordTyping(text,isNew,40);
  const display=isNew?shown:text;
  const isDone=!isNew||done;
  return(
    <div>
      <div className="chat-bubble">{display}{!isDone&&<span className="typing-cursor"/>}</div>
      {!isDone&&(
        <div className="chat-bubble-actions">
          <button className="skip-btn" onClick={skipToEnd}>바로 보기</button>
        </div>
      )}
    </div>
  );
}


export default ChatBubble;
