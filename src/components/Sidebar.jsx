import { useState } from "react";
import { loadHistory, deleteHistory } from "../utils/history.js";

// ═══════════════════════════════════════════════════════════
//  🗂️ 사이드바
// ═══════════════════════════════════════════════════════════
export default function Sidebar({user,step,onClose,onNav,onKakaoLogin,onKakaoLogout,onProfileOpen}){
  const[histItems,setHistItems]=useState(()=>loadHistory());
  const[search,setSearch]=useState('');

  const filtered=histItems.filter(h=>
    h.questions.some(q=>q.includes(search))||
    h.answers.some(a=>a.includes(search))
  );

  const del=(id,e)=>{
    e.stopPropagation();
    deleteHistory(id);
    setHistItems(loadHistory());
  };

  const SLOT_EMOJI={morning:'🌅',afternoon:'✦',evening:'🌙',dawn:'🌌'};

  return(
    <>
      <div className="sidebar-overlay" onClick={onClose}/>
      <div className="sidebar">
        <div className="sidebar-head">
          <div className="sidebar-logo">✦ byeolsoom</div>
          {user?(
            <div className="sidebar-user">
              {user.profileImage
                ?<img className="sidebar-av" src={user.profileImage} alt="프로필"/>
                :<div className="sidebar-av-ph">🌙</div>}
              <div>
                <div className="sidebar-uname">{user.nickname}님</div>
                <div className="sidebar-usub">별숨과 함께하는 중</div>
              </div>
            </div>
          ):(
            <div className="sidebar-user">
              <div className="sidebar-av-ph">✦</div>
              <div>
                <div className="sidebar-uname">게스트</div>
                <div className="sidebar-usub" style={{cursor:'pointer',color:'var(--gold)'}} onClick={onKakaoLogin}>카카오 로그인 →</div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-body">
          <div className="sidebar-section">
            <div className="sidebar-section-lbl">메뉴</div>
            {[
              {icon:'🏠',label:'홈',s:0},
              {icon:'✦',label:'별숨에게 물어보기',s:1},
              {icon:'📅',label:'월간 리포트',s:6},
              {icon:'💞',label:'우리가 만나면',s:7},
              {icon:'🔮',label:'별숨의 예언',s:8},
            ].map(m=>(
              <button key={m.s} className={`sidebar-menu-item ${step===m.s?'active':''}`}
                onClick={()=>{onNav(m.s);onClose();}}>
                <span className="smi-icon">{m.icon}</span>
                <span className="smi-text">{m.label}</span>
              </button>
            ))}
            {user&&(
              <button className="sidebar-menu-item" onClick={()=>{onProfileOpen();onClose();}}>
                <span className="smi-icon">⚙️</span>
                <span className="smi-text">나의 별자리 지도</span>
              </button>
            )}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-lbl">지난 이야기 ({histItems.length})</div>
            {histItems.length>0&&(
              <div style={{padding:'0 var(--sp3) 8px'}}>
                <input className="hist-search-inp" placeholder="🔍  지난 이야기 검색..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
            )}
            {filtered.length===0?(
              <div className="sidebar-empty">
                아직 별숨과 나눈 이야기가 없어요 🌙<br/>
                첫 질문을 던져봐요
              </div>
            ):(
              filtered.slice(0,15).map(h=>(
                <div key={h.id} className="sidebar-hist-item" onClick={()=>{onNav('history',h);onClose();}}>
                  <div className="shi-date">{SLOT_EMOJI[h.slot]||'✦'} {h.date}</div>
                  <div className="shi-q">{h.questions[0]}</div>
                  {h.questions.length>1&&<div style={{fontSize:'var(--xs)',color:'var(--t4)',marginTop:2}}>+{h.questions.length-1}개 더</div>}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-foot">
          {user&&<button className="sidebar-foot-btn" onClick={()=>{onKakaoLogout();onClose();}}>로그아웃</button>}
        </div>
      </div>
    </>
  );
}
