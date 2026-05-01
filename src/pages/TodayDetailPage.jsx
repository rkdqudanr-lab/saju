import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseDailyLines } from '../utils/parseDailyLines.js';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { STEP } from '../utils/steps.js';
import { canUseDailySupabaseTables, getDailyDateKey, readDailyLocalCache, writeDailyLocalCache } from '../lib/dailyDataAccess.js';
import '../styles/TodayDetailPage.css';

import DailyRadarChart from '../features/today/DailyRadarChart.jsx';
import WeeklyTrendChart from '../features/today/WeeklyTrendChart.jsx';
import GoldenParticles from '../features/today/GoldenParticles.jsx';
import { ACTIONABLE_AXIS_KEYS, ASPECT_META, getAverageFortuneScore, getDailyAxisScores } from '../features/today/getDailyAxisScores.js';
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

/** 조디악 기호 제거 + 핵심 구문 자동 굵게 처리 → React 노드 배열 반환 */
function renderBoldText(text) {
  if (!text) return null;

  // 1. 조디악 / 별자리 유니코드 기호 제거
  let t = text
    .replace(/[♈♉♊♋♌♍♎♏♐♑♒♓]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // 2. 핵심 구문 ** 마킹
  // ~ㄹ/~을 수 있어요 (가능성 서술)
  t = t.replace(/([^.。,，]*?[가-힣]{1,}[질을]?\s*수\s+있어요)/g, m => `**${m.trim()}**`);
  // 축 특성: "X 쪽은 비교적/빠르게 Y하고/Y하며"
  t = t.replace(/([가-힣]{1,6}\s*쪽은\s*[가-힣\s]{3,25}(?:하고|하며|반응하고|올라오고|작동하고|나타나고))/g, m => `**${m.trim()}**`);
  // 행동 명사구: "~기" 앞에 4자 이상 명사구 + 쪽으로/으로
  t = t.replace(/([가-힣\s]{4,25}기)(?=\s*(?:쪽으로|으로|를|이\s|가\s))/g, m => `**${m.trim()}**`);

  // 3. ** ** → <strong> 변환
  return t.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
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
  if (!canUseDailySupabaseTables()) {
    try {
      return JSON.parse(readDailyLocalCache(String(kakaoId), cacheType, getDailyDateKey()) || '{}');
    } catch {
      return {};
    }
  }

  try {
    const client = getAuthenticatedClient(String(kakaoId));
    const { data } = await client
      ?.from('daily_cache')
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
  if (!canUseDailySupabaseTables()) return;
  const client = getAuthenticatedClient(String(kakaoId));
  await Promise.all([
    client?.from('daily_cache').upsert(
      { kakao_id: String(kakaoId), cache_date: getDailyDateKey(), cache_type: 'horoscope_score', content },
      { onConflict: 'kakao_id,cache_date,cache_type' },
    ),
    client?.from('daily_scores').upsert(
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

function buildDailyLongReading({ parsedDaily, axisScores, overallGuide, saju, sun, moon, asc }) {
  const eastern = parsedDaily?.easternKi || {};
  const western = parsedDaily?.westernSky || {};
  const sortedAxes = [...(axisScores || [])].sort((a, b) => (b.total || 0) - (a.total || 0));
  const strongest = sortedAxes[0];
  const care = [...(axisScores || [])].sort((a, b) => (a.total || 0) - (b.total || 0))[0];
  const strongestLabel = strongest?.fullLabel || strongest?.label || '강하게 올라오는 운';
  const careLabel = care?.fullLabel || care?.label || '살짝 돌봐야 할 운';
  const sunLabel = sun ? `${sun.s || ''} ${sun.n || ''}`.trim() : '';
  const moonLabel = moon ? `${moon.s || ''} ${moon.n || ''}`.trim() : '';
  const ascLabel = asc ? `${asc.s || ''} ${asc.n || ''}`.trim() : '';
  const sajuLabel = saju?.dom ? `${saju.dom} 기운` : '';

  const easternBase = compactText(eastern.kiun || eastern.sinshin);
  const westernBase = compactText(western.flow || western.planet);
  const doAction = compactText(eastern.doAction || overallGuide?.do);
  const dontAction = compactText(eastern.dontAction || overallGuide?.caution);
  const strongDesc = compactText(strongest?.headline || parsedDaily?.categories?.[strongest?.key]?.desc);
  const careDesc = compactText(care?.headline || parsedDaily?.categories?.[care?.key]?.desc);

  return [
    {
      title: '오늘의 사주 기운',
      body: easternBase
        ? `동양의 흐름으로 보면 오늘은 ${easternBase}이 중심에 서는 날이에요. ${sajuLabel ? `타고난 ${sajuLabel}과 만나면서 ` : ''}${strongestLabel} 쪽은 비교적 빠르게 반응하고, ${careLabel} 쪽은 무리해서 밀어붙이기보다 리듬을 살피는 편이 좋아요. ${doAction ? `오늘은 ${doAction} 쪽으로 움직일수록 길이 열립니다.` : ''}`
        : `오늘은 사주 흐름에서 ${strongestLabel}이 먼저 살아나는 날이에요. 반대로 ${careLabel}은 작은 말투나 컨디션 변화에도 흔들릴 수 있으니, 큰 결정보다는 흐름을 정돈하는 데 힘을 두면 좋아요.`,
    },
    {
      title: '오늘의 점성술 흐름',
      body: westernBase
        ? `서양 점성술로는 ${westernBase}의 흐름이 깔려 있어요. ${sunLabel ? `기본 성향인 ${sunLabel}` : '타고난 별자리 성향'}${moonLabel ? `, 감정 리듬인 ${moonLabel}` : ''}${ascLabel ? `, 바깥에 드러나는 ${ascLabel}` : ''}이 서로 맞물리며 오늘의 반응 속도를 만듭니다. ${strongDesc || '그래서 오늘은 익숙한 방식만 고집하기보다, 들어오는 신호를 조금 더 섬세하게 읽는 편이 유리해요.'}`
        : `별자리 흐름에서는 감정과 판단의 속도가 평소보다 또렷하게 갈릴 수 있어요. ${sunLabel ? `${sunLabel}의 기본 기질은 ` : ''}오늘 필요한 선택을 밀어주지만, ${careLabel}에서는 상대의 반응을 한 번 더 확인하는 태도가 중요합니다.`,
    },
    {
      title: '그래서 오늘은',
      body: `${overallGuide?.summary || '오늘은 무리하게 판을 키우기보다, 잘 되는 흐름을 붙잡고 예민한 부분을 천천히 정리하는 날이에요.'} ${careDesc ? `${careLabel}에서는 ${careDesc}` : `${careLabel}에서는 서두르기보다 한 박자 늦춰 보는 게 좋습니다.`} ${dontAction ? `다만 ${dontAction} 흐름은 피하면 좋아요.` : ''}`,
    },
  ].filter((section) => compactText(section.body));
}

function PickField({ label, value, icon, tone }) {
  if (!value) return null;
  const { primary, description } = splitPickValue(value);
  return (
    <div className={`today-pick-field today-pick-field--${tone}`}>
      <div className="today-pick-field__top">
        <span className="today-pick-field__icon" aria-hidden="true">{icon}</span>
        <span className="today-pick-field__label">{label}</span>
      </div>
      <div className="today-pick-field__value">{primary}</div>
      {description && <div className="today-pick-field__desc">{description}</div>}
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
    () => getDailyAxisScores(dailyResult?.score || 0, {}, parsedDaily.categories),
    [dailyResult?.score, parsedDaily.categories],
  );

  const actionableScores = useMemo(
    () => axisScores.filter((score) => ACTIONABLE_AXIS_KEYS.includes(score.key)),
    [axisScores],
  );

  const todayScore = useMemo(
    () => getAverageFortuneScore(axisScores),
    [axisScores],
  );

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
    () => buildDailyLongReading({ parsedDaily, axisScores: actionableScores, overallGuide, saju, sun, moon, asc }),
    [parsedDaily, actionableScores, overallGuide, saju, sun, moon, asc],
  );

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

  useEffect(() => {
    if (!dailyResult || !kakaoId || !Number.isFinite(todayScore)) return;
    saveTodayScore(kakaoId, todayScore).catch(() => {});
  }, [dailyResult, kakaoId, todayScore]);

  useEffect(() => {
    if (todayScore >= 100 && prevTodayScoreRef.current < 100) {
      setShowParticles(true);
    }
    prevTodayScoreRef.current = todayScore;
  }, [todayScore]);

  const handleShareDaily = useCallback(async () => {
    if (!dailyResult) return;
    const dateStr = today ? `${today.month}월 ${today.day}일` : '';
    const text = `✦ 오늘의 별숨${dateStr ? ` · ${dateStr}` : ''}\n${overallGuide.summary}\n\n별숨점수 ${todayScore}점\n\n— 별숨 앱`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '별숨 ✦', text });
      } catch {}
    } else {
      await navigator.clipboard?.writeText(text);
      showToast?.('클립보드에 복사됐어요', 'success');
    }
  }, [dailyResult, overallGuide.summary, showToast, today, todayScore]);

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
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 18, marginBottom: 16, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>TODAY SCORE</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--t1)', lineHeight: 1 }}>{todayScore}점</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 6 }}>
                  세부 운세 {actionableScores.length}개 평균으로 계산되는 오늘의 총점이에요.
                </div>
              </div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7 }}>{overallGuide.summary}</div>
            </div>

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

            {dailyLongReading.length > 0 && (
              <section id="today-long-reading" className="today-long-reading" aria-label="오늘 하루 장문 해석">
                <div className="today-long-reading__kicker">TODAY READING</div>
                <div className="today-long-reading__title">오늘의 사주와 별자리 흐름</div>
                <div className="today-long-reading__body">
                  {dailyLongReading.map((section) => (
                    <article key={section.title} className="today-long-reading__section">
                      <div className="today-long-reading__section-title">{section.title}</div>
                      <p className="today-long-reading__text">{renderBoldText(section.body)}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <DailyRadarChart scores={actionableScores} />

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
                    style={{
                      '--axis-accent': axis.toneMeta.accent,
                      '--axis-soft': axis.toneMeta.soft,
                      '--axis-glow': axis.toneMeta.glow,
                    }}
                  >
                    <div className="today-axis-card__inner">
                      <div className="today-axis-card__header">
                        <div className="today-axis-card__lead">
                          <div className="today-axis-card__rank">#{axis.rank}</div>
                          <div className="today-axis-card__icon" aria-hidden="true">
                            {ASPECT_META[axis.key]?.emoji || '✨'}
                          </div>
                          <div className="today-axis-card__title-wrap">
                            <div className="today-axis-card__title-row">
                              <div className="today-axis-card__title">{axis.fullLabel}</div>
                              <span className="today-axis-card__badge">{axis.status.badge}</span>
                            </div>
                            <div className="today-axis-card__meta">
                              오늘 흐름 {axis.total}점
                            </div>
                          </div>
                        </div>

                        <div className="today-axis-card__score-wrap">
                          <div className="today-axis-card__score">{axis.total}점</div>
                          <div className="today-axis-card__score-caption">{axis.status.caption}</div>
                        </div>
                      </div>

                      <div className="today-axis-card__meter">
                        <div className="today-axis-card__meter-base" style={{ width: `${axis.baseFillWidth}%` }} />
                      </div>

                      <div className="today-axis-card__headline">{axis.headline}</div>

                      <div className="today-axis-card__chips">
                        {axis.key === byeolsoomPick?.careKey && (
                          <span className="today-axis-card__meta-chip today-axis-card__meta-chip--accent">
                            오늘 받쳐줄 축
                          </span>
                        )}
                        {axis.key === byeolsoomPick?.focusKey && axis.key !== byeolsoomPick?.careKey && (
                          <span className="today-axis-card__meta-chip today-axis-card__meta-chip--accent">
                            오늘 밀어줄 축
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

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

              {/* 왜 이렇게 골랐는지 — 픽 그리드 위에 바로 표시 */}
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
                  />
                ))}
              </div>
            </section>

            <WeeklyTrendChart kakaoId={kakaoId} todayScore={dailyResult ? todayScore : null} />

            {(dailyResult?.badtime || parsedDaily.badtime) && (
              <div style={{ background: 'rgba(201,160,220,0.08)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid rgba(201,160,220,0.18)' }}>
                <div style={{ fontSize: 10, color: '#c9a0dc', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>주의 흐름</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7 }}>
                  {(dailyResult?.badtime || parsedDaily.badtime)?.symptom || '오늘은 예민한 흐름이 살짝 감지돼요.'}
                </div>
              </div>
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
