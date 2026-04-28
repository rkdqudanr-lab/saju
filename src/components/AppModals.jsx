/**
 * AppModals — App 레벨 모달 7개를 한 곳에 렌더링합니다.
 * Zustand 직접 구독 모달(UpgradeModal, BPConfirmModal, GuardianLevelUpModal)은
 * 내부에서 store를 읽으므로 props 최소화.
 */
import { lazy, Suspense } from "react";
import { useAppStore } from "../store/useAppStore.js";

import UpgradeModal         from "./UpgradeModal.jsx";
import GuardianLevelUpModal from "./GuardianLevelUpModal.jsx";
import BPConfirmModal       from "./BPConfirmModal.jsx";
import OtherProfileModal    from "./OtherProfileModal.jsx";
import InviteModal          from "./InviteModal.jsx";
import ShareModal           from "./ShareModal.jsx";

const ProfileModal  = lazy(() => import("./ProfileModal.jsx"));
const ConsentModal  = lazy(() => import("./ConsentModal.jsx"));

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div className="land-orb" style={{ width: 32, height: 32 }}>
        <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
      </div>
    </div>
  );
}

export default function AppModals({
  // useUserProfile
  showProfileModal, setShowProfileModal, profile, setProfile, user, saveUserProfileExtra,
  showOtherProfileModal, setShowOtherProfileModal,
  editingOtherIdx, setEditingOtherIdx, otherForm, setOtherForm, saveOtherProfile,
  showConsentModal, consentFlags, setConsentFlags, handleConsentConfirm,
  // useModalState
  showInviteModal, setShowInviteModal,
  shareModal, setShareModal, showToast,
  // useAppHandlers
  cardDataUrl,
  // useConsultation
  pkg, setPkg,
  // useGuardianMessage
  guardianLevelUp, setGuardianLevelUp, guardianMessage, guardianMsgLoading,
}) {
  const showUpgradeModal    = useAppStore((s) => s.showUpgradeModal);
  const setShowUpgradeModal = useAppStore((s) => s.setShowUpgradeModal);
  const setStep             = useAppStore((s) => s.setStep);

  return (
    <>
      {showProfileModal && (
        <Suspense fallback={<PageSpinner />}>
          <ProfileModal
            profile={profile}
            setProfile={setProfile}
            onClose={() => setShowProfileModal(false)}
            user={user}
            saveUserProfileExtra={saveUserProfileExtra}
          />
        </Suspense>
      )}

      {showUpgradeModal && (
        <UpgradeModal
          pkg={pkg} setPkg={setPkg} setStep={setStep}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {showOtherProfileModal && (
        <OtherProfileModal
          editingOtherIdx={editingOtherIdx} setEditingOtherIdx={setEditingOtherIdx}
          otherForm={otherForm} setOtherForm={setOtherForm}
          saveOtherProfile={saveOtherProfile}
          onClose={() => setShowOtherProfileModal(false)}
        />
      )}

      {showInviteModal && (
        <InviteModal
          user={user} showToast={showToast}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {shareModal.open && (
        <ShareModal
          shareModal={shareModal}
          onClose={() => setShareModal(s => ({ ...s, open: false }))}
          showToast={showToast}
          cardDataUrl={cardDataUrl}
        />
      )}

      <BPConfirmModal />

      {guardianLevelUp && (
        <GuardianLevelUpModal
          fromLevel={guardianLevelUp.fromLevel}
          toLevel={guardianLevelUp.toLevel}
          guardianMessage={guardianMessage}
          loading={guardianMsgLoading}
          onClose={() => setGuardianLevelUp(null)}
        />
      )}

      {showConsentModal && (
        <Suspense fallback={<PageSpinner />}>
          <ConsentModal
            flags={consentFlags}
            setFlags={setConsentFlags}
            onConfirm={() => handleConsentConfirm(consentFlags)}
          />
        </Suspense>
      )}
    </>
  );
}
