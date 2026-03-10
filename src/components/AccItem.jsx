import { useState, useEffect, useMemo } from 'react';
import { useWordTyping } from '../hooks/useTyping';

// ═══════════════════════════════════════════════════════════
//  아코디언 아이템 (typedSet으로 재오픈 방지)
// ═══════════════════════════════════════════════════════════
// [요약] 태그 파싱 유틸
function parseAccSummary(text){
  if(!text) return {summary:'', body:text||''};
  const m = text.match(/^\[요약\]\s*(.+?)(\n|$)/);
  if(m){
    const summary = m[1].trim();
    const body = text.slice(m[0].length).trimStart();
    return {summary, body};
  }
  // [요약] 없으면 첫 문장을 summary로 추출
  const sents = text.split(/(?<=[.!?。])\s+/).filter(s=>s.length>10);
  const summary = sents[0]||'';
  const body = text;
  return {summary, body};
}

function AccItem({q,text,idx,isOpen,onToggle,shouldType,onTypingDone}){
  const isTyping = shouldType && isOpen;
  const{shown,done,skipToEnd}=useWordTyping(text, isTyping, 130);

  const display = !shouldType ? text : isOpen ? shown : '';
  const isDone = !shouldType || done;

  // [요약] 파싱 — 완성된 텍스트에서만
  const {summary, body} = parseAccSummary(isDone ? text : '');
  // 타이핑 중 요약 미리 보기 (첫 줄이 [요약]이면 즉시 노출)
  const liveSum = useMemo(()=>{
    if(!shouldType) return parseAccSummary(text).summary;
    if(shown){
      const m = shown.match(/^\[요약\]\s*(.+?)(\n|$)/);
      if(m) return m[1].trim();
    }
    return '';
  },[shown, shouldType, text]);

  const summaryText = isDone ? summary : liveSum;

  // 타이핑 완료 콜백 — 닫지 않고 완료 표시만
  useEffect(()=>{
    if(done && shouldType) onTypingDone(idx);
  },[done,shouldType,idx,onTypingDone]);

  return(
    <div className="acc-item">
      {/* ── 요약 줄 — 항상 노출 (답변 있을 때) ── */}
      {summaryText&&(
        <div className="acc-summary-line">
          <span className="acc-summary-icon">✦</span>
          <span className="acc-summary-text">{summaryText}</span>
        </div>
      )}

      {/* ── 아코디언 헤더 ── */}
      <button className={`acc-trigger${isOpen?' open':''}`} onClick={onToggle}>
        <div className="acc-q-wrap">
          <div className="acc-q-num">Q{idx+1}</div>
          <div className="acc-q-text">{q}</div>
          {!isOpen&&!summaryText&&<div style={{fontSize:'var(--xs)',color:'var(--t4)',marginTop:3}}>이 이야기도 기다리고 있어요 ✦</div>}
          {!isOpen&&summaryText&&isDone&&(
            <button className="acc-read-more" onClick={e=>{e.stopPropagation();onToggle();}}>
              전체 보기 ↓
            </button>
          )}
        </div>
        <div className="acc-right">
          {isOpen&&!isDone&&<button className="skip-btn" onClick={e=>{e.stopPropagation();skipToEnd();}}>바로 보기</button>}
          <span className={`acc-chevron${isOpen?' open':''}`}>▼</span>
        </div>
      </button>

      {/* ── 펼쳐지는 본문 ── */}
      <div className={`acc-body${isOpen?' open':' closed'}`} style={isOpen?{maxHeight:'3000px',opacity:1}:{maxHeight:0,opacity:0}}>
        <div className="acc-content">
          <p>{display}{isOpen&&!isDone&&<span className="typing-cursor"/>}</p>
        </div>
      </div>
    </div>
  );
}

export default AccItem;
