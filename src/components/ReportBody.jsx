import { useReportTyping } from '../hooks/useTyping';

// ═══════════════════════════════════════════════════════════
//  리포트 타이핑
// ═══════════════════════════════════════════════════════════
function ReportBody({text}){
  const{shown,done,skipToEnd}=useWordTyping(text,true,35);
  return(
    <div className="report-content">
      {!done&&(
        <div className="report-skip">
          <button className="report-skip-btn" onClick={skipToEnd}>바로 보기 ✦</button>
        </div>
      )}
      <div className="report-text">
        <p>{shown}{!done&&<span className="typing-cursor"/>}</p>
      </div>
    </div>
  );
}




export default ReportBody;
