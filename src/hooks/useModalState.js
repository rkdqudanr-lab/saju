import { useState, useRef, useCallback, useEffect } from "react";
import { TIMING } from "../utils/constants.js";
import { useAppStore } from "../store/useAppStore.js";

/**
 * App 레벨 UI 가시성 토글 상태를 캡슐화합니다.
 * 자식 컴포넌트가 직접 트리거할 필요 없는 모달/토스트/사이드바 등만 포함합니다.
 * (showUpgradeModal, bpConfirmState, guardianLevelUp은 Zustand에 그대로)
 */
export function useModalState({ showOtherProfileModal, showConsentModal }) {
  const [showSidebar, setShowSidebar]             = useState(false);
  const [showTour, setShowTour]                   = useState(false);
  const [isMenuVisible, setIsMenuVisible]         = useState(true);
  const [chatTransitioning, setChatTransitioning] = useState(false);
  const [shareModal, setShareModal]               = useState({ open: false, title: '', text: '' });
  const [toast, setToast]                         = useState(null);
  const [showInviteModal, setShowInviteModal]     = useState(false);
  const toastTimer = useRef(null);

  const showUpgradeModal    = useAppStore((s) => s.showUpgradeModal);
  const setShowUpgradeModal = useAppStore((s) => s.setShowUpgradeModal);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), TIMING.toastDuration);
  }, []);

  // body 스크롤 잠금
  useEffect(() => {
    const anyOpen = showUpgradeModal || showOtherProfileModal || showInviteModal || shareModal.open;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showUpgradeModal, showOtherProfileModal, showInviteModal, shareModal.open]);

  // Escape 키 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (shareModal.open)    { setShareModal(s => ({ ...s, open: false })); return; }
      if (showUpgradeModal)   { setShowUpgradeModal(false); return; }
      if (showOtherProfileModal) return; // useUserProfile이 처리
      if (showInviteModal)    { setShowInviteModal(false); return; }
      if (showSidebar)        { setShowSidebar(false); return; }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shareModal.open, showUpgradeModal, showOtherProfileModal, showInviteModal, showSidebar, setShowUpgradeModal]);

  return {
    showSidebar, setShowSidebar,
    showTour, setShowTour,
    isMenuVisible, setIsMenuVisible,
    chatTransitioning, setChatTransitioning,
    shareModal, setShareModal,
    toast,
    showToast,
    showInviteModal, setShowInviteModal,
  };
}
