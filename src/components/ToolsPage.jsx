import { useState, Suspense, lazy } from "react";

const SajuCalendar   = lazy(() => import("./SajuCalendar.jsx"));
const RadarChart     = lazy(() => import("./RadarChart.jsx"));
const AnniversaryPage = lazy(() => import("./AnniversaryPage.jsx"));

function TabSpinner() {
  return <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--t4)', fontSize: 'var(--sm)' }}>✦</div>;
}

const TABS = [
  { id: 'calendar',     icon: '🗓️', label: '사주 달력' },
  { id: 'radar',        icon: '🕸️', label: '궁합 레이더' },
  { id: 'anniversary',  icon: '🎂', label: '기념일 운세' },
];

export default function ToolsPage({
  form, otherProfiles, setStep, onAddOther,
  callApi, buildCtx,
  anniversaryDate, setAnniversaryDate,
  anniversaryType, setAnniversaryType,
  ANNIVERSARY_PROMPT,
  initialTab,
}) {
  const [tab, setTab] = useState(initialTab || 'calendar');

  return (
    <div className="page-top">
      <div className="inner" style={{ paddingTop: 'var(--sp3)' }}>
        {/* 탭 바 */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 'var(--sp3)',
          background: 'var(--bg2)', borderRadius: 'var(--r2)',
          padding: 4, border: '1px solid var(--line)',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '8px 4px',
                borderRadius: 'calc(var(--r2) - 2px)',
                border: 'none',
                background: tab === t.id ? 'var(--goldf)' : 'transparent',
                color: tab === t.id ? 'var(--gold)' : 'var(--t4)',
                fontFamily: 'var(--ff)', fontSize: 'var(--xs)',
                fontWeight: tab === t.id ? 700 : 400,
                cursor: 'pointer', transition: 'all .18s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}
              aria-pressed={tab === t.id}
            >
              <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <Suspense fallback={<TabSpinner />}>
          {tab === 'calendar' && (
            <SajuCalendar form={form} setStep={setStep} />
          )}
          {tab === 'radar' && (
            <RadarChart
              form={form}
              otherProfiles={otherProfiles}
              setStep={setStep}
              onAddOther={onAddOther}
            />
          )}
          {tab === 'anniversary' && (
            <AnniversaryPage
              form={form}
              callApi={callApi}
              anniversaryDate={anniversaryDate}
              setAnniversaryDate={setAnniversaryDate}
              anniversaryType={anniversaryType}
              setAnniversaryType={setAnniversaryType}
              ANNIVERSARY_PROMPT={ANNIVERSARY_PROMPT}
              buildCtx={buildCtx}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
