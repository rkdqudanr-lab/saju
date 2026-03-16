import { useEffect, useRef } from "react";

const FOCUSABLE = [
  'a[href]','button:not([disabled])','textarea:not([disabled])',
  'input:not([disabled])','select:not([disabled])','[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * 모달 포커스 트랩 훅
 * ref를 모달 컨테이너에 연결하면 Tab/Shift+Tab이 내부에서만 순환됨.
 * Escape 키 콜백을 onEscape로 전달하면 모달을 닫을 수 있음.
 */
export function useFocusTrap(active, onEscape) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;
    const prev = document.activeElement;

    // 첫 번째 포커스 가능 요소로 이동
    const focusable = Array.from(el.querySelectorAll(FOCUSABLE));
    if (focusable.length) focusable[0].focus();

    const handleKey = (e) => {
      if (e.key === 'Escape' && onEscape) { e.preventDefault(); onEscape(); return; }
      if (e.key !== 'Tab') return;

      const items = Array.from(el.querySelectorAll(FOCUSABLE));
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last  = items[items.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      // 모달 닫힐 때 이전 포커스로 복귀
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, [active, onEscape]);

  return ref;
}
