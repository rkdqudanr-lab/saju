import { useState, useRef, useCallback, useEffect } from "react";
import { stripMarkdown, PKGS, TIMING, LOAD_STATES } from "../utils/constants.js";

// 베타 기간 종료 시 false로 변경 (또는 서버 설정으로 대체)
const IS_BETA = true;
import { getTimeSlot, TIME_CONFIG } from "../utils/time.js";
import { loadHistory, addHistory, deleteHistory } from "../utils/history.js";
import { supabase, getAuthenticatedClient } from '../lib/supabase.js';

const SLOT_TAG_MAP = { morning: '[오전·100자]', afternoon: '[오후·100자]', evening: '[저녁·100자]', dawn: '[새벽·100자]' };
const ERR_MSG = '별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.';

function getDailyKey() {
  const d = new Date();
  return `byeolsoom_daily_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}
function getDailyCountKey() {
  const d = new Date();
  return `byeolsoom_daily_count_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}
const DAILY_MAX = 3;
function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Supabase daily_cache 헬퍼 ──
async function loadDailyCacheFromSupabase(userId, type) {
  if (!supabase || !userId) return null;
  try {
    const authClient = getAuthenticatedClient(userId);
    const { data } = await (authClient || supabase)
      .from('daily_cache')
      .select('content')
      .eq('kakao_id', userId)
      .eq('cache_date', getTodayDateStr())
      .eq('cache_type', type)
      .single();
    return data?.content || null;
  } catch { return null; }
}

async function saveDailyCacheToSupabase(userId, type, content) {
  if (!supabase || !userId) return;
  try {
    const authClient = getAuthenticatedClient(userId);
    await (authClient || supabase).from('daily_cache').upsert({
      kakao_id:   userId,
      cache_date: getTodayDateStr(),
      cache_type: type,
      content,
    }, { onConflict: 'kakao_id,cache_date,cache_type' });
  } catch (e) {
    console.error('[별숨] daily_cache 저장 오류:', e);
  }
}

/**
 * @param {Function} buildCtx
 * @param {boolean} formOk
 * @param {object|null} user - 로그인 사용자 ({ id, supabaseId, ... })
 * @param {object} consentFlags - 동의 플래그
 * @param {string} responseStyle - 응답 스타일 ('T'|'M'|'F')
 * @param {Function} [onLoginRequired] - 로그인 필요 시 호출할 콜백 (카카오 로그인 트리거)
 */
export function useConsultation(buildCtx, formOk, user, consentFlags, responseStyle, onLoginRequired) {
  const [timeSlot, setTimeSlot] = useState(() => getTimeSlot());
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadMsgRef = useRef(null);

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
  const [pkg, setPkg]                     = useState('premium');
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
  const [qLoadStatus, setQLoadStatus]     = useState([]);
  const [retryMsg, setRetryMsg]           = useState('');

  // 오늘 별숨 카드: 초기값은 localStorage 캐시 (빠른 로드), 이후 Supabase에서 덮어씀
  const [dailyResult, setDailyResult] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(getDailyKey()) || 'null');
      return (parsed && typeof parsed.text === 'string') ? parsed : null;
    } catch { return null; }
  });
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(() => {
    try { return parseInt(localStorage.getItem(getDailyCountKey()) || '0', 10); } catch { return 0; }
  });

  // 일기 회고: 초기값은 localStorage 캐시, 이후 Supabase에서 덮어씀
  const [diaryReviewResult, setDiaryReviewResult] = useState(() => {
    try {
      const key = `byeolsoom_diary_review_${getTodayDateStr().replace(/-/g, '')}`;
      return localStorage.getItem(key) || null;
    } catch { return null; }
  });
  const [diaryReviewLoading, setDiaryReviewLoading] = useState(false);

  const chatEndRef = useRef(null);
  const curPkg   = PKGS.find(p => p.id === pkg) || PKGS[1];
  const maxQ     = curPkg.q;
  const maxChat  = curPkg.chat;
  const chatLeft = maxChat - chatUsed;

  // ── 로그인 시 Supabase에서 히스토리 로드 ──
  useEffect(() => {
    if (!supabase || !user?.id) {
      setHistItems(loadHistory());
      return;
    }
    const authClient = getAuthenticatedClient(user.id);
    (authClient || supabase)
      .from('consultation_history')
      .select('id, questions, answers, slot, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const items = data.map(row => {
            const dt = new Date(row.created_at);
            const dateStr = `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
            return {
              id: row.id,
              supabaseId: row.id,
              date: dateStr,
              ts: dt.getTime(),
              slot: row.slot || 'morning',
              questions: row.questions || [],
              answers: row.answers || [],
            };
          });
          setHistItems(items);
        } else {
          setHistItems(loadHistory());
        }
      })
      .catch(() => setHistItems(loadHistory()));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 로그인 시 Supabase에서 오늘 캐시 로드 ──
  useEffect(() => {
    if (!user?.id) return;
    loadDailyCacheFromSupabase(user.id, 'horoscope').then(content => {
      if (content) setDailyResult({ text: content });
    });
    loadDailyCacheFromSupabase(user.id, 'diary_review').then(content => {
      if (content) setDiaryReviewResult(content);
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── API 호출 (최대 3회 재시도) ──
  const callApi = useCallback(async (userMessage, opts = {}) => {
    // 로그인 필수 체크
    if (!user?.id) {
      if (typeof onLoginRequired === 'function') onLoginRequired();
      throw new Error('LOGIN_REQUIRED');
    }

    const maxRetries = 3;
    let lastErr;
    const style = responseStyle || 'M';
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const msgs = ['별이 잠시 바빠요. 다시 불러오는 중이에요... (1/3)', '조금 더 기다려봐요... (2/3)'];
          setRetryMsg(msgs[attempt - 1] || '');
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage,
            context: buildCtx(),
            kakaoId:         user.id,
            isChat:          opts.isChat          || false,
            isReport:        opts.isReport        || false,
            isLetter:        opts.isLetter        || false,
            isStory:         opts.isStory         || false,
            isScenario:      opts.isScenario      || false,
            isNatal:         opts.isNatal         || false,
            isZodiac:        opts.isZodiac        || false,
            isComprehensive: opts.isComprehensive || false,
            responseStyle:   style,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API 오류');
        setRetryMsg('');
        return stripMarkdown(data.text || '');
      } catch (e) {
        lastErr = e;
        if (attempt < maxRetries - 1) continue;
      }
    }
    setRetryMsg('');
    throw lastErr;
  }, [buildCtx, responseStyle, user?.id, onLoginRequired]);

  // ── 질문 추가/삭제 ──
  const addQ = useCallback(q => {
    if (selQs.length < maxQ && !selQs.includes(q)) { setSelQs(p => [...p, q]); setDiy(''); }
  }, [selQs, maxQ]);
  const rmQ = useCallback(i => setSelQs(p => p.filter((_, x) => x !== i)), []);

  // ── 로딩 메시지 순환 ──
  const startLoadingMsg = useCallback(() => {
    setLoadingMsgIdx(0);
    loadMsgRef.current = setInterval(() => setLoadingMsgIdx(p => (p + 1) % LOAD_STATES.length), TIMING.skeletonCycle);
  }, []);
  const stopLoadingMsg = useCallback(() => {
    if (loadMsgRef.current) { clearInterval(loadMsgRef.current); loadMsgRef.current = null; }
  }, []);

  // ── Supabase 상담기록 저장 ──
  const saveHistoryToSupabase = useCallback(async (questions, answersArr, slot) => {
    if (!supabase) return;
    // history 동의 여부 확인
    if (consentFlags?.history === false) return;
    try {
      const kakaoId = user?.id;
      if (!kakaoId) return;
      let supabaseUserId = user?.supabaseId || null;
      if (!supabaseUserId) {
        const { data: userRow } = await supabase.from('users').select('id').eq('kakao_id', String(kakaoId)).single();
        supabaseUserId = userRow?.id || null;
      }
      if (!supabaseUserId) return;
      const authClient = getAuthenticatedClient(kakaoId);
      const { data: inserted, error } = await (authClient || supabase).from('consultation_history').insert({
        user_id: supabaseUserId, questions, answers: answersArr, slot,
      }).select('id').single();
      if (error) { console.error('[별숨] 상담기록 Supabase 저장 오류:', error); return; }
      // histItems에 새 항목 prepend
      if (inserted?.id) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        setHistItems(prev => [{
          id: inserted.id, supabaseId: inserted.id, date: dateStr,
          ts: now.getTime(), slot, questions, answers: answersArr,
        }, ...prev.filter(i => i.supabaseId !== inserted.id)].slice(0, 50));
      }
    } catch (e) {
      console.error('[별숨] 상담기록 Supabase 저장 오류:', e);
    }
  }, [user, consentFlags]);

  // ── 로컬 히스토리에도 저장 (비로그인 사용자 지원) ──
  const recordHistory = useCallback((questions, answersArr) => {
    if (!user?.id) {
      addHistory(questions, answersArr);
      setHistItems(loadHistory());
    }
  }, [user?.id]);

  // ── Supabase 상담기록 삭제 ──
  const deleteHistoryItem = useCallback(async (id, supabaseId) => {
    // 로컬 히스토리 삭제
    deleteHistory(id);
    setHistItems(prev => prev.filter(i => i.id !== id));
    // Supabase 삭제
    if (supabase && supabaseId && user?.id) {
      try {
        const authClient = getAuthenticatedClient(user.id);
        await (authClient || supabase).from('consultation_history').delete().eq('id', supabaseId);
      } catch (e) {
        console.error('[별숨] 상담기록 삭제 오류:', e);
      }
    }
  }, [user]);

  // ── 질문 전송 ──
  const askClaude = useCallback(async () => {
    if (!selQs.length) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'ask_claude', { question_count: selQs.length });
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    setQLoadStatus(selQs.map(() => 'loading'));
    startLoadingMsg();
    const results = await Promise.allSettled(
      selQs.map((q, i) =>
        callApi(`[질문]\n${q}`).then(ans => {
          setQLoadStatus(prev => { const s = [...prev]; s[i] = 'done'; return s; }); return ans;
        }).catch(err => {
          setQLoadStatus(prev => { const s = [...prev]; s[i] = 'error'; return s; }); throw err;
        })
      )
    );
    stopLoadingMsg();
    const newAnswers = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : `Q${i + 1} 답변을 불러오지 못했어요 🌙\n잠시 후 다시 시도해봐요.`
    );
    setAnswers(newAnswers);
    recordHistory(selQs, newAnswers);
    saveHistoryToSupabase(selQs, newAnswers, timeSlot);
    setLatestChatIdx(-1);
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [selQs, callApi, startLoadingMsg, stopLoadingMsg, saveHistoryToSupabase, recordHistory, timeSlot]);

  const askQuick = useCallback(async (q) => {
    if (!q.trim()) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'ask_quick', { question: q.slice(0, 30) });
    if (!formOk) { setSelQs([q.trim()]); setStep(1); return; }
    setSelQs([q.trim()]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${q.trim()}`);
      setAnswers([ans]); recordHistory([q.trim()], [ans]);
      saveHistoryToSupabase([q.trim()], [ans], timeSlot);
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, callApi, saveHistoryToSupabase, recordHistory, timeSlot]);

  const askTimeSlot = useCallback(async (prompt) => {
    if (!formOk) { setStep(1); return; }
    const q = TIME_CONFIG[timeSlot].label;
    setSelQs([q]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${prompt}`);
      setAnswers([ans]); recordHistory([q], [ans]);
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, timeSlot, callApi, recordHistory]);

  const askDailyHoroscope = useCallback(async () => {
    if (!formOk) { setStep(1); return; }
    if (dailyCount >= DAILY_MAX) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'daily_horoscope_click');
    setDailyLoading(true);
    try {
      const ans = await callApi('오늘 하루 나의 별숨은?');
      const result = { text: ans };
      const newCount = dailyCount + 1;
      try { localStorage.setItem(getDailyKey(), JSON.stringify(result)); } catch {}
      try { localStorage.setItem(getDailyCountKey(), String(newCount)); } catch {}
      setDailyResult(result);
      setDailyCount(newCount);
      if (user?.id) await saveDailyCacheToSupabase(user.id, 'horoscope', ans);
      recordHistory(['오늘 하루 나의 별숨은?'], [ans]);
      saveHistoryToSupabase(['오늘 하루 나의 별숨은?'], [ans], timeSlot);
    } catch { /* 에러는 버튼 상태로 처리 */ }
    finally { setDailyLoading(false); }
  }, [formOk, callApi, dailyCount, saveHistoryToSupabase, recordHistory, timeSlot, user?.id]);

  const askReview = useCallback(async (text, prompt) => {
    if (!formOk) { setStep(1); return; }
    const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`;
    setSelQs([q]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
      setAnswers([ans]); recordHistory([q], [ans]);
      saveHistoryToSupabase([q], [ans], timeSlot);
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, callApi, saveHistoryToSupabase, recordHistory, timeSlot]);

  const askDiaryReview = useCallback(async (text, prompt) => {
    if (!formOk) { setStep(1); return; }
    setDiaryReviewLoading(true);
    try {
      const ans = await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
      setDiaryReviewResult(ans);
      // localStorage 캐시
      try { localStorage.setItem(`byeolsoom_diary_review_${getTodayDateStr().replace(/-/g, '')}`, ans); } catch {}
      // Supabase 저장
      if (user?.id) await saveDailyCacheToSupabase(user.id, 'diary_review', ans);
      const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`;
      recordHistory([q], [ans]);
      saveHistoryToSupabase([q], [ans], timeSlot);
    } catch { setDiaryReviewResult(ERR_MSG); }
    finally { setDiaryReviewLoading(false); }
  }, [formOk, callApi, saveHistoryToSupabase, recordHistory, timeSlot, user?.id]);

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
      setTimeout(() => { setOpenAcc(next); setTimeout(() => { setOpenAcc(p => p === next ? -1 : p); }, 800); }, 400);
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
    if (!IS_BETA && curPkg.id === 'basic') { setShowUpgradeModal(true); return; }
    if (typeof window.gtag === 'function') window.gtag('event', 'gen_report');
    setReportText(''); setReportLoading(true);
    try {
      const text = await callApi('[요청] 이번 달 종합 운세 리포트', { isReport: true });
      setReportText(text);
    } catch { setReportText('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!'); }
    finally { setReportLoading(false); }
  }, [callApi, curPkg]);

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
    callApi, retryMsg,
    addQ, rmQ,
    dailyResult, dailyLoading, dailyCount, DAILY_MAX,
    diaryReviewResult, diaryReviewLoading,
    askClaude, askQuick, askTimeSlot, askDailyHoroscope, askReview, askDiaryReview,
    retryAnswer,
    handleTypingDone, handleAccToggle,
    sendChat, genReport,
    deleteHistoryItem,
    resetSession: useCallback(() => { setChatHistory([]); setChatUsed(0); }, []),
  };
}
