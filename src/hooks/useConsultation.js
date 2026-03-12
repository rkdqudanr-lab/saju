import { useState, useRef, useCallback, useMemo } from "react";
import { stripMarkdown, PKGS } from "../utils/constants.js";
import { getTimeSlot, TIME_CONFIG } from "../utils/time.js";
import { loadHistory, addHistory } from "../utils/history.js";

const SLOT_TAG_MAP = { morning: '[오전·100자]', afternoon: '[오후·100자]', evening: '[저녁·100자]', dawn: '[새벽·100자]' };

const ERR_MSG = '별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.';

export function useConsultation(buildCtx, formOk) {
  const timeSlot = useMemo(() => getTimeSlot(), []);

  const [step, setStep]                   = useState(0);
  const [cat, setCat]                     = useState(0);
  const [selQs, setSelQs]                 = useState([]);
  const [diy, setDiy]                     = useState('');
  const [pkg, setPkg]                     = useState('free');
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
  const chatEndRef = useRef(null);

  const curPkg   = PKGS.find(p => p.id === pkg) || PKGS[2];
  const maxQ     = curPkg.q;
  const maxChat  = curPkg.chat;
  const chatLeft = maxChat - chatUsed;

  // ── API 호출 ──
  const callApi = useCallback(async (userMessage, opts = {}) => {
    const res  = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage, context: buildCtx(), isChat: opts.isChat || false, isReport: opts.isReport || false }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API 오류');
    return stripMarkdown(data.text || '');
  }, [buildCtx]);

  // ── 질문 추가/삭제 ──
  const addQ = useCallback(q => {
    if (selQs.length < maxQ && !selQs.includes(q)) { setSelQs(p => [...p, q]); setDiy(''); }
  }, [selQs, maxQ]);
  const rmQ = useCallback(i => setSelQs(p => p.filter((_, x) => x !== i)), []);

  // ── 질문 전송 ──
  const askClaude = useCallback(async () => {
    if (!selQs.length) return;
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    const results = await Promise.allSettled(selQs.map(q => callApi(`[질문]\n${q}`)));
    const newAnswers = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : `Q${i + 1} 답변을 불러오지 못했어요 🌙\n잠시 후 다시 시도해봐요.`
    );
    setAnswers(newAnswers);
    addHistory(selQs, newAnswers);
    setHistItems(loadHistory());
    setLatestChatIdx(-1);
    setStep(4); setOpenAcc(0);
  }, [selQs, callApi]);

  const askQuick = useCallback(async (q) => {
    if (!q.trim()) return;
    if (!formOk) { setSelQs([q.trim()]); setStep(1); return; }
    setSelQs([q.trim()]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${q.trim()}`);
      setAnswers([ans]); addHistory([q.trim()], [ans]); setHistItems(loadHistory());
    } catch { setAnswers([ERR_MSG]); }
    setStep(4); setOpenAcc(0);
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
    setStep(4); setOpenAcc(0);
  }, [formOk, timeSlot, callApi]);

  const askDailyHoroscope = useCallback(async () => {
    if (!formOk) { setStep(1); return; }
    const tag = SLOT_TAG_MAP[timeSlot];
    const q   = '오늘 하루 나의 별숨은?';
    setSelQs([q]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`${tag} ${TIME_CONFIG[timeSlot].prompt}`);
      setAnswers([ans]); addHistory([q], [ans]); setHistItems(loadHistory());
    } catch { setAnswers([ERR_MSG]); }
    setStep(4); setOpenAcc(0);
  }, [formOk, timeSlot, callApi]);

  const askReview = useCallback(async (text, prompt) => {
    if (!formOk) { setStep(1); return; }
    const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`;
    setSelQs([q]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
      setAnswers([ans]); addHistory([q], [ans]); setHistItems(loadHistory());
    } catch { setAnswers([ERR_MSG]); }
    setStep(4); setOpenAcc(0);
  }, [formOk, callApi]);

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
    if (chatLeft <= 0) { setShowUpgradeModal(true); return; }
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
    setStep(6); setReportText(''); setReportLoading(true);
    try {
      const text = await callApi('[요청] 이번 달 종합 운세 리포트', { isReport: true });
      setReportText(text);
    } catch { setReportText('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!'); }
    finally { setReportLoading(false); }
  }, [callApi]);

  return {
    timeSlot,
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
    callApi,
    addQ, rmQ,
    askClaude, askQuick, askTimeSlot, askDailyHoroscope, askReview,
    handleTypingDone, handleAccToggle,
    sendChat, genReport,
    // reset
    resetSession: useCallback(() => {
      setChatHistory([]);
      setChatUsed(0);
    }, []),
  };
}
