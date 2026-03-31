import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from "react";

// utils
import { OC, OE, ON, ILGAN_POETIC, CGO } from "./utils/saju.js";
import { getSun } from "./utils/astrology.js";
import { getDailyWord, parseAccSummary, CATS, CATS_ALL, PKGS, REVIEWS, CHAT_SUGG, SIGN_MOOD, TIMING, DIARY_PROMPT, ANNIVERSARY_PROMPT, DAILY_QUESTIONS } from "./utils/constants.js";
import { TIME_CONFIG } from "./utils/time.js";
import { saveShareCard, saveProphecyImage, saveCompatImage, saveChatImage } from "./utils/imageExport.js";
import { getTodayStr, isTodayAnswered } from "./utils/quiz.js";

// hooks
import { useUserProfile }   from "./hooks/useUserProfile.js";
import { useSajuContext }   from "./hooks/useSajuContext.js";
import { useConsultation }  from "./hooks/useConsultation.js";

// supabase
import { supabase } from "./lib/supabase.js";

// components
import StarCanvas         from "./components/StarCanvas.jsx";
import DailyStarCard     from "./components/DailyStarCard.jsx";
import SkeletonLoader     from "./components/SkeletonLoader.jsx";
import AccItem, { FeedbackBtn, ChatBubble, ReportBody } from "./components/AccItem.jsx";
import Sidebar            from "./components/Sidebar.jsx";
import SamplePreview      from "./components/SamplePreview.jsx";
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
  // isDark / onboardingDone / quiz 는 useUserProfile에서 관리됨 (아래 userProfile 훅 초기화 후 사용)
  const [showSidebar, setShowSidebar] = useState(false);
  const [shareModal, setShareModal] = useState({ open: false, title: '', text: '' });
  const [toast, setToast] = useState(null);
  const [copyDone, setCopyDone] = useState(false);
  // showDiary/diaryText 제거됨 → Step 17 DiaryPage 사용
  const [diaryQuickContent, setDiaryQuickContent] = useState('');
  const [diaryQuickMood, setDiaryQuickMood] = useState(null);
  const [diaryQuickWeather, setDiaryQuickWeather] = useState('');
  const [diaryQuickEnergy, setDiaryQuickEnergy] = useState(null);
  const [showDailyCard, setShowDailyCard] = useState(false);
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [anniversaryType, setAnniversaryType] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMyProfile, setEditingMyProfile] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({ by: false, bm: false, bd: false });
  const [showAllCats, setShowAllCats] = useState(false);
  const [showSubNudge, setShowSubNudge] = useState(false);
  // quiz는 userProfile.quizState 에서 가져옴 (아래)
  const [quizInput, setQuizInput] = useState('');
  const [profileNudge, setProfileNudge] = useState(null);
  const [refCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref') || null;
  });
  const [groupCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('group') || null;
  });
  const toastTimer = useRef(null);
  const copyTimer = useRef(null);
  const resultsRef = useRef(null);
  const askBtnRef = useRef(null);

  // onboardingDone은 userProfile.onboarded 에서 가져옴 (아래)

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), TIMING.toastDuration);
  }, []);

  // ── 개인화 감지 헬퍼 ──
  function detectProfileHint(msg, prof) {
    if (!prof.workplace && /직장|직업|회사|일하|취업|이직|재직|근무|스타트업|공무원|프리랜서/.test(msg))
      return { label: '직장/직업 정보를 저장해드릴까요?' };
    if (!prof.partner && /연인|남자친구|여자친구|남친|여친|애인|사귀|좋아하는 사람/.test(msg))
      return { label: '연인 정보를 저장해드릴까요?' };
    if (!prof.worryText && /고민|걱정|불안|힘들|스트레스|갈등|막막|어려/.test(msg))
      return { label: '지금 고민을 저장해드릴까요?' };
    return null;
  }

  // ── 커스텀 훅 ──
  const userProfile = useUserProfile();
  const { user, profile, setProfile, form, setForm, otherProfiles, setOtherProfiles, activeProfileIdx, setActiveProfileIdx,
          otherForm, setOtherForm, showProfileModal, setShowProfileModal,
          showOtherProfileModal, setShowOtherProfileModal,
          loginError, setLoginError,
          loginLoading,
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
          deleteHistoryItem } = consultation;

  const curPkg = PKGS.find(p => p.id === pkg) || PKGS[1]; // fallback: premium
  const IS_BETA = true; // 베타 기간 종료 시 false로 변경

  // 첫 번째 답변 완료 시 구독 넛지 표시
  const handleTypingDone = useCallback((idx) => {
    _handleTypingDone(idx);
    if (idx === 0 && (!user || curPkg.id === 'basic') && !IS_BETA) {
      setTimeout(() => setShowSubNudge(true), 800);
    }
  }, [_handleTypingDone, user, curPkg, IS_BETA]);

  // ── 온보딩 완료 ──
  const handleOnboardingFinish = useCallback(() => {
    saveSettings({ onboarded: true });
    setStep(0);
  }, [setStep, saveSettings]);

  // ── 빠른 개인화 입력 저장 ──
  const handleQuizAnswer = useCallback((question, value) => {
    const val = (value || quizInput).trim();
    if (!val) return;
    if (question.field) {
      setProfile(p => ({ ...p, [question.field]: val }));
    } else {
      const note = `${question.q.replace(/[?요]/g, '').trim()} → ${val}`;
      setProfile(p => ({ ...p, selfDesc: p.selfDesc ? p.selfDesc + ' / ' + note : note }));
    }
    const updated = {
      ...quiz,
      answers: { ...quiz.answers, [question.id]: val },
      nextQIdx: Math.min((quiz.nextQIdx || 0) + 1, DAILY_QUESTIONS.length),
      lastAnsweredDate: getTodayStr(),
    };
    saveSettings({ quizState: updated });
    if (user) saveDailyQuizAnswer(user, question.id, val);
    setQuizInput('');
    showToast('별숨이 기억했어요 ✦', 'success');
  }, [quiz, quizInput, setProfile, showToast, user, saveDailyQuizAnswer, saveSettings]);

  // ── 오늘 별숨의 질문 건너뛰기 ──
  const handleQuizSkip = useCallback((currentQIdx) => {
    const updated = {
      ...quiz,
      nextQIdx: Math.min(currentQIdx + 1, DAILY_QUESTIONS.length),
    };
    saveSettings({ quizState: updated });
  }, [quiz, saveSettings]);

  // ── 채팅 전송 (넛지 초기화 포함) ──
  const handleSendChat = useCallback(() => {
    setProfileNudge(null);
    sendChat();
  }, [sendChat]);

  /** 클립보드 복사 + toast + 체크마크 아이콘 피드백 (1.5초) */
  const handleCopyAll = useCallback(() => {
    const text = answers.join('\n\n');
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      showToast('복사됐어요 📋', 'success');
      if (copyTimer.current) clearTimeout(copyTimer.current);
      setCopyDone(true);
      copyTimer.current = setTimeout(() => setCopyDone(false), 1500);
    }).catch(() => showToast('복사에 실패했어요', 'error'));
  }, [answers, showToast]);

  // ── 채팅 중 프로필 감지 넛지 ──
  useEffect(() => {
    if (chatHistory.length < 2) return;
    const last = chatHistory[chatHistory.length - 1];
    const userMsg = chatHistory[chatHistory.length - 2];
    if (last?.role !== 'ai' || userMsg?.role !== 'user') return;
    const hint = detectProfileHint(userMsg.text, profile);
    if (hint) setProfileNudge(hint);
  }, [chatHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── loginError 토스트 표시 ──
  useEffect(() => {
    if (loginError) { showToast(loginError, 'error'); setLoginError(''); }
  }, [loginError, showToast, setLoginError]);

  // ── 초대 코드 저장 (기기별 임시 저장) ──
  useEffect(() => {
    if (refCode) { try { localStorage.setItem('byeolsoom_ref', refCode); } catch {} }
  }, [refCode]);

  useEffect(() => {
    if (groupCode) setStep(11);
  }, [groupCode, setStep]);

  // ── 화면 전환 시 스크롤 맨 위로 ──
  useEffect(() => {
    if (step !== 3) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [step]);

  // ── 결과 자동 스크롤 ──
  useEffect(() => {
    if (step === 4 && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [step]);

  // ── GA4 step 변경 추적 ──
  useEffect(() => {
    if (step === 3) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'step_change', { step });
    if (step === 2 && typeof window.gtag === 'function') window.gtag('event', 'step2_enter');
    if (step === 5 && typeof window.gtag === 'function') window.gtag('event', 'chat_page_enter');
    if (step === 6 && typeof window.gtag === 'function') window.gtag('event', 'report_page_enter');
    if (step === 7 && typeof window.gtag === 'function') window.gtag('event', 'compat_page_enter');
  }, [step]);

  // ── 브라우저 히스토리 동기화 (뒤로가기 UX 개선) ──
  const isPopState = useRef(false);

  // step이 바뀔 때마다 브라우저 히스토리에 push (로딩 step 3은 제외)
  useEffect(() => {
    if (step === 3) return; // 로딩 페이지는 히스토리에 쌓지 않음
    if (isPopState.current) {
      isPopState.current = false;
      return;
    }
    window.history.pushState({ step }, '', window.location.pathname);
  }, [step]);

  // 브라우저 뒤로가기/앞으로가기 이벤트 처리
  useEffect(() => {
    const handlePopState = (e) => {
      const prevStep = e.state?.step ?? 0;
      isPopState.current = true;
      setStep(prevStep);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setStep]);

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

  // ── 이미지 저장 ──
  const shareCard = useCallback((idx) => {
    if (typeof window.gtag === 'function') window.gtag('event', 'image_save');
    const q = selQs[idx] || '';
    const parsedText = parseAccSummary(answers[idx] || '').text;
    saveShareCard({ idx, q, parsedText, isDark, today });
  }, [selQs, answers, isDark, today]);

  const handleSaveProphecyImage = useCallback((type, text, period) => {
    saveProphecyImage({ text, period, isDark, today });
  }, [isDark, today]);

  const handleSaveCompatImage = useCallback((result, myF, partnerF, placeObj, score) => {
    saveCompatImage({ result, myF, partnerF, placeObj, score, isDark });
  }, [isDark]);

  const handleSaveChatImage = useCallback(() => {
    if (typeof window.gtag === 'function') window.gtag('event', 'chat_image_save');
    saveChatImage({ chatHistory, isDark, today });
  }, [chatHistory, isDark, today]);

  // ── 공유 ──
  const shareResult = useCallback((type, text, label = '') => {
    if (typeof window.gtag === 'function') window.gtag('event', 'share', { type });
    const appUrl = window.location.origin;
    let shareText = '';
    if (type === 'prophecy') {
      shareText = `✦ 별숨의 예언 — ${label}\n\n${(text || '').slice(0, 100)}...\n\n나만의 사주+별자리 운세 → ${appUrl}`;
    } else if (type === 'compat') {
      shareText = `✦ 우리가 만나면 — ${label}\n\n${(text || '').slice(0, 100)}\n\n별숨에서 나의 궁합을 봐요 → ${appUrl}`;
    } else {
      const ans = answers[0] ? parseAccSummary(answers[0]).text.slice(0, 100) : '';
      shareText = `✦ 오늘의 별숨\n\n${ans}...\n\n나만의 사주+별자리 운세 → ${appUrl}`;
    }
    if (navigator.share) {
      navigator.share({ title: '별숨 ✦', text: shareText, url: appUrl }).catch(() => {});
    } else {
      setShareModal({ open: true, title: '별숨 ✦', text: shareText });
    }
  }, [answers]);

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
          onClose={() => setShowSidebar(false)}
          onNav={(s, item) => {
            // 출생정보가 필요한 페이지들: formOk 없으면 step 1로
            const needsForm = [2, 5, 6, 7, 8, 10, 12, 13, 14, 16, 17, 18];
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
      {(step === 10 || step === 11 || step === 12 || step === 13 || step === 14 || step === 16 || step === 17 || step === 18 || step === 19) && <button className="back-btn" aria-label="홈으로 돌아가기" onClick={() => setStep(0)}>←</button>}
      {step === 15 && <button className="back-btn" aria-label="이전으로" onClick={() => setStep(1)}>←</button>}
      {step > 0 && <button className="home-btn" aria-label="홈으로" onClick={() => setStep(0)}>🏠</button>}

      <div className="app" id="main-content">

        {/* ── Step 0: 랜딩 ── */}
        {step === 0 && (
          <LandingPage
            user={user} form={form} saju={saju} sun={sun} today={today}
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
            <SajuCalendar form={form} setStep={setStep} askQuick={askQuick} user={user} callApi={callApi} />
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
              diaryReviewResult={diaryReviewResult}
              diaryReviewLoading={diaryReviewLoading}
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
        <div className="upgrade-modal-bg" role="dialog" aria-modal="true" onClick={() => setShowUpgradeModal(false)}>
          <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>✦</div>
            <div className="upgrade-modal-title">더 많이 물어보고 싶어요?</div>
            <div className="upgrade-modal-sub">첫 번째 이야기가 마음에 들었다면<br />더 깊이 대화할 수 있어요</div>
            <div className="upgrade-pkgs">
              {PKGS.filter(p => !p.isFree).map(p => (
                <div key={p.id} className={`upgrade-pkg ${pkg === p.id ? 'chosen' : ''}`} onClick={() => setPkg(p.id)}>
                  {p.hot && <div className="upgrade-pkg-hot">BEST</div>}
                  <div className="upgrade-pkg-e">{p.e}</div>
                  <div className="upgrade-pkg-n">{p.n}</div>
                  <div className="upgrade-pkg-p">{p.p}</div>
                  <div className="upgrade-pkg-q">질문 {p.q}개 · 채팅 {p.chat}회</div>
                </div>
              ))}
            </div>
            <button className="btn-main" onClick={() => { setShowUpgradeModal(false); setStep(5); }}>이 이용권으로 계속 대화하기 ✦</button>
            <button style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', marginTop: 8 }} onClick={() => setShowUpgradeModal(false)}>괜찮아요, 나중에 할게요</button>
          </div>
        </div>
      )}

      {showOtherProfileModal && (
        <div className="other-modal-bg" role="dialog" aria-modal="true" onClick={() => setShowOtherProfileModal(false)}>
          <div className="other-modal" onClick={e => e.stopPropagation()}>
            <div className="other-modal-title">{editingOtherIdx !== null ? '다른 사람 정보 수정' : '다른 사람의 별숨 추가'}</div>
            <div className="other-modal-sub">{editingOtherIdx !== null ? '저장된 정보를 수정해요' : '가족, 친구, 연인의 생년월일을 입력하면\n그 사람의 별숨을 대신 물어볼 수 있어요'}</div>

            <label className="lbl" htmlFor="other-name">이름</label>
            <input id="other-name" className="inp" placeholder="누구의 별숨인가요?" value={otherForm.name} onChange={e => setOtherForm(f => ({ ...f, name: e.target.value }))} />

            <fieldset style={{border:'none',padding:0,margin:0}}>
              <legend className="lbl">생년월일</legend>
              <div className="row" style={{ marginBottom: 'var(--sp2)' }}>
                <div className="col"><input className="inp" placeholder="1998" inputMode="numeric" aria-label="출생 연도" value={otherForm.by} onChange={e => setOtherForm(f => ({ ...f, by: e.target.value.replace(/\D/, '').slice(0, 4) }))} style={{ marginBottom: 0 }} /></div>
                <div className="col"><select className="inp" aria-label="출생 월" value={otherForm.bm} onChange={e => setOtherForm(f => ({ ...f, bm: e.target.value }))} style={{ marginBottom: 0 }}><option value="">월</option>{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}</select></div>
                <div className="col"><select className="inp" aria-label="출생 일" value={otherForm.bd} onChange={e => setOtherForm(f => ({ ...f, bd: e.target.value }))} style={{ marginBottom: 0 }}><option value="">일</option>{[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}일</option>)}</select></div>
              </div>
            </fieldset>
            <div className="toggle-row" onClick={() => setOtherForm(f => ({ ...f, noTime: !f.noTime, bh: '' }))}>
              <button className={`toggle ${otherForm.noTime ? 'on' : 'off'}`} role="switch" aria-checked={otherForm.noTime} aria-label="태어난 시간 모름" onClick={e => { e.stopPropagation(); setOtherForm(f => ({ ...f, noTime: !f.noTime, bh: '' })); }} />
              <span className="toggle-label">태어난 시간을 몰라요</span>
            </div>
            {!otherForm.noTime && (
              <select className="inp" aria-label="태어난 시각" value={otherForm.bh} onChange={e => setOtherForm(f => ({ ...f, bh: e.target.value }))}>
                <option value="">태어난 시각 (선택)</option>
                {Array.from({ length: 144 }, (_, i) => { const h = Math.floor(i / 6); const m = (i % 6) * 10; const val = (h + m / 60).toFixed(4); return <option key={i} value={val}>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</option>; })}
              </select>
            )}
            <fieldset style={{border:'none',padding:0,margin:0}}>
              <legend className="lbl">성별</legend>
              <div className="gender-group" role="group" aria-label="성별 선택">
                {['여성', '남성', '기타'].map(g => (
                  <button key={g} className={`gbtn ${otherForm.gender === g ? 'on' : ''}`} aria-pressed={otherForm.gender === g} onClick={() => setOtherForm(f => ({ ...f, gender: g }))}>{g}</button>
                ))}
              </div>
            </fieldset>
            <button className="btn-main"
              disabled={!otherForm.by || !otherForm.bm || !otherForm.bd || !otherForm.gender}
              onClick={saveOtherProfile}>
              {editingOtherIdx !== null ? '수정하기 ✦' : '추가하기 ✦'}
            </button>
            <button style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', marginTop: 6 }} onClick={() => { setShowOtherProfileModal(false); setEditingOtherIdx(null); }}>취소</button>
          </div>
        </div>
      )}

      {/* ── 친구 초대 모달 ── */}
      {showInviteModal && (
        <div className="upgrade-modal-bg" role="dialog" aria-modal="true" onClick={() => setShowInviteModal(false)}>
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
                    setShowInviteModal(false);
                  });
                }}>📋 초대 링크 복사하기</button>
                {navigator.share && (
                  <button className="btn-main" style={{ background: 'var(--bg3)', color: 'var(--t1)', marginTop: 8 }} onClick={() => {
                    navigator.share({
                      title: '별숨 — 사주+별자리 운세',
                      text: '사주와 별자리로 당신의 질문에 답해드려요. 저의 초대 링크로 시작해봐요 ✦',
                      url: `${window.location.origin}?ref=${user.id}`
                    }).catch(() => {});
                    setShowInviteModal(false);
                  }}>✦ 공유하기</button>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 'var(--sm)', padding: 'var(--sp3) 0' }}>
                카카오 로그인 후 초대 링크를 만들 수 있어요
              </div>
            )}
            <button style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', marginTop: 6 }} onClick={() => setShowInviteModal(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* 일기 모달 제거됨 → Step 17 DiaryPage로 이동 */}

      {shareModal.open && (
        <div className="upgrade-modal-bg" role="dialog" aria-modal="true" onClick={() => setShareModal(s => ({ ...s, open: false }))}>
          <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>✦</div>
            <div className="upgrade-modal-title">공유하기</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', textAlign: 'center', marginBottom: 'var(--sp3)', lineHeight: 1.8 }}>별숨의 결과를 친구들에게 공유해보세요</div>
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 'var(--sp2)', fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.75, marginBottom: 'var(--sp3)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {shareModal.text}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-main" onClick={() => { navigator.clipboard?.writeText(shareModal.text).then(() => { alert('복사됐어요! 친구에게 붙여넣기 해주세요 💌'); }); setShareModal(s => ({ ...s, open: false })); }}>📋 텍스트 복사하기</button>
              <button className="btn-main" style={{ background: 'var(--bg3)', color: 'var(--t1)' }} onClick={() => { navigator.clipboard?.writeText(window.location.origin).then(() => { alert('별숨 링크가 복사됐어요! 친구에게 공유해주세요 ✦'); }); setShareModal(s => ({ ...s, open: false })); }}>🔗 별숨 링크 공유하기</button>
              <button style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }} onClick={() => setShareModal(s => ({ ...s, open: false }))}>닫기</button>
            </div>
          </div>
        </div>
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
