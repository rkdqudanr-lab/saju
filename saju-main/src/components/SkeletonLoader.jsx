import { useEffect, useState } from "react";
import { CGO } from "../utils/saju.js";
import { LOAD_STATES } from "../utils/constants.js";

// ═══════════════════════════════════════════════════════════
//  Skeleton 로더
// ═══════════════════════════════════════════════════════════

/** 질문별 로딩 상태 인디케이터 */
function QStatusDot({ status, label }) {
  const icon = status === 'done' ? '✅' : status === 'error' ? '❌' : '⏳';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 4 }}>
      <span>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{label}</span>
    </div>
  );
}

/**
 * @param {{ qCount: number, saju: object, loadingMsgIdx: number, selQs: string[], qLoadStatus: string[] }} props
 */
export default function SkeletonLoader({ qCount, saju, loadingMsgIdx, selQs = [], qLoadStatus = [] }) {
  const si = loadingMsgIdx !== undefined ? loadingMsgIdx % LOAD_STATES.length : 0;
  const pillars = [['연', 'yeon'], ['월', 'wol'], ['일', 'il'], ['시', 'si']];

  // 경과 초 카운터 (결과 도착 시 애니메이션 힌트)
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const doneCount = qLoadStatus.filter(s => s === 'done' || s === 'error').length;
  const totalCount = qLoadStatus.length || qCount;
  const showProgress = totalCount > 1;

  return (
    <div className="loading-page">
      <div className="load-orb-wrap">
        <div className="load-orb">
          <div className="load-orb-core" />
          <div className="load-orb-ring" />
          <div className="load-orb-ring2" />
        </div>
      </div>
      {saju && (
        <div className="load-pillars">
          {pillars.map(([l, k]) => (
            <div key={l} className="load-pillar">
              <div className="load-p-hj" style={{ color: CGO[Object.values(saju[k]).length] || 'var(--gold)' }}>{saju[k]?.gh}</div>
              <div className="load-p-hj" style={{ opacity: .7 }}>{saju[k]?.jh}</div>
              <div className="load-p-lbl">{l}주</div>
            </div>
          ))}
        </div>
      )}

      {/* 예상 소요 시간 */}
      <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 8 }}>
        약 10~15초 소요 · {elapsed}초 경과
      </div>

      {/* 질문별 개별 로딩 상태 */}
      {showProgress && (
        <div style={{ margin: '12px auto', maxWidth: 280, background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '10px 14px' }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 6 }}>
            {doneCount}/{totalCount} 답변 완료
          </div>
          {selQs.map((q, i) => (
            <QStatusDot key={i} status={qLoadStatus[i] || 'loading'} label={q} />
          ))}
        </div>
      )}

      <div className="skel-body" style={{ marginTop: 'var(--sp2)' }}>
        {Array.from({ length: Math.min(qCount, 2) }).map((_, i) => (
          <div key={i} className="skel-para">
            <div className="skel-line full" /><div className="skel-line full" /><div className="skel-line w80" />
            <div className="skel-line full" /><div className="skel-line w55" />
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
