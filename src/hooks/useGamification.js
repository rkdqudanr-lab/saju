/**
 * 게이미피케이션 훅 (useGamification)
 * BP 시스템, 배드타임 감지, 액막이, 미션, 레벨 관리 로직
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase, getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import {
  BP_EARNING_RULES,
  BADTIME_BLOCK_COST,
  FREE_BP_RECHARGE,
  GUARDIAN_LEVEL_THRESHOLDS,
  STREAK_FREEZE_COST,
  calculateLevelPromotion,
  calculateLoginStreak,
  calculateLevelProgress,
} from '../utils/gamificationLogic.js';

// do/dont 미션은 5 BP, 나머지는 10 BP
function getMissionBpReward(missionType) {
  if (missionType === 'do' || missionType === 'dont') return BP_EARNING_RULES.DO_DONT_COMPLETE;
  return BP_EARNING_RULES.MISSION_COMPLETE;
}

// ════════════════════════════════════════════════════════════════
// 유틸 함수
// ════════════════════════════════════════════════════════════════

function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * useGamification 훅
 * 게이미피케이션 시스템의 모든 로직을 담당
 *
 * @param {Object} user - 로그인 사용자 { id (kakao_id), ... }
 * @param {Function} [showToast] - 토스트 메시지 콜백 (선택)
 * @returns {Object} 게이미피케이션 상태 및 함수들
 */
export function useGamification(user, showToast) {
  const [gamificationState, setGamificationState] = useState({
    currentBp: 0,
    guardianLevel: 1,
    loginStreak: 0,
    totalMissionsCompleted: 0,
    badtimeBlocksCount: 0,
    lastLoginDate: null,
    nextLevelMissions: 15, // Lv2까지 남은 미션 수
  });

  const [missions, setMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const initLoadedRef = useRef(null); // null or last-loaded user ID

  // ─────────────────────────────────────────────────────────────
  // 1. 초기화: 로그인 사용자의 게이미피케이션 정보 로드
  // ─────────────────────────────────────────────────────────────
  const initializeGamification = useCallback(async () => {
    // user가 바뀌어도 재초기화 — ref에 마지막 초기화한 userId 저장
    if (!user?.id || initLoadedRef.current === user.id) return;

    initLoadedRef.current = user.id;
    setIsLoading(true);

    try {
      const authClient = getAuthenticatedClient(user.id);
      const client = authClient || supabase;
      if (!client) return;

      // users 테이블에서 게이미피케이션 정보 로드
      const { data: userData } = await client
        .from('users')
        .select('current_bp, guardian_level, login_streak, last_login_date')
        .eq('kakao_id', String(user.id))
        .maybeSingle();

      if (userData) {
        setGamificationState(prev => ({
          ...prev,
          currentBp: userData.current_bp || 0,
          guardianLevel: userData.guardian_level || 1,
          loginStreak: userData.login_streak || 0,
          lastLoginDate: userData.last_login_date,
        }));
      }

      // user_gamification 테이블에서 통계 로드
      const { data: gamData } = await client
        .from('user_gamification')
        .select('total_missions_done, badtime_blocks_count')
        .eq('kakao_id', String(user.id))
        .maybeSingle();

      if (gamData) {
        setGamificationState(prev => ({
          ...prev,
          totalMissionsCompleted: gamData.total_missions_done || 0,
          badtimeBlocksCount: gamData.badtime_blocks_count || 0,
        }));
      }

      // 다음 레벨까지 남은 미션 계산
      const nextLevel = Math.min(5, (userData?.guardian_level || 1) + 1);
      const nextThreshold = GUARDIAN_LEVEL_THRESHOLDS[nextLevel];
      const remaining = Math.max(0, nextThreshold.missions - (gamData?.total_missions_done || 0));

      setGamificationState(prev => ({
        ...prev,
        nextLevelMissions: remaining,
      }));

      // 일일 로그인 스트릭 및 BP 획득
      await updateLoginStreakAndEarnBP(user.id, userData?.last_login_date);

      // 오늘의 미션 로드
      await loadTodayMissions(user.id);
    } catch (error) {
      console.error('[별숨] 게이미피케이션 초기화 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    initializeGamification();
  }, [initializeGamification]);

  // ─────────────────────────────────────────────────────────────
  // 2. BP 획득
  // ─────────────────────────────────────────────────────────────
  const earnBP = useCallback(
    async (amount, reason, missionId = null) => {
      if (!user?.id) return { success: false, message: '로그인이 필요합니다' };

      try {
        const authClient = getAuthenticatedClient(user.id);
        const client = authClient || supabase;
        const today = getTodayDateStr();

        // daily_bp_log에 기록
        // 미션 완료 시 reason을 mission_id 포함해 고유하게 만들어 같은 날 여러 미션 로그가 충돌하지 않도록 함
        const needsUniqueReason = !missionId && amount < 0 && reason === 'question_ask';
        const logReason = missionId
          ? `${reason}_${missionId}`
          : needsUniqueReason
            ? `${reason}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
            : reason;
        const { error: bpLogError } = await client.from('daily_bp_log').upsert(
          {
            kakao_id: String(user.id),
            date: today,
            bp_amount: amount,
            reason: logReason,
            mission_id: missionId,
          },
          { onConflict: 'kakao_id,date,reason', ignoreDuplicates: true }
        );

        if (bpLogError && bpLogError.code !== '23505') {
          throw bpLogError;
        }

        // users + user_gamification 동시 조회
        const [{ data: currentUser }, { data: gamRow }] = await Promise.all([
          client.from('users').select('current_bp').eq('kakao_id', String(user.id)).maybeSingle(),
          client.from('user_gamification').select('total_bp_earned').eq('kakao_id', String(user.id)).maybeSingle(),
        ]);

        const newBp = (currentUser?.current_bp || 0) + amount;
        const newTotalEarned = (gamRow?.total_bp_earned || 0) + amount;

        await client
          .from('users')
          .update({ current_bp: newBp, updated_at: new Date().toISOString() })
          .eq('kakao_id', String(user.id));

        // user_gamification 누적 합산 upsert
        await client.from('user_gamification').upsert(
          { kakao_id: String(user.id), total_bp_earned: newTotalEarned, updated_at: new Date().toISOString() },
          { onConflict: 'kakao_id' }
        );

        // 로컬 상태 업데이트
        setGamificationState(prev => ({
          ...prev,
          currentBp: newBp,
        }));

        if (showToast && reason !== 'first_login' && reason !== `streak_milestone_7` && reason !== `streak_milestone_14` && reason !== `streak_milestone_21`) showToast(`+${amount} BP 획득! 🎉`);

        return { success: true, newBp };
      } catch (error) {
        console.error('[별숨] BP 획득 오류:', error);
        return { success: false, message: '네트워크 오류' };
      }
    },
    [user?.id, showToast]
  );

  // ─────────────────────────────────────────────────────────────
  // 3. 배드타임 액막이 (BP 소비)
  // ─────────────────────────────────────────────────────────────
  const blockBadtime = useCallback(
    async (badtimeId, cost = BADTIME_BLOCK_COST.DEFAULT) => {
      if (!user?.id) return { success: false, message: '로그인이 필요합니다' };

      const currentState = gamificationState;

      // BP 부족 체크
      if (currentState.currentBp < cost) {
        if (showToast) showToast('BP가 부족합니다 😢');
        return { success: false, message: 'BP 부족' };
      }

      try {
        const authClient = getAuthenticatedClient(user.id);
        const client = authClient || supabase;

        // BP 소비
        const newBp = currentState.currentBp - cost;

        await client
          .from('users')
          .update({
            current_bp: newBp,
            updated_at: new Date().toISOString(),
          })
          .eq('kakao_id', String(user.id));

        // daily_bp_log에 소비 기록 (badtimeId별 고유 reason → 같은 날 여러 번 가능)
        await client.from('daily_bp_log').upsert(
          {
            kakao_id: String(user.id),
            date: getTodayDateStr(),
            bp_amount: -cost,
            reason: `badtime_block_${badtimeId}`,
            mission_id: badtimeId,
          },
          { onConflict: 'kakao_id,date,reason', ignoreDuplicates: true }
        );

        // user_gamification 누적 upsert (row 없어도 생성)
        const { data: gamRow } = await client
          .from('user_gamification')
          .select('total_bp_spent')
          .eq('kakao_id', String(user.id))
          .maybeSingle();

        await client.from('user_gamification').upsert(
          {
            kakao_id: String(user.id),
            last_badtime_blocked: new Date().toISOString(),
            badtime_blocks_count: currentState.badtimeBlocksCount + 1,
            total_bp_spent: (gamRow?.total_bp_spent || 0) + cost,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'kakao_id' }
        );

        // 로컬 상태 업데이트
        setGamificationState(prev => ({
          ...prev,
          currentBp: newBp,
          badtimeBlocksCount: prev.badtimeBlocksCount + 1,
        }));

        if (showToast) showToast(`액막이 발동! -${cost} BP 🛡️`);

        return { success: true, newBp };
      } catch (error) {
        console.error('[별숨] 배드타임 액막이 오류:', error);
        return { success: false, message: '네트워크 오류' };
      }
    },
    [user?.id, gamificationState, showToast]
  );

  // ─────────────────────────────────────────────────────────────
  // 4. 로그인 스트릭 업데이트 및 일일 로그인 BP 획득
  // ─────────────────────────────────────────────────────────────
  const updateLoginStreakAndEarnBP = useCallback(
    async (kakaoId, lastLoginDateStr) => {
      try {
        const authClient = getAuthenticatedClient(kakaoId);
        const client = authClient || supabase;

        const { newStreak, isFirstLoginToday, bpGain, isConsecutiveDay } =
          calculateLoginStreak(lastLoginDateStr);

        // 이미 오늘 로그인했으면 스킵
        if (!isFirstLoginToday) {
          return;
        }

        // users 테이블 업데이트
        if (isConsecutiveDay) {
          // 스트릭 증가
          await client.rpc('increment_login_streak', { kid: String(kakaoId) });
        } else {
          // 스트릭 리셋
          await client
            .from('users')
            .update({
              login_streak: 1,
              last_login_date: getTodayDateStr(),
              daily_login_reward_at: getTodayDateStr(),
              updated_at: new Date().toISOString(),
            })
            .eq('kakao_id', String(kakaoId));
        }

        // 최초 로그인 보너스 (last_login_date가 null이면 첫 가입)
        if (!lastLoginDateStr) {
          await earnBP(BP_EARNING_RULES.FIRST_LOGIN, 'first_login');
          if (showToast) showToast(`🎉 별숨에 오신 것을 환영해요! +${BP_EARNING_RULES.FIRST_LOGIN} BP 지급!`, 'success');
        }

        // BP 획득 (일일 로그인 보상)
        if (lastLoginDateStr) {
          await earnBP(bpGain, 'login');
        }

        // 스트릭 마일스톤 보너스 (7/14/21일 연속 → 100 BP 보너스)
        const achievedStreak = newStreak > 0 ? newStreak : ((gamificationState.loginStreak || 0) + 1);
        const STREAK_MILESTONES = { 7: 100, 14: 100, 21: 100 };
        if (STREAK_MILESTONES[achievedStreak]) {
          await earnBP(STREAK_MILESTONES[achievedStreak], `streak_milestone_${achievedStreak}`);
          if (showToast) showToast(`🔥 ${achievedStreak}일 연속 출석! +${STREAK_MILESTONES[achievedStreak]} BP 보너스!`, 'success');
        }

        // 로컬 상태 업데이트
        setGamificationState(prev => ({
          ...prev,
          loginStreak: achievedStreak,
        }));
      } catch (error) {
        console.error('[별숨] 로그인 스트릭 업데이트 오류:', error);
      }
    },
    [earnBP]
  );

  // ─────────────────────────────────────────────────────────────
  // 5. 오늘의 미션 로드
  // ─────────────────────────────────────────────────────────────
  const loadTodayMissions = useCallback(
    async (kakaoId) => {
      try {
        const authClient = getAuthenticatedClient(kakaoId);
        const client = authClient || supabase;

        const today = getTodayDateStr();

        const { data: todayMissions } = await client
          .from('missions')
          .select('*')
          .eq('kakao_id', String(kakaoId))
          .eq('date', today);

        setMissions(todayMissions || []);

        // today_missions_done 카운트
        const completedCount = (todayMissions || []).filter(m => m.is_completed).length;
        setGamificationState(prev => ({
          ...prev,
          todayMissionsDone: completedCount,
        }));
      } catch (error) {
        console.error('[별숨] 미션 로드 오류:', error);
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────
  // 6. 레벨 승격 체크 (completeMission에서 사용하므로 먼저 선언)
  // ─────────────────────────────────────────────────────────────
  const checkLevelPromotion = useCallback(
    async (kakaoId, totalMissions) => {
      try {
        const authClient = getAuthenticatedClient(kakaoId);
        const client = authClient || supabase;

        const { data: gamData } = await client
          .from('user_gamification')
          .select('badtime_blocks_count')
          .eq('kakao_id', String(kakaoId))
          .maybeSingle();

        const { data: userData } = await client
          .from('users')
          .select('guardian_level, login_streak')
          .eq('kakao_id', String(kakaoId))
          .maybeSingle();

        const newLevel = calculateLevelPromotion(
          totalMissions,
          gamData?.badtime_blocks_count || 0,
          userData?.login_streak || 0
        );

        const currentLevel = userData?.guardian_level || 1;

        if (newLevel > currentLevel) {
          await client
            .from('users')
            .update({ guardian_level: newLevel })
            .eq('kakao_id', String(kakaoId));

          await client.from('guardian_level_history').insert({
            kakao_id: String(kakaoId),
            from_level: currentLevel,
            to_level: newLevel,
            promotion_reason: 'missions',
          });

          setGamificationState(prev => ({
            ...prev,
            guardianLevel: newLevel,
          }));

          useAppStore.getState().setGuardianLevelUp({ fromLevel: currentLevel, toLevel: newLevel });
        }
      } catch (error) {
        console.error('[별숨] 레벨 승격 체크 오류:', error);
      }
    },
    [showToast]
  );

  // ─────────────────────────────────────────────────────────────
  // 7. 미션 완료
  // ─────────────────────────────────────────────────────────────
  const completeMission = useCallback(
    async (missionId) => {
      if (!user?.id) return { success: false };

      const completedMission = missions.find(m => m.id === missionId);
      const completedAt = new Date().toISOString();

      // ── 낙관적 UI 업데이트: DB 완료 전 즉시 반영 ──
      setMissions(prev =>
        prev.map(m => m.id === missionId ? { ...m, is_completed: true, completed_at: completedAt } : m)
      );
      if (showToast) showToast('미션 완료! 🎯');

      try {
        const authClient = getAuthenticatedClient(user.id);
        const client = authClient || supabase;

        const bpReward = getMissionBpReward(completedMission?.mission_type);
        const bpReason = (completedMission?.mission_type === 'do' || completedMission?.mission_type === 'dont')
          ? 'do_dont_mission' : 'mission';

        // ── 핵심 경로: DB 업데이트 + BP 적립 병렬 실행 ──
        await Promise.all([
          client.from('missions')
            .update({ is_completed: true, completed_at: completedAt })
            .eq('id', missionId)
            .eq('kakao_id', String(user.id)),
          earnBP(bpReward, bpReason, missionId),
        ]);

        // ── 비핵심 작업: 백그라운드에서 실행 (UI를 블로킹하지 않음) ──
        const kakaoIdStr = String(user.id);
        ;(async () => {
          try {
            // 게이미피케이션 stats 업데이트 + 레벨 체크
            const { data: gamData } = await client
              .from('user_gamification')
              .select('total_missions_done')
              .eq('kakao_id', kakaoIdStr)
              .maybeSingle();

            const newTotalMissions = (gamData?.total_missions_done || 0) + 1;

            await Promise.all([
              client.from('user_gamification').upsert(
                { kakao_id: kakaoIdStr, total_missions_done: newTotalMissions, updated_at: completedAt },
                { onConflict: 'kakao_id' }
              ),
              checkLevelPromotion(user.id, newTotalMissions),
            ]);

            setGamificationState(prev => ({ ...prev, totalMissionsCompleted: newTotalMissions }));

            // 50% 마일스톤 보너스 체크 (완료 후 로컬 missions 상태 기준)
            const today = getTodayDateStr();
            const { data: allMissions } = await client
              .from('missions')
              .select('is_completed')
              .eq('kakao_id', kakaoIdStr)
              .eq('date', today);

            if (allMissions && allMissions.length > 0) {
              const completedCount = allMissions.filter(m => m.is_completed).length;
              if (completedCount / allMissions.length >= 0.5) {
                const { data: milestoneLog } = await client
                  .from('daily_bp_log')
                  .select('id')
                  .eq('kakao_id', kakaoIdStr)
                  .eq('date', today)
                  .eq('reason', 'milestone')
                  .maybeSingle();
                if (!milestoneLog) {
                  await earnBP(BP_EARNING_RULES.MISSION_MILESTONE, 'milestone');
                  if (showToast) showToast(`미션 50% 달성 보너스 +${BP_EARNING_RULES.MISSION_MILESTONE} BP ✨`);
                }
              }
            }
          } catch (e) {
            console.error('[별숨] 미션 완료 후속 처리 오류:', e);
          }
        })();

        return { success: true };
      } catch (error) {
        // DB 실패 시 낙관적 업데이트 롤백
        setMissions(prev =>
          prev.map(m => m.id === missionId ? { ...m, is_completed: false, completed_at: null } : m)
        );
        console.error('[별숨] 미션 완료 오류:', error);
        return { success: false };
      }
    },
    [user?.id, earnBP, checkLevelPromotion, showToast, missions]
  );

  // ─────────────────────────────────────────────────────────────
  // 일기 BP 적립 (하루 1회 5 BP)
  // ─────────────────────────────────────────────────────────────
  const earnDiaryBP = useCallback(
    async () => {
      if (!user?.id) return { success: false };

      try {
        const authClient = getAuthenticatedClient(user.id);
        const client = authClient || supabase;
        const today = getTodayDateStr();

        // 오늘 이미 일기 BP를 받았는지 확인
        const { data: existingLog } = await client
          .from('daily_bp_log')
          .select('id')
          .eq('kakao_id', String(user.id))
          .eq('date', today)
          .eq('reason', 'diary')
          .maybeSingle();

        if (existingLog) {
          return { success: false, message: '오늘 이미 일기 BP를 받았어요' };
        }

        const result = await earnBP(BP_EARNING_RULES.DIARY_COMPLETE, 'diary');
        if (result.success && showToast) {
          showToast(`일기 작성 완료! +${BP_EARNING_RULES.DIARY_COMPLETE} BP 🌙`);
        }
        return result;
      } catch (error) {
        console.error('[별숨] 일기 BP 오류:', error);
        return { success: false };
      }
    },
    [user?.id, earnBP, showToast]
  );

  // ─────────────────────────────────────────────────────────────
  // 8. 무료 BP 충전
  // ─────────────────────────────────────────────────────────────
  const rechargeFreeBP = useCallback(
    async () => {
      if (!user?.id) return { success: false };

      try {
        const authClient = getAuthenticatedClient(user.id);
        const client = authClient || supabase;

        const { data: userData } = await client
          .from('users')
          .select('free_bp_recharge_at, guardian_level')
          .eq('kakao_id', String(user.id))
          .maybeSingle();

        const today = getTodayDateStr();
        // free_bp_recharge_at 컬럼이 timestamptz이므로 앞 10자(날짜)만 비교
        const lastRechargeDate = userData?.free_bp_recharge_at?.slice(0, 10);

        // 이미 오늘 충전했으면 스킵
        if (lastRechargeDate === today) {
          if (showToast) showToast('내일 다시 충전할 수 있습니다 ⏰');
          return { success: false, message: '일일 1회 제한' };
        }

        const level = userData?.guardian_level || 1;
        const rechargeAmount = FREE_BP_RECHARGE[level] || 5;

        await earnBP(rechargeAmount, 'free_recharge');

        await client
          .from('users')
          .update({
            free_bp_recharge_at: today,
          })
          .eq('kakao_id', String(user.id));

        return { success: true, recharged: rechargeAmount };
      } catch (error) {
        console.error('[별숨] 무료 BP 충전 오류:', error);
        return { success: false, message: '네트워크 오류' };
      }
    },
    [user?.id, earnBP, showToast]
  );

  // ─────────────────────────────────────────────────────────────
  // 9. BP 소비 (답변 잠금 해제 등)
  // ─────────────────────────────────────────────────────────────
  const spendBP = useCallback(
    async (amount, reason) => {
      if (!user?.id) return { success: false, message: '로그인이 필요합니다' };
      const current = gamificationState.currentBp || 0;
      if (current < amount) return { success: false, message: '별 포인트가 부족해요' };

      try {
        const authClient = getAuthenticatedClient(user.id);
        const client = authClient || supabase;
        const newBp = current - amount;

        await client
          .from('users')
          .update({ current_bp: newBp, updated_at: new Date().toISOString() })
          .eq('kakao_id', String(user.id));

        setGamificationState(prev => ({ ...prev, currentBp: newBp }));
        return { success: true, newBp };
      } catch (error) {
        console.error('[별숨] BP 소비 오류:', error);
        return { success: false, message: '네트워크 오류' };
      }
    },
    [user?.id, gamificationState.currentBp]
  );

  // ─────────────────────────────────────────────────────────────
  // 9-B. 스트릭 프리즈 (BP 소비로 끊김 1회 방지)
  // ─────────────────────────────────────────────────────────────
  const freezeStreak = useCallback(async () => {
    if (!user?.id) return { success: false, message: '로그인이 필요해요' };
    if (gamificationState.currentBp < STREAK_FREEZE_COST) {
      return { success: false, message: `BP가 부족해요 (필요: ${STREAK_FREEZE_COST} BP)` };
    }
    if (gamificationState.loginStreak < 2) {
      return { success: false, message: '스트릭이 2일 이상일 때 프리즈할 수 있어요' };
    }

    try {
      const authClient = getAuthenticatedClient(user.id);
      const client = authClient || supabase;

      const newBp = gamificationState.currentBp - STREAK_FREEZE_COST;

      await Promise.all([
        // BP 차감
        client.from('users')
          .update({ current_bp: newBp, updated_at: new Date().toISOString() })
          .eq('kakao_id', String(user.id)),
        // 프리즈 사용 로그
        client.from('daily_bp_log').insert({
          kakao_id: String(user.id),
          date: getTodayDateStr(),
          bp_amount: -STREAK_FREEZE_COST,
          reason: 'streak_freeze',
        }).catch(() => {}),
      ]);

      setGamificationState(prev => ({ ...prev, currentBp: newBp }));
      if (showToast) showToast(`❄️ 스트릭 프리즈 발동! ${STREAK_FREEZE_COST} BP 소비`);
      return { success: true, newBp };
    } catch (error) {
      console.error('[별숨] 스트릭 프리즈 오류:', error);
      return { success: false, message: '네트워크 오류' };
    }
  }, [user?.id, gamificationState.currentBp, gamificationState.loginStreak, showToast]);

  // ─────────────────────────────────────────────────────────────
  // 10. 레벨 진행도 계산
  // ─────────────────────────────────────────────────────────────
  const getLevelProgress = useCallback(() => {
    const state = gamificationState;
    return calculateLevelProgress(
      state.guardianLevel,
      state.totalMissionsCompleted,
      state.badtimeBlocksCount,
      state.loginStreak
    );
  }, [gamificationState]);

// ── Zustand 스토어에 게이미피케이션 데이터 주입 ──────────────
  useEffect(() => {
    // 💡 최상단 hook(useAppStore) 호출을 제거하고 내부 API로 직접 주입
    useAppStore.getState().setGamificationData({ gamificationState, missions });
  }, [gamificationState, missions]);

  // ─────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────
  return {
    // 상태
    gamificationState,
    missions,
    isLoading,

    // 함수
    earnBP,
    earnDiaryBP,
    spendBP,
    blockBadtime,
    completeMission,
    loadTodayMissions,
    rechargeFreeBP,
    getLevelProgress,
    checkLevelPromotion,
    freezeStreak,

    // 유틸
    getTodayDateStr,
  };
}

export default useGamification;
