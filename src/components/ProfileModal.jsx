import { useState, useMemo } from "react";
import { getSaju } from "../utils/saju.js";
import { getSun } from "../utils/astrology.js";
import { ON } from "../utils/saju.js";

// ═══════════════════════════════════════════════════════════
//  👤 개인화 프로필 모달 — 나의 별자리 지도
// ═══════════════════════════════════════════════════════════
const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
];

export default function ProfileModal({profile,setProfile,onClose}){
  const[local,setLocal]=useState({
    mbti:'',
    naturalDesc:'',
    ...profile,
  });
  const[naturalMode,setNaturalMode]=useState(false);

  const partnerSaju=useMemo(()=>{
    if(local.partnerBy&&local.partnerBm&&local.partnerBd)
      return getSaju(+local.partnerBy,+local.partnerBm,+local.partnerBd,12);
    return null;
  },[local.partnerBy,local.partnerBm,local.partnerBd]);
  const partnerSun=useMemo(()=>{
    if(local.partnerBm&&local.partnerBd) return getSun(+local.partnerBm,+local.partnerBd);
    return null;
  },[local.partnerBm,local.partnerBd]);

  const save=()=>{setProfile(local);onClose();};
  const upd=(k,v)=>setLocal(p=>({...p,[k]:v}));

  return(
    <div className="profile-overlay" onClick={e=>{if(e.target.className==='profile-overlay')onClose();}}>
      <div className="profile-sheet">
        <div className="profile-handle"/>
        <div className="profile-title">✦ 나의 별자리 지도</div>
        <div className="profile-sub">저장하면 모든 운세에 자동으로 반영돼요.<br/>입력할수록 더 깊이 읽어드릴게요.</div>

        {/* 💬 자연어 자기소개 섹션 */}
        <div className="profile-section">
          <div className="profile-section-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>💬 나에 대해 자유롭게</span>
            <button
              onClick={()=>setNaturalMode(p=>!p)}
              style={{
                padding:'4px 10px',borderRadius:20,
                border:`1px solid ${naturalMode?'var(--gold)':'var(--line)'}`,
                background:naturalMode?'var(--goldf)':'var(--bg2)',
                color:naturalMode?'var(--gold)':'var(--t3)',
                fontSize:'10px',fontWeight:600,fontFamily:'var(--ff)',
                cursor:'pointer',transition:'all .2s',
              }}
            >
              {naturalMode?'✦ 작성 중':'+ 자연어로 입력하기'}
            </button>
          </div>
          {naturalMode?(
            <>
              <div style={{fontSize:'var(--xs)',color:'var(--t3)',marginBottom:8,lineHeight:1.6}}>
                편하게 이야기하듯 써주세요. 별숨이 운세에 자동으로 녹여드려요.
              </div>
              <textarea
                className="diy-inp"
                placeholder={`예시:\n"저는 서울에서 UX 디자이너로 일하는 28살 여성이에요. 요즘 이직을 고민하고 있고, 새로 좋아하게 된 사람이 생겼어요. 내성적인 편이라 혼자 있는 시간이 필요해요."`}
                value={local.naturalDesc||''}
                onChange={e=>upd('naturalDesc',e.target.value)}
                style={{height:120,marginBottom:0}}
                maxLength={400}
              />
              <div style={{fontSize:'10px',color:'var(--t4)',textAlign:'right',marginTop:4}}>
                {(local.naturalDesc||'').length}/400자
              </div>
            </>
          ):(
            local.naturalDesc?(
              <div style={{
                padding:'10px 12px',background:'var(--bg2)',borderRadius:'var(--r1)',
                border:'1px solid var(--line)',fontSize:'var(--xs)',color:'var(--t2)',
                lineHeight:1.7,cursor:'pointer',
              }} onClick={()=>setNaturalMode(true)}>
                {local.naturalDesc.length>80?local.naturalDesc.slice(0,80)+'...':local.naturalDesc}
                <span style={{color:'var(--gold)',marginLeft:6}}>수정 ›</span>
              </div>
            ):(
              <div style={{fontSize:'var(--xs)',color:'var(--t4)',lineHeight:1.7}}>
                직업, 현재 상황, 성격, 고민 등을 자연스럽게 써주면<br/>운세가 훨씬 더 정확해져요.
              </div>
            )
          )}
        </div>

        {/* 🧠 MBTI 섹션 */}
        <div className="profile-section">
          <div className="profile-section-title">🧠 MBTI</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:4}}>
            {MBTI_TYPES.map(t=>(
              <button
                key={t}
                onClick={()=>upd('mbti', local.mbti===t?'':t)}
                style={{
                  padding:'8px 4px',borderRadius:'var(--r1)',
                  border:`1px solid ${local.mbti===t?'var(--gold)':'var(--line)'}`,
                  background:local.mbti===t?'var(--goldf)':'var(--bg2)',
                  color:local.mbti===t?'var(--gold)':'var(--t2)',
                  fontSize:'var(--xs)',fontWeight:local.mbti===t?700:400,
                  fontFamily:'var(--ff)',cursor:'pointer',transition:'all .15s',
                  letterSpacing:'.02em',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {local.mbti&&(
            <div style={{fontSize:'var(--xs)',color:'var(--t3)',marginTop:4}}>
              {local.mbti} 유형이 운세에 반영돼요 ✦
            </div>
          )}
        </div>

        {/* 💕 연인 정보 */}
        <div className="profile-section">
          <div className="profile-section-title">💕 연인 정보</div>
          <input className="inp" placeholder="연인 이름 (선택)"
            value={local.partner} onChange={e=>upd('partner',e.target.value)}/>
          <div style={{fontSize:'var(--xs)',color:'var(--t4)',marginBottom:8,marginTop:-8}}>생년월일을 알면 더 깊이 볼 수 있어요</div>
          <div className="row" style={{marginBottom:'var(--sp2)'}}>
            <div className="col">
              <input className="inp" placeholder="출생년도" maxLength={4} inputMode="numeric"
                value={local.partnerBy} onChange={e=>upd('partnerBy',e.target.value.replace(/\D/,''))}
                style={{marginBottom:0}}/>
            </div>
            <div className="col">
              <select className="inp" value={local.partnerBm} onChange={e=>upd('partnerBm',e.target.value)} style={{marginBottom:0}}>
                <option value="">월</option>
                {[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}
              </select>
            </div>
            <div className="col">
              <select className="inp" value={local.partnerBd} onChange={e=>upd('partnerBd',e.target.value)} style={{marginBottom:0}}>
                <option value="">일</option>
                {[...Array(31)].map((_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}
              </select>
            </div>
          </div>
          {partnerSaju&&(
            <div style={{padding:'10px 12px',background:'var(--bg2)',borderRadius:'var(--r1)',border:'1px solid var(--line)',marginBottom:'var(--sp2)'}}>
              <div style={{fontSize:'var(--xs)',color:'var(--gold)',marginBottom:4}}>✦ {local.partner||'연인'}의 기질</div>
              <div style={{fontSize:'var(--xs)',color:'var(--t2)',lineHeight:1.75}}>{partnerSaju.ilganDesc}</div>
              {partnerSun&&<div style={{fontSize:'var(--xs)',color:'var(--t3)',marginTop:3}}>{partnerSun.s} {partnerSun.n} · {ON[partnerSaju.dom]} 기운</div>}
            </div>
          )}
        </div>

        {/* 💼 직장 / 상황 */}
        <div className="profile-section">
          <div className="profile-section-title">💼 직장 / 현재 상황</div>
          <input className="inp" placeholder="예: 스타트업 마케터, 공무원 준비 중, 프리랜서 디자이너..."
            value={local.workplace} onChange={e=>upd('workplace',e.target.value)}/>
        </div>

        {/* 🌙 요즘 고민 */}
        <div className="profile-section">
          <div className="profile-section-title">🌙 요즘 가장 큰 고민</div>
          <textarea className="diy-inp" placeholder="예: 이직을 할지 말지 고민 중이에요 / 연인이랑 자꾸 다퉈요 / 돈이 자꾸 나가요..."
            value={local.worryText} onChange={e=>upd('worryText',e.target.value)}
            style={{height:72,marginBottom:0}}/>
        </div>

        <button className="profile-save-btn" onClick={save}>저장하고 반영하기 ✦</button>
        <button className="profile-close-btn" onClick={onClose}>나중에 할게요</button>
      </div>
    </div>
  );
}
