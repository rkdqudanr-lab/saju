/**
 * BottomNav — 하단 고정 내비게이션 바
 * 별숨질문 / 상담 / 별숨성장 / 별숨광장 / 별숨설정 (5탭)
 * 각 탭 클릭 시 서브메뉴 드로어가 위로 펼쳐짐
 * props 없이 Zustand store에서 직접 읽는다.
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store/useAppStore.js';
import Icon from './Icon.jsx';

// ── 각 탭의 서브메뉴 정의 ──────────────────────────────────────
const MENU_GROUPS = {
  today: {
    label: '별숨질문',
    items: [
      { icon: 'home',       label: '홈',                step: 0  },
      { icon: 'sun',        label: '오늘 하루 나의 별숨', step: 18 },
      { icon: 'pencil',     label: '나의 하루를 별숨에게', step: 17 },
      { icon: 'book-open',  label: '일기 모아보기',       step: 20 },
      { icon: 'calendar',   label: '별숨 달력',           step: 10 },
    ],
  },
  consult: {
    label: '별숨 상담',
    items: [
      { icon: 'chat',            label: '별숨에게 물어보기', step: 2  },
      { icon: 'chart-bar',       label: '월간 리포트',       step: 6  },
      { icon: 'sparkles',        label: '별숨의 예언',       step: 8  },
      { icon: 'layers',          label: '종합 분석',         step: 14 },
      { icon: 'moon',            label: '꿈 해몽',           step: 24 },
      { icon: 'calendar-check',  label: '택일',              step: 25 },
      { icon: 'user',            label: '이름 풀이',         step: 26 },
      { icon: 'cards',           label: '별숨 타로',         step: 34 },
      { icon: 'trending-up',     label: '대운 흐름',         step: 30 },
      { icon: 'heart',           label: '궁합',              step: 7  },
      { icon: 'cake',            label: '기념일 운세',       step: 12 },
      { icon: 'ticket',          label: '로또 번호 뽑기',   step: 39 },
    ],
  },
  growth: {
    label: '별숨성장',
    items: [
      { icon: 'presentation-chart', label: '별숨성장 대시보드', step: 37 },
      { icon: 'star',               label: '나의 별숨',         step: 13 },
      { icon: 'chart-pie',          label: '별숨 통계',         step: 28 },
      { icon: 'shopping-bag',       label: '별숨샵',            step: 31 },
      { icon: 'sparkles',           label: '별숨 뽑기',         step: 40 },
      { icon: 'gift',               label: '내 아이템',         step: 38 },
    ],
  },
  square: {
    label: '별숨광장',
    items: [
      { icon: 'grid',        label: '별숨 광장',      step: 29 },
      { icon: 'heart-users', label: '익명 궁합 광장', step: 32 },
      { icon: 'users',       label: '우리 모임의 별숨', step: 11 },
      { icon: 'envelope',    label: '별숨편지',       step: 35 },
    ],
  },
  settings: {
    label: '별숨설정',
    items: [
      { icon: 'user-circle', label: '마이페이지', step: 27 },
      { icon: 'cog',         label: '설정',       step: 19 },
    ],
  },
};

// 각 탭에서 활성으로 표시할 step 목록
const TAB_STEPS = {
  today:    [0, 17, 18, 20, 10, 23],
  consult:  [2, 3, 4, 5, 6, 7, 8, 12, 14, 24, 25, 26, 30, 34, 39],
  growth:   [13, 28, 31, 37, 38, 40],
  square:   [11, 29, 32, 35],
  settings: [19, 27],
};

// ── 탭 SVG 아이콘 ────────────────────────────────────────────
const TAB_ICONS = {
  today:    'home',
  consult:  'chat',
  growth:   'presentation-chart',
  square:   'grid',
  settings: 'cog',
};

// ── 서브메뉴 드로어 ─────────────────────────────────────────────
function MenuDrawer({ groupId, onClose, onNav, user, formOkApprox }) {
  const group = MENU_GROUPS[groupId];
  if (!group) return null;

  // 로그인 필요 step
  const requiresLogin = new Set([2, 6, 8, 13, 14, 17, 18, 20, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35]);

  const handleNav = (item) => {
    let targetStep = item.step;
    if (requiresLogin.has(targetStep) && !user) {
      targetStep = 1;
    }
    if (targetStep === 2 && !formOkApprox) {
      targetStep = 1;
    }
    onNav(targetStep);
    onClose();
  };

  return createPortal(
    <>
      {/* 백드롭 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.45)',
        }}
      />
      {/* 드로어 */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(57px + max(env(safe-area-inset-bottom), 16px))',
          left: 0, right: 0,
          zIndex: 9991,
          maxWidth: 480,
          margin: '0 auto',
          background: 'var(--bg1)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.25)',
          padding: '16px 0 8px',
          animation: 'slideUpDrawer 0.22s ease',
        }}
      >
        {/* 핸들 바 */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'var(--line)',
          margin: '0 auto 14px',
        }} />
        {/* 섹션 제목 */}
        <div style={{
          fontSize: 'var(--xs)', fontWeight: 700,
          color: 'var(--gold)', letterSpacing: '.06em',
          padding: '0 20px', marginBottom: 10,
        }}>
          ✦ {group.label}
        </div>
        {/* 메뉴 아이템 - 2열 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 4,
          padding: '0 12px',
          maxHeight: '50vh',
          overflowY: 'auto',
        }}>
          {group.items.map((item) => (
            <button
              key={item.step}
              onClick={() => handleNav(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r1)',
                background: 'var(--bg2)',
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
                textAlign: 'left',
                transition: 'all .12s',
              }}
            >
              <Icon name={item.icon} size={18} color="var(--gold)" />
              <span style={{ fontSize: 'var(--xs)', color: 'var(--t1)', lineHeight: 1.3, wordBreak: 'keep-all' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <div style={{ height: 8 }} />
      </div>
    </>,
    document.body
  );
}

export default function BottomNav() {
  const step         = useAppStore((s) => s.step);
  const setStep      = useAppStore((s) => s.setStep);
  const user         = useAppStore((s) => s.user);
  const formOkApprox = useAppStore((s) => s.formOkApprox);
  const [openDrawer, setOpenDrawer] = useState(null);

  useEffect(() => { setOpenDrawer(null); }, [step]);

  const tabs = [
    { id: 'today',    label: '오늘',  hasDrawer: true  },
    { id: 'consult',  label: '상담',  hasDrawer: true  },
    { id: 'growth',   label: '성장',  hasDrawer: true  },
    { id: 'square',   label: '광장',  hasDrawer: true  },
    { id: 'settings', label: '설정',  hasDrawer: false },
  ];

  const activeId = (() => {
    for (const [id, steps] of Object.entries(TAB_STEPS)) {
      if (steps.includes(step)) return id;
    }
    return 'today';
  })();

  function handleTabPress(tab) {
    if (tab.id === 'settings') {
      setOpenDrawer(null);
      setStep(user ? 19 : 1);
      return;
    }
    if (openDrawer === tab.id) {
      setOpenDrawer(null);
    } else {
      setOpenDrawer(tab.id);
    }
  }

  return (
    <>
      {openDrawer && (
        <MenuDrawer
          groupId={openDrawer}
          onClose={() => setOpenDrawer(null)}
          onNav={(s) => setStep(s)}
          user={user}
          formOkApprox={formOkApprox}
        />
      )}

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
          const isActive = activeId === tab.id || openDrawer === tab.id;
          return (
            <button
              key={tab.id}
              data-tour={`nav-${tab.id}`}
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
                opacity: isActive ? 1 : 0.45,
                position: 'relative',
              }}
            >
              <Icon
                name={TAB_ICONS[tab.id]}
                size={22}
                color={isActive ? 'var(--gold)' : 'var(--t3)'}
              />
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

      <style>{`
        @keyframes slideUpDrawer {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
