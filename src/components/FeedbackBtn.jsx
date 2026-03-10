import { useState } from 'react';

// ═══════════════════════════════════════════════════════════
function FeedbackBtn({qIdx}){
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


export default FeedbackBtn;
