import { useMemo } from 'react';
import { parseDailyLines } from '../../utils/parseDailyLines.js';
import { useSajuCtx } from '../../context/AppContext.jsx';
import Icon from '../Icon.jsx';

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

// 대시(—) 앞의 핵심 값만 추출
function primaryValue(value) {
  if (!value) return value;
  const s = String(value);
  const idx = s.indexOf(' — ');
  if (idx !== -1) return s.slice(0, idx).trim();
  const idx2 = s.indexOf('—');
  if (idx2 !== -1) return s.slice(0, idx2).trim();
  return s;
}

// 타일 클릭 시 TodayDetailPage에서 스크롤할 섹션 매핑
const TILE_SCROLL_MAP = {
  '좋은 운세':     'today-axis-section',
  '조심할 것':     'today-axis-section',
  '한 줄 조언':    'today-long-reading',
  '시간대 힌트':   'today-long-reading',
  '오늘 색감':     'today-pick-shell',
  '가면 좋은 곳':  'today-pick-shell',
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
  onQuickAsk,
}) {
  const { today } = useSajuCtx();

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
    const western = parsed.westernSky || {};
    return [
      {
        icon: 'trending-up',
        title: '좋은 운세',
        value: best?.score ? `${bestLabel} ${best.score}` : tone.label,
        question: `오늘 ${bestLabel} 운을 어떻게 살리면 좋을까?`,
      },
      {
        icon: 'bolt',
        title: '조심할 것',
        value: caution?.score ? `${cautionLabel} ${caution.score}` : (eastern.dontAction || '과속 금지'),
        question: `오늘 조심해야 할 운세를 자세히 알려줘.`,
      },
      {
        icon: 'pencil',
        title: '한 줄 조언',
        value: eastern.doAction || synergy.action || '흐름 정리',
        question: '오늘의 한 줄 조언을 내 상황에 맞게 풀어줘.',
      },
      {
        icon: 'cake',
        title: meal.title,
        value: getMealValue(meal, synergy),
        question: meal.question,
      },
      {
        icon: 'sparkles',
        title: '오늘 색감',
        value: synergy.color || '따뜻한 톤',
        question: '오늘 행운 색을 어떻게 활용하면 좋을까?',
      },
      {
        icon: 'globe',
        title: '가면 좋은 곳',
        value: synergy.place || '조용한 자리',
        question: '오늘 가면 좋은 장소와 피하면 좋은 장소를 알려줘.',
      },
      {
        icon: 'chat',
        title: '대화 팁',
        value: synergy.communication || '짧고 선명하게',
        question: '오늘 사람들과 대화할 때 신경 쓸 점을 알려줘.',
      },
      {
        icon: 'moon',
        title: '시간대 힌트',
        value: western.flow || synergy.direction || '오후 정리',
        question: '오늘 시간대별로 하면 좋은 일을 알려줘.',
      },
      {
        icon: 'magnifying-glass',
        title: '바로 묻기',
        value: '별숨에게 질문',
        question: '오늘 하루 나의 별숨을 바탕으로 지금 제일 먼저 챙길 일을 알려줘.',
      },
    ];
  }, [bottomAxes, meal, parsed.easternKi, parsed.synergy, parsed.westernSky, tone.label, topAxes]);

  const handleDashboardClick = (item, event) => {
    event.stopPropagation();
    if (item.title === '바로 묻기') {
      onQuickAsk?.();
      return;
    }
    // 스크롤 타깃을 sessionStorage에 저장 후 자세히 보기 페이지로 이동
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
        <div className="daily-mini-score-wrap">
          <div className="daily-mini-score-panel">
            <span className="daily-mini-score-label">오늘의 별숨 지수</span>
            <span className="daily-mini-score-value">{score}</span>
          </div>
          <div className="daily-mini-score-state">{tone.label}</div>
        </div>
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
            <span className="daily-mini-dash-head">
              <span className="daily-mini-dash-icon"><Icon name={item.icon} size={12} color="currentColor" /></span>
              <span className="daily-mini-dash-title">{item.title}</span>
            </span>
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

      <div className="daily-mini-meter" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
