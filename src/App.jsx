import { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from "react";

// store (showToast를 스토어에 주입)
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

// lazy-loaded components — ALL const declarations come after ALL static imports
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

// ═══════════════════════════════════════════════════════════
//  🏠 메인 앱
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTour, setShowTour] = useState(false);
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
  const [todayDiaryWritten, setTodayDiaryWritten] = useState(null); // null=미확인, true/false
  const [anonCompatShareData, setAnonCompatShareData] = useState(null);
  const [diaryViewDate, setDiaryViewDate] = useState(null); // null=오늘, 'YYYY-MM-DD'=특정 날짜
  const toastTimer = useRef(null);
  const resultsRef = useRef(null);
  const askBtnRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), TIMING.toastDuration);
  }, []);

  // ── Zustand State (App level) ──
  const step = useAppStore((s) => s.step);
  const setStep = useAppStore((s) => s.setStep);
  const equippedTheme = useAppStore((s) => s.equippedTheme);
  const equippedAvatar = useAppStore((s) => s.equippedAvatar);

  // showToast를 Zustand store에 1회 주입 (Context 없이 컴포넌트에서 직접 사용 가능)
  const _storeSetAuthFns    = useAppStore((s) => s.setAuthFns);
  const showUpgradeModal    = useAppStore((s) => s.showUpgradeModal);
  const setShowUpgradeModal = useAppStore((s) => s.setShowUpgradeModal);
  useEffect(() => { _storeSetAuthFns({ showToast }); }, [showToast, _storeSetAuthFns]);

  // ── 커스텀 훅 ──
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

  // isDark / onboardingDone / quiz → userProfile에서 파생
  const isDark          = theme === 'dark';
  const onboardingDone  = onboarded;
  const quiz            = quizState;

  // ── 피처 투어 트리거 (온보딩 완료 후 step 0 첫 도달 시 1회만) ──
  useEffect(() => {
    if (step === 0 && onboardingDone && localStorage.getItem('byeolsoom_tour_v1') !== 'done') {
      const t = setTimeout(() => setShowTour(true), 700);
      return () => clearTimeout(t);
    }
  }, [step, onboardingDone]);

  // lifeStage + qaAnswers를 profile에 병합하여 AI 컨텍스트 빌더에 전달
  const profileWithMeta = { ...profile, lifeStage, qaAnswers: profile.qa_answers || profile.qaAnswers };
  const sajuCtx = useSajuContext(form, profileWithMeta, activeProfileIdx, otherProfiles);
  const { today, saju, sun, moon, asc, age, formOk, formOkApprox, isApproximate, activeForm, activeSaju, activeSun, activeAge, ageRange, buildCtx } = sajuCtx;

  // ── 게이미피케이션 시스템 ──
  const gamification = useGamification(user, showToast);
  const {
    gamificationState, missions,
    earnBP, earnDiaryBP, spendBP, blockBadtime, completeMission, loadTodayMissions, rechargeFreeBP, freezeStreak,
  } = gamification;

  // 배드타임 액막이 상태
  const [isBlockingBadtime, setIsBlockingBadtime] = useState(false);

  // 수호신 레벨업 모달
  const guardianLevelUp = useAppStore((s) => s.guardianLevelUp);
  const setGuardianLevelUp = useAppStore((s) => s.setGuardianLevelUp);
  const [guardianMessage, setGuardianMessage] = useState('');
  const [guardianMsgLoading, setGuardianMsgLoading] = useState(false);

  // 무료 BP 충전 가능 여부
  const [freeRechargeAvailable, setFreeRechargeAvailable] = useState(true);

  // 오늘 일기 작성 여부 (세션 내 추적)
  const [hasDiaryToday, setHasDiaryToday] = useState(false);

  // 배드타임 액막이 핸들러
  const handleBlockBadtime = useCallback(async () => {
    if (!gamificationState.currentBp || gamificationState.currentBp < 20) {
      showToast('BP가 부족합니다 😢', 'error');
      return;
    }
    setIsBlockingBadtime(true);
    try {
      const result = await blockBadtime('badtime_1', 20);
      if (result.success) {
        showToast('액막이 발동! 악운을 긍정적으로 바꿨어요 ✨', 'success');
      }
    } finally {
      setIsBlockingBadtime(false);
    }
  }, [gamificationState.currentBp, blockBadtime, showToast]);

  // 미션 완료 핸들러 — completeMission 내부에서 낙관적 업데이트 처리하므로 여기선 호출만
  const handleCompleteMission = useCallback(async (missionId) => {
    try {
      await completeMission(missionId);
    } catch {
      showToast('미션 완료 중 오류 발생', 'error');
    }
  }, [completeMission, showToast]);

  // 미션 저장 완료 후 UI 갱신 콜백
  const handleMissionsSaved = useCallback(() => {
    loadTodayMissions(user?.id);
  }, [loadTodayMissions, user?.id]);

  // formOkApprox: 년+월만 있어도 체험 가능하도록 게이트 완화
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
          deleteHistoryItem, deleteAllHistoryItems, generateChatSuggestions } = consultation;

  const curPkg = PKGS.find(p => p.id === pkg) || PKGS[1]; // fallback: premium

  // 수호신 레벨업 감지 → AI 메시지 생성
  useEffect(() => {
    if (!guardianLevelUp) return;
    const LEVEL_LABELS = { 1: '초급 액막이사', 2: '중급 액막이사', 3: '고급 액막이사', 4: '마스터 액막이사', 5: '별숨의 수호자' };
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
            userMessage: `나는 방금 별숨 수호자 시스템에서 ${LEVEL_LABELS[guardianLevelUp.fromLevel]}(Lv${guardianLevelUp.fromLevel})에서 ${LEVEL_LABELS[guardianLevelUp.toLevel]}(Lv${guardianLevelUp.toLevel})로 레벨업했어요. 수호신이 되어 짧고 진심 어린 축하 메시지를 2~3줄로 전해줘요. 너무 격식 있지 않게, 별과 사주의 언어로요.`,
            context: ctx,
            kakaoId: user?.id,
            clientHour: new Date().getHours(),
            isChat: true,
          }),
        });
        const data = await res.json();
        setGuardianMessage(data.text || '');
      } catch {
        setGuardianMessage('새로운 레벨의 힘이 당신과 함께해요. 더 성장한 모습으로 별을 맞이하세요.');
      } finally {
        setGuardianMsgLoading(false);
      }
    })();
  }, [guardianLevelUp]);

  // 일기 완료 핸들러 (새 일기 저장 시 BP 적립)
  const handleDiaryComplete = useCallback(async () => {
    if (!earnDiaryBP) return;
    const result = await earnDiaryBP();
    if (result?.success) setHasDiaryToday(true);
  }, [earnDiaryBP]);

  // 무료 BP 충전 핸들러
  const handleFreeRecharge = useCallback(async () => {
    try {
      const result = await rechargeFreeBP();
      if (result.success) {
        showToast(`+${result.recharged} BP 충전! 🔋`, 'success');
        setFreeRechargeAvailable(false); // 충전 완료 후 상태 업데이트
      } else if (result.message === '일일 1회 제한') {
        showToast('내일 다시 충전할 수 있습니다 ⏰', 'info');
      }
    } catch (error) {
      showToast('BP 충전 중 오류 발생', 'error');
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

  // ── 모달 열림 시 body 스크롤 잠금 ──
  useEffect(() => {
    const anyOpen = showUpgradeModal || showOtherProfileModal || showInviteModal || shareModal.open;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showUpgradeModal, showOtherProfileModal, showInviteModal, shareModal.open]);

  // ── Escape 키로 모달/사이드바 닫기 ──
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

  // ── 테마 ──
  useEffect(() => { document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (equippedTheme?.effect) {
      // 테마 아이템의 effect 필드에 정의된 CSS 변수 적용
      // 구조 예시: { "--acc": "#FFCF70", "--gold": "#E8B048", "--bg1": "#0d0b14" }
      try {
        const vars = typeof equippedTheme.effect === 'string' ? JSON.parse(equippedTheme.effect) : equippedTheme.effect;
        Object.entries(vars).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      } catch (e) {
        console.error('테마 파싱 에러:', e);
      }
    } else {
      // 장착 해제 시 인라인 속성 제거 (index.css 원본 복구)
      root.style.removeProperty('--acc');
      root.style.removeProperty('--gold');
      root.style.removeProperty('--goldf');
      root.style.removeProperty('--golda');
      root.style.removeProperty('--bg1');
      root.style.removeProperty('--bg2');
      root.style.removeProperty('--bg3');
    }
  }, [equippedTheme]);

  const toggleDark = useCallback(() => {
    saveSettings({ theme: isDark ? 'light' : 'dark' });
  }, [isDark, saveSettings]);

  // ── 큰 글씨 모드 ──
  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontSize === 'large' ? 'large' : 'standard');
  }, [fontSize]);

  // ── 새 배포 후 ChunkLoadError 방지: 유저 로그인 시 lazy chunk 선제 프리패치 ──
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

  // ── 사이드바 설정 로드 (로그인 후) ──
  useEffect(() => {
    if (!user?.id) return;
    loadAnalysisCache(user.id, 'sidebar_prefs').then(raw => {
      if (!raw) return;
      try { setSidebarPrefs(JSON.parse(raw)); } catch {}
    });
  }, [user?.id]);

  // ── 무료 BP 충전 가능 여부 체크 (로그인 후) ──
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
        // free_bp_recharge_at 컬럼이 timestamptz이므로 앞 10자(날짜)만 비교
        const lastRechargeDate = userData.free_bp_recharge_at?.slice(0, 10);
        const isAvailable = lastRechargeDate !== today;

        setFreeRechargeAvailable(isAvailable);
      } catch (error) {
        console.error('무료 BP 충전 가능 여부 체크 오류:', error);
        setFreeRechargeAvailable(true); // 오류 시 true로 처리
      }
    };

    checkFreeRechargeAvailability();
  }, [user?.id]);

  // ── 오늘 일기 작성 여부 확인 ──
  useEffect(() => {
    if (!user?.id) { setTodayDiaryWritten(null); return; }
    const client = getAuthenticatedClient(user.id) || supabase;
    if (!client) return;
    const today = new Date().toISOString().slice(0, 10);
    client.from('diary_entries').select('id').eq('kakao_id', String(user.id)).eq('date', today).maybeSingle()
      .then(({ data }) => setTodayDiaryWritten(!!data)).catch(() => {});
  }, [user?.id]);

  // ── Context.Provider는 Zustand 마이그레이션으로 제거됨 ──
  // useUserCtx / useSajuCtx / useGamCtx → store에서 직접 읽는 shim으로 교체

  // ── 카카오 로그인 처리 중 로딩 화면 ──
  if (loginLoading) {
    return (
      <>
        <StarCanvas isDark={isDark} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 24 }}>
          <div className="land-orb" style={{ marginBottom: 8 }}>
            <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--md)', color: 'var(--t1)', fontWeight: 600, marginBottom: 8 }}>별숨이 당신을 맞이하고 있어요</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)' }}>잠깐만요 🌙</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
          </div>
        </div>
      </>
    );
  }

  // ── 기존 로그인 유저 프로필 동기화 중 로딩 화면 (새로고침 시 버튼 플래시 방지) ──
  if (profileSyncing) {
    return (
      <>
        <StarCanvas isDark={isDark} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 24 }}>
          <div className="land-orb" style={{ marginBottom: 8 }}>
            <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--md)', color: 'var(--t1)', fontWeight: 600, marginBottom: 8 }}>별숨 로그인 중</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)' }}>잠깐만요 🌙</div>
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

      {/* ── 피처 투어 (첫 방문 1회만) ── */}
      {showTour && <FeatureTour onFinish={() => setShowTour(false)} />}

      {/* ── 오프스크린 카드 템플릿 (html2canvas 캡처 대상) ── */}
      <ShareCardTemplate
        ref={shareCardRef}
        type={shareCardType}
        name={shareCardName || form?.name || ''}
        saju={shareCardType === 'horoscope' ? saju : null}
        summary={cardSummary}
      />

      {/* ── 토스트 알림 ── */}
      {toast && (
        <div role="alert" aria-live="assertive" className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* ── 사이드바 (메뉴 버튼 우측 상단에 유지 — 히스토리 검색 등 고급 기능 접근용) ── */}
      <button className="menu-btn" data-tour="menu-btn" onClick={() => setShowSidebar(true)} aria-label="메뉴 열기" aria-expanded={showSidebar}>☰</button>

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

      <button className="theme-btn" onClick={toggleDark} aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}>{isDark ? '☀' : '◑'}</button>

      {step >= 1 && user && (
        <div className="user-chip" onClick={() => setShowProfileModal(true)} title="내 정보 수정" style={{ cursor: 'pointer' }}>
          {equippedAvatar ? (
            <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>{equippedAvatar.emoji}</div>
          ) : user.profileImage ? (
            <img src={user.profileImage} alt="프로필" />
          ) : (
            <span style={{ fontSize: '1rem' }}>🌙</span>
          )}
          <span>{user.nickname}</span>
        </div>
      )}
      {step >= 1 && !user && (
        <button className="user-chip" onClick={() => { if (typeof window.gtag === 'function') window.gtag('event', 'kakao_login_click'); kakaoLogin(); }} style={{ border: '1px solid #FEE500', background: 'rgba(254,229,0,.1)' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--t2)' }}>카카오 로그인</span>
        </button>
      )}

      {step > 0 && step < 5 && step !== 9 && <button className="back-btn" aria-label="이전 단계로" onClick={() => setStep(p => p === 4 ? 2 : Math.max(0, p - 1))}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {(step === 5 || step === 6 || step === 7 || step === 8 || step === 41) && <button className="back-btn" aria-label="결과로 돌아가기" onClick={() => setStep(4)}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {step === 9 && <button className="back-btn" aria-label="홈으로 돌아가기" onClick={() => { setHistItem(null); setStep(0); }}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {(step === 10 || step === 11 || step === 12 || step === 13 || step === 14 || step === 16 || step === 17 || step === 18 || step === 19 || step === 20 || step === 22 || step === 24 || step === 25 || step === 26 || step === 27 || step === 28 || step === 29 || step === 30 || step === 33 || step === 34 || step === 35 || step === 39 || step === 40) && <button className="back-btn" aria-label="홈으로 돌아가기" onClick={() => setStep(0)}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {step === 15 && <button className="back-btn" aria-label="이전으로" onClick={() => setStep(1)}><Icon name="arrow-left" size={18} color="currentColor" /></button>}
      {step > 0 && <button className="home-btn" aria-label="홈으로" onClick={() => setStep(0)}><Icon name="home" size={18} color="currentColor" /></button>}

      {/* ── 하단 네비게이션 바 (Zustand store에서 step/user/formOkApprox 직접 읽음) ── */}
      <BottomNav />

      <div className="app" id="main-content" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>

        {/* ── Step 0: 랜딩 ── */}
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

        {/* ── Step 1: 프로필 선택 / 생년월일 입력 ── */}
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

        {/* ── Step 2: 질문 선택 ── */}
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

        {/* ── Step 3: 로딩 ── */}
        {step === 3 && (
          <div className="page" role="status" aria-live="polite" aria-busy="true" aria-label="별숨이 답변을 준비하고 있어요">
            <SkeletonLoader qCount={selQs.length} saju={saju} loadingMsgIdx={loadingMsgIdx} selQs={selQs} qLoadStatus={qLoadStatus} />
            {retryMsg && (
              <div style={{ marginTop: 12, padding: '10px 16px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: 'var(--gold)', textAlign: 'center', animation: 'fadeUp .3s ease' }}>
                {retryMsg}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: 결과 ── */}
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
          />
        )}

        {/* ── Step 5: 채팅 (고정 레이아웃 — 헤더+입력창 고정, 히스토리만 스크롤) ── */}
        {step === 5 && (
          <ChatStep
            chatHistory={chatHistory} chatInput={chatInput} setChatInput={setChatInput}
            chatLoading={chatLoading} chatLeft={chatLeft} latestChatIdx={latestChatIdx}
            selQs={selQs}
            profileNudge={profileNudge} setProfileNudge={setProfileNudge}
            setShowProfileModal={setShowProfileModal}
            handleSendChat={handleSendChat} handleSaveChatImage={handleSaveChatImage}
            chatEndRef={chatEndRef}
            generateChatSuggestions={generateChatSuggestions}
          />
        )}

        {/* ── Step 6: 별숨 심층 인터뷰 (구 월간리포트) ── */}
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

        {/* ── Step 7: 궁합 ── */}
        {step === 7 && (
          <Suspense fallback={<PageSpinner />}>
            <CompatPage
              myForm={form} mySaju={saju} mySun={sun}
              callApi={callApi} buildCtx={buildCtx}
              onBack={() => setStep(4)}
              shareResult={shareResult}
              user={user}
              otherProfiles={otherProfiles}
              saveOtherProfile={saveOtherProfile}
              onAnonShare={(data) => { setAnonCompatShareData(data); setStep(32); }}
            />
          </Suspense>
        )}

        {/* ── Step 8: 미래 예언 ── */}
        {step === 8 && (
          <Suspense fallback={<PageSpinner />}>
            <FutureProphecyPage
              form={form} buildCtx={buildCtx} callApi={callApi}
              onBack={() => setStep(4)}
              shareResult={shareResult}
              saveImage={handleSaveProphecyImage}
            />
          </Suspense>
        )}

        {/* ── Step 9: 히스토리 ── */}
        {step === 9 && histItem && (
          <Suspense fallback={<PageSpinner />}>
            <HistoryPage
              item={histItem}
              onBack={() => { setHistItem(null); setStep(0); }}
              onDelete={(id, supabaseId) => { deleteHistoryItem(id, supabaseId); }}
            />
          </Suspense>
        )}

        {/* ── Step 10: 별숨 달력 ── */}
        {step === 10 && (
          <Suspense fallback={<PageSpinner />}>
            <SajuCalendar form={form} setStep={setStep} askQuick={askQuick} user={user} callApi={callApi} showToast={showToast} setDiaryViewDate={setDiaryViewDate} />
          </Suspense>
        )}

        {/* ── Step 11: 우리 모임의 별숨은? ── */}
        {step === 11 && (
          <Suspense fallback={<PageSpinner />}>
            <GroupBulseumPage form={form} saju={saju} sun={sun} setStep={setStep} initialCode={groupCode} user={user} />
          </Suspense>
        )}

        {/* ── Step 12: 기념일 운세 ── */}
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

        {/* ── Step 13: 나의 별숨 (사주원국과 별자리) ── */}
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

        {/* ── Step 14: 종합 분석 (사주 + 점성술 탭 통합) ── */}
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
            />
          </Suspense>
        )}

        {/* ── Step 15: 온보딩 카드 ── */}
        {step === 15 && (
          <Suspense fallback={<PageSpinner />}>
            <OnboardingCards
              saju={saju}
              sun={sun}
              onFinish={handleOnboardingFinish}
            />
          </Suspense>
        )}

        {/* ── Step 16: 종합 점성술 → step 14(종합 분석)로 리다이렉트 ── */}
        {step === 16 && (() => { setStep(14); return null; })()}

        {/* ── Step 17: 나의 하루를 별숨에게 (일기) ── */}
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

        {/* ── Step 18: 오늘 하루 나의 별숨 (운세 카드) ── */}
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

        {/* ── Step 19: 설정 ── */}
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

        {/* ── Step 20: 일기 모아보기 ── */}
        {step === 20 && (
          <Suspense fallback={<PageSpinner />}>
            <DiaryListPage
              user={user}
              setStep={setStep}
              onSelectEntry={(date) => setDiaryViewDate(date)}
            />
          </Suspense>
        )}

        {/* ── Step 21: 사주 명함 카드 ── */}
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

        {/* ── Step 22: 문의하기 ── */}
        {step === 22 && (
          <Suspense fallback={<PageSpinner />}>
            <InquiryPage />
          </Suspense>
        )}

        {/* ── Step 23: "오늘의 별숨" 상세 페이지 ── */}
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

        {/* ── Step 24: 꿈 해몽 ── */}
        {step === 24 && (
          <Suspense fallback={<PageSpinner />}>
            <DreamPage
              user={user}
              form={form}
              buildCtx={buildCtx}
              callApi={callApi}
              setStep={setStep}
              showToast={showToast}
              onShareCard={handleShareDreamCard}
            />
          </Suspense>
        )}

        {/* ── Step 25: 택일 (길일 찾기) ── */}
        {step === 25 && (
          <Suspense fallback={<PageSpinner />}>
            <TaegillPage
              form={form}
              buildCtx={buildCtx}
              callApi={callApi}
              showToast={showToast}
              onShareCard={handleShareTaegilCard}
            />
          </Suspense>
        )}

        {/* ── Step 26: 이름 풀이 (성명학) ── */}
        {step === 26 && (
          <Suspense fallback={<PageSpinner />}>
            <NameFortunePage
              form={form}
              buildCtx={buildCtx}
              callApi={callApi}
              showToast={showToast}
            />
          </Suspense>
        )}

        {/* ── Step 27: 마이페이지 (store에서 직접 읽음) ── */}
        {step === 27 && (
          <Suspense fallback={<PageSpinner />}>
            <MyPage
              onFreeRecharge={handleFreeRecharge}
              freeRechargeAvailable={freeRechargeAvailable}
              onFreezeStreak={freezeStreak}
            />
          </Suspense>
        )}

        {/* ── Step 28: 나의 별숨 통계 ── */}
        {step === 28 && (
          <Suspense fallback={<PageSpinner />}>
            <StatsPage callApi={callApi} />
          </Suspense>
        )}

        {/* ── Step 29: 별숨 광장 (커뮤니티 피드) ── */}
        {step === 29 && (
          <Suspense fallback={<PageSpinner />}>
            <CommunityPage showToast={showToast} dailyResult={dailyResult} />
          </Suspense>
        )}

        {/* ── Step 30: 나의 대운 흐름 ── */}
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

        {/* ── Step 31: 별숨 숍 ── */}
        {step === 31 && (
          <Suspense fallback={<PageSpinner />}>
            <ShopPage showToast={showToast} />
          </Suspense>
        )}

        {/* ── Step 32: 익명 궁합 광장 ── */}
        {step === 32 && (
          <Suspense fallback={<PageSpinner />}>
            <AnonCompatPage
              showToast={showToast}
              shareData={anonCompatShareData}
            />
          </Suspense>
        )}

        {/* ── Step 33: 특별 상담 (숍 아이템 연결) ── */}
        {step === 33 && (
          <Suspense fallback={<PageSpinner />}>
            <SpecialReadingPage
              callApi={callApi}
              showToast={showToast}
            />
          </Suspense>
        )}

        {/* ── Step 34: 별숨 타로 ── */}
        {step === 34 && (
          <Suspense fallback={<PageSpinner />}>
            <TarotPage callApi={callApi} buildCtx={buildCtx} showToast={showToast} />
          </Suspense>
        )}

        {/* ── Step 35: 별숨편지 ── */}
        {step === 35 && (
          <Suspense fallback={<PageSpinner />}>
            <ByeolsoomLetterPage showToast={showToast} />
          </Suspense>
        )}

        {/* ── Step 36: 연간 종합 리포트 ── */}
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

        {/* ── Step 37: 별숨성장 대시보드 ── */}
        {step === 37 && (
          <Suspense fallback={<PageSpinner />}>
            <GrowthDashboardPage
              onRechargeFreeBP={handleFreeRecharge}
            />
          </Suspense>
        )}

        {/* ── Step 38: 내 아이템 ── */}
        {step === 38 && (
          <Suspense fallback={<PageSpinner />}>
            <ItemInventoryPage showToast={showToast} callApi={callApi} />
          </Suspense>
        )}

        {/* ── Step 39: 로또 번호 뽑기 ── */}
        {step === 39 && (
          <Suspense fallback={<PageSpinner />}>
            <LottoPage />
          </Suspense>
        )}

        {/* ── Step 40: 별숨 뽑기 (가챠) ── */}
        {step === 40 && (
          <Suspense fallback={<PageSpinner />}>
            <GachaPage showToast={showToast} />
          </Suspense>
        )}

        {/* ── Step 41: 월간 리포트 ── */}
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
          ✦ 별숨은 점술 및 오락 목적의 서비스이며, 결과에 대해서는 법적 책임이나 효력을 지지 않습니다.
        </div>
      </div>

      {/* ── 모달들 ── */}
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

      {/* ── 친구 초대 모달 ── */}
      {showInviteModal && (
        <InviteModal
          user={user} showToast={showToast}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* 일기 모달 제거됨 → Step 17 DiaryPage로 이동 */}

      {shareModal.open && (
        <ShareModal
          shareModal={shareModal}
          onClose={() => { setShareModal(s => ({ ...s, open: false })); }}
          showToast={showToast}
          cardDataUrl={cardDataUrl}
        />
      )}

      {/* ── 수호신 레벨업 모달 ── */}
      {guardianLevelUp && (
        <GuardianLevelUpModal
          fromLevel={guardianLevelUp.fromLevel}
          toLevel={guardianLevelUp.toLevel}
          guardianMessage={guardianMessage}
          loading={guardianMsgLoading}
          onClose={() => setGuardianLevelUp(null)}
        />
      )}

      {/* ── 동의 팝업 ── */}
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
