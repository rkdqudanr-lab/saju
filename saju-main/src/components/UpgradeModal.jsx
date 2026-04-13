import { PKGS } from "../utils/constants.js";

export default function UpgradeModal({ pkg, setPkg, setStep, onClose }) {
  const BENEFITS = [
    "모든 분석 리포트 즉시 열람",
    "별숨과 무제한 깊은 대화 (채팅)",
    "30년 뒤의 상세한 예언 편지",
    "광고 없는 깨끗한 별자리 감상",
  ];

  return (
    <div className="profile-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="profile-sheet" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div className="profile-handle" />
        <div className="pro-orb">✨</div>
        <div className="profile-title" style={{ fontSize: 'var(--lg)', marginBottom: 12, color: 'var(--gold)', letterSpacing: '-0.02em' }}>
          더 깊은 인사이트로
        </div>
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.8, marginBottom: 32 }}>
          첫 번째 인사이트가 마음에 드셨다면<br />
          운명의 실타래를 더 자세히 풀어드릴게요.
        </div>

        <div className="up-benefit-title" style={{ color: 'var(--gold)', letterSpacing: '0.06em', fontSize: '10px', fontWeight: 800, marginBottom: 20 }}>
          ✦ 프리미엄 혜택
        </div>
        <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ fontSize: 'var(--sm)', color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 800 }}>✓</span> {b}
            </div>
          ))}
        </div>

        <div className="up-pkg-list" style={{ gap: 12, marginBottom: 24 }}>
          {PKGS.filter(p => !p.isFree).map(p => (
            <div
              key={p.id}
              className={`sidebar-hist-item ${pkg === p.id ? 'active' : ''}`}
              onClick={() => setPkg(p.id)}
              style={{
                margin: '0 0 12px 0',
                padding: '20px',
                background: pkg === p.id ? 'var(--goldf)' : 'var(--bg-glass)',
                borderColor: pkg === p.id ? 'var(--gold)' : 'var(--line)',
                textAlign: 'left'
              }}
            >
              {p.hot && <div className="up-pkg-hot" style={{ background: 'var(--gold-grad)', color: '#000', fontSize: '9px', padding: '2px 8px', borderRadius: '50px', fontWeight: 800, position: 'absolute', top: -10, right: 12 }}>인기</div>}
              <div style={{ fontWeight: 800, fontSize: 'var(--md)', color: pkg === p.id ? 'var(--gold)' : 'var(--t1)', marginBottom: 4 }}>{p.n}</div>
              <div style={{ color: pkg === p.id ? 'var(--gold)' : 'var(--t4)', fontSize: 'var(--lg)', fontWeight: 900, fontFamily: 'var(--ff-inter)', marginBottom: 8 }}>{p.p}</div>
              <div style={{ fontSize: '11px', color: 'var(--t4)', fontWeight: 500 }}>질문 {p.q}개 · 채팅 {p.chat}회 포함</div>
            </div>
          ))}
        </div>

        <button
          className="profile-save-btn"
          onClick={() => { onClose(); setStep(5); }}
        >
          운명을 열어보기 ✦
        </button>

        <button
          className="profile-close-btn"
          onClick={onClose}
        >
          나중에 할게요
        </button>
      </div>
    </div>
  );
}
