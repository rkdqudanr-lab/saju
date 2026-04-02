import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";

// utils
import { PKGS, TIMING, ANNIVERSARY_PROMPT } from "./utils/constants.js";

// hooks
import { useUserProfile }   from "./hooks/useUserProfile.js";
import { useSajuContext }   from "./hooks/useSajuContext.js";
import { useConsultation }  from "./hooks/useConsultation.js";
import { useNavigation }    from "./hooks/useNavigation.js";
import { useAppHandlers }   from "./hooks/useAppHandlers.js";

// supabase
import { supabase, getAuthenticatedClient } from "./lib/supabase.js";

// analysis cache
import { loadAnalysisCache, saveAnalysisCache } from "./lib/analysisCache.js";

// components
import StarCanvas         from "./components/StarCanvas.jsx";
import SkeletonLoader     from "./components/SkeletonLoader.jsx";
import Sidebar            from "./components/Sidebar.jsx";
import PWAInstallBanner   from "./components/PWAInstallBanner.jsx";

const ProfileModal       = lazy(() => import("./components/ProfileModal.jsx"));
const HistoryPage        = lazy(() => import("./components/HistoryPage.jsx"));
const FutureProphecyPage = lazy(() => import("./components/FutureProphecyPage.jsx"));
const CompatPage         = lazy(() => import("./components/CompatPage.jsx"));
const SajuCalendar       = lazy(() => import("./components/SajuCalendar.jsx"));
const GroupBulseumPage   = lazy(() => import("./components/GroupBulseumPage.jsx"));
const AnniversaryPage          = lazy(() => import("./components/AnniversaryPage.jsx"));
const NatalInterpretationPage  = lazy(() => import("./components/NatalInterpretationPage.jsx"));
const ComprehensivePage        = lazy(() => import("./components/ComprehensivePage.jsx"));
const AstrologyPage            = lazy(() => import("./components/AstrologyPage.jsx"));
const OnboardingCards          = lazy(() => import("./components/OnboardingCards.jsx"));
const ConsentModal             = lazy(() => import("./components/ConsentModal.jsx"));
const DiaryPage                = lazy(() => import("./components/DiaryPage.jsx"));
const DiaryListPage            = lazy(() => import("./components/DiaryListPage.jsx"));

// modal components
import UpgradeModal        from "./components/UpgradeModal.jsx";
import OtherProfileModal   from "./components/OtherProfileModal.jsx";
import InviteModal         from "./components/InviteModal.jsx";
import ShareModal          from "./components/ShareModal.jsx";

// pages
import ReportStep          from "./pages/ReportStep.jsx";
import DailyHoroscopePage  from "./pages/DailyHoroscopePage.jsx";
import ChatStep            from "./pages/ChatStep.jsx";
import ResultsStep         from "./pages/ResultsStep.jsx";
import QuestionStep        from "./pages/QuestionStep.jsx";
import ProfileStep         from "./pages/ProfileStep.jsx";
import LandingPage         from "./pages/LandingPage.jsx";
const SettingsPage             = lazy(() => import("./components/SettingsPage.jsx"));

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
  const [shareModal, setShareModal] = useState({ open: false, title: '', text: '' });
  const [toast, setToast] = useState(null);
  const [showDailyCard, setShowDailyCard] = useState(false);
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [anniversaryType, setAnniversaryType] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMyProfile, setEditingMyProfile] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({ by: false, bm: false, bd: false });
  const [showAllCats, setShowAllCats] = useState(false);
  const [quizInput, setQuizInput] = useState('');
  const [sidebarPrefs, setSidebarPrefs] = useState({ hiddenGroups: [] });
  const [todayDiaryWritten, setTodayDiaryWritten] = useState(null); // null=미확인, true/false
  const [diaryViewDate, setDiaryViewDate] = useState(null); // null=오늘, 'YYYY-MM-DD'=특정 날짜
  const toastTimer = useRef(null);
  const resultsRef = useRef(null);
  const askBtnRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), TIMING.toastDuration);
  }, []);

  // ── 커스텀 훅 ──
  const userProfile = useUserProfile();
  const { user, profile, setProfile, form, setForm, otherProfiles, setOtherProfiles, activeProfileIdx, setActiveProfileIdx,
          otherForm, setOtherForm, showProfileModal, setShowProfileModal,
          showOtherProfileModal, setShowOtherProfileModal,
          loginError, setLoginError,
          loginLoading, profileSyncing,
          kakaoLogin, kakaoLogout, saveOtherProfile,
          editingOtherIdx, setEditingOtherIdx, startEditOtherProfile,
          showConsentModal, consentFlags, setConsentFlags, handleConsentConfirm,
          saveProfileToSupabase, saveUserProfileExtra, saveDailyQuizAnswer,
          responseStyle, theme, onboarded, quizState, saveSettings } = userProfile;

  // isDark / onboardingDone / quiz → userProfile에서 파생
  const isDark          = theme === 'dark';
  const onboardingDone  = onboarded;
  const quiz            = quizState;

  const sajuCtx = useSajuContext(form, profile, activeProfileIdx, otherProfiles);
  const { today, saju, sun, moon, asc, age, formOk, activeForm, activeSaju, activeSun, activeAge, buildCtx } = sajuCtx;

  const consultation = useConsultation(buildCtx, formOk, user, consentFlags, responseStyle, kakaoLogin, undefined, showToast);
  const { timeSlot, loadingMsgIdx, step, setStep, cat, setCat, selQs, setSelQs, diy, setDiy, pkg, setPkg,
          answers, openAcc, typedSet, chatHistory, chatInput, setChatInput, chatLoading,
          latestChatIdx, chatLeft, maxQ, reportText, reportLoading, histItem, setHistItem,
          histItems, setHistItems, showUpgradeModal, setShowUpgradeModal, chatEndRef,
          qLoadStatus,
          dailyResult, dailyLoading, dailyCount, DAILY_MAX,
          diaryReviewResult, diaryReviewLoading,
          addQ, rmQ, askClaude, askQuick, askDailyHoroscope, askReview, askDiaryReview, resetDiaryReview, handleTypingDone: _handleTypingDone, handleAccToggle,
          retryAnswer, sendChat, genReport, callApi, retryMsg, resetSession,
          deleteHistoryItem, deleteAllHistoryItems } = consultation;

  const curPkg = PKGS.find(p => p.id === pkg) || PKGS[1]; // fallback: premium

  const { refCode, groupCode } = useNavigation({ step, setStep, resultsRef, showToast, loginError, setLoginError });

  const {
    copyDone, profileNudge, setProfileNudge, showSubNudge,
    handleTypingDone, handleOnboardingFinish, handleQuizAnswer, handleQuizSkip,
    handleSendChat, handleCopyAll, shareCard,
    handleSaveProphecyImage, handleSaveCompatImage, handleSaveChatImage, shareResult,
  } = useAppHandlers({
    answers, selQs, chatHistory, quiz, quizInput, setQuizInput,
    profile, setProfile, user, saveDailyQuizAnswer, saveSettings,
    sendChat, _handleTypingDone, curPkg, isDark, today,
    setShareModal, showToast, setStep,
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
  const toggleDark = useCallback(() => {
    saveSettings({ theme: isDark ? 'light' : 'dark' });
  }, [isDark, saveSettings]);

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
      import('./components/AstrologyPage.jsx').catch(() => {});
      import('./components/DiaryPage.jsx').catch(() => {});
      import('./components/DiaryListPage.jsx').catch(() => {});
      import('./components/HistoryPage.jsx').catch(() => {});
      import('./components/SettingsPage.jsx').catch(() => {});
      import('./components/ProfileModal.jsx').catch(() => {});
      import('./components/OnboardingCards.jsx').catch(() => {});
      import('./components/ConsentModal.jsx').catch(() => {});
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

  // ── 오늘 일기 작성 여부 확인 ──
  useEffect(() => {
    if (!user?.id) { setTodayDiaryWritten(null); return; }
    const client = getAuthenticatedClient(user.id) || supabase;
    if (!client) return;
    const today = new Date().toISOString().slice(0, 10);
    client.from('diary_entries').select('id').eq('kakao_id', String(user.id)).eq('date', today).maybeSingle()
      .then(({ data }) => setTodayDiaryWritten(!!data)).catch(() => {});
  }, [user?.id]);

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

      {/* ── 토스트 알림 ── */}
      {toast && (
        <div role="alert" aria-live="assertive" className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <button className="menu-btn" onClick={() => setShowSidebar(true)} aria-label="메뉴 열기" aria-expanded={showSidebar}>☰</button>

      {showSidebar && (
        <Sidebar
          user={user} step={step}
          histItems={histItems}
          onClose={() => setShowSidebar(false)}
          onNav={(s, item) => {
            // 출생정보가 필요한 페이지들: formOk 없으면 step 1로
            const needsForm = [2, 5, 6, 7, 8, 10, 12, 13, 14, 16, 17, 18, 20];
            if (s === 'history' && item) { setHistItem(item); setStep(9); }
            else if (s === 'fortune') { formOk ? setStep(18) : setStep(1); }
            else if (s === 1 && formOk && otherProfiles.length === 0) { setSelQs([]); setStep(2); }
            else if (typeof s === 'number' && needsForm.includes(s) && !formOk) { setStep(1); }
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
          {user.profileImage ? <img src={user.profileImage} alt="프로필" /> : <span style={{ fontSize: '1rem' }}>🌙</span>}
          <span>{user.nickname}</span>
        </div>
      )}
      {step >= 1 && !user && (
        <button className="user-chip" onClick={() => { if (typeof window.gtag === 'function') window.gtag('event', 'kakao_login_click'); kakaoLogin(); }} style={{ border: '1px solid #FEE500', background: 'rgba(254,229,0,.1)' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--t2)' }}>카카오 로그인</span>
        </button>
      )}

      {step > 0 && step < 5 && step !== 9 && <button className="back-btn" aria-label="이전 단계로" onClick={() => setStep(p => p === 4 ? 2 : Math.max(0, p - 1))}>←</button>}
      {(step === 5 || step === 6 || step === 7 || step === 8) && <button className="back-btn" aria-label="결과로 돌아가기" onClick={() => setStep(4)}>←</button>}
      {step === 9 && <button className="back-btn" aria-label="홈으로 돌아가기" onClick={() => { setHistItem(null); setStep(0); }}>←</button>}
      {(step === 10 || step === 11 || step === 12 || step === 13 || step === 14 || step === 16 || step === 17 || step === 18 || step === 19 || step === 20) && <button className="back-btn" aria-label="홈으로 돌아가기" onClick={() => setStep(0)}>←</button>}
      {step === 15 && <button className="back-btn" aria-label="이전으로" onClick={() => setStep(1)}>←</button>}
      {step > 0 && <button className="home-btn" aria-label="홈으로" onClick={() => setStep(0)}>🏠</button>}

      <div className="app" id="main-content">

        {/* ── Step 0: 랜딩 ── */}
        {step === 0 && (
          <LandingPage
            user={user} form={form} saju={saju} sun={sun} today={today}
            otherProfiles={otherProfiles}
            formOk={formOk} profile={profile}
            quiz={quiz} quizInput={quizInput} setQuizInput={setQuizInput}
            dailyResult={dailyResult} dailyLoading={dailyLoading}
            dailyCount={dailyCount} DAILY_MAX={DAILY_MAX}
            diaryReviewResult={diaryReviewResult} diaryReviewLoading={diaryReviewLoading}
            showDailyCard={showDailyCard} setShowDailyCard={setShowDailyCard}
            buildCtx={buildCtx}
            setStep={setStep} setDiy={setDiy}
            kakaoLogin={kakaoLogin} kakaoLogout={kakaoLogout}
            setEditingMyProfile={setEditingMyProfile} setShowProfileModal={setShowProfileModal}
            askDailyHoroscope={askDailyHoroscope} askDiaryReview={askDiaryReview}
            resetDiaryReview={resetDiaryReview}
            handleQuizAnswer={handleQuizAnswer} handleQuizSkip={handleQuizSkip}
            showToast={showToast}
            DiaryPageLazy={DiaryPage}
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
            form={form} saju={saju} sun={sun} moon={moon} asc={asc} today={today}
            selQs={selQs} answers={answers} openAcc={openAcc} typedSet={typedSet}
            cat={cat} pkg={pkg}
            chatLeft={chatLeft} curPkg={curPkg}
            showSubNudge={showSubNudge}
            user={user} copyDone={copyDone}
            formOk={formOk} resultsRef={resultsRef}
            handleAccToggle={handleAccToggle} handleTypingDone={handleTypingDone} retryAnswer={retryAnswer}
            shareCard={shareCard} handleCopyAll={handleCopyAll} shareResult={shareResult}
            setStep={setStep} setSelQs={setSelQs} setDiy={setDiy}
            setShowSidebar={setShowSidebar} setShowUpgradeModal={setShowUpgradeModal}
            kakaoLogin={kakaoLogin} genReport={genReport} resetSession={resetSession}
            showToast={showToast}
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
          />
        )}

        {/* ── Step 6: 월간 리포트 ── */}
        {step === 6 && (
          <ReportStep
            form={form} today={today}
            reportText={reportText} reportLoading={reportLoading}
            genReport={genReport} shareCard={shareCard} shareResult={shareResult}
          />
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

        {/* ── Step 14: 별숨의 종합 사주 ── */}
        {step === 14 && (
          <Suspense fallback={<PageSpinner />}>
            <ComprehensivePage
              saju={saju}
              sun={sun}
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

        {/* ── Step 16: 별숨의 종합 점성술 ── */}
        {step === 16 && (
          <Suspense fallback={<PageSpinner />}>
            <AstrologyPage
              sun={sun}
              moon={moon}
              asc={asc}
              form={form}
              buildCtx={buildCtx}
              user={user}
            />
          </Suspense>
        )}

        {/* ── Step 17: 나의 하루를 별숨에게 (일기) ── */}
        {step === 17 && (
          <Suspense fallback={<PageSpinner />}>
            <DiaryPage
              user={user}
              form={form}
              saju={saju}
              sun={sun}
              buildCtx={buildCtx}
              askReview={askDiaryReview}
              setStep={setStep}
              viewDate={diaryViewDate}
              diaryReviewResult={diaryReviewResult}
              diaryReviewLoading={diaryReviewLoading}
              showToast={showToast}
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
          onClose={() => setShareModal(s => ({ ...s, open: false }))}
          showToast={showToast}
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
