import { useState, useRef, useCallback, useEffect } from "react";
import { stripMarkdown, PKGS, TIMING, LOAD_STATES } from "../utils/constants.js";
import { getAuthToken } from "./useUserProfile.js";
import { useAppStore } from "../store/useAppStore.js";
import { getTimeSlot, TIME_CONFIG } from "../utils/time.js";
import { loadHistory, addHistory, deleteHistory } from "../utils/history.js";
import { supabase, getAuthenticatedClient } from '../lib/supabase.js';
import { parseHoroscopeForGamification } from '../utils/missionGenerator.js';
import { spendBP as spendBPUtil } from '../utils/gamificationLogic.js';

const BM_COST_PER_ASK = 10; // BP cost per question (베타 기간)

// 베타 기간 종료 시 false로 변경 (또는 서버 설정으로 대체)
const IS_BETA = true;

const SLOT_TAG_MAP = { morning: '[오전·100자]', afternoon: '[오후·100자]', evening: '[저녁·100자]', dawn: '[새벽·100자]' };
const ERR_MSG = '별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.';
export const DAILY_MAX = 999; // 베타 기간: 일일 제한 없음 (BM 차감 방식으로 대체)

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
      .eq('kakao_id', String(userId))
      .eq('cache_date', getTodayDateStr())
      .eq('cache_type', type)
      .maybeSingle();
    return data?.content || null;
  } catch { return null; }
}

async function saveDailyCacheToSupabase(userId, type, content) {
  if (!supabase || !userId) return;
  try {
    const authClient = getAuthenticatedClient(userId);
    await (authClient || supabase).from('daily_cache').upsert({
      kakao_id:   String(userId),
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
 * @param {Function} [onSessionExpired] - 서버가 401 반환 시 호출할 콜백 (자동 로그아웃 등)
 */
export function useConsultation(buildCtx, formOk, user, consentFlags, responseStyle, onLoginRequired, onDailyLimitReached, showToast, onSessionExpired, onMissionsSaved) {
  const [timeSlot, setTimeSlot] = useState(() => getTimeSlot());
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadMsgRef = useRef(null);

  useEffect(() => {
    const update = () => setTimeSlot(getTimeSlot());
    const interval = setInterval(update, 60000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', update); };
  }, []);

  // step / showUpgradeModal은 Zustand store에서 관리
  const step               = useAppStore((s) => s.step);
  const setStep            = useAppStore((s) => s.setStep);
  const showUpgradeModal   = useAppStore((s) => s.showUpgradeModal);
  const setShowUpgradeModal = useAppStore((s) => s.setShowUpgradeModal);

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
  const [histItems, setHistItems]         = useState([]);
  const [qLoadStatus, setQLoadStatus]     = useState([]);
  const [retryMsg, setRetryMsg]           = useState('');

  // 오늘 별숨 카드 — Supabase에서만 로드/저장
  const [dailyResult, setDailyResult] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  // 일기 회고 — Supabase에서만 로드/저장
  const [diaryReviewResult, setDiaryReviewResult] = useState(null);
  const [diaryReviewLoading, setDiaryReviewLoading] = useState(false);

  const streamAbortRef = useRef(null);
  useEffect(() => {
    return () => {
      if (streamAbortRef.current) streamAbortRef.current.abort();
    };
  }, []);

  const chatEndRef = useRef(null);
  const curPkg   = PKGS.find(p => p.id === pkg) || PKGS[1];
  const maxQ     = curPkg.q;
  const maxChat  = curPkg.chat;
  const chatLeft = maxChat - chatUsed;

  // ── 로그인 시 Supabase에서 히스토리 로드 ──
  useEffect(() => {
    if (!supabase || !user?.id) {
      setHistItems([]);
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
        }
      })
      .catch((e) => {
        console.error('[별숨] 상담 기록 로드 오류:', e);
        if (typeof showToast === 'function') showToast('상담 기록을 불러오지 못했어요', 'error');
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 로그인 시 Supabase에서 오늘 캐시 로드 ──
  useEffect(() => {
    if (!user?.id) return;
    loadDailyCacheFromSupabase(user.id, 'horoscope').then(content => {
      if (content) {
        const gamData = parseHoroscopeForGamification(content);
        setDailyResult({
          text: content,
          score: gamData.score,
          ...(gamData.badtime?.detected ? { badtime: gamData.badtime } : {}),
        });
      }
    }).catch(e => console.error('[별숨] 오늘 별숨 캐시 로드 오류:', e));
    loadDailyCacheFromSupabase(user.id, 'diary_review').then(content => {
      if (content) setDiaryReviewResult(content);
    }).catch(e => console.error('[별숨] 일기 리뷰 캐시 로드 오류:', e));
    loadDailyCacheFromSupabase(user.id, 'horoscope_count').then(countStr => {
      if (countStr) setDailyCount(parseInt(countStr, 10) || 0);
    }).catch(e => console.error('[별숨] 별숨 횟수 캐시 로드 오류:', e));
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
        const token = getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // 최근 상담 기억 context (오류 시 기본 context로 fallback)
        let fullContext = buildCtx();
        try {
          if (histItems.length > 0) {
            const recentConsults = histItems
              .slice(0, 3)
              .map((h, i) => {
                const q = (Array.isArray(h.questions) ? h.questions : []).join(' ').slice(0, 60);
                const a = (Array.isArray(h.answers) ? h.answers : []).join(' ').slice(0, 60);
                return (q || a) ? `[이전 상담 ${i+1}] ${q}\n→ ${a}` : null;
              })
              .filter(Boolean)
              .join('\n');
            if (recentConsults) fullContext = `[최근 상담 기억]\n${recentConsults}\n\n${buildCtx()}`;
          }
        } catch { /* 이력 주입 실패 시 기본 context 사용 */ }

        // 장착된 아이템 기운을 context에 주입
        {
          const talisman = useAppStore.getState().equippedTalisman;
          // 부적은 일일 운세 호출 시에만
          if (opts.isDaily && talisman) {
            fullContext = fullContext + `\n\n[오늘 장착한 부적: ${talisman.name}]\n효과: ${talisman.description}\n→ 이 부적의 기운을 오늘의 운세 해석에 자연스럽게 반영해줘요. 부적 이름을 직접 언급하지 말고 그 효과가 오행·별자리 해석에 녹아들도록 해요.`;
          }
          // 메인 기운(가챠 아이템)은 모든 AI 호출에 반영
          const sajuItem = useAppStore.getState().equippedSajuItem;
          if (sajuItem) {
            const itemEffect = sajuItem.effect || sajuItem.description || '';
            fullContext = fullContext + `\n\n[장착한 메인 기운: ${sajuItem.name} ${sajuItem.emoji || ''}]\n기운: ${itemEffect}\n→ 이 기운을 답변에 자연스럽게 녹여주세요. 아이템 이름을 직접 언급하지 말고, 이 에너지가 사주·별자리 해석에 자연스럽게 반영되도록 써주세요.`;
          }
        }

        if (opts.isDaily && Array.isArray(opts.transientItems) && opts.transientItems.length > 0) {
          const transientSummary = opts.transientItems
            .map((item, index) => {
              const parts = [item?.name].filter(Boolean);
              if (item?.effect) parts.push(`effect: ${item.effect}`);
              else if (item?.description) parts.push(`description: ${item.description}`);
              return `${index + 1}. ${parts.join(' / ')}`.trim();
            })
            .filter(Boolean)
            .join('\n');
          if (transientSummary) {
            fullContext = fullContext + `\n\n[daily transient items]\n${transientSummary}\nPlease reflect these temporary item effects naturally in today's score interpretation, advice, Do, and caution sections without over-emphasizing item names.`;
          }
        }

        const res = await fetch('/api/ask', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userMessage,
            context: fullContext,
            kakaoId:           user.id,
            isChat:            opts.isChat            || false,
            isReport:          opts.isReport          || false,
            isLetter:          opts.isLetter          || false,
            isProphecy:        opts.isProphecy        || false,
            isStory:           opts.isStory           || false,
            isScenario:        opts.isScenario        || false,
            isNatal:           opts.isNatal           || false,
            isZodiac:          opts.isZodiac          || false,
            isComprehensive:   opts.isComprehensive   || false,
            isCalendarMonth:   opts.isCalendarMonth   || false,
            isSlot:            opts.isSlot            || false,
            isWeekly:          opts.isWeekly          || false,
            isDaily:           opts.isDaily           || false,
            isDaeun:           opts.isDaeun           || false,
            isAnalytics:       opts.isAnalytics       || false,
            responseStyle:     style,
            precision_level:   useAppStore.getState().dataPrecision?.level || 'low',
            clientHour:        new Date().getHours(),
          }),
        });
        // 401: 세션 만료 → 재시도 없이 즉시 로그아웃 + 재로그인 유도
        if (res.status === 401) {
          setRetryMsg('');
          if (typeof onSessionExpired === 'function') onSessionExpired();
          if (typeof showToast === 'function') showToast('세션이 만료됐어요. 다시 로그인해주세요 🌙', 'warn');
          if (typeof onLoginRequired === 'function') onLoginRequired();
          throw new Error('SESSION_EXPIRED');
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API 오류');
        setRetryMsg('');
        return stripMarkdown(data.text || '');
      } catch (e) {
        lastErr = e;
        // 세션 만료는 재시도하지 않음
        if (e?.message === 'SESSION_EXPIRED') throw e;
        if (attempt < maxRetries - 1) continue;
      }
    }
    setRetryMsg('');
    throw lastErr;
  }, [buildCtx, histItems, responseStyle, user?.id, onLoginRequired, onSessionExpired, showToast]);

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
    if (consentFlags?.history === false) return;
    try {
      const kakaoId = user?.id;
      if (!kakaoId) return;
      let supabaseUserId = user?.supabaseId || null;
      if (!supabaseUserId) {
        const authClient = getAuthenticatedClient(kakaoId);
        const { data: userRow } = await (authClient || supabase).from('users').select('id').eq('kakao_id', String(kakaoId)).maybeSingle();
        supabaseUserId = userRow?.id || null;
      }
      if (!supabaseUserId) return;
      const authClient = getAuthenticatedClient(kakaoId);
      const { data: inserted, error } = await (authClient || supabase).from('consultation_history').insert({
        user_id: supabaseUserId, questions, answers: answersArr, slot,
      }).select('id').single();
      if (error) { console.error('[별숨] 상담기록 Supabase 저장 오류:', error); return; }
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

  // ── 로컬 히스토리 (비로그인 — 현재는 no-op) ──
  const recordHistory = useCallback((_questions, _answersArr) => {}, []);

  // ── Supabase 상담기록 삭제 (DB 성공 후 로컬 상태 업데이트) ──
  const deleteHistoryItem = useCallback(async (id, supabaseId) => {
    if (supabase && supabaseId && user?.id) {
      try {
        const authClient = getAuthenticatedClient(user.id);
        await (authClient || supabase).from('consultation_history').delete().eq('id', supabaseId);
        setHistItems(prev => prev.filter(i => i.id !== id)); // DB 성공 후 로컬 반영
      } catch (e) {
        console.error('[별숨] 상담기록 삭제 오류:', e);
      }
    } else {
      setHistItems(prev => prev.filter(i => i.id !== id));
    }
  }, [user]);

  // ── Supabase 상담기록 전체삭제 ──
  const deleteAllHistoryItems = useCallback(async () => {
    if (!user?.id) { setHistItems([]); return; }
    try {
      const authClient = getAuthenticatedClient(user.id);
      // users 테이블에서 supabase UUID 조회 후 consultation_history 전체 삭제
      const { data: userData } = await (authClient || supabase)
        .from('users').select('id').eq('kakao_id', String(user.id)).maybeSingle();
      if (userData?.id) {
        await (authClient || supabase)
          .from('consultation_history').delete().eq('user_id', userData.id);
      }
      setHistItems([]);
    } catch (e) {
      console.error('[별숨] 상담기록 전체삭제 오류:', e);
      setHistItems([]);
    }
  }, [user]);

  // ── 질문 전송 ──
  const askClaude = useCallback(async () => {
    if (!selQs.length) return;

    // BP 차감 (로그인 사용자: 질문 개수 × 10 BP)
    if (user?.id) {
      const totalCost = selQs.length * BM_COST_PER_ASK;
      const confirmed = await useAppStore.getState().showBPConfirm(totalCost, selQs.length);
      if (!confirmed) return;
      const currentBm = useAppStore.getState().gamificationState?.currentBp ?? 0;
      if (currentBm < totalCost) {
        if (showToast) showToast(`BP가 부족해요 (필요: ${totalCost} BP, 보유: ${currentBm} BP)`, 'error');
        return;
      }
      // confirm 직후 즉시 로딩 화면으로 이동 (BP 차감 awaiting 중 질문 페이지 노출 방지)
      if (typeof window.gtag === 'function') window.gtag('event', 'ask_claude', { question_count: selQs.length });
      setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
      const authClient = getAuthenticatedClient(user.id);
      const { ok, newBP } = await spendBPUtil(authClient || supabase, user.id, totalCost, 'ASK_CLAUDE');
      if (!ok) {
        if (showToast) showToast(`BP가 부족해요`, 'error');
        setStep(2); // rollback
        return;
      }
      const cur = useAppStore.getState().gamificationState || {};
      useAppStore.getState().setGamificationData({ gamificationState: { ...cur, currentBp: newBP ?? (currentBm - totalCost) }, missions: useAppStore.getState().missions || [] });
    } else {
      if (typeof window.gtag === 'function') window.gtag('event', 'ask_claude', { question_count: selQs.length });
      setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    }
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
    saveHistoryToSupabase(selQs, newAnswers, timeSlot);
    setLatestChatIdx(-1);
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [selQs, callApi, startLoadingMsg, stopLoadingMsg, saveHistoryToSupabase, timeSlot]);

  const askQuick = useCallback(async (q) => {
    if (!q.trim()) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'ask_quick', { question: q.slice(0, 30) });
    if (!formOk) { setSelQs([q.trim()]); setStep(1); return; }

    // BP 차감 (로그인 사용자만)
    if (user?.id) {
      const confirmed = await useAppStore.getState().showBPConfirm(BM_COST_PER_ASK, 1);
      if (!confirmed) return;
      const currentBm = useAppStore.getState().gamificationState?.currentBp ?? 0;
      if (currentBm < BM_COST_PER_ASK) {
        if (showToast) showToast(`BP가 부족해요 (필요: ${BM_COST_PER_ASK} BP, 보유: ${currentBm} BP)`, 'error');
        return;
      }
      const authClient = getAuthenticatedClient(user.id);
      const { ok, newBP } = await spendBPUtil(authClient || supabase, user.id, BM_COST_PER_ASK, 'ASK_QUICK');
      if (!ok) {
        if (showToast) showToast(`BP가 부족해요`, 'error');
        return;
      }
      const cur = useAppStore.getState().gamificationState || {};
      useAppStore.getState().setGamificationData({ gamificationState: { ...cur, currentBp: newBP ?? (currentBm - BM_COST_PER_ASK) }, missions: useAppStore.getState().missions || [] });
    }

    setSelQs([q.trim()]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${q.trim()}`);
      setAnswers([ans]);
      saveHistoryToSupabase([q.trim()], [ans], timeSlot);
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, user?.id, showToast, callApi, saveHistoryToSupabase, timeSlot]);

  const askTimeSlot = useCallback(async (prompt) => {
    if (!formOk) { setStep(1); return; }
    const q = TIME_CONFIG[timeSlot].label;
    setSelQs([q]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${prompt}`, { isSlot: true });
      setAnswers([ans]);
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, timeSlot, callApi]);

  const askDailyHoroscope = useCallback(async (options = {}) => {
    if (!formOk) { setStep(1); return; }
    if (dailyLoading) return; // 중복 호출 방지
    if (!options.ignoreDailyLimit && dailyCount >= DAILY_MAX) {
      if (typeof onDailyLimitReached === 'function') onDailyLimitReached();
      return;
    }

    const shouldChargeBp = !options.skipBpCharge;
    const shouldConfirm = !options.skipConfirm;
    const shouldSaveHistory = options.saveHistory !== false;
    const shouldIncrementCount = options.incrementCount !== false;

    if (shouldChargeBp && user?.id) {
      if (shouldConfirm) {
        const confirmed = await useAppStore.getState().showBPConfirm(BM_COST_PER_ASK, 1);
        if (!confirmed) return;
      }
      const currentBm = useAppStore.getState().gamificationState?.currentBp ?? 0;
      if (currentBm < BM_COST_PER_ASK) {
        if (showToast) showToast(`BP가 부족해요. (필요: ${BM_COST_PER_ASK} BP, 보유: ${currentBm} BP)`, 'error');
        return;
      }
      const authClient = getAuthenticatedClient(user.id);
      const { ok, newBP } = await spendBPUtil(authClient || supabase, user.id, BM_COST_PER_ASK, 'DAILY_HOROSCOPE');
      if (!ok) {
        if (showToast) showToast('BP가 부족해요.', 'error');
        return;
      }
      const cur = useAppStore.getState().gamificationState || {};
      useAppStore.getState().setGamificationData({
        gamificationState: { ...cur, currentBp: newBP ?? (currentBm - BM_COST_PER_ASK) },
        missions: useAppStore.getState().missions || [],
      });
    }

    if (typeof window.gtag === 'function') window.gtag('event', 'daily_horoscope_click');
    setDailyLoading(true);
    try {
      const ans = await callApi('오늘 하루 나의 별숨은?', {
        isDaily: true,
        transientItems: options.transientItems || [],
      });
      const result = { text: ans };
      const newCount = shouldIncrementCount ? dailyCount + 1 : dailyCount;
      setDailyResult(result);
      if (shouldIncrementCount) setDailyCount(newCount);

      if (user?.id) {
        await saveDailyCacheToSupabase(user.id, 'horoscope', ans);
        if (shouldIncrementCount) {
          await saveDailyCacheToSupabase(user.id, 'horoscope_count', String(newCount));
        }

        try {
          const gamData = parseHoroscopeForGamification(ans);

          const authClient = getAuthenticatedClient(user.id);
          const client = authClient || supabase;
          const today = getTodayDateStr();

          if (gamData.missions && gamData.missions.length > 0) {
            await client.from('missions')
              .delete()
              .eq('kakao_id', String(user.id))
              .eq('date', today);
            for (const mission of gamData.missions) {
              await client.from('missions').insert({
                kakao_id: String(user.id),
                date: today,
                mission_type: mission.type,
                mission_content: mission.content,
                bp_reward: mission.bpReward || 10,
                is_completed: false,
              });
            }
            if (typeof onMissionsSaved === 'function') onMissionsSaved();
          }

          setDailyResult(prev => ({
            ...prev,
            score: gamData.score,
            ...(gamData.badtime?.detected ? { badtime: gamData.badtime } : {}),
          }));

          if (gamData.score != null) {
            saveDailyCacheToSupabase(user.id, 'horoscope_score', String(gamData.score)).catch(() => {});
          }
        } catch (gamErr) {
          console.error('[별숨] 게이미피케이션 처리 오류:', gamErr);
        }
      }

      if (shouldSaveHistory) {
        saveHistoryToSupabase(['오늘 하루 나의 별숨은?'], [ans], timeSlot);
      }
    } catch {
      /* 에러는 버튼 상태로 처리 */
    } finally {
      setDailyLoading(false);
    }
  }, [formOk, callApi, dailyCount, dailyLoading, saveHistoryToSupabase, timeSlot, user?.id, onDailyLimitReached, onMissionsSaved, showToast]);

  const askReview = useCallback(async (text, prompt) => {
    if (!formOk) { setStep(1); return; }
    const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`;
    setSelQs([q]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
      setAnswers([ans]);
      saveHistoryToSupabase([q], [ans], timeSlot);
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, callApi, saveHistoryToSupabase, timeSlot]);

  const askDiaryReview = useCallback(async (text, prompt) => {
    if (!formOk) { setStep(1); return; }
    setDiaryReviewLoading(true);
    try {
      const ans = await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
      setDiaryReviewResult(ans);
      if (user?.id) await saveDailyCacheToSupabase(user.id, 'diary_review', ans);
      const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`;
      saveHistoryToSupabase([q], [ans], timeSlot);
    } catch { setDiaryReviewResult(ERR_MSG); }
    finally { setDiaryReviewLoading(false); }
  }, [formOk, callApi, saveHistoryToSupabase, timeSlot, user?.id]);

  const askWeeklyReview = useCallback(async (text) => {
    if (!formOk) { setStep(1); return; }
    const q = `이번 주 회고: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`;
    setSelQs([q]);
    setStep(3); setAnswers([]); setTypedSet(new Set()); setOpenAcc(0);
    try {
      const ans = await callApi(`[이번 주의 경험과 감정]\n${text}`, { isWeekly: true });
      setAnswers([ans]);
      saveHistoryToSupabase([q], [ans], timeSlot);
    } catch { setAnswers([ERR_MSG]); }
    setStep(prev => prev === 3 ? 4 : prev); setOpenAcc(0);
  }, [formOk, callApi, saveHistoryToSupabase, timeSlot]);

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

  // ── 채팅 (overrideText: 칩 클릭 시 직접 텍스트 전달 가능) ──
  const sendChat = useCallback(async (overrideText) => {
    const rawText = overrideText ?? chatInput;
    if (!rawText.trim() || chatLoading) return;
    if (chatLeft <= 0) { if (typeof window.gtag === 'function') window.gtag('event', 'chat_limit_reached'); setShowUpgradeModal(true); return; }
    if (typeof window.gtag === 'function') window.gtag('event', 'send_chat');
    const userMsg = rawText.trim();
    setChatInput('');
    setChatHistory(p => [...p, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    const prevQAs  = selQs.map((q, i) => `[질문 ${i + 1}] ${q}\n[답변] ${answers[i] || ''}`).join('\n\n');
    const prevChat = chatHistory.map(m => `[${m.role === 'ai' ? '별숨' : '나'}] ${m.text}`).join('\n');
    const fullMsg  = `[이전 상담]\n${prevQAs}\n\n[이전 대화]\n${prevChat}\n\n[새 질문]\n${userMsg}`;
    const chatPrompt = `당신은 별숨입니다. 사용자의 사주와 별자리를 깊이 아는 친한 친구처럼 채팅으로 답해주세요.

반드시 지켜야 할 규칙:
- 반드시 존댓말로 답하세요 (~요 / ~네요 / ~어요 등)
- 2~3문장 이내로만 답하세요. 절대 길게 쓰지 마세요.
- "[요약]", "종합", "사주내용", "점성술", "추천행동" 등 소제목을 절대 쓰지 마세요.
- 번호 목록이나 줄바꿈 나열 없이, 자연스러운 문장으로만 답하세요.
- 이전 상담 흐름과 방금 질문을 바로 연결해서 답하세요.

[이전 상담 요약]
${prevQAs}

[이전 대화]
${prevChat}

[새 질문]
${userMsg}`;
    try {
      const aiText = await callApi(chatPrompt, { isChat: true });
      setChatUsed(p => p + 1); // 성공 시에만 카운트 증가
      setChatHistory(p => { const updated = [...p, { role: 'ai', text: aiText }]; setLatestChatIdx(updated.length - 1); return updated; });
    } catch { setChatHistory(p => [...p, { role: 'ai', text: '앗, 잠깐 연결이 끊겼어요 🌙 다시 시도해봐요!' }]); }
    finally { setChatLoading(false); }
  }, [chatInput, chatLoading, chatLeft, selQs, answers, chatHistory, callApi]);

  // ── 꼬리 질문 5개 동적 생성 ──
  const generateChatSuggestions = useCallback(async () => {
    if (chatHistory.length > 0) return null;
    const prevQAs = selQs.map((q, i) => `[질문 ${i + 1}] ${q}\n[답변] ${(answers[i] || '').slice(0, 300)}`).join('\n\n');
    const prompt = `[이전 상담]\n${prevQAs}\n\n[요청]\n이전 상담 내용과 답변을 바탕으로, 사용자가 이어서 더 깊이 물어볼 만한 심층 꼬리 질문 5개를 생성해주세요.\n- 사용자가 그대로 복사해서 보낼 수 있도록 짧고 자연스러운 대화체로 작성하세요.\n- 포맷은 반드시 번호와 텍스트만 적어주세요:\n1. [질문내용]\n2. [질문내용]\n3. [질문내용]\n4. [질문내용]\n5. [질문내용]`;
    const naturalPrompt = `[이전 상담]\n${prevQAs}\n\n[요청]\n이전 상담 내용과 응답을 바탕으로, 사용자가 별숨에게 이어서 자연스럽게 물어볼 만한 후속 질문 5개를 생성해주세요.\n- 실제 채팅창에 바로 눌러 보낼 수 있게 짧고 자연스러운 한국어 구어체로 작성해주세요\n- 보고서식 표현 말고 대화하듯 써주세요\n- 설명과 번호는 빼고 텍스트만 적어주세요\n1. [질문내용]\n2. [질문내용]\n3. [질문내용]\n4. [질문내용]\n5. [질문내용]`;
    try {
      const text = await callApi(naturalPrompt, { isChat: true });
      const lines = text.split('\n').map(l => l.replace(/^\d+\.\s*/, '').replace(/^[-\*]\s*/, '').trim()).filter(Boolean).slice(0, 5);
      if (lines.length >= 3) return lines;
    } catch (e) {
      // 실패 시 null 반환 (ChatStep에서 기본값 사용)
    }
    return null;
  }, [selQs, answers, chatHistory, callApi]);

  // ── 채팅 컨텍스트 압축 (히스토리가 길어질 때 오래된 메시지 요약) ──
  function compressChatHistory(history) {
    if (history.length <= 6) {
      // 6개 이하 — 전부 원문 유지
      return history.map(m => `[${m.role === 'ai' ? '별숨' : '나'}] ${m.text}`).join('\n');
    }
    // 최근 6개(3턴)는 원문 유지, 이전 메시지는 요약(70자 이내로 자르기)
    const recent  = history.slice(-6);
    const older   = history.slice(0, -6);
    const summary = older
      .filter(m => m.role === 'ai') // AI 답변만 요약 보존
      .map(m => m.text.slice(0, 70).replace(/\n/g, ' '))
      .join(' / ');
    const recentText = recent.map(m => `[${m.role === 'ai' ? '별숨' : '나'}] ${m.text}`).join('\n');
    return `[이전 대화 요약] ${summary || '(없음)'}\n\n[최근 대화]\n${recentText}`;
  }

  // ── 채팅 스트리밍 (chat-mode SSE — /api/stream 전용) ──
  const sendStreamChat = useCallback(async (overrideText) => {
    const rawText = overrideText ?? chatInput;
    if (!rawText.trim() || chatLoading) return;
    if (chatLeft <= 0) { if (typeof window.gtag === 'function') window.gtag('event', 'chat_limit_reached'); setShowUpgradeModal(true); return; }
    if (typeof window.gtag === 'function') window.gtag('event', 'send_chat');
    const userMsg = rawText.trim();
    setChatInput('');
    // 컨텍스트 구성 — 긴 히스토리는 압축해서 토큰 절감
    const prevQAs  = selQs.map((q, i) => `[질문 ${i + 1}] ${q}\n[답변] ${(answers[i] || '').slice(0, 150)}`).join('\n\n');
    const prevChat = compressChatHistory(chatHistory);
    const userMessage = `[이전 상담]\n${prevQAs}\n\n[이전 대화]\n${prevChat}\n\n[새 질문]\n${userMsg}`;
    // 사용자 메시지 + 스트리밍 플레이스홀더 동시 추가
    const streamChatPrompt = `당신은 별숨입니다. 사용자의 사주와 별자리를 깊이 아는 친한 친구처럼 채팅으로 답해주세요.

반드시 지켜야 할 규칙:
- 반드시 존댓말로 답하세요 (~요 / ~네요 / ~어요 등)
- 2~3문장 이내로만 답하세요. 절대 길게 쓰지 마세요.
- "[요약]", "종합", "사주내용", "점성술", "추천행동" 등 소제목을 절대 쓰지 마세요.
- 번호 목록이나 줄바꿈 나열 없이, 자연스러운 문장으로만 답하세요.
- 이전 상담 흐름과 방금 질문을 바로 연결해서 답하세요.

[이전 상담 요약]
${prevQAs}

[이전 대화]
${prevChat}

[새 질문]
${userMsg}`;
    setChatHistory(p => [...p, { role: 'user', text: userMsg }, { role: 'ai', text: '', streaming: true }]);
    setLatestChatIdx(-1); // 스트리밍 완료 후 재애니메이션 방지
    setChatLoading(true);
    try {
      if (streamAbortRef.current) streamAbortRef.current.abort();
      streamAbortRef.current = new AbortController();
      const signal = streamAbortRef.current.signal;

      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      let fullContext = buildCtx();
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers,
        signal,
        body: JSON.stringify({
          userMessage: streamChatPrompt,
          context: fullContext,
          kakaoId: user?.id,
          isChat: true,
          responseStyle: responseStyle || 'M',
          clientHour: new Date().getHours(),
        }),
      });
      if (res.status === 401) {
        if (typeof onSessionExpired === 'function') onSessionExpired();
        if (typeof showToast === 'function') showToast('세션이 만료됐어요. 다시 로그인해주세요 🌙', 'warn');
        if (typeof onLoginRequired === 'function') onLoginRequired();
        throw new Error('SESSION_EXPIRED');
      }
      if (!res.ok) throw new Error('스트리밍 API 오류');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let bufStr = '';
      let accumulated = '';
      outer: while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }
        const { done, value } = await reader.read();
        if (done) break;
        bufStr += decoder.decode(value, { stream: true });
        const lines = bufStr.split('\n');
        bufStr = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const raw = trimmed.slice(6);
          if (raw === '[DONE]') break outer;
          try {
            const evt = JSON.parse(raw);
            if (evt.text) {
              accumulated += evt.text;
              setChatHistory(p => p.map((m, i) => i === p.length - 1 ? { ...m, text: accumulated } : m));
            }
          } catch { /* 파싱 실패 무시 */ }
        }
      }
      if (!signal.aborted) {
        setChatUsed(p => p + 1);
        setChatHistory(p => p.map((m, i) => i === p.length - 1 ? { ...m, streaming: false } : m));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setChatHistory(p => {
        const copy = [...p];
        const last = copy.length - 1;
        if (copy[last]?.role === 'ai') copy[last] = { role: 'ai', text: '앗, 잠깐 연결이 끊겼어요 🌙 다시 시도해봐요!', streaming: false };
        return copy;
      });
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatLeft, selQs, answers, chatHistory, buildCtx, responseStyle, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 월간 리포트 ──
  const genReport = useCallback(async () => {
    if (!IS_BETA && curPkg.id === 'basic') { setShowUpgradeModal(true); return; }
    if (typeof window.gtag === 'function') window.gtag('event', 'gen_report');
    setReportText(''); setReportLoading(true);
    try {
      const prompt = `[요청] 이달의 월간 운세 리포트를 아래 형식으로 작성해주세요.

첫 번째 줄에 반드시 다음 형식으로 8가지 운세 점수를 써주세요 (0~100 정수):
[월간점수] 종합:숫자,금전:숫자,애정:숫자,직장:숫자,학업:숫자,건강:숫자,대인:숫자,이동:숫자,창의:숫자

두 번째 줄에 이달의 행운 색상:
[행운색] 색상 이름 (2~4자)

세 번째 줄에 이달의 행운 아이템:
[행운아이템] 아이템1, 아이템2 (구체적인 실생활 물건)

그 다음에 이달의 운세 서사 (500~700자, 자연스러운 문단):
각 운세 영역(금전·애정·직장·건강)을 따로 나누지 말고 하나의 흐름으로 이어주세요.`;
      const normalizedPrompt = `[요청] 이달의 별숨 흐름 리포트를 아래 형식으로 작성해주세요.

첫 줄에는 반드시 아래 형식으로 8가지 운세 점수를 적어주세요. 점수는 0~100 정수입니다.
[월간점수] 종합:숫자,금전:숫자,애정:숫자,직장:숫자,학업:숫자,건강:숫자,대인:숫자,이동:숫자,창의:숫자

둘째 줄에는 이달의 행운 색을 적어주세요.
[행운색] 색 이름

셋째 줄에는 이달의 행운 아이템 2~3개를 적어주세요.
[행운아이템] 아이템1, 아이템2, 아이템3

그 아래 본문은 다음 기준으로 작성해주세요.
- 오늘 하루 나의 별숨을 한 달 단위로 확장한 느낌으로 써주세요
- 이달의 흐름, 상승 구간, 조심할 구간, 분위기 변화를 자연스럽게 이어서 설명해주세요
- 항목별 소제목 없이 하나의 읽기 좋은 월간 리포트처럼 써주세요
- 너무 딱딱한 보고서체보다 별숨이 들려주는 설명처럼 부드럽게 써주세요
- 분량은 500~700자 정도로 해주세요`;
      const text = await callApi(normalizedPrompt, { isReport: true });
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
    generateChatSuggestions,
    typedSet, setTypedSet,
    chatHistory, chatInput, setChatInput, chatLoading, chatUsed, latestChatIdx,
    chatLeft, maxQ, maxChat, curPkg,
    reportText, reportLoading,
    histItem, setHistItem, histItems, setHistItems,
    chatEndRef,
    qLoadStatus,
    callApi, retryMsg,
    addQ, rmQ,
    dailyResult, dailyLoading, dailyCount, DAILY_MAX,
    diaryReviewResult, diaryReviewLoading,
    askClaude, askQuick, askTimeSlot, askDailyHoroscope, askReview, askDiaryReview, askWeeklyReview,
    resetDiaryReview: useCallback(() => { setDiaryReviewResult(null); }, []),
    retryAnswer,
    handleTypingDone, handleAccToggle,
    sendChat, sendStreamChat, genReport,
    deleteHistoryItem,
    deleteAllHistoryItems,
    resetSession: useCallback(() => { setChatHistory([]); setChatUsed(0); }, []),
  };
}
