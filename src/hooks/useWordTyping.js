import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store/useAppStore.js";

// 타이핑 애니메이션을 플로팅 애니메이션으로 교체.
// shown은 항상 전체 텍스트를 반환하고, done은 플로팅 duration(450ms) 후 true가 됨.
// AccItem → onTypingDone → ResultsStep 후속질문 생성 콜백 체인을 보존하기 위해 done 타이머 유지.
export default function useWordTyping(text, active, speed = 25) {
  const instantTyping = useAppStore((s) => s.instantTyping);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active || !text) {
      if (!active) setDone(false);
      return;
    }

    setDone(false);
    const delay = instantTyping ? 0 : 450;
    timerRef.current = setTimeout(() => setDone(true), delay);
    return () => clearTimeout(timerRef.current);
  }, [text, active, instantTyping]);

  const skipToEnd = useCallback(() => {
    clearTimeout(timerRef.current);
    setDone(true);
  }, []);

  return { shown: text || '', done, skipToEnd };
}
