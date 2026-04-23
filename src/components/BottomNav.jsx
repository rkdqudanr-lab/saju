/**
 * BottomNav ???섎떒 怨좎젙 ?대퉬寃뚯씠??諛?
 * 蹂꾩닲吏덈Ц / ?곷떞 / 蹂꾩닲?깆옣 / 蹂꾩닲愿묒옣 / 蹂꾩닲?ㅼ젙 (5??
 * 媛????대┃ ???쒕툕硫붾돱 ?쒕줈?닿? ?꾨줈 ?쇱퀜吏?
 * props ?놁씠 Zustand store?먯꽌 吏곸젒 ?쎈뒗??
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store/useAppStore.js';
import Icon from './Icon.jsx';

// ?? 媛???쓽 ?쒕툕硫붾돱 ?뺤쓽 ??????????????????????????????????????
const MENU_GROUPS = {
  today: {
    label: '蹂꾩닲吏덈Ц',
    items: [
      { icon: 'home',       label: '??,                step: 0  },
      { icon: 'sun',        label: '?ㅻ뒛 ?섎（ ?섏쓽 蹂꾩닲', step: 18 },
      { icon: 'pencil',     label: '?섏쓽 ?섎（瑜?蹂꾩닲?먭쾶', step: 17 },
      { icon: 'book-open',  label: '?쇨린 紐⑥븘蹂닿린',       step: 20 },
      { icon: 'calendar',   label: '蹂꾩닲 ?щ젰',           step: 10 },
    ],
  },
  consult: {
    label: '蹂꾩닲 ?곷떞',
    items: [
      { icon: 'chat',            label: '蹂꾩닲?먭쾶 臾쇱뼱蹂닿린', step: 2  },
      { icon: 'chart-bar',       label: '?붽컙 由ы룷??,       step: 41 },
      { icon: 'sparkles',        label: '蹂꾩닲???덉뼵',       step: 8  },
      { icon: 'layers',          label: '醫낇빀 遺꾩꽍',         step: 14 },
      { icon: 'moon',            label: '轅??대そ',           step: 24 },
      { icon: 'calendar-check',  label: '?앹씪',              step: 25 },
      { icon: 'user',            label: '?대쫫 ???,         step: 26 },
      { icon: 'cards',           label: '蹂꾩닲 ?濡?,         step: 34 },
      { icon: 'trending-up',     label: '????먮쫫',         step: 30 },
      { icon: 'heart',           label: '沅곹빀',              step: 7  },
      { icon: 'cake',            label: '湲곕뀗???댁꽭',       step: 12 },
      { icon: 'ticket',          label: '濡쒕삉 踰덊샇 戮묎린',   step: 39 },
    ],
  },
  growth: {
    label: '蹂꾩닲?깆옣',
    items: [
      { icon: 'presentation-chart', label: '蹂꾩닲?깆옣 ??쒕낫??, step: 37 },
      { icon: 'star',               label: '?섏쓽 蹂꾩닲',         step: 13 },
      { icon: 'chart-pie',          label: '蹂꾩닲 ?듦퀎',         step: 28 },
      { icon: 'shopping-bag',       label: '蹂꾩닲??,            step: 31 },
      { icon: 'gift',               label: '???꾩씠??,         step: 38 },
    ],
  },
  square: {
    label: '蹂꾩닲愿묒옣',
    items: [
      { icon: 'grid',        label: '蹂꾩닲 愿묒옣',      step: 29 },
      { icon: 'heart-users', label: '?듬챸 沅곹빀 愿묒옣', step: 32 },
      { icon: 'users',       label: '?곕━ 紐⑥엫??蹂꾩닲', step: 11 },
      { icon: 'envelope',    label: '蹂꾩닲?몄?',       step: 35 },
    ],
  },
  settings: {
    label: '蹂꾩닲?ㅼ젙',
    items: [
      { icon: 'user-circle', label: '留덉씠?섏씠吏', step: 27 },
      { icon: 'cog',         label: '?ㅼ젙',       step: 19 },
    ],
  },
};

// 媛???뿉???쒖꽦?쇰줈 ?쒖떆??step 紐⑸줉
const TAB_STEPS = {
  today:    [0, 17, 18, 20, 10, 23],
  consult:  [2, 3, 4, 5, 6, 7, 8, 12, 14, 24, 25, 26, 30, 34, 39, 41],
  growth:   [13, 28, 31, 37, 38, 40],
  square:   [11, 29, 32, 35],
  settings: [19, 27],
};

// ?? ??SVG ?꾩씠肄?????????????????????????????????????????????
const TAB_ICONS = {
  today:    'home',
  consult:  'chat',
  growth:   'presentation-chart',
  square:   'grid',
  settings: 'cog',
};

// ?? ?쒕툕硫붾돱 ?쒕줈???????????????????????????????????????????????
function MenuDrawer({ groupId, onClose, onNav, user, formOkApprox }) {
  const group = MENU_GROUPS[groupId];
  if (!group) return null;

  // 濡쒓렇???꾩슂 step
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
      {/* 諛깅뱶濡?*/}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.45)',
        }}
      />
      {/* ?쒕줈??*/}
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
        {/* ?몃뱾 諛?*/}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'var(--line)',
          margin: '0 auto 14px',
        }} />
        {/* ?뱀뀡 ?쒕ぉ */}
        <div style={{
          fontSize: 'var(--xs)', fontWeight: 700,
          color: 'var(--gold)', letterSpacing: '.06em',
          padding: '0 20px', marginBottom: 10,
        }}>
          ??{group.label}
        </div>
        {/* 硫붾돱 ?꾩씠??- 2??洹몃━??*/}
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
    { id: 'today',    label: '?ㅻ뒛',  hasDrawer: true  },
    { id: 'consult',  label: '?곷떞',  hasDrawer: true  },
    { id: 'growth',   label: '?깆옣',  hasDrawer: true  },
    { id: 'square',   label: '愿묒옣',  hasDrawer: true  },
    { id: 'settings', label: '?ㅼ젙',  hasDrawer: false },
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
