/**
 * useBPCostGate 훅
 * BP 기반 질문 게이팅 로직
 */

import { useCallback } from 'react';

const QUESTION_COST = 30; // 질문당 필요한 BP

export function useBPCostGate(user, gamificationState, earnBP, showToast) {
  /**
   * 질문하기 전에 BP를 차감하고 성공/실패 반환
   * @param {string} question - 질문 내용
   * @param {string} type - 질문 타입 ('quick' | 'detailed')
   * @returns {Promise<Object>} { success, blocked, remaining, cost }
   */
  const askQuestion = useCallback(
    async (question, type = 'quick') => {
      if (!user?.id) {
        return { success: false, error: '로그인이 필요합니다' };
      }

      const currentBp = gamificationState?.currentBp || 0;
      const cost = QUESTION_COST;

      // BP 부족 체크
      if (currentBp < cost) {
        return {
          success: false,
          blocked: true,
          cost,
          currentBp,
          shortage: cost - currentBp,
        };
      }

      // BP 차감
      try {
        const result = await earnBP(-cost, 'question_ask');
        if (!result.success) {
          if (showToast) showToast('네트워크 오류가 발생했습니다', 'error');
          return { success: false, error: '네트워크 오류' };
        }

        return {
          success: true,
          cost,
          remainingBp: result.newBp,
        };
      } catch (error) {
        console.error('[별숨] 질문 BP 차감 오류:', error);
        return { success: false, error: '오류가 발생했습니다' };
      }
    },
    [user?.id, gamificationState?.currentBp, earnBP, showToast]
  );

  return {
    askQuestion,
    QUESTION_COST,
  };
}
