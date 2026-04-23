import { useState, useRef, useCallback, useEffect } from "react";
import { stripMarkdown, PKGS, TIMING, LOAD_STATES } from "../utils/constants.js";
import { useAppStore } from "../store/useAppStore.js";
import { getTimeSlot, TIME_CONFIG } from "../utils/time.js";
import { supabase, getAuthenticatedClient } from "../lib/supabase.js";
import {
  canUseDailySupabaseTables,
  getDailyDateKey,
  readDailyLocalCache,
  writeDailyLocalCache,
} from "../lib/dailyDataAccess.js";
import { getAuthToken } from "./useUserProfile.js";
import { parseHoroscopeForGamification } from "../utils/missionGenerator.js";
import { spendBP as spendBPUtil } from "../utils/gamificationLogic.js";
import { useDailyConsultationHandler } from "./consultation/useDailyConsultationHandler.js";
import { useChatConsultationHandler } from "./consultation/useChatConsultationHandler.js";
import { useReportConsultationHandler } from "./consultation/useReportConsultationHandler.js";

const BM_COST_PER_ASK = 10;
const ERR_MSG = "별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!";
export const DAILY_MAX = 999;

function sanitizeChatResponse(text) {
  return String(text || "")
    .replace(/^\s*\[요약\][^\n]*\n?/i, "")
    .replace(/^\s*요약\s*[:：-]\s*[^\n]*\n?/i, "")
    .trim();
}

function getTodayDateStr() {
  return getDailyDateKey();
}

async function loadDailyCacheFromSupabase(userId, type) {
  if (!supabase || !userId) return null;
  if (!canUseDailySupabaseTables()) {
    return readDailyLocalCache(userId, type, getTodayDateStr());
  }
  try {
    const authClient = getAuthenticatedClient(userId);
    const { data } = await (authClient || supabase)
      .from("daily_cache")
      .select("content")
      .eq("kakao_id", String(userId))
      .eq("cache_date", getTodayDateStr())
      .eq("cache_type", type)
      .maybeSingle();
    return data?.content || null;
  } catch {
    return readDailyLocalCache(userId, type, getTodayDateStr());
  }
}

async function saveDailyCacheToSupabase(userId, type, content) {
  if (!supabase || !userId) return;
  writeDailyLocalCache(userId, type, content, getTodayDateStr());
  if (!canUseDailySupabaseTables()) return;
  try {
    const authClient = getAuthenticatedClient(userId);
    await (authClient || supabase).from("daily_cache").upsert({
      kakao_id: String(userId),
      cache_date: getTodayDateStr(),
      cache_type: type,
      content,
    }, { onConflict: "kakao_id,cache_date,cache_type" });
  } catch (e) {
    console.error("[별숨] daily_cache 저장 오류:", e);
  }
}

export function useConsultation(
  buildCtx,
  formOk,
  user,
  consentFlags,
  responseStyle,
  onLoginRequired,
  onDailyLimitReached,
  showToast,
  onSessionExpired,
  onMissionsSaved,
) {
  const [timeSlot, setTimeSlot] = useState(() => getTimeSlot());
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadMsgRef = useRef(null);

  useEffect(() => {
    const update = () => setTimeSlot(getTimeSlot());
    const interval = setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const step = useAppStore((s) => s.step);
  const setStep = useAppStore((s) => s.setStep);
  const setShowUpgradeModal = useAppStore((s) => s.setShowUpgradeModal);

  const [cat, setCat] = useState(0);
  const [selQs, setSelQs] = useState([]);
  const [diy, setDiy] = useState("");
  const [pkg, setPkg] = useState("premium");
  const [answers, setAnswers] = useState([]);
  const [openAcc, setOpenAcc] = useState(0);
  const [typedSet, setTypedSet] = useState(new Set());
  const [histItem, setHistItem] = useState(null);
  const [histItems, setHistItems] = useState([]);
  const [qLoadStatus, setQLoadStatus] = useState([]);
  const [retryMsg, setRetryMsg] = useState("");

  const curPkg = PKGS.find((p) => p.id === pkg) || PKGS[1];
  const maxQ = curPkg.q;
  const maxChat = curPkg.chat;

  useEffect(() => {
    if (!supabase || !user?.id) {
      setHistItems([]);
      return;
    }
    const authClient = getAuthenticatedClient(user.id);
    (authClient || supabase)
      .from("consultation_history")
      .select("id, questions, answers, slot, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data?.length) return;
        const items = data.map((row) => {
          const dt = new Date(row.created_at);
          const dateStr = `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
          return {
            id: row.id,
            supabaseId: row.id,
            date: dateStr,
            ts: dt.getTime(),
            slot: row.slot || "morning",
            questions: row.questions || [],
            answers: row.answers || [],
          };
        });
        setHistItems(items);
      })
      .catch((e) => {
        console.error("[별숨] 상담 기록 로드 오류:", e);
        if (typeof showToast === "function") showToast("상담 기록을 불러오지 못했어요", "error");
      });
  }, [showToast, user?.id]);

  const callApi = useCallback(async (userMessage, opts = {}) => {
    if (!user?.id) {
      if (typeof onLoginRequired === "function") onLoginRequired();
      throw new Error("LOGIN_REQUIRED");
    }

    const maxRetries = 3;
    let lastErr;
    const style = responseStyle || "M";

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        if (attempt > 0) {
          const msgs = [
            "별이 잠시 숨을 고르고 있어요... (1/3)",
            "조금만 더 기다려주세요... (2/3)",
          ];
          setRetryMsg(msgs[attempt - 1] || "");
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        }

        const token = getAuthToken();
        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        let fullContext = buildCtx();
        try {
          if (histItems.length > 0) {
            const recentConsults = histItems
              .slice(0, 3)
              .map((h, i) => {
                const q = (Array.isArray(h.questions) ? h.questions : []).join(" ").slice(0, 60);
                const a = (Array.isArray(h.answers) ? h.answers : []).join(" ").slice(0, 60);
                return (q || a) ? `[이전 상담 ${i + 1}] ${q}\n→ ${a}` : null;
              })
              .filter(Boolean)
              .join("\n");
            if (recentConsults) fullContext = `[최근 상담 기억]\n${recentConsults}\n\n${buildCtx()}`;
          }
        } catch {
          // ignore history injection failures
        }

        const talisman = useAppStore.getState().equippedTalisman;
        if (opts.isDaily && talisman) {
          fullContext += `\n\n[오늘 부적 효과: ${talisman.name}]\n효과: ${talisman.description}\n이 부적의 기운이 오늘의 해석과 조언에 자연스럽게 반영되도록 해주세요.`;
        }

        const sajuItem = useAppStore.getState().equippedSajuItem;
        if (sajuItem) {
          const itemEffect = sajuItem.effect || sajuItem.description || "";
          fullContext += `\n\n[메인 기운: ${sajuItem.name} ${sajuItem.emoji || ""}]\n기운: ${itemEffect}\n이 에너지가 전체 해석에 자연스럽게 반영되도록 해주세요.`;
        }

        if (opts.isDaily && Array.isArray(opts.transientItems) && opts.transientItems.length > 0) {
          const transientSummary = opts.transientItems
            .map((item, index) => {
              const parts = [item?.name].filter(Boolean);
              if (item?.effect) parts.push(`effect: ${item.effect}`);
              else if (item?.description) parts.push(`description: ${item.description}`);
              return `${index + 1}. ${parts.join(" / ")}`.trim();
            })
            .filter(Boolean)
            .join("\n");
          if (transientSummary) {
            fullContext += `\n\n[daily transient items]\n${transientSummary}\nPlease reflect these temporary item effects naturally in today's interpretation.`;
          }
        }

        if (opts.isChat) {
          fullContext += "\n\n[채팅 응답 규칙]\n이번 응답은 채팅 모드입니다. [요약], 제목, 섹션 헤더, 번호 목록 없이 바로 대화형 문장으로 답하세요. 첫 줄에 요약문이나 태그를 쓰지 말고, 상대와 이어서 말하듯 2~4문장 안팎으로 답하세요.";
        }

        const res = await fetch("/api/ask", {
          method: "POST",
          headers,
          body: JSON.stringify({
            userMessage,
            context: fullContext,
            kakaoId: user.id,
            isChat: opts.isChat || false,
            isReport: opts.isReport || false,
            isLetter: opts.isLetter || false,
            isProphecy: opts.isProphecy || false,
            isStory: opts.isStory || false,
            isScenario: opts.isScenario || false,
            isNatal: opts.isNatal || false,
            isZodiac: opts.isZodiac || false,
            isComprehensive: opts.isComprehensive || false,
            isCalendarMonth: opts.isCalendarMonth || false,
            isSlot: opts.isSlot || false,
            isWeekly: opts.isWeekly || false,
            isDaily: opts.isDaily || false,
            isDaeun: opts.isDaeun || false,
            isAnalytics: opts.isAnalytics || false,
            responseStyle: style,
            precision_level: useAppStore.getState().dataPrecision?.level || "low",
            clientHour: new Date().getHours(),
          }),
        });

        if (res.status === 401) {
          setRetryMsg("");
          if (typeof onSessionExpired === "function") onSessionExpired();
          if (typeof showToast === "function") showToast("세션이 만료됐어요. 다시 로그인해주세요.", "warn");
          if (typeof onLoginRequired === "function") onLoginRequired();
          throw new Error("SESSION_EXPIRED");
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "API 오류");
        setRetryMsg("");
        const cleaned = stripMarkdown(data.text || "");
        return opts.isChat ? sanitizeChatResponse(cleaned) : cleaned;
      } catch (e) {
        lastErr = e;
        if (e?.message === "SESSION_EXPIRED") throw e;
        if (attempt < maxRetries - 1) continue;
      }
    }

    setRetryMsg("");
    throw lastErr;
  }, [buildCtx, histItems, onLoginRequired, onSessionExpired, responseStyle, showToast, user?.id]);

  const startLoadingMsg = useCallback(() => {
    setLoadingMsgIdx(0);
    loadMsgRef.current = setInterval(() => {
      setLoadingMsgIdx((p) => (p + 1) % LOAD_STATES.length);
    }, TIMING.skeletonCycle);
  }, []);

  const stopLoadingMsg = useCallback(() => {
    if (loadMsgRef.current) {
      clearInterval(loadMsgRef.current);
      loadMsgRef.current = null;
    }
  }, []);

  const saveHistoryToSupabase = useCallback(async (questions, answersArr, slot) => {
    if (!supabase) return;
    if (consentFlags?.history === false) return;
    try {
      const kakaoId = user?.id;
      if (!kakaoId) return;
      let supabaseUserId = user?.supabaseId || null;
      if (!supabaseUserId) {
        const authClient = getAuthenticatedClient(kakaoId);
        const { data: userRow } = await (authClient || supabase)
          .from("users")
          .select("id")
          .eq("kakao_id", String(kakaoId))
          .maybeSingle();
        supabaseUserId = userRow?.id || null;
      }
      if (!supabaseUserId) return;

      const authClient = getAuthenticatedClient(kakaoId);
      const { data: inserted, error } = await (authClient || supabase)
        .from("consultation_history")
        .insert({ user_id: supabaseUserId, questions, answers: answersArr, slot })
        .select("id")
        .single();

      if (error) {
        console.error("[별숨] 상담기록 저장 오류:", error);
        return;
      }

      if (inserted?.id) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setHistItems((prev) => [{
          id: inserted.id,
          supabaseId: inserted.id,
          date: dateStr,
          ts: now.getTime(),
          slot,
          questions,
          answers: answersArr,
        }, ...prev.filter((i) => i.supabaseId !== inserted.id)].slice(0, 50));
      }
    } catch (e) {
      console.error("[별숨] 상담기록 저장 오류:", e);
    }
  }, [consentFlags, user]);

  const dailyHandler = useDailyConsultationHandler({
    formOk,
    user,
    showToast,
    callApi,
    dailyMax: DAILY_MAX,
    onDailyLimitReached,
    onMissionsSaved,
    saveHistoryToSupabase,
    timeSlot,
    saveDailyCache: saveDailyCacheToSupabase,
    getTodayDateStr,
  });

  useEffect(() => {
    if (!user?.id) return;
    loadDailyCacheFromSupabase(user.id, "horoscope").then((content) => {
      if (!content) return;
      const gamData = parseHoroscopeForGamification(content);
      dailyHandler.setDailyResult({
        text: content,
        score: gamData.score,
        ...(gamData.badtime?.detected ? { badtime: gamData.badtime } : {}),
      });
    }).catch((e) => console.error("[별숨] 오늘 별숨 캐시 로드 오류:", e));

    loadDailyCacheFromSupabase(user.id, "diary_review").then((content) => {
      if (content) dailyHandler.setDiaryReviewResult(content);
    }).catch((e) => console.error("[별숨] 일기 리뷰 캐시 로드 오류:", e));

    loadDailyCacheFromSupabase(user.id, "horoscope_count").then((countStr) => {
      if (countStr) dailyHandler.setDailyCount(parseInt(countStr, 10) || 0);
    }).catch((e) => console.error("[별숨] 별숨 횟수 캐시 로드 오류:", e));
  }, [dailyHandler, user?.id]);

  const chatHandler = useChatConsultationHandler({
    buildCtx,
    user,
    responseStyle,
    onLoginRequired,
    onSessionExpired,
    showToast,
    callApi,
    maxChat,
    selQs,
    answers,
    setShowUpgradeModal,
  });

  const reportHandler = useReportConsultationHandler({
    callApi,
    curPkg,
    setShowUpgradeModal,
  });

  const addQ = useCallback((q) => {
    if (selQs.length < maxQ && !selQs.includes(q)) {
      setSelQs((p) => [...p, q]);
      setDiy("");
    }
  }, [maxQ, selQs]);

  const rmQ = useCallback((i) => setSelQs((p) => p.filter((_, x) => x !== i)), []);

  const askClaude = useCallback(async () => {
    if (!selQs.length) return;

    if (user?.id) {
      const totalCost = selQs.length * BM_COST_PER_ASK;
      const confirmed = await useAppStore.getState().showBPConfirm(totalCost, selQs.length);
      if (!confirmed) return;

      const currentBm = useAppStore.getState().gamificationState?.currentBp ?? 0;
      if (currentBm < totalCost) {
        if (showToast) showToast(`BP가 부족해요. (필요: ${totalCost} BP, 보유: ${currentBm} BP)`, "error");
        return;
      }

      if (typeof window.gtag === "function") window.gtag("event", "ask_claude", { question_count: selQs.length });
      setStep(3);
      setAnswers([]);
      setTypedSet(new Set());
      setOpenAcc(0);

      const authClient = getAuthenticatedClient(user.id);
      const { ok, newBP } = await spendBPUtil(authClient || supabase, user.id, totalCost, "ASK_CLAUDE");
      if (!ok) {
        if (showToast) showToast("BP가 부족해요.", "error");
        setStep(2);
        return;
      }

      const cur = useAppStore.getState().gamificationState || {};
      useAppStore.getState().setGamificationData({
        gamificationState: { ...cur, currentBp: newBP ?? (currentBm - totalCost) },
        missions: useAppStore.getState().missions || [],
      });
    } else {
      if (typeof window.gtag === "function") window.gtag("event", "ask_claude", { question_count: selQs.length });
      setStep(3);
      setAnswers([]);
      setTypedSet(new Set());
      setOpenAcc(0);
    }

    setQLoadStatus(selQs.map(() => "loading"));
    startLoadingMsg();
    const results = await Promise.allSettled(
      selQs.map((q, i) => callApi(`[질문]\n${q}`).then((ans) => {
        setQLoadStatus((prev) => {
          const next = [...prev];
          next[i] = "done";
          return next;
        });
        return ans;
      }).catch((err) => {
        setQLoadStatus((prev) => {
          const next = [...prev];
          next[i] = "error";
          return next;
        });
        throw err;
      })),
    );
    stopLoadingMsg();

    const newAnswers = results.map((r, i) => (
      r.status === "fulfilled"
        ? r.value
        : `Q${i + 1} 답변을 불러오지 못했어요 🌙\n잠시 후 다시 시도해봐요!`
    ));
    setAnswers(newAnswers);
    saveHistoryToSupabase(selQs, newAnswers, timeSlot);
    chatHandler.setLatestChatIdx(-1);
    setStep((prev) => (prev === 3 ? 4 : prev));
    setOpenAcc(0);
  }, [callApi, chatHandler, saveHistoryToSupabase, selQs, showToast, startLoadingMsg, stopLoadingMsg, timeSlot, user?.id, setStep]);

  const askQuick = useCallback(async (q) => {
    if (!q.trim()) return;
    if (typeof window.gtag === "function") window.gtag("event", "ask_quick", { question: q.slice(0, 30) });
    if (!formOk) {
      setSelQs([q.trim()]);
      setStep(1);
      return;
    }

    if (user?.id) {
      const confirmed = await useAppStore.getState().showBPConfirm(BM_COST_PER_ASK, 1);
      if (!confirmed) return;
      const currentBm = useAppStore.getState().gamificationState?.currentBp ?? 0;
      if (currentBm < BM_COST_PER_ASK) {
        if (showToast) showToast(`BP가 부족해요. (필요: ${BM_COST_PER_ASK} BP, 보유: ${currentBm} BP)`, "error");
        return;
      }
      const authClient = getAuthenticatedClient(user.id);
      const { ok, newBP } = await spendBPUtil(authClient || supabase, user.id, BM_COST_PER_ASK, "ASK_QUICK");
      if (!ok) {
        if (showToast) showToast("BP가 부족해요.", "error");
        return;
      }
      const cur = useAppStore.getState().gamificationState || {};
      useAppStore.getState().setGamificationData({
        gamificationState: { ...cur, currentBp: newBP ?? (currentBm - BM_COST_PER_ASK) },
        missions: useAppStore.getState().missions || [],
      });
    }

    setSelQs([q.trim()]);
    setStep(3);
    setAnswers([]);
    setTypedSet(new Set());
    setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${q.trim()}`);
      setAnswers([ans]);
      saveHistoryToSupabase([q.trim()], [ans], timeSlot);
    } catch {
      setAnswers([ERR_MSG]);
    }
    setStep((prev) => (prev === 3 ? 4 : prev));
    setOpenAcc(0);
  }, [callApi, formOk, saveHistoryToSupabase, setStep, showToast, timeSlot, user?.id]);

  const askTimeSlot = useCallback(async (prompt) => {
    if (!formOk) {
      setStep(1);
      return;
    }
    const q = TIME_CONFIG[timeSlot].label;
    setSelQs([q]);
    setStep(3);
    setAnswers([]);
    setTypedSet(new Set());
    setOpenAcc(0);
    try {
      const ans = await callApi(`[질문]\n${prompt}`, { isSlot: true });
      setAnswers([ans]);
    } catch {
      setAnswers([ERR_MSG]);
    }
    setStep((prev) => (prev === 3 ? 4 : prev));
    setOpenAcc(0);
  }, [callApi, formOk, setStep, timeSlot]);

  const askDailyHoroscope = useCallback(async (options = {}) => {
    if (!formOk) {
      setStep(1);
      return;
    }
    await dailyHandler.askDailyHoroscope(options);
  }, [dailyHandler, formOk, setStep]);

  const askReview = useCallback(async (text, prompt) => {
    if (!formOk) {
      setStep(1);
      return;
    }
    const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? "…" : ""}`;
    setSelQs([q]);
    setStep(3);
    setAnswers([]);
    setTypedSet(new Set());
    setOpenAcc(0);
    try {
      const result = await dailyHandler.askReview(text, prompt);
      setAnswers([result.answer]);
    } catch {
      setAnswers([ERR_MSG]);
    }
    setStep((prev) => (prev === 3 ? 4 : prev));
    setOpenAcc(0);
  }, [dailyHandler, formOk, setStep]);

  const askDiaryReview = useCallback(async (text, prompt) => {
    if (!formOk) {
      setStep(1);
      return;
    }
    await dailyHandler.askDiaryReview(text, prompt);
  }, [dailyHandler, formOk, setStep]);

  const askWeeklyReview = useCallback(async (text) => {
    if (!formOk) {
      setStep(1);
      return;
    }
    const q = `이번 주 회고: ${text.slice(0, 30)}${text.length > 30 ? "…" : ""}`;
    setSelQs([q]);
    setStep(3);
    setAnswers([]);
    setTypedSet(new Set());
    setOpenAcc(0);
    try {
      const result = await dailyHandler.askWeeklyReview(text);
      setAnswers([result.answer]);
    } catch {
      setAnswers([ERR_MSG]);
    }
    setStep((prev) => (prev === 3 ? 4 : prev));
    setOpenAcc(0);
  }, [dailyHandler, formOk, setStep]);

  const retryAnswer = useCallback(async (idx) => {
    const q = selQs[idx];
    if (!q) return;
    if (typeof window.gtag === "function") window.gtag("event", "retry_answer", { idx });
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = "";
      return next;
    });
    try {
      const ans = await callApi(`[질문]\n${q}`);
      setAnswers((prev) => {
        const next = [...prev];
        next[idx] = ans;
        return next;
      });
    } catch {
      setAnswers((prev) => {
        const next = [...prev];
        next[idx] = ERR_MSG;
        return next;
      });
    }
  }, [callApi, selQs]);

  const handleTypingDone = useCallback((idx) => {
    setTypedSet((p) => {
      const next = new Set(p);
      next.add(idx);
      return next;
    });
    const next = idx + 1;
    if (next < selQs.length) {
      setTimeout(() => {
        setOpenAcc(next);
        setTimeout(() => {
          setOpenAcc((p) => (p === next ? -1 : p));
        }, 800);
      }, 400);
    }
  }, [selQs.length]);

  const handleAccToggle = useCallback((i) => {
    setOpenAcc((p) => (p === i ? -1 : i));
  }, []);

  const deleteHistoryItem = useCallback(async (id, supabaseId) => {
    if (supabase && supabaseId && user?.id) {
      try {
        const authClient = getAuthenticatedClient(user.id);
        await (authClient || supabase).from("consultation_history").delete().eq("id", supabaseId);
        setHistItems((prev) => prev.filter((i) => i.id !== id));
      } catch (e) {
        console.error("[별숨] 상담기록 삭제 오류:", e);
      }
    } else {
      setHistItems((prev) => prev.filter((i) => i.id !== id));
    }
  }, [user]);

  const deleteAllHistoryItems = useCallback(async () => {
    if (!user?.id) {
      setHistItems([]);
      return;
    }
    try {
      const authClient = getAuthenticatedClient(user.id);
      const { data: userData } = await (authClient || supabase)
        .from("users")
        .select("id")
        .eq("kakao_id", String(user.id))
        .maybeSingle();
      if (userData?.id) {
        await (authClient || supabase).from("consultation_history").delete().eq("user_id", userData.id);
      }
      setHistItems([]);
    } catch (e) {
      console.error("[별숨] 상담기록 전체 삭제 오류:", e);
      setHistItems([]);
    }
  }, [user]);

  const {
    dailyResult,
    dailyLoading,
    dailyCount,
    diaryReviewResult,
    diaryReviewLoading,
    resetDiaryReview,
  } = dailyHandler;

  const {
    chatHistory,
    chatInput,
    setChatInput,
    chatLoading,
    chatUsed,
    chatLeft,
    latestChatIdx,
    chatEndRef,
    generateChatSuggestions,
    sendChat,
    sendStreamChat,
    resetSession,
  } = chatHandler;

  const { reportText, reportLoading, genReport } = reportHandler;

  return {
    timeSlot,
    loadingMsgIdx,
    step,
    setStep,
    cat,
    setCat,
    selQs,
    setSelQs,
    diy,
    setDiy,
    pkg,
    setPkg,
    answers,
    setAnswers,
    openAcc,
    setOpenAcc,
    generateChatSuggestions,
    typedSet,
    setTypedSet,
    chatHistory,
    chatInput,
    setChatInput,
    chatLoading,
    chatUsed,
    latestChatIdx,
    chatLeft,
    maxQ,
    maxChat,
    curPkg,
    reportText,
    reportLoading,
    histItem,
    setHistItem,
    histItems,
    setHistItems,
    chatEndRef,
    qLoadStatus,
    callApi,
    retryMsg,
    addQ,
    rmQ,
    dailyResult,
    dailyLoading,
    dailyCount,
    DAILY_MAX,
    diaryReviewResult,
    diaryReviewLoading,
    askClaude,
    askQuick,
    askTimeSlot,
    askDailyHoroscope,
    askReview,
    askDiaryReview,
    askWeeklyReview,
    resetDiaryReview,
    retryAnswer,
    handleTypingDone,
    handleAccToggle,
    sendChat,
    sendStreamChat,
    genReport,
    deleteHistoryItem,
    deleteAllHistoryItems,
    resetSession,
  };
}
