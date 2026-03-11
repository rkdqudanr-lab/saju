import { useState, useCallback, useEffect } from "react";
import useWordTyping from "../hooks/useWordTyping.js";

// ═══════════════════════════════════════════════════════════
//  🔮 미래의 별숨
// ═══════════════════════════════════════════════════════════
export default function FutureProphecyPage({form, buildCtx, callApi, onBack}){
  const periods = ['1개월 후', '3개월 후', '1년 후', '10년 후', '30년 후'];
  const [selectedPeriod, setPeriod] = useState(periods[0]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const {shown, done, skipToEnd} = useWordTyping(text, !!text && !loading, 60);

  const fetchProphecy = useCallback(async (period) => {
    setLoading(true); setText('');
    try {
      const pText = await callApi(`[요청] ${period} 시점의 미래에 대해 사주와 점성술을 기반으로 한 통찰력 있는 예언 편지를 작성해줘. "미래의 별숨이 전하는 이야기"라는 느낌으로 구체적이고 몽환적으로 써줘.`);
      setText(pText);
    } catch {
      setText('별의 궤도를 읽는 데 실패했어요 🌙\n잠시 후 다시 시도해주세요.');
    } finally { setLoading(false); }
  }, [callApi]);

  useEffect(() => { fetchProphecy(selectedPeriod); }, [selectedPeriod, fetchProphecy]);

  return(
    <div className="page-top">
      <div className="inner" style={{animation:'fadeUp .5s ease'}}>
        <div style={{textAlign:'center', marginBottom:'var(--sp3)'}}>
          <div style={{fontSize:'var(--xl)', fontWeight:700, color:'var(--gold)'}}>미래의 별숨</div>
          <div style={{fontSize:'var(--xs)', color:'var(--t3)', marginTop:6}}>시간의 흐름에 따라 변화하는 당신의 운명을 읽어드려요</div>
        </div>

        <div style={{display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', marginBottom:'var(--sp3)'}}>
          {periods.map(p => (
            <button key={p}
              style={{
                padding:'8px 16px', borderRadius:'50px', border:'1px solid var(--line)',
                background: selectedPeriod===p ? 'var(--gold)' : 'var(--bg2)',
                color: selectedPeriod===p ? '#000' : 'var(--t3)',
                fontSize:'var(--sm)', fontWeight: selectedPeriod===p ? 700 : 400,
                cursor:'pointer', transition:'all .2s', fontFamily:'var(--ff)'
              }}
              onClick={()=>setPeriod(p)}
            >{p}</button>
          ))}
        </div>

        <div className="letter-envelope">
          <div className="letter-env-top" style={{background:'linear-gradient(135deg,var(--goldf),rgba(200,160,255,0.1))'}}>🔮</div>
          <div className="letter-body">
            <div style={{fontSize:'var(--xs)', color:'var(--gold)', marginBottom:16, fontWeight:600}}>✦ {selectedPeriod}의 예언</div>
            {loading ? (
              <div style={{textAlign:'center', padding:'var(--sp4) 0', color:'var(--t3)', fontSize:'var(--sm)'}}>
                <div className="load-orb-wrap" style={{marginTop:0, marginBottom:'var(--sp2)', transform:'scale(0.8)'}}>
                  <div className="load-orb"><div className="load-orb-core"/><div className="load-orb-ring"/></div>
                </div>
                시간의 장막을 걷어내는 중...
              </div>
            ) : (
              <div className="letter-content" style={{padding:0}}>
                <p>{shown}{!done&&<span className="typing-cursor"/>}</p>
              </div>
            )}
          </div>
        </div>

        <div style={{display:'flex', gap:8}}>
          {!done&&text&&<button className="btn-main" style={{marginTop:0}} onClick={skipToEnd}>결과 바로 보기 ✦</button>}
          {done&&<button className="res-btn" style={{flex:1, padding:14, borderRadius:'var(--r1)'}} onClick={onBack}>← 결과로 돌아가기</button>}
        </div>
      </div>
    </div>
  );
}
