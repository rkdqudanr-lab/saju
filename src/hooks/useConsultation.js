import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { stripMarkdown, PKGS, TIMING, LOAD_STATES } from "../utils/constants.js";
import { STEP } from "../utils/steps.js";
import { useAppStore } from "../store/useAppStore.js";
import { getTimeSlot, TIME_CONFIG } from "../utils/time.js";
import { supabase, getAuthenticatedClient } from "../lib/supabase.js";
import {
  getDailyDateKey,
  readDailyLocalCache,
  writeDailyLocalCache,
} from "../lib/dailyDataAccess.js";
import { postAskRaw } from "../lib/askApi.js";
import { parseHoroscopeForGamification } from "../utils/missionGenerator.js";
import { spendBP as spendBPUtil } from "../utils/gamificationLogic.js";
import { useDailyConsultationHandler } from "./consultation/useDailyConsultationHandler.js";
import { useChatConsultationHandler } from "./consultation/useChatConsultationHandler.js";
import { useReportConsultationHandler } from "./consultation/useReportConsultationHandler.js";

const BM_COST_PER_ASK = 10;
const ERR_MSG = "별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!";
export const DAILY_MAX = 999;
const LOCAL_LAYOUT_MODE = import.meta.env.DEV;

function isLocalLayoutUser(user) {
  return LOCAL_LAYOUT_MODE && user?.id === "test_user_id";
}

function getLocalLayoutAnswer(userMessage, opts = {}) {
  if (opts.isDaily) {
    return `[점수]
종합운: 74 — 오늘은 무리하게 밀어붙이기보다 흐름을 정리할수록 안정감이 커져요.

[요약]
오늘은 해야 할 일을 한 번에 끝내려 하기보다, 순서를 다시 잡는 쪽이 더 잘 맞아요.

[동양의 기운]
십신: 식신 — 표현하고 정리하는 힘이 살아나요.
기운: 화 기운이 강해 말과 행동이 빨라질 수 있어요.
DO: 오전에 할 일을 세 가지로 줄이기
DONT: 즉흥적으로 약속 늘리기

[서양의 하늘]
행성: 금성 — 관계에서 부드러운 말이 힘이 됩니다.
흐름: 익숙한 루틴 안에서 작은 변화를 주기 좋아요.

[카테고리 운세]
종합운: 74 — 차분히 정리하면 흐름이 좋아져요.
재물운: 68 — 큰 지출보다 작은 절약이 유리해요.
연애운: 72 — 먼저 안부를 묻는 말이 관계를 부드럽게 해요.
커리어운: 77 — 미뤄둔 문서나 계획을 정리하기 좋아요.
학업운: 70 — 짧게 반복할수록 집중이 살아나요.
건강운: 66 — 목과 어깨 긴장을 풀어주세요.
대인운: 75 — 선을 분명히 하면 오히려 편해져요.
이동운: 62 — 동선은 여유 있게 잡는 편이 좋아요.
창작운: 81 — 떠오른 아이디어를 메모하면 쓸모가 커져요.

[별숨픽]
음식: 따뜻한 국물
장소: 조용한 카페
색: 골드 베이지
아이템: 작은 노트
숫자: 5
방향: 동쪽
소통: 먼저 짧게 안부 묻기
행동: 할 일 세 개만 적기
요약: 작은 정리가 큰 흐름을 바꿔요.`;
  }

  if (opts.isReport) {
    return `[월간요약]
이번 달은 속도를 높이기보다 기준을 다시 잡는 달입니다. 관계, 일, 생활 루틴을 정리하면 다음 선택이 더 선명해져요.

[월간점수]
종합운: 76
재물운: 69
연애운: 73
커리어운: 78
학업운: 71
건강운: 67
대인운: 75
이동운: 64
창작운: 82

[이번달핵심]
좋아 보이는 선택보다 오래 유지할 수 있는 선택을 고르세요.

[주차별가이드]
1주차: 일정 정리
2주차: 관계 조율
3주차: 일의 기준 재설정
4주차: 휴식과 회복

[관계와감정]
말을 아끼는 것보다 정확히 말하는 편이 낫습니다.

[일과돈]
새로운 투자보다 기존 지출 점검이 먼저예요.

[건강과생활]
수면 리듬과 어깨 긴장을 함께 관리하세요.

[이번달피할것]
모든 일을 혼자 떠안는 태도

[이번달실천]
매주 한 번, 일정과 감정을 같이 정리하기

[행운색]
따뜻한 금색

[행운아이템]
얇은 노트

[별숨한마디]
이번 달의 힘은 빠른 결정보다 오래 가는 기준에서 나옵니다.`;
  }

  if (opts.isChat) {
    return "지금은 로컬 레이아웃 점검용 응답이에요. 실제 상담처럼 보이도록 짧게 답변을 채웠고, 채팅 말풍선과 후속 입력 흐름을 확인하시면 됩니다.";
  }

  if (opts.isDream) {
    return "[요약]\n꿈은 최근 마음속에 남아 있던 긴장과 기대가 섞여 나타난 장면으로 보여요.\n\n[해석]\n반복해서 떠오른 이미지는 아직 정리되지 않은 선택지를 뜻합니다.\n\n[실천]\n오늘은 결정하기보다 기록해두는 편이 좋아요.";
  }

  if (opts.isTarot) {
    return "[카드]\nThe Star\n\n[해석]\n지금은 큰 결론보다 회복과 방향 확인이 중요한 시기입니다.\n\n[조언]\n작은 신호를 놓치지 말고 천천히 움직이세요.";
  }

  if (opts.isName) {
    return "[이름풀이]\n이 이름은 부드럽게 관계를 잇는 힘과 꾸준히 쌓아가는 기운이 강합니다.\n\n[조언]\n처음보다 시간이 지날수록 신뢰가 드러나는 이름 흐름이에요.";
  }

  if (opts.isTaegil) {
    return "[택일결과]\n오전보다 오후 시간이 안정적입니다.\n\n[추천]\n준비와 확인이 필요한 일은 14시 이후가 좋아요.\n\n[주의]\n급하게 결정하는 일정은 피하세요.";
  }

  if (opts.isDaeun) {
    return "[대운요약]\n앞으로의 흐름은 기반을 다지고 선택지를 좁히는 방향으로 움직입니다.\n\n[핵심]\n넓히는 운보다 정리하는 운이 먼저 들어와요.\n\n[조언]\n무리한 확장보다 지속 가능한 루틴을 만드세요.";
  }

  const cleanQuestion = String(userMessage || "").replace(/^\[질문\]\s*/m, "").trim();
  return `[요약]
${cleanQuestion ? `"${cleanQuestion.slice(0, 42)}"에 대한` : "지금 흐름에 대한"} 로컬 샘플 답변입니다.

[흐름]
현재는 큰 결론보다 상황을 정리하고 우선순위를 세우는 쪽이 더 잘 맞습니다. 마음이 급해질수록 하나씩 확인하는 방식이 안정적이에요.

[조언]
오늘 안에 끝낼 일 하나와 미뤄도 되는 일 하나를 구분해보세요. 그 선택만으로도 부담이 줄어듭니다.

[실천]
메모장에 지금 가장 신경 쓰이는 일을 세 줄로 적고, 첫 번째 행동만 바로 해보세요.`;
}

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
    const client = authClient || supabase;
    let query = client
      .from("consultation_history")
      .select("id, questions, answers, slot, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    // supabaseId(UUID) 있으면 명시적 필터 추가 — RLS와 이중 안전
    if (user.supabaseId) query = query.eq("user_id", user.supabaseId);
    query.then(({ data }) => {
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
  }, [showToast, user?.id, user?.supabaseId]);

  const callApi = useCallback(async (userMessage, opts = {}) => {
    if (!user?.id) {
      if (typeof onLoginRequired === "function") onLoginRequired();
      throw new Error("LOGIN_REQUIRED");
    }

    if (isLocalLayoutUser(user)) {
      await new Promise((r) => setTimeout(r, opts.isChat ? 450 : 650));
      return getLocalLayoutAnswer(userMessage, opts);
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

        if (typeof opts.context === 'string' && opts.context.trim()) {
          fullContext += `\n\n[추가 작업 맥락]\n${opts.context.trim()}`;
        }

        if (opts.isDaily) {
          fullContext += "\n\n[일일 운세 출력 우선 규칙]\n위 맥락의 일반 특별 지침보다 일일 운세 시스템 프롬프트의 필수 구조가 우선입니다. 반드시 [점수] 태그로 시작하고, [점수] 다음에 [요약]을 출력하세요.";
        }

        // 정화재점 시 boostMap 컨텍스트 반영 (발동=소비된 아이템들의 boost 기록)
        if (opts.isDaily && opts.boostMap && typeof opts.boostMap === 'object') {
          const boostEntries = Object.entries(opts.boostMap)
            .filter(([, entry]) => entry?.name && entry?.boost)
            .map(([aspectKey, entry]) => `• ${entry.emoji || ''} ${entry.name} → ${aspectKey} 카테고리 +${entry.boost}점`)
            .join('\n');
          if (boostEntries) {
            fullContext += `\n\n[정화재점 — 오늘 발동된 아이템]\n${boostEntries}\n위 아이템의 기운이 이미 오늘 하루에 스며든 상태예요. 해당 카테고리의 점수는 발동된 boost 수치만큼 더 높게 책정하고, 설명도 그에 맞게 더 긍정적으로 풀어주세요. 다른 카테고리는 자연스럽게 유지하세요.`;
          }
        }

        if (opts.isChat) {
          fullContext += "\n\n[채팅 응답 규칙]\n이번 응답은 채팅 모드입니다. [요약], 제목, 섹션 헤더, 번호 목록 없이 바로 대화형 문장으로 답하세요. 첫 줄에 요약문이나 태그를 쓰지 말고, 상대와 이어서 말하듯 2~4문장 안팎으로 답하세요. 반말은 절대 쓰지 말고, 사용자가 반말로 말해도 존댓말만 유지하세요.";
        }

        const res = await postAskRaw({
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
            isDailyAxisRefresh: opts.isDailyAxisRefresh || false,
            isDaeun: opts.isDaeun || false,
            isAnalytics: opts.isAnalytics || false,
            isTarot: opts.isTarot || false,
            isDream: opts.isDream || false,
            isName: opts.isName || false,
            isTaegil: opts.isTaegil || false,
            isSajuChapter: opts.isSajuChapter || false,
            responseStyle: style,
            precision_level: useAppStore.getState().dataPrecision?.level || "low",
            gender: useAppStore.getState().form?.gender || null,
            clientHour: new Date().getHours(),
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
    // cancellation flag — 사용자 빠른 전환 시 이전 사용자의 캐시 응답이
    // 새 사용자의 dailyResult를 덮어쓰는 데이터 누설 방지.
    let cancelled = false;

    loadDailyCacheFromSupabase(user.id, "horoscope").then((content) => {
      if (cancelled || !content) return;
      const gamData = parseHoroscopeForGamification(content);
      dailyHandler.setDailyResult({
        text: content,
        score: gamData.score,
        ...(gamData.badtime?.detected ? { badtime: gamData.badtime } : {}),
      });
    }).catch((e) => { if (!cancelled) console.error("[별숨] 오늘 별숨 캐시 로드 오류:", e); });

    loadDailyCacheFromSupabase(user.id, "diary_review").then((content) => {
      if (!cancelled && content) dailyHandler.setDiaryReviewResult(content);
    }).catch((e) => { if (!cancelled) console.error("[별숨] 일기 리뷰 캐시 로드 오류:", e); });

    loadDailyCacheFromSupabase(user.id, "horoscope_count").then((countStr) => {
      if (!cancelled && countStr) dailyHandler.setDailyCount(parseInt(countStr, 10) || 0);
    }).catch((e) => { if (!cancelled) console.error("[별숨] 별숨 횟수 캐시 로드 오류:", e); });

    return () => { cancelled = true; };
  }, [user?.id]);

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
    dailyResult: dailyHandler.dailyResult,
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

    if (user?.id && !isLocalLayoutUser(user)) {
      const totalCost = selQs.length * BM_COST_PER_ASK;
      const confirmed = await useAppStore.getState().showBPConfirm(totalCost, selQs.length);
      if (!confirmed) return;

      const currentBm = useAppStore.getState().gamificationState?.currentBp ?? 0;
      if (currentBm < totalCost) {
        if (showToast) showToast(`BP가 부족해요. (필요: ${totalCost} BP, 보유: ${currentBm} BP)`, "error");
        return;
      }

      if (typeof window.gtag === "function") window.gtag("event", "ask_claude", { question_count: selQs.length });
      setStep(STEP.LOADING);
      setAnswers([]);
      setTypedSet(new Set());
      setOpenAcc(0);

      const authClient = getAuthenticatedClient(user.id);
      const { ok, newBP } = await spendBPUtil(authClient || supabase, user.id, totalCost, "ASK_CLAUDE");
      if (!ok) {
        if (showToast) showToast("BP가 부족해요.", "error");
        setStep(STEP.QUESTION);
        return;
      }

      const cur = useAppStore.getState().gamificationState || {};
      useAppStore.getState().setGamificationData({
        gamificationState: { ...cur, currentBp: newBP ?? (currentBm - totalCost) },
        missions: useAppStore.getState().missions || [],
      });
    } else {
      if (typeof window.gtag === "function") window.gtag("event", "ask_claude", { question_count: selQs.length });
      setStep(STEP.LOADING);
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
      setStep(STEP.PROFILE);
      return;
    }

    if (user?.id && !isLocalLayoutUser(user)) {
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
    setStep(STEP.LOADING);
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
      setStep(STEP.PROFILE);
      return;
    }
    const q = TIME_CONFIG[timeSlot].label;
    setSelQs([q]);
    setStep(STEP.LOADING);
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
      setStep(STEP.PROFILE);
      return;
    }
    await dailyHandler.askDailyHoroscope(options);
  }, [dailyHandler, formOk, setStep]);

  const askReview = useCallback(async (text, prompt) => {
    if (!formOk) {
      setStep(STEP.PROFILE);
      return;
    }
    const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? "…" : ""}`;
    setSelQs([q]);
    setStep(STEP.LOADING);
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
      setStep(STEP.PROFILE);
      return;
    }
    await dailyHandler.askDiaryReview(text, prompt);
  }, [dailyHandler, formOk, setStep]);

  const askWeeklyReview = useCallback(async (text) => {
    if (!formOk) {
      setStep(STEP.PROFILE);
      return;
    }
    const q = `이번 주 회고: ${text.slice(0, 30)}${text.length > 30 ? "…" : ""}`;
    setSelQs([q]);
    setStep(STEP.LOADING);
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
  }, []);

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

  return useMemo(() => ({
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
  }), [timeSlot, loadingMsgIdx, step, setStep, cat, setCat, selQs, setSelQs, diy, setDiy, pkg, setPkg, answers, setAnswers, openAcc, setOpenAcc, generateChatSuggestions, typedSet, setTypedSet, chatHistory, chatInput, setChatInput, chatLoading, chatUsed, latestChatIdx, chatLeft, maxQ, maxChat, curPkg, reportText, reportLoading, histItem, setHistItem, histItems, setHistItems, chatEndRef, qLoadStatus, callApi, retryMsg, addQ, rmQ, dailyResult, dailyLoading, dailyCount, DAILY_MAX, diaryReviewResult, diaryReviewLoading, askClaude, askQuick, askTimeSlot, askDailyHoroscope, askReview, askDiaryReview, askWeeklyReview, resetDiaryReview, retryAnswer, handleTypingDone, handleAccToggle, sendChat, sendStreamChat, genReport, deleteHistoryItem, deleteAllHistoryItems, resetSession]);
}
