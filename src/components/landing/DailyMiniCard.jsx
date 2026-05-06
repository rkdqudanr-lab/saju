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

const TIME_SLOT_META = {
  morning: { label: '아침', range: '05:00-11:29', mealTitle: '아침밥', fallbackMeal: '요거트와 바나나', defaultAction: '오전에 할 일을 세 가지로 줄이기', defaultCaution: '시작부터 약속 늘리기', defaultCommunication: '먼저 짧게 안부 묻기', defaultAdvice: '오전에는 속도를 올리기보다 리듬을 잡아요.' },
  afternoon: { label: '점심', range: '11:30-16:59', mealTitle: '점심밥', fallbackMeal: '닭가슴살 비빔밥', defaultAction: '중요한 일 하나를 먼저 끝내기', defaultCaution: '판단을 급하게 확정하기', defaultCommunication: '핵심부터 말하기', defaultAdvice: '점심에는 선택지를 줄일수록 집중이 살아나요.' },
  evening: { label: '저녁', range: '17:00-19:59', mealTitle: '저녁밥', fallbackMeal: '구운 생선 정식', defaultAction: '오늘 남은 감정 정리하기', defaultCaution: '피곤한 상태로 대화 길게 끌기', defaultCommunication: '고생했다는 말 먼저 건네기', defaultAdvice: '저녁에는 관계보다 회복을 먼저 챙겨요.' },
  night: { label: '심야', range: '20:00-04:59', mealTitle: '야식', fallbackMeal: '따뜻한 우유', defaultAction: '내일 입을 옷이나 가방 정리하기', defaultCaution: '늦은 시간 충동 결제하기', defaultCommunication: '답장은 짧게, 결정은 내일로 미루기', defaultAdvice: '심야에는 마음을 가볍게 비우는 쪽이 좋아요.' },
};

const TIME_SLOT_KEYS = ['morning', 'afternoon', 'evening', 'night'];
const PICK_VIEW_KEYS = ['overall', ...TIME_SLOT_KEYS];
const PICK_VIEW_META = {
  overall: { label: '전체', range: '별숨픽 8항목' },
  ...TIME_SLOT_META,
};

const PICK_FIELD_META = [
  { key: 'food', label: '음식', icon: 'cake', question: '오늘 먹으면 좋은 음식을 더 자세히 알려줘.' },
  { key: 'place', label: '장소', icon: 'pin', question: '오늘 가면 좋은 장소를 더 자세히 알려줘.' },
  { key: 'color', label: '색', icon: 'palette', question: '오늘 행운의 색을 어떻게 쓰면 좋을까?' },
  { key: 'item', label: '아이템', icon: 'bag', question: '오늘 행운 아이템을 어떻게 활용하면 좋을까?' },
  { key: 'number', label: '숫자', icon: 'number', question: '오늘 행운 숫자의 의미를 알려줘.' },
  { key: 'direction', label: '방향', icon: 'compass', question: '오늘 유리한 방향을 어떻게 활용하면 좋을까?' },
  { key: 'communication', label: '소통', icon: 'chat', question: '오늘 사람들과 대화할 때 신경 쓸 점을 알려줘.' },
  { key: 'action', label: '행동', icon: 'pencil', question: '오늘의 행동 조언을 내 상황에 맞게 풀어줘.' },
];

const UNSUITABLE_TIME_SLOT_FOODS = {
  morning: ['티라미수', '케이크', '마카롱', '빙수', '젤라토', '파르페', '브라우니', '푸딩', '에이드', '라떼', '밀크티', '마라탕', '피자', '치킨', '버거', '튀김'],
  afternoon: [],
  evening: ['티라미수', '케이크', '마카롱', '빙수', '파르페'],
  night: ['티라미수', '케이크', '마카롱', '빙수', '젤라토', '파르페', '브라우니', '푸딩', '마라탕', '피자', '치킨', '버거', '튀김', '감자탕', '삼겹살', '갈비구이', '족발', '보쌈', '짬뽕'],
};

function isSuitableSlotFood(food, slotKey) {
  if (!food) return false;
  const blocked = UNSUITABLE_TIME_SLOT_FOODS[slotKey] || [];
  return !blocked.some((item) => food.includes(item));
}

function getSlotFood(parsed, slotKey) {
  const slotFood = parsed.timeSlots?.[slotKey]?.food?.trim();
  if (slotFood && isSuitableSlotFood(slotFood, slotKey)) {
    const firstSameSlot = TIME_SLOT_KEYS.find((key) => (
      parsed.timeSlots?.[key]?.food?.trim() === slotFood
    ));
    if (!firstSameSlot || firstSameSlot === slotKey) return slotFood;
  }
  return TIME_SLOT_META[slotKey]?.fallbackMeal || '가볍게 챙기기';
}

function getPickValue(parsed, viewKey, fieldKey) {
  const synergy = parsed.synergy || {};
  if (viewKey === 'overall') return synergy[fieldKey] || '';
  const slot = parsed.timeSlots?.[viewKey] || {};
  if (fieldKey === 'food') return getSlotFood(parsed, viewKey);
  if (fieldKey === 'action') return slot.action || synergy.action || TIME_SLOT_META[viewKey]?.defaultAction || '';
  if (fieldKey === 'communication') return slot.communication || synergy.communication || TIME_SLOT_META[viewKey]?.defaultCommunication || '';
  return slot[fieldKey] || synergy[fieldKey] || '';
}

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
  '음식':         'today-pick-shell',
  '장소':         'today-pick-shell',
  '색':           'today-pick-shell',
  '아이템':       'today-pick-shell',
  '숫자':         'today-pick-shell',
  '방향':         'today-pick-shell',
  '소통':         'today-pick-shell',
  '행동':         'today-pick-shell',
};
function getMealScrollKey() { return 'today-pick-shell'; }

const _R = 36, _C = 2 * Math.PI * _R, _TRACK = _C * 0.75;

function ScoreRing({ score, color }) {
  const s = Math.max(0, Math.min(100, score || 0));
  const fill = _TRACK * (s / 100);
  const endAngle = (135 + 270 * s / 100) * Math.PI / 180;
  const capX = 50 + _R * Math.cos(endAngle);
  const capY = 50 + _R * Math.sin(endAngle);
  const gid = `rg${score}`;
  return (
    <svg viewBox="0 0 100 100" className="dmc-ring" aria-hidden="true">
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="48%">
          <stop offset="0%" stopColor={color} stopOpacity="0.13"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid})`}/>
      <circle cx="18" cy="24" r="0.9" fill="rgba(255,255,255,.28)"/>
      <circle cx="82" cy="24" r="1.1" fill="rgba(255,255,255,.22)"/>
      <circle cx="11" cy="52" r="0.7" fill="rgba(255,255,255,.18)"/>
      <circle cx="89" cy="52" r="0.7" fill="rgba(255,255,255,.18)"/>
      <circle cx="50" cy="88" r="0.8" fill="rgba(255,255,255,.15)"/>
      <circle cx="29" cy="80" r="0.5" fill="rgba(255,255,255,.13)"/>
      <circle cx="71" cy="80" r="0.5" fill="rgba(255,255,255,.13)"/>
      <circle cx="50" cy="50" r={_R} fill="none"
        stroke="rgba(255,255,255,.08)" strokeWidth="5"
        strokeDasharray={`${_TRACK} ${_C - _TRACK}`}
        strokeLinecap="round" transform="rotate(135 50 50)" />
      <circle cx="50" cy="50" r={_R} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${_C - fill}`}
        strokeLinecap="round" transform="rotate(135 50 50)"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      {s > 2 && (
        <circle cx={capX} cy={capY} r="3.2" fill={color}
          style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
      )}
    </svg>
  );
}

const SLOT_ICONS = {
  overall: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  morning: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="9" r="3"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="6.5" y1="5" x2="7.9" y2="6.4"/>
      <line x1="17.5" y1="5" x2="16.1" y2="6.4"/>
      <line x1="4" y1="9" x2="6" y2="9"/>
      <line x1="18" y1="9" x2="20" y2="9"/>
      <line x1="2" y1="19" x2="22" y2="19"/>
    </svg>
  ),
  afternoon: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="5" y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="4.93" x2="7.05" y2="7.05"/>
      <line x1="16.95" y1="16.95" x2="19.07" y2="19.07"/>
      <line x1="19.07" y1="4.93" x2="16.95" y2="7.05"/>
      <line x1="7.05" y1="16.95" x2="4.93" y2="19.07"/>
    </svg>
  ),
  evening: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="17" x2="22" y2="17"/>
      <path d="M7 17a5 5 0 0 1 10 0"/>
      <line x1="12" y1="7" x2="12" y2="10"/>
    </svg>
  ),
  night: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  ),
};

const DASH_ICONS = {
  'trending-up': (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none" className="dmc-tile-icon" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="dmc-tile-icon" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  pencil: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="dmc-tile-icon" aria-hidden="true">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  cake: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="dmc-tile-icon" aria-hidden="true">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="dmc-tile-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="dmc-tile-icon" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="dmc-tile-icon" aria-hidden="true">
      <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11z"/>
      <circle cx="12" cy="10" r="2"/>
    </svg>
  ),
  palette: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="dmc-tile-icon" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0 0 18h1.5a1.8 1.8 0 0 0 1.2-3.1 1.8 1.8 0 0 1 1.2-3.1H18a6 6 0 0 0 0-12h-6z"/>
      <circle cx="7.5" cy="10" r="0.8"/>
      <circle cx="10" cy="7" r="0.8"/>
      <circle cx="13.5" cy="7.5" r="0.8"/>
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="dmc-tile-icon" aria-hidden="true">
      <path d="M6 8h12l-1 13H7L6 8z"/>
      <path d="M9 8a3 3 0 0 1 6 0"/>
    </svg>
  ),
  number: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="dmc-tile-icon" aria-hidden="true">
      <line x1="10" y1="3" x2="8" y2="21"/>
      <line x1="16" y1="3" x2="14" y2="21"/>
      <line x1="4" y1="9" x2="20" y2="9"/>
      <line x1="3" y1="15" x2="19" y2="15"/>
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="dmc-tile-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <path d="m15 9-2 5-4 1 2-5 4-1z"/>
    </svg>
  ),
};

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
  const [activeSlotKey, setActiveSlotKey] = useState('overall');

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
    return PICK_FIELD_META.map((field) => ({
      icon: field.icon,
      title: field.label,
      value: getPickValue(parsed, activeSlotKey, field.key) || '-',
      question: field.question,
    }));
  }, [activeSlotKey, parsed]);

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

      <button type="button" className="daily-mini-main" onClick={onClick} aria-label={`오늘의 별숨 ${score}점, 자세히 보기`}>
        <div className="daily-mini-score-title">오늘의 별숨 지수</div>
        <div className="dmc-ring-wrap">
          <ScoreRing score={scorePct} color={dynamicScoreColor(scorePct)} />
          <div className="dmc-ring-center">
            <span className="dmc-ring-num">{score}</span>
            <span className="dmc-ring-tone">{tone.label}</span>
          </div>
        </div>
      </button>

      <div className="daily-mini-time-tabs" aria-label="시간대별 별숨 선택">
        {PICK_VIEW_KEYS.map((key) => {
          const meta = PICK_VIEW_META[key];
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
              aria-label={`${meta.label} ${meta.range}`}
            >
              {SLOT_ICONS[key]}
              <span>{meta.label}</span>
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
            {DASH_ICONS[item.icon]}
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
