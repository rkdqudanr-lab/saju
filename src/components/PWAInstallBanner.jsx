import { useState, useEffect } from "react";
import { useAppStore } from "../store/useAppStore.js";

// ═══════════════════════════════════════════════════════════
//  📲 PWA 설치 촉진 배너
//  - 방문 5회 또는 (방문 2회 + 로그인) 시 표시
//  - 설치 완료 시 +20 BP 지급 안내
//  - 임시 거절 시 7일 후 재노출
// ═══════════════════════════════════════════════════════════
export default function PWAInstallBanner() {
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 이미 standalone(설치된 앱) 상태이면 표시 안 함
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // 영구 거절 확인
    const dismissed = localStorage.getItem('byeolsoom_pwa_dismissed');
    if (dismissed === 'permanent') return;

    // 임시 거절 만료 확인 (7일)
    if (dismissed && dismissed !== 'permanent') {
      const expiry = parseInt(dismissed, 10);
      if (!isNaN(expiry) && Date.now() < expiry) return;
    }

    // 방문 횟수 카운팅
    const count = parseInt(localStorage.getItem('byeolsoom_visit_count') || '0', 10) + 1;
    localStorage.setItem('byeolsoom_visit_count', String(count));

    const isLoggedIn = !!user;
    const shouldShow = count >= 5 || (count >= 2 && isLoggedIn);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (shouldShow) setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 앱 설치 완료 감지
    const installHandler = () => {
      setShow(false);
      localStorage.setItem('byeolsoom_pwa_dismissed', 'permanent');
      showToast?.('앱 설치 완료! 다음 접속 시 +20 BP가 적립돼요 ✦', 'success');
    };
    window.addEventListener('appinstalled', installHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installHandler);
    };
  }, [user]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('byeolsoom_pwa_dismissed', 'permanent');
      showToast?.('설치해줘서 고마워요! +20 BP 적립 예정 ✦', 'success');
    }
    setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    // 7일 후 재노출
    localStorage.setItem('byeolsoom_pwa_dismissed', String(Date.now() + 7 * 86400000));
  };

  const handlePermanentDismiss = () => {
    setShow(false);
    localStorage.setItem('byeolsoom_pwa_dismissed', 'permanent');
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="앱 설치 안내"
      style={{
        position: 'fixed',
        bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 12px)',
        left: 12,
        right: 12,
        zIndex: 9998,
        background: 'var(--bg1)',
        border: '1.5px solid var(--acc)',
        borderRadius: 'var(--r2, 16px)',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, marginTop: 2, color: 'var(--gold)' }}>↓</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>
          별숨을 앱으로 저장해요
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.5, marginBottom: 10 }}>
          홈 화면에 추가하면 더 빠르게 접근할 수 있어요
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px',
          borderRadius: 20,
          background: 'var(--goldf)',
          border: '1px solid var(--acc)',
          fontSize: '10px',
          color: 'var(--gold)',
          fontWeight: 700,
          marginBottom: 10,
        }}>
          ✦ 설치 완료 시 +20 BP 지급
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleInstall}
            style={{
              flex: 2,
              padding: '10px',
              border: 'none',
              borderRadius: 'var(--r1)',
              background: 'var(--gold)',
              color: '#fff',
              fontFamily: 'var(--ff)',
              fontSize: 'var(--xs)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            설치하기
          </button>
          <button
            onClick={handleDismiss}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r1)',
              background: 'none',
              color: 'var(--t3)',
              fontFamily: 'var(--ff)',
              fontSize: 'var(--xs)',
              cursor: 'pointer',
            }}
          >
            나중에
          </button>
        </div>
      </div>
      <button
        onClick={handlePermanentDismiss}
        aria-label="닫기"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--t4)', fontSize: 14, flexShrink: 0, padding: 2,
        }}
      >
        ✕
      </button>
    </div>
  );
}
