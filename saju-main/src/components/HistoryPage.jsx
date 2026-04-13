import { useState } from "react";
import { exportHistory } from "../utils/history.js";

// ═══════════════════════════════════════════════════════════
//  📖 히스토리 상세 페이지
// ═══════════════════════════════════════════════════════════
export default function HistoryPage({item,onBack,onDelete}){
  const[openIdx,setOpenIdx]=useState(0);
  const[deleted,setDeleted]=useState(false);
  const[confirmDel,setConfirmDel]=useState(false);
  const SLOT_LABEL={morning:'오전 운세',afternoon:'오후 운세',evening:'저녁 회고',dawn:'새벽 별숨'};

  if(deleted) return null;

  return(
    <div className="page-top">
      <div className="hist-page">
        <div className="hist-header">
          <div style={{fontSize:'var(--xs)',color:'var(--t4)',marginBottom:6}}>
            {SLOT_LABEL[item.slot]||'별숨 이야기'} · {item.date}
          </div>
          <div className="hist-title">지난 이야기</div>
          <div className="hist-sub">{item.questions.length}개의 질문과 답변</div>
        </div>
        <div className="hist-list">
          {item.questions.map((q,i)=>(
            <div key={i} className="hist-card">
              <div className="hist-card-head" onClick={()=>setOpenIdx(openIdx===i?-1:i)}>
                <div className="hch-left">
                  <div className="hch-date">Q{i+1}</div>
                  <div className="hch-q">{q}</div>
                </div>
                <div className="hch-right">
                  <span className={`hch-chevron ${openIdx===i?'open':''}`}>▼</span>
                </div>
              </div>
              {openIdx===i&&(
                <div className="hist-card-body">{item.answers[i]||'답변을 불러올 수 없어요'}</div>
              )}
            </div>
          ))}
        </div>
        <div style={{padding:'0 var(--sp3) var(--sp5)',display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="res-btn" style={{flex:1}} onClick={onBack} aria-label="목록으로 돌아가기">← 돌아가기</button>
          <button className="res-btn" onClick={exportHistory} aria-label="전체 히스토리 내보내기">⬇ 내보내기</button>
          {confirmDel
            ? <>
                <button className="hist-del-btn" style={{background:'var(--error,#e06)',color:'#fff'}} onClick={()=>{onDelete(item.id,item.supabaseId);setDeleted(true);onBack();}} aria-label="삭제 확인">정말 삭제</button>
                <button className="res-btn" onClick={()=>setConfirmDel(false)} aria-label="삭제 취소">취소</button>
              </>
            : <button className="hist-del-btn" onClick={()=>setConfirmDel(true)} aria-label="이 기록 삭제">삭제</button>
          }
        </div>
      </div>
    </div>
  );
}
