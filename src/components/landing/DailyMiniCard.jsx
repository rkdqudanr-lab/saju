import { useMemo, useState } from 'react';
import { parseDailyLines } from '../../utils/parseDailyLines.js';
import { useSajuCtx } from '../../context/AppContext.jsx';

const CATEGORY_LABELS = {
  overall: '종합',
  love: '연애',
  wealth: '돈',
  career: '일',
  study: '학업',
  health: '건강',
  social: '관계',
  travel: '이동',
  create: '창의',
};

function scoreTone(score) {
  if (score >= 85) {
    return { label: '강한 흐름' };
  }
  if (score >= 70) {
    return { label: '좋은 흐름' };
  }
  if (score >= 55) {
    return { label: '안정 흐름' };
  }
  if (score >= 40) {
    return { label: '조율 필요' };
  }
  return { label: '차분히 보기' };
}

function dynamicScoreColor(score) {
  if (score >= 80) return 'var(--gold)';
  if (score >= 60) return 'rgba(255,200,92,.72)';
  if (score >= 40) return 'rgba(212,204,230,.72)';
  return 'rgba(232,123,138,.9)';
}

function getMealPrompt(hour) {
  if (hour < 10) return { title: '오늘 아침밥은?', value: '속 편한 한 끼', question: '오늘 아침밥은 뭘 먹으면 좋을까?' };
  if (hour < 16) return { title: '오늘 점심밥은?', value: '든든하게 채우기', question: '오늘 점심밥은 뭘 먹으면 좋을까?' };
  if (hour < 21) return { title: '오늘 저녁밥은?', value: '가볍게 회복하기', question: '오늘 저녁밥은 뭘 먹으면 좋을까?' };
  return { title: '잠들기 전엔?', value: '자극 줄이기', question: '오늘 밤 잠들기 전에 하면 좋은 일을 알려줘' };
}

function getMealValue(meal, synergy) {
  const food = synergy?.food?.split(/[,.·/]/)[0]?.trim();
  if (food) return food;
  return meal.value;
}

const TIME_SLOT_META = {
  morning: { label: '아침', range: '05:00-11:29', mealTitle: '아침밥', fallbackMeal: '속 편한 한 끼', defaultAction: '오전에 할 일을 세 가지로 줄이기', defaultCaution: '시작부터 약속 늘리기', defaultCommunication: '먼저 짧게 안부 묻기', defaultAdvice: '오전에는 속도를 올리기보다 리듬을 잡아요.' },
  afternoon: { label: '오후', range: '11:30-16:59', mealTitle: '점심밥', fallbackMeal: '든든하게 채우기', defaultAction: '중요한 일 하나를 먼저 끝내기', defaultCaution: '판단을 급하게 확정하기', defaultCommunication: '핵심부터 말하기', defaultAdvice: '오후에는 선택지를 줄일수록 집중이 살아나요.' },
  evening: { label: '저녁', range: '17:00-19:59', mealTitle: '저녁밥', fallbackMeal: '가볍게 회복하기', defaultAction: '오늘 남은 감정 정리하기', defaultCaution: '피곤한 상태로 대화 길게 끌기', defaultCommunication: '고생했다는 말 먼저 건네기', defaultAdvice: '저녁에는 관계보다 회복을 먼저 챙겨요.' },
  night: { label: '심야', range: '20:00-04:59', mealTitle: '야식', fallbackMeal: '자극 줄이기', defaultAction: '내일 입을 옷이나 가방 정리하기', defaultCaution: '늦은 시간 충동 결제하기', defaultCommunication: '답장은 짧게, 결정은 내일로 미루기', defaultAdvice: '심야에는 마음을 가볍게 비우는 쪽이 좋아요.' },
};

const TIME_SLOT_KEYS = ['morning', 'afternoon', 'evening', 'night'];

function getCurrentTimeSlotKey(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 5 * 60 && minutes < 11 * 60 + 30) return 'morning';
  if (minutes >= 11 * 60 + 30 && minutes < 17 * 60) return 'afternoon';
  if (minutes >= 17 * 60 && minutes < 20 * 60) return 'evening';
  return 'night';
}

// 대시(—) 앞의 핵심 값만 추출 + 끝에 붙은 괄호 설명 제거
function primaryValue(value) {
  if (!value) return value;
  let s = String(value);
  const dashIdx = s.indexOf(' — ');
  if (dashIdx !== -1) s = s.slice(0, dashIdx);
  else {
    const dashIdx2 = s.indexOf('—');
    if (dashIdx2 !== -1) s = s.slice(0, dashIdx2);
  }
  // 끝의 괄호 설명 제거: "(상관없어요)", "(상관" 같은 완전/불완전 모두
  s = s.replace(/\s*\([^)]*\)?\s*$/, '');
  return s.trim();
}

// 타일 클릭 시 TodayDetailPage에서 스크롤할 섹션 매핑
const TILE_SCROLL_MAP = {
  '아침 운세':     'today-axis-section',
  '오후 운세':     'today-axis-section',
  '저녁 운세':     'today-axis-section',
  '심야 운세':     'today-axis-section',
  '조심할 것':     'today-axis-section',
  '아침 할 일':    'today-long-reading',
  '오후 할 일':    'today-long-reading',
  '저녁 할 일':    'today-long-reading',
  '심야 할 일':    'today-long-reading',
  '시간대 조언':   'today-long-reading',
  '대화 팁':       'today-pick-shell',
};
function getMealScrollKey() { return 'today-pick-shell'; }

export default function DailyMiniCard({
  dailyResult,
  todayScore,
  loading = false,
  onAsk,
  onClick,
  boostCount = 0,
  scoreBoostDelta = 0,
  topAxes = [],
  bottomAxes = [],
}) {
  const { today } = useSajuCtx();
  const [activeSlotKey, setActiveSlotKey] = useState(() => getCurrentTimeSlotKey());

  const parsed = useMemo(
    () => parseDailyLines(dailyResult?.text || ''),
    [dailyResult?.text],
  );

  const score = todayScore || parsed.score || dailyResult?.score;
  const dateLabel = today ? `${today.month}월 ${today.day}일` : '';
  const tone = score ? scoreTone(score) : scoreTone(0);
  const scorePct = Math.max(0, Math.min(100, Number(score) || 0));
  const meal = useMemo(() => getMealPrompt(new Date().getHours()), []);
  const dashboardItems = useMemo(() => {
    const allAxes = [...topAxes, ...bottomAxes].filter(Boolean);
    const best = topAxes[0] || allAxes.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    const caution = bottomAxes[0] || allAxes.sort((a, b) => (a.score || 0) - (b.score || 0))[0];
    const bestLabel = best?.label || CATEGORY_LABELS[best?.key] || '좋은 흐름';
    const cautionLabel = caution?.label || CATEGORY_LABELS[caution?.key] || '조심할 흐름';
    const synergy = parsed.synergy || {};
    const eastern = parsed.easternKi || {};
    const activeMeta = TIME_SLOT_META[activeSlotKey] || TIME_SLOT_META.afternoon;
    const activeSlot = parsed.timeSlots?.[activeSlotKey] || {};
    const fallbackMeal = getMealValue(meal, synergy) || activeMeta.fallbackMeal;
    return [
      {
        icon: 'trending-up',
        title: `${activeMeta.label} 운세`,
        value: best?.score ? `${bestLabel} ${best.score}` : tone.label,
        question: `오늘 ${bestLabel} 운을 어떻게 살리면 좋을까?`,
      },
      {
        icon: 'bolt',
        title: '조심할 것',
        value: activeSlot.caution || (caution?.score ? `${cautionLabel} ${caution.score}` : (eastern.dontAction || activeMeta.defaultCaution)),
        question: `오늘 조심해야 할 운세를 자세히 알려줘.`,
      },
      {
        icon: 'pencil',
        title: `${activeMeta.label} 할 일`,
        value: activeSlot.action || eastern.doAction || synergy.action || activeMeta.defaultAction,
        question: '오늘의 한 줄 조언을 내 상황에 맞게 풀어줘.',
      },
      {
        icon: 'cake',
        title: activeMeta.mealTitle,
        value: activeSlot.food || fallbackMeal,
        question: meal.question,
      },
      {
        icon: 'moon',
        title: '시간대 조언',
        value: activeSlot.advice || activeMeta.defaultAdvice,
        question: '지금 시간대에 맞는 조언을 더 자세히 알려줘.',
      },
      {
        icon: 'chat',
        title: '대화 팁',
        value: activeSlot.communication || synergy.communication || activeMeta.defaultCommunication,
        question: '오늘 사람들과 대화할 때 신경 쓸 점을 알려줘.',
      },
    ];
  }, [activeSlotKey, bottomAxes, meal, parsed.easternKi, parsed.synergy, parsed.timeSlots, tone.label, topAxes]);

  const handleDashboardClick = (item, event) => {
    event.stopPropagation();
    const scrollTarget = item.title.startsWith('오늘 ') && item.title.includes('밥')
      ? getMealScrollKey()
      : (TILE_SCROLL_MAP[item.title] || null);
    if (scrollTarget) {
      try { sessionStorage.setItem('today_scroll_to', scrollTarget); } catch {}
    }
    onClick?.();
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="daily-mini-loading" aria-busy="true" aria-label="오늘의 별숨 불러오는 중">
        <div className="daily-mini-loading-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="daily-mini-loading-text">오늘의 별숨을 읽는 중</div>
        <div className="daily-mini-loading-sub">사주와 별자리 흐름을 맞춰보고 있어요</div>
      </div>
    );
  }

  // 운세 미조회
  if (!dailyResult) {
    return (
      <div className="daily-mini-card daily-mini-card--empty" style={{ textAlign: 'center' }}>
        <div className="daily-mini-eyebrow">
          ✦ 오늘 하루 나의 별숨{dateLabel ? ` · ${dateLabel}` : ''}
        </div>
        <div className="daily-mini-empty-copy">
          별이 오늘의 기운을 알려드릴게요
        </div>
        <button
          type="button"
          className="daily-mini-cta"
          onClick={onAsk}
          aria-label="오늘 별숨의 기운 확인하기"
        >
          오늘 별숨의 기운 확인하기 ✦
        </button>
      </div>
    );
  }

  // 운세 조회 완료
  return (
    <div
      className="daily-mini-card"
      data-tour="daily-card"
      style={{
        width: '100%',
        '--daily-score-pct': `${scorePct}%`,
        '--daily-score-color': dynamicScoreColor(scorePct),
      }}
    >
      <div className="daily-mini-glow" aria-hidden="true" />

      <div className="daily-mini-topline">
        <span className="daily-mini-eyebrow">
          ✦ 오늘 하루 나의 별숨{dateLabel ? ` · ${dateLabel}` : ''}
        </span>
      </div>

      <div className="daily-mini-main">
        <div className="daily-mini-score-title">오늘의 별숨 지수</div>
        <div className="daily-mini-score-wrap">
          <span className="daily-mini-score-value">{score}</span>
          <div className="daily-mini-score-state">{tone.label}</div>
        </div>
      </div>

      <div className="daily-mini-time-tabs" aria-label="시간대별 별숨 선택">
        {TIME_SLOT_KEYS.map((key) => {
          const meta = TIME_SLOT_META[key];
          const active = key === activeSlotKey;
          return (
            <button
              key={key}
              type="button"
              className={`daily-mini-time-tab ${active ? 'is-active' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                setActiveSlotKey(key);
              }}
              aria-pressed={active}
            >
              <span>{meta.label}</span>
              <small>{meta.range}</small>
            </button>
          );
        })}
      </div>

      {(topAxes.length > 0 || bottomAxes.length > 0) && (
        <div className="daily-mini-axis-chips">
          {topAxes.map((a) => (
            <span key={a.key} className="daily-mini-axis-chip daily-mini-axis-chip--high">
              {a.label} {a.score}↑
            </span>
          ))}
          {bottomAxes.map((a) => (
            <span key={a.key} className="daily-mini-axis-chip daily-mini-axis-chip--low">
              {a.label} {a.score}↓
            </span>
          ))}
        </div>
      )}

      {(scoreBoostDelta > 0 || boostCount > 0) && (
        <div className="daily-mini-badges">
          {scoreBoostDelta > 0 && (
            <span className="daily-mini-badge">
              +{scoreBoostDelta}↑
            </span>
          )}
          {boostCount > 0 && (
            <span className="daily-mini-badge">
              ✦ {boostCount}개 기운 적용 중
            </span>
          )}
        </div>
      )}

      <div className="daily-mini-dashboard" aria-label="오늘의 미니 대시보드">
        {dashboardItems.map((item) => (
          <button
            key={item.title}
            type="button"
            className="daily-mini-dash-item"
            onClick={(event) => handleDashboardClick(item, event)}
            aria-label={`${item.title}: ${item.value}`}
          >
            <span className="daily-mini-dash-label">{item.title}</span>
            <span className="daily-mini-dash-value">{primaryValue(item.value)}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="daily-mini-cta"
        onClick={onClick}
        aria-label={`오늘의 별숨 ${score}점, 자세히 보기`}
      >
        자세히 보기 →
      </button>

    </div>
  );
}
