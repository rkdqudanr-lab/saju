import { useState, useEffect } from "react";
import useWordTyping from "../hooks/useWordTyping.js";
import { TIMING } from "../utils/constants.js";

// ═══════════════════════════════════════════════════════════
//  👍👎 피드백 버튼
// ═══════════════════════════════════════════════════════════
export function FeedbackBtn({qIdx}){
  const[sel,setSel]=useState(null);
  if(sel!==null) return <div className="fb-wrap"><span className="fb-done">✦ 고마워요!</span></div>;
  return(
    <div className="fb-wrap" role="group" aria-label="피드백">
      <span className="fb-label">이 이야기가 도움이 됐나요?</span>
      <button className="fb-btn" aria-label="도움이 됐어요" onClick={()=>setSel('up')}>👍</button>
      <button className="fb-btn" aria-label="아쉬워요" onClick={()=>setSel('down')}>👎</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  아코디언 아이템
// ═══════════════════════════════════════════════════════════
const ERR_PATTERN = /다시 시도해봐요/;

export default function AccItem({q,text,idx,isOpen,onToggle,shouldType,onTypingDone,onRetry}){
  const isError = ERR_PATTERN.test(text || '');
  const isTyping = shouldType && isOpen && !isError;
  const{shown,done,skipToEnd}=useWordTyping(text, isTyping, TIMING.typingWord);
  const display = isError ? text : !shouldType ? text : isOpen ? shown : '';
  const isDone = isError || !shouldType || done;
  const bodyId = `acc-body-${idx}`;

  useEffect(()=>{if(done&&shouldType)onTypingDone(idx);},[done,shouldType,idx,onTypingDone]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
  };

  return(
    <div className="acc-item">
      <button
        className={`acc-trigger${isOpen?' open':''}`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={bodyId}
      >
        <div className="acc-q-wrap">
          <div className="acc-q-num">Q{idx+1}</div>
          <div className="acc-q-text">{q}</div>
          {!isOpen&&isError&&<div style={{fontSize:'var(--xs)',color:'#e06',marginTop:3}}>⚠ 오류 · 탭하여 다시 시도</div>}
          {!isOpen&&!display&&!isError&&<div style={{fontSize:'var(--xs)',color:'var(--t4)',marginTop:3}}>이 이야기도 기다리고 있어요 ✦</div>}
        </div>
        <div className="acc-right">
          {isOpen&&!isDone&&<button className="skip-btn" aria-label="타이핑 건너뛰기" onClick={e=>{e.stopPropagation();skipToEnd();}}>바로 보기</button>}
          <span className={`acc-chevron${isOpen?' open':''}`} aria-hidden="true">▼</span>
        </div>
      </button>
      <div id={bodyId} className={`acc-body${isOpen?' open':' closed'}`} role="region" aria-label={`Q${idx+1} 답변`}>
        <div className="acc-content">
          <p>{display}{isOpen&&!isDone&&<span className="typing-cursor" aria-hidden="true"/>}</p>
          {isOpen&&isError&&onRetry&&(
            <button
              className="skip-btn"
              style={{marginTop:8,color:'var(--gold)',borderColor:'var(--acc)'}}
              onClick={e=>{e.stopPropagation();onRetry();}}
            >다시 불러오기 ↺</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  채팅 AI 버블
// ═══════════════════════════════════════════════════════════
export function ChatBubble({text,isNew}){
  const{shown,done,skipToEnd}=useWordTyping(text,isNew,TIMING.typingChat);
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
  const{shown,done,skipToEnd}=useWordTyping(text,true,TIMING.typingReport);
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
