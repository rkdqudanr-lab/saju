import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
//  📲 PWA 설치 촉진 배너 (3회 방문 후 표시)
// ═══════════════════════════════════════════════════════════
export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 이미 설치됐거나 영구 거절한 경우 표시 안 함
    const dismissed = localStorage.getItem('byeolsoom_pwa_dismissed');
    if (dismissed === 'permanent') return;

    // 이미 standalone(설치된 상태)이면 표시 안 함
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // 방문 횟수 카운팅
    const count = parseInt(localStorage.getItem('byeolsoom_visit_count') || '0', 10) + 1;
    localStorage.setItem('byeolsoom_visit_count', String(count));

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (count >= 3) setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('byeolsoom_pwa_dismissed', 'permanent');
    }
    setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('byeolsoom_pwa_dismissed', 'temporary');
  };

  const handlePermanentDismiss = () => {
    setShow(false);
    localStorage.setItem('byeolsoom_pwa_dismissed', 'permanent');
  };

  if (!show) return null;

  return (
    <div className="pwa-banner" role="dialog" aria-label="앱 설치 안내">
      <div className="pwa-banner-icon">📲</div>
      <div className="pwa-banner-body">
        <div className="pwa-banner-title">별숨을 앱으로 저장해요</div>
        <div className="pwa-banner-desc">홈 화면에 추가하면 더 빠르게 접근할 수 있어요</div>
      </div>
      <div className="pwa-banner-actions">
        <button className="pwa-banner-install" onClick={handleInstall}>설치</button>
        <button className="pwa-banner-later" onClick={handleDismiss}>나중에</button>
        <button className="pwa-banner-close" onClick={handlePermanentDismiss} aria-label="닫기">✕</button>
      </div>
    </div>
  );
}
