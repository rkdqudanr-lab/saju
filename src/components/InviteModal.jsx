export default function InviteModal({ user, showToast, onClose }) {
  return (
    <div className="upgrade-modal-bg" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 6 }}>🔗</div>
        <div className="upgrade-modal-title">친구 초대하기</div>
        <div className="upgrade-modal-sub">친구가 첫 상담을 완료하면<br />무료 채팅 1회를 드려요 ✦</div>
        {user ? (
          <>
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '12px 14px', fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.75, marginBottom: 'var(--sp3)', wordBreak: 'break-all', textAlign: 'center' }}>
              {`${window.location.origin}?ref=${user.id}`}
            </div>
            <button className="btn-main" onClick={() => {
              const inviteUrl = `${window.location.origin}?ref=${user.id}`;
              navigator.clipboard?.writeText(inviteUrl).then(() => {
                showToast('초대 링크가 복사됐어요! 친구에게 공유해보세요 ✦', 'success');
                onClose();
              });
            }}>✦ 초대 링크 복사하기</button>
            {navigator.share && (
              <button className="btn-main" style={{ background: 'var(--bg3)', color: 'var(--t1)', marginTop: 8 }} onClick={() => {
                navigator.share({ title: '별숨 — 사주+별자리 운세', text: '사주와 별자리로 당신의 질문에 답해드려요. 저의 초대 링크로 시작해봐요 ✦', url: `${window.location.origin}?ref=${user.id}` }).catch(() => {});
                onClose();
              }}>✦ 공유하기</button>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 'var(--sm)', padding: 'var(--sp3) 0' }}>
            카카오 로그인 후 초대 링크를 만들 수 있어요
          </div>
        )}
        <button style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', marginTop: 6 }} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
