import { useState, useRef, useCallback, useEffect } from "react";
import { stripMarkdown, PKGS, TIMING, LOAD_STATES } from "../utils/constants.js";

// 베타 기간 종료 시 false로 변경 (또는 서버 설정으로 대체)
const IS_BETA = true;
import { getTimeSlot, TIME_CONFIG } from "../utils/time.js";
import { loadHistory, addHistory } from "../utils/history.js";

const SLOT_TAG_MAP = { morning: '[오전·100자]', afternoon: '[오후·100자]', evening: '[저녁·100자]', dawn: '[새벽·100자]' };

const ERR_MSG = '별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.';

function getDailyKey() {
  const d = new Date();
  return `byeolsoom_daily_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

export function useConsultation(buildCtx, formOk) {
  const [timeSlot, setTimeSlot] = useState(() => getTimeSlot());
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadMsgRef = useRef(null);

  // timeSlot 반응성: 앱 복귀 시 + 1분마다 재계산
  useEffect(() => {
    const update = () => setTimeSlot(getTimeSlot());
    const interval = setInterval(update, 60000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', update); };
  }, []);

  const [step, setStep]                   = useState(0);
  const [cat, setCat]                     = useState(0);
  const [selQs, setSelQs]                 = useState([]);
  const [diy, setDiy]                     = useState('');
  const [pkg, setPkg]                     = useState('premium'); // 베타 기간: 기본값 프리미엄
  const [answers, setAnswers]             = useState([]);
  const [openAcc, setOpenAcc]             = useState(0);
  const [typedSet, setTypedSet]           = useState(new Set());
  const [chatHistory, setChatHistory]     = useState([]);
  const [chatInput, setChatInput]         = useState('');
  const [chatLoading, setChatLoading]     = useState(false);
  const [chatUsed, setChatUsed]           = useState(0);
  const [latestChatIdx, setLatestChatIdx] = useState(-1);
  const [reportText, setReportText]       = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [histItem, setHistItem]           = useState(null);
  const [histItems, setHistItems]         = useState(() => loadHistory());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // 질문별 개별 로딩 상태: 'pending' | 'loading' | 'done' | 'error'
  const [qLoadStatus, setQLoadStatus]     = useState([]);
  // 오늘 별숨 카드 (하루 1회 캐싱)
  const [dailyResult, setDailyResult]     = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(getDailyKey()) || 'null');
      return (parsed && typeof parsed.text === 'string') ? parsed : null;
    } catch { return null; }
  });
  const [dailyLoading, setDailyLoading]   = useState(false);
  const chatEndRef = useRef(null);

  const curPkg   = PKGS.find(p => p.id === pkg) || PKGS[1]; // fallback: premium
  const maxQ     = curPkg.q;
  const maxChat  = curPkg.chat;
  const chatLeft = maxChat - chatUsed;

  // ── API 호출 (최대 3회 재시도) ──
  const callApi = useCallback(async (userMessage, opts = {}) => {
    const maxRetries = 3;
    let lastErr;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        const res  = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage,
            context: buildCtx(),
            isChat: opts.isChat || false,
            isReport: opts.isReport || false,
            isLetter: opts.isLetter || false,
            isStory: opts.isStory || false,
            isScenario: opts.isScenario || false,
            isNatal: opts.isNatal || false,
            isZodiac: opts.isZodiac || false,
            isComprehensive: opts.isComprehensive || false,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API 오류');
        return stripMarkdown(data.text || '');
      } catch (e) {
        lastErr = e;
        if (attempt < maxRetries - 1) continue;
      }
    }
    throw lastErr;
  }, [buildCtx]);

  // ── 질문 추가/삭제 ──
  const addQ = useCallback(q => {
    if (selQs.length < maxQ && !selQs.includes(q)) { setSelQs(p => [...p, q]); setDiy(''); }
  }, [selQs, maxQ]);
  const rmQ = useCallback(i => setSelQs(p => p.filter((_, x) => x !== i)), []);

  // ── 로딩 메시지 순환 ──
  const startLoadingMsg = useCallback(() => {
    setLoadingMsgIdx(0);
    loadMsgRef.current = setInterval(() => {
      setLoadingMsgIdx(p => (p + 1) % LOAD_STATES.length);
    }, TIMING.skeletonCycle);
  }, []);
  const stopLoadingMsg = useCallback(() => {
    if (loadMsgRef.current) { clearInterval(loadMsgRef.current); loadMsgRef.current = null; }
  }, []);

  // ── 질문 전송 ──
  const askClaude = useCallback(async () => {
    if (!selQs.length) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'ask_claude', { question_count: selQs.length });
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    // 질문별 초기 로딩 상태 설정
    setQLoadStatus(selQs.map(() => 'loading'));
    startLoadingMsg();
    // 각 질문을 개별 추적하며 병렬 처리
    const results = await Promise.allSettled(
      selQs.map((q, i) =>
        callApi(`[질문]\n${q}`).then(ans => {
          setQLoadStatus(prev => { const s = [...prev]; s[i] = 'done'; return s; });
          return ans;
        }).catch(err => {
          setQLoadStatus(prev => { const s = [...prev]; s[i] = 'error'; return s; });
          throw err;
        })
      )
    );
    stopLoadingMsg();
    const newAnswers = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : `Q${i + 1} 답변을 불러오지 못했어요 🌙\n잠시 후 다시 시도해봐요.`
    );
    setAnswers(newAnswers);
    addHistory(selQs, newAnswers);
    setHistItems(loadHistory());
    setLatestChatIdx(-1);
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [selQs, callApi, startLoadingMsg, stopLoadingMsg]);

  const askQuick = useCallback(async (q) => {
    if (!q.trim()) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'ask_quick', { question: q.slice(0, 30) });
    if (!formOk) { setSelQs([q.trim()]); setStep(1); return; }
    setSelQs([q.trim()]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${q.trim()}`);
      setAnswers([ans]); addHistory([q.trim()], [ans]); setHistItems(loadHistory());
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, callApi]);

  const askTimeSlot = useCallback(async (prompt) => {
    if (!formOk) { setStep(1); return; }
    const q = TIME_CONFIG[timeSlot].label;
    setSelQs([q]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${prompt}`);
      setAnswers([ans]); addHistory([q], [ans]); setHistItems(loadHistory());
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, timeSlot, callApi]);

  const askDailyHoroscope = useCallback(async () => {
    if (!formOk) { setStep(1); return; }
    if (typeof window.gtag === 'function') window.gtag('event', 'daily_horoscope_click');
    // 이미 오늘 결과가 있으면 바로 보여줌 (API 호출 없음)
    const cached = (() => {
      try {
        const parsed = JSON.parse(localStorage.getItem(getDailyKey()) || 'null');
        return (parsed && typeof parsed.text === 'string') ? parsed : null;
      } catch { return null; }
    })();
    if (cached) { if (typeof window.gtag === 'function') window.gtag('event', 'daily_horoscope_cache_hit'); setDailyResult(cached); return; }
    // 없으면 메인 프롬프트로 새로 불러오기
    setDailyLoading(true);
    try {
      const ans = await callApi('오늘 하루 나의 별숨은?');
      const result = { text: ans };
      localStorage.setItem(getDailyKey(), JSON.stringify(result));
      setDailyResult(result);
      addHistory(['오늘 하루 나의 별숨은?'], [ans]);
      setHistItems(loadHistory());
    } catch { /* 에러는 버튼 상태로만 처리 */ }
    finally { setDailyLoading(false); }
  }, [formOk, callApi]);

  const askReview = useCallback(async (text, prompt) => {
    if (!formOk) { setStep(1); return; }
    const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`;
    setSelQs([q]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
      setAnswers([ans]); addHistory([q], [ans]); setHistItems(loadHistory());
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, callApi]);

  // ── 단일 답변 재시도 ──
  const retryAnswer = useCallback(async (idx) => {
    const q = selQs[idx];
    if (!q) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'retry_answer', { idx });
    setAnswers(prev => { const a = [...prev]; a[idx] = ''; return a; });
    try {
      const ans = await callApi(`[질문]\n${q}`);
      setAnswers(prev => { const a = [...prev]; a[idx] = ans; return a; });
    } catch {
      setAnswers(prev => { const a = [...prev]; a[idx] = ERR_MSG; return a; });
    }
  }, [selQs, callApi]);

  // ── 아코디언 ──
  const handleTypingDone = useCallback((idx) => {
    setTypedSet(p => { const n = new Set(p); n.add(idx); return n; });
    const next = idx + 1;
    if (next < selQs.length) {
      setTimeout(() => {
        setOpenAcc(next);
        setTimeout(() => { setOpenAcc(p => p === next ? -1 : p); }, 800);
      }, 400);
    }
  }, [selQs.length]);

  const handleAccToggle = useCallback(i => { setOpenAcc(p => p === i ? -1 : i); }, []);

  // ── 채팅 ──
  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    if (chatLeft <= 0) { if (typeof window.gtag === 'function') window.gtag('event', 'chat_limit_reached'); setShowUpgradeModal(true); return; }
    if (typeof window.gtag === 'function') window.gtag('event', 'send_chat');
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(p => [...p, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    setChatUsed(p => p + 1);
    const prevQAs  = selQs.map((q, i) => `[질문 ${i + 1}] ${q}\n[답변] ${answers[i] || ''}`).join('\n\n');
    const prevChat = chatHistory.map(m => `[${m.role === 'ai' ? '별숨' : '나'}] ${m.text}`).join('\n');
    const fullMsg  = `[이전 상담]\n${prevQAs}\n\n[이전 대화]\n${prevChat}\n\n[새 질문]\n${userMsg}`;
    try {
      const aiText = await callApi(fullMsg, { isChat: true });
      setChatHistory(p => { const updated = [...p, { role: 'ai', text: aiText }]; setLatestChatIdx(updated.length - 1); return updated; });
    } catch { setChatHistory(p => [...p, { role: 'ai', text: '앗, 잠깐 연결이 끊겼어요 🌙 다시 시도해봐요!' }]); }
    finally { setChatLoading(false); }
  }, [chatInput, chatLoading, chatLeft, selQs, answers, chatHistory, callApi]);

  // ── 월간 리포트 ──
  const genReport = useCallback(async () => {
    if (!IS_BETA && curPkg.id === 'basic') {
      setShowUpgradeModal(true);
      return;
    }
    if (typeof window.gtag === 'function') window.gtag('event', 'gen_report');
    setReportText(''); setReportLoading(true);
    try {
      const text = await callApi('[요청] 이번 달 종합 운세 리포트', { isReport: true });
      setReportText(text);
    } catch { setReportText('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!'); }
    finally { setReportLoading(false); }
  }, [callApi]);

  return {
    timeSlot,
    loadingMsgIdx,
    step, setStep,
    cat, setCat,
    selQs, setSelQs,
    diy, setDiy,
    pkg, setPkg,
    answers, setAnswers,
    openAcc, setOpenAcc,
    typedSet, setTypedSet,
    chatHistory, chatInput, setChatInput, chatLoading, chatUsed, latestChatIdx,
    chatLeft, maxQ, maxChat, curPkg,
    reportText, reportLoading,
    histItem, setHistItem, histItems, setHistItems,
    showUpgradeModal, setShowUpgradeModal,
    chatEndRef,
    qLoadStatus,
    callApi,
    addQ, rmQ,
    dailyResult, dailyLoading,
    askClaude, askQuick, askTimeSlot, askDailyHoroscope, askReview,
    retryAnswer,
    handleTypingDone, handleAccToggle,
    sendChat, genReport,
    // reset
    resetSession: useCallback(() => {
      setChatHistory([]);
      setChatUsed(0);
    }, []),
  };
}
