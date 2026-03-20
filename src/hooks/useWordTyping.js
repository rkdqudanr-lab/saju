import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
//  단어 단위 타이핑 훅 (rAF + 50ms 배치 업데이트)
// ═══════════════════════════════════════════════════════════
export default function useWordTyping(text, active, speed=130){
  const[shown,setShown]=useState('');
  const[done,setDone]=useState(false);
  const rafRef=useRef(null);
  const animRef=useRef({ idx:0, nextTime:0, words:[] });

  const getDelay=(word,base)=>{
    const trimmed=word.trimEnd();
    if(/[.!?…]$/.test(trimmed)) return base+233;
    if(/[,]$/.test(trimmed))     return base+120;
    if(/\n/.test(word))          return base+167;
    return base;
  };

  useEffect(()=>{
    if(!active||!text) return;
    setShown('');setDone(false);
    const words=text.split(/(\s+)/);
    animRef.current={ idx:0, nextTime:performance.now()+speed, words };

    const tick=(now)=>{
      const a=animRef.current;
      if(a.idx>=a.words.length){setDone(true);return;}

      // 아직 다음 단어 시간이 안 됐으면 대기 (50ms 여유)
      if(now < a.nextTime-50){
        rafRef.current=requestAnimationFrame(tick);
        return;
      }

      // 50ms 윈도우 안에 들어오는 단어 일괄 처리
      while(a.idx<a.words.length && a.nextTime<=now+50){
        const word=a.words[a.idx];
        a.idx++;
        a.nextTime+=getDelay(word,speed);
      }

      setShown(a.words.slice(0,a.idx).join(''));

      if(a.idx>=a.words.length){setDone(true);return;}
      rafRef.current=requestAnimationFrame(tick);
    };

    rafRef.current=requestAnimationFrame(tick);
    return()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[text,active,speed]);

  const skipToEnd=useCallback(()=>{
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    setShown(text);setDone(true);
  },[text]);

  return{shown,done,skipToEnd};
}
