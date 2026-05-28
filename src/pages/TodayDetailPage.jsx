import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseDailyLines } from '../utils/parseDailyLines.js';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { STEP } from '../utils/steps.js';
import { getDailyDateKey, readDailyLocalCache, writeDailyLocalCache } from '../lib/dailyDataAccess.js';
import '../styles/TodayDetailPage.css';

import DailyElementMeet from '../components/DailyElementMeet.jsx';
import AstroSignViz from '../components/AstroSignViz.jsx';
import DailyRadarChart from '../features/today/DailyRadarChart.jsx';
import WeeklyTrendChart from '../features/today/WeeklyTrendChart.jsx';
import GoldenParticles from '../features/today/GoldenParticles.jsx';
import { ACTIONABLE_AXIS_KEYS, ASPECT_META, getAverageFortuneScore, getDailyAxisScores, normalizeAndClamp, TODAY_AXIS_CACHE } from '../features/today/getDailyAxisScores.js';
import { TODAY_AXIS_TEXT_CACHE, deriveByeolsoomPick } from '../features/today/fortuneAxisTools.js';

const PICK_FIELD_META = [
  { key: 'food', label: '음식', icon: '🍽', tone: 'gold' },
  { key: 'place', label: '장소', icon: '📍', tone: 'teal' },
  { key: 'color', label: '색', icon: '🎨', tone: 'coral' },
  { key: 'item', label: '아이템', icon: '🪄', tone: 'plum' },
  { key: 'number', label: '숫자', icon: '🔢', tone: 'sky' },
  { key: 'direction', label: '방향', icon: '🧭', tone: 'lime' },
  { key: 'communication', label: '소통', icon: '💬', tone: 'rose' },
  { key: 'action', label: '행동', icon: '✨', tone: 'gold' },
];

const AXIS_TONE_META = {
  focus: {
    accent: '#7ec8e3',
    soft: 'rgba(126, 200, 227, 0.18)',
    glow: 'rgba(126, 200, 227, 0.3)',
  },
  boost: {
    accent: 'var(--gold)',
    soft: 'rgba(232, 176, 72, 0.18)',
    glow: 'rgba(232, 176, 72, 0.34)',
  },
  care: {
    accent: '#d57c58',
    soft: 'rgba(213, 124, 88, 0.18)',
    glow: 'rgba(213, 124, 88, 0.3)',
  },
  watch: {
    accent: '#a18ec8',
    soft: 'rgba(161, 142, 200, 0.16)',
    glow: 'rgba(161, 142, 200, 0.26)',
  },
  steady: {
    accent: '#91a0bb',
    soft: 'rgba(145, 160, 187, 0.14)',
    glow: 'rgba(145, 160, 187, 0.22)',
  },
};


/** 점수 구간별 등급 라벨 반환 */
function getScoreGrade(score) {
  if (score >= 81) return { label: '빛나는 날', icon: '✨', color: '#B8A035' };
  if (score >= 61) return { label: '활기찬 날', icon: '☀️', color: '#E08A3A' };
  if (score >= 41) return { label: '평온한 날', icon: '⛅', color: '#4A9EFF' };
  if (score >= 21) return { label: '차분한 날', icon: '☁️', color: '#7B9EBB' };
  return { label: '조심스러운 날', icon: '🌧️', color: '#9E7BB5' };
}


/** 조디악 기호 제거 + 핵심 구문 자동 굵게 처리 → React 노드 배열 반환 */
function renderBoldText(text) {
  if (!text) return null;

  const t = text
    .replace(/[♈♉♊♋♌♍♎♏♐♑♒♓]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // 쉼표 뒤부터 마침표(또는 !?)까지 강조
  const marked = t.replace(/,(\s*)([^,]*?[.!?])/g, (_, space, content) => {
    const trimmed = content.trim();
    return trimmed ? ',' + space + '**' + trimmed + '**' : ',' + space + content;
  });

  return marked.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: 'var(--t1)' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

function getFortuneLabel(axisKey) {
  const base = ASPECT_META[axisKey]?.label || axisKey;
  return base.endsWith('운') ? base : `${base}운`;
}

function getFallbackHeadline(axisKey, parsedDaily) {
  const direct = parsedDaily?.categories?.[axisKey]?.desc?.trim();
  if (direct) return direct;
  return `${getFortuneLabel(axisKey)}의 흐름을 다시 읽는 중이에요.`;
}

async function loadJsonCache(kakaoId, cacheType) {
  if (!kakaoId) return {};
  try {
    const client = getAuthenticatedClient(String(kakaoId));
    if (!client) return {}; // Supabase 미설정 시 빈 객체로 안전 반환
    const { data } = await client
      .from('daily_cache')
      .select('content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_date', getDailyDateKey())
      .eq('cache_type', cacheType)
      .maybeSingle();
    return JSON.parse(data?.content || '{}');
  } catch {
    return {};
  }
}

async function saveTodayScore(kakaoId, score) {
  if (!kakaoId || !Number.isFinite(score)) return;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const content = String(normalizedScore);
  writeDailyLocalCache(String(kakaoId), 'horoscope_score', content, getDailyDateKey());
  const client = getAuthenticatedClient(String(kakaoId));
  if (!client) return; // Supabase 미설정 시 로컬캐시까지만
  await Promise.all([
    client.from('daily_cache').upsert(
      { kakao_id: String(kakaoId), cache_date: getDailyDateKey(), cache_type: 'horoscope_score', content },
      { onConflict: 'kakao_id,cache_date,cache_type' },
    ),
    client.from('daily_scores').upsert(
      { kakao_id: String(kakaoId), score_date: getDailyDateKey(), score: normalizedScore },
      { onConflict: 'kakao_id,score_date' },
    ),
  ]);
}

function splitPickValue(value) {
  const text = String(value || '').trim();
  if (!text) return { primary: '', description: '' };
  const [primary, ...rest] = text.split(/\s*[-–—:]\s*/);
  if (!rest.length) return { primary: text, description: '' };
  return {
    primary: primary.trim(),
    description: rest.join(' · ').trim(),
  };
}

function getAxisCardState(axis, pick, rankByKey) {
  const isCare = axis.key === pick?.careKey;
  const isFocus = axis.key === pick?.focusKey;

  if (isCare && axis.total <= 46) {
    return { tone: 'care', badge: '보강 필요', caption: '오늘 가장 예민한 축이에요' };
  }
  if (isFocus || rankByKey[axis.key] === 1) {
    return { tone: 'focus', badge: '오늘 강세', caption: '반응이 빠르게 오는 구간이에요' };
  }
  if ((rankByKey[axis.key] || 99) >= 6 || axis.total <= 52) {
    return { tone: 'watch', badge: '체크 권장', caption: '살짝만 손봐도 체감이 큰 축이에요' };
  }
  return { tone: 'steady', badge: '균형권', caption: '지금은 무리 없이 유지되는 축이에요' };
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

// 종결어미/문장부호로 끝나면 "완전 문장", 그 외(명사구 등)는 false
function isSentenceLike(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/[.!?。！？]$/.test(t)) return true;
  return /(어요|아요|에요|예요|해요|네요|죠|까요|니다|습니다)$/.test(t);
}

// 값이 명사구면 nounFn, 완전 문장이면 sentenceFn 적용 (trailing 문장부호 제거 후 전달)
function joinPhrase(value, nounFn, sentenceFn) {
  if (!value) return '';
  const v = String(value).trim().replace(/[.!?。！？]+$/, '');
  return isSentenceLike(value) ? sentenceFn(v) : nounFn(v);
}

function buildDailyLongReading({ parsedDaily, axisScores, overallGuide }) {
  const eastern = parsedDaily?.easternKi || {};
  const western = parsedDaily?.westernSky || {};
  const sortedAxes = [...(axisScores || [])].sort((a, b) => (b.total || 0) - (a.total || 0));
  const strongest = sortedAxes[0];
  const care = [...(axisScores || [])].sort((a, b) => (a.total || 0) - (b.total || 0))[0];
  const strongestLabel = strongest?.fullLabel || strongest?.label || '강하게 올라오는 운';
  const careLabel = care?.fullLabel || care?.label || '살짝 돌봐야 할 운';

  const easternText = compactText(eastern.kiun || eastern.sinshin);
  const westernText = compactText(western.flow || western.planet);
  const summaryText = compactText(overallGuide?.summary || parsedDaily?.synergy?.summary);

  return [
    {
      title: '오늘의 사주 기운',
      body: easternText
        || `오늘은 ${strongestLabel}이 먼저 살아나는 날이에요. ${careLabel}은 작은 말투나 컨디션 변화에도 흔들릴 수 있으니, 큰 결정보다는 흐름을 정돈하는 데 힘을 두세요.`,
    },
    {
      title: '오늘의 점성술 흐름',
      body: westernText
        || `별자리 흐름에서 감정과 판단의 속도가 평소보다 또렷하게 갈릴 수 있어요. ${careLabel}에서는 상대의 반응을 한 번 더 확인하는 태도가 중요합니다.`,
    },
    {
      title: '그래서 오늘은',
      body: summaryText
        || `오늘은 잘 되는 흐름을 붙잡고 예민한 부분을 천천히 정리하는 날이에요. ${careLabel}에서는 서두르기보다 한 박자 늦추세요.`,
    },
  ].filter((section) => compactText(section.body));
}

function PickField({ label, value, icon, tone, onClick }) {
  if (!value) return null;
  const { primary, description } = splitPickValue(value);
  return (
    <div
      className={`today-pick-field today-pick-field--${tone}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <div className="today-pick-field__top">
        <span className="today-pick-field__icon" aria-hidden="true">{icon}</span>
        <span className="today-pick-field__label">{label}</span>
      </div>
      <div className="today-pick-field__value">{primary}</div>
      {description && <div className="today-pick-field__desc">{description}</div>}
      {onClick && <div style={{ fontSize: 9, color: 'var(--t4)', marginTop: 4, opacity: 0.7 }}>탭해서 별숨에게 물어보기 →</div>}
    </div>
  );
}

export default function TodayDetailPage({
  dailyResult,
  dailyLoading,
  dailyCount = 0,
  DAILY_MAX = 999,
  gamificationState,
  onBlockBadtime = null,
  isBlockingBadtime,
  setStep,
  onRefresh,
  showToast = null,
  onQuickChat = null,
}) {
  const user = useAppStore((s) => s.user);
  const today = useAppStore((s) => s.today);
  const saju = useAppStore((s) => s.saju);
  const sun = useAppStore((s) => s.sun);
  const moon = useAppStore((s) => s.moon);
  const asc = useAppStore((s) => s.asc);
  const kakaoId = user?.kakaoId || user?.id;
  const prevTodayScoreRef = useRef(0);

  const [axisTextOverrides, setAxisTextOverrides] = useState({});
  const [showParticles, setShowParticles] = useState(false);
  const [boostMap, setBoostMap] = useState(() => {
    if (!kakaoId) return {};
    try {
      const raw = readDailyLocalCache(String(kakaoId), TODAY_AXIS_CACHE, getDailyDateKey());
      const parsed = JSON.parse(raw || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch { return {}; }
  });
  const [scoreHistory, setScoreHistory] = useState([]);

  // 미니카드 타일 클릭 시 스크롤 처리
  useEffect(() => {
    try {
      const target = sessionStorage.getItem('today_scroll_to');
      if (!target) return;
      sessionStorage.removeItem('today_scroll_to');
      const el = document.getElementById(target);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } catch {}
  }, []);

  const parsedDaily = useMemo(
    () => parseDailyLines(dailyResult?.text || ''),
    [dailyResult?.text],
  );

  const axisScores = useMemo(
    () => getDailyAxisScores(dailyResult?.score || 0, boostMap, parsedDaily.categories),
    [dailyResult?.score, boostMap, parsedDaily.categories],
  );

  const actionableScores = useMemo(
    () => axisScores.filter((score) => ACTIONABLE_AXIS_KEYS.includes(score.key)),
    [axisScores],
  );

  const todayScore = useMemo(
    () => getAverageFortuneScore(axisScores),
    [axisScores],
  );

  // ── 표준편차 기반 정규화 (LandingPage와 동일 로직) ──
  const allRawHistoryScores = useMemo(
    () => scoreHistory.map((s) => s.score).filter((s) => s !== null),
    [scoreHistory],
  );
  const normalizedTodayScore = useMemo(
    () => normalizeAndClamp(todayScore, allRawHistoryScores),
    [todayScore, allRawHistoryScores],
  );

  // 개인 Baseline: 과거 저장된 점수들의 평균 (Task #15)
  const personalBaseline = useMemo(() => {
    const valid = allRawHistoryScores.filter((s) => typeof s === 'number' && Number.isFinite(s));
    if (!valid.length) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }, [allRawHistoryScores]);

  const overallGuide = useMemo(() => ({
    summary: parsedDaily.summary || parsedDaily.categories?.overall?.desc || parsedDaily.closingAdvice || '오늘 흐름을 가볍게 정리하면서 리듬을 맞춰보세요.',
    do: parsedDaily.easternKi?.doAction || '오늘 잘 풀리는 쪽에 에너지를 먼저 써보세요.',
    caution: parsedDaily.easternKi?.dontAction || '과하게 힘을 주기보다 균형을 챙기는 편이 좋아요.',
  }), [parsedDaily]);

  const byeolsoomPick = useMemo(
    () => deriveByeolsoomPick(actionableScores, parsedDaily.synergy),
    [actionableScores, parsedDaily.synergy],
  );

  const dailyLongReading = useMemo(
    () => buildDailyLongReading({ parsedDaily, axisScores: actionableScores, overallGuide }),
    [parsedDaily, actionableScores, overallGuide],
  );

  const scoreCardData = useMemo(() => {
    const grade = getScoreGrade(normalizedTodayScore);
    const sorted = [...actionableScores].sort((a, b) => b.total - a.total);
    return { grade, topAxis: sorted[0], bottomAxis: sorted[sorted.length - 1] };
  }, [normalizedTodayScore, actionableScores]);

  const axisRankMap = useMemo(
    () => Object.fromEntries(
      [...actionableScores]
        .sort((a, b) => (b.total || 0) - (a.total || 0))
        .map((score, index) => [score.key, index + 1]),
    ),
    [actionableScores],
  );

  const axisCards = useMemo(() => actionableScores.map((score) => {
    const fullLabel = getFortuneLabel(score.key);
    const status = getAxisCardState(score, byeolsoomPick, axisRankMap);
    const toneMeta = AXIS_TONE_META[status.tone] || AXIS_TONE_META.steady;
    const baseFillWidth = Math.max(0, Math.min(100, score.total || 0));

    return {
      ...score,
      rank: axisRankMap[score.key] || actionableScores.length,
      fullLabel,
      headline: axisTextOverrides?.[score.key] || getFallbackHeadline(score.key, parsedDaily),
      status,
      toneMeta,
      baseFillWidth,
    };
  }), [actionableScores, axisRankMap, axisTextOverrides, byeolsoomPick, parsedDaily]);

  useEffect(() => {
    let cancelled = false;
    if (!kakaoId) return undefined;

    (async () => {
      const loadedTextOverrides = await loadJsonCache(kakaoId, TODAY_AXIS_TEXT_CACHE);
      if (cancelled) return;
      setAxisTextOverrides(loadedTextOverrides && typeof loadedTextOverrides === 'object' ? loadedTextOverrides : {});
    })();

    return () => {
      cancelled = true;
    };
  }, [kakaoId]);

  // ── useEffect: 30일 점수 히스토리 (정규화용) ──
  useEffect(() => {
    if (!kakaoId) { setScoreHistory([]); return; }
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return getDailyDateKey(d);
    });
    getAuthenticatedClient(String(kakaoId))
      ?.from('daily_scores')
      .select('score_date, score')
      .eq('kakao_id', String(kakaoId))
      .in('score_date', last30)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((r) => { map[r.score_date] = Number(r.score); });
        setScoreHistory(last30.reverse().map((date) => ({ date, score: map[date] ?? null })));
      })
      .catch(() => {});
  }, [kakaoId]);

  // ── useEffect: boostMap 로드 ──
  useEffect(() => {
    if (!kakaoId || !dailyResult) return;
    getAuthenticatedClient(String(kakaoId))
      ?.from('daily_cache')
      .select('cache_type, content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_date', getDailyDateKey())
      .eq('cache_type', TODAY_AXIS_CACHE)
      .maybeSingle()
      .then(({ data }) => {
        try {
          const parsed = JSON.parse(data?.content || '{}');
          setBoostMap(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
        } catch { setBoostMap({}); }
      })
      .catch(() => { setBoostMap({}); });
  }, [kakaoId, dailyResult?.score]);

  useEffect(() => {
    if (!dailyResult || !kakaoId || !Number.isFinite(normalizedTodayScore)) return;
    saveTodayScore(kakaoId, normalizedTodayScore).catch(() => {});
  }, [dailyResult, kakaoId, normalizedTodayScore]);

  useEffect(() => {
    if (normalizedTodayScore >= 100 && prevTodayScoreRef.current < 100) {
      setShowParticles(true);
    }
    prevTodayScoreRef.current = normalizedTodayScore;
  }, [normalizedTodayScore]);

  const handleShareDaily = useCallback(async () => {
    if (!dailyResult) return;
    const dateStr = today ? `${today.month}월 ${today.day}일` : '';
    const text = `✦ 오늘의 별숨${dateStr ? ` · ${dateStr}` : ''}\n${overallGuide.summary}\n\n별숨점수 ${normalizedTodayScore}점\n\n— 별숨 앱`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '별숨 ✦', text });
      } catch {}
    } else {
      await navigator.clipboard?.writeText(text);
      showToast?.('클립보드에 복사됐어요', 'success');
    }
  }, [dailyResult, normalizedTodayScore, overallGuide.summary, showToast, today]);

  const handleReaskDaily = useCallback(async () => {
    if (!onRefresh || dailyLoading) return;
    if (dailyCount >= DAILY_MAX) {
      showToast?.('오늘 다시 볼 수 있는 횟수를 모두 사용했어요.', 'warn');
      return;
    }
    try {
      const ok = await onRefresh({
        saveHistory: true,
        incrementCount: true,
      });
      if (ok === false) {
        showToast?.('오늘 운세를 다시 불러오지 못했어요. 잠시 후 시도해주세요.', 'error');
      }
    } catch (err) {
      if (err?.message !== 'LOGIN_REQUIRED' && err?.message !== 'SESSION_EXPIRED') {
        showToast?.('오늘 운세를 다시 불러오지 못했어요. 잠시 후 시도해주세요.', 'error');
      }
    }
  }, [DAILY_MAX, dailyCount, dailyLoading, onRefresh, showToast]);


  if (dailyLoading && !dailyResult) {
    return <PageSpinner />;
  }

  void gamificationState;

  return (
    <div className="today-detail-container">
      <GoldenParticles active={showParticles} onComplete={() => setShowParticles(false)} />

      <div className="today-detail-header">
        <button className="today-detail-back-btn" onClick={() => setStep(STEP.HOME)} aria-label="홈으로 돌아가기">←</button>
        <span className="today-detail-title">오늘 하루 나의 별숨</span>
        {dailyResult ? (
          <button
            onClick={handleShareDaily}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'none',
              border: '1px solid var(--line)',
              color: 'var(--t3)',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="공유하기"
          >
            ↗
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </div>

      <div className="today-detail-content">
        {dailyResult ? (
          <Suspense fallback={<PageSpinner />}>

            {/* ① TODAY SCORE */}
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '20px 18px 14px', marginBottom: 16, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 16 }}>
                TODAY SCORE
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, lineHeight: 1 }}>
                    <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
                      {normalizedTodayScore}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--t3)' }}>점</span>
                  </div>
                  {personalBaseline !== null ? (
                    <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 5 }}>
                      {allRawHistoryScores.length}일 평균 {personalBaseline}점 대비{' '}
                      <span style={{ color: normalizedTodayScore >= personalBaseline ? '#4cbb7f' : '#d57c58', fontWeight: 700 }}>
                        {normalizedTodayScore >= personalBaseline ? '+' : ''}{normalizedTodayScore - personalBaseline}점
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 5 }}>
                      {actionableScores.length}개 운세축 평균
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: `${scoreCardData.grade.color}1a`, border: `1px solid ${scoreCardData.grade.color}50`,
                  borderRadius: 20, padding: '5px 12px', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 15 }}>{scoreCardData.grade.icon}</span>
                  <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: scoreCardData.grade.color }}>{scoreCardData.grade.label}</span>
                </div>
              </div>
              {scoreCardData.topAxis && scoreCardData.bottomAxis && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(76,187,127,0.07)', border: '1px solid rgba(76,187,127,0.28)', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 13, color: '#4cbb7f' }}>↑</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: '#4cbb7f', fontWeight: 600, marginBottom: 1 }}>강세</div>
                      <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ASPECT_META[scoreCardData.topAxis.key]?.emoji} {ASPECT_META[scoreCardData.topAxis.key]?.label || scoreCardData.topAxis.label}
                      </div>
                    </div>
                    <span style={{ fontSize: 'var(--sm)', fontWeight: 900, color: '#4cbb7f', flexShrink: 0 }}>{scoreCardData.topAxis.total}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(213,124,88,0.07)', border: '1px solid rgba(213,124,88,0.25)', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 13, color: '#d57c58' }}>↓</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: '#d57c58', fontWeight: 600, marginBottom: 1 }}>주의</div>
                      <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ASPECT_META[scoreCardData.bottomAxis.key]?.emoji} {ASPECT_META[scoreCardData.bottomAxis.key]?.label || scoreCardData.bottomAxis.label}
                      </div>
                    </div>
                    <span style={{ fontSize: 'var(--sm)', fontWeight: 900, color: '#d57c58', flexShrink: 0 }}>{scoreCardData.bottomAxis.total}</span>
                  </div>
                </div>
              )}
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                {overallGuide.summary}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 9, color: 'var(--t4)' }}>
                <span>
                  8축 평균 {todayScore}점
                  {allRawHistoryScores.length >= 5 ? ` · ${allRawHistoryScores.length}일 개인화 적용` : ` · ${allRawHistoryScores.length}일 누적 중`}
                </span>
                <span>흐름 안내 · 참고 지표</span>
              </div>
            </div>

            {/* ② 저점수 자기돌봄 카드 (score < 40) */}
            {normalizedTodayScore < 40 && (
              <div style={{ background: 'rgba(161,142,200,0.12)', border: '1px solid rgba(161,142,200,0.35)', borderRadius: 'var(--r1)', padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: '#a18ec8', marginBottom: 8 }}>
                  💙 오늘은 나를 먼저 챙기는 날이에요
                </div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>
                  흐름이 잠시 낮아진 날엔 억지로 밀어붙이기보다 회복에 집중하는 것이 더 효과적이에요.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {['충분한 수면', '따뜻한 음료', '짧은 산책', '연락 줄이기', '일정 단순화'].map((tip) => (
                    <span key={tip} style={{ fontSize: 11, color: '#a18ec8', background: 'rgba(161,142,200,0.15)', borderRadius: 20, padding: '3px 10px' }}>{tip}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ③ 배드타임 카드 (파싱된 경우) */}
            {(dailyResult?.badtime || parsedDaily.badtime) && (
              <div style={{ background: 'rgba(201,160,220,0.08)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid rgba(201,160,220,0.18)' }}>
                <div style={{ fontSize: 10, color: '#c9a0dc', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>⚠️ 주의 흐름</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7 }}>
                  {(dailyResult?.badtime || parsedDaily.badtime)?.symptom || '오늘은 예민한 흐름이 살짝 감지돼요.'}
                </div>
              </div>
            )}

            {/* ④ TODAY READING — 점수 이유를 설명하는 장문 */}
            {dailyLongReading.length > 0 && (
              <section id="today-long-reading" className="today-long-reading" aria-label="오늘 하루 장문 해석">
                <div className="today-long-reading__kicker">TODAY READING</div>
                <div className="today-long-reading__title">오늘의 사주와 별자리 흐름</div>
                {today?.ilchin?.gan && saju?.ilgan && (
                  <DailyElementMeet myGan={saju.ilgan} todayGan={today.ilchin.gan} />
                )}
                <div className="today-long-reading__body">
                  {dailyLongReading.map((section) => (
                    <article key={section.title} className="today-long-reading__section">
                      <div className="today-long-reading__section-title">{section.title}</div>
                      {section.title === '오늘의 점성술 흐름' && (sun || moon || asc) && (
                        <AstroSignViz sun={sun} moon={moon} asc={asc} />
                      )}
                      <p className="today-long-reading__text">{renderBoldText(section.body)}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* ⑤ OVERALL GUIDE — 장문 직후: "그래서 오늘 뭐해?" */}
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 10 }}>OVERALL GUIDE</div>
              <div style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 12, padding: '11px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>DO</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>{overallGuide.do}</div>
              </div>
              <div style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 12, padding: '11px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, marginBottom: 4 }}>주의</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>{overallGuide.caution}</div>
              </div>
            </div>

            {/* ⑥ 레이더 차트 + AXIS FORTUNES — 묶어서 한 흐름 */}
            <DailyRadarChart scores={actionableScores} />

            <section id="today-axis-section" className="today-axis-section">
              <div className="today-axis-section__header">
                <div>
                  <div className="today-axis-section__kicker">AXIS FORTUNES</div>
                  <div className="today-axis-section__copy">
                    오늘 강하게 올라오는 축과 조심히 다뤄야 할 축을 한눈에 정리했어요.
                  </div>
                </div>
              </div>
              <div className="today-axis-list">
                {axisCards.map((axis) => (
                  <article
                    key={axis.key}
                    className={`today-axis-card today-axis-card--${axis.status.tone}`}
                    style={{ '--axis-accent': axis.toneMeta.accent, '--axis-soft': axis.toneMeta.soft, '--axis-glow': axis.toneMeta.glow, cursor: onQuickChat ? 'pointer' : undefined }}
                    onClick={onQuickChat ? () => onQuickChat(`오늘 내 ${axis.fullLabel}에 대해 더 자세히 알려줘. ${axis.total}점이 나왔는데 이 흐름에서 어떻게 움직이면 좋을지 구체적으로 알려줘.`) : undefined}
                    role={onQuickChat ? 'button' : undefined}
                    tabIndex={onQuickChat ? 0 : undefined}
                    onKeyDown={onQuickChat ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } } : undefined}
                  >
                    <div className="today-axis-card__inner">
                      <div className="today-axis-card__header">
                        <div className="today-axis-card__lead">
                          <div className="today-axis-card__rank">#{axis.rank}</div>
                          <div className="today-axis-card__icon" aria-hidden="true">{ASPECT_META[axis.key]?.emoji || '✨'}</div>
                          <div className="today-axis-card__title-wrap">
                            <div className="today-axis-card__title-row">
                              <div className="today-axis-card__title">{axis.fullLabel}</div>
                              <span className="today-axis-card__badge">{axis.status.badge}</span>
                            </div>
                            <div className="today-axis-card__meta">오늘 흐름 {axis.total}점</div>
                          </div>
                        </div>
                        <div className="today-axis-card__score-wrap">
                          <div className="today-axis-card__score">{axis.total}점</div>
                        </div>
                      </div>
                      <div className="today-axis-card__meter">
                        <div className="today-axis-card__meter-base" style={{ width: `${axis.baseFillWidth}%` }} />
                      </div>
                      <div className="today-axis-card__score-caption">{axis.status.caption}</div>
                      <div className="today-axis-card__headline">{axis.headline}</div>
                      <div className="today-axis-card__chips">
                        {axis.key === byeolsoomPick?.careKey && (
                          <span className="today-axis-card__meta-chip today-axis-card__meta-chip--accent">오늘 받쳐줄 축</span>
                        )}
                        {axis.key === byeolsoomPick?.focusKey && axis.key !== byeolsoomPick?.careKey && (
                          <span className="today-axis-card__meta-chip today-axis-card__meta-chip--accent">오늘 밀어줄 축</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ⑦ BYEOLSOOM PICK (today-pick-shell만 — 중복이었던 time-slot-card 제거) */}
            <section id="today-pick-shell" className="today-pick-shell">
              <div className="today-pick-hero">
                <div>
                  <div className="today-pick-kicker">BYEOLSOOM PICK</div>
                  <div className="today-pick-title">{byeolsoomPick?.blendTitle || '오늘의 별숨픽'}</div>
                  <div className="today-pick-subtitle">
                    {byeolsoomPick?.summary || '오늘 흐름을 밀고 눌러줄 조합을 골랐어요.'}
                  </div>
                </div>
                <div className="today-pick-badges">
                  {byeolsoomPick?.badge && <span className="today-pick-badge today-pick-badge--primary">{byeolsoomPick.badge}</span>}
                  {byeolsoomPick?.strategyLabel && <span className="today-pick-badge">{byeolsoomPick.strategyLabel}</span>}
                  {byeolsoomPick?.scoreSpread > 0 && <span className="today-pick-badge">격차 {byeolsoomPick.scoreSpread}점</span>}
                </div>
              </div>
              <div className="today-pick-pivot">
                {byeolsoomPick?.focusLabel && (
                  <div className="today-pick-pivot__card">
                    <div className="today-pick-pivot__label">밀어줄 축</div>
                    <div className="today-pick-pivot__value">{byeolsoomPick.focusLabel}</div>
                  </div>
                )}
                {byeolsoomPick?.careLabel && (
                  <div className="today-pick-pivot__card">
                    <div className="today-pick-pivot__label">받쳐줄 축</div>
                    <div className="today-pick-pivot__value">{byeolsoomPick.careLabel}</div>
                  </div>
                )}
              </div>
              <div className="today-pick-reason today-pick-reason--top">
                <div className="today-pick-reason__title">✦ 왜 이렇게 골랐냐면</div>
                <div className="today-pick-reason__body">
                  {byeolsoomPick?.reason || byeolsoomPick?.aiHint || '오늘 점수 흐름에 맞춰 강한 축은 밀고 약한 축은 받치는 방식으로 조합했어요.'}
                </div>
              </div>
              <div className="today-pick-grid">
                {PICK_FIELD_META.map((field) => (
                  <PickField
                    key={field.key}
                    label={field.label}
                    value={byeolsoomPick?.[field.key]}
                    icon={field.icon}
                    tone={field.tone}
                    onClick={onQuickChat && byeolsoomPick?.[field.key]
                      ? () => onQuickChat(`오늘 별숨픽 ${field.label} "${byeolsoomPick[field.key]}"을 어떻게 활용하면 좋을까? 내 오늘 운세 흐름에 맞춰 구체적으로 알려줘.`)
                      : undefined}
                  />
                ))}
              </div>
            </section>

            {/* ⑧ 주간 트렌드 — 부록 */}
            <WeeklyTrendChart kakaoId={kakaoId} todayScore={dailyResult ? normalizedTodayScore : null} />

            {/* ⑨ 다시 물어보기 — 맨 아래 CTA */}
            {onRefresh && (
              <section className="today-reask-card" aria-label="오늘 운세 다시 물어보기">
                <div>
                  <div className="today-reask-card__title">오늘 운세 다시 물어보기</div>
                  <div className="today-reask-card__desc">
                    같은 생년월일로 오늘의 별숨을 새롭게 풀이해요. 10BP가 소모됩니다.
                  </div>
                </div>
                <button
                  type="button"
                  className="today-reask-card__button"
                  onClick={handleReaskDaily}
                  disabled={dailyLoading || dailyCount >= DAILY_MAX}
                >
                  {dailyLoading ? '다시 읽는 중...' : '다시 물어보기 · 10BP'}
                </button>
              </section>
            )}

          </Suspense>
        ) : (
          <div className="today-detail-empty">
            <div className="today-detail-empty-icon" style={{ fontSize: '2rem', color: 'var(--t4)', marginBottom: 8 }}>☆</div>
            <div className="today-detail-empty-text">
              운세를 불러오지 못했어요.<br />
              <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>아래 버튼으로 다시 시도해 주세요.</span>
            </div>
            {onRefresh && (
              <button className="today-intro-btn-primary" style={{ marginTop: 8, width: 'auto', padding: '12px 28px' }} onClick={() => onRefresh({ skipBpCharge: true, skipConfirm: true, saveHistory: false, incrementCount: false })} disabled={dailyLoading}>
                다시 불러오기
              </button>
            )}
          </div>
        )}
      </div>

      <div className="today-detail-footer">
        <button className="today-detail-btn-home" onClick={() => setStep(STEP.HOME)}>홈으로</button>
        <button
          className="today-detail-btn-home"
          onClick={() => setStep(STEP.GACHA)}
          style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', color: 'var(--gold)', marginLeft: 8 }}
        >
          별숨 뽑기
        </button>
      </div>
    </div>
  );
}
