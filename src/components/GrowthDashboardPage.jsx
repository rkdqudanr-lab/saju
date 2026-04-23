/**
 * GrowthDashboardPage - 별숨성장 대시보드 (step 37)
 * 최근 활동, 성장 단계, 통계 흐름, 미션 현황을 한 화면에 보여준다.
 */

import { useEffect, useMemo, useState } from 'react';
import MissionDashboard from './MissionDashboard.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { FREE_BP_RECHARGE } from '../utils/gamificationLogic.js';
import { getAuthenticatedClient } from '../lib/supabase.js';

const GROWTH_STAGES = [
  { minMissions: 0, label: '새싹 별숨', emoji: '🌱', color: '#74B77B', desc: '별숨과 첫 리듬을 맞춰가는 시작 단계예요.' },
  { minMissions: 5, label: '반짝 요정', emoji: '✨', color: '#E58AAF', desc: '매일의 흐름을 기록하며 감각이 살아나고 있어요.' },
  { minMissions: 20, label: '별빛 항해자', emoji: '🌙', color: '#6E94D6', desc: '질문과 기록이 쌓이면서 나만의 패턴이 보이기 시작해요.' },
  { minMissions: 50, label: '황금 수호자', emoji: '👑', color: '#C99A3C', desc: '별숨을 꾸준히 활용하며 안정적인 루틴을 만들었어요.' },
  { minMissions: 100, label: '우주 마스터', emoji: '🌌', color: '#9B7AE5', desc: '별숨 성장 시스템을 깊게 이해한 최상위 단계예요.' },
];

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_CONTENT_WIDTH = 520;

function formatLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLastNDays(count) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (count - 1 - index));
    return formatLocalDateKey(d);
  });
}

function getGrowthStage(totalMissions) {
  return GROWTH_STAGES.reduce(
    (current, stage) => (totalMissions >= stage.minMissions ? stage : current),
    GROWTH_STAGES[0]
  );
}

function getNextStage(totalMissions) {
  return GROWTH_STAGES.find((stage) => totalMissions < stage.minMissions) || null;
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function sectionCardStyle(extra = {}) {
  return {
    background:
      'linear-gradient(180deg, color-mix(in srgb, var(--bg1) 82%, white 18%) 0%, var(--bg1) 100%)',
    border: '1px solid color-mix(in srgb, var(--line) 55%, var(--gold) 18%)',
    borderRadius: 24,
    boxShadow: '0 16px 40px rgba(17, 12, 30, 0.08)',
    ...extra,
  };
}

function tabButtonStyle(active, color) {
  return {
    flex: 1,
    minWidth: 0,
    padding: '12px 10px',
    borderRadius: 999,
    border: active ? `1px solid ${color}44` : '1px solid transparent',
    background: active ? `${color}18` : 'transparent',
    color: active ? color : 'var(--t3)',
    fontSize: 'var(--sm)',
    fontWeight: active ? 800 : 600,
    fontFamily: 'var(--ff)',
    cursor: 'pointer',
    transition: 'all .2s ease',
  };
}

function MetricCard({ icon, value, label, accent, note }) {
  return (
    <div
      style={{
        ...sectionCardStyle(),
        padding: '18px 16px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          fontSize: 21,
          marginBottom: 14,
          background: `${accent}16`,
          boxShadow: `inset 0 0 0 1px ${accent}2a`,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '30px', lineHeight: 1, fontWeight: 900, color: accent }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t2)' }}>{label}</div>
      {note ? <div style={{ marginTop: 4, fontSize: '11px', color: 'var(--t4)' }}>{note}</div> : null}
    </div>
  );
}

function ConstellationBadge({ stage }) {
  const halo = `${stage.color}1f`;

  return (
    <div
      style={{
        width: 94,
        height: 94,
        flexShrink: 0,
        borderRadius: 28,
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        background: `radial-gradient(circle at 30% 30%, ${halo} 0%, ${stage.color}14 45%, transparent 100%)`,
        boxShadow: `0 0 0 1px ${stage.color}26 inset`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 10,
          borderRadius: 24,
          background: `linear-gradient(145deg, ${stage.color}24, rgba(255,255,255,0.04))`,
          filter: 'blur(1px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 44,
          animation: 'floatGently 3.6s ease-in-out infinite',
        }}
      >
        {stage.emoji}
      </div>
    </div>
  );
}

function GrowthProgress({ totalMissions }) {
  const current = getGrowthStage(totalMissions);
  const next = getNextStage(totalMissions);
  const progress = next
    ? ((totalMissions - current.minMissions) / (next.minMissions - current.minMissions)) * 100
    : 100;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 'var(--xs)', color: current.color, fontWeight: 800 }}>{current.label}</div>
        <div style={{ fontSize: '11px', color: 'var(--t4)', textAlign: 'right' }}>
          {next ? `다음 단계까지 ${next.minMissions - totalMissions}개 미션` : '최고 단계 달성'}
        </div>
      </div>
      <div
        style={{
          height: 12,
          borderRadius: 999,
          background: 'linear-gradient(180deg, var(--bg3), color-mix(in srgb, var(--bg2) 86%, black 14%))',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, progress))}%`,
            height: '100%',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${current.color}, color-mix(in srgb, ${current.color} 76%, white 24%))`,
            boxShadow: `0 0 20px ${current.color}44`,
            transition: 'width .35s ease',
          }}
        />
      </div>
    </div>
  );
}

function StageRoadmap({ totalMissions }) {
  const current = getGrowthStage(totalMissions);

  return (
    <div style={{ ...sectionCardStyle(), padding: 22 }}>
      <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t2)', marginBottom: 16 }}>성장 단계</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GROWTH_STAGES.map((stage) => {
          const reached = totalMissions >= stage.minMissions;
          const active = stage.label === current.label;

          return (
            <div
              key={stage.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                borderRadius: 18,
                padding: '14px 14px 14px 12px',
                background: active ? `${stage.color}18` : 'var(--bg2)',
                border: active ? `1px solid ${stage.color}36` : '1px solid var(--line)',
                opacity: reached ? 1 : 0.58,
              }}
            >
              <div style={{ fontSize: 24, width: 28, textAlign: 'center' }}>{stage.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 'var(--sm)', fontWeight: 800, color: active ? stage.color : 'var(--t1)' }}>
                    {stage.label}
                  </span>
                  {active ? (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontSize: '10px',
                        fontWeight: 800,
                        color: stage.color,
                        background: `${stage.color}14`,
                      }}
                    >
                      현재 단계
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.55, color: 'var(--t3)' }}>{stage.desc}</div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--t4)', whiteSpace: 'nowrap' }}>
                {stage.minMissions === 0 ? '시작' : `${stage.minMissions}개`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActions({ setStep }) {
  const actions = [
    { icon: '🔮', label: '오늘의 별숨', desc: '오늘 운세 확인', step: 13 },
    { icon: '📈', label: '별숨 통계', desc: '질문 패턴 보기', step: 28 },
    { icon: '🛍️', label: '별숨 숍', desc: 'BP 사용처 보기', step: 31 },
    { icon: '🎒', label: '아이템 보관함', desc: '보유 아이템 확인', step: 38 },
  ];

  return (
    <div style={{ ...sectionCardStyle(), padding: 22 }}>
      <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t2)', marginBottom: 16 }}>바로가기</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {actions.map((action) => (
          <button
            key={action.step}
            onClick={() => setStep(action.step)}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 20,
              padding: '16px 14px',
              background: 'linear-gradient(180deg, var(--bg2), color-mix(in srgb, var(--bg2) 88%, white 12%))',
              color: 'var(--t1)',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 10 }}>{action.icon}</div>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 800, marginBottom: 4 }}>{action.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--t4)', lineHeight: 1.5 }}>{action.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyPanel({ title, body }) {
  return (
    <div
      style={{
        ...sectionCardStyle(),
        padding: '28px 22px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t2)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: '12px', lineHeight: 1.7, color: 'var(--t4)' }}>{body}</div>
    </div>
  );
}

function ScoreTrendChart({ data, dates }) {
  const valid = data
    .map((value, index) => ({ value, index }))
    .filter((item) => typeof item.value === 'number');

  if (!valid.length) {
    return <EmptyPanel title="최근 7일 별숨점수 흐름" body="아직 기록이 없어요. 오늘의 별숨을 확인하면 여기부터 흐름이 쌓여요." />;
  }

  const min = Math.min(...valid.map((item) => item.value));
  const max = Math.max(...valid.map((item) => item.value));
  const range = Math.max(8, max - min);
  const coords = valid.map(({ value, index }) => {
    const x = valid.length === 1 ? 50 : (index / (dates.length - 1)) * 100;
    const y = 82 - ((value - min) / range) * 54;
    return { x, y, value, index };
  });

  const points = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `0,92 ${points} 100,92`;
  const today = coords.find((point) => point.index === dates.length - 1);
  const previous = [...coords].reverse().find((point) => point.index < dates.length - 1);
  const direction = today && previous ? (today.value >= previous.value ? '상승세' : '조정세') : '누적 중';

  return (
    <div style={{ ...sectionCardStyle(), padding: 22 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t2)' }}>최근 7일 별숨점수 흐름</div>
          <div style={{ marginTop: 4, fontSize: '12px', color: 'var(--t4)' }}>
            전일 대비 <span style={{ color: direction === '상승세' ? '#E98143' : '#6E94D6', fontWeight: 800 }}>{direction}</span>
          </div>
        </div>
        {today ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--t4)' }}>오늘 점수</div>
            <div style={{ fontSize: '32px', lineHeight: 1, fontWeight: 900, color: 'var(--gold)' }}>{today.value}</div>
          </div>
        ) : null}
      </div>

      <div style={{ height: 170 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="growth-score-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(176,120,32,0.28)" />
              <stop offset="100%" stopColor="rgba(176,120,32,0.02)" />
            </linearGradient>
          </defs>
          {[20, 46, 72].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--line)" strokeDasharray="2 4" />
          ))}
          <polygon points={areaPoints} fill="url(#growth-score-fill)" />
          <polyline
            points={points}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {coords.map((point) => (
            <g key={`${point.index}-${point.value}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.index === dates.length - 1 ? 3.7 : 2.3}
                fill="var(--bg1)"
                stroke={point.index === dates.length - 1 ? 'var(--gold)' : 'rgba(176,120,32,0.48)'}
                strokeWidth={point.index === dates.length - 1 ? 2.5 : 1.4}
              />
            </g>
          ))}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, marginTop: 8 }}>
        {dates.map((dateKey, index) => {
          const date = parseDateKey(dateKey);
          const isToday = index === dates.length - 1;
          return (
            <div key={dateKey} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: isToday ? 800 : 600, color: isToday ? 'var(--gold)' : 'var(--t3)' }}>
                {DAY_LABELS[date.getDay()]}
              </div>
              <div style={{ marginTop: 4, fontSize: '10px', color: 'var(--t4)' }}>{String(date.getDate()).padStart(2, '0')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BPTrendChart({ data, dates }) {
  const values = dates.map((dateKey) => Math.max(0, Number(data[dateKey] || 0)));
  const maxValue = Math.max(...values, 0);

  if (maxValue === 0) {
    return <EmptyPanel title="최근 7일 별 포인트 흐름" body="미션 완료나 질문 활동이 생기면 BP 흐름이 여기에 바로 표시돼요." />;
  }

  return (
    <div style={{ ...sectionCardStyle(), padding: 22 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t2)' }}>최근 7일 별 포인트 흐름</div>
          <div style={{ marginTop: 4, fontSize: '12px', color: 'var(--t4)' }}>미션, 출석, 활동 보상이 일자별로 합산돼요.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--t4)' }}>최고 획득</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--gold)' }}>{maxValue} BP</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10, alignItems: 'end' }}>
        {dates.map((dateKey, index) => {
          const value = values[index];
          const date = parseDateKey(dateKey);
          const isToday = index === dates.length - 1;
          const height = value > 0 ? Math.max(14, Math.round((value / maxValue) * 110)) : 8;

          return (
            <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
              <div style={{ minHeight: 18, fontSize: '11px', fontWeight: 800, color: isToday ? 'var(--gold)' : 'var(--t3)' }}>
                {value > 0 ? value : ''}
              </div>
              <div
                style={{
                  width: '100%',
                  height,
                  minWidth: 24,
                  borderRadius: '14px 14px 10px 10px',
                  background: isToday
                    ? 'linear-gradient(180deg, #D7A849 0%, #A46B15 100%)'
                    : 'linear-gradient(180deg, #B8A7E2 0%, #6E94D6 100%)',
                  boxShadow: value > 0 ? (isToday ? '0 12px 24px rgba(176,120,32,0.26)' : '0 10px 20px rgba(110,148,214,0.18)') : 'none',
                  opacity: value > 0 ? 1 : 0.25,
                  transition: 'height .35s ease',
                }}
              />
              <div style={{ marginTop: 8, fontSize: '11px', color: isToday ? 'var(--gold)' : 'var(--t4)', fontWeight: isToday ? 800 : 600 }}>
                {DAY_LABELS[date.getDay()]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyActivityRow({ activityDays, dates }) {
  return (
    <div style={{ ...sectionCardStyle(), padding: 22 }}>
      <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t2)', marginBottom: 16 }}>이번 주 활동</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8 }}>
        {dates.map((dateKey, index) => {
          const active = activityDays.has(dateKey);
          const date = parseDateKey(dateKey);
          const isToday = index === dates.length - 1;

          return (
            <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 15,
                  background: active
                    ? 'linear-gradient(135deg, #D7A849 0%, #A46B15 100%)'
                    : 'linear-gradient(180deg, var(--bg3), var(--bg2))',
                  border: isToday ? '2px solid rgba(176,120,32,0.32)' : '1px solid var(--line)',
                  color: active ? '#fff' : 'var(--t4)',
                  boxShadow: active ? '0 10px 20px rgba(176,120,32,0.22)' : 'none',
                }}
              >
                {active ? '✦' : '·'}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: active ? 800 : 600, color: active ? 'var(--gold)' : 'var(--t3)' }}>
                  {DAY_LABELS[date.getDay()]}
                </div>
                <div style={{ marginTop: 2, fontSize: '10px', color: 'var(--t4)' }}>{String(date.getDate()).padStart(2, '0')}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsTiles({ totalBpEarned, totalQuestions, weeklyQuestions, totalMissionsCompleted, loginStreak, currentBp }) {
  const tiles = [
    { icon: '⭐', label: '누적 획득 BP', value: totalBpEarned ?? '—', color: 'var(--gold)' },
    { icon: '📝', label: '총 질문 수', value: totalQuestions ?? '—', color: '#6E94D6' },
    { icon: '📅', label: '이번 주 질문', value: weeklyQuestions ?? '—', color: '#9B7AE5' },
    { icon: '✅', label: '완료 미션', value: totalMissionsCompleted, color: '#74B77B' },
    { icon: '🔥', label: '연속 방문', value: loginStreak, color: '#E98143' },
    { icon: '💎', label: '현재 BP', value: currentBp, color: 'var(--gold)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12 }}>
      {tiles.map((tile) => (
        <div key={tile.label} style={{ ...sectionCardStyle(), padding: '18px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 10 }}>{tile.icon}</div>
          <div style={{ fontSize: 28, lineHeight: 1, fontWeight: 900, color: tile.color }}>{tile.value}</div>
          <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--t3)', fontWeight: 700 }}>{tile.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function GrowthDashboardPage({ onRechargeFreeBP }) {
  const { gamificationState, missions, setStep, user } = useAppStore();
  const [tab, setTab] = useState('growth');
  const [statsLoading, setStatsLoading] = useState(false);
  const [bpTrendData, setBpTrendData] = useState({});
  const [activityDays, setActivityDays] = useState(new Set());
  const [totalQuestions, setTotalQuestions] = useState(null);
  const [totalBpEarned, setTotalBpEarned] = useState(null);
  const [scoreTrend, setScoreTrend] = useState([]);
  const [weeklyQuestions, setWeeklyQuestions] = useState(null);

  const safe = gamificationState ?? { currentBp: 0, guardianLevel: 1, loginStreak: 0, totalMissionsCompleted: 0 };
  const safeMissions = missions ?? [];
  const dates = useMemo(() => getLastNDays(7), []);

  const {
    currentBp = 0,
    guardianLevel = 1,
    loginStreak = 0,
    totalMissionsCompleted = 0,
  } = safe;

  const stage = getGrowthStage(totalMissionsCompleted);
  const freeRecharge = FREE_BP_RECHARGE[guardianLevel] || 5;
  const completedToday = safeMissions.filter((mission) => mission.is_completed).length;

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function fetchStats() {
      setStatsLoading(true);

      try {
        const client = getAuthenticatedClient(String(user.id));
        const firstDay = dates[0];
        const firstTimestamp = `${firstDay}T00:00:00`;

        const [bpLogRes, consultRes, gamRes, scoreRes, weeklyConsultRes] = await Promise.all([
          client
            .from('daily_bp_log')
            .select('date, bp_amount')
            .eq('kakao_id', String(user.id))
            .gte('date', firstDay)
            .gt('bp_amount', 0),
          user.supabaseId
            ? client.from('consultation_history').select('id', { count: 'exact', head: true }).eq('user_id', user.supabaseId)
            : Promise.resolve({ count: 0 }),
          client
            .from('user_gamification')
            .select('total_bp_earned')
            .eq('kakao_id', String(user.id))
            .maybeSingle(),
          client
            .from('daily_scores')
            .select('score_date, score')
            .eq('kakao_id', String(user.id))
            .gte('score_date', firstDay)
            .order('score_date', { ascending: true }),
          user.supabaseId
            ? client
                .from('consultation_history')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.supabaseId)
                .gte('created_at', firstTimestamp)
            : Promise.resolve({ count: 0 }),
        ]);

        if (cancelled) return;

        const trend = {};
        const active = new Set();

        for (const row of bpLogRes.data || []) {
          if (!row?.date) continue;
          trend[row.date] = (trend[row.date] || 0) + Number(row.bp_amount || 0);
          active.add(row.date);
        }

        const scoreMap = {};
        for (const row of scoreRes.data || []) {
          if (!row?.score_date) continue;
          scoreMap[row.score_date] = Number(row.score);
        }

        setBpTrendData(trend);
        setActivityDays(active);
        setTotalQuestions(consultRes.count ?? 0);
        setTotalBpEarned(gamRes.data?.total_bp_earned ?? 0);
        setWeeklyQuestions(weeklyConsultRes.count ?? 0);
        setScoreTrend(dates.map((dateKey) => (Number.isFinite(scoreMap[dateKey]) ? scoreMap[dateKey] : null)));
      } catch (error) {
        if (!cancelled) {
          setBpTrendData({});
          setActivityDays(new Set());
          setTotalQuestions(0);
          setTotalBpEarned(0);
          setWeeklyQuestions(0);
          setScoreTrend(dates.map(() => null));
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [dates, user?.id, user?.supabaseId]);

  return (
    <div className="page step-fade" style={{ padding: '24px 18px 40px', justifyContent: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH }}>
        <div
          style={{
            ...sectionCardStyle({
              padding: '28px 22px',
              overflow: 'hidden',
              position: 'relative',
              background: `radial-gradient(circle at top right, ${stage.color}18 0%, transparent 34%), linear-gradient(180deg, color-mix(in srgb, var(--bg1) 86%, white 14%) 0%, var(--bg1) 100%)`,
            }),
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -18,
              top: -18,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `${stage.color}12`,
              filter: 'blur(18px)',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: stage.color, letterSpacing: '.08em' }}>BYEOLSOOM GROWTH</div>
            <div style={{ marginTop: 8, fontSize: 'clamp(26px, 6vw, 34px)', lineHeight: 1.15, fontWeight: 900, color: 'var(--t1)' }}>
              별숨 성장 대시보드
            </div>
            <div style={{ marginTop: 10, maxWidth: 420, fontSize: '14px', lineHeight: 1.7, color: 'var(--t3)' }}>
              흩어진 정보 대신 한 화면에서 성장 단계, 활동 흐름, 미션 상태를 편하게 보도록 레이아웃을 정리했어요.
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                marginTop: 22,
                flexWrap: 'wrap',
              }}
            >
              <ConstellationBadge stage={stage} />

              <div style={{ flex: 1, minWidth: 240 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: `${stage.color}18`,
                      color: stage.color,
                      fontSize: '11px',
                      fontWeight: 900,
                    }}
                  >
                    {stage.emoji} {stage.label}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--t4)' }}>완료 미션 {totalMissionsCompleted}개</span>
                </div>

                <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--t2)', marginBottom: 14 }}>{stage.desc}</div>
                <GrowthProgress totalMissions={totalMissionsCompleted} />
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            marginTop: 14,
          }}
        >
          <MetricCard icon="💎" value={currentBp} label="보유 BP" accent="var(--gold)" />
          <MetricCard icon="✅" value={totalMissionsCompleted} label="완료 미션" accent="#74B77B" />
          <MetricCard icon="📝" value={totalQuestions ?? '—'} label="총 질문" accent="#6E94D6" />
        </div>

        <button
          onClick={onRechargeFreeBP}
          style={{
            marginTop: 14,
            width: '100%',
            border: '1px solid rgba(176,120,32,0.2)',
            borderRadius: 22,
            padding: '17px 18px',
            background: 'linear-gradient(180deg, var(--goldf), color-mix(in srgb, var(--bg1) 88%, var(--gold) 12%))',
            color: 'var(--gold)',
            fontSize: 'var(--sm)',
            fontWeight: 900,
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(176,120,32,0.08)',
          }}
        >
          ✦ 무료 BP 충전 (+{freeRecharge} BP) · 하루 1회
        </button>

        <div
          style={{
            ...sectionCardStyle(),
            marginTop: 16,
            padding: 8,
            display: 'flex',
            gap: 6,
          }}
        >
          {[
            { id: 'growth', label: '🌱 성장' },
            { id: 'stats', label: '📊 통계' },
            { id: 'missions', label: '🎯 미션' },
          ].map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} style={tabButtonStyle(tab === item.id, stage.color)}>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'growth' ? (
            <>
              <div
                style={{
                  ...sectionCardStyle(),
                  padding: 22,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t2)', marginBottom: 6 }}>연속 방문</div>
                  <div style={{ fontSize: 34, lineHeight: 1, fontWeight: 900, color: '#E98143' }}>{loginStreak}일</div>
                  <div style={{ marginTop: 8, fontSize: '12px', lineHeight: 1.6, color: 'var(--t4)' }}>
                    오늘도 들어오면 흐름이 이어져요. 꾸준함이 성장 단계를 가장 빠르게 올려줘요.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t2)', marginBottom: 6 }}>오늘 미션 진행</div>
                  <div style={{ fontSize: 34, lineHeight: 1, fontWeight: 900, color: stage.color }}>
                    {completedToday}/{safeMissions.length || 0}
                  </div>
                  <div style={{ marginTop: 8, fontSize: '12px', lineHeight: 1.6, color: 'var(--t4)' }}>
                    오늘 할 수 있는 행동을 하나씩 쌓으면 BP와 성장 단계가 같이 올라가요.
                  </div>
                </div>
              </div>

              <StageRoadmap totalMissions={totalMissionsCompleted} />
              <QuickActions setStep={setStep} />
            </>
          ) : null}

          {tab === 'stats' ? (
            statsLoading ? (
              <div style={{ ...sectionCardStyle(), padding: '40px 22px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t2)' }}>통계를 불러오는 중</div>
                <div style={{ marginTop: 6, fontSize: '12px', color: 'var(--t4)' }}>최근 7일 데이터를 정리하고 있어요.</div>
              </div>
            ) : (
              <>
                <ScoreTrendChart data={scoreTrend} dates={dates} />
                <BPTrendChart data={bpTrendData} dates={dates} />
                <WeeklyActivityRow activityDays={activityDays} dates={dates} />
                <StatsTiles
                  totalBpEarned={totalBpEarned}
                  totalQuestions={totalQuestions}
                  weeklyQuestions={weeklyQuestions}
                  totalMissionsCompleted={totalMissionsCompleted}
                  loginStreak={loginStreak}
                  currentBp={currentBp}
                />
              </>
            )
          ) : null}

          {tab === 'missions' ? (
            <MissionDashboard
              missions={safeMissions}
              onDiaryClick={() => setStep(22)}
              hasDiaryToday={safeMissions.some((mission) => mission.mission_type === 'diary' && mission.is_completed)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
