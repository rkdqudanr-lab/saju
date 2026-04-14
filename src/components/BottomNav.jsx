/**
 * BottomNav — 하단 고정 내비게이션 바
 * 오늘 / 상담 / 성장 / 광장  (4탭)
 * props 없이 Zustand store에서 직접 읽는다.
 */
import { useAppStore } from '../store/useAppStore.js';

export default function BottomNav() {
  const step         = useAppStore((s) => s.step);
  const setStep      = useAppStore((s) => s.setStep);
  const user         = useAppStore((s) => s.user);
  const formOkApprox = useAppStore((s) => s.formOkApprox);

  const tabs = [
    { id: 'today',   icon: '⌂',  label: '오늘',  steps: [0, 17, 20, 10, 23], tourId: 'nav-today' },
    { id: 'consult', icon: '💬', label: '상담',  steps: [2, 3, 4, 5, 6, 8, 14, 24, 25, 26], tourId: 'nav-consult' },
    { id: 'growth',  icon: '✨', label: '성장',  steps: [13, 30, 7, 12, 1, 19, 27, 34], tourId: 'nav-growth' },
    { id: 'square',  icon: '🏛️', label: '광장',  steps: [29, 32, 11, 31, 28, 33], tourId: 'nav-square' },
  ];

  const activeId = tabs.find(t => t.steps.includes(step))?.id ?? 'today';

  function handleTabPress(tab) {
    if (tab.id === 'today')   { setStep(0); return; }
    if (tab.id === 'consult') { setStep(formOkApprox ? 2 : 1); return; }
    if (tab.id === 'growth')  { setStep(user ? 13 : 1); return; }
    if (tab.id === 'square')  { setStep(user ? 29 : 1); return; }
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'var(--bg1)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            data-tour={tab.tourId}
            onClick={() => handleTabPress(tab)}
            aria-label={tab.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '10px 4px 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity var(--trans-fast)',
              opacity: isActive ? 1 : 0.55,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 'var(--xs)',
                fontFamily: 'var(--ff)',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'var(--gold)' : 'var(--t3)',
                letterSpacing: '.02em',
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: 32,
                  height: 2,
                  background: 'var(--gold)',
                  borderRadius: 2,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
