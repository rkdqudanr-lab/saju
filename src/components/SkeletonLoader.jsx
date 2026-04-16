import { useEffect, useState } from "react";
import { CGO } from "../utils/saju.js";
import { LOAD_STATES } from "../utils/constants.js";

// ═══════════════════════════════════════════════════════════
//  Skeleton 로더
// ═══════════════════════════════════════════════════════════

// 별숨만의 감성적 로딩 메시지 (기존 LOAD_STATES 외 추가)
const EXTRA_MESSAGES = [
  { t: '당신의 태어난 계절과 오늘의 일진을 맞추는 중...', s: '잠깐만요 ✦' },
  { t: '오행의 흐름에서 특별한 행운의 단서를 찾는 중...', s: '거의 다 왔어요 ✦' },
  { t: '별숨이 당신을 위한 문장을 정성껏 적어 내려가고 있어요', s: '조금만 기다려줘요 ✦' },
  { t: '동양의 별과 서양의 별이 함께 당신을 읽고 있어요', s: '잠깐만요 ✦' },
  { t: '태어난 순간의 기운을 조용히 불러오는 중이에요', s: '조금만 기다려줘요 ✦' },
];

/** 질문별 로딩 상태 인디케이터 */
function QStatusDot({ status, label }) {
  const icon = status === 'done' ? '◈' : status === 'error' ? '△' : '◷';
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
  const pillars = [['연', 'yeon'], ['월', 'wol'], ['일', 'il'], ['시', 'si']];

  // 경과 초 카운터
  const [elapsed, setElapsed] = useState(0);
  // 동적 메시지 인덱스 (2.5초마다 변경)
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const elapsed_t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(elapsed_t);
  }, []);

  useEffect(() => {
    const msg_t = setInterval(() => setMsgIdx(p => p + 1), 2500);
    return () => clearInterval(msg_t);
  }, []);

  const allMessages = [...EXTRA_MESSAGES, ...LOAD_STATES];
  const currentMsg = allMessages[msgIdx % allMessages.length];

  // 가짜 프로그레스 바: 0→85% 5초에 걸쳐, 이후 완료 시 100%로
  const doneCount = qLoadStatus.filter(s => s === 'done' || s === 'error').length;
  const totalCount = qLoadStatus.length || qCount;
  const showProgress = totalCount > 1;

  const progressPct = doneCount >= totalCount
    ? 100
    : Math.min(85, (elapsed / 12) * 85);

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

      {/* ── 가짜 프로그레스 바 (달이 차오르는 느낌) ── */}
      <div style={{ margin: '16px auto 4px', maxWidth: 240, width: '80%' }}>
        <div style={{ height: 4, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, var(--lav), var(--gold))',
              borderRadius: 4,
              transition: 'width 0.8s ease',
            }}
          />
        </div>
        <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 6 }}>
          {elapsed < 3 ? '별숨이 당신의 별을 찾고 있어요...' : elapsed < 8 ? '분석이 진행되고 있어요...' : '거의 다 됐어요 ✦'}
        </div>
      </div>

      {/* 질문별 개별 로딩 상태 */}
      {showProgress && (
        <div style={{ margin: '8px auto', maxWidth: 280, background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '10px 14px' }}>
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

      {/* ── 동적 로딩 메시지 (페이드 인/아웃 효과) ── */}
      <div className="skel-status" key={msgIdx} style={{ animation: 'fadeUp 0.4s ease' }}>
        <div>{currentMsg.t}</div>
        <div className="skel-status-sub">{currentMsg.s}</div>
      </div>
    </div>
  );
}
