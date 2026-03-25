import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from "react";

// utils
import { OC, OE, ON, ILGAN_POETIC, CGO } from "./utils/saju.js";
import { getSun } from "./utils/astrology.js";
import { getDailyWord, parseAccSummary, CATS, CATS_ALL, PKGS, REVIEWS, CHAT_SUGG, SIGN_MOOD, TIMING, DIARY_PROMPT, ANNIVERSARY_PROMPT, DAILY_QUESTIONS } from "./utils/constants.js";
import { TIME_CONFIG } from "./utils/time.js";
import { loadHistory, deleteHistory } from "./utils/history.js";
import { saveShareCard, saveProphecyImage, saveCompatImage } from "./utils/imageExport.js";
import { loadQuiz, saveQuiz, getTodayStr, isTodayAnswered } from "./utils/quiz.js";

// hooks
import { useUserProfile }   from "./hooks/useUserProfile.js";
import { useSajuContext }   from "./hooks/useSajuContext.js";
import { useConsultation }  from "./hooks/useConsultation.js";

// styles
import CSS from "./styles/theme.js";

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
const RadarChart         = lazy(() => import("./components/RadarChart.jsx"));
const AnniversaryPage          = lazy(() => import("./components/AnniversaryPage.jsx"));
const NatalInterpretationPage  = lazy(() => import("./components/NatalInterpretationPage.jsx"));
const ComprehensivePage        = lazy(() => import("./components/ComprehensivePage.jsx"));
const OnboardingCards          = lazy(() => import("./components/OnboardingCards.jsx"));

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
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('byeolsoom_theme');
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [shareModal, setShareModal] = useState({ open: false, title: '', text: '' });
  const [toast, setToast] = useState(null);
  const [copyDone, setCopyDone] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [diaryText, setDiaryText] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [anniversaryType, setAnniversaryType] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMyProfile, setEditingMyProfile] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({ by: false, bm: false, bd: false });
  const [showAllCats, setShowAllCats] = useState(false);
  const [showSubNudge, setShowSubNudge] = useState(false);
  const [quiz, setQuiz] = useState(() => loadQuiz());
  const [quizInput, setQuizInput] = useState('');
  const [profileNudge, setProfileNudge] = useState(null);
  const [refCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref') || null;
  });
  const toastTimer = useRef(null);
  const copyTimer = useRef(null);
  const resultsRef = useRef(null);
  const askBtnRef = useRef(null);

  // ── 온보딩 카드 상태 ──
  const [onboardingDone, setOnboardingDone] = useState(() => localStorage.getItem('byeolsoom_onboarded') === '1');

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
          kakaoLogin, kakaoLogout, saveOtherProfile,
          editingOtherIdx, setEditingOtherIdx, startEditOtherProfile } = userProfile;

  const sajuCtx = useSajuContext(form, profile, activeProfileIdx, otherProfiles);
  const { today, saju, sun, moon, asc, age, formOk, activeForm, activeSaju, activeSun, activeAge, buildCtx } = sajuCtx;

  const consultation = useConsultation(buildCtx, formOk);
  const { timeSlot, loadingMsgIdx, step, setStep, cat, setCat, selQs, setSelQs, diy, setDiy, pkg, setPkg,
          answers, openAcc, typedSet, chatHistory, chatInput, setChatInput, chatLoading,
          latestChatIdx, chatLeft, maxQ, reportText, reportLoading, histItem, setHistItem,
          histItems, setHistItems, showUpgradeModal, setShowUpgradeModal, chatEndRef,
          qLoadStatus,
          dailyResult, dailyLoading,
          addQ, rmQ, askClaude, askQuick, askDailyHoroscope, askReview, handleTypingDone: _handleTypingDone, handleAccToggle,
          retryAnswer, sendChat, genReport, callApi, resetSession } = consultation;

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
    localStorage.setItem('byeolsoom_onboarded', '1');
    setOnboardingDone(true);
    setStep(0);
  }, [setStep]);

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
      nextQIdx: Math.min((quiz.nextQIdx || 0) + 1, DAILY_QUESTIONS.length - 1),
      lastAnsweredDate: getTodayStr(),
    };
    setQuiz(updated);
    saveQuiz(updated);
    setQuizInput('');
    showToast('별숨이 기억했어요 ✦', 'success');
  }, [quiz, quizInput, setProfile, showToast]);

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

  // ── 초대 코드 저장 ──
  useEffect(() => {
    if (refCode) localStorage.setItem('byeolsoom_ref', refCode);
  }, [refCode]);

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

  // ── 재방문 사용자 자동 오늘의 별숨 로딩 ──
  useEffect(() => {
    if (
      step === 0 &&
      user &&
      form.by &&
      form.bm &&
      form.bd &&
      !dailyResult &&
      !dailyLoading
    ) {
      askDailyHoroscope();
    }
  }, [user?.id, form.by, form.bm, form.bd, step]); // askDailyHoroscope 레퍼런스 제외 (무한루프 방지)

  // ── 테마 ──
  useEffect(() => { document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); }, [isDark]);
  const toggleDark = () => {
    setIsDark(p => {
      const next = !p;
      localStorage.setItem('byeolsoom_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // ── 이미지 저장 ──
  const shareCard = useCallback((idx) => {
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

  // ── 공유 ──
  const shareResult = useCallback((type, text, label = '') => {
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

  return (
    <>
      <style>{CSS}</style>
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
            if (s === 'history' && item) { setHistItem(item); setStep(9); }
            else { setStep(s); }
          }}
          onKakaoLogin={kakaoLogin}
          onKakaoLogout={kakaoLogout}
          onProfileOpen={() => setShowProfileModal(true)}
          onInvite={() => setShowInviteModal(true)}
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
        <button className="user-chip" onClick={kakaoLogin} style={{ border: '1px solid #FEE500', background: 'rgba(254,229,0,.1)' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--t2)' }}>카카오 로그인</span>
        </button>
      )}

      {step > 0 && step < 5 && step !== 9 && <button className="back-btn" aria-label="이전 단계로" onClick={() => setStep(p => p === 4 ? 2 : Math.max(0, p - 1))}>←</button>}
      {(step === 5 || step === 6 || step === 7 || step === 8) && <button className="back-btn" aria-label="결과로 돌아가기" onClick={() => setStep(4)}>←</button>}
      {step === 9 && <button className="back-btn" aria-label="홈으로 돌아가기" onClick={() => { setHistItem(null); setStep(0); }}>←</button>}
      {(step === 10 || step === 11 || step === 12 || step === 13 || step === 14) && <button className="back-btn" aria-label="홈으로 돌아가기" onClick={() => setStep(0)}>←</button>}
      {step === 15 && <button className="back-btn" aria-label="이전으로" onClick={() => setStep(1)}>←</button>}

      <div className="app" id="main-content">

        {/* ── Step 0: 랜딩 ── */}
        {step === 0 && (
          <div className="page step-fade">
            <div className="land-hero">
              <div className="land-wordmark">byeolsoom</div>
              <div className="land-orb">
                <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
              </div>
              <p className="land-copy" style={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
                당신의 별숨은 당신을 바라보고 있어요.
              </p>
              <p className="land-beta-notice">
                지금 별숨은 베타 테스트 중으로, 무료로 이용할 수 있어요.
              </p>

              <div className="land-login-section">
                {user ? (
                  <div className="land-login-card logged">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      {user.profileImage
                        ? <img className="llc-avatar" src={user.profileImage} alt="프로필" />
                        : <div className="llc-avatar-placeholder">🌙</div>}
                      <div style={{ flex: 1 }}>
                        <div className="llc-name">{user.nickname} <span style={{ color: 'var(--gold)' }}>✦</span></div>
                        <div className="llc-sub">
                          {form.by && saju
                            ? saju.ilganPoetic
                              ? `${saju.ilganPoetic} · ${ON[saju.dom]} 기운`
                              : `${ON[saju.dom]} 기운 · ${sun?.n || ''}`
                            : '별숨이 당신을 기억해요'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditingMyProfile(true); setStep(1); }} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>수정</button>
                        <button onClick={kakaoLogout} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>로그아웃</button>
                      </div>
                    </div>
                    {form.by ? (
                      <>
                        {/* ── 오늘의 한마디 ── */}
                        <div style={{ padding: '10px 0 6px', borderBottom: '1px solid var(--line)', marginBottom: 10 }}>
                          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 4, letterSpacing: '.06em' }}>✦ {today.month}월 {today.day}일의 별 메시지</div>
                          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.75 }}>"{getDailyWord(today.day)}"</div>
                        </div>

                        {/* ── 나의 사주 원국 (고정, 변하지 않는 기운) ── */}
                        {saju && (
                          <div className="pillars-wrap" style={{ marginBottom: 4 }}>
                            <div className="pillars-hint">
                              <span style={{ color: 'var(--gold)' }}>✦</span>
                              나의 사주 원국 · 변하지 않는 기운
                            </div>
                            <div className="pillars">
                              {[['연', 'yeon'], ['월', 'wol'], ['일', 'il'], ['시', 'si']].map(([l, k]) => (
                                <div key={l} className="pillar">
                                  <div className="p-lbl">{l}주</div>
                                  <div className="p-hj">{saju[k].gh}</div>
                                  <div className="p-hj">{saju[k].jh}</div>
                                  <div className="p-kr">{saju[k].g}{saju[k].j}</div>
                                </div>
                              ))}
                            </div>
                            <div className="oh-bar">
                              {Object.entries(saju.or).map(([k, v]) => v > 0 && <div key={k} className="oh-seg" style={{ flex: v, background: OC[k] }} />)}
                            </div>
                            <div className="oh-tags">
                              {Object.entries(saju.or).map(([k, v]) => v > 0 && (
                                <span key={k} className="oh-tag" style={{ background: `${OC[k]}18`, color: OC[k], border: `1px solid ${OC[k]}28` }}>{OE[k]} {ON[k]} {v}</span>
                              ))}
                            </div>
                            {sun && (
                              <div className="astro-preview" style={{ marginTop: 8 }}>
                                <div className="a-chip">{sun.s} {sun.n}</div>
                                {moon && <div className="a-chip">🌙 달 {moon.n}</div>}
                                {asc && <div className="a-chip">↑ 상승 {asc.n}</div>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── 구분선 ── */}
                        <div style={{ height: 1, background: 'var(--line)', margin: '2px 0' }} />

                        {/* ── 오늘의 기운 (매일 변함) ── */}
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em', paddingTop: 2 }}>
                          ✦ 오늘의 기운 · {today.month}월 {today.day}일
                          <span style={{ marginLeft: 6, opacity: 0.6 }}>매일 새로워져요</span>
                        </div>
                        {dailyResult ? (
                          <DailyStarCard result={dailyResult} />
                        ) : dailyLoading ? (
                          <div className="dsc-loading-btn">
                            <span>별숨이 오늘을 읽고 있어요</span>
                            <span className="dsc-loading-dot" />
                            <span className="dsc-loading-dot" />
                            <span className="dsc-loading-dot" />
                          </div>
                        ) : (
                          <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px' }} onClick={askDailyHoroscope}>
                            오늘 기운 확인하기 ✦
                          </button>
                        )}
                        <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={() => setStep(formOk ? 2 : 1)}>
                          별숨에게 질문하기 ✦
                        </button>
                        {/* ── 오늘의 추천 질문 ── */}
                        {formOk && (() => {
                          const allQs = CATS_ALL.flatMap(c => c.qs.map(q => ({ q, icon: c.icon, label: c.label })));
                          const recQ = allQs[(today.day - 1) % allQs.length];
                          return recQ ? (
                            <button
                              onClick={() => { setDiy(recQ.q); setStep(2); }}
                              style={{ width: '100%', marginTop: 8, background: 'none', border: '1px dashed var(--line)', borderRadius: 'var(--r1)', padding: '10px 14px', color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', textAlign: 'left', lineHeight: 1.6 }}
                            >
                              <span style={{ color: 'var(--gold)', marginRight: 4 }}>{recQ.icon} 오늘의 추천질문</span><br />"{recQ.q}"
                            </button>
                          ) : null;
                        })()}
                        {formOk && saju && (
                          <>
                            <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid var(--line)', color: 'var(--t2)' }} onClick={() => setStep(13)}>
                              나의 원국 해설 보기 ✦
                            </button>
                            <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid rgba(180,140,50,0.5)', color: 'var(--gold)' }} onClick={() => setStep(14)}>
                              별숨의 종합 사주 풀어보기 ✦
                            </button>
                          </>
                        )}
                        <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid var(--line)', color: 'var(--t2)' }} onClick={() => setShowDiary(true)}>
                          오늘 있었던 일 적기 ✦
                        </button>

                        {/* ── 하루 한 질문 카드 ── */}
                        {(() => {
                          const qIdx = quiz.nextQIdx || 0;
                          const todayDone = isTodayAnswered(quiz);
                          const allDone = qIdx >= DAILY_QUESTIONS.length;
                          const q = DAILY_QUESTIONS[Math.min(qIdx, DAILY_QUESTIONS.length - 1)];
                          const answeredCount = Object.keys(quiz.answers || {}).length;
                          // 오늘 완료 시: 방금 답한 질문 (nextQIdx - 1)
                          const lastAnsweredQ = DAILY_QUESTIONS[qIdx > 0 ? qIdx - 1 : 0];
                          const lastAnsweredVal = lastAnsweredQ ? quiz.answers[lastAnsweredQ.id] : null;

                          return (
                            <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', border: '1px solid var(--line)' }}>
                              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
                                ✦ 오늘 별숨의 질문 {answeredCount > 0 && <span style={{ fontWeight: 400, color: 'var(--t4)', marginLeft: 6 }}>{answeredCount}개 답했어요</span>}
                              </div>

                              {allDone ? (
                                <>
                                  <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7, marginBottom: 10 }}>
                                    별숨이 당신을 잘 알게 됐어요 🌟<br/>
                                    <span style={{ color: 'var(--t4)', fontSize: 'var(--xs)' }}>{DAILY_QUESTIONS.length}개의 이야기를 모두 들었어요</span>
                                  </div>
                                  <button onClick={() => setShowProfileModal(true)} style={{ fontSize: 'var(--xs)', color: 'var(--gold)', background: 'none', border: 'none', fontFamily: 'var(--ff)', cursor: 'pointer', padding: 0 }}>
                                    별숨에게 나를 알려주기 →
                                  </button>
                                </>
                              ) : todayDone ? (
                                <>
                                  <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.7, marginBottom: 6 }}>
                                    "{lastAnsweredQ?.q}"
                                  </div>
                                  <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 8 }}>
                                    → {lastAnsweredVal || '저장됐어요'} ✓
                                  </div>
                                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>내일 새로운 질문이 기다리고 있어요 🌙</div>
                                </>
                              ) : (
                                <>
                                  <div style={{ fontSize: 'var(--base)', color: 'var(--t1)', fontWeight: 500, lineHeight: 1.6, marginBottom: 4 }}>
                                    "{q.q}"
                                  </div>
                                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6, marginBottom: 12 }}>{q.sub}</div>

                                  {(q.type === 'chips' || q.type === 'mixed') && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                      {q.chips.map(chip => (
                                        <button key={chip} onClick={() => handleQuizAnswer(q, chip)}
                                          style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--line)', background: 'transparent', color: 'var(--t2)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', transition: 'all .15s' }}
                                          onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--gold)'; }}
                                          onMouseLeave={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.color = 'var(--t2)'; }}>
                                          {chip}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {(q.type === 'text' || q.type === 'mixed') && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <input className="chat-inp"
                                        placeholder={q.placeholder || '직접 입력...'}
                                        value={quizInput}
                                        onChange={e => setQuizInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleQuizAnswer(q, quizInput)}
                                        style={{ flex: 1, fontSize: 'var(--sm)' }} />
                                      <button className="chat-send" onClick={() => handleQuizAnswer(q, quizInput)} disabled={!quizInput.trim()} style={{ flexShrink: 0 }}>✦</button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px' }} onClick={() => setStep(1)}>
                        지금 시작하기 ✦
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="land-login-card" style={{ padding: '24px 20px', gap: '16px' }}>
                    <p style={{ fontSize: 'var(--sm)', color: 'var(--t2)', textAlign: 'center', lineHeight: 1.8, margin: 0 }}>
                      사주와 별자리, 두 개의 언어로<br/>지금의 당신을 읽어드려요
                    </p>
                    <button className="kakao-login-full" onClick={kakaoLogin} style={{ fontSize: '1rem', padding: '16px' }}>
                      <span className="kakao-icon-wrap">
                        <svg width="18" height="17" viewBox="0 0 18 18" fill="none">
                          <path d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38c0 2.1 1.38 3.93 3.45 4.98L4.2 15l3.54-2.34c.39.06.81.09 1.26.09 4.14 0 7.5-2.64 7.5-5.88S13.14 1.5 9 1.5z" fill="#191919" />
                        </svg>
                      </span>
                      카카오로 3초 만에 시작하기
                    </button>
                    <button className="land-ghost-link" onClick={() => setStep(1)}>
                      로그인 없이 먼저 체험하기 →
                    </button>
                  </div>
                )}
              </div>

              {!user && <div className="land-scroll-hint"><span>↓</span></div>}
            </div>

            {!user && (
              <div className="inner land-scroll-zone">
                <SamplePreview />
                <div className="daily-word">
                  <div className="daily-label">✦ {today.month}월 {today.day}일의 별 메시지</div>
                  <div className="daily-text">{'"' + getDailyWord(today.day) + '"'}</div>
                </div>
                <div className="rev-wrap">
                  <div className="rev-track">
                    {REVIEWS.map((r, i) => (
                      <div key={i} className="rev-card">
                        <div className="rev-stars">{r.star}</div>
                        <div className="rev-text">{'"' + r.text + '"'}</div>
                        <div className="rev-nick">{r.nick}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: 프로필 선택 / 생년월일 입력 ── */}
        {step === 1 && (
          <div className="page step-fade">
            <div className="inner">
              <div className="step-dots">
                {[0, 1, 2].map(i => <div key={i} className={`dot ${i === 0 ? 'active' : 'todo'}`} />)}
              </div>

              {formOk && (
                <div className="card" style={{ marginBottom: 'var(--sp2)' }}>
                  <div className="card-title" style={{ fontSize: 'var(--md)' }}>누구의 별숨을 볼까요?</div>

                  <div className={`profile-pick-card ${activeProfileIdx === 0 ? 'active' : ''}`} onClick={() => setActiveProfileIdx(0)}>
                    <div className="ppc-left">
                      <div className="ppc-av">{user?.profileImage ? <img src={user.profileImage} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '🌙'}</div>
                      <div>
                        <div className="ppc-name">
                          {form.name || user?.nickname || '나'}
                          {saju?.ilganPoetic && <span style={{ marginLeft: 6, fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 400 }}>{saju.ilganPoetic}</span>}
                        </div>
                        <div className="ppc-sub">
                          {form.by && sun
                            ? saju?.ilganEl && saju.ilganEl !== saju.dom
                              ? `${sun.s} ${sun.n} · 원래 ${ON[saju.ilganEl]}, ${ON[saju.dom]} 기운 강`
                              : `${sun.s} ${sun.n} · ${ON[saju?.dom || '금']} 기운`
                            : '정보를 입력해줘요'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {activeProfileIdx === 0 && <span style={{ color: 'var(--gold)' }}>✦</span>}
                      <button style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); setEditingMyProfile(p => !p); }}>수정</button>
                    </div>
                  </div>

                  {otherProfiles.map((p, i) => {
                    const pSun = p.bm && p.bd ? getSun(+p.bm, +p.bd) : null;
                    return (
                      <div key={i} className={`profile-pick-card ${activeProfileIdx === i + 1 ? 'active' : ''}`} onClick={() => setActiveProfileIdx(i + 1)}>
                        <div className="ppc-left">
                          <div className="ppc-av" style={{ background: 'var(--bg3)' }}>✦</div>
                          <div>
                            <div className="ppc-name">{p.name || '이름 없이 저장됨'}</div>
                            <div className="ppc-sub">{pSun ? `${pSun.s} ${pSun.n}` : '별자리 계산 가능해요'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {activeProfileIdx === i + 1 && <span style={{ color: 'var(--gold)' }}>✦</span>}
                          <button style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}
                            onClick={e => { e.stopPropagation(); startEditOtherProfile(i); }}>수정</button>
                          <button style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}
                            onClick={e => { e.stopPropagation(); setOtherProfiles(p => p.filter((_, j) => j !== i)); if (activeProfileIdx === i + 1) setActiveProfileIdx(0); }}>삭제</button>
                        </div>
                      </div>
                    );
                  })}

                  {otherProfiles.length < 3 && (
                    <button className="res-btn" style={{ width: '100%', marginTop: 8, padding: 12 }} onClick={() => setShowOtherProfileModal(true)}>
                      + 다른 사람의 별숨 추가 (최대 3명)
                    </button>
                  )}

                  <button className="btn-main" style={{ marginTop: 'var(--sp3)' }} onClick={() => { setSelQs([]); setStep(2); }}>
                    {activeProfileIdx === 0 ? `${form.name || '나'}의 별숨 보기 ✦` : `${otherProfiles[activeProfileIdx - 1]?.name || '이 사람'}의 별숨 보기 ✦`}
                  </button>
                </div>
              )}

              {(!formOk || editingMyProfile) && (
                <div className="card">
                  <div className="card-title">{editingMyProfile ? '내 프로필 수정 🌙' : '반가워요 🌙'}</div>
                  <div className="card-sub">생년월일만 있으면 사주와 별자리를 함께 읽어드릴게요</div>

                  <label className="lbl" htmlFor="inp-name">이름 (선택)</label>
                  <input id="inp-name" className="inp" placeholder="뭐라고 불러드릴까요?" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

                  <fieldset style={{border:'none',padding:0,margin:0}}>
                    <legend className="lbl">생년월일</legend>
                    <div className="row" style={{ marginBottom: 'var(--sp3)' }}>
                      <div className="col"><input id="inp-by" className="inp" placeholder="1998" inputMode="numeric" pattern="[0-9]*" aria-label="출생 연도" value={form.by} onChange={e => { const v = e.target.value.replace(/\D/, '').slice(0, 4); setForm(f => ({ ...f, by: v })); if (v.length === 4) setFieldTouched(t => ({ ...t, by: true })); }} style={{ marginBottom: 0 }} /></div>
                      <div className="col"><select id="inp-bm" className="inp" aria-label="출생 월" value={form.bm} onChange={e => setForm(f => ({ ...f, bm: e.target.value }))} onBlur={e => { if (e.target.value) setFieldTouched(t => ({ ...t, bm: true })); }} style={{ marginBottom: 0 }}><option value="">월</option>{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}</select></div>
                      <div className="col"><select id="inp-bd" className="inp" aria-label="출생 일" value={form.bd} onChange={e => setForm(f => ({ ...f, bd: e.target.value }))} onBlur={e => { if (e.target.value) setFieldTouched(t => ({ ...t, bd: true })); }} style={{ marginBottom: 0 }}><option value="">일</option>{[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}일</option>)}</select></div>
                    </div>
                  </fieldset>

                  <div className="toggle-row" onClick={() => setForm(f => ({ ...f, noTime: !f.noTime, bh: '' }))}>
                    <button className={`toggle ${form.noTime ? 'on' : 'off'}`} role="switch" aria-checked={form.noTime} aria-label="태어난 시간 모름" onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, noTime: !f.noTime, bh: '' })); }} />
                    <span className="toggle-label">태어난 시간을 몰라요</span>
                  </div>
                  {!form.noTime && (
                    <>
                      <label className="lbl" htmlFor="inp-bh">태어난 시각</label>
                      <select id="inp-bh" className="inp" value={form.bh} onChange={e => setForm(f => ({ ...f, bh: e.target.value }))}>
                        <option value="">시각 선택</option>
                        {Array.from({ length: 144 }, (_, i) => { const h = Math.floor(i / 6); const m = (i % 6) * 10; const val = (h + m / 60).toFixed(4); return <option key={i} value={val}>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</option>; })}
                      </select>
                    </>
                  )}
                  <fieldset style={{border:'none',padding:0,margin:0}}>
                    <legend className="lbl">성별</legend>
                    <div className="gender-group" role="group" aria-label="성별 선택">
                      {['여성', '남성', '기타'].map(g => (
                        <button key={g} className={`gbtn ${form.gender === g ? 'on' : ''}`} aria-pressed={form.gender === g} onClick={() => setForm(f => ({ ...f, gender: g }))}>{g}</button>
                      ))}
                    </div>
                  </fieldset>

                  {saju && (
                    <div className="pillars-wrap">
                      <div className="pillars-hint"><span style={{ color: 'var(--gold)' }}>✦</span> 사주 원국</div>
                      <div className="pillars">
                        {[['연', 'yeon'], ['월', 'wol'], ['일', 'il'], ['시', 'si']].map(([l, k]) => (
                          <div key={l} className="pillar">
                            <div className="p-lbl">{l}주</div>
                            <div className="p-hj">{saju[k].gh}</div>
                            <div className="p-hj">{saju[k].jh}</div>
                            <div className="p-kr">{saju[k].g}{saju[k].j}</div>
                          </div>
                        ))}
                      </div>
                      <div className="oh-bar">
                        {Object.entries(saju.or).map(([k, v]) => v > 0 && <div key={k} className="oh-seg" style={{ flex: v, background: OC[k] }} />)}
                      </div>
                      <div className="oh-tags">
                        {Object.entries(saju.or).map(([k, v]) => v > 0 && (
                          <span key={k} className="oh-tag" style={{ background: `${OC[k]}18`, color: OC[k], border: `1px solid ${OC[k]}28` }}>{OE[k]} {ON[k]} {v}</span>
                        ))}
                      </div>
                      <div className="il-preview">{saju.ilganDesc}</div>
                    </div>
                  )}
                  {sun && (
                    <div className="astro-preview">
                      <div className="a-chip">{sun.s} {sun.n}</div>
                      {moon && <div className="a-chip">🌙 달 {moon.n}</div>}
                      {asc && <div className="a-chip">↑ 상승 {asc.n}</div>}
                    </div>
                  )}
                  <button className="btn-main" disabled={editingMyProfile ? !formOk : !(formOk && fieldTouched.by && fieldTouched.bm && fieldTouched.bd)} onClick={() => { if (editingMyProfile) { setEditingMyProfile(false); } else if (!onboardingDone) { setSelQs([]); setStep(15); } else { setSelQs([]); setStep(2); } }}>{editingMyProfile ? '저장하기 ✦' : '다음 단계 →'}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: 질문 선택 ── */}
        {step === 2 && (
          <div className="page">
            <div className="inner">
              <div className="step-dots">
                {[0, 1, 2].map(i => <div key={i} className={`dot ${i < 1 ? 'done' : i === 1 ? 'active' : 'todo'}`} />)}
              </div>
              <div className="q-shell">
                <div className="combo-banner">
                  <div className="combo-title">✦ 사주 × 별자리 통합 분석</div>
                  <div className="combo-sub">
                    {activeProfileIdx === 0
                      ? (saju && sun ? `${ON[saju.dom]} 기운의 ${sun.n} · 달 ${moon?.n || ''}` : '동양과 서양의 별이 함께 읽어드려요')
                      : (() => {
                          const op = otherProfiles[activeProfileIdx - 1];
                          return op ? `${op.name || '이 사람'}의 별숨` : '동양과 서양의 별이 함께 읽어드려요';
                        })()
                    }
                  </div>
                  <div style={{ marginTop: 10, padding: '10px 14px', background: TIME_CONFIG[timeSlot].bg, borderRadius: 'var(--r1)', border: `1px solid ${TIME_CONFIG[timeSlot].border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.1rem' }}>{TIME_CONFIG[timeSlot].emoji}</span>
                    <div>
                      <div style={{ fontSize: 'var(--xs)', color: TIME_CONFIG[timeSlot].color, fontWeight: 600, marginBottom: 2 }}>{TIME_CONFIG[timeSlot].label}</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.5 }}>{TIME_CONFIG[timeSlot].greeting(activeProfileIdx === 0 ? form.name : otherProfiles[activeProfileIdx - 1]?.name || '')}</div>
                    </div>
                  </div>
                </div>

                <div className="diy-wrap" style={{ marginBottom: diy.trim() ? 0 : 'var(--sp2)' }}>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 6, letterSpacing: '.06em' }}>✦ 직접 물어보기</div>
                  <textarea className="diy-inp"
                    placeholder="직접 묻고 싶은 게 있어요? 자유롭게 써봐요 🌙"
                    maxLength={200} value={diy} onChange={e => setDiy(e.target.value)} />
                  <div className="diy-row"><span className="hint">{diy.length}/200</span></div>
                  {diy.trim() && (
                    <button className="btn-main" style={{ marginTop: 8 }}
                      onClick={() => { const q = diy.trim(); if (q) { setDiy(''); askQuick(q); } }}>
                      ✦ 질문하기
                    </button>
                  )}
                </div>

                {!diy.trim() && (<>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 6, letterSpacing: '.06em' }}>또는 고민 카테고리에서 골라봐요</div>
                <div className="cat-tabs">
                  {(showAllCats ? CATS_ALL : CATS).map((c, i) => <button key={c.id} className={`cat-tab ${cat === i ? 'on' : ''}`} onClick={() => setCat(i)}>{c.icon} {c.label}</button>)}
                </div>
                <button
                  className="res-btn"
                  style={{ margin: '0 0 var(--sp2)', fontSize: 'var(--xs)' }}
                  onClick={() => setShowAllCats(p => !p)}
                >
                  {showAllCats ? '주요 주제만 보기 ▲' : '더 많은 주제 보기 ▼ (9개)'}
                </button>

                {selQs.length < maxQ && (
                  <div>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, margin: '10px 0 6px', letterSpacing: '.04em' }}>✦ 이런 질문 어때요?</div>
                    <div className="suggest-row">
                      {(showAllCats ? CATS_ALL : CATS)[cat]?.qs.slice(0, 3).filter(q => !selQs.includes(q)).map((q, i) => (
                        <button key={i} className="suggest-chip" onClick={() => askQuick(q)}>
                          {q.length > 22 ? q.slice(0, 22) + '…' : q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="q-list">
                  {(showAllCats ? CATS_ALL : CATS)[cat]?.qs.map((q, i) => {
                    const on = selQs.includes(q);
                    return <button key={i} className={`q-item ${on ? 'on' : ''}`}
                      disabled={!on && selQs.length >= maxQ}
                      onClick={() => {
                        if (on) rmQ(selQs.indexOf(q));
                        else { addQ(q); setTimeout(() => askBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150); }
                      }}>{q}</button>;
                  })}
                </div>

                {selQs.length > 0 && (
                  <div className="sel-qs">
                    <div className="sel-lbl">선택한 질문 ({selQs.length}/{maxQ})</div>
                    {selQs.map((q, i) => (
                      <div key={i} className="sel-item">
                        <span className="sel-n">{i + 1}</span>
                        <span className="sel-t">{q}</span>
                        <button className="sel-del" onClick={() => rmQ(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="q-stat">
                  {selQs.length === 0 && '질문을 하나 이상 골라봐요'}
                  {selQs.length > 0 && selQs.length < maxQ && <><strong>{maxQ - selQs.length}개</strong> 더 고를 수 있어요</>}
                  {selQs.length === maxQ && <><strong>준비 완료!</strong> 두 별이 읽어드릴게요 🌟</>}
                </div>
                <button ref={askBtnRef} className="btn-main" disabled={!selQs.length} onClick={askClaude}>
                  {selQs.length === 0 ? '질문을 먼저 골라봐요' : `✦ 두 별에게 물어보기 (${selQs.length}개)`}
                </button>
                </>)}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: 로딩 ── */}
        {step === 3 && <div className="page" role="status" aria-live="polite" aria-busy="true"><SkeletonLoader qCount={selQs.length} saju={saju} loadingMsgIdx={loadingMsgIdx} selQs={selQs} qLoadStatus={qLoadStatus} /></div>}

        {/* ── Step 4: 결과 ── */}
        {step === 4 && (
          <div className="page-top">
            <div className="res-wrap" ref={resultsRef}>
              <div className="res-card">
                <div className="res-top-bar">
                  <button className="res-top-btn" onClick={() => { navigator.clipboard?.writeText(answers.join('\n\n')); alert('복사됐어요 📋'); }}>📋 복사</button>
                  {answers[0] && <button className="res-top-btn" onClick={() => shareCard(0)}>🖼 저장</button>}
                  {answers[0] && <button className="res-top-btn primary" onClick={() => shareResult('result')}>↗ 공유</button>}
                </div>

                <div className="res-header">
                  <div className="res-av">✦</div>
                  <div>
                    <div className="res-name">{form.name ? `${form.name}에게 전하는 별의 이야기` : '오늘 밤 당신에게 전하는 이야기'}</div>
                    <div className="res-chips">
                      {saju && <div className="res-chip">🀄 {ON[saju.dom]} 기운</div>}
                      {sun && <div className="res-chip">{sun.s} {sun.n}</div>}
                      {moon && <div className="res-chip">🌙 달 {moon.n}</div>}
                      {asc && <div className="res-chip">↑ {asc.n}</div>}
                      <div className="res-chip">📅 {today.month}월 {today.day}일</div>
                    </div>
                  </div>
                </div>

                {sun && (() => {
                  const mood = SIGN_MOOD[sun.n] || { color: 'var(--gold)', bg: 'var(--goldf)', word: '신비로운', emoji: '✦' };
                  return (
                    <div className="mood-banner" style={{ background: mood.bg, borderColor: mood.color + '33' }}>
                      <div className="mood-orb" style={{ background: mood.color + '22', border: `1px solid ${mood.color}44` }}>{mood.emoji}</div>
                      <div>
                        <div className="mood-label">오늘의 별자리 기운</div>
                        <div className="mood-word" style={{ color: mood.color }}>{mood.word} 하루예요</div>
                      </div>
                    </div>
                  );
                })()}

                {answers[0] && (() => {
                  const summaryStr = parseAccSummary(answers[0]).summary;
                  return summaryStr ? (
                    <div className="star-summary">
                      <span className="star-summary-icon">✦</span>
                      <span className="star-summary-text">{summaryStr}</span>
                    </div>
                  ) : null;
                })()}

                {selQs.map((q, i) => (
                  <div key={i}>
                    <AccItem
                      q={q} text={parseAccSummary(answers[i] || '').text} idx={i}
                      isOpen={openAcc === i}
                      onToggle={() => handleAccToggle(i)}
                      shouldType={!typedSet.has(i)}
                      onTypingDone={handleTypingDone}
                      onRetry={() => retryAnswer(i)}
                    />
                    {openAcc === i && typedSet.has(i) && answers[i] && (
                      <div style={{ padding: '0 var(--sp3) var(--sp2)', borderBottom: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FeedbackBtn qIdx={i} />
                          <button className="res-top-btn" style={{ fontSize: 'var(--xs)' }} onClick={() => shareCard(i)}>↗ Q{i + 1} 이미지 저장</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="res-actions">
                  {/* ── 구독 넛지 (첫 번째 답변 타이핑 완료 후, 비로그인 또는 basic 플랜, 베타 종료 후 활성화) ── */}
                  {showSubNudge && (
                    <div
                      style={{
                        padding: 'var(--sp2) var(--sp3)',
                        background: 'linear-gradient(135deg, var(--goldf), rgba(155,142,196,.08))',
                        border: '1px solid var(--acc)',
                        borderRadius: 'var(--r2)',
                        marginBottom: 'var(--sp2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        animation: 'fadeUp .4s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>✦</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--sm)', fontWeight: 600, color: 'var(--gold)', marginBottom: 3 }}>
                          더 깊은 이야기가 있어요
                        </div>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>
                          채팅으로 더 물어보거나, 이달 전체 리포트를 받아봐요
                        </div>
                      </div>
                      <button
                        className="up-btn"
                        style={{ width: 'auto', padding: '8px 16px', flexShrink: 0, fontSize: 'var(--xs)' }}
                        onClick={() => setStep(5)}
                      >
                        더 물어보기
                      </button>
                    </div>
                  )}
                  {/* ── 별숨과 대화하기 (최상단, 가장 눈에 띄게) ── */}
                  {curPkg.chat > 0 && (
                    <button className="chat-cta-large" onClick={() => setStep(5)}>
                      <span className="chat-cta-emoji">💬</span>
                      <div className="chat-cta-info">
                        <div className="chat-cta-title">별숨과 더 깊은 대화하기</div>
                        <div className="chat-cta-desc">답변 내용으로 더 자세히 물어봐요</div>
                      </div>
                      <span style={{ fontSize: '1.1rem', color: 'var(--gold)', flexShrink: 0 }}>→</span>
                    </button>
                  )}

                  <div className="action-grid" style={{ marginBottom: 'var(--sp2)' }}>
                    {['love', 'family', 'relation'].includes(CATS[cat].id) ? (
                      <div className="action-card compat" onClick={() => setStep(7)}>
                        <div className="action-card-icon">💞</div>
                        <div className="action-card-title">우리가 만나면</div>
                        <div className="action-card-sub">두 사람의 별이 만나는 시나리오</div>
                      </div>
                    ) : (
                      <div className="action-card" style={{ borderColor: 'var(--tealacc)' }} onClick={() => setStep(6)}>
                        <div className="action-card-icon">📜</div>
                        <div className="action-card-title">{CATS[cat].label} 심층 분석</div>
                        <div className="action-card-sub">이 분야만 깊게 파고들기</div>
                      </div>
                    )}
                    <div className="action-card letter" onClick={() => setStep(8)}>
                      <div className="action-card-icon">🔮</div>
                      <div className="action-card-title">별숨의 예언</div>
                      <div className="action-card-sub">시간이 흐른 뒤의 나의 예언</div>
                    </div>
                  </div>

                  {!user && (
                    <div className="kakao-nudge">
                      <span style={{ fontSize: '1.1rem' }}>🌙</span>
                      <span className="kakao-nudge-text">로그인하면 연인 운세 · 직장 맞춤 · 내 기록이 모두 저장돼요</span>
                      <button className="kakao-btn" style={{ width: 'auto', padding: '6px 14px', fontSize: 'var(--xs)' }} onClick={kakaoLogin}>카카오 로그인</button>
                    </div>
                  )}

                  <div className="upsell">
                    <div className="up-t">✦ 이번 달 전체 운세가 궁금해요</div>
                    <div className="up-d">연애 · 재물 · 건강 · 직업 종합 분석<br />사주와 별자리가 함께 쓴 월간 에세이</div>
                    <button className="up-btn" onClick={() => setStep(6)}>이달의 운세 리포트 보기 ✦</button>
                  </div>

                  <div className="res-btns">
                    <button className="res-btn" onClick={() => { setSelQs([]); setDiy(''); resetSession(); setStep(formOk ? 2 : 1); }}>다른 질문</button>
                    <button className="res-btn" onClick={() => setShowSidebar(true)}>지난 이야기</button>
                    <button className="res-btn" onClick={() => setStep(0)}>홈으로</button>
                  </div>

                  {/* ── 카카오 채널 리마인더 ── */}
                  <div className="kakao-channel-remind">
                    <div className="kcr-icon">💌</div>
                    <div className="kcr-body">
                      <div className="kcr-title">내일 별숨 받기</div>
                      <div className="kcr-desc">카카오 채널을 추가하면 매주 나만의 운세를 받을 수 있어요</div>
                    </div>
                    <a
                      className="kcr-btn"
                      href="https://pf.kakao.com/_byeolsoom/friend"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="카카오 채널 친구 추가"
                    >채널 추가</a>
                  </div>

                  <div className="feature-guide">
                    <div className="feature-guide-title">✦ 별숨의 다른 기능들</div>
                    <div className="feature-guide-grid">
                      <button className="fg-card" onClick={() => setStep(7)}><span className="fg-icon">💞</span><div className="fg-info"><div className="fg-name">사이 별점</div><div className="fg-desc">두 사람의 사주+별자리로 관계 시나리오 읽기</div></div></button>
                      <button className="fg-card" onClick={() => setStep(8)}><span className="fg-icon">🔮</span><div className="fg-info"><div className="fg-name">별숨의 예언</div><div className="fg-desc">1개월~30년 후의 나에게 전하는 예언</div></div></button>
                      <button className="fg-card" onClick={() => setStep(6)}><span className="fg-icon">📜</span><div className="fg-info"><div className="fg-name">월간 리포트</div><div className="fg-desc">이달의 연애·재물·직업·건강 에세이</div></div></button>
                      <button className="fg-card" onClick={() => setStep(5)}><span className="fg-icon">💬</span><div className="fg-info"><div className="fg-name">별숨에게 더 물어보기</div><div className="fg-desc">답변 기반 후속 상담 채팅</div></div></button>
                      <button className="fg-card" onClick={() => setShowSidebar(true)}><span className="fg-icon">🗂️</span><div className="fg-info"><div className="fg-name">지난 이야기</div><div className="fg-desc">내가 별숨에 물었던 모든 질문 기록</div></div></button>
                      <button className="fg-card" onClick={handleCopyAll}>
                        <span className="fg-icon">{copyDone ? '✅' : '📋'}</span>
                        <div className="fg-info">
                          <div className="fg-name">전체 복사</div>
                          <div className="fg-desc">{copyDone ? '복사됐어요!' : '오늘 받은 모든 답변 클립보드 복사'}</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: 채팅 (고정 레이아웃 — 헤더+입력창 고정, 히스토리만 스크롤) ── */}
        {step === 5 && (
          <div className="chat-page">
            <div className="chat-page-header">
              <div className="chat-page-title">💬 별숨과 대화하기</div>
              <div className="chat-page-sub">
                {selQs.slice(0, 2).map((q, i) => <div key={i} style={{ marginTop: 3 }}>Q{i + 1}. {q.length > 28 ? q.slice(0, 28) + '…' : q}</div>)}
              </div>
            </div>

            <div className="chat-history">
              {chatHistory.length === 0 && (
                <div style={{ color: 'var(--t4)', fontSize: 'var(--sm)', textAlign: 'center', padding: 'var(--sp4) var(--sp3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>✦</div>
                  더 궁금한 게 있으면 자유롭게 물어봐요 🌙
                </div>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role}`}>
                  <div className="chat-role">{m.role === 'ai' ? '✦ 별숨' : '나'}</div>
                  {m.role === 'ai'
                    ? <ChatBubble text={m.text} isNew={i === latestChatIdx} />
                    : <div className="chat-bubble">{m.text}</div>
                  }
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg ai">
                  <div className="chat-role">✦ 별숨</div>
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {profileNudge && (
              <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ flex: 1, fontSize: 'var(--sm)', color: 'var(--t2)' }}>✦ {profileNudge.label}</span>
                <button onClick={() => { setShowProfileModal(true); setProfileNudge(null); }}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--gold)', background: 'var(--goldf)', color: 'var(--gold)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', fontWeight: 600, cursor: 'pointer' }}>
                  저장하기
                </button>
                <button onClick={() => setProfileNudge(null)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--line)', background: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
                  괜찮아요
                </button>
              </div>
            )}

            <div className="chat-input-area">
              {chatLeft > 0 && !chatLoading && (
                <div className="chat-sugg-wrap">
                  {CHAT_SUGG.map((s, i) => <button key={i} className="sugg-btn" onClick={() => setChatInput(s)}>{s}</button>)}
                </div>
              )}
              <div className="chat-inp-row">
                <input className="chat-inp"
                  placeholder={chatLeft > 0 ? '더 궁금한 게 있어요? 🌙' : '채팅을 모두 사용했어요'}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                  disabled={chatLeft <= 0 || chatLoading} />
                <button className="chat-send" onClick={handleSendChat} disabled={!chatInput.trim() || chatLeft <= 0 || chatLoading}>✦</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 6: 월간 리포트 ── */}
        {step === 6 && (
          <div className="page-top">
            <div className="inner report-page">
              <div className="report-header">
                <div className="report-date">{today.year}년 {today.month}월 · {today.lunar}</div>
                <div className="report-title">{form.name || '당신'}님의<br />심층 리포트</div>
                <div className="report-name">사주 × 별자리 통합 운세</div>
              </div>
              {!reportLoading && !reportText ? (
                <div style={{ textAlign: 'center', padding: 'var(--sp4) var(--sp3) var(--sp5)' }}>
                  <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.8, marginBottom: 'var(--sp4)' }}>
                    이번 달 별과 사주가 전하는<br />연애 · 재물 · 건강 · 직업 종합 에세이
                  </div>
                  <button className="up-btn" style={{ maxWidth: 320, margin: '0 auto' }} onClick={genReport}>
                    당신의 이번달 별숨은? ✦
                  </button>
                </div>
              ) : reportLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--sp5)', color: 'var(--t3)', fontSize: 'var(--sm)' }}>
                  <div className="load-orb-wrap">
                    <div className="load-orb">
                      <div className="load-orb-core" /><div className="load-orb-ring" /><div className="load-orb-ring2" />
                    </div>
                  </div>
                  별의 움직임을 분석하여<br />심층 리포트를 작성하고 있습니다...
                </div>
              ) : (
                <>
                  <ReportBody text={reportText} />
                  {reportText && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 'var(--sp3)' }}>
                      <button className="res-top-btn" style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => shareCard(0)}>🖼 이미지 저장</button>
                      <button className="res-top-btn primary" style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => shareResult('report', reportText, '월간 리포트')}>↗ 공유하기</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Step 7: 궁합 ── */}
        {step === 7 && (
          <Suspense fallback={<PageSpinner />}>
            <CompatPage
              myForm={form} mySaju={saju} mySun={sun}
              callApi={callApi} buildCtx={buildCtx}
              onBack={() => setStep(4)}
              shareResult={shareResult}
              saveCompatImage={handleSaveCompatImage}
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
              onDelete={(id) => { deleteHistory(id); setHistItems(loadHistory()); }}
            />
          </Suspense>
        )}

        {/* ── Step 10: 별숨 달력 ── */}
        {step === 10 && (
          <Suspense fallback={<PageSpinner />}>
            <SajuCalendar form={form} setStep={setStep} askQuick={askQuick} />
          </Suspense>
        )}

        {/* ── Step 11: 궁합 레이더 ── */}
        {step === 11 && (
          <Suspense fallback={<PageSpinner />}>
            <RadarChart form={form} otherProfiles={otherProfiles} setStep={setStep} onAddOther={() => setShowOtherProfileModal(true)} />
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

        {/* ── Step 13: 나의 원국 해설 ── */}
        {step === 13 && (
          <Suspense fallback={<PageSpinner />}>
            <NatalInterpretationPage
              saju={saju}
              sun={sun}
              moon={moon}
              form={form}
              buildCtx={buildCtx}
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

        <div style={{ fontSize: '10px', color: 'var(--t4)', textAlign: 'center', padding: '20px 20px 40px', letterSpacing: '0.02em' }}>
          ✦ 별숨은 점술 및 오락 목적의 서비스이며, 결과에 대해서는 법적 책임이나 효력을 지지 않습니다.
        </div>
      </div>

      {/* ── 모달들 ── */}
      {showProfileModal && (
        <Suspense fallback={<PageSpinner />}>
          <ProfileModal profile={profile} setProfile={userProfile.setProfile} onClose={() => setShowProfileModal(false)} />
        </Suspense>
      )}

      {showUpgradeModal && (
        <div className="upgrade-modal-bg" onClick={() => setShowUpgradeModal(false)}>
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
        <div className="other-modal-bg" onClick={() => setShowOtherProfileModal(false)}>
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
        <div className="upgrade-modal-bg" onClick={() => setShowInviteModal(false)}>
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

      {/* ── 별숨 일기 모달 ── */}
      {showDiary && (
        <div className="upgrade-modal-bg" onClick={() => setShowDiary(false)}>
          <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 6 }}>📓</div>
            <div className="upgrade-modal-title">오늘 있었던 일</div>
            <div className="upgrade-modal-sub" style={{ marginBottom: 'var(--sp3)' }}>별숨이 사주와 별자리 관점으로 재해석해드려요</div>
            <textarea
              className="diary-textarea"
              rows={5}
              placeholder="오늘 어떤 일이 있었나요? 기뻤던 일, 속상했던 일, 작은 설렘까지 — 모두 괜찮아요."
              value={diaryText}
              onChange={e => setDiaryText(e.target.value)}
              maxLength={500}
            />
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', textAlign: 'right', marginBottom: 'var(--sp3)' }}>{diaryText.length}/500</div>
            <button
              className="btn-main"
              disabled={diaryText.trim().length < 5}
              onClick={() => {
                setShowDiary(false);
                askReview(diaryText.trim(), DIARY_PROMPT);
                setDiaryText('');
              }}
            >
              별숨의 해석 듣기 ✦
            </button>
            <button style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', marginTop: 6 }} onClick={() => setShowDiary(false)}>취소</button>
          </div>
        </div>
      )}

      {shareModal.open && (
        <div className="upgrade-modal-bg" onClick={() => setShareModal(s => ({ ...s, open: false }))}>
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
    </>
  );
}
