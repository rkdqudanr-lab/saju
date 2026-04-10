import { downloadDataUrl } from '../utils/imageExport';

export default function ShareModal({ shareModal, onClose, showToast, cardDataUrl }) {
  const hasCard = !!cardDataUrl;

  function handleSaveImage() {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    downloadDataUrl(cardDataUrl, `byeolsoom_card_${mm}${dd}.png`);
    showToast?.('카드가 저장됐어요! 인스타에 공유해보세요 ✨', 'success');
  }

  return (
    <div className="upgrade-modal-bg" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="upgrade-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: hasCard ? 420 : undefined }}
      >
        <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>✦</div>
        <div className="upgrade-modal-title">
          {hasCard ? '카드뉴스 저장' : '공유하기'}
        </div>

        {hasCard ? (
          <>
            {/* 1:1 카드 미리보기 */}
            <div style={{
              borderRadius: 'var(--r1)',
              overflow: 'hidden',
              marginBottom: 'var(--sp3)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}>
              <img
                src={cardDataUrl}
                alt="공유 카드 미리보기"
                style={{ width: '100%', display: 'block' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-main" onClick={handleSaveImage}>
                📥 이미지로 저장하기
              </button>
              <button
                className="btn-main"
                style={{ background: 'var(--bg3)', color: 'var(--t1)' }}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.origin)
                    .then(() => showToast?.('별숨 링크가 복사됐어요! 친구에게 공유해주세요 ✦', 'success'));
                  onClose();
                }}
              >
                🔗 별숨 링크 공유하기
              </button>
              <button
                style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', textAlign: 'center', marginBottom: 'var(--sp3)', lineHeight: 1.8 }}>
              별숨의 결과를 친구들에게 공유해보세요
            </div>
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 'var(--sp2)', fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.75, marginBottom: 'var(--sp3)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {shareModal.text}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-main" onClick={() => { navigator.clipboard?.writeText(shareModal.text).then(() => showToast?.('복사됐어요! 친구에게 붙여넣기 해주세요 💌', 'success')); onClose(); }}>
                📋 텍스트 복사하기
              </button>
              <button className="btn-main" style={{ background: 'var(--bg3)', color: 'var(--t1)' }} onClick={() => { navigator.clipboard?.writeText(window.location.origin).then(() => showToast?.('별숨 링크가 복사됐어요! 친구에게 공유해주세요 ✦', 'success')); onClose(); }}>
                🔗 별숨 링크 공유하기
              </button>
              <button style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }} onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
