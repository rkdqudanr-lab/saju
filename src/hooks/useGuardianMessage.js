import { useState, useEffect } from "react";
import { postAskText } from "../lib/askApi.js";
import { useAppStore } from "../store/useAppStore.js";

const LEVEL_LABELS = {
  1: 'Guardian I', 2: 'Guardian II', 3: 'Guardian III',
  4: 'Guardian Master', 5: 'Star Guardian',
};

/**
 * 수호령 레벨업 감지 후 AI 축하 메시지를 생성합니다.
 */
export function useGuardianMessage({ buildCtx, userId }) {
  const guardianLevelUp    = useAppStore((s) => s.guardianLevelUp);
  const setGuardianLevelUp = useAppStore((s) => s.setGuardianLevelUp);
  const [guardianMessage, setGuardianMessage]       = useState('');
  const [guardianMsgLoading, setGuardianMsgLoading] = useState(false);

  useEffect(() => {
    if (!guardianLevelUp) return;
    setGuardianMessage('');
    setGuardianMsgLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const ctx = buildCtx ? buildCtx() : '';
        const text = await postAskText({
          userMessage: `I just leveled up in the Byeolsoom guardian system from ${LEVEL_LABELS[guardianLevelUp.fromLevel]} (Lv${guardianLevelUp.fromLevel}) to ${LEVEL_LABELS[guardianLevelUp.toLevel]} (Lv${guardianLevelUp.toLevel}). Please write a short 2-3 line celebratory message in a warm, starlit tone without sounding too formal.`,
          context: ctx,
          kakaoId: userId,
          clientHour: new Date().getHours(),
          isChat: true,
        });
        if (!cancelled) setGuardianMessage(text);
      } catch {
        if (!cancelled) setGuardianMessage('A new level of strength is with you now. Meet the next star with a steadier heart.');
      } finally {
        if (!cancelled) setGuardianMsgLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [guardianLevelUp, buildCtx, userId]);

  return { guardianLevelUp, setGuardianLevelUp, guardianMessage, guardianMsgLoading };
}
