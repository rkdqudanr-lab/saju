import { Suspense, useEffect, useState } from "react";
import { getAuthenticatedClient } from "../lib/supabase.js";
import { getDailyWord, CATS_ALL, REVIEWS, DAILY_QUESTIONS } from "../utils/constants.js";
import { useUserCtx, useSajuCtx, useGamCtx } from "../context/AppContext.jsx";
import { useAppStore } from "../store/useAppStore.js";
import { isTodayAnswered } from "../utils/quiz.js";
import { getKeepLogin, setKeepLogin } from "../hooks/useUserProfile.js";
import DailyStarCardV2 from "../components/DailyStarCardV2.jsx";
import BPDisplay from "../components/BPDisplay.jsx";
import GuardianLevelBadge from "../components/GuardianLevelBadge.jsx";
import MissionDashboard from "../components/MissionDashboard.jsx";
import SamplePreview from "../components/SamplePreview.jsx";
import SajuCalendar from "../components/SajuCalendar.jsx";

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

// 별숨 해석 미리보기 (처음 2줄만)
function DiaryReviewPreview({ text }) {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3);
  return (
    <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.8, fontStyle: 'italic' }}>
      {lines.map((line, i) => <div key={i}>{line}</div>)}
      {text.split('\n').filter(Boolean).length > 3 && (
        <div style={{ color: 'var(--t4)', marginTop: 4 }}>...</div>
      )}
    </div>
  );
}

function getBdayDday(bm, bd) {
  if (!bm || !bd) return null;
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), parseInt(bm) - 1, parseInt(bd));
  thisYear.setHours(0, 0, 0, 0);
  const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
  const next = thisYear >= today0 ? thisYear : new Date(now.getFullYear() + 1, parseInt(bm) - 1, parseInt(bd));
  return Math.round((next - today0) / 86400000);
}

// 시간대 판별: 17시 이후면 '밤' 모드
function isNightMode() {
  const h = new Date().getHours();
  return h >= 17 || h < 6;
}

// 절기 근사 날짜 (월, 일) — 실제와 ±2일 이내
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

// 오늘이 절기 ±3일 이내면 해당 절기 정보 반환
function getNearbyJeolgi() {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const y = now.getFullYear();
  for (const jg of JEOLGI_APPROX) {
    const jgDate = new Date(y, jg.month - 1, jg.day);
    const diffDays = Math.round((jgDate - now) / 86400000);
    if (diffDays >= -1 && diffDays <= 3) {
      return { ...jg, diffDays };
    }
  }
  return null;
}

// 운세 점수 → 색상
function scoreColor(score) {
  if (score >= 80) return '#f0b429';
  if (score >= 60) return '#7ec8e3';
  if (score >= 40) return '#a0c97b';
  return '#c9a0dc';
}

export default function LandingPage({
  otherProfiles,
  quiz, quizInput, setQuizInput,
  dailyResult, dailyLoading, dailyCount, DAILY_MAX,
  diaryReviewResult, diaryReviewLoading,
  showDailyCard, setShowDailyCard,
  setDiy,
  setEditingMyProfile, setShowProfileModal,
  askQuick, callApi, setDiaryViewDate,
  askDailyHoroscope, askDiaryReview, askWeeklyReview, resetDiaryReview,
  handleQuizAnswer, handleQuizSkip,
  DiaryPageLazy,
  onBlockBadtime = null,
  onCompleteMission = null,
  onFreeRecharge = null,
  onDiaryComplete = null,
  hasDiaryToday = false,
  isBlockingBadtime = false,
  freeRechargeAvailable = true,
}) {
  // store / context에서 직접 읽기 (props drilling 제거)
  const setStep  = useAppStore((s) => s.setStep);
  const { user, form, profile, showToast, kakaoLogin, kakaoLogout } = useUserCtx();
  const { saju, sun, today, buildCtx, formOk, formOkApprox, isApproximate } = useSajuCtx();
  const { gamificationState = { currentBp: 0, guardianLevel: 1, loginStreak: 0, todayMissionsDone: 0 }, missions = [] } = useGamCtx();
  const equippedTalisman = useAppStore((s) => s.equippedTalisman);
  const equippedSajuItem = useAppStore((s) => s.equippedSajuItem);
  const setEquippedTalisman = useAppStore((s) => s.setEquippedTalisman);
  const setEquippedTheme = useAppStore((s) => s.setEquippedTheme);
  const setEquippedAvatar = useAppStore((s) => s.setEquippedAvatar);
  const setEquippedSajuItem = useAppStore((s) => s.setEquippedSajuItem);
  const [keepLogin, setKeepLoginState] = useState(getKeepLogin());
  const nightMode = isNightMode();
  const nearbyJeolgi = getNearbyJeolgi();
  const [scoreHistory, setScoreHistory] = useState([]);
  const [showStreakPopup, setShowStreakPopup] = useState(false);

  // 탭 순서: 낮엔 [오늘별숨, 오늘의 미션, 별숨달력, 나의하루] / 밤엔 [나의하루, 오늘별숨, 오늘의 미션, 별숨달력]
  const TABS_DAY   = ['daily', 'mission', 'calendar', 'diary'];
  const TABS_NIGHT = ['diary', 'daily', 'mission', 'calendar'];
  const TAB_LABELS = { daily: '오늘별숨', mission: '오늘의 미션', calendar: '별숨달력', diary: '나의하루' };
  const TABS = nightMode ? TABS_NIGHT : TABS_DAY;
  const [activeTab, setActiveTab] = useState(TABS[0]);

  useEffect(() => {
    if (!user) { setEquippedTalisman(null); return; }
    const kakaoId = String(user.kakaoId || user.id);
    const client = getAuthenticatedClient(kakaoId);
    if (!client) return;
    const safeClient = client;

    safeClient.from('user_shop_inventory')
      .select('item_id, is_equipped')
      .eq('kakao_id', kakaoId)
      .eq('is_equipped', true)
      .then(async ({ data }) => {
        const { findItem } = await import('../utils/gachaItems.js');
        const { findShopItem } = await import('../utils/shopGachaItems.js');
        const { data: allShopItems } = await safeClient.from('shop_items').select('*');
        const shopItemsMap = new Map((allShopItems || []).map(i => [i.id, i]));

        const equipped = (data || []).map(r => {
          const matched = shopItemsMap.get(r.item_id) || findItem(r.item_id) || findShopItem(r.item_id);
          return matched ? { ...matched, is_equipped: r.is_equipped } : null;
        }).filter(Boolean);
        
        useAppStore.getState().setEquippedItems?.(equipped);
        // 부적(하위호환 유지용)
        const talisman = equipped.find(r => r.category === 'talisman');
        setEquippedTalisman(talisman || null);

        // 오늘 발동 기운 복원 (Supabase daily_cache → Zustand, 부적보다 우선)
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: dailyActData } = await safeClient
          .from('daily_cache')
          .select('content')
          .eq('kakao_id', kakaoId)
          .eq('cache_date', todayStr)
          .eq('cache_type', 'daily_activation')
          .maybeSingle();
        if (dailyActData?.content) {
          const activatedItem = findItem(dailyActData.content);
          if (activatedItem) setEquippedTalisman(activatedItem);
        }
        
        // 커스텀 장착 파츠
        const theme = equipped.find(r => r.category === 'theme');
        setEquippedTheme(theme || null);
        
        const avatar = equipped.find(r => r.category === 'avatar');
        setEquippedAvatar(avatar || null);
        
        // 인벤토리 별숨 뽑기(우주/사주) 기운 장착 (category가 등급을 의미하거나, grade 속성 보유)
        const gachaItem = equipped.find(r => ['space', 'saju'].includes(r.system) || r.grade);
        setEquippedSajuItem(gachaItem || null);
      });
  }, [user, setEquippedTalisman, setEquippedTheme, setEquippedAvatar, setEquippedSajuItem]);

  // 7일 운세 점수 히스토리 로드
  useEffect(() => {
    if (!user) { setScoreHistory([]); return; }
    const kakaoId = String(user.kakaoId || user.id);
    const client = getAuthenticatedClient(kakaoId);
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    client.from('daily_cache')
      .select('cache_date, content')
      .eq('kakao_id', kakaoId)
      .eq('cache_type', 'horoscope_score')
      .in('cache_date', last7)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(r => { map[r.cache_date] = Number(r.content); });
        setScoreHistory(last7.reverse().map(date => ({ date, score: map[date] ?? null })));
      })
      .catch(() => {});
  }, [user]);

  // 오늘 점수 받으면 히스토리에 즉시 반영
  useEffect(() => {
    if (!dailyResult?.score) return;
    const today = new Date().toISOString().slice(0, 10);
    setScoreHistory(prev => {
      if (!prev.length) return prev;
      return prev.map(item => item.date === today ? { ...item, score: dailyResult.score } : item);
    });
  }, [dailyResult?.score]);

  // 로그인 후 연속 출석 팝업 (하루 1회)
  useEffect(() => {
    if (!user || !gamificationState.loginStreak) return;
    const popupKey = `streak_popup_${new Date().toISOString().slice(0,10)}`;
    if (localStorage.getItem(popupKey)) return;
    const t = setTimeout(() => {
      setShowStreakPopup(true);
      localStorage.setItem(popupKey, '1');
    }, 800);
    return () => clearTimeout(t);
  }, [user?.id, gamificationState.loginStreak]);

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

        {/* 추정 모드 배너 */}
        {isApproximate && (
          <div
            onClick={() => setStep(1)}
            style={{
              margin: '0 0 12px', padding: '10px 16px',
              background: 'var(--goldf)', border: '1px solid var(--acc)',
              borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: 'var(--gold)',
              lineHeight: 1.7, textAlign: 'center', cursor: 'pointer',
            }}
          >
            ✦ 프로필 완성률 50% — 생일 일자를 추가하고<br />
            <strong>숨겨진 나의 진짜 별자리를 확인하세요 →</strong>
          </div>
        )}

        {/* 절기 배너 */}
        {nearbyJeolgi && (
          <div style={{
            margin: '0 0 12px', padding: '9px 14px',
            background: 'var(--goldf)',
            border: '1px solid var(--acc)',
            borderRadius: 'var(--r1)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>
              {nearbyJeolgi.diffDays <= 0 ? '✦' : '◇'}
            </span>
            <span style={{ fontSize: 'var(--xs)', color: 'var(--gold)', lineHeight: 1.6 }}>
              {nearbyJeolgi.diffDays <= 0
                ? <><strong>오늘은 {nearbyJeolgi.name}</strong> — {nearbyJeolgi.meaning}</>
                : <><strong>{nearbyJeolgi.diffDays}일 후 {nearbyJeolgi.name}</strong> — {nearbyJeolgi.meaning}</>
              }
            </span>
          </div>
        )}

        <div className="land-login-section">
          {user ? (
            <div className="land-login-card logged">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                {user.profileImage
                  ? <img className="llc-avatar" src={user.profileImage} alt="프로필" />
                  : <div className="llc-avatar-placeholder">🌙</div>}
                <div style={{ flex: 1 }}>
                  <div className="llc-name">{form.nickname || user.nickname} <span style={{ color: 'var(--gold)' }}>✦</span></div>
                  <div className="llc-sub">
                    {form.by && saju ? (saju.ilganPoetic ? `${saju.ilganPoetic}` : '') : '별숨이 당신을 기억해요'}
                  </div>
                  {dailyResult?.score != null && (
                    <button
                      onClick={() => setStep(23)}
                      style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${scoreColor(dailyResult.score)}44`, borderRadius: 20, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--ff)' }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: scoreColor(dailyResult.score), flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: '11px', color: scoreColor(dailyResult.score), fontWeight: 700 }}>오늘 {dailyResult.score}점</span>
                      <span style={{ fontSize: '10px', color: 'var(--t4)' }}>자세히 →</span>
                    </button>
                  )}
                  {dailyResult == null && !dailyLoading && form.by && (
                    <button
                      onClick={askDailyHoroscope}
                      style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--gold)', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--ff)' }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>오늘 별숨 확인하기 ✦</span>
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditingMyProfile(true); setStep(1); }} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>수정</button>
                  <button onClick={kakaoLogout} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>로그아웃</button>
                </div>
              </div>
              {/* 출석 스트릭 위젯 */}
              {gamificationState.loginStreak >= 1 && (() => {
                const streak = gamificationState.loginStreak;
                const nextMilestone = streak < 7 ? 7 : streak < 14 ? 14 : streak < 21 ? 21 : null;
                const remaining = nextMilestone ? nextMilestone - streak : 0;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,120,50,.08)', border: '1px solid rgba(255,120,50,.2)', borderRadius: 'var(--r1)', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>🔥</span>
                      <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: '#ff7832' }}>{streak}일 연속 출석</span>
                    </div>
                    {nextMilestone && (
                      <span style={{ fontSize: '11px', color: 'var(--t4)' }}>
                        +{remaining}일 후 +100 BP 보너스
                      </span>
                    )}
                    {!nextMilestone && (
                      <span style={{ fontSize: '11px', color: '#ff7832', fontWeight: 700 }}>21일 달성! 최고 기록 🎉</span>
                    )}
                  </div>
                );
              })()}
              
              {/* 장착 중인 부적 연출 */}
              {equippedTalisman && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', marginTop: 6, marginBottom: 10,
                  background: 'linear-gradient(135deg, rgba(232,176,72,0.1), rgba(232,176,72,0.02))',
                  border: '1px solid rgba(232,176,72,0.3)',
                  borderRadius: 'var(--r1)',
                  boxShadow: '0 4px 16px rgba(232,176,72,0.15)',
                  animation: 'dsc-breathe 4s ease-in-out infinite'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'var(--bg2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0,
                    boxShadow: '0 0 10px rgba(232,176,72,0.5)',
                    animation: 'floatGently 3s ease-in-out infinite'
                  }}>
                    {equippedTalisman.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 2 }}>✦ 오늘의 기운 발동 중</div>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 600 }}>{equippedTalisman.name}</div>
                  </div>
                </div>
              )}

              {form.by ? (
                <>
                  {/* ── 탭 바 ── */}
                  <div style={{ display: 'flex', gap: 3, marginTop: 'var(--sp2)', marginBottom: 'var(--sp2)', background: 'var(--bg3)', borderRadius: 'var(--r1)', padding: 3, border: '1px solid var(--line)' }}>
                    {TABS.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          flex: 1, padding: '7px 2px', borderRadius: 'calc(var(--r1) - 2px)',
                          border: 'none', fontFamily: 'var(--ff)', fontSize: '11px', fontWeight: activeTab === tab ? 700 : 400,
                          cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
                          background: activeTab === tab ? 'var(--goldf)' : 'transparent',
                          color: activeTab === tab ? 'var(--gold)' : 'var(--t4)',
                          outline: activeTab === tab ? '1px solid var(--acc)' : 'none',
                        }}
                      >
                        {TAB_LABELS[tab]}
                      </button>
                    ))}
                  </div>

                  {/* ── 탭: 오늘별숨 ── */}
                  {activeTab === 'daily' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
                      {/* 오늘의 별숨 카드 */}
                      <div data-tour="daily-card">
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em', paddingTop: 6, marginBottom: 6 }}>
                          ✦ 오늘 하루 나의 별숨 · {today?.month}월 {today?.day}일
                          <span style={{ marginLeft: 6, opacity: 0.6 }}>매일 새로워져요</span>
                        </div>
                        {dailyLoading ? (
                          <div className="dsc-loading-btn">
                            <span>별숨이 오늘을 읽고 있어요</span>
                            <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
                          </div>
                        ) : dailyResult ? (
                          <DailyStarCardV2
                            result={dailyResult}
                            onBlockBadtime={onBlockBadtime}
                            isBlocking={isBlockingBadtime}
                            canBlockBadtime={onBlockBadtime != null}
                            currentBp={gamificationState.currentBp}
                          />
                        ) : (
                          <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '18px', fontSize: 'var(--md)', fontWeight: 700 }} onClick={askDailyHoroscope}>
                            오늘 별숨의 기운 확인하기 ✦
                          </button>
                        )}
                      </div>

                      {/* 별 메시지 */}
                      <div style={{ padding: '14px 0 4px', borderTop: '1px solid var(--line)', marginTop: 6 }}>
                        <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                          {today?.month}월 {today?.day}일의 별 메시지
                        </div>
                        <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontStyle: 'italic', lineHeight: 1.8, paddingLeft: 2 }}>
                          "{getDailyWord(today?.day)}"
                        </div>
                      </div>

                      {/* 7일 운세 점수 히스토리 */}
                      {scoreHistory.some(s => s.score !== null) && (
                        <div style={{ paddingTop: 8, borderTop: '1px solid var(--line)', marginTop: 6 }}>
                          <div style={{ fontSize: '10px', color: 'var(--t4)', letterSpacing: '.04em', marginBottom: 8 }}>✦ 최근 7일 운세 흐름</div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                            {scoreHistory.map((item, i) => {
                              const label = item.date.slice(5).replace('-', '/');
                              const hasScore = item.score !== null;
                              const barH = hasScore ? Math.max(8, Math.round((item.score / 100) * 40)) : 4;
                              return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                  <div style={{ fontSize: '9px', color: hasScore ? 'var(--t4)' : 'transparent', marginBottom: 1, lineHeight: 1 }}>{hasScore ? item.score : '·'}</div>
                                  <div style={{ width: '100%', minWidth: 12, height: barH, background: hasScore ? scoreColor(item.score) : 'var(--line)', borderRadius: 3, opacity: hasScore ? 1 : 0.3, transition: 'height .3s ease' }} />
                                  <div style={{ fontSize: '8.5px', color: 'var(--t4)', marginTop: 2 }}>{label}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 탭: 오늘의 미션 ── */}
                  {activeTab === 'mission' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
                      <MissionDashboard
                        missions={missions}
                        onMissionComplete={onCompleteMission}
                        onDiaryClick={() => { setActiveTab('diary'); }}
                        hasDiaryToday={hasDiaryToday}
                      />
                      {/* 일기 완료 → 뽑기 유도 CTA */}
                      {hasDiaryToday && (
                        <div style={{ paddingTop: 8, borderTop: '1px solid var(--line)', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em' }}>✦ 오늘 일기를 별숨에게 들려줬어요</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setStep(40)}
                              style={{ flex: 2, padding: '10px 12px', background: 'var(--goldf)', border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                            >
                              <span>🎰</span><span>별숨 뽑기로 기운 더하기</span>
                            </button>
                            {!equippedSajuItem ? (
                              <button onClick={() => setStep(38)} style={{ flex: 1, padding: '10px 8px', background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>기운 장착</button>
                            ) : (
                              <div style={{ flex: 1, padding: '10px 8px', background: 'var(--bg2)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <span style={{ fontSize: '1rem' }}>{equippedSajuItem.emoji || '✦'}</span>
                                <span style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 600 }}>장착 중</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 탭: 나의하루 ── */}
                  {activeTab === 'diary' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em' }}>오늘 하루, 별이 예고한 대로 흘러갔나요?</div>
                        <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', marginTop: 4, lineHeight: 1.6 }}>별숨에게 당신의 하루를 들려주세요</div>
                      </div>
                      {(diaryReviewResult || diaryReviewLoading) ? (
                        <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>📓</span>
                              <span style={{ fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 700 }}>별숨의 오늘 해석</span>
                            </div>
                            {diaryReviewResult && !diaryReviewLoading && (
                              <button onClick={resetDiaryReview} style={{ fontSize: '0.65rem', color: 'var(--t4)', background: 'none', border: '1px solid var(--line)', borderRadius: 20, padding: '3px 10px', fontFamily: 'var(--ff)', cursor: 'pointer' }}>다시 쓰기</button>
                            )}
                          </div>
                          <div style={{ padding: '12px 14px' }}>
                            {diaryReviewLoading ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t4)', fontSize: 'var(--xs)', padding: '8px 0' }}>
                                <div style={{ width: 14, height: 14, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', flexShrink: 0 }} />
                                별숨이 오늘의 기운을 읽고 있어요...
                              </div>
                            ) : (
                              <>
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, marginBottom: 6, letterSpacing: '.04em' }}>✦ 별숨의 해석</div>
                                  <DiaryReviewPreview text={diaryReviewResult} />
                                </div>
                                <button onClick={() => setStep(17)} style={{ width: '100%', padding: '10px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', fontFamily: 'var(--ff)', fontSize: 'var(--xs)', color: 'var(--gold)', cursor: 'pointer', fontWeight: 600 }}>
                                  별숨의 해석 전체 보기 →
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Suspense fallback={<PageSpinner />}>
                          {DiaryPageLazy && (
                            <DiaryPageLazy
                              user={user} form={form} saju={saju} sun={sun} buildCtx={buildCtx}
                              today={today} isApproximate={isApproximate}
                              askReview={askDiaryReview} setStep={setStep} embedded={true}
                              diaryReviewResult={diaryReviewResult} diaryReviewLoading={diaryReviewLoading}
                              showToast={showToast}
                              onDiaryComplete={onDiaryComplete}
                            />
                          )}
                        </Suspense>
                      )}
                      {/* 오늘의 별숨 접기/펼치기 */}
                      {dailyResult && (
                        <>
                          <button
                            onClick={() => setShowDailyCard(v => !v)}
                            style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '10px 14px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <span>✦ 오늘 하루 나의 별숨 · {today?.month}월 {today?.day}일</span>
                            <span style={{ fontSize: '0.7em', opacity: 0.6 }}>{showDailyCard ? '▲ 접기' : '▼ 보기'}</span>
                          </button>
                          {showDailyCard && (
                            <div style={{ marginTop: 4 }}>
                              <DailyStarCardV2
                                result={dailyResult}
                                onBlockBadtime={onBlockBadtime}
                                isBlocking={isBlockingBadtime}
                                canBlockBadtime={onBlockBadtime != null}
                                currentBp={gamificationState.currentBp}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── 탭: 별숨달력 ── */}
                  {activeTab === 'calendar' && (
                    <div style={{ marginTop: 4 }}>
                      <SajuCalendar
                        form={form} setStep={setStep}
                        askQuick={askQuick} user={user}
                        callApi={callApi} showToast={showToast}
                        setDiaryViewDate={setDiaryViewDate}
                      />
                    </div>
                  )}

                  {/* ── 수호자 레벨 (2레벨 이상부터 노출) ── */}
                  {gamificationState.guardianLevel >= 2 && (
                    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', padding: 'var(--sp2)', marginTop: 'var(--sp2)' }}>
                      <GuardianLevelBadge
                        level={gamificationState.guardianLevel}
                        nextLevelMissions={gamificationState.nextLevelMissions || 0}
                        totalMissionsToNextLevel={15 * gamificationState.guardianLevel}
                      />
                    </div>
                  )}
                </>
              ) : (
                <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px' }} onClick={() => setStep(1)}>
                  지금 시작하기 ✦
                </button>
              )}
            </div>
          ) : (
            <div className="land-login-card" style={{ padding: '24px 20px', gap: '16px' }}>
              <p style={{ fontSize: 'var(--sm)', color: 'var(--t2)', textAlign: 'center', lineHeight: 1.8, margin: 0 }}>
                사주와 별자리, 두 개의 언어로<br/>지금의 당신을 읽어드려요
              </p>
              <button className="kakao-login-full" onClick={() => { if (typeof window.gtag === 'function') window.gtag('event', 'kakao_login_click'); kakaoLogin(); }} style={{ fontSize: '1rem', padding: '16px' }}>
                <span className="kakao-icon-wrap">
                  <svg width="18" height="17" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38c0 2.1 1.38 3.93 3.45 4.98L4.2 15l3.54-2.34c.39.06.81.09 1.26.09 4.14 0 7.5-2.64 7.5-5.88S13.14 1.5 9 1.5z" fill="#191919" />
                  </svg>
                </span>
                카카오로 3초 만에 시작하기
              </button>
              {/* 로그인 유지하기 토글 */}
              <div
                onClick={() => { const next = !keepLogin; setKeepLoginState(next); setKeepLogin(next); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', padding: '2px 0' }}
              >
                <div style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: keepLogin ? 'var(--gold)' : 'var(--bg3)',
                  position: 'relative', transition: 'background .2s', flexShrink: 0,
                  border: '1px solid var(--line)',
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: keepLogin ? 17 : 2,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#fff', transition: 'left .2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,.3)',
                  }} />
                </div>
                <span style={{ fontSize: 'var(--xs)', color: keepLogin ? 'var(--gold)' : 'var(--t4)' }}>
                  로그인 유지하기
                </span>
              </div>
              <button className="land-ghost-link" onClick={() => setStep(1)}>
                로그인 없이 먼저 체험하기 →
              </button>
            </div>
          )}
        </div>

        {!user && <div className="land-scroll-hint"><span>↓</span></div>}
      </div>

      {/* ── 생일 D-Day 위젯 ── */}
      {user && form.bm && (() => {
        const all = [
          { label: form.nickname || form.name || '나', bm: form.bm, bd: form.bd },
          ...(otherProfiles || []).map(p => ({ label: p.name || '이름없음', bm: p.bm, bd: p.bd })),
        ];
        const cards = all
          .map(p => ({ label: p.label, dday: getBdayDday(p.bm, p.bd) }))
          .filter(c => c.dday !== null && c.dday <= 30)
          .sort((a, b) => a.dday - b.dday);
        if (cards.length === 0) return null;
        return (
          <div style={{ padding: '0 var(--sp3) var(--sp2)' }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 8, letterSpacing: '.04em' }}>✦ 다가오는 생일</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cards.map((c, i) => (
                <div key={`bday-${i}`} style={{
                  padding: '8px 14px', borderRadius: 'var(--r1)',
                  border: `1px solid ${c.dday === 0 ? 'var(--gold)' : c.dday <= 7 ? '#e07' : 'var(--line)'}`,
                  background: c.dday === 0 ? 'var(--goldf)' : 'var(--bg2)',
                  fontSize: 'var(--xs)', color: 'var(--t2)',
                }}>
                  <span style={{ fontWeight: 700 }}>{c.label}</span>
                  <span style={{ marginLeft: 8, color: c.dday === 0 ? 'var(--gold)' : c.dday <= 7 ? '#e07' : 'var(--t4)' }}>
                    {c.dday === 0 ? '🎂 오늘이에요!' : `D-${c.dday}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {!user && (
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
      )}

      {/* ── 연속 출석 팝업 ── */}
      {showStreakPopup && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}
          onClick={() => setShowStreakPopup(false)}
        >
          <div
            style={{ background: 'var(--bg1)', border: '1px solid var(--acc)', borderRadius: 'var(--r2)', padding: '28px 24px', maxWidth: 320, width: '100%', textAlign: 'center', animation: 'fadeUp .3s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>🔥</div>
            <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>
              {gamificationState.loginStreak}일 연속 출석!
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7, marginBottom: 18 }}>
              {(() => {
                const s = gamificationState.loginStreak;
                if (s === 7) return '✦ 7일 달성 보너스 +100 BP을 받았어요!';
                if (s === 14) return '✦ 14일 달성 보너스 +100 BP을 받았어요!';
                if (s === 21) return '✦ 21일 달성 보너스 +100 BP을 받았어요!';
                const next = s < 7 ? 7 : s < 14 ? 14 : s < 21 ? 21 : null;
                return next
                  ? `앞으로 ${next - s}일 더 출석하면 +100 BP 보너스를 받아요`
                  : `21일을 넘었어요! 대단한 출석왕이에요 🌟`;
              })()}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
              {[7, 14, 21].map(milestone => {
                const s = gamificationState.loginStreak;
                const done = s >= milestone;
                const active = !done && (milestone === (s < 7 ? 7 : s < 14 ? 14 : s < 21 ? 21 : null));
                return (
                  <div key={milestone} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: done ? 'var(--gold)' : active ? 'var(--goldf)' : 'var(--bg2)',
                      border: `2px solid ${done ? 'var(--gold)' : active ? 'var(--acc)' : 'var(--line)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: done ? '1.1rem' : 'var(--xs)',
                      color: done ? '#fff' : active ? 'var(--gold)' : 'var(--t4)',
                      fontWeight: 700,
                    }}>
                      {done ? '✓' : `${milestone}`}
                    </div>
                    <div style={{ fontSize: '9px', color: done ? 'var(--gold)' : 'var(--t4)' }}>{milestone}일</div>
                  </div>
                );
              })}
            </div>
            <button
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
