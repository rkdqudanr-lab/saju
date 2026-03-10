import { useState } from 'react';

// ═══════════════════════════════════════════════════════════
//  🌅 오늘의 별숨 컴포넌트 (시간대별)
// ═══════════════════════════════════════════════════════════
function TodayByeolsoom({slot,name,saju,sun,onAsk,onReview}){
  const cfg=TIME_CONFIG[slot];
  const[open,setOpen]=useState(false);
  const[reviewText,setReviewText]=useState('');
  const isEvening=slot==='evening'||slot==='dawn';

  return(
    <div className="land-slot-wrap">
      {/* 한 줄 탭 */}
      <button className={`land-slot-card ${open?'open':''}`} onClick={()=>setOpen(v=>!v)}>
        <span className="land-slot-emoji">{cfg.emoji}</span>
        <span className="land-slot-label">
          <span className="land-slot-title">{cfg.label}</span>
          <span className="land-slot-hint">{cfg.greeting(name)}</span>
        </span>
        <span className="land-slot-arr">›</span>
      </button>
      {/* 펼쳐지는 바디 */}
      {open&&(
        <div className="land-slot-body">
          {isEvening&&(
            <textarea className="review-inp"
              placeholder={cfg.inputPlaceholder}
              value={reviewText}
              onChange={e=>setReviewText(e.target.value)}
              style={{marginBottom:10}}/>
          )}
          <button className="land-slot-body-btn"
            onClick={()=>{
              setOpen(false);
              if(isEvening&&reviewText.trim()){onReview(reviewText,cfg.prompt);}
              else{onAsk(cfg.prompt);}
            }}>
            {cfg.ctaText}
          </button>
        </div>
      )}
    </div>
  );
}


export default TodayByeolsoom;
