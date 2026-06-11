import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore.js';

// 모달/바텀시트 공용 접근성 훅: 포커스 트랩 + Escape 닫기 + 닫힐 때 트리거로 포커스 복원
// 반환된 ref를 모달 컨테이너(role="dialog")에 달아 사용한다.
export function useModalA11y({ open = true, onClose } = {}) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const prevFocus = document.activeElement;
    const focusable = () => [...el.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(n => !n.disabled);
    focusable()[0]?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onCloseRef.current) { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevFocus?.focus?.();
    };
  }, [open]);

  return ref;
}

// 열려 있는 동안 모달 백버튼 스택에 등록 — 안드로이드 백버튼이 페이지 대신 이 모달을 닫는다
export function useModalBackClose(id, open, close) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const { pushModal, popModal } = useAppStore.getState();
    pushModal(id, () => closeRef.current?.());
    return () => popModal(id);
  }, [id, open]);
}
