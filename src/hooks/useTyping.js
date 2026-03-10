import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════
//  단어 단위 타이핑 훅
// ═══════════════════════════════════════════════════════════
function useWordTyping(text, active, speed=130){
  const[shown,setShown]=useState('');
  const[done,setDone]=useState(false);
  const timerRef=useRef(null);

  // 마침표 호흡 딜레이 계산 — 편지 읽는 리듬
  const getDelay=(word,base)=>{
    const trimmed=word.trimEnd();
    if(/[.!?…]$/.test(trimmed)) return base+350; // 문장 끝 — 깊게 숨
    if(/[,]$/.test(trimmed))     return base+180; // 쉼표 — 살짝 쉬고
    if(/\n/.test(word))          return base+250; // 줄바꿈 — 문단 호흡
    return base;                                   // 일반 단어
  };

  useEffect(()=>{
    if(!active||!text) return;
    setShown('');setDone(false);
    const words=text.split(/(\s+)/);
    let idx=0;
    const tick=()=>{
      if(idx>=words.length){setDone(true);return;}
      const word=words[idx];
      idx++;
      setShown(words.slice(0,idx).join(''));
      timerRef.current=setTimeout(tick, getDelay(word,speed));
    };
    timerRef.current=setTimeout(tick,speed);
    return()=>clearTimeout(timerRef.current);
  },[text,active,speed]);

  const skipToEnd=useCallback(()=>{
    clearTimeout(timerRef.current);
    setShown(text);setDone(true);
  },[text]);

  return{shown,done,skipToEnd};
}

// ═══════════════════════════════════════════════════════════
//  👍👎 피드백 버튼

export { useWordTyping, useReportTyping };
