import { useState, useCallback } from 'react';
import { useReportTyping } from '../hooks/useTyping';

// ═══════════════════════════════════════════════════════════
//  💌 별의 편지 페이지
// ═══════════════════════════════════════════════════════════
function LetterPage({form,saju,sun,moon,today,callApi,buildCtx,onBack}){
  const[letterText,setLetterText]=useState('');
  const[loading,setLoading]=useState(true);
  const futureDate=useMemo(()=>{
    const d=new Date();d.setDate(d.getDate()+92);
    return`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
  },[]);
  const{shown,done,skipToEnd}=useWordTyping(letterText,!!letterText&&!loading,35);

  useEffect(()=>{
    (async()=>{
      try{
        const res=await fetch('/api/ask',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            userMessage:`[요청] 3개월 후(${futureDate})의 나에게 보내는 별의 편지를 써줘요. "미래의 나에게"로 시작하는 편지 형식으로, 지금의 나에게 3개월 뒤가 어떤 모습일지, 어떤 변화가 있을지, 무엇을 기억하면 좋을지를 따뜻하게 담아줘요.`,
            context:buildCtx(),
            isChat:false,isReport:false,isLetter:true,
          }),
        });
        const data=await res.json();
        if(!res.ok)throw new Error(data.error);
        setLetterText(data.text||'');
      }catch{
        setLetterText('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!');
      }finally{setLoading(false);}
    })();
  },[]);

  const saveImage=()=>{
    const canvas=document.createElement('canvas');
    canvas.width=900;canvas.height=600;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#0D0B14';ctx.fillRect(0,0,900,600);
    ctx.fillStyle='#E8B048';ctx.fillRect(0,0,900,3);
    ctx.font='500 18px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle='#E8B048';ctx.fillText('byeolsoom ✦ 별의 편지',48,50);
    ctx.font='400 15px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle='#8A7FA0';ctx.fillText(`${futureDate}에 열어봐요`,48,80);
    ctx.font='300 16px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle='#C8BEDE';
    const lines=letterText.slice(0,300).split('\n');
    let y=130;
    lines.forEach(line=>{
      if(y>520)return;
      const chunks=[];let tmp='';
      for(const ch of line){
        if(ctx.measureText(tmp+ch).width>800){chunks.push(tmp);tmp=ch;}else tmp+=ch;
      }
      if(tmp)chunks.push(tmp);
      chunks.forEach(chunk=>{ctx.fillText(chunk,48,y);y+=28;});
      y+=8;
    });
    ctx.font='400 13px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle='#4A4260';ctx.fillText('✦ 별숨이 당신에게 보낸 편지',48,570);
    const a=document.createElement('a');
    a.download=`byeolsoom_letter.png`;a.href=canvas.toDataURL('image/png');a.click();
  };

  return(
    <div className="page-top">
      <div className="letter-page">
        <div className="letter-envelope">
          <div className="letter-env-top">💌</div>
          <div className="letter-body">
            <div className="letter-date-to">
              <strong>{futureDate}</strong>의 {form.name||'당신'}에게 전하는 편지
            </div>
            {loading?(
              <div style={{textAlign:'center',padding:'var(--sp4)',color:'var(--t3)'}}>
                <div style={{fontSize:'1.5rem',marginBottom:'var(--sp2)',animation:'orbPulse 2s infinite'}}>✦</div>
                별이 당신의 3개월 뒤를 읽고 있어요...
              </div>
            ):(
              <div className="letter-content">
                <p>{shown}{!done&&<span className="typing-cursor"/>}</p>
              </div>
            )}
          </div>
          <div className="letter-seal">
            <span className="seal-icon">✦</span>
            <span className="seal-text">byeolsoom · 별숨이 씀</span>
          </div>
        </div>
        <div className="letter-actions">
          {done&&<button className="res-btn" onClick={saveImage} style={{flex:1}}>↗ 이미지 저장</button>}
          {!done&&letterText&&<button className="res-btn" onClick={skipToEnd} style={{flex:1}}>바로 보기 ✦</button>}
          <button className="res-btn" onClick={onBack} style={{flex:1}}>← 돌아가기</button>
        </div>
      </div>
    </div>
  );
}


export default LetterPage;
