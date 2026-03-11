import { useState, useEffect, useRef } from "react";
import { SAMPLE_ESSAYS } from "../utils/constants.js";

// ═══════════════════════════════════════════════════════════
//  📖 랜딩 샘플 에세이 미리보기
// ═══════════════════════════════════════════════════════════
export default function SamplePreview(){
  const[text,setText]=useState('');
  const[essayIdx,setEssayIdx]=useState(0);
  const timerRef=useRef(null);
  const idxRef=useRef(0);

  useEffect(()=>{
    const essay=SAMPLE_ESSAYS[essayIdx];
    setText('');idxRef.current=0;
    const tick=()=>{
      if(idxRef.current>=essay.length){
        timerRef.current=setTimeout(()=>{
          setEssayIdx(p=>(p+1)%SAMPLE_ESSAYS.length);
        },2000);
        return;
      }
      idxRef.current++;
      setText(essay.slice(0,idxRef.current));
      const ch=essay[idxRef.current-1];
      const delay=ch==='.'||ch==='!'||ch==='?'?280:ch===','?120:ch==='\n'?200:28;
      timerRef.current=setTimeout(tick,delay);
    };
    timerRef.current=setTimeout(tick,400);
    return()=>clearTimeout(timerRef.current);
  },[essayIdx]);

  const signs=['물고기자리','사자자리','천칭자리'];
  return(
    <div className="sample-preview">
      <div className="sample-badge">✦ 별숨이 만든 예시 이야기예요</div>
      <div className="sample-name">{signs[essayIdx]}인 당신에게</div>
      <div className="sample-text">{text}<span className="sample-cursor"/></div>
    </div>
  );
}
