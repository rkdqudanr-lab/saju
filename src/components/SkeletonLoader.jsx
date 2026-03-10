// ═══════════════════════════════════════════════════════════
//  Skeleton 로더
// ═══════════════════════════════════════════════════════════
function SkeletonLoader({qCount,saju}){
  const[si,setSi]=useState(0);
  useEffect(()=>{const id=setInterval(()=>setSi(p=>(p+1)%LOAD_STATES.length),2000);return()=>clearInterval(id);},[]);
  const pillars=[['연','yeon'],['월','wol'],['일','il'],['시','si']];
  return(
    <div className="loading-page">
      {/* 오브 애니메이션 */}
      <div className="load-orb-wrap">
        <div className="load-orb">
          <div className="load-orb-core"/>
          <div className="load-orb-ring"/>
          <div className="load-orb-ring2"/>
        </div>
      </div>
      {/* 사주 기둥 등장 */}
      {saju&&(
        <div className="load-pillars">
          {pillars.map(([l,k],i)=>(
            <div key={l} className="load-pillar">
              <div className="load-p-hj" style={{color:OC[saju[k]?CGO[Object.values(saju[k]).length]||'금':'금']||'var(--gold)'}}>{saju[k]?.gh}</div>
              <div className="load-p-hj" style={{opacity:.7}}>{saju[k]?.jh}</div>
              <div className="load-p-lbl">{l}주</div>
            </div>
          ))}
        </div>
      )}
      {/* 스켈레톤 */}
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


export default SkeletonLoader;
