/**
 * 게이미피케이션 훅 (useGamification)
 * BP 시스템, 배드타임 감지, 액막이, 미션, 레벨 관리 로직
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase, getAuthenticatedClient } from '../lib/supabase.js';
import {
  BP_EARNING_RULES,
  BADTIME_BLOCK_COST,
  FREE_BP_RECHARGE,
  GUARDIAN_LEVEL_THRESHOLDS,
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
  const initLoadedRef = useRef(false);

  // ─────────────────────────────────────────────────────────────
  // 1. 초기화: 로그인 사용자의 게이미피케이션 정보 로드
  // ─────────────────────────────────────────────────────────────
  const initializeGamification = useCallback(async () => {
    if (!user?.id || initLoadedRef.current) return;

    initLoadedRef.current = true;
    setIsLoading(true);

    try {
      const authClient = getAuthenticatedClient(user.id);
      const client = authClient || supabase;

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
        await client.from('daily_bp_log').upsert(
          {
            kakao_id: String(user.id),
            date: today,
            bp_amount: amount,
            reason,
            mission_id: missionId,
          },
          { onConflict: 'kakao_id,date,reason' }
        );

        // users 테이블의 current_bp 증가
        const { data: currentUser } = await client
          .from('users')
          .select('current_bp')
          .eq('kakao_id', String(user.id))
          .maybeSingle();

        const newBp = (currentUser?.current_bp || 0) + amount;

        await client
          .from('users')
          .update({ current_bp: newBp, updated_at: new Date().toISOString() })
          .eq('kakao_id', String(user.id));

        // user_gamification에 누적 기록
        await client
          .from('user_gamification')
          .upsert(
            {
              kakao_id: String(user.id),
              total_bp_earned: amount, // 증분 아님, 이후 트리거로 누적 처리 필요
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'kakao_id' }
          );

        // 로컬 상태 업데이트
        setGamificationState(prev => ({
          ...prev,
          currentBp: newBp,
        }));

        if (showToast) showToast(`+${amount} BP 획득! 🎉`);

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

        // daily_bp_log에 소비 기록
        await client.from('daily_bp_log').insert({
          kakao_id: String(user.id),
          date: getTodayDateStr(),
          bp_amount: -cost,
          reason: 'badtime_block',
          mission_id: badtimeId,
        });

        // user_gamification 업데이트
        await client
          .from('user_gamification')
          .update({
            last_badtime_blocked: new Date().toISOString(),
            badtime_blocks_count: currentState.badtimeBlocksCount + 1,
            total_bp_spent: cost,
            updated_at: new Date().toISOString(),
          })
          .eq('kakao_id', String(user.id));

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

        // BP 획득 (일일 로그인 보상)
        await earnBP(bpGain, 'login');

        // 로컬 상태 업데이트
        setGamificationState(prev => ({
          ...prev,
          loginStreak: newStreak > 0 ? newStreak : (prev.loginStreak + 1),
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
  // 6. 미션 완료
  // ─────────────────────────────────────────────────────────────
  const completeMission = useCallback(
    async (missionId) => {
      if (!user?.id) return { success: false };

      try {
        const authClient = getAuthenticatedClient(user.id);
        const client = authClient || supabase;

        // missions 테이블 업데이트
        await client
          .from('missions')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', missionId)
          .eq('kakao_id', String(user.id));

        // 미션 타입 확인 후 BP 획득 (do/dont는 5 BP, 나머지는 10 BP)
        const completedMission = missions.find(m => m.id === missionId);
        const bpReward = getMissionBpReward(completedMission?.mission_type);
        const bpReason = (completedMission?.mission_type === 'do' || completedMission?.mission_type === 'dont')
          ? 'do_dont_mission'
          : 'mission';
        await earnBP(bpReward, bpReason, missionId);

        // 미션 목록 새로고침
        await loadTodayMissions(user.id);

        // 총 미션 완료 수 업데이트
        const { data: gamData } = await client
          .from('user_gamification')
          .select('total_missions_done')
          .eq('kakao_id', String(user.id))
          .maybeSingle();

        const newTotalMissions = (gamData?.total_missions_done || 0) + 1;

        await client
          .from('user_gamification')
          .update({
            total_missions_done: newTotalMissions,
          })
          .eq('kakao_id', String(user.id));

        setGamificationState(prev => ({
          ...prev,
          totalMissionsCompleted: newTotalMissions,
        }));

        // 레벨 승격 체크
        await checkLevelPromotion(user.id, newTotalMissions);

        // 미션 50% 달성 마일스톤 보너스 (하루 1회)
        const today = getTodayDateStr();
        const { data: allMissions } = await client
          .from('missions')
          .select('is_completed')
          .eq('kakao_id', String(user.id))
          .eq('date', today);

        if (allMissions && allMissions.length > 0) {
          const completedCount = allMissions.filter(m => m.is_completed).length;
          const completionRate = completedCount / allMissions.length;

          if (completionRate >= 0.5) {
            // 오늘 마일스톤 보너스를 이미 받았는지 확인
            const { data: milestoneLog } = await client
              .from('daily_bp_log')
              .select('id')
              .eq('kakao_id', String(user.id))
              .eq('date', today)
              .eq('reason', 'milestone')
              .maybeSingle();

            if (!milestoneLog) {
              await earnBP(BP_EARNING_RULES.MISSION_MILESTONE, 'milestone');
              if (showToast) showToast(`미션 50% 달성 보너스 +${BP_EARNING_RULES.MISSION_MILESTONE} BP ✨`);
            }
          }
        }

        if (showToast) showToast('미션 완료! 🎯');

        return { success: true };
      } catch (error) {
        console.error('[별숨] 미션 완료 오류:', error);
        return { success: false };
      }
    },
    [user?.id, earnBP, loadTodayMissions, showToast]
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
  // 7. 레벨 승격 체크
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
          // 레벨 승격
          await client
            .from('users')
            .update({ guardian_level: newLevel })
            .eq('kakao_id', String(kakaoId));

          // 승격 이력 기록
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

          if (showToast) showToast(`레벨 업! Lv${newLevel} 달성 🌟`);
        }
      } catch (error) {
        console.error('[별숨] 레벨 승격 체크 오류:', error);
      }
    },
    [showToast]
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
        const lastRechargeDate = userData?.free_bp_recharge_at;

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

    // 유틸
    getTodayDateStr,
  };
}

export default useGamification;
