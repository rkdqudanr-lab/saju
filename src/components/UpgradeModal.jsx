import { PKGS } from "../utils/constants.js";

export default function UpgradeModal({ pkg, setPkg, setStep, onClose }) {
  return (
    <div className="upgrade-modal-bg" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>✦</div>
        <div className="upgrade-modal-title">더 많이 물어보고 싶어요?</div>
        <div className="upgrade-modal-sub">첫 번째 이야기가 마음에 들었다면<br />더 깊이 대화할 수 있어요</div>
        <div className="upgrade-pkgs">
          {PKGS.filter(p => !p.isFree).map(p => (
            <div key={p.id} className={`upgrade-pkg ${pkg === p.id ? 'chosen' : ''}`} onClick={() => setPkg(p.id)}>
              {p.hot && <div className="upgrade-pkg-hot">BEST</div>}
              <div className="upgrade-pkg-e">{p.e}</div>
              <div className="upgrade-pkg-n">{p.n}</div>
              <div className="upgrade-pkg-p">{p.p}</div>
              <div className="upgrade-pkg-q">질문 {p.q}개 · 채팅 {p.chat}회</div>
            </div>
          ))}
        </div>
        <button className="btn-main" onClick={() => { onClose(); setStep(5); }}>이 이용권으로 계속 대화하기 ✦</button>
        <button style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', marginTop: 8 }} onClick={onClose}>괜찮아요, 나중에 할게요</button>
      </div>
    </div>
  );
}
