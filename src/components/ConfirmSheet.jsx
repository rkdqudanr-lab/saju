import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useModalA11y, useModalBackClose } from '../hooks/useModalA11y.js';

// 공용 삭제/확인 바텀시트 — window.confirm 대체 (useAppStore.showConfirm으로 호출)
export default function ConfirmSheet() {
  const confirmState   = useAppStore((s) => s.confirmState);
  const resolveConfirm = useAppStore((s) => s.resolveConfirm);
  const [visible, setVisible] = useState(false);
  const sheetRef = useModalA11y({ open: confirmState.open, onClose: () => resolveConfirm(false) });
  useModalBackClose('confirm-sheet', confirmState.open, () => resolveConfirm(false));

  useEffect(() => {
    if (confirmState.open) {
      const t = setTimeout(() => setVisible(true), 16);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [confirmState.open]);

  if (!confirmState.open) return null;

  return createPortal(
    <div
      onClick={() => resolveConfirm(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal, 10000)',
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 calc(env(safe-area-inset-bottom, 0px) + 24px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease',
      }}
    >
      <div
        ref={sheetRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-sheet-msg"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--bg2)',
          borderRadius: '20px 20px 0 0',
          padding: '8px 0 0',
          border: '1px solid var(--line)',
          borderBottom: 'none',
          transform: visible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'transform 0.28s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line2)', opacity: 0.6 }} />
        </div>
        <div style={{ padding: '4px 24px 24px' }}>
          <div id="confirm-sheet-msg" style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.5, marginBottom: 20, textAlign: 'center' }}>
            {confirmState.message}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => resolveConfirm(false)}
              style={{
                flex: 1, padding: '13px 0',
                background: 'var(--bg3)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r1)',
                color: 'var(--t3)',
                fontSize: 'var(--sm)', fontWeight: 600,
                fontFamily: 'var(--ff)', cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={() => resolveConfirm(true)}
              style={{
                flex: 1, padding: '13px 0',
                background: 'var(--rose)',
                border: 'none',
                borderRadius: 'var(--r1)',
                color: '#fff',
                fontSize: 'var(--sm)', fontWeight: 700,
                fontFamily: 'var(--ff)', cursor: 'pointer',
              }}
            >
              {confirmState.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
