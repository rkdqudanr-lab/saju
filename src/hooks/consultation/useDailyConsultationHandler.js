import { useState, useCallback, useMemo } from "react";
import { useAppStore } from "../../store/useAppStore.js";
import { supabase, getAuthenticatedClient } from "../../lib/supabase.js";
import { getDailyDateKey } from "../../lib/dailyDataAccess.js";
import { parseHoroscopeForGamification } from "../../utils/missionGenerator.js";
import { spendBP as spendBPUtil } from "../../utils/gamificationLogic.js";

const BM_COST_PER_ASK = 10;
const ERR_MSG = '별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!';
const LOCAL_LAYOUT_MODE = import.meta.env.DEV;

function isLocalLayoutUser(user) {
  return LOCAL_LAYOUT_MODE && user?.id === 'test_user_id';
}

export function useDailyConsultationHandler({
  formOk,
  user,
  showToast,
  callApi,
  dailyMax,
  onDailyLimitReached,
  onMissionsSaved,
  saveHistoryToSupabase,
  timeSlot,
  saveDailyCache,
  getTodayDateStr,
}) {
  const [dailyResult, setDailyResult] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [diaryReviewResult, setDiaryReviewResult] = useState(null);
  const [diaryReviewLoading, setDiaryReviewLoading] = useState(false);

  const askDailyHoroscope = useCallback(async (options = {}) => {
    if (!formOk) return false;
    if (dailyLoading) return false;
    if (!options.ignoreDailyLimit && dailyCount >= dailyMax) {
      if (typeof onDailyLimitReached === "function") onDailyLimitReached();
      return false;
    }

    const shouldChargeBp = !options.skipBpCharge && !isLocalLayoutUser(user);
    const shouldConfirm = !options.skipConfirm;
    const shouldSaveHistory = options.saveHistory !== false;
    const shouldIncrementCount = options.incrementCount !== false;

    if (shouldChargeBp && user?.id) {
      if (shouldConfirm) {
        const confirmed = await useAppStore.getState().showBPConfirm(BM_COST_PER_ASK, 1);
        if (!confirmed) return false;
      }
      // 확인 직후 즉시 로딩 표시 (Supabase 처리 전)
      setDailyLoading(true);
      useAppStore.getState().setFeatureLoading({ type: 'daily', text: '오늘의 별 기운을 읽는 중...' });
      const currentBm = useAppStore.getState().gamificationState?.currentBp ?? 0;
      if (currentBm < BM_COST_PER_ASK) {
        if (showToast) showToast(`BP가 부족해요. (필요: ${BM_COST_PER_ASK} BP, 보유: ${currentBm} BP)`, "error");
        setDailyLoading(false);
        useAppStore.getState().setFeatureLoading(null);
        return false;
      }
      const authClient = getAuthenticatedClient(user.id);
      const { ok, newBP } = await spendBPUtil(authClient || supabase, user.id, BM_COST_PER_ASK, "DAILY_HOROSCOPE");
      if (!ok) {
        if (showToast) showToast("BP가 부족해요.", "error");
        setDailyLoading(false);
        useAppStore.getState().setFeatureLoading(null);
        return false;
      }
      const cur = useAppStore.getState().gamificationState || {};
      useAppStore.getState().setGamificationData({
        gamificationState: { ...cur, currentBp: newBP ?? (currentBm - BM_COST_PER_ASK) },
        missions: useAppStore.getState().missions || [],
      });
    } else {
      // BP 불필요 사용자는 버튼 탭 즉시 로딩
      setDailyLoading(true);
      useAppStore.getState().setFeatureLoading({ type: 'daily', text: '오늘의 별 기운을 읽는 중...' });
    }

    if (typeof window.gtag === "function") window.gtag("event", "daily_horoscope_click");
    try {
      const rawAns = await callApi("오늘 하루 나의 별숨은?", {
        isDaily: true,
        boostMap: options.boostMap || null,
      });
      // 일일 운세 응답 후처리: 금지 표현 자동 교체
      const ans = rawAns
        .replace(/해보세요/g, '하세요')
        .replace(/하면 좋아요/g, '하세요')
        .replace(/([가-힣]+)\s*에너지로\s*/g, (_, pre) => `${pre}으로 `)
        .replace(/([가-힣]+)\s*에너지가\s*/g, (_, pre) => `${pre}이 `)
        .replace(/([가-힣]+)\s*에너지를\s*/g, (_, pre) => `${pre}을 `)
        .replace(/에너지\s*집중/g, '집중력')
        .replace(/에너지/g, '추진력');
      const newCount = shouldIncrementCount ? dailyCount + 1 : dailyCount;
      // [PATCH] Preserve previous score during initial text update to prevent UI flickering
      setDailyResult(prev => ({ ...prev, text: ans }));
      if (shouldIncrementCount) setDailyCount(newCount);

      if (user?.id) {
        await saveDailyCache(user.id, "horoscope", ans);
        if (shouldIncrementCount) {
          await saveDailyCache(user.id, "horoscope_count", String(newCount));
        }

        try {
          const gamData = parseHoroscopeForGamification(ans);
          if (isLocalLayoutUser(user)) {
            setDailyResult((prev) => ({
              ...prev,
              score: gamData.score,
              ...(gamData.badtime?.detected ? { badtime: gamData.badtime } : {}),
            }));
            return true;
          }

          const authClient = getAuthenticatedClient(user.id);
          const client = authClient || supabase;
          if (!client) {
            setDailyResult((prev) => ({
              ...prev,
              score: gamData.score,
              ...(gamData.badtime?.detected ? { badtime: gamData.badtime } : {}),
            }));
            return true;
          }
          const today = getTodayDateStr();

          if (gamData.missions && gamData.missions.length > 0) {
            await client.from("missions").delete().eq("kakao_id", String(user.id)).eq("date", today);
            const uniqueMissions = Array.from(
              new Map(gamData.missions.map((mission) => [mission.type, mission])).values()
            );
            const { error: missionError } = await client.from("missions").upsert(
              uniqueMissions.map((mission) => ({
                kakao_id: String(user.id),
                date: today,
                mission_type: mission.type,
                mission_content: mission.content,
                bp_reward: mission.bpReward || 10,
                is_completed: false,
              })),
              { onConflict: "kakao_id,date,mission_type" }
            );
            if (missionError) throw missionError;
            if (typeof onMissionsSaved === "function") onMissionsSaved();
          }

          setDailyResult((prev) => ({
            ...prev,
            score: gamData.score,
            ...(gamData.badtime?.detected ? { badtime: gamData.badtime } : {}),
          }));

          if (gamData.score != null) {
            saveDailyCache(user.id, "horoscope_score", String(gamData.score)).catch(() => {});
            const scoreDate = getDailyDateKey();
            await client.from("daily_scores").upsert(
              { kakao_id: String(user.id), score_date: scoreDate, score: gamData.score },
              { onConflict: "kakao_id,score_date" }
            );
          }
        } catch (gamErr) {
          console.error("[별숨] 게이미피케이션 처리 오류:", gamErr);
        }
      }

      if (shouldSaveHistory) {
        saveHistoryToSupabase(["오늘 하루 나의 별숨은?"], [ans], timeSlot);
      }

      return true;
    } catch (err) {
      console.error("[askDailyHoroscope] Error:", err);
      return false;
    } finally {
      setDailyLoading(false);
      useAppStore.getState().setFeatureLoading(null);
    }
  }, [callApi, dailyCount, dailyLoading, dailyMax, formOk, getTodayDateStr, onDailyLimitReached, onMissionsSaved, saveDailyCache, saveHistoryToSupabase, showToast, timeSlot, user?.id]);

  const askReview = useCallback(async (text, prompt) => {
    const ans = await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
    const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? "…" : ""}`;
    saveHistoryToSupabase([q], [ans], timeSlot);
    return { question: q, answer: ans };
  }, [callApi, saveHistoryToSupabase, timeSlot]);

  const askDiaryReview = useCallback(async (text, prompt) => {
    if (!formOk) return null;
    setDiaryReviewLoading(true);
    try {
      const ans = await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
      setDiaryReviewResult(ans);
      if (user?.id) await saveDailyCache(user.id, "diary_review", ans);
      const q = `오늘 하루 회고: ${text.slice(0, 30)}${text.length > 30 ? "…" : ""}`;
      saveHistoryToSupabase([q], [ans], timeSlot);
      return ans;
    } catch {
      setDiaryReviewResult(ERR_MSG);
      return null;
    } finally {
      setDiaryReviewLoading(false);
    }
  }, [callApi, formOk, saveDailyCache, saveHistoryToSupabase, timeSlot, user?.id]);

  const askWeeklyReview = useCallback(async (text) => {
    const ans = await callApi(`[이번 주의 경험과 감정]\n${text}`, { isWeekly: true });
    const q = `이번 주 회고: ${text.slice(0, 30)}${text.length > 30 ? "…" : ""}`;
    saveHistoryToSupabase([q], [ans], timeSlot);
    return { question: q, answer: ans };
  }, [callApi, saveHistoryToSupabase, timeSlot]);

  return useMemo(() => ({
    dailyResult,
    dailyLoading,
    dailyCount,
    diaryReviewResult,
    diaryReviewLoading,
    setDailyResult,
    setDailyCount,
    setDiaryReviewResult,
    askDailyHoroscope,
    askReview,
    askDiaryReview,
    askWeeklyReview,
    resetDiaryReview: () => { setDiaryReviewResult(null); },
  }), [dailyResult, dailyLoading, dailyCount, diaryReviewResult, diaryReviewLoading, setDailyResult, setDailyCount, setDiaryReviewResult, askDailyHoroscope, askReview, askDiaryReview, askWeeklyReview]);
}
