import { useState, useCallback, useEffect, useRef, useMemo } from "react";

// store (showToast를 스토어에 주입)
import { useAppStore } from "./store/useAppStore.js";

// utils
import { PKGS, ANNIVERSARY_PROMPT } from "./utils/constants.js";
import { STEP, STEP_GROUPS } from "./utils/steps.js";

// hooks
import { useUserProfile }     from "./hooks/useUserProfile.js";
import { useSajuContext }     from "./hooks/useSajuContext.js";
import { useConsultation }    from "./hooks/useConsultation.js";
import { useNavigation }      from "./hooks/useNavigation.js";
import { useAppHandlers }     from "./hooks/useAppHandlers.js";
import { useGamification }    from "./hooks/useGamification.js";
import { useModalState }      from "./hooks/useModalState.js";
import { useThemeEffects }    from "./hooks/useThemeEffects.js";
import { useGuardianMessage } from "./hooks/useGuardianMessage.js";

// supabase
import { supabase, getAuthenticatedClient } from "./lib/supabase.js";
import { getDailyDateKey } from "./lib/dailyDataAccess.js";

// analysis cache
import { loadAnalysisCache, saveAnalysisCache } from "./lib/analysisCache.js";

// components (항상 로드)
import Icon              from "./components/Icon.jsx";
import ChatTransitionSVG from "./components/ChatTransitionSVG.jsx";
import StarCanvas        from "./components/StarCanvas.jsx";
import Sidebar           from "./components/Sidebar.jsx";
import PWAInstallBanner  from "./components/PWAInstallBanner.jsx";
import BottomNav         from "./components/BottomNav.jsx";
import FeatureTour       from "./components/FeatureTour.jsx";
import ShareCardTemplate from "./components/ShareCardTemplate.jsx";
import AppModals         from "./components/AppModals.jsx";
import AppRouter         from "./components/AppRouter.jsx";

// ─────────────────────────────────────────────────────────────────
//  앱 메인 엔트리
// ─────────────────────────────────────────────────────────────────
export default function App() {
  // page-local state (특정 페이지에서만 쓰는 값)
  const [showDailyCard, setShowDailyCard]           = useState(true);
  const [anniversaryDate, setAnniversaryDate]       = useState('');
  const [anniversaryType, setAnniversaryType]       = useState('');
  const [editingMyProfile, setEditingMyProfile]     = useState(false);
  const [fieldTouched, setFieldTouched]             = useState({ by: false, bm: false, bd: false });
  const [showAllCats, setShowAllCats]               = useState(false);
  const [quizInput, setQuizInput]                   = useState('');
  const [sidebarPrefs, setSidebarPrefs]             = useState({ hiddenGroups: [] });
  const [todayDiaryWritten, setTodayDiaryWritten]   = useState(null);
  const [anonCompatShareData, setAnonCompatShareData] = useState(null);
  const [diaryViewDate, setDiaryViewDate]           = useState(null);
  const resultsRef = useRef(null);
  const askBtnRef  = useRef(null);

  // ── Zustand State (App level) ──
  const step                = useAppStore((s) => s.step);
  const setStep             = useAppStore((s) => s.setStep);
  const equippedAvatar      = useAppStore((s) => s.equippedAvatar);
  const setShowUpgradeModal = useAppStore((s) => s.setShowUpgradeModal);
  const _storeSetAuthFns    = useAppStore((s) => s.setAuthFns);

  // ── 커스텀 훅 ──
  const userProfile = useUserProfile();
  const { user, profile, setProfile, form, setForm, otherProfiles, setOtherProfiles, activeProfileIdx, setActiveProfileIdx,
          otherForm, setOtherForm, showProfileModal, setShowProfileModal, profileModalMode, setProfileModalMode,
          showOtherProfileModal, setShowOtherProfileModal,
          loginError, setLoginError,
          loginLoading, profileSyncing,
          kakaoLogin, kakaoLogout, handleSessionExpired, saveOtherProfile,
          editingOtherIdx, setEditingOtherIdx, startEditOtherProfile,
          showConsentModal, consentFlags, setConsentFlags, handleConsentConfirm,
          saveProfileToSupabase, saveUserProfileExtra, saveDailyQuizAnswer,
          responseStyle, theme, onboarded, quizState, lifeStage, fontSize, saveSettings } = userProfile;

  const isDark         = theme === 'dark';
  const onboardingDone = onboarded;
  const quiz           = quizState;

  // ── 모달/토스트/사이드바 상태 ──
  const {
    showSidebar, setShowSidebar,
    showTour, setShowTour,
    isMenuVisible, setIsMenuVisible,
    chatTransitioning, setChatTransitioning,
    shareModal, setShareModal,
    toast,
    showToast,
    showInviteModal, setShowInviteModal,
  } = useModalState({ showOtherProfileModal, showConsentModal });

  // ── 테마/스크롤/폰트/프리패치 부수효과 ──
  useThemeEffects({ isDark, fontSize, setIsMenuVisible });

  // showToast를 Zustand store에 직접 주입
  useEffect(() => { _storeSetAuthFns({ showToast }); }, [showToast, _storeSetAuthFns]);
  useEffect(() => { _storeSetAuthFns({ lifeStage: lifeStage || 'free' }); }, [lifeStage, _storeSetAuthFns]);

  // ── 기능 투어 트리거 (온보딩 완료 후 step 0 최초 진입 시 1회만) ──
  useEffect(() => {
    if (step === STEP.HOME && onboardingDone && localStorage.getItem('byeolsoom_tour_v1') !== 'done') {
      const t = setTimeout(() => setShowTour(true), 700);
      return () => clearTimeout(t);
    }
  }, [step, onboardingDone, setShowTour]);

  // lifeStage + qaAnswers를 profile에 병합 (메모이제이션으로 리렌더링 루프 방지)
  const profileWithMeta = useMemo(() => ({
    ...profile,
    lifeStage,
    qaAnswers: profile.qa_answers || profile.qaAnswers
  }), [profile, lifeStage]);
  const sajuCtx = useSajuContext(form, profileWithMeta, activeProfileIdx, otherProfiles);
  const { today, saju, sun, moon, asc, age, formOk, formOkApprox, isApproximate, activeForm, activeSaju, activeSun, activeAge, ageRange, buildCtx } = sajuCtx;

  // ── 게이미피케이션 시스템 ──
  const gamification = useGamification(user, showToast);
  const {
    gamificationState, missions,
    earnBP, earnDiaryBP, spendBP, blockBadtime, completeMission, loadTodayMissions, rechargeFreeBP, freezeStreak,
  } = gamification;

  // 흉한시간대 차단 상태
  const [isBlockingBadtime, setIsBlockingBadtime] = useState(false);

  // 수호령 레벨업 메시지
  const { guardianLevelUp, setGuardianLevelUp, guardianMessage, guardianMsgLoading } =
    useGuardianMessage({ buildCtx, userId: user?.id });

  // 무료 BP 충전 가능 여부 / 오늘 일기 작성 여부
  const [freeRechargeAvailable, setFreeRechargeAvailable] = useState(true);
  const [hasDiaryToday, setHasDiaryToday]                 = useState(false);

  // 흉한시간대 차단 핸들러
  const handleBlockBadtime = useCallback(async () => {
    if (!gamificationState.currentBp || gamificationState.currentBp < 20) {
      showToast('BP가 부족해요 (20 BP 필요)', 'error');
      return;
    }
    setIsBlockingBadtime(true);
    try {
      const result = await blockBadtime('badtime_1', 20);
      if (result.success) {
        showToast('흉한 시간대를 차단했어요! 오늘 하루 좋은 기운이 함께해요.', 'success');
      }
    } finally {
      setIsBlockingBadtime(false);
    }
  }, [gamificationState.currentBp, blockBadtime, showToast]);

  // 미션 완료 핸들러
  const handleCompleteMission = useCallback(async (missionId) => {
    try {
      await completeMission(missionId);
    } catch {
      showToast('미션 완료 중 오류가 발생했어요', 'error');
    }
  }, [completeMission, showToast]);

  // 미션 정보 완료 후 UI 갱신 콜백
  const handleMissionsSaved = useCallback(() => {
    loadTodayMissions(user?.id);
  }, [loadTodayMissions, user?.id]);

  // formOkApprox: 기본만 있어도 체험 가능하도록 게이미피케이션 활성화
  const consultation = useConsultation(buildCtx, formOkApprox, user, consentFlags, responseStyle, kakaoLogin, undefined, showToast, handleSessionExpired, handleMissionsSaved);
  const { timeSlot, loadingMsgIdx, cat, setCat, selQs, setSelQs, diy, setDiy, pkg, setPkg,
          answers, openAcc, typedSet, chatHistory, chatInput, setChatInput, chatLoading,
          latestChatIdx, chatLeft, maxQ, reportText, reportLoading, histItem, setHistItem,
          histItems, setHistItems, chatEndRef,
          qLoadStatus,
          dailyResult, dailyLoading, dailyCount, DAILY_MAX,
          diaryReviewResult, diaryReviewLoading,
          addQ, rmQ, askClaude, askQuick, askDailyHoroscope, askReview, askDiaryReview, askWeeklyReview, resetDiaryReview, handleTypingDone: _handleTypingDone, handleAccToggle,
          retryAnswer, sendChat, sendStreamChat, genReport, callApi, retryMsg, resetSession,
          deleteHistoryItem, deleteAllHistoryItems } = consultation;

  const curPkg = PKGS.find(p => p.id === pkg) || PKGS[1]; // fallback: premium

  // 일기 완료 핸들러
  const handleDiaryComplete = useCallback(async () => {
    if (!earnDiaryBP) return;
    const result = await earnDiaryBP();
    if (result?.success) setHasDiaryToday(true);
  }, [earnDiaryBP]);

  // 무료 BP 충전 핸들러
  const handleFreeRecharge = useCallback(async () => {
    if (!user?.id) {
      showToast('로그인 후 BP를 충전할 수 있어요.', 'info');
      return;
    }
    try {
      const result = await rechargeFreeBP();
      if (result.success) {
        showToast(`+${result.recharged} BP 충전! 별숨이 응원해요 ✨`, 'success');
        setFreeRechargeAvailable(false);
      } else if (result.message === '일일 1회 제한') {
        showToast('오늘 무료 충전은 이미 사용했어요.', 'info');
      }
    } catch (error) {
      showToast('BP 충전 중 오류가 발생했어요', 'error');
    }
  }, [rechargeFreeBP, showToast, user?.id]);

  const { refCode, groupCode } = useNavigation({ step, setStep, resultsRef, showToast, loginError, setLoginError });

  const {
    copyDone, profileNudge, setProfileNudge, showSubNudge,
    handleTypingDone, handleOnboardingFinish, handleQuizAnswer, handleQuizSkip,
    handleSendChat, handleCopyAll, shareCard,
    handleSaveReportImage, handleSaveProphecyImage, handleSaveCompatImage, handleSaveChatImage, shareResult,
    handleShareFortuneCard,
    handleShareDreamCard, handleShareTaegilCard,
    shareCardRef, cardDataUrl, cardSummary, shareCardType, shareCardName,
  } = useAppHandlers({
    answers, selQs, chatHistory, quiz, quizInput, setQuizInput,
    profile, setProfile, user, saveDailyQuizAnswer, saveSettings,
    sendChat, sendStreamChat, _handleTypingDone, curPkg, isDark, today,
    setShareModal, showToast, setStep,
    sun, saju, form,
  });

  const handleEnterChat = useCallback((prefill = '') => {
    if (chatTransitioning) return;
    resetSession();
    if (prefill) setChatInput(prefill);
    setChatTransitioning(true);
    window.setTimeout(() => {
      setStep(STEP.CHAT);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 240);
    window.setTimeout(() => setChatTransitioning(false), 820);
  }, [chatTransitioning, setStep, setChatInput, resetSession]);

  // 사이드바 설정 로드 (로그인 시)
  useEffect(() => {
    if (!user?.id) return;
    loadAnalysisCache(user.id, 'sidebar_prefs').then(raw => {
      if (!raw) return;
      try { setSidebarPrefs(JSON.parse(raw)); } catch {}
    });
  }, [user?.id]);

  // 무료 BP 충전 가능 여부 체크 (로그인 시)
  useEffect(() => {
    if (!user?.id) { setFreeRechargeAvailable(true); return; }
    const checkFreeRechargeAvailability = async () => {
      try {
        const authClient = getAuthenticatedClient(user.id) || supabase;
        if (!authClient) return;
        const { data: userData } = await authClient
          .from('users')
          .select('free_bp_recharge_at')
          .eq('kakao_id', String(user.id))
          .maybeSingle();
        if (!userData?.free_bp_recharge_at) { setFreeRechargeAvailable(true); return; }
        const today = getDailyDateKey();
        const lastRechargeDate = userData.free_bp_recharge_at?.slice(0, 10);
        setFreeRechargeAvailable(lastRechargeDate !== today);
      } catch (error) {
        console.error('무료 BP 충전 가능 여부 체크 오류:', error);
        setFreeRechargeAvailable(true);
      }
    };
    checkFreeRechargeAvailability();
  }, [user?.id]);

  // 오늘 일기 작성 여부 확인
  useEffect(() => {
    if (!user?.id) { setTodayDiaryWritten(null); return; }
    const client = getAuthenticatedClient(user.id) || supabase;
    if (!client) return;
    const today = getDailyDateKey();
    let cancelled = false;
    client.from('diary_entries').select('id').eq('kakao_id', String(user.id)).eq('date', today).maybeSingle()
      .then(({ data }) => { if (!cancelled) setTodayDiaryWritten(!!data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── AppRouter에 전달할 ctx 빌드 ──
  const ctx = {
    // userProfile
    user, profile, form, setForm, saju, sun, moon, asc,
    formOk, formOkApprox, onboardingDone,
    otherProfiles, setOtherProfiles, activeProfileIdx, setActiveProfileIdx,
    consentFlags, saveOtherProfile, saveProfileToSupabase,
    responseStyle, theme, lifeStage, fontSize, saveSettings,
    setShowProfileModal, setProfileModalMode, setShowOtherProfileModal,
    editingOtherIdx, setEditingOtherIdx, startEditOtherProfile,
    // sajuCtx
    today, buildCtx,
    // useModalState
    showToast, setShowSidebar, setShowUpgradeModal, setDiaryViewDate,
    // useConsultation
    selQs, setSelQs, diy, setDiy, pkg, curPkg,
    answers, openAcc, typedSet, chatHistory, chatInput, setChatInput, chatLoading,
    latestChatIdx, chatLeft, maxQ, reportText, reportLoading,
    histItem, setHistItem, chatEndRef, qLoadStatus,
    dailyResult, dailyLoading, dailyCount, DAILY_MAX,
    diaryReviewResult, diaryReviewLoading,
    timeSlot, loadingMsgIdx, cat, setCat, retryMsg,
    addQ, rmQ, askClaude, askQuick, askDailyHoroscope,
    askDiaryReview, askWeeklyReview, resetDiaryReview,
    handleAccToggle, retryAnswer, sendChat, sendStreamChat,
    genReport, callApi, resetSession, deleteHistoryItem,
    _handleTypingDone,
    // useAppHandlers
    copyDone, profileNudge, setProfileNudge, showSubNudge,
    handleTypingDone, handleOnboardingFinish,
    handleSendChat, handleCopyAll,
    shareCard, shareResult,
    handleSaveReportImage, handleSaveProphecyImage, handleSaveChatImage,
    handleShareFortuneCard, handleShareDreamCard, handleShareTaegilCard,
    // gamification
    gamificationState, earnBP, spendBP,
    handleBlockBadtime, isBlockingBadtime,
    handleCompleteMission, handleDiaryComplete,
    handleFreeRecharge, freeRechargeAvailable, freezeStreak,
    hasDiaryToday,
    // page-local state
    quiz, quizInput, setQuizInput,
    showDailyCard, setShowDailyCard,
    editingMyProfile, setEditingMyProfile,
    fieldTouched, setFieldTouched,
    showAllCats, setShowAllCats,
    sidebarPrefs, setSidebarPrefs,
    anonCompatShareData, setAnonCompatShareData,
    diaryViewDate, groupCode,
    resultsRef, askBtnRef,
    // misc
    ANNIVERSARY_PROMPT, saveAnalysisCache, kakaoLogin,
    anniversaryDate, setAnniversaryDate, anniversaryType, setAnniversaryType,
    handleEnterChat, handleQuizAnswer, handleQuizSkip,
  };

  // 카카오 로그인 중 로딩 화면
  if (loginLoading) {
    return (
      <>
        <StarCanvas isDark={isDark} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 24 }}>
          <div className="land-orb" style={{ marginBottom: 8 }}>
            <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--md)', color: 'var(--t1)', fontWeight: 600, marginBottom: 8 }}>서비스를 준비하고 있어요</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)' }}>잠시만 기다려 주세요</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
          </div>
        </div>
      </>
    );
  }

  // 기존 로그인 세션 프로필 동기화 중 로딩 화면
  if (profileSyncing) {
    return (
      <>
        <StarCanvas isDark={isDark} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 24 }}>
          <div className="land-orb" style={{ marginBottom: 8 }}>
            <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--md)', color: 'var(--t1)', fontWeight: 600, marginBottom: 8 }}>로그인 중입니다</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)' }}>잠시만 기다려 주세요</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StarCanvas isDark={isDark} />
      <PWAInstallBanner />

      {/* 첫 시작 투어 (첫방문 1회만) */}
      {showTour && <FeatureTour onFinish={() => setShowTour(false)} />}

      {/* 스크린 카드 템플릿(html2canvas 캡처용) */}
      <ShareCardTemplate
        ref={shareCardRef}
        type={shareCardType}
        name={shareCardName || form?.name || ''}
        saju={shareCardType === 'horoscope' ? saju : null}
        summary={cardSummary}
      />

      {/* 엑스트라 알림 */}
      {toast && (
        <div role="alert" aria-live="assertive" className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {chatTransitioning && (
        <div className="chat-transition-overlay" aria-hidden="true">
          <ChatTransitionSVG />
          <div style={{
            marginTop: 24,
            color: 'var(--gold)',
            fontSize: 'var(--sm)',
            fontWeight: 500,
            textAlign: 'center',
            letterSpacing: '-0.01em',
            animation: 'fadeUp 0.5s ease forwards'
          }}>
            이제 당신과 별숨이 이야기 나눌 준비가 모두 끝났어요
          </div>
        </div>
      )}

      {/* 사이드바 메뉴 버튼 */}
      <button className={`menu-btn ${isMenuVisible || showSidebar ? "" : "is-hidden"}`} data-tour="menu-btn" onClick={() => setShowSidebar(true)} aria-label="menu" aria-expanded={showSidebar}><Icon name="grid" size={18} color="currentColor" /></button>

      {showSidebar && (
        <Sidebar
          user={user} step={step}
          histItems={histItems}
          onClose={() => setShowSidebar(false)}
          onNav={(s, item) => {
            if (s === 'history' && item) { setHistItem(item); setStep(STEP.HISTORY); }
            else if (s === 'fortune') { formOkApprox ? setStep(STEP.TODAY_DETAIL) : setStep(STEP.PROFILE); }
            else if (s === STEP.PROFILE && formOkApprox && otherProfiles.length === 0) { setSelQs([]); setStep(STEP.QUESTION); }
            else if (typeof s === 'number' && STEP_GROUPS.REQUIRES_FORM.includes(s) && !formOkApprox) { setStep(STEP.PROFILE); }
            else { setStep(s); }
          }}
          onKakaoLogin={kakaoLogin}
          onKakaoLogout={kakaoLogout}
          onProfileOpen={() => setShowProfileModal(true)}
          onInvite={() => setShowInviteModal(true)}
          onAddOther={() => setShowOtherProfileModal(true)}
          onSettings={() => setStep(STEP.SETTINGS)}
          onDeleteAllHistory={deleteAllHistoryItems}
          sidebarPrefs={sidebarPrefs}
          todayDiaryWritten={todayDiaryWritten}
        />
      )}

      {step >= STEP.PROFILE && user && (
        <button type="button" className="user-chip" onClick={() => setShowProfileModal(true)} title="프로필 수정" aria-label={`${user.nickname} 프로필 수정`}>
          {equippedAvatar ? (
            <span className="user-chip-avatar">{equippedAvatar.emoji}</span>
          ) : user.profileImage ? (
            <img src={user.profileImage} alt="Profile" />
          ) : (
            <span className="user-chip-avatar">✦</span>
          )}
          <span className="user-chip-name">{user.nickname}</span>
        </button>
      )}
      {step >= STEP.PROFILE && !user && (
        <button className="user-chip user-chip--login" onClick={() => { if (typeof window.gtag === 'function') window.gtag('event', 'kakao_login_click'); kakaoLogin(); }}>
          <span className="user-chip-name">카카오 로그인</span>
        </button>
      )}

      {step > STEP.HOME && step < STEP.RESULT && step !== STEP.HISTORY && <button className="back-btn" aria-label="go back" onClick={() => setStep(p => p === STEP.RESULT ? STEP.QUESTION : Math.max(STEP.HOME, p - 1))}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {STEP_GROUPS.BACK_TO_RESULT.includes(step) && <button className="back-btn" aria-label="back to result" onClick={() => setStep(STEP.RESULT)}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {step === STEP.HISTORY && <button className="back-btn" aria-label="back home" onClick={() => { setHistItem(null); setStep(STEP.HOME); }}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {STEP_GROUPS.BACK_TO_HOME.includes(step) && <button className="back-btn" aria-label="back home" onClick={() => setStep(STEP.HOME)}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {step === STEP.ONBOARDING && <button className="back-btn" aria-label="go back" onClick={() => setStep(STEP.PROFILE)}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {step > STEP.HOME && <button className="home-btn" aria-label="go home" onClick={() => setStep(STEP.HOME)}><Icon name="home" size={18} color="currentColor" /></button>}

      {/* 하단 네비게이션 바(Zustand store에서 step/user/formOkApprox 직접 읽음) */}
      <BottomNav />

      {/* 페이지 라우터 */}
      <AppRouter ctx={ctx} />

      {/* 모달들 */}
      <AppModals
        showProfileModal={showProfileModal} setShowProfileModal={setShowProfileModal}
        profileModalMode={profileModalMode}
        profile={profile} setProfile={userProfile.setProfile}
        user={user} saveUserProfileExtra={saveUserProfileExtra}
        showOtherProfileModal={showOtherProfileModal} setShowOtherProfileModal={setShowOtherProfileModal}
        editingOtherIdx={editingOtherIdx} setEditingOtherIdx={setEditingOtherIdx}
        otherForm={otherForm} setOtherForm={setOtherForm} saveOtherProfile={saveOtherProfile}
        showConsentModal={showConsentModal} consentFlags={consentFlags}
        setConsentFlags={setConsentFlags} handleConsentConfirm={handleConsentConfirm}
        showInviteModal={showInviteModal} setShowInviteModal={setShowInviteModal}
        shareModal={shareModal} setShareModal={setShareModal} showToast={showToast}
        cardDataUrl={cardDataUrl}
        pkg={pkg} setPkg={setPkg}
        guardianLevelUp={guardianLevelUp} setGuardianLevelUp={setGuardianLevelUp}
        guardianMessage={guardianMessage} guardianMsgLoading={guardianMsgLoading}
      />
    </>
  );
}
