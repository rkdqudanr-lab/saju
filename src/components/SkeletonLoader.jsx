import { CGO } from "../utils/saju.js";
import { LOAD_STATES } from "../utils/constants.js";

// ═══════════════════════════════════════════════════════════
//  Skeleton 로더
// ═══════════════════════════════════════════════════════════
export default function SkeletonLoader({qCount,saju,loadingMsgIdx}){
  const si = loadingMsgIdx !== undefined ? loadingMsgIdx % LOAD_STATES.length : 0;
  const pillars=[['연','yeon'],['월','wol'],['일','il'],['시','si']];
  return(
    <div className="loading-page">
      <div className="load-orb-wrap">
        <div className="load-orb">
          <div className="load-orb-core"/>
          <div className="load-orb-ring"/>
          <div className="load-orb-ring2"/>
        </div>
      </div>
      {saju&&(
        <div className="load-pillars">
          {pillars.map(([l,k],i)=>(
            <div key={l} className="load-pillar">
              <div className="load-p-hj" style={{color:CGO[Object.values(saju[k]).length]||'var(--gold)'}}>{saju[k]?.gh}</div>
              <div className="load-p-hj" style={{opacity:.7}}>{saju[k]?.jh}</div>
              <div className="load-p-lbl">{l}주</div>
            </div>
          ))}
        </div>
      )}
      <div className="skel-body" style={{marginTop:'var(--sp2)'}}>
        {Array.from({length:Math.min(qCount,2)}).map((_,i)=>(
          <div key={i} className="skel-para">
            <div className="skel-line full"/><div className="skel-line full"/><div className="skel-line w80"/>
            <div className="skel-line full"/><div className="skel-line w55"/>
          </div>
        ))}
      </div>
      <div className="skel-status" key={si}>
        <div>{LOAD_STATES[si].t}</div>
        <div className="skel-status-sub">{LOAD_STATES[si].s}</div>
      </div>
    </div>
  );
}
