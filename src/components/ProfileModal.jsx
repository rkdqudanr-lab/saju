import { useState, useMemo, useEffect, useRef } from "react";
import { getSaju } from "../utils/saju.js";
import { getSun } from "../utils/astrology.js";
import { ON } from "../utils/saju.js";

const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
];

// ═══════════════════════════════════════════════════════════
//  👤 개인화 프로필 모달
// ═══════════════════════════════════════════════════════════
export default function ProfileModal({profile,setProfile,onClose}){
  const[local,setLocal]=useState({mbti:'',selfDesc:'',...profile});
  const[showNaturalInput,setShowNaturalInput]=useState(false);
  const sheetRef=useRef(null);

  // ── 포커스 트랩 ──
  useEffect(()=>{
    const el=sheetRef.current;
    if(!el) return;
    const focusable=()=>[...el.querySelectorAll('button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(n=>!n.disabled);
    const first=focusable()[0];
    first?.focus();
    const handleKeyDown=(e)=>{
      if(e.key!=='Tab') return;
      const items=focusable();
      if(!items.length) return;
      const last=items[items.length-1];
      if(e.shiftKey){
        if(document.activeElement===items[0]){e.preventDefault();last.focus();}
      } else {
        if(document.activeElement===last){e.preventDefault();items[0].focus();}
      }
    };
    document.addEventListener('keydown',handleKeyDown);
    return()=>document.removeEventListener('keydown',handleKeyDown);
  },[]);
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
    <div className="profile-overlay" role="dialog" aria-modal="true" aria-label="별숨에게 나를 알려주기" onClick={e=>{if(e.target.className==='profile-overlay')onClose();}}>
      <div className="profile-sheet" ref={sheetRef}>
        <div className="profile-handle"/>
        <div className="profile-title">✦ 별숨에게 나를 알려주기</div>
        <div className="profile-sub">저장하면 모든 운세에 자동으로 반영돼요.<br/>입력할수록 더 깊이 읽어드릴게요.</div>

        {/* MBTI */}
        <div className="profile-section">
          <div className="profile-section-title">🧠 MBTI</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
            {MBTI_TYPES.map(t=>(
              <button key={t}
                onClick={()=>upd('mbti',local.mbti===t?'':t)}
                style={{
                  padding:'6px 10px',borderRadius:8,border:`1px solid ${local.mbti===t?'var(--gold)':'var(--line)'}`,
                  background:local.mbti===t?'var(--goldf)':'transparent',
                  color:local.mbti===t?'var(--gold)':'var(--t3)',
                  fontSize:'var(--xs)',fontFamily:'var(--ff)',fontWeight:local.mbti===t?700:400,
                  cursor:'pointer',transition:'all .15s'
                }}>
                {t}
              </button>
            ))}
          </div>
          {local.mbti&&(
            <div style={{fontSize:'var(--xs)',color:'var(--t4)',marginBottom:4}}>
              선택됨: <span style={{color:'var(--gold)',fontWeight:700}}>{local.mbti}</span>
              <button onClick={()=>upd('mbti','')}
                style={{marginLeft:8,background:'none',border:'none',color:'var(--t4)',cursor:'pointer',fontSize:'var(--xs)',fontFamily:'var(--ff)'}}>
                ✕ 지우기
              </button>
            </div>
          )}
        </div>

        {/* 자연어 입력 */}
        <div className="profile-section">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div className="profile-section-title" style={{marginBottom:0}}>✏️ 나에 대해 자유롭게 써줘요</div>
            <button
              onClick={()=>setShowNaturalInput(p=>!p)}
              style={{
                padding:'5px 12px',borderRadius:20,border:'1px solid var(--acc)',
                background:showNaturalInput?'var(--goldf)':'transparent',
                color:'var(--gold)',fontSize:'var(--xs)',fontFamily:'var(--ff)',
                fontWeight:600,cursor:'pointer',transition:'all .15s',flexShrink:0
              }}>
              {showNaturalInput?'접기 ▲':'입력하기 ▼'}
            </button>
          </div>
          {showNaturalInput&&(
            <>
              <div style={{fontSize:'var(--xs)',color:'var(--t4)',marginBottom:6,lineHeight:1.6}}>
                직업, 관계, 현재 상황 등 자유롭게 써주세요.<br/>
                예: "30대 직장인이고 최근 이직을 고민 중이에요. 연애는 3년째 같은 분과 만나고 있어요."
              </div>
              <textarea className="diy-inp"
                placeholder="나에 대해 자유롭게 써주세요 🌙"
                value={local.selfDesc} onChange={e=>upd('selfDesc',e.target.value)}
                style={{height:96,marginBottom:0}}/>
            </>
          )}
          {!showNaturalInput&&local.selfDesc&&(
            <div style={{fontSize:'var(--xs)',color:'var(--t3)',background:'var(--bg2)',borderRadius:'var(--r1)',padding:'8px 10px',lineHeight:1.6}}>
              {local.selfDesc.length>60?local.selfDesc.slice(0,60)+'…':local.selfDesc}
            </div>
          )}
        </div>

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

        <div className="profile-section">
          <div className="profile-section-title">💼 직장 / 현재 상황</div>
          <input className="inp" placeholder="예: 스타트업 마케터, 공무원 준비 중, 프리랜서 디자이너..."
            value={local.workplace} onChange={e=>upd('workplace',e.target.value)}/>
        </div>

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
