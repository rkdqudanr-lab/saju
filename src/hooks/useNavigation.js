import { useState, useEffect, useRef } from "react";
import { STEP } from "../utils/steps.js";
import { useAppStore } from "../store/useAppStore.js";

// step ↔ URL hash 슬러그 매핑 (#/diary 등) — 새로고침/재방문 시 페이지 복원용
const STEP_TO_SLUG = {};
const SLUG_TO_STEP = {};
Object.entries(STEP).forEach(([name, val]) => {
  const slug = name.toLowerCase().replace(/_/g, '-');
  STEP_TO_SLUG[val] = slug;
  SLUG_TO_STEP[slug] = val;
});
// 세션 데이터(answers/chat 등)에 의존해 직접 복원이 무의미한 step은 제외
const RESTORE_EXCLUDE = new Set([
  STEP.LOADING, STEP.RESULT, STEP.CHAT, STEP.REPORT,
  STEP.HISTORY, STEP.ONBOARDING, STEP.COMPREHENSIVE_REDIRECT,
]);

// 스크린리더·탭 제목용 페이지 타이틀
const STEP_TITLES = {
  [STEP.PROFILE]: '내 정보 입력', [STEP.QUESTION]: '상담 질문 선택', [STEP.RESULT]: '상담 결과',
  [STEP.CHAT]: '별숨과 대화', [STEP.COMPAT]: '궁합', [STEP.FUTURE_PROPHECY]: '별숨의 예언',
  [STEP.DEEP_INTERVIEW]: '심층 인터뷰', [STEP.CALENDAR]: '별숨 달력', [STEP.DIARY]: '나의 하루',
  [STEP.DIARY_LIST]: '일기 모아보기', [STEP.NATAL]: '나의 사주원국', [STEP.COMPREHENSIVE]: '종합 분석',
  [STEP.SETTINGS]: '설정', [STEP.MY_PAGE]: '마이페이지', [STEP.TODAY_DETAIL]: '오늘의 운세',
  [STEP.DREAM]: '꿈 해몽', [STEP.TAROT]: '별숨 타로', [STEP.SHOP]: '별숨샵', [STEP.GACHA]: '뽑기',
  [STEP.COMMUNITY]: '별숨 광장', [STEP.STATS]: '별숨 통계', [STEP.MISSIONS]: '미션',
  [STEP.GROWTH_DASHBOARD]: '성장 대시보드', [STEP.ITEM_INVENTORY]: '오브제함',
  [STEP.BYEOLSOOM_SPACE]: '별숨 도감', [STEP.DAEUN]: '대운 흐름', [STEP.REPORT]: '월간 리포트',
};

/**
 * URL 파라미터 파싱, 브라우저 히스토리 동기화, 스크롤, GA4 추적을
 * 하나의 훅으로 묶습니다.
 */
export function useNavigation({ step, setStep, resultsRef, showToast, loginError, setLoginError }) {
  const isPopState = useRef(false);

  const [refCode] = useState(() => new URLSearchParams(window.location.search).get('ref') || null);
  const [groupCode] = useState(() => new URLSearchParams(window.location.search).get('group') || null);

  // ── loginError 토스트 ──
  useEffect(() => {
    if (loginError) { showToast(loginError, 'error'); setLoginError(''); }
  }, [loginError, showToast, setLoginError]);

  // ── 초대 코드 localStorage 저장 ──
  useEffect(() => {
    if (refCode) { try { localStorage.setItem('byeolsoom_ref', refCode); } catch {} }
  }, [refCode]);

  // ── 초기 로드 시 URL hash로 step 복원 (새로고침=홈 리셋 방지) ──
  useEffect(() => {
    if (groupCode) return; // ?group= 딥링크가 우선
    const slug = window.location.hash.replace(/^#\/?/, '');
    const restored = SLUG_TO_STEP[slug];
    if (restored !== undefined && restored !== STEP.HOME && !RESTORE_EXCLUDE.has(restored)) {
      setStep(restored);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 그룹 코드 진입 ──
  useEffect(() => {
    if (groupCode) setStep(STEP.GROUP);
  }, [groupCode, setStep]);

  // 화면 전환 스크롤 복원은 AppRouter의 AnimatePresence onExitComplete에서 처리
  // (전환 애니메이션 도중 즉시 scrollTo 하면 퇴장 중인 페이지가 점프해 보임)

  // ── 결과 자동 스크롤 ──
  useEffect(() => {
    if (step === STEP.RESULT && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 페이지 타이틀 갱신 (스크린리더 페이지 전환 인지용) ──
  useEffect(() => {
    if (step === STEP.LOADING) return;
    const t = STEP_TITLES[step];
    document.title = t ? `${t} | 별숨` : '별숨 — 사주와 별자리';
  }, [step]);

  // ── GA4 step 변경 추적 ──
  useEffect(() => {
    if (step === STEP.LOADING) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'step_change', { step });
    if (step === STEP.QUESTION && typeof window.gtag === 'function') window.gtag('event', 'step2_enter');
    if (step === STEP.CHAT && typeof window.gtag === 'function') window.gtag('event', 'chat_page_enter');
    if (step === STEP.DEEP_INTERVIEW && typeof window.gtag === 'function') window.gtag('event', 'report_page_enter');
    if (step === STEP.COMPAT && typeof window.gtag === 'function') window.gtag('event', 'compat_page_enter');
  }, [step]);

  // ── 브라우저 히스토리 동기화 (hash에 step 기록 → 새로고침 복원 가능) ──
  useEffect(() => {
    if (step === STEP.LOADING) return;
    if (isPopState.current) { isPopState.current = false; return; }
    const slug = STEP_TO_SLUG[step];
    const hash = step === STEP.HOME ? '' : `#/${slug}`;
    window.history.pushState({ step }, '', window.location.pathname + window.location.search + hash);
  }, [step]);

  useEffect(() => {
    const handlePopState = (e) => {
      // 열린 모달/드로어가 있으면 페이지 이동 대신 최상위 모달만 닫는다 (안드로이드 백버튼)
      if (useAppStore.getState().closeTopModal()) {
        window.history.pushState({ step: useAppStore.getState().step }, '', window.location.href);
        return;
      }
      const prevStep = e.state?.step ?? STEP.HOME;
      isPopState.current = true;
      setStep(prevStep);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setStep]);

  return { refCode, groupCode };
}
