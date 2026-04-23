import { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from "react";

// store (showToast瑜??ㅽ넗?댁뿉 二쇱엯)
import { useAppStore } from "./store/useAppStore.js";

// utils
import { PKGS, TIMING, ANNIVERSARY_PROMPT } from "./utils/constants.js";

// hooks
import { useUserProfile }   from "./hooks/useUserProfile.js";
import { useSajuContext }   from "./hooks/useSajuContext.js";
import { useConsultation }  from "./hooks/useConsultation.js";
import { useNavigation }    from "./hooks/useNavigation.js";
import { useAppHandlers }   from "./hooks/useAppHandlers.js";
import { useGamification }  from "./hooks/useGamification.js";

// supabase
import { supabase, getAuthenticatedClient } from "./lib/supabase.js";

// analysis cache
import { loadAnalysisCache, saveAnalysisCache } from "./lib/analysisCache.js";

// components (static)
import Icon              from "./components/Icon.jsx";
import StarCanvas         from "./components/StarCanvas.jsx";
import SkeletonLoader     from "./components/SkeletonLoader.jsx";
import Sidebar            from "./components/Sidebar.jsx";
import PWAInstallBanner   from "./components/PWAInstallBanner.jsx";
import BottomNav          from "./components/BottomNav.jsx";
import FeatureTour        from "./components/FeatureTour.jsx";

// modal components (static)
import UpgradeModal        from "./components/UpgradeModal.jsx";
import GuardianLevelUpModal from "./components/GuardianLevelUpModal.jsx";
import BPConfirmModal       from "./components/BPConfirmModal.jsx";
import OtherProfileModal   from "./components/OtherProfileModal.jsx";
import InviteModal         from "./components/InviteModal.jsx";
import ShareModal          from "./components/ShareModal.jsx";
import ShareCardTemplate   from "./components/ShareCardTemplate.jsx";

// pages (static)
import ReportStep          from "./pages/ReportStep.jsx";
const DeepInterviewPage    = lazy(() => import("./components/DeepInterviewPage.jsx"));
import DailyHoroscopePage  from "./pages/DailyHoroscopePage.jsx";
import ChatStep            from "./pages/ChatStep.jsx";
import ResultsStep         from "./pages/ResultsStep.jsx";
import QuestionStep        from "./pages/QuestionStep.jsx";
import ProfileStep         from "./pages/ProfileStep.jsx";
import LandingPage         from "./pages/LandingPage.jsx";
import TodayDetailPage     from "./pages/TodayDetailPage.jsx";

// lazy-loaded components ??ALL const declarations come after ALL static imports
const ProfileModal             = lazy(() => import("./components/ProfileModal.jsx"));
const HistoryPage              = lazy(() => import("./components/HistoryPage.jsx"));
const FutureProphecyPage       = lazy(() => import("./components/FutureProphecyPage.jsx"));
const CompatPage               = lazy(() => import("./components/CompatPage.jsx"));
const SajuCalendar             = lazy(() => import("./components/SajuCalendar.jsx"));
const GroupBulseumPage         = lazy(() => import("./components/GroupBulseumPage.jsx"));
const AnniversaryPage          = lazy(() => import("./components/AnniversaryPage.jsx"));
const NatalInterpretationPage  = lazy(() => import("./components/NatalInterpretationPage.jsx"));
const ComprehensivePage        = lazy(() => import("./components/ComprehensivePage.jsx"));
const OnboardingCards          = lazy(() => import("./components/OnboardingCards.jsx"));
const ConsentModal             = lazy(() => import("./components/ConsentModal.jsx"));
const DiaryPage                = lazy(() => import("./components/DiaryPage.jsx"));
const DiaryListPage            = lazy(() => import("./components/DiaryListPage.jsx"));
const SajuCardPage             = lazy(() => import("./components/SajuCardPage.jsx"));
const SettingsPage             = lazy(() => import("./components/SettingsPage.jsx"));
const MyPage                   = lazy(() => import("./components/MyPage.jsx"));
const DreamPage                = lazy(() => import("./components/DreamPage.jsx"));
const InquiryPage              = lazy(() => import("./components/InquiryPage.jsx"));
const TaegillPage              = lazy(() => import("./components/TaegillPage.jsx"));
const NameFortunePage          = lazy(() => import("./components/NameFortunePage.jsx"));
const StatsPage                = lazy(() => import("./components/StatsPage.jsx"));
const CommunityPage            = lazy(() => import("./components/CommunityPage.jsx"));
const DaeunPage                = lazy(() => import("./components/DaeunPage.jsx"));
const AnonCompatPage           = lazy(() => import("./components/AnonCompatPage.jsx"));
const ShopPage                 = lazy(() => import("./components/ShopPage.jsx"));
const SpecialReadingPage       = lazy(() => import("./components/SpecialReadingPage.jsx"));
const TarotPage                = lazy(() => import("./components/TarotPage.jsx"));
const ByeolsoomLetterPage      = lazy(() => import("./components/ByeolsoomLetterPage.jsx"));
const YearlyReportPage         = lazy(() => import("./components/YearlyReportPage.jsx"));
const GrowthDashboardPage      = lazy(() => import("./components/GrowthDashboardPage.jsx"));
const ItemInventoryPage        = lazy(() => import("./components/ItemInventoryPage.jsx"));
const LottoPage                = lazy(() => import("./components/LottoPage.jsx"));
const GachaPage                = lazy(() => import("./components/GachaPage.jsx"));

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//  ?룧 硫붿씤 ??
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
export default function App() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [chatTransitioning, setChatTransitioning] = useState(false);
  const [shareModal, setShareModal] = useState({ open: false, title: '', text: '' });
  const [toast, setToast] = useState(null);
  const [showDailyCard, setShowDailyCard] = useState(true);
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [anniversaryType, setAnniversaryType] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMyProfile, setEditingMyProfile] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({ by: false, bm: false, bd: false });
  const [showAllCats, setShowAllCats] = useState(false);
  const [quizInput, setQuizInput] = useState('');
  const [sidebarPrefs, setSidebarPrefs] = useState({ hiddenGroups: [] });
  const [todayDiaryWritten, setTodayDiaryWritten] = useState(null); // null=誘명솗?? true/false
  const [anonCompatShareData, setAnonCompatShareData] = useState(null);
  const [diaryViewDate, setDiaryViewDate] = useState(null); // null=?ㅻ뒛, 'YYYY-MM-DD'=?뱀젙 ?좎쭨
  const toastTimer = useRef(null);
  const resultsRef = useRef(null);
  const askBtnRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), TIMING.toastDuration);
  }, []);

  // ?? Zustand State (App level) ??
  const step = useAppStore((s) => s.step);
  const setStep = useAppStore((s) => s.setStep);
  const equippedTheme = useAppStore((s) => s.equippedTheme);
  const equippedAvatar = useAppStore((s) => s.equippedAvatar);

  // showToast瑜?Zustand store??1??二쇱엯 (Context ?놁씠 而댄룷?뚰듃?먯꽌 吏곸젒 ?ъ슜 媛??
  const _storeSetAuthFns    = useAppStore((s) => s.setAuthFns);
  const showUpgradeModal    = useAppStore((s) => s.showUpgradeModal);
  const setShowUpgradeModal = useAppStore((s) => s.setShowUpgradeModal);
  useEffect(() => { _storeSetAuthFns({ showToast }); }, [showToast, _storeSetAuthFns]);

  // ?? 而ㅼ뒪? ????
  const userProfile = useUserProfile();
  const { user, profile, setProfile, form, setForm, otherProfiles, setOtherProfiles, activeProfileIdx, setActiveProfileIdx,
          otherForm, setOtherForm, showProfileModal, setShowProfileModal,
          showOtherProfileModal, setShowOtherProfileModal,
          loginError, setLoginError,
          loginLoading, profileSyncing,
          kakaoLogin, kakaoLogout, handleSessionExpired, saveOtherProfile,
          editingOtherIdx, setEditingOtherIdx, startEditOtherProfile,
          showConsentModal, consentFlags, setConsentFlags, handleConsentConfirm,
          saveProfileToSupabase, saveUserProfileExtra, saveDailyQuizAnswer,
          responseStyle, theme, onboarded, quizState, lifeStage, fontSize, saveSettings } = userProfile;

  // isDark / onboardingDone / quiz ??userProfile?먯꽌 ?뚯깮
  const isDark          = theme === 'dark';
  const onboardingDone  = onboarded;
  const quiz            = quizState;

  // ?? ?쇱쿂 ?ъ뼱 ?몃━嫄?(?⑤낫???꾨즺 ??step 0 泥??꾨떖 ??1?뚮쭔) ??
  useEffect(() => {
    if (step === 0 && onboardingDone && localStorage.getItem('byeolsoom_tour_v1') !== 'done') {
      const t = setTimeout(() => setShowTour(true), 700);
      return () => clearTimeout(t);
    }
  }, [step, onboardingDone]);

  // lifeStage + qaAnswers瑜?profile??蹂묓빀?섏뿬 AI 而⑦뀓?ㅽ듃 鍮뚮뜑???꾨떖
  const profileWithMeta = { ...profile, lifeStage, qaAnswers: profile.qa_answers || profile.qaAnswers };
  const sajuCtx = useSajuContext(form, profileWithMeta, activeProfileIdx, otherProfiles);
  const { today, saju, sun, moon, asc, age, formOk, formOkApprox, isApproximate, activeForm, activeSaju, activeSun, activeAge, ageRange, buildCtx } = sajuCtx;

  // ?? 寃뚯씠誘명뵾耳?댁뀡 ?쒖뒪????
  const gamification = useGamification(user, showToast);
  const {
    gamificationState, missions,
    earnBP, earnDiaryBP, spendBP, blockBadtime, completeMission, loadTodayMissions, rechargeFreeBP, freezeStreak,
  } = gamification;

  // 諛곕뱶????〓쭑???곹깭
  const [isBlockingBadtime, setIsBlockingBadtime] = useState(false);

  // ?섑샇???덈꺼??紐⑤떖
  const guardianLevelUp = useAppStore((s) => s.guardianLevelUp);
  const setGuardianLevelUp = useAppStore((s) => s.setGuardianLevelUp);
  const [guardianMessage, setGuardianMessage] = useState('');
  const [guardianMsgLoading, setGuardianMsgLoading] = useState(false);

  // 臾대즺 BP 異⑹쟾 媛???щ?
  const [freeRechargeAvailable, setFreeRechargeAvailable] = useState(true);

  // ?ㅻ뒛 ?쇨린 ?묒꽦 ?щ? (?몄뀡 ??異붿쟻)
  const [hasDiaryToday, setHasDiaryToday] = useState(false);

  // 諛곕뱶????〓쭑???몃뱾??
  const handleBlockBadtime = useCallback(async () => {
    if (!gamificationState.currentBp || gamificationState.currentBp < 20) {
      showToast('BP媛 遺議깊빀?덈떎 ?삟', 'error');
      return;
    }
    setIsBlockingBadtime(true);
    try {
      const result = await blockBadtime('badtime_1', 20);
      if (result.success) {
        showToast('??? ??! ??? ?? ? ????? ????.', 'success');
      }
    } finally {
      setIsBlockingBadtime(false);
    }
  }, [gamificationState.currentBp, blockBadtime, showToast]);

  // 誘몄뀡 ?꾨즺 ?몃뱾????completeMission ?대??먯꽌 ?숆????낅뜲?댄듃 泥섎━?섎?濡??ш린???몄텧留?
  const handleCompleteMission = useCallback(async (missionId) => {
    try {
      await completeMission(missionId);
    } catch {
      showToast('誘몄뀡 ?꾨즺 以??ㅻ쪟 諛쒖깮', 'error');
    }
  }, [completeMission, showToast]);

  // 誘몄뀡 ????꾨즺 ??UI 媛깆떊 肄쒕갚
  const handleMissionsSaved = useCallback(() => {
    loadTodayMissions(user?.id);
  }, [loadTodayMissions, user?.id]);

  // formOkApprox: ???붾쭔 ?덉뼱??泥댄뿕 媛?ν븯?꾨줉 寃뚯씠???꾪솕
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

  // ?섑샇???덈꺼??媛먯? ??AI 硫붿떆吏 ?앹꽦
  useEffect(() => {
    if (!guardianLevelUp) return;
    const LEVEL_LABELS = { 1: 'Guardian I', 2: 'Guardian II', 3: 'Guardian III', 4: 'Guardian Master', 5: 'Star Guardian' };
    setGuardianMessage('');
    setGuardianMsgLoading(true);
    (async () => {
      try {
        const ctx = buildCtx ? buildCtx() : '';
        const { getAuthToken } = await import('./hooks/useUserProfile.js');
        const token = getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userMessage: `I just leveled up in the Byeolsoom guardian system from ${LEVEL_LABELS[guardianLevelUp.fromLevel]} (Lv${guardianLevelUp.fromLevel}) to ${LEVEL_LABELS[guardianLevelUp.toLevel]} (Lv${guardianLevelUp.toLevel}). Please write a short 2-3 line celebratory message in a warm, starlit tone without sounding too formal.`, 
            context: ctx,
            kakaoId: user?.id,
            clientHour: new Date().getHours(),
            isChat: true,
          }),
        });
        const data = await res.json();
        setGuardianMessage(data.text || '');
      } catch {
        setGuardianMessage('A new level of strength is with you now. Meet the next star with a steadier heart.');
      } finally {
        setGuardianMsgLoading(false);
      }
    })();
  }, [guardianLevelUp]);

  // ?쇨린 ?꾨즺 ?몃뱾??(???쇨린 ?????BP ?곷┰)
  const handleDiaryComplete = useCallback(async () => {
    if (!earnDiaryBP) return;
    const result = await earnDiaryBP();
    if (result?.success) setHasDiaryToday(true);
  }, [earnDiaryBP]);

  // 臾대즺 BP 異⑹쟾 ?몃뱾??
  const handleFreeRecharge = useCallback(async () => {
    try {
      const result = await rechargeFreeBP();
      if (result.success) {
        showToast(`+${result.recharged} BP 異⑹쟾! ?뵅`, 'success');
        setFreeRechargeAvailable(false); // 異⑹쟾 ?꾨즺 ???곹깭 ?낅뜲?댄듃
      } else if (result.message === '?쇱씪 1???쒗븳') {
        showToast('?? ?? ??? ? ???.', 'info');
      }
    } catch (error) {
      showToast('BP 異⑹쟾 以??ㅻ쪟 諛쒖깮', 'error');
    }
  }, [rechargeFreeBP, showToast]);

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

  // ?? 紐⑤떖 ?대┝ ??body ?ㅽ겕濡??좉툑 ??
  useEffect(() => {
    const anyOpen = showUpgradeModal || showOtherProfileModal || showInviteModal || shareModal.open;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showUpgradeModal, showOtherProfileModal, showInviteModal, shareModal.open]);

  // ?? Escape ?ㅻ줈 紐⑤떖/?ъ씠?쒕컮 ?リ린 ??
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (shareModal.open) { setShareModal(s => ({ ...s, open: false })); return; }
      if (showUpgradeModal) { setShowUpgradeModal(false); return; }
      if (showOtherProfileModal) { setShowOtherProfileModal(false); return; }
      if (showInviteModal) { setShowInviteModal(false); return; }
      if (showSidebar) { setShowSidebar(false); return; }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shareModal.open, showUpgradeModal, showOtherProfileModal, showInviteModal, showSidebar]);

  // ?? ?뚮쭏 ??
  useEffect(() => { document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); }, [isDark]);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const updateVisibility = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      if (currentY < 64) setIsMenuVisible(true);
      else if (delta > 8) setIsMenuVisible(false);
      else if (delta < -8) setIsMenuVisible(true);
      lastY = currentY;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (equippedTheme?.colors) {
      const { primary, bg, bg2 } = equippedTheme.colors;
      const toRgba = (hex, a) => {
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a})`;
      };
      root.style.setProperty('--gold',  primary);
      root.style.setProperty('--gold2', primary);
      root.style.setProperty('--acc',   toRgba(primary, 0.2));
      root.style.setProperty('--goldf', toRgba(primary, 0.1));
      root.style.setProperty('--golda', toRgba(primary, 0.15));
      if (bg)  root.style.setProperty('--bg1', bg);
      if (bg2) root.style.setProperty('--bg2', bg2);
    } else {
      ['--acc','--gold','--gold2','--goldf','--golda','--bg1','--bg2','--bg3'].forEach(v => root.style.removeProperty(v));
    }
  }, [equippedTheme]);

  const toggleDark = useCallback(() => {
    saveSettings({ theme: isDark ? 'light' : 'dark' });
  }, [isDark, saveSettings]);

  const handleEnterChat = useCallback(() => {
    if (chatTransitioning) return;
    setChatTransitioning(true);
    window.setTimeout(() => {
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 240);
    window.setTimeout(() => setChatTransitioning(false), 820);
  }, [chatTransitioning, setStep]);

  // ?? ??湲??紐⑤뱶 ??
  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontSize === 'large' ? 'large' : 'standard');
  }, [fontSize]);

  // ?? ??諛고룷 ??ChunkLoadError 諛⑹?: ?좎? 濡쒓렇????lazy chunk ?좎젣 ?꾨━?⑥튂 ??
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      import('./components/SajuCalendar.jsx').catch(() => {});
      import('./components/GroupBulseumPage.jsx').catch(() => {});
      import('./components/CompatPage.jsx').catch(() => {});
      import('./components/FutureProphecyPage.jsx').catch(() => {});
      import('./components/AnniversaryPage.jsx').catch(() => {});
      import('./components/NatalInterpretationPage.jsx').catch(() => {});
      import('./components/ComprehensivePage.jsx').catch(() => {});
      import('./components/DiaryPage.jsx').catch(() => {});
      import('./components/DiaryListPage.jsx').catch(() => {});
      import('./components/HistoryPage.jsx').catch(() => {});
      import('./components/SettingsPage.jsx').catch(() => {});
      import('./components/ProfileModal.jsx').catch(() => {});
      import('./components/OnboardingCards.jsx').catch(() => {});
      import('./components/ConsentModal.jsx').catch(() => {});
      import('./components/DreamPage.jsx').catch(() => {});
      import('./components/TaegillPage.jsx').catch(() => {});
      import('./components/NameFortunePage.jsx').catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
  }, [user]);

  // ?? ?ъ씠?쒕컮 ?ㅼ젙 濡쒕뱶 (濡쒓렇???? ??
  useEffect(() => {
    if (!user?.id) return;
    loadAnalysisCache(user.id, 'sidebar_prefs').then(raw => {
      if (!raw) return;
      try { setSidebarPrefs(JSON.parse(raw)); } catch {}
    });
  }, [user?.id]);

  // ?? 臾대즺 BP 異⑹쟾 媛???щ? 泥댄겕 (濡쒓렇???? ??
  useEffect(() => {
    if (!user?.id) {
      setFreeRechargeAvailable(true);
      return;
    }

    const checkFreeRechargeAvailability = async () => {
      try {
        const authClient = getAuthenticatedClient(user.id) || supabase;
        if (!authClient) return;
        const { data: userData } = await authClient
          .from('users')
          .select('free_bp_recharge_at')
          .eq('kakao_id', String(user.id))
          .maybeSingle();

        if (!userData?.free_bp_recharge_at) {
          setFreeRechargeAvailable(true);
          return;
        }

        const today = new Date().toISOString().slice(0, 10);
        // free_bp_recharge_at 而щ읆??timestamptz?대?濡???10???좎쭨)留?鍮꾧탳
        const lastRechargeDate = userData.free_bp_recharge_at?.slice(0, 10);
        const isAvailable = lastRechargeDate !== today;

        setFreeRechargeAvailable(isAvailable);
      } catch (error) {
        console.error('臾대즺 BP 異⑹쟾 媛???щ? 泥댄겕 ?ㅻ쪟:', error);
        setFreeRechargeAvailable(true); // ?ㅻ쪟 ??true濡?泥섎━
      }
    };

    checkFreeRechargeAvailability();
  }, [user?.id]);

  // ?? ?ㅻ뒛 ?쇨린 ?묒꽦 ?щ? ?뺤씤 ??
  useEffect(() => {
    if (!user?.id) { setTodayDiaryWritten(null); return; }
    const client = getAuthenticatedClient(user.id) || supabase;
    if (!client) return;
    const today = new Date().toISOString().slice(0, 10);
    client.from('diary_entries').select('id').eq('kakao_id', String(user.id)).eq('date', today).maybeSingle()
      .then(({ data }) => setTodayDiaryWritten(!!data)).catch(() => {});
  }, [user?.id]);

  // ?? Context.Provider??Zustand 留덉씠洹몃젅?댁뀡?쇰줈 ?쒓굅????
  // useUserCtx / useSajuCtx / useGamCtx ??store?먯꽌 吏곸젒 ?쎈뒗 shim?쇰줈 援먯껜

  // ?? 移댁뭅??濡쒓렇??泥섎━ 以?濡쒕뵫 ?붾㈃ ??
  if (loginLoading) {
    return (
      <>
        <StarCanvas isDark={isDark} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 24 }}>
          <div className="land-orb" style={{ marginBottom: 8 }}>
            <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--md)', color: 'var(--t1)', fontWeight: 600, marginBottom: 8 }}>Getting things ready</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)' }}>Please wait a moment</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
          </div>
        </div>
      </>
    );
  }

  // ?? 湲곗〈 濡쒓렇???좎? ?꾨줈???숆린??以?濡쒕뵫 ?붾㈃ (?덈줈怨좎묠 ??踰꾪듉 ?뚮옒??諛⑹?) ??
  if (profileSyncing) {
    return (
      <>
        <StarCanvas isDark={isDark} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 24 }}>
          <div className="land-orb" style={{ marginBottom: 8 }}>
            <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--md)', color: 'var(--t1)', fontWeight: 600, marginBottom: 8 }}>Signing you in</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)' }}>Please wait a moment</div>
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

      {/* ?? ?쇱쿂 ?ъ뼱 (泥?諛⑸Ц 1?뚮쭔) ?? */}
      {showTour && <FeatureTour onFinish={() => setShowTour(false)} />}

      {/* ?? ?ㅽ봽?ㅽ겕由?移대뱶 ?쒗뵆由?(html2canvas 罹≪쿂 ??? ?? */}
      <ShareCardTemplate
        ref={shareCardRef}
        type={shareCardType}
        name={shareCardName || form?.name || ''}
        saju={shareCardType === 'horoscope' ? saju : null}
        summary={cardSummary}
      />

      {/* ?? ?좎뒪???뚮┝ ?? */}
      {toast && (
        <div role="alert" aria-live="assertive" className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {chatTransitioning && (
        <div className="chat-transition-overlay" aria-hidden="true">
          <div className="chat-transition-orb">
            <div className="chat-transition-ring" />
            <div className="chat-transition-core" />
            <div className="chat-transition-star">*</div>
          </div>
        </div>
      )}

      {/* ?? ?ъ씠?쒕컮 (硫붾돱 踰꾪듉 ?곗륫 ?곷떒???좎? ???덉뒪?좊━ 寃????怨좉툒 湲곕뒫 ?묎렐?? ?? */}
      <button className={`menu-btn ${isMenuVisible || showSidebar ? "" : "is-hidden"}`} data-tour="menu-btn" onClick={() => setShowSidebar(true)} aria-label="menu" aria-expanded={showSidebar}><Icon name="grid" size={18} color="currentColor" /></button>

      {showSidebar && (
        <Sidebar
          user={user} step={step}
          histItems={histItems}
          onClose={() => setShowSidebar(false)}
          onNav={(s, item) => {
            const needsForm = [2, 5, 6, 7, 8, 10, 12, 13, 14, 16, 17, 18, 20];
            if (s === 'history' && item) { setHistItem(item); setStep(9); }
            else if (s === 'fortune') { formOkApprox ? setStep(18) : setStep(1); }
            else if (s === 1 && formOkApprox && otherProfiles.length === 0) { setSelQs([]); setStep(2); }
            else if (typeof s === 'number' && needsForm.includes(s) && !formOkApprox) { setStep(1); }
            else { setStep(s); }
          }}
          onKakaoLogin={kakaoLogin}
          onKakaoLogout={kakaoLogout}
          onProfileOpen={() => setShowProfileModal(true)}
          onInvite={() => setShowInviteModal(true)}
          onAddOther={() => setShowOtherProfileModal(true)}
          onSettings={() => setStep(19)}
          onDeleteAllHistory={deleteAllHistoryItems}
          sidebarPrefs={sidebarPrefs}
          todayDiaryWritten={todayDiaryWritten}
        />
      )}

      <button className="theme-btn" onClick={toggleDark} aria-label={isDark ? "switch to light mode" : "switch to dark mode"}>{isDark ? "L" : "D"}</button>

      {step >= 1 && user && (
        <div className="user-chip" onClick={() => setShowProfileModal(true)} title="Edit profile" style={{ cursor: 'pointer' }}>
          {equippedAvatar ? (
            <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>{equippedAvatar.emoji}</div>
          ) : user.profileImage ? (
            <img src={user.profileImage} alt="Profile" />
          ) : (
            <span style={{ fontSize: '1rem' }}>*</span>
          )}
          <span>{user.nickname}</span>
        </div>
      )}
      {step >= 1 && !user && (
        <button className="user-chip" onClick={() => { if (typeof window.gtag === 'function') window.gtag('event', 'kakao_login_click'); kakaoLogin(); }} style={{ border: '1px solid #FEE500', background: 'rgba(254,229,0,.1)' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--t2)' }}>Kakao Login</span>
        </button>
      )}

      {step > 0 && step < 5 && step !== 9 && <button className="back-btn" aria-label="go back" onClick={() => setStep(p => p === 4 ? 2 : Math.max(0, p - 1))}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {(step === 5 || step === 6 || step === 7 || step === 8 || step === 41) && <button className="back-btn" aria-label="back to result" onClick={() => setStep(4)}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {step === 9 && <button className="back-btn" aria-label="back home" onClick={() => { setHistItem(null); setStep(0); }}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {(step === 10 || step === 11 || step === 12 || step === 13 || step === 14 || step === 16 || step === 17 || step === 18 || step === 19 || step === 20 || step === 22 || step === 24 || step === 25 || step === 26 || step === 27 || step === 28 || step === 29 || step === 30 || step === 33 || step === 34 || step === 35 || step === 39 || step === 40) && <button className="back-btn" aria-label="back home" onClick={() => setStep(0)}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {step === 15 && <button className="back-btn" aria-label="go back" onClick={() => setStep(1)}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {step > 0 && <button className="home-btn" aria-label="go home" onClick={() => setStep(0)}><Icon name="home" size={18} color="currentColor" /></button>}

      {/* ?? ?섎떒 ?ㅻ퉬寃뚯씠??諛?(Zustand store?먯꽌 step/user/formOkApprox 吏곸젒 ?쎌쓬) ?? */}
      <BottomNav />

      <div className="app" id="main-content" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>

        {/* ?? Step 0: ?쒕뵫 ?? */}
        {step === 0 && (
          <LandingPage
            otherProfiles={otherProfiles}
            quiz={quiz} quizInput={quizInput} setQuizInput={setQuizInput}
            dailyResult={dailyResult} dailyLoading={dailyLoading}
            dailyCount={dailyCount} DAILY_MAX={DAILY_MAX}
            diaryReviewResult={diaryReviewResult} diaryReviewLoading={diaryReviewLoading}
            showDailyCard={showDailyCard} setShowDailyCard={setShowDailyCard}
            setDiy={setDiy}
            setEditingMyProfile={setEditingMyProfile} setShowProfileModal={setShowProfileModal}
            askQuick={askQuick} callApi={callApi} setDiaryViewDate={setDiaryViewDate}
            askDailyHoroscope={askDailyHoroscope} askDiaryReview={askDiaryReview} askWeeklyReview={askWeeklyReview}
            resetDiaryReview={resetDiaryReview}
            handleQuizAnswer={handleQuizAnswer} handleQuizSkip={handleQuizSkip}
            DiaryPageLazy={DiaryPage}
            onBlockBadtime={handleBlockBadtime}
            onCompleteMission={handleCompleteMission}
            onFreeRecharge={handleFreeRecharge}
            onDiaryComplete={handleDiaryComplete}
            hasDiaryToday={hasDiaryToday}
            isBlockingBadtime={isBlockingBadtime}
            freeRechargeAvailable={freeRechargeAvailable}
          />
        )}

        {/* ?? Step 1: ?꾨줈???좏깮 / ?앸뀈?붿씪 ?낅젰 ?? */}
        {step === 1 && (
          <ProfileStep
            form={form} setForm={setForm}
            user={user} saju={saju} sun={sun} moon={moon} asc={asc}
            formOk={formOk} editingMyProfile={editingMyProfile} setEditingMyProfile={setEditingMyProfile}
            fieldTouched={fieldTouched} setFieldTouched={setFieldTouched}
            otherProfiles={otherProfiles} setOtherProfiles={setOtherProfiles}
            activeProfileIdx={activeProfileIdx} setActiveProfileIdx={setActiveProfileIdx}
            onboardingDone={onboardingDone}
            startEditOtherProfile={startEditOtherProfile}
            setSelQs={setSelQs} setStep={setStep} setShowOtherProfileModal={setShowOtherProfileModal}
            saveProfileToSupabase={saveProfileToSupabase}
            showToast={showToast}
          />
        )}

        {/* ?? Step 2: 吏덈Ц ?좏깮 ?? */}
        {step === 2 && (
          <QuestionStep
            form={form} saju={saju} sun={sun} moon={moon}
            otherProfiles={otherProfiles} activeProfileIdx={activeProfileIdx}
            timeSlot={timeSlot}
            diy={diy} setDiy={setDiy}
            selQs={selQs} maxQ={maxQ}
            cat={cat} setCat={setCat}
            showAllCats={showAllCats} setShowAllCats={setShowAllCats}
            addQ={addQ} rmQ={rmQ} askQuick={askQuick} askClaude={askClaude}
            askBtnRef={askBtnRef}
            user={user}
          />
        )}

        {/* ?? Step 3: 濡쒕뵫 ?? */}
        {step === 3 && (
          <div className="page" role="status" aria-live="polite" aria-busy="true" aria-label="?? ?">
            <SkeletonLoader qCount={selQs.length} saju={saju} loadingMsgIdx={loadingMsgIdx} selQs={selQs} qLoadStatus={qLoadStatus} />
            {retryMsg && (
              <div style={{ marginTop: 12, padding: '10px 16px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: 'var(--gold)', textAlign: 'center', animation: 'fadeUp .3s ease' }}>
                {retryMsg}
              </div>
            )}
          </div>
        )}

        {/* ?? Step 4: 寃곌낵 ?? */}
        {step === 4 && (
          <ResultsStep
            selQs={selQs} answers={answers} openAcc={openAcc} typedSet={typedSet}
            cat={cat} pkg={pkg}
            chatLeft={chatLeft} curPkg={curPkg}
            showSubNudge={showSubNudge}
            copyDone={copyDone}
            resultsRef={resultsRef}
            handleAccToggle={handleAccToggle} handleTypingDone={handleTypingDone} retryAnswer={retryAnswer}
            shareCard={shareCard} handleCopyAll={handleCopyAll} shareResult={shareResult}
            handleShareFortuneCard={handleShareFortuneCard}
            spendBP={spendBP}
            setStep={setStep} setSelQs={setSelQs} setDiy={setDiy}
            setShowSidebar={setShowSidebar} setShowUpgradeModal={setShowUpgradeModal}
            kakaoLogin={kakaoLogin} genReport={genReport} resetSession={resetSession}
            onEnterChat={handleEnterChat}
          />
        )}

        {/* ?? Step 5: 梨꾪똿 (怨좎젙 ?덉씠?꾩썐 ???ㅻ뜑+?낅젰李?怨좎젙, ?덉뒪?좊━留??ㅽ겕濡? ?? */}
        {step === 5 && (
          <ChatStep
            chatHistory={chatHistory} chatInput={chatInput} setChatInput={setChatInput}
            chatLoading={chatLoading} chatLeft={chatLeft} latestChatIdx={latestChatIdx}
            selQs={selQs}
            profileNudge={profileNudge} setProfileNudge={setProfileNudge}
            setShowProfileModal={setShowProfileModal}
            handleSendChat={handleSendChat} handleSaveChatImage={handleSaveChatImage}
            chatEndRef={chatEndRef}
          />
        )}

        {/* ?? Step 6: 蹂꾩닲 ?ъ링 ?명꽣酉?(援??붽컙由ы룷?? ?? */}
        {step === 6 && (
          <Suspense fallback={<PageSpinner />}>
            <DeepInterviewPage
              form={form} today={today}
              callApi={callApi}
              shareResult={shareResult}
              saveReportImage={handleSaveReportImage}
            />
          </Suspense>
        )}

        {/* ?? Step 7: 沅곹빀 ?? */}
        {step === 7 && (
          <Suspense fallback={<PageSpinner />}>
            <CompatPage
              myForm={form} mySaju={saju} mySun={sun}
              callApi={callApi} buildCtx={buildCtx}
              onBack={() => setStep(4)}
              shareResult={shareResult}
              user={user}
              consentFlags={consentFlags}
              otherProfiles={otherProfiles}
              saveOtherProfile={saveOtherProfile}
              onAnonShare={(data) => { setAnonCompatShareData(data); setStep(32); }}
            />
          </Suspense>
        )}

        {/* ?? Step 8: 誘몃옒 ?덉뼵 ?? */}
        {step === 8 && (
          <Suspense fallback={<PageSpinner />}>
            <FutureProphecyPage
              form={form} buildCtx={buildCtx} callApi={callApi}
              onBack={() => setStep(4)}
              shareResult={shareResult}
              saveImage={handleSaveProphecyImage}
              user={user}
              consentFlags={consentFlags}
              showToast={showToast}
            />
          </Suspense>
        )}

        {/* ?? Step 9: ?덉뒪?좊━ ?? */}
        {step === 9 && histItem && (
          <Suspense fallback={<PageSpinner />}>
            <HistoryPage
              item={histItem}
              onBack={() => { setHistItem(null); setStep(0); }}
              onDelete={(id, supabaseId) => { deleteHistoryItem(id, supabaseId); }}
              onReplay={(targetStep) => {
                setHistItem(null);
                setStep(targetStep);
              }}
            />
          </Suspense>
        )}

        {/* ?? Step 10: 蹂꾩닲 ?щ젰 ?? */}
        {step === 10 && (
          <Suspense fallback={<PageSpinner />}>
            <SajuCalendar form={form} setStep={setStep} askQuick={askQuick} user={user} callApi={callApi} showToast={showToast} setDiaryViewDate={setDiaryViewDate} />
          </Suspense>
        )}

        {/* ?? Step 11: ?곕━ 紐⑥엫??蹂꾩닲?? ?? */}
        {step === 11 && (
          <Suspense fallback={<PageSpinner />}>
            <GroupBulseumPage form={form} saju={saju} sun={sun} setStep={setStep} initialCode={groupCode} user={user} />
          </Suspense>
        )}

        {/* ?? Step 12: 湲곕뀗???댁꽭 ?? */}
        {step === 12 && (
          <Suspense fallback={<PageSpinner />}>
            <AnniversaryPage
              form={form}
              callApi={callApi}
              anniversaryDate={anniversaryDate}
              setAnniversaryDate={setAnniversaryDate}
              anniversaryType={anniversaryType}
              setAnniversaryType={setAnniversaryType}
              ANNIVERSARY_PROMPT={ANNIVERSARY_PROMPT}
              buildCtx={buildCtx}
            />
          </Suspense>
        )}

        {/* ?? Step 13: ?섏쓽 蹂꾩닲 (?ъ＜?먭뎅怨?蹂꾩옄由? ?? */}
        {step === 13 && (
          <Suspense fallback={<PageSpinner />}>
            <NatalInterpretationPage
              saju={saju}
              sun={sun}
              moon={moon}
              asc={asc}
              form={form}
              onGoStep={setStep}
            />
          </Suspense>
        )}

        {/* ?? Step 14: 醫낇빀 遺꾩꽍 (?ъ＜ + ?먯꽦?????듯빀) ?? */}
        {step === 14 && (
          <Suspense fallback={<PageSpinner />}>
            <ComprehensivePage
              saju={saju}
              sun={sun}
              moon={moon}
              asc={asc}
              form={form}
              buildCtx={buildCtx}
              user={user}
              consentFlags={consentFlags}
            />
          </Suspense>
        )}

        {/* ?? Step 15: ?⑤낫??移대뱶 ?? */}
        {step === 15 && (
          <Suspense fallback={<PageSpinner />}>
            <OnboardingCards
              saju={saju}
              sun={sun}
              onFinish={handleOnboardingFinish}
            />
          </Suspense>
        )}

        {/* ?? Step 16: 醫낇빀 ?먯꽦????step 14(醫낇빀 遺꾩꽍)濡?由щ떎?대젆???? */}
        {step === 16 && (() => { setStep(14); return null; })()}

        {/* ?? Step 17: ?섏쓽 ?섎（瑜?蹂꾩닲?먭쾶 (?쇨린) ?? */}
        {step === 17 && (
          <Suspense fallback={<PageSpinner />}>
            <DiaryPage
              askReview={askDiaryReview}
              setStep={setStep}
              setDiy={setDiy}
              callApi={callApi}
              viewDate={diaryViewDate}
              diaryReviewResult={diaryReviewResult}
              diaryReviewLoading={diaryReviewLoading}
              onDiaryComplete={handleDiaryComplete}
            />
          </Suspense>
        )}

        {/* ?? Step 18: ?ㅻ뒛 ?섎（ ?섏쓽 蹂꾩닲 (?댁꽭 移대뱶) ?? */}
        {step === 18 && (
          <DailyHoroscopePage
            today={today}
            dailyResult={dailyResult} dailyLoading={dailyLoading}
            dailyCount={dailyCount} DAILY_MAX={DAILY_MAX}
            askDailyHoroscope={askDailyHoroscope}
            currentBp={gamificationState?.currentBp || 0}
            onBlockBadtime={handleBlockBadtime}
            isBlockingBadtime={isBlockingBadtime}
            freeRechargeAvailable={freeRechargeAvailable}
            earnBP={earnBP}
          />
        )}

        {/* ?? Step 19: ?ㅼ젙 ?? */}
        {step === 19 && (
          <Suspense fallback={<PageSpinner />}>
            <SettingsPage
              form={form}
              setForm={setForm}
              user={user}
              saveProfileToSupabase={saveProfileToSupabase}
              onBack={() => setStep(0)}
              showToast={showToast}
              responseStyle={responseStyle}
              onStyleChange={(val) => saveSettings({ responseStyle: val })}
              sidebarPrefs={sidebarPrefs}
              onSidebarPrefsChange={(prefs) => {
                setSidebarPrefs(prefs);
                if (user?.id) saveAnalysisCache(user.id, 'sidebar_prefs', JSON.stringify(prefs));
              }}
              lifeStage={lifeStage}
              onLifeStageChange={(val) => saveSettings({ lifeStage: val })}
              fontSize={fontSize}
              onFontSizeChange={(val) => saveSettings({ fontSize: val })}
            />
          </Suspense>
        )}

        {/* ?? Step 20: ?쇨린 紐⑥븘蹂닿린 ?? */}
        {step === 20 && (
          <Suspense fallback={<PageSpinner />}>
            <DiaryListPage
              user={user}
              setStep={setStep}
              onSelectEntry={(date) => setDiaryViewDate(date)}
            />
          </Suspense>
        )}

        {/* ?? Step 21: ?ъ＜ 紐낇븿 移대뱶 ?? */}
        {step === 21 && (
          <Suspense fallback={<PageSpinner />}>
            <SajuCardPage
              form={form}
              saju={saju}
              sun={sun}
              setStep={setStep}
              showToast={showToast}
            />
          </Suspense>
        )}

        {/* ?? Step 22: 臾몄쓽?섍린 ?? */}
        {step === 22 && (
          <Suspense fallback={<PageSpinner />}>
            <InquiryPage />
          </Suspense>
        )}

        {/* Step 23: Today detail page */}
        {step === 23 && (
          <TodayDetailPage
            dailyResult={dailyResult}
            dailyLoading={dailyLoading}
            dailyCount={dailyCount}
            DAILY_MAX={DAILY_MAX}
            gamificationState={gamificationState}
            onBlockBadtime={handleBlockBadtime}
            isBlockingBadtime={isBlockingBadtime}
            setStep={setStep}
            onRefresh={askDailyHoroscope}
          />
        )}

        {/* ?? Step 24: 轅??대そ ?? */}
        {step === 24 && (
          <Suspense fallback={<PageSpinner />}>
            <DreamPage
              user={user}
              form={form}
              buildCtx={buildCtx}
              callApi={callApi}
              setStep={setStep}
              showToast={showToast}
              consentFlags={consentFlags}
              onShareCard={handleShareDreamCard}
            />
          </Suspense>
        )}

        {/* ?? Step 25: ?앹씪 (湲몄씪 李얘린) ?? */}
        {step === 25 && (
          <Suspense fallback={<PageSpinner />}>
            <TaegillPage
              form={form}
              buildCtx={buildCtx}
              callApi={callApi}
              showToast={showToast}
              onShareCard={handleShareTaegilCard}
              user={user}
              consentFlags={consentFlags}
            />
          </Suspense>
        )}

        {/* ?? Step 26: ?대쫫 ???(?깅챸?? ?? */}
        {step === 26 && (
          <Suspense fallback={<PageSpinner />}>
            <NameFortunePage
              form={form}
              buildCtx={buildCtx}
              callApi={callApi}
              showToast={showToast}
              user={user}
              consentFlags={consentFlags}
            />
          </Suspense>
        )}

        {/* ?? Step 27: 留덉씠?섏씠吏 (store?먯꽌 吏곸젒 ?쎌쓬) ?? */}
        {step === 27 && (
          <Suspense fallback={<PageSpinner />}>
            <MyPage
              onFreeRecharge={handleFreeRecharge}
              freeRechargeAvailable={freeRechargeAvailable}
              onFreezeStreak={freezeStreak}
            />
          </Suspense>
        )}

        {/* ?? Step 28: ?섏쓽 蹂꾩닲 ?듦퀎 ?? */}
        {step === 28 && (
          <Suspense fallback={<PageSpinner />}>
            <StatsPage callApi={callApi} />
          </Suspense>
        )}

        {/* ?? Step 29: 蹂꾩닲 愿묒옣 (而ㅻ??덊떚 ?쇰뱶) ?? */}
        {step === 29 && (
          <Suspense fallback={<PageSpinner />}>
            <CommunityPage showToast={showToast} dailyResult={dailyResult} />
          </Suspense>
        )}

        {/* ?? Step 30: ?섏쓽 ????먮쫫 ?? */}
        {step === 30 && (
          <Suspense fallback={<PageSpinner />}>
            <DaeunPage
              form={form}
              saju={saju}
              callApi={callApi}
              buildCtx={buildCtx}
              showToast={showToast}
            />
          </Suspense>
        )}

        {/* ?? Step 31: 蹂꾩닲 ???? */}
        {step === 31 && (
          <Suspense fallback={<PageSpinner />}>
            <ShopPage showToast={showToast} />
          </Suspense>
        )}

        {/* ?? Step 32: ?듬챸 沅곹빀 愿묒옣 ?? */}
        {step === 32 && (
          <Suspense fallback={<PageSpinner />}>
            <AnonCompatPage
              showToast={showToast}
              shareData={anonCompatShareData}
            />
          </Suspense>
        )}

        {/* ?? Step 33: ?밸퀎 ?곷떞 (???꾩씠???곌껐) ?? */}
        {step === 33 && (
          <Suspense fallback={<PageSpinner />}>
            <SpecialReadingPage
              callApi={callApi}
              showToast={showToast}
              consentFlags={consentFlags}
            />
          </Suspense>
        )}

        {/* ?? Step 34: 蹂꾩닲 ?濡??? */}
        {step === 34 && (
          <Suspense fallback={<PageSpinner />}>
            <TarotPage callApi={callApi} buildCtx={buildCtx} showToast={showToast} consentFlags={consentFlags} />
          </Suspense>
        )}

        {/* ?? Step 35: 蹂꾩닲?몄? ?? */}
        {step === 35 && (
          <Suspense fallback={<PageSpinner />}>
            <ByeolsoomLetterPage showToast={showToast} />
          </Suspense>
        )}

        {/* ?? Step 36: ?곌컙 醫낇빀 由ы룷???? */}
        {step === 36 && (
          <Suspense fallback={<PageSpinner />}>
            <YearlyReportPage
              form={form}
              buildCtx={buildCtx}
              showToast={showToast}
              spendBP={spendBP}
              currentBp={gamificationState?.currentBp || 0}
              setStep={setStep}
            />
          </Suspense>
        )}

        {/* ?? Step 37: 蹂꾩닲?깆옣 ??쒕낫???? */}
        {step === 37 && (
          <Suspense fallback={<PageSpinner />}>
            <GrowthDashboardPage
              onRechargeFreeBP={handleFreeRecharge}
            />
          </Suspense>
        )}

        {/* ?? Step 38: ???꾩씠???? */}
        {step === 38 && (
          <Suspense fallback={<PageSpinner />}>
            <ItemInventoryPage showToast={showToast} callApi={callApi} spendBP={spendBP} />
          </Suspense>
        )}

        {/* ?? Step 39: 濡쒕삉 踰덊샇 戮묎린 ?? */}
        {step === 39 && (
          <Suspense fallback={<PageSpinner />}>
            <LottoPage consentFlags={consentFlags} />
          </Suspense>
        )}

        {/* ?? Step 40: 蹂꾩닲 戮묎린 (媛梨? ?? */}
        {step === 40 && (
          <Suspense fallback={<PageSpinner />}>
            <ShopPage showToast={showToast} />
          </Suspense>
        )}

        {/* ?? Step 41: ?붽컙 由ы룷???? */}
        {step === 41 && (
          <ReportStep
            form={form} today={today}
            reportText={reportText} reportLoading={reportLoading}
            genReport={genReport}
            shareCard={shareCard}
            shareResult={shareResult}
            saveReportImage={handleSaveReportImage}
          />
        )}

        <div style={{ fontSize: '10px', color: 'var(--t4)', textAlign: 'center', padding: '20px 20px 40px', letterSpacing: '0.02em' }}>
          ??蹂꾩닲? ?먯닠 諛??ㅻ씫 紐⑹쟻???쒕퉬?ㅼ씠硫? 寃곌낵????댁꽌??踰뺤쟻 梨낆엫?대굹 ?⑤젰??吏吏 ?딆뒿?덈떎.
        </div>
      </div>

      {/* ?? 紐⑤떖???? */}
      {showProfileModal && (
        <Suspense fallback={<PageSpinner />}>
          <ProfileModal profile={profile} setProfile={userProfile.setProfile} onClose={() => setShowProfileModal(false)} user={user} saveUserProfileExtra={saveUserProfileExtra} />
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

      {/* ?? 移쒓뎄 珥덈? 紐⑤떖 ?? */}
      {showInviteModal && (
        <InviteModal
          user={user} showToast={showToast}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* ?쇨린 紐⑤떖 ?쒓굅????Step 17 DiaryPage濡??대룞 */}

      {shareModal.open && (
        <ShareModal
          shareModal={shareModal}
          onClose={() => { setShareModal(s => ({ ...s, open: false })); }}
          showToast={showToast}
          cardDataUrl={cardDataUrl}
        />
      )}

      {/* ?? BP ?ъ슜 ?뺤씤 紐⑤떖 ?? */}
      <BPConfirmModal />

      {/* ?? ?섑샇???덈꺼??紐⑤떖 ?? */}
      {guardianLevelUp && (
        <GuardianLevelUpModal
          fromLevel={guardianLevelUp.fromLevel}
          toLevel={guardianLevelUp.toLevel}
          guardianMessage={guardianMessage}
          loading={guardianMsgLoading}
          onClose={() => setGuardianLevelUp(null)}
        />
      )}

      {/* ?? ?숈쓽 ?앹뾽 ?? */}
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

