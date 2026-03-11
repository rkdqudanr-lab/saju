import { useState, useEffect } from "react";
import useWordTyping from "../hooks/useWordTyping.js";

// ═══════════════════════════════════════════════════════════
//  👍👎 피드백 버튼
// ═══════════════════════════════════════════════════════════
export function FeedbackBtn({qIdx}){
  const[sel,setSel]=useState(null);
  if(sel!==null) return <div className="fb-wrap"><span className="fb-done">✦ 고마워요!</span></div>;
  return(
    <div className="fb-wrap">
      <span className="fb-label">이 이야기가 도움이 됐나요?</span>
      <button className="fb-btn" onClick={()=>setSel('up')}>👍</button>
      <button className="fb-btn" onClick={()=>setSel('down')}>👎</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  아코디언 아이템
// ═══════════════════════════════════════════════════════════
export default function AccItem({q,text,idx,isOpen,onToggle,shouldType,onTypingDone}){
  const isTyping = shouldType && isOpen;
  const{shown,done,skipToEnd}=useWordTyping(text, isTyping, 130);
  const display = !shouldType ? text : isOpen ? shown : '';
  const isDone = !shouldType || done;

  useEffect(()=>{if(done&&shouldType)onTypingDone(idx);},[done,shouldType,idx,onTypingDone]);

  return(
    <div className="acc-item">
      <button className={`acc-trigger${isOpen?' open':''}`} onClick={onToggle}>
        <div className="acc-q-wrap">
          <div className="acc-q-num">Q{idx+1}</div>
          <div className="acc-q-text">{q}</div>
          {!isOpen&&!display&&<div style={{fontSize:'var(--xs)',color:'var(--t4)',marginTop:3}}>이 이야기도 기다리고 있어요 ✦</div>}
        </div>
        <div className="acc-right">
          {isOpen&&!isDone&&<button className="skip-btn" onClick={e=>{e.stopPropagation();skipToEnd();}}>바로 보기</button>}
          <span className={`acc-chevron${isOpen?' open':''}`}>▼</span>
        </div>
      </button>
      <div className={`acc-body${isOpen?' open':' closed'}`}>
        <div className="acc-content">
          <p>{display}{isOpen&&!isDone&&<span className="typing-cursor"/>}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  채팅 AI 버블
// ═══════════════════════════════════════════════════════════
export function ChatBubble({text,isNew}){
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

// ═══════════════════════════════════════════════════════════
//  리포트 타이핑
// ═══════════════════════════════════════════════════════════
export function ReportBody({text}){
  const{shown,done,skipToEnd}=useWordTyping(text,true,35);
  return(
    <div className="report-content">
      {!done&&(
        <div className="report-skip">
          <button className="report-skip-btn" onClick={skipToEnd}>바로 보기 ✦</button>
        </div>
      )}
      <div className="report-text">
        <p>{shown}{!done&&<span className="typing-cursor"/>}</p>
      </div>
    </div>
  );
}
