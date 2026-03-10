import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════
//  📖 랜딩 샘플 에세이 미리보기
// ═══════════════════════════════════════════════════════════
function SamplePreview(){
  const[text,setText]=useState('');
  const[essayIdx,setEssayIdx]=useState(0);
  const timerRef=useRef(null);
  const idxRef=useRef(0);

  useEffect(()=>{
    const essay=SAMPLE_ESSAYS[essayIdx];
    setText('');idxRef.current=0;
    const tick=()=>{
      if(idxRef.current>=essay.length){
        timerRef.current=setTimeout(()=>setEssayIdx(p=>(p+1)%SAMPLE_ESSAYS.length),2500);
        return;
      }
      idxRef.current++;
      setText(essay.slice(0,idxRef.current));
      const ch=essay[idxRef.current-1];
      const delay=ch==='.'||ch==='!'||ch==='?'?280:ch===','?120:ch==='\n'?200:28;
      timerRef.current=setTimeout(tick,delay);
    };
    timerRef.current=setTimeout(tick,500);
    return()=>clearTimeout(timerRef.current);
  },[essayIdx]);

  return(
    <div className="sample-preview">
      <div className="sample-name">✦ {SAMPLE_LABELS[essayIdx]}</div>
      <div className="sample-text">{text}<span className="sample-cursor"/></div>
      <div style={{fontSize:'var(--xs)',color:'var(--t4)',marginTop:6,textAlign:'right',fontStyle:'italic'}}>
        — 다른 별에게 전해진 이야기예요
      </div>
    </div>
  );
}

export default SamplePreview;
