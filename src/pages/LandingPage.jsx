import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import {
  canUseDailySupabaseTables,
  readDailyLocalCacheMap,
  getDailyDateKey,
  readDailyLocalCache,
  writeDailyLocalCache,
} from '../lib/dailyDataAccess.js';
import { getDailyWord, REVIEWS } from '../utils/constants.js';
import { STEP } from '../utils/steps.js';
import { useUserCtx, useSajuCtx, useGamCtx } from '../context/AppContext.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { parseDailyLines } from '../utils/parseDailyLines.js';
import {
  ACTIONABLE_AXIS_KEYS,
  getAverageFortuneScore,
  getDailyAxisScores,
  TODAY_AXIS_CACHE,
} from '../features/today/getDailyAxisScores.js';
import { TODAY_AXIS_TEXT_CACHE } from '../features/today/fortuneAxisTools.js';
import SamplePreview from '../components/SamplePreview.jsx';
import ReflectionPopup from '../components/ReflectionPopup.jsx';

import LandingHeader from '../components/landing/LandingHeader.jsx';
import DailyMiniCard from '../components/landing/DailyMiniCard.jsx';
import AlertCarousel from '../components/landing/AlertCarousel.jsx';
import QuickActionGrid from '../components/landing/QuickActionGrid.jsx';
import WeeklyScoreSummary from '../components/landing/WeeklyScoreSummary.jsx';
import LevelCard from '../components/landing/LevelCard.jsx';

// 시간대 판별: 17시 이후 or 6시 이전이면 '밤' 모드
function isNightMode() {
  const h = new Date().getHours();
  return h >= 17 || h < 6;
}

// 절기 근사 날짜 (실제와 ±2일 이내)
const JEOLGI_APPROX = [
  { month: 2,  day: 4,  name: '입춘', meaning: '봄의 기운이 시작돼요' },
  { month: 3,  day: 6,  name: '경칩', meaning: '봄기운에 만물이 깨어나요' },
  { month: 4,  day: 5,  name: '청명', meaning: '하늘이 맑고 밝아지는 날이에요' },
  { month: 5,  day: 6,  name: '입하', meaning: '여름의 기운이 시작돼요' },
  { month: 6,  day: 6,  name: '망종', meaning: '씨앗을 뿌리기 좋은 때예요' },
  { month: 7,  day: 7,  name: '소서', meaning: '작은 더위가 찾아왔어요' },
  { month: 8,  day: 7,  name: '입추', meaning: '가을의 기운이 시작돼요' },
  { month: 9,  day: 8,  name: '백로', meaning: '이슬이 맺히는 서늘한 때예요' },
  { month: 10, day: 8,  name: '한로', meaning: '찬 이슬이 내리는 시기예요' },
  { month: 11, day: 7,  name: '입동', meaning: '겨울의 기운이 시작돼요' },
  { month: 12, day: 7,  name: '대설', meaning: '큰 눈이 내리는 때예요' },
  { month: 1,  day: 6,  name: '소한', meaning: '작은 추위가 찾아왔어요' },
];

function getNearbyJeolgi() {
  const now = new Date();
  const y = now.getFullYear();
  for (const jg of JEOLGI_APPROX) {
    const jgDate = new Date(y, jg.month - 1, jg.day);
    const diffDays = Math.round((jgDate - now) / 86400000);
    if (diffDays >= -1 && diffDays <= 3) return { ...jg, diffDays };
  }
  return null;
}

function getBdayDday(bm, bd) {
  if (!bm || !bd) return null;
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), parseInt(bm) - 1, parseInt(bd));
  thisYear.setHours(0, 0, 0, 0);
  const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
  const next = thisYear >= today0
    ? thisYear
    : new Date(now.getFullYear() + 1, parseInt(bm) - 1, parseInt(bd));
  return Math.round((next - today0) / 86400000);
}

export default function LandingPage({
  otherProfiles,
  dailyResult,
  dailyLoading,
  askDailyHoroscope,
  onFreeRecharge,
  freeRechargeAvailable = true,
  onEarnBP,
  hasDiaryToday = false,
  setEditingMyProfile,
  setShowProfileModal,
}) {
  const setStep = useAppStore((s) => s.setStep);
  const setEquippedTheme = useAppStore((s) => s.setEquippedTheme);
  const setEquippedAvatar = useAppStore((s) => s.setEquippedAvatar);

  const { user, form, kakaoLogin, kakaoLogout } = useUserCtx();
  const { saju, today, isApproximate } = useSajuCtx();
  const { gamificationState = { currentBp: 0, guardianLevel: 1, loginStreak: 0 }, missions = [] } = useGamCtx();

  const nightMode = isNightMode();
  const nearbyJeolgi = getNearbyJeolgi();

  // ── 데이터 페칭 상태 ──
  const [boostMap, setBoostMap] = useState(() => {
    const uid = user?.kakaoId || user?.id;
    if (!uid) return {};
    try {
      const raw = readDailyLocalCache(String(uid), TODAY_AXIS_CACHE, getDailyDateKey());
      const parsed = JSON.parse(raw || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch { return {}; }
  });
  const [axisTextOverrides, setAxisTextOverrides] = useState({});
  const [scoreHistory, setScoreHistory] = useState([]);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  // ── 운세 점수 계산 ──
  const baseScore = dailyResult?.score ?? 0;
  const parsedDaily = useMemo(
    () => parseDailyLines(dailyResult?.text || ''),
    [dailyResult?.text],
  );
  const axisScores = useMemo(
    () => getDailyAxisScores(baseScore, boostMap, parsedDaily.categories),
    [baseScore, boostMap, parsedDaily.categories],
  );
  const todayScore = useMemo(() => getAverageFortuneScore(axisScores), [axisScores]);
  const actionableScores = useMemo(
    () => axisScores.filter((s) => ACTIONABLE_AXIS_KEYS.includes(s.key)),
    [axisScores],
  );
  const scoreBoostDelta = useMemo(() => {
    const orig = parsedDaily.score ?? dailyResult?.score ?? 0;
    return todayScore && orig ? todayScore - orig : 0;
  }, [dailyResult?.score, parsedDaily.score, todayScore]);

  // ── useEffect: equipped items ──
  useEffect(() => {
    if (!user) return;
    const kakaoId = String(user.kakaoId || user.id);
    const client = getAuthenticatedClient(kakaoId);
    if (!client) return;
    client.from('user_shop_inventory')
      .select('item_id, is_equipped')
      .eq('kakao_id', kakaoId)
      .eq('is_equipped', true)
      .then(async ({ data }) => {
        const { findShopItem } = await import('../utils/shopGachaItems.js');
        const { data: allShopItems } = await client.from('shop_items').select('*');
        const shopItemsMap = new Map((allShopItems || []).map((i) => [i.id, i]));
        const equipped = (data || []).map((r) => {
          const matched = shopItemsMap.get(r.item_id) || findShopItem(r.item_id);
          return matched ? { ...matched, is_equipped: r.is_equipped } : null;
        }).filter(Boolean);
        setEquippedTheme(equipped.find((r) => r.category === 'theme') || null);
        setEquippedAvatar(equipped.find((r) => r.category === 'avatar') || null);
      });
  }, [user?.id, setEquippedTheme, setEquippedAvatar]);

  // ── useEffect: 7일 점수 히스토리 ──
  useEffect(() => {
    if (!user) { setScoreHistory([]); return; }
    const kakaoId = String(user.kakaoId || user.id);
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return getDailyDateKey(d);
    });
    if (!canUseDailySupabaseTables()) {
      const map = readDailyLocalCacheMap(kakaoId, 'horoscope_score', last7);
      setScoreHistory(last7.reverse().map((date) => ({ date, score: map[date] == null ? null : Number(map[date]) })));
      return;
    }
    getAuthenticatedClient(kakaoId)
      ?.from('daily_scores')
      .select('score_date, score')
      .eq('kakao_id', kakaoId)
      .in('score_date', last7)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((r) => { map[r.score_date] = Number(r.score); });
        setScoreHistory(last7.reverse().map((date) => ({ date, score: map[date] ?? null })));
      })
      .catch(() => {});
  }, [user?.id]);

  // ── useEffect: boostMap ──
  useEffect(() => {
    if (!user || !dailyResult) return;
    const kakaoId = String(user.kakaoId || user.id);
    if (!canUseDailySupabaseTables()) {
      try {
        const parsed = JSON.parse(readDailyLocalCache(kakaoId, TODAY_AXIS_CACHE, getDailyDateKey()) || '{}');
        setBoostMap(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
      } catch { setBoostMap({}); }
      return;
    }
    getAuthenticatedClient(kakaoId)
      ?.from('daily_cache')
      .select('content')
      .eq('kakao_id', kakaoId)
      .eq('cache_date', getDailyDateKey())
      .eq('cache_type', TODAY_AXIS_CACHE)
      .maybeSingle()
      .then(({ data }) => {
        try {
          const parsed = JSON.parse(data?.content || '{}');
          setBoostMap(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
        } catch { setBoostMap({}); }
      })
      .catch(() => setBoostMap({}));
  }, [user?.id, dailyResult?.score]);

  // ── useEffect: axisTextOverrides ──
  useEffect(() => {
    if (!user || !dailyResult) return;
    const kakaoId = String(user.kakaoId || user.id);
    if (!canUseDailySupabaseTables()) {
      try {
        const parsed = JSON.parse(readDailyLocalCache(kakaoId, TODAY_AXIS_TEXT_CACHE, getDailyDateKey()) || '{}');
        setAxisTextOverrides(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
      } catch { setAxisTextOverrides({}); }
      return;
    }
    getAuthenticatedClient(kakaoId)
      ?.from('daily_cache')
      .select('content')
      .eq('kakao_id', kakaoId)
      .eq('cache_date', getDailyDateKey())
      .eq('cache_type', TODAY_AXIS_TEXT_CACHE)
      .maybeSingle()
      .then(({ data }) => {
        try {
          const parsed = JSON.parse(data?.content || '{}');
          setAxisTextOverrides(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
        } catch { setAxisTextOverrides({}); }
      })
      .catch(() => setAxisTextOverrides({}));
  }, [user?.id, dailyResult?.score]);

  // ── useEffect: 오늘 점수 히스토리 즉시 반영 ──
  useEffect(() => {
    if (!todayScore) return;
    const todayKey = getDailyDateKey();
    setScoreHistory((prev) =>
      prev.length
        ? prev.map((item) => item.date === todayKey ? { ...item, score: todayScore } : item)
        : prev,
    );
  }, [todayScore]);

  // ── useEffect: streak 팝업 ──
  useEffect(() => {
    if (!user || !gamificationState.loginStreak) return;
    const key = `streak_popup_${getDailyDateKey()}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => {
      setShowStreakPopup(true);
      localStorage.setItem(key, '1');
    }, 800);
    return () => clearTimeout(t);
  }, [user?.id, gamificationState.loginStreak]);

  // ── useEffect: reflection 팝업 ──
  const yesterdayKey = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return getDailyDateKey(d);
  }, []);
  const yesterdayEntry = useMemo(
    () => scoreHistory.find((s) => s.date === yesterdayKey),
    [scoreHistory, yesterdayKey],
  );
  useEffect(() => {
    if (!user || !scoreHistory.length) return;
    const entry = scoreHistory.find((s) => s.date === yesterdayKey);
    if (!entry?.score) return;
    const kakaoId = String(user.kakaoId || user.id);
    if (readDailyLocalCache(kakaoId, 'reflection_feedback', yesterdayKey)) return;
    const t = setTimeout(() => setShowReflection(true), 2000);
    return () => clearTimeout(t);
  }, [user?.id, scoreHistory, yesterdayKey]);

  const handleReflectionAnswer = useCallback(async (answer) => {
    setShowReflection(false);
    if (!user || answer === 'skip') return;
    const kakaoId = String(user.kakaoId || user.id);
    writeDailyLocalCache(kakaoId, 'reflection_feedback', answer, yesterdayKey);
    if (canUseDailySupabaseTables()) {
      getAuthenticatedClient(kakaoId)?.from('daily_cache').upsert(
        { kakao_id: kakaoId, cache_date: yesterdayKey, cache_type: 'reflection_feedback', content: answer },
        { onConflict: 'kakao_id,cache_date,cache_type' },
      );
    }
    if (answer === 'match') await onEarnBP?.(2, 'reflection_correct');
  }, [user, onEarnBP, yesterdayKey]);

  // ── 미션 진행률 ──
  const completedMissions = missions.filter((m) => m.is_completed).length;
  const totalMissions = missions.length;
  const remainingMissions = totalMissions - completedMissions;

  // ── 생일 D-Day ──
  const upcomingBirthdays = useMemo(() => {
    const all = [
      { label: form?.nickname || form?.name || '나', bm: form?.bm, bd: form?.bd },
      ...(otherProfiles || []).map((p) => ({ label: p.name || '이름없음', bm: p.bm, bd: p.bd })),
    ];
    return all
      .map((p) => ({ label: p.label, dday: getBdayDday(p.bm, p.bd) }))
      .filter((c) => c.dday !== null && c.dday <= 30)
      .sort((a, b) => a.dday - b.dday);
  }, [form?.bm, form?.bd, form?.nickname, form?.name, otherProfiles]);

  // ── 타일 정의 ──
  const primaryTiles = useMemo(() => [
    {
      icon: '✅',
      title: '오늘 미션',
      sub: totalMissions === 0
        ? '오늘 별숨을 확인하면 미션이 나타나요'
        : remainingMissions > 0
          ? `✦ ${remainingMissions}개 남았어요`
          : '오늘 미션 완료! ✦',
      onClick: () => setStep(STEP.MISSIONS),
      progressFill: totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0,
      accent: totalMissions > 0 && remainingMissions === 0,
      ariaLabel: `오늘 미션, ${completedMissions}/${totalMissions} 완료`,
    },
    {
      icon: '📓',
      title: '나의 하루',
      sub: hasDiaryToday ? '오늘 하루를 들려줬어요 ✦' : '별숨에게 오늘을 들려주세요',
      onClick: () => setStep(STEP.DIARY),
      accent: hasDiaryToday,
    },
    {
      icon: '💬',
      title: '별숨에게 질문하기',
      sub: '무엇이든 물어보세요',
      onClick: () => setStep(STEP.QUESTION),
    },
    {
      icon: '📅',
      title: '별숨 달력',
      sub: '운세 기록 한눈에 보기',
      onClick: () => setStep(STEP.CALENDAR),
    },
  ], [totalMissions, completedMissions, remainingMissions, hasDiaryToday, setStep]);

  const secondaryTiles = useMemo(() => [
    { icon: '⭐', title: '나의 별숨', sub: '사주·천체 종합 분석', onClick: () => setStep(STEP.NATAL) },
    { icon: '📊', title: '별숨 통계', sub: '지난 운세 흐름 보기', onClick: () => setStep(STEP.STATS) },
    { icon: '🛍', title: '별숨샵', sub: '오브제 & 뽑기', onClick: () => setStep(STEP.SHOP) },
    { icon: '📖', title: '별숨 도감', sub: '컬렉션 완성 도전', onClick: () => setStep(STEP.BYEOLSOOM_SPACE) },
  ], [setStep]);

  // ── 비로그인 화면 ──
  if (!user) {
    return (
      <div className="page step-fade">
        <div className="land-hero">
          <div className="land-wordmark">byeolsoom</div>
          <div className="land-orb">
            <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
          </div>
          <p className="land-copy" style={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
            당신의 별숨은 당신을 바라보고 있어요.
          </p>
          <p className="land-beta-notice">
            지금 별숨은 베타 테스트 중으로, 무료로 이용할 수 있어요.
          </p>
          <div className="land-login-section">
            <div className="land-login-card" style={{ padding: '24px 20px', gap: '16px' }}>
              <p style={{ fontSize: 'var(--sm)', color: 'var(--t2)', textAlign: 'center', lineHeight: 1.8, margin: 0 }}>
                사주와 별자리, 두 개의 언어로<br />지금의 당신을 읽어드려요
              </p>
              <button
                className="kakao-login-full"
                onClick={() => {
                  if (typeof window.gtag === 'function') window.gtag('event', 'kakao_login_click');
                  kakaoLogin();
                }}
                style={{ fontSize: '1rem', padding: '16px' }}
              >
                <span className="kakao-icon-wrap">
                  <svg width="18" height="17" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38c0 2.1 1.38 3.93 3.45 4.98L4.2 15l3.54-2.34c.39.06.81.09 1.26.09 4.14 0 7.5-2.64 7.5-5.88S13.14 1.5 9 1.5z" fill="#191919" />
                  </svg>
                </span>
                카카오로 3초 만에 시작하기
              </button>
              <button className="land-ghost-link" onClick={() => setStep(STEP.PROFILE)}>
                로그인 없이 먼저 체험하기 →
              </button>
            </div>
          </div>
          <div className="land-scroll-hint"><span>↓</span></div>
        </div>
        <div className="inner land-scroll-zone">
          <SamplePreview />
          <div className="daily-word">
            <div className="daily-label">✦ {today?.month}월 {today?.day}일의 별 메시지</div>
            <div className="daily-text">{'"' + getDailyWord(today?.day) + '"'}</div>
          </div>
          <div className="rev-wrap">
            <div className="rev-track">
              {REVIEWS.map((r, i) => (
                <div key={i} className="rev-card">
                  <div className="rev-stars">{r.star}</div>
                  <div className="rev-text">{'"' + r.text + '"'}</div>
                  <div className="rev-nick">{r.nick}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 프로필 미입력 화면 ──
  if (!form?.by) {
    return (
      <div className="page step-fade">
        <div className="land-hero">
          <div className="land-wordmark">byeolsoom</div>
          <div className="land-orb">
            <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
          </div>
          <p className="land-copy" style={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
            당신의 별숨은 당신을 바라보고 있어요.
          </p>
          <div className="land-login-section">
            <div className="land-login-card logged" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8 }}>
                생년월일을 입력하면<br />별숨이 당신을 제대로 읽어드릴 수 있어요
              </div>
              <button
                className="cta-main"
                style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px' }}
                onClick={() => setStep(STEP.PROFILE)}
              >
                지금 시작하기 ✦
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 로그인 + 프로필 완성 화면 (Toss 스타일) ──
  return (
    <div className="page step-fade" style={{ justifyContent: 'flex-start', paddingTop: 0 }}>
      <div className="land-home">

        {/* 1. 히어로: 오늘의 별숨 미니카드 */}
        <DailyMiniCard
          dailyResult={dailyResult}
          todayScore={todayScore}
          loading={dailyLoading}
          onAsk={askDailyHoroscope}
          onClick={() => setStep(STEP.TODAY_DETAIL)}
          boostCount={Object.keys(boostMap).length}
          scoreBoostDelta={scoreBoostDelta}
        />

        {/* 2. 별숨 레벨 카드 */}
        <LevelCard />

        {/* 3. 미니 헤더 */}
        <LandingHeader
          onEditProfile={() => { setEditingMyProfile(true); setStep(STEP.PROFILE); }}
          onLogout={kakaoLogout}
          bp={gamificationState.currentBp}
          freeRechargeAvailable={freeRechargeAvailable}
          onFreeRecharge={onFreeRecharge}
        />

        {/* 4. 알림 캐러셀 (절기/생일만) */}
        <AlertCarousel
          isApproximate={isApproximate}
          jeolgi={nearbyJeolgi}
          birthdays={upcomingBirthdays}
          onApproximate={() => setStep(STEP.PROFILE)}
        />

        {/* 4. 주요 기능 2×2 타일 */}
        <QuickActionGrid tiles={primaryTiles} />

        {/* 5. 7일 점수 요약 */}
        <WeeklyScoreSummary
          scoreHistory={scoreHistory}
          onClick={() => setStep(STEP.STATS)}
        />

        {/* 6. 보조 기능 2×2 타일 */}
        <QuickActionGrid tiles={secondaryTiles} />

        {/* 7. 오늘의 별 메시지 */}
        <div className="land-daily-msg">
          <div className="land-daily-msg-label">
            ✦ {today?.month}월 {today?.day}일의 별 메시지
          </div>
          <div className="land-daily-msg-text">
            "{getDailyWord(today?.day)}"
          </div>
        </div>

      </div>

      {/* ── 연속 출석 팝업 ── */}
      {showStreakPopup && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}
          onClick={() => setShowStreakPopup(false)}
        >
          <div
            style={{ background: 'var(--bg1)', border: '1px solid var(--acc)', borderRadius: 'var(--r2)', padding: '28px 24px', maxWidth: 320, width: '100%', textAlign: 'center', animation: 'fadeUp .3s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>🔥</div>
            <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>
              {gamificationState.loginStreak}일 연속 출석!
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7, marginBottom: 18 }}>
              {(() => {
                const s = gamificationState.loginStreak;
                const MILESTONE_MSG = { 3: '+30 BP', 7: '+100 BP', 14: '+100 BP', 21: '+100 BP', 30: '+300 BP' };
                if (MILESTONE_MSG[s]) return `✦ ${s}일 달성 보너스 ${MILESTONE_MSG[s]}을 받았어요!`;
                const next = [3, 7, 14, 21, 30].find((m) => m > s);
                return next
                  ? `앞으로 ${next - s}일 더 출석하면 ${MILESTONE_MSG[next]} 보너스를 받아요`
                  : `30일을 넘었어요! 전설의 별숨 수호자예요 🌟`;
              })()}
            </div>
            <button
              type="button"
              onClick={() => setShowStreakPopup(false)}
              style={{ width: '100%', padding: '12px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', fontFamily: 'var(--ff)', fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer' }}
            >
              오늘도 별숨 시작하기 ✦
            </button>
          </div>
        </div>
      )}

      {/* ── 어제 운세 피드백 팝업 ── */}
      {showReflection && yesterdayEntry?.score && (
        <ReflectionPopup
          yesterdayScore={yesterdayEntry.score}
          yesterdayDate={yesterdayKey}
          onAnswer={handleReflectionAnswer}
        />
      )}
    </div>
  );
}
