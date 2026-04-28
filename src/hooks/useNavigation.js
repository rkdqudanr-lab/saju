import { useState, useEffect, useRef } from "react";
import { STEP } from "../utils/steps.js";

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

  // ── 그룹 코드 진입 ──
  useEffect(() => {
    if (groupCode) setStep(STEP.GROUP);
  }, [groupCode, setStep]);

  // ── 화면 전환 시 스크롤 맨 위로 ──
  useEffect(() => {
    if (step !== STEP.LOADING) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  // ── 결과 자동 스크롤 ──
  useEffect(() => {
    if (step === STEP.RESULT && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── GA4 step 변경 추적 ──
  useEffect(() => {
    if (step === STEP.LOADING) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'step_change', { step });
    if (step === STEP.QUESTION && typeof window.gtag === 'function') window.gtag('event', 'step2_enter');
    if (step === STEP.CHAT && typeof window.gtag === 'function') window.gtag('event', 'chat_page_enter');
    if (step === STEP.DEEP_INTERVIEW && typeof window.gtag === 'function') window.gtag('event', 'report_page_enter');
    if (step === STEP.COMPAT && typeof window.gtag === 'function') window.gtag('event', 'compat_page_enter');
  }, [step]);

  // ── 브라우저 히스토리 동기화 ──
  useEffect(() => {
    if (step === STEP.LOADING) return;
    if (isPopState.current) { isPopState.current = false; return; }
    window.history.pushState({ step }, '', window.location.pathname);
  }, [step]);

  useEffect(() => {
    const handlePopState = (e) => {
      const prevStep = e.state?.step ?? STEP.HOME;
      isPopState.current = true;
      setStep(prevStep);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setStep]);

  return { refCode, groupCode };
}
