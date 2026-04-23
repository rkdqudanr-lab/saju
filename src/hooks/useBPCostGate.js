/**
 * BP 기반 질문 게이트 로직
 */

import { useCallback, useRef } from 'react';

const QUESTION_COST = 30;

export function useBPCostGate(user, gamificationState, earnBP, showToast) {
  const pendingRef = useRef(false);

  const askQuestion = useCallback(
    async (_question, _type = 'quick') => {
      if (!user?.id) {
        return { success: false, error: '로그인이 필요합니다.' };
      }

      if (pendingRef.current) {
        return { success: false, pending: true, error: 'already_processing' };
      }

      const currentBp = gamificationState?.currentBp || 0;
      const cost = QUESTION_COST;

      if (currentBp < cost) {
        return {
          success: false,
          blocked: true,
          cost,
          currentBp,
          shortage: cost - currentBp,
        };
      }

      pendingRef.current = true;
      try {
        const result = await earnBP(-cost, 'question_ask');
        if (!result.success) {
          showToast?.('BP 차감 중 오류가 발생했어요.', 'error');
          return { success: false, error: 'bp_charge_failed' };
        }

        return {
          success: true,
          cost,
          remainingBp: result.newBp,
        };
      } catch (error) {
        console.error('[별숨] 질문 BP 차감 오류:', error);
        return { success: false, error: 'unexpected_error' };
      } finally {
        pendingRef.current = false;
      }
    },
    [user?.id, gamificationState?.currentBp, earnBP, showToast]
  );

  return {
    askQuestion,
    QUESTION_COST,
  };
}
