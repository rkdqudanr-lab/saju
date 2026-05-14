import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import {
  getDailyDateKey,
  readDailyLocalCache,
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

import LandingHeader from '../components/landing/LandingHeader.jsx';
import DailyMiniCard from '../components/landing/DailyMiniCard.jsx';
import AlertCarousel from '../components/landing/AlertCarousel.jsx';
import ActionTile from '../components/landing/ActionTile.jsx';
import QuickActionGrid from '../components/landing/QuickActionGrid.jsx';
import WeeklyScoreSummary from '../components/landing/WeeklyScoreSummary.jsx';
import LevelCard from '../components/landing/LevelCard.jsx';
import GachaGraphic from '../components/GachaGraphic.jsx';
import { ASPECTS, getDailyResonanceItem } from '../utils/gachaItems.js';

const _SI = { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const TILE_ICONS = {
  chat:     <svg {..._SI}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  question: <svg {..._SI}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  mission:  <svg {..._SI}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  diary:    <svg {..._SI}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  calendar: <svg {..._SI}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  star:     <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  barChart: <svg {..._SI}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  shop:     <svg {..._SI}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  book:     <svg {..._SI}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
};

function TodayResonancePreview({ item, axisKey, onClick }) {
  if (!item) return null;
  const axis = ASPECTS[axisKey] || ASPECTS.overall;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`오늘의 인연 오브제, ${item.bodyName}`}
      style={{
        width: '100%',
        border: '1px solid var(--acc)',
        background: 'var(--goldf)',
        borderRadius: 'var(--r1)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        fontFamily: 'var(--ff)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: 'var(--bg1)',
        border: '1px solid var(--acc)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <GachaGraphic item={item} size={34} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 900, letterSpacing: '.05em', marginBottom: 3 }}>
          오늘의 인연 오브제
        </div>
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 900, lineHeight: 1.25, wordBreak: 'keep-all' }}>
          {item.bodyName}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--t3)', lineHeight: 1.45, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {axis.emoji} {axis.label} 기운이 가까워졌어요
        </div>
      </div>
      <div style={{ color: 'var(--gold)', fontWeight: 900, fontSize: 18 }}>›</div>
    </button>
  );
}

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
  onEnterChat,
}) {
  const setStep = useAppStore((s) => s.setStep);
  const setEquippedTheme = useAppStore((s) => s.setEquippedTheme);
  const setEquippedAvatar = useAppStore((s) => s.setEquippedAvatar);

  const { user, form, kakaoLogin, kakaoLogout } = useUserCtx();
  const { saju, today, isApproximate } = useSajuCtx();
  const { gamificationState = { currentBp: 0, guardianLevel: 1, loginStreak: 0 }, missions = [] } = useGamCtx();

  const nightMode = isNightMode();
  const nearbyJeolgi = getNearbyJeolgi();
  const kakaoId = user?.kakaoId || user?.id;

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
  const homeResonanceItem = useMemo(
    () => getDailyResonanceItem({ system: 'cosmic', userId: kakaoId || user?.nickname || 'guest', today }),
    [kakaoId, user?.nickname, today],
  );

  // ── 핵심 축 점수 (상위 2개 / 하위 1개) ──
  const topAxes = useMemo(() => {
    if (!dailyResult || !axisScores.length) return [];
    return [...axisScores]
      .filter((s) => s.key !== 'overall' && s.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }, [axisScores, dailyResult]);

  const bottomAxes = useMemo(() => {
    if (!dailyResult || !axisScores.length) return [];
    return [...axisScores]
      .filter((s) => s.key !== 'overall' && s.score <= 50)
      .sort((a, b) => a.score - b.score)
      .slice(0, 1);
  }, [axisScores, dailyResult]);

  // ── Smart Suggestion ──
  // 우선순위: 1) 저녁에 일기 미작성 → 일기 유도  2) 3일 연속 하락 → 상담 유도
  const suggestion = useMemo(() => {
    if (!user) return null;
    const hour = new Date().getHours();

    if (!hasDiaryToday && hour >= 17 && dailyResult) {
      return { icon: '📓', text: '저녁이에요. 오늘 하루를 기록하고 +5 BP 받아요 →', step: STEP.DIARY };
    }
    const validScores = scoreHistory.filter((s) => s.score !== null);
    if (validScores.length >= 3) {
      const last3 = validScores.slice(-3);
      if (last3[0].score > last3[1].score && last3[1].score > last3[2].score) {
        return { icon: '💬', text: '3일째 기운이 내려가고 있어요. 별숨에게 물어볼까요?', step: STEP.QUESTION };
      }
    }
    return null;
  }, [hasDiaryToday, scoreHistory, user?.id, dailyResult]);

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

  // ── 미션 진행률 ──
  const completedMissions = missions.filter((m) => m.is_completed).length;
  const totalMissions = missions.length;
  const remainingMissions = totalMissions - completedMissions;

  const recommendedFeature = useMemo(() => {
    const features = [
      { icon: TILE_ICONS.barChart, label: '별숨 통계', sub: '지난 운세 흐름을 확인해요', step: STEP.STATS },
      { icon: TILE_ICONS.star,     label: '나의 별숨', sub: '사주와 천체 분석을 살펴봐요', step: STEP.NATAL },
      { icon: TILE_ICONS.book,     label: '별숨 도감', sub: '컬렉션 완성을 이어가요', step: STEP.BYEOLSOOM_SPACE },
      { icon: TILE_ICONS.shop,     label: '별숨 뽑기', sub: '오늘의 인연 오브제를 만나봐요', step: STEP.GACHA },
      { icon: TILE_ICONS.calendar, label: '별숨 달력', sub: '이번 주 운세 기록을 돌아봐요', step: STEP.CALENDAR },
      { icon: TILE_ICONS.diary,    label: '나의 하루', sub: '오늘의 감정을 남겨봐요', step: STEP.DIARY },
    ];
    const seed = today?.day ?? new Date().getDate();
    return features[seed % features.length];
  }, [today?.day]);

  // ── 타일 정의 ──
  const heroTile = useMemo(() => ({
    icon: TILE_ICONS.chat,
    title: '별숨에게 질문하기',
    sub: '지금 제일 궁금한 걸 바로 물어보세요',
    onClick: () => setStep(STEP.QUESTION),
    hero: true,
  }), [setStep]);

  const primaryTiles = useMemo(() => [
    {
      icon: TILE_ICONS.question,
      title: '오늘의 추천질문',
      sub: '연애·일·돈 고민을 빠르게 골라요',
      onClick: () => setStep(STEP.QUESTION),
      badge: '자주 묻는 질문',
      ariaLabel: '오늘의 추천질문 보기',
    },
    {
      icon: TILE_ICONS.mission,
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
      icon: TILE_ICONS.diary,
      title: '나의 하루',
      sub: hasDiaryToday ? '오늘 하루를 들려줬어요 ✦' : '별숨에게 오늘을 들려주세요',
      onClick: () => setStep(STEP.DIARY),
      accent: hasDiaryToday,
    },
    {
      icon: TILE_ICONS.calendar,
      title: '별숨 달력',
      sub: '운세 기록 한눈에 보기',
      onClick: () => setStep(STEP.CALENDAR),
    },
    {
      icon: recommendedFeature.icon,
      title: '오늘의 추천 별숨기능',
      sub: recommendedFeature.sub,
      onClick: () => setStep(recommendedFeature.step),
      badge: recommendedFeature.label,
      ariaLabel: `오늘의 추천 별숨기능, ${recommendedFeature.label}`,
    },
  ], [totalMissions, completedMissions, remainingMissions, hasDiaryToday, recommendedFeature, setStep]);

  const secondaryTiles = useMemo(() => [
    { icon: TILE_ICONS.star,     title: '나의 별숨', sub: '사주·천체 종합 분석', onClick: () => setStep(STEP.NATAL) },
    { icon: TILE_ICONS.barChart, title: '별숨 통계', sub: '지난 운세 흐름 보기', onClick: () => setStep(STEP.STATS) },
    { icon: TILE_ICONS.shop,     title: '별숨 뽑기', sub: '인연 보정으로 오브제 만나기', onClick: () => setStep(STEP.GACHA), ariaLabel: '별숨 뽑기, 오브제 만나기' },
    { icon: TILE_ICONS.book,     title: '별숨 도감', sub: '컬렉션 완성 도전', onClick: () => setStep(STEP.BYEOLSOOM_SPACE) },
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

  // ── 로그인 + 프로필 완성 화면 ──
  return (
    <div className="page step-fade" style={{ justifyContent: 'flex-start', paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
      <div className="land-home">

        {/* 1. 보상 바 헤더 */}
        <LandingHeader
          onEditProfile={() => { setEditingMyProfile(true); setStep(STEP.PROFILE); }}
          onLogout={kakaoLogout}
          bp={gamificationState.currentBp}
          freeRechargeAvailable={freeRechargeAvailable}
          onFreeRecharge={onFreeRecharge}
          onStreakClick={() => setStep(STEP.SCORE_TREND)}
        />

        {/* 2. 히어로: 오늘의 별숨 미니카드 */}
        <DailyMiniCard
          dailyResult={dailyResult}
          todayScore={todayScore}
          loading={dailyLoading}
          onAsk={askDailyHoroscope}
          onClick={() => setStep(STEP.TODAY_DETAIL)}
          boostCount={Object.keys(boostMap).length}
          scoreBoostDelta={scoreBoostDelta}
          topAxes={topAxes}
          bottomAxes={bottomAxes}
          onQuickAsk={onEnterChat}
        />

        <div style={{ padding: '0 20px', marginTop: 12 }}>
          <TodayResonancePreview
            item={homeResonanceItem}
            axisKey={homeResonanceItem?.resonanceAxis}
            onClick={() => setStep(STEP.GACHA)}
          />
        </div>

        {/* 3. 알림 캐러셀 (절기/생일만) */}
        <AlertCarousel
          isApproximate={isApproximate}
          jeolgi={nearbyJeolgi}
          birthdays={[]}
          onApproximate={() => setStep(STEP.PROFILE)}
          onJeolgi={() => setStep(STEP.CALENDAR)}
        />

        {/* 4. Smart Suggestion */}
        {suggestion && (
          <div
            role={suggestion.step ? 'button' : undefined}
            tabIndex={suggestion.step ? 0 : undefined}
            className="smart-suggestion"
            onClick={suggestion.step ? () => setStep(suggestion.step) : undefined}
            onKeyDown={suggestion.step ? (e) => e.key === 'Enter' && setStep(suggestion.step) : undefined}
          >
            <span className="smart-suggestion-icon">{suggestion.icon}</span>
            <span className="smart-suggestion-text">{suggestion.text}</span>
            {suggestion.step && <span className="smart-suggestion-arrow">›</span>}
          </div>
        )}

        {/* 5. 주요 기능: hero + 2×2 그리드 */}
        <div className="tile-stack">
          <ActionTile {...heroTile} />
          <QuickActionGrid tiles={primaryTiles} />
        </div>

        {/* 6. 7일 점수 요약 */}
        <WeeklyScoreSummary
          scoreHistory={scoreHistory}
          onClick={() => setStep(STEP.SCORE_TREND)}
        />

        {/* 7. 별숨 레벨 카드 */}
        <LevelCard />

        {/* 8. 보조 기능 2×2 타일 */}
        <QuickActionGrid tiles={secondaryTiles} />

        {/* 9. 오늘의 별 메시지 */}
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

    </div>
  );
}
