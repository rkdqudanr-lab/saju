import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store/useAppStore.js';

export default function BPConfirmModal() {
  const bpConfirmState   = useAppStore((s) => s.bpConfirmState);
  const resolveBPConfirm = useAppStore((s) => s.resolveBPConfirm);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bpConfirmState.open) {
      const t = setTimeout(() => setVisible(true), 16);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [bpConfirmState.open]);

  if (!bpConfirmState.open) return null;

  const { cost, questionCount } = bpConfirmState;
  const currentBp = useAppStore.getState().gamificationState?.currentBp ?? 0;
  const afterBp = currentBp - cost;

  return createPortal(
    <div
      onClick={() => resolveBPConfirm(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 calc(env(safe-area-inset-bottom, 0px) + 24px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease',
      }}
    >
      <div
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
        {/* 드래그 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line2)', opacity: 0.6 }} />
        </div>

        <div style={{ padding: '4px 24px 24px' }}>
          {/* 아이콘 + 타이틀 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'var(--goldf)',
              border: '1px solid var(--acc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', flexShrink: 0,
            }}>
              ✦
            </div>
            <div>
              <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3 }}>
                별숨에게 물어볼까요?
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 3 }}>
                {questionCount > 1
                  ? `질문 ${questionCount}개 · ${cost} BP 사용`
                  : `10 BP 사용`}
              </div>
            </div>
          </div>

          {/* BP 현황 카드 */}
          <div style={{
            background: 'var(--bg3)',
            borderRadius: 'var(--r1)',
            padding: '14px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 4 }}>현재 BP</div>
              <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--gold)' }}>
                {currentBp}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ fontSize: 11, color: 'var(--t4)' }}>−{cost}</div>
              <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
                <path d="M2 6h20M16 2l6 4-6 4" stroke="var(--t4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 4 }}>사용 후 BP</div>
              <div style={{
                fontSize: 'var(--lg)', fontWeight: 700,
                color: afterBp < 0 ? 'var(--rose)' : 'var(--t2)',
              }}>
                {afterBp < 0 ? '부족' : afterBp}
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => resolveBPConfirm(false)}
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
              onClick={() => resolveBPConfirm(true)}
              style={{
                flex: 2, padding: '13px 0',
                background: 'var(--gold)',
                border: 'none',
                borderRadius: 'var(--r1)',
                color: '#0D0B14',
                fontSize: 'var(--sm)', fontWeight: 700,
                fontFamily: 'var(--ff)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span>✦</span>
              <span>별숨에게 물어보기</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
