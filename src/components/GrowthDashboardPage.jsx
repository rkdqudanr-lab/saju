/**
 * GrowthDashboardPage - 별숨성장 대시보드 (step 37)
 * 최근 활동, 성장 단계, 통계 흐름, 미션 현황을 한 화면에 보여준다.
 */

import { useEffect, useMemo, useState } from 'react';
import MissionDashboard from './MissionDashboard.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { FREE_BP_RECHARGE } from '../utils/gamificationLogic.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { STEP } from '../utils/steps.js';

const GROWTH_STAGES = [
  { minMissions: 0, label: '새싹 별숨', emoji: '🌱', color: '#74B77B', desc: '별숨과 첫 리듬을 맞춰가는 시작 단계예요.' },
  { minMissions: 5, label: '반짝 요정', emoji: '✨', color: '#E58AAF', desc: '매일의 흐름을 기록하며 감각이 살아나고 있어요.' },
  { minMissions: 20, label: '별빛 항해자', emoji: '🌙', color: '#6E94D6', desc: '질문과 기록이 쌓이면서 나만의 패턴이 보이기 시작해요.' },
  { minMissions: 50, label: '황금 수호자', emoji: '👑', color: '#C99A3C', desc: '별숨을 꾸준히 활용하며 안정적인 루틴을 만들었어요.' },
  { minMissions: 100, label: '우주 마스터', emoji: '🌌', color: '#9B7AE5', desc: '별숨 성장 시스템을 깊게 이해한 최상위 단계예요.' },
];

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_CONTENT_WIDTH = 460;

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

function formatChartDateLabel(dateKey) {
  const date = parseDateKey(dateKey);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function sectionCardStyle(extra = {}) {
  return {
    background:
      'linear-gradient(180deg,var(--home-card-gloss),rgba(255,255,255,.012)),var(--home-surface)',
    border: '1px solid var(--home-card-line)',
    borderRadius: 18,
    boxShadow: '0 8px 24px var(--home-card-shadow)',
    ...extra,
  };
}

function tabButtonStyle(active, color) {
  return {
    flex: 1,
    minWidth: 0,
    padding: '11px 9px',
    borderRadius: 14,
    border: active ? `1px solid ${color}30` : '1px solid transparent',
    background: active ? `${color}14` : 'transparent',
    color: active ? color : 'var(--t3)',
    fontSize: '12px',
    fontWeight: active ? 900 : 700,
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
        padding: '12px 10px',
        minWidth: 0,
        minHeight: 92,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 11,
          display: 'grid',
          placeItems: 'center',
          fontSize: 15,
          marginBottom: 8,
          background: `${accent}16`,
          boxShadow: `inset 0 0 0 1px ${accent}2a`,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '21px', lineHeight: 1, fontWeight: 900, color: accent, letterSpacing: 0 }}>{value}</div>
      <div
        style={{
          marginTop: 6,
          fontSize: '10px',
          fontWeight: 850,
          color: 'var(--t2)',
          lineHeight: 1.25,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
      {note ? <div style={{ marginTop: 4, fontSize: '11px', color: 'var(--t4)' }}>{note}</div> : null}
    </div>
  );
}

function ConstellationBadge({ stage }) {
  const halo = `${stage.color}1f`;

  return (
    <div
      style={{
        width: 68,
        height: 68,
        flexShrink: 0,
        borderRadius: 22,
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
          inset: 8,
          borderRadius: 18,
          background: `linear-gradient(145deg, ${stage.color}24, rgba(255,255,255,0.04))`,
          filter: 'blur(1px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 32,
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
    <div style={{ width: '100%', minWidth: 0 }}>
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
    <div style={{ ...sectionCardStyle(), padding: 18 }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t2)', marginBottom: 14 }}>성장 단계</div>
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
                  <span style={{ fontSize: '12px', fontWeight: 800, color: active ? stage.color : 'var(--t1)' }}>
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
    { icon: '🔮', label: '오늘의 별숨', desc: '오늘 운세 확인', step: STEP.NATAL },
    { icon: '📖', label: '나의 별숨 이야기', desc: '사주로 쓴 나의 서사', step: STEP.SAJU_STORY },
    { icon: '📈', label: '별숨 통계', desc: '질문 패턴 보기', step: STEP.STATS },
    { icon: '🛍️', label: '별숨 숍', desc: 'BP 사용처 보기', step: STEP.SHOP },
    { icon: '📖', label: '별숨 도감', desc: '컬렉션 완성 도전', step: STEP.BYEOLSOOM_SPACE },
  ];

  return (
    <div style={{ ...sectionCardStyle(), padding: 18 }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t2)', marginBottom: 14 }}>바로가기</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(136px, 1fr))', gap: 10 }}>
        {actions.map((action) => (
          <button
            key={action.step}
            onClick={() => setStep(action.step)}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 18,
              padding: '14px 13px',
              background: 'linear-gradient(180deg, var(--bg2), color-mix(in srgb, var(--bg2) 88%, white 12%))',
              color: 'var(--t1)',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 8 }}>{action.icon}</div>
            <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: 4 }}>{action.label}</div>
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
        padding: '24px 18px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t2)', marginBottom: 8 }}>{title}</div>
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

  const chartWidth = 340;
  const chartHeight = 196;
  const leftX = 38;
  const rightX = 320;
  const topY = 22;
  const bottomY = 126;
  const usableWidth = rightX - leftX;
  const usableHeight = bottomY - topY;
  const min = Math.min(...valid.map((item) => item.value));
  const max = Math.max(...valid.map((item) => item.value));
  const yMin = Math.max(0, Math.floor((min - 6) / 10) * 10);
  const yMax = Math.min(100, Math.ceil((max + 6) / 10) * 10);
  const range = Math.max(10, yMax - yMin);
  const yTicks = [yMax, Math.round((yMax + yMin) / 2), yMin];
  const coords = valid.map(({ value, index }) => {
    const x = dates.length === 1 ? (leftX + rightX) / 2 : leftX + (index / (dates.length - 1)) * usableWidth;
    const y = bottomY - ((value - yMin) / range) * usableHeight;
    return { x, y, value, index };
  });

  const points = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `${leftX},${bottomY} ${points} ${rightX},${bottomY}`;
  const today = coords.find((point) => point.index === dates.length - 1);
  const previous = [...coords].reverse().find((point) => point.index < dates.length - 1);
  const direction = today && previous ? (today.value >= previous.value ? '상승세' : '조정세') : '누적 중';

  return (
    <div style={{ ...sectionCardStyle(), padding: 18 }}>
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
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t2)' }}>최근 7일 별숨점수 흐름</div>
          <div style={{ marginTop: 4, fontSize: '12px', color: 'var(--t4)' }}>
            전일 대비 <span style={{ color: direction === '상승세' ? '#E98143' : '#6E94D6', fontWeight: 800 }}>{direction}</span>
          </div>
        </div>
        {today ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--t4)' }}>오늘 점수</div>
            <div style={{ fontSize: '28px', lineHeight: 1, fontWeight: 900, color: 'var(--gold)' }}>{today.value}</div>
          </div>
        ) : null}
      </div>

      <div style={{ height: 196 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} aria-hidden="true">
          <defs>
            <linearGradient id="growth-score-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(176,120,32,0.28)" />
              <stop offset="100%" stopColor="rgba(176,120,32,0.02)" />
            </linearGradient>
          </defs>
          <text x={leftX} y={12} fill="var(--t4)" fontSize="9" fontWeight="700">Y축 · 점수</text>
          <text x={rightX} y={166} textAnchor="end" fill="var(--t4)" fontSize="9" fontWeight="700">X축 · 날짜</text>
          {yTicks.map((tick) => {
            const y = bottomY - ((tick - yMin) / range) * usableHeight;
            return (
              <g key={tick}>
                <text x={leftX - 8} y={y + 3} textAnchor="end" fill="var(--t4)" fontSize="9" fontWeight="700">
                  {tick}
                </text>
                <line
                  x1={leftX}
                  y1={y}
                  x2={rightX}
                  y2={y}
                  stroke="var(--line)"
                  strokeDasharray="7 12"
                  strokeLinecap="round"
                />
              </g>
            );
          })}
          <line x1={leftX} y1={topY} x2={leftX} y2={bottomY} stroke="var(--line)" />
          <line x1={leftX} y1={bottomY} x2={rightX} y2={bottomY} stroke="var(--line)" />
          <polygon points={areaPoints} fill="url(#growth-score-fill)" />
          <polyline
            points={points}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {coords.map((point) => (
            <g key={`${point.index}-${point.value}`}>
              <text
                x={point.x}
                y={Math.max(12, point.y - 11)}
                textAnchor="middle"
                fill={point.index === dates.length - 1 ? 'var(--gold)' : 'var(--t3)'}
                fontSize="9"
                fontWeight="800"
              >
                {point.value}
              </text>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.index === dates.length - 1 ? 8 : 5.5}
                fill="var(--bg1)"
                stroke={point.index === dates.length - 1 ? 'var(--gold)' : 'rgba(176,120,32,0.48)'}
                strokeWidth={point.index === dates.length - 1 ? 4 : 3}
              />
              <text
                x={point.x}
                y={bottomY + 18}
                textAnchor="middle"
                fill={point.index === dates.length - 1 ? 'var(--gold)' : 'var(--t4)'}
                fontSize="9"
                fontWeight={point.index === dates.length - 1 ? 800 : 700}
              >
                {formatChartDateLabel(dates[point.index])}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginTop: 2 }}>
        {dates.map((dateKey, index) => {
          const date = parseDateKey(dateKey);
          const isToday = index === dates.length - 1;
          return (
            <div key={dateKey} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: isToday ? 800 : 600, color: isToday ? 'var(--gold)' : 'var(--t3)' }}>
                {DAY_LABELS[date.getDay()]}
              </div>
              <div style={{ marginTop: 3, fontSize: '10px', color: 'var(--t4)' }}>{formatChartDateLabel(dateKey)}</div>
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
    <div style={{ ...sectionCardStyle(), padding: 18 }}>
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
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t2)' }}>최근 7일 별 포인트 흐름</div>
          <div style={{ marginTop: 4, fontSize: '12px', color: 'var(--t4)' }}>미션, 출석, 활동 보상이 일자별로 합산돼요.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--t4)' }}>최고 획득</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--gold)' }}>{maxValue} BP</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, alignItems: 'end' }}>
        {dates.map((dateKey, index) => {
          const value = values[index];
          const date = parseDateKey(dateKey);
          const isToday = index === dates.length - 1;
          const height = value > 0 ? Math.max(14, Math.round((value / maxValue) * 110)) : 8;

          return (
            <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
              <div style={{ minHeight: 18, fontSize: '10px', fontWeight: 800, color: isToday ? 'var(--gold)' : 'var(--t3)' }}>
                {value > 0 ? value : ''}
              </div>
              <div
                style={{
                  width: '100%',
                  height,
                  minWidth: 22,
                  borderRadius: '12px 12px 8px 8px',
                  background: isToday
                    ? 'linear-gradient(180deg, #D7A849 0%, #A46B15 100%)'
                    : 'linear-gradient(180deg, #B8A7E2 0%, #6E94D6 100%)',
                  boxShadow: value > 0 ? (isToday ? '0 12px 24px rgba(176,120,32,0.26)' : '0 10px 20px rgba(110,148,214,0.18)') : 'none',
                  opacity: value > 0 ? 1 : 0.25,
                  transition: 'height .35s ease',
                }}
              />
              <div style={{ marginTop: 7, fontSize: '10px', color: isToday ? 'var(--gold)' : 'var(--t4)', fontWeight: isToday ? 800 : 600 }}>
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
    <div style={{ ...sectionCardStyle(), padding: 18 }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t2)', marginBottom: 14 }}>이번 주 활동</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8 }}>
        {dates.map((dateKey, index) => {
          const active = activityDays.has(dateKey);
          const date = parseDateKey(dateKey);
          const isToday = index === dates.length - 1;

          return (
            <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 13,
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
                <div style={{ fontSize: '10px', fontWeight: active ? 800 : 600, color: active ? 'var(--gold)' : 'var(--t3)' }}>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))', gap: 10 }}>
      {tiles.map((tile) => (
        <div key={tile.label} style={{ ...sectionCardStyle(), padding: '16px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>{tile.icon}</div>
          <div style={{ fontSize: 22, lineHeight: 1, fontWeight: 900, color: tile.color }}>{tile.value}</div>
          <div style={{ marginTop: 7, fontSize: '11px', color: 'var(--t3)', fontWeight: 700 }}>{tile.label}</div>
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
    <div className="page step-fade" style={{ padding: '86px 16px 36px', justifyContent: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH }}>
        <div
          style={{
            ...sectionCardStyle({
              padding: '20px 18px 18px',
              overflow: 'hidden',
              position: 'relative',
              borderRadius: 24,
              background: `radial-gradient(circle at 88% 10%, ${stage.color}16 0%, transparent 34%), linear-gradient(145deg,var(--home-card-gloss),rgba(255,255,255,.012) 44%), var(--home-surface-strong)`,
            }),
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -18,
              top: -18,
              width: 104,
              height: 104,
              borderRadius: '50%',
              background: `${stage.color}12`,
              filter: 'blur(18px)',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: stage.color, letterSpacing: '.1em' }}>BYEOLSOOM GROWTH</div>
              <span
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: `${stage.color}14`,
                  border: `1px solid ${stage.color}24`,
                  color: stage.color,
                  fontSize: '10px',
                  fontWeight: 900,
                  whiteSpace: 'nowrap',
                }}
              >
                완료 {totalMissionsCompleted}
              </span>
            </div>
            <div style={{ fontSize: 'clamp(27px, 7vw, 34px)', lineHeight: 1.05, fontWeight: 950, color: 'var(--t1)', letterSpacing: 0 }}>
              별숨 성장
            </div>
            <div style={{ marginTop: 7, fontSize: '13px', lineHeight: 1.55, color: 'var(--t3)' }}>오늘의 루틴과 성장 흐름</div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 16,
                flexWrap: 'wrap',
              }}
            >
              <ConstellationBadge stage={stage} />

              <div style={{ flex: 1, minWidth: 0 }}>
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
                      padding: '5px 9px',
                      borderRadius: 999,
                      background: `${stage.color}18`,
                      color: stage.color,
                      fontSize: '10px',
                      fontWeight: 900,
                    }}
                  >
                    {stage.emoji} {stage.label}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--t4)', whiteSpace: 'nowrap' }}>
                    다음 {getNextStage(totalMissionsCompleted)?.minMissions - totalMissionsCompleted || 0}개
                  </span>
                </div>

                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--t2)', marginBottom: 10 }}>{stage.desc}</div>
                <GrowthProgress totalMissions={totalMissionsCompleted} />
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 8,
            marginTop: 12,
          }}
        >
          <MetricCard icon="💎" value={currentBp} label="보유 BP" accent="var(--gold)" />
          <MetricCard icon="✅" value={totalMissionsCompleted} label="완료 미션" accent="#74B77B" />
          <MetricCard icon="📝" value={totalQuestions ?? '—'} label="총 질문" accent="#6E94D6" />
        </div>

        <button
          onClick={onRechargeFreeBP}
          style={{
            marginTop: 12,
            width: '100%',
            border: '1px solid var(--acc)',
            borderRadius: 16,
            padding: '11px 14px',
            background: 'var(--goldf)',
            color: 'var(--gold)',
            fontSize: '11px',
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
            marginTop: 12,
            padding: 6,
            display: 'flex',
            gap: 6,
          }}
        >
          {[
            { id: 'growth', label: '성장' },
            { id: 'stats', label: '통계' },
            { id: 'missions', label: '미션' },
          ].map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} style={tabButtonStyle(tab === item.id, stage.color)}>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'growth' ? (
            <>
              <div
                style={{
                  ...sectionCardStyle(),
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t2)', marginBottom: 6 }}>연속 방문</div>
                  <div style={{ fontSize: 26, lineHeight: 1, fontWeight: 900, color: '#E98143' }}>{loginStreak}일</div>
                  <div style={{ marginTop: 8, fontSize: '12px', lineHeight: 1.6, color: 'var(--t4)' }}>
                    오늘도 들어오면 흐름이 이어져요.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t2)', marginBottom: 6 }}>오늘 미션 진행</div>
                  <div style={{ fontSize: 26, lineHeight: 1, fontWeight: 900, color: stage.color }}>
                    {completedToday}/{safeMissions.length || 0}
                  </div>
                  <div style={{ marginTop: 8, fontSize: '12px', lineHeight: 1.6, color: 'var(--t4)' }}>
                    작은 행동을 하나씩 쌓아요.
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
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t2)' }}>통계를 불러오는 중</div>
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
              onDiaryClick={() => setStep(STEP.INQUIRY)}
              hasDiaryToday={safeMissions.some((mission) => mission.mission_type === 'diary' && mission.is_completed)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
