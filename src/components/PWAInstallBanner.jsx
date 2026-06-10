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
  const step = useAppStore((s) => s.step);

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
      showToast?.('앱 설치 완료! 다음 접속 시 +20 BP가 적립돼요', 'success');
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
      showToast?.('설치해줘서 고마워요! +20 BP 적립 예정', 'success');
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

  if (!show || step === 0) return null;

  return (
    <div
      role="dialog"
      aria-label="앱 설치 안내"
      className="pwa-install-chip"
    >
      <div className="pwa-install-chip__body">
        <div className="pwa-install-chip__title">
          앱으로 저장하면 +20 BP
        </div>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="pwa-install-chip__install"
      >
        설치
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="pwa-install-chip__later"
      >
        나중에
      </button>
      <button
        type="button"
        onClick={handlePermanentDismiss}
        aria-label="닫기"
        className="pwa-install-chip__close"
      >
        ✕
      </button>
    </div>
  );
}
