/**
 * BottomNav — 하단 고정 내비게이션 바
 * 홈(오늘) / 별숨상담 / 기록 / 마이
 * props 없이 Zustand store에서 직접 읽는다.
 */
import { useAppStore } from '../store/useAppStore.js';

export default function BottomNav() {
  const step         = useAppStore((s) => s.step);
  const setStep      = useAppStore((s) => s.setStep);
  const user         = useAppStore((s) => s.user);
  const formOkApprox = useAppStore((s) => s.formOkApprox);

  const tabs = [
    { id: 'home',    icon: '⌂',  label: '오늘',   steps: [0, 23] },
    { id: 'consult', icon: '💬', label: '상담',   steps: [2, 3, 4, 5] },
    { id: 'records', icon: '🗓️', label: '기록',   steps: [9, 10, 17, 20] },
    { id: 'my',      icon: '👤', label: '마이',   steps: [1, 19, 27] },
  ];

  const activeId =
    tabs.find(t => t.steps.includes(step))?.id ??
    (step === 0 ? 'home' : null);

  function handleTabPress(tab) {
    if (tab.id === 'home')    { setStep(0); return; }
    if (tab.id === 'consult') { setStep(formOkApprox ? 2 : 1); return; }
    if (tab.id === 'records') { setStep(user ? 20 : 1); return; }
    if (tab.id === 'my')      { setStep(user ? 27 : 1); return; }
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
