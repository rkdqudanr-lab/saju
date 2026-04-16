import { useState, useCallback, useEffect, useRef } from "react";
import { parseAccSummary, PKGS, DAILY_QUESTIONS, SIGN_MOOD } from "../utils/constants.js";
import { saveShareCard, saveReportImage, saveProphecyImage, saveCompatImage, saveChatImage, captureShareCard } from "../utils/imageExport.js";
import { getTodayStr } from "../utils/quiz.js";

function detectProfileHint(msg, prof) {
  if (!prof.workplace && /직장|직업|회사|일하|취업|이직|재직|근무|스타트업|공무원|프리랜서/.test(msg))
    return { label: '직장/직업 정보를 저장해드릴까요?' };
  if (!prof.partner && /연인|남자친구|여자친구|남친|여친|애인|사귀|좋아하는 사람/.test(msg))
    return { label: '연인 정보를 저장해드릴까요?' };
  if (!prof.worryText && /고민|걱정|불안|힘들|스트레스|갈등|막막|어려/.test(msg))
    return { label: '지금 고민을 저장해드릴까요?' };
  return null;
}

/**
 * App 레벨 콜백/핸들러를 묶습니다.
 * copyDone, profileNudge, showSubNudge 상태를 포함합니다.
 */
export function useAppHandlers({
  answers, selQs, chatHistory, quiz, quizInput, setQuizInput,
  profile, setProfile, user, saveDailyQuizAnswer, saveSettings,
  sendChat, sendStreamChat, _handleTypingDone, curPkg, isDark, today,
  setShareModal, showToast, setStep,
  sun, saju, form,
}) {
  const [copyDone, setCopyDone] = useState(false);
  const [profileNudge, setProfileNudge] = useState(null);
  const [showSubNudge, setShowSubNudge] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState(null);
  const [cardSummary, setCardSummary] = useState('');
  const [shareCardType, setShareCardType] = useState('horoscope');
  const [shareCardName, setShareCardName] = useState('');
  const copyTimer = useRef(null);
  const shareCardRef = useRef(null);

  // answers[0]가 업데이트되면 카드 요약 자동 갱신
  useEffect(() => {
    if (!answers[0]) return;
    const s = parseAccSummary(answers[0]).summary || parseAccSummary(answers[0]).text?.slice(0, 120) || '';
    setCardSummary(s);
  }, [answers]);

  const IS_BETA = true;

  // ── 채팅 중 프로필 감지 넛지 ──
  useEffect(() => {
    if (chatHistory.length < 2) return;
    const last = chatHistory[chatHistory.length - 1];
    const userMsg = chatHistory[chatHistory.length - 2];
    if (last?.role !== 'ai' || userMsg?.role !== 'user') return;
    const hint = detectProfileHint(userMsg.text, profile);
    if (hint) setProfileNudge(hint);
  }, [chatHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 첫 번째 답변 완료 시 구독 넛지 ──
  const handleTypingDone = useCallback((idx) => {
    _handleTypingDone(idx);
    if (idx === 0 && (!user || curPkg.id === 'basic') && !IS_BETA) {
      setTimeout(() => setShowSubNudge(true), 800);
    }
  }, [_handleTypingDone, user, curPkg]);

  // ── 온보딩 완료 ──
  const handleOnboardingFinish = useCallback(() => {
    saveSettings({ onboarded: true });
    setStep(0);
  }, [saveSettings, setStep]);

  // ── 퀴즈 답변 ──
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

  // ── 퀴즈 건너뛰기 ──
  const handleQuizSkip = useCallback((currentQIdx) => {
    saveSettings({ quizState: { ...quiz, nextQIdx: Math.min(currentQIdx + 1, DAILY_QUESTIONS.length) } });
  }, [quiz, saveSettings]);

  // ── 채팅 전송 (overrideText: 칩 클릭 등 직접 텍스트 전달 가능) ──
  const handleSendChat = useCallback((overrideText) => {
    setProfileNudge(null);
    const fn = sendStreamChat || sendChat;
    fn(typeof overrideText === 'string' ? overrideText : undefined);
  }, [sendStreamChat, sendChat]);

  // ── 전체 복사 ──
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

  // ── 이미지 저장 ──
  const shareCard = useCallback((idx) => {
    if (typeof window.gtag === 'function') window.gtag('event', 'image_save');
    const q = selQs[idx] || '';
    const parsedText = parseAccSummary(answers[idx] || '').text;
    saveShareCard({ idx, q, parsedText, isDark, today });
  }, [selQs, answers, isDark, today]);

  const handleSaveReportImage = useCallback((reportText) => {
    if (typeof window.gtag === 'function') window.gtag('event', 'report_image_save');
    saveReportImage({ reportText, isDark, today, name: form?.name });
  }, [isDark, today, form?.name]);

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
  }, [answers, setShareModal]);

  // ── 1:1 운세 공유 카드 저장 (html2canvas DOM 캡처 방식) ──
  const handleShareFortuneCard = useCallback(async () => {
    if (!answers[0]) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'fortune_card_save');
    try {
      showToast?.('카드를 만드는 중이에요... ✨', 'info');
      const dataUrl = await captureShareCard(shareCardRef);
      setCardDataUrl(dataUrl);
      setShareModal({ open: true, title: '카드뉴스 저장', text: '' });
    } catch (err) {
      console.error('[별숨] 카드 캡처 오류:', err);
      showToast?.('카드 생성에 실패했어요. 다시 시도해주세요.', 'error');
    }
  }, [answers, shareCardRef, setShareModal, showToast]);

  // ── 꿈 해몽 카드 공유 ──
  const handleShareDreamCard = useCallback(async (resultText, userName) => {
    const summary = (resultText || '').replace(/\n/g, ' ').slice(0, 120);
    setShareCardType('dream');
    setShareCardName(userName || form?.name || '');
    setCardSummary(summary);
    await new Promise(r => setTimeout(r, 100));
    try {
      showToast?.('카드를 만드는 중이에요... ✨', 'info');
      const dataUrl = await captureShareCard(shareCardRef);
      setCardDataUrl(dataUrl);
      setShareModal({ open: true, title: '꿈 해몽 카드 저장', text: '' });
    } catch (err) {
      console.error('[별숨] 꿈 카드 캡처 오류:', err);
      showToast?.('카드 생성에 실패했어요.', 'error');
    } finally {
      setShareCardType('horoscope');
      setShareCardName('');
    }
  }, [shareCardRef, setShareModal, showToast, form?.name]);

  // ── 택일 카드 공유 ──
  const handleShareTaegilCard = useCallback(async (topDateLabel, eventType, userName) => {
    const summary = topDateLabel ? `${eventType || ''}에 가장 좋은 날\n${topDateLabel}` : '';
    setShareCardType('taegil');
    setShareCardName(userName || form?.name || '');
    setCardSummary(summary);
    await new Promise(r => setTimeout(r, 100));
    try {
      showToast?.('카드를 만드는 중이에요... ✨', 'info');
      const dataUrl = await captureShareCard(shareCardRef);
      setCardDataUrl(dataUrl);
      setShareModal({ open: true, title: '택일 카드 저장', text: '' });
    } catch (err) {
      console.error('[별숨] 택일 카드 캡처 오류:', err);
      showToast?.('카드 생성에 실패했어요.', 'error');
    } finally {
      setShareCardType('horoscope');
      setShareCardName('');
    }
  }, [shareCardRef, setShareModal, showToast, form?.name]);

  return {
    copyDone, profileNudge, setProfileNudge, showSubNudge,
    handleTypingDone, handleOnboardingFinish,
    handleQuizAnswer, handleQuizSkip,
    handleSendChat, handleCopyAll,
    shareCard, handleSaveReportImage, handleSaveProphecyImage, handleSaveCompatImage, handleSaveChatImage,
    shareResult, handleShareFortuneCard,
    handleShareDreamCard, handleShareTaegilCard,
    shareCardRef, cardDataUrl, cardSummary, shareCardType, shareCardName,
  };
}
