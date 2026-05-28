/**
 * BottomNav — 하단 고정 내비게이션 바
 * 별숨질문 / 상담 / 별숨성장 / 별숨광장 / 별숨설정 (5탭)
 * 각 탭 클릭 시 서브메뉴 드로어가 위로 펼쳐짐
 * props 없이 Zustand store에서 직접 읽는다.
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore.js';
import Icon from './Icon.jsx';
import { STEP, STEP_GROUPS } from '../utils/steps.js';

const MENU_GROUPS = {
  today: {
    label: '별숨질문',
    items: [
      { icon: 'home', label: '홈', step: STEP.HOME },
      { icon: 'sun', label: '오늘 하루 나의 별숨', step: STEP.TODAY_DETAIL },
      { icon: 'pencil', label: '나의 하루를 별숨에게', step: STEP.DIARY },
      { icon: 'book-open', label: '일기 모아보기', step: STEP.DIARY_LIST },
      { icon: 'calendar', label: '별숨 달력', step: STEP.CALENDAR },
    ],
  },
  consult: {
    label: '별숨 상담',
    items: [
      // ── 자주 쓰는 상담 ──
      { icon: 'chat', label: '별숨에게 물어보기', step: STEP.QUESTION },
      { icon: 'heart', label: '궁합', step: STEP.COMPAT },
      { icon: 'trending-up', label: '대운 흐름', step: STEP.DAEUN },
      { icon: 'layers', label: '종합 분석', step: STEP.COMPREHENSIVE },
      { icon: 'chart-bar', label: '월간 리포트', step: STEP.REPORT },
      { icon: 'sparkles', label: '별숨의 예언', step: STEP.FUTURE_PROPHECY },
      // ── 특별 상담 ──
      { icon: 'chat-alt', label: '심층 인터뷰', step: STEP.DEEP_INTERVIEW },
      { icon: 'cards', label: '별숨 타로', step: STEP.TAROT },
      { icon: 'moon', label: '꿈 해몽', step: STEP.DREAM },
      { icon: 'user', label: '이름 풀이', step: STEP.NAME_FORTUNE },
      // ── 가끔 쓰는 상담 ──
      { icon: 'calendar-check', label: '택일', step: STEP.TAEGIL },
      { icon: 'cake', label: '기념일 운세', step: STEP.ANNIVERSARY },
      { icon: 'ticket', label: '로또 번호 뽑기', step: STEP.LOTTO },
    ],
  },
  growth: {
    label: '별숨성장',
    items: [
      { icon: 'presentation-chart', label: '별숨성장 대시보드', step: STEP.GROWTH_DASHBOARD },
      { icon: 'sparkles', label: '별숨 도감', step: STEP.BYEOLSOOM_SPACE },
      { icon: 'star', label: '나의 별숨', step: STEP.NATAL },
      { icon: 'chart-pie', label: '별숨 통계', step: STEP.STATS },
      { icon: 'shopping-bag', label: '별숨샵', step: STEP.SHOP },
      { icon: 'gift', label: '오브제함', step: STEP.ITEM_INVENTORY },
    ],
  },
  square: {
    label: '별숨광장',
    items: [
      { icon: 'grid', label: '별숨 광장', step: STEP.COMMUNITY },
      { icon: 'heart-users', label: '익명 궁합 광장', step: STEP.ANON_COMPAT },
      { icon: 'users', label: '우리 모임 별숨', step: STEP.GROUP },
      { icon: 'envelope', label: '별숨 편지', step: STEP.LETTER },
    ],
  },
  settings: {
    label: '별숨설정',
    items: [
      { icon: 'user-circle', label: '마이페이지', step: STEP.MY_PAGE },
      { icon: 'cog', label: '설정', step: STEP.SETTINGS },
    ],
  },
};

const TAB_STEPS = {
  today:    STEP_GROUPS.TAB_TODAY,
  consult:  STEP_GROUPS.TAB_CONSULT,
  growth:   STEP_GROUPS.TAB_GROWTH,
  square:   STEP_GROUPS.TAB_SQUARE,
  settings: STEP_GROUPS.TAB_SETTINGS,
};

const TAB_ICONS = {
  today: 'home',
  consult: 'chat',
  growth: 'presentation-chart',
  square: 'grid',
  settings: 'cog',
};

function MenuDrawer({ groupId, onClose, onNav, user, formOkApprox }) {
  const group = MENU_GROUPS[groupId];
  if (!group) return null;

  const requiresLogin = new Set([STEP.QUESTION, STEP.DEEP_INTERVIEW, STEP.FUTURE_PROPHECY, STEP.NATAL, STEP.COMPREHENSIVE, STEP.DIARY, STEP.DAILY_HOROSCOPE, STEP.TODAY_DETAIL, STEP.DIARY_LIST, STEP.DREAM, STEP.TAEGIL, STEP.NAME_FORTUNE, STEP.MY_PAGE, STEP.STATS, STEP.COMMUNITY, STEP.DAEUN, STEP.ANON_COMPAT, STEP.SPECIAL_READING, STEP.TAROT, STEP.LETTER]);

  const handleNav = (item) => {
    let targetStep = item.step;
    if (requiresLogin.has(targetStep) && !user) targetStep = STEP.PROFILE;
    if (targetStep === STEP.QUESTION && !formOkApprox) targetStep = STEP.PROFILE;
    onNav(targetStep);
    onClose();
  };

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9990,
          background: 'var(--overlay, rgba(0,0,0,0.45))',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(57px + max(env(safe-area-inset-bottom), 16px))',
          left: 0,
          right: 0,
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
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'var(--line)',
            margin: '0 auto 14px',
          }}
        />
        <div
          style={{
            fontSize: 'var(--xs)',
            fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: '.06em',
            padding: '0 20px',
            marginBottom: 10,
          }}
        >
          {group.label}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
            padding: '0 12px',
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          {group.items.map((item, idx) => (
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
                ...(idx === group.items.length - 1 && group.items.length % 2 !== 0 ? { gridColumn: 'span 2' } : {}),
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
    document.body,
  );
}

export default function BottomNav() {
  const step = useAppStore((s) => s.step);
  const setStep = useAppStore((s) => s.setStep);
  const user = useAppStore((s) => s.user);
  const formOkApprox = useAppStore((s) => s.formOkApprox);
  const [openDrawer, setOpenDrawer] = useState(null);
  const [visible, setVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const openDrawerRef = useRef(openDrawer);
  useEffect(() => { openDrawerRef.current = openDrawer; }, [openDrawer]);

  useEffect(() => {
    setOpenDrawer(null);
  }, [step]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollYRef.current;
      if (currentScrollY < 10) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // 스크롤 다운 중 (숨김)
        setVisible(false);
        if (openDrawerRef.current) setOpenDrawer(null); // 바가 숨겨지면 드로어도 닫음
      } else if (currentScrollY < lastScrollY) {
        // 스크롤 업 중 (보임)
        setVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'today', label: '오늘', hasDrawer: true },
    { id: 'consult', label: '상담', hasDrawer: true },
    { id: 'growth', label: '성장', hasDrawer: true },
    { id: 'square', label: '광장', hasDrawer: true },
    { id: 'settings', label: '설정', hasDrawer: false },
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
      setStep(user ? STEP.SETTINGS : STEP.PROFILE);
      return;
    }
    setOpenDrawer((prev) => (prev === tab.id ? null : tab.id));
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
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {tabs.map((tab) => {
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
              <Icon name={TAB_ICONS[tab.id]} size={22} color={isActive ? 'var(--gold)' : 'var(--t3)'} />
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
                <motion.span
                  layoutId="nav-pill"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    x: '-50%',
                    width: '40%',
                    minWidth: 20,
                    maxWidth: 40,
                    height: 2,
                    background: 'var(--gold)',
                    borderRadius: 2,
                  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <style>{`
        @keyframes slideUpDrawer {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
