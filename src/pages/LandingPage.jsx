import { Suspense, useEffect, useState } from "react";
import { getAuthenticatedClient } from "../lib/supabase.js";
import { getDailyWord, CATS_ALL, REVIEWS, DAILY_QUESTIONS } from "../utils/constants.js";
import { useUserCtx, useSajuCtx, useGamCtx } from "../context/AppContext.jsx";
import { useAppStore } from "../store/useAppStore.js";
import { isTodayAnswered } from "../utils/quiz.js";
import DailyStarCardV2 from "../components/DailyStarCardV2.jsx";
import BPDisplay from "../components/BPDisplay.jsx";
import GuardianLevelBadge from "../components/GuardianLevelBadge.jsx";
import MissionDashboard from "../components/MissionDashboard.jsx";
import SamplePreview from "../components/SamplePreview.jsx";

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
  const setEquippedTalisman = useAppStore((s) => s.setEquippedTalisman);
  const nightMode = isNightMode();
  const nearbyJeolgi = getNearbyJeolgi();
  const [scoreHistory, setScoreHistory] = useState([]);

  useEffect(() => {
    if (!user) { setEquippedTalisman(null); return; }
    const kakaoId = String(user.kakaoId || user.id);
    const client = getAuthenticatedClient(kakaoId);

    client.from('user_shop_inventory')
      .select('item_id, is_equipped, shop_items(*)')
      .eq('kakao_id', kakaoId)
      .eq('is_equipped', true)
      .then(({ data }) => {
        const talisman = (data || []).find(r => r.shop_items?.category === 'talisman');
        setEquippedTalisman(talisman?.shop_items || null);
      });
  }, [user]);

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
                  : <div className="llc-avatar-placeholder" style={{ color: 'var(--gold)' }}>✦</div>}
                <div style={{ flex: 1 }}>
                  <div className="llc-name">{user.nickname} <span style={{ color: 'var(--gold)' }}>✦</span></div>
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
                const nextMilestone = streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : null;
                const remaining = nextMilestone ? nextMilestone - streak : 0;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,120,50,.08)', border: '1px solid rgba(255,120,50,.2)', borderRadius: 'var(--r1)', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>🔥</span>
                      <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: '#ff7832' }}>{streak}일 연속 출석</span>
                    </div>
                    {nextMilestone && (
                      <span style={{ fontSize: '11px', color: 'var(--t4)' }}>
                        +{remaining}일 후 +{nextMilestone === 7 ? 20 : nextMilestone === 14 ? 30 : 50} BP 보너스
                      </span>
                    )}
                    {!nextMilestone && (
                      <span style={{ fontSize: '11px', color: '#ff7832', fontWeight: 700 }}>최고 기록 도달!</span>
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
                    <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 2 }}>✦ 오늘의 부적 효과 적용 중</div>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 600 }}>{equippedTalisman.name}</div>
                  </div>
                </div>
              )}

              {form.by ? (
                <>

                  {/* ── 밤 모드: 하루 마무리 & 일기 ── */}
                  {nightMode && (
                    <div style={{ marginTop: 'var(--sp2)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em' }}>오늘 하루, 별이 예고한 대로 흘러갔나요?</div>
                        <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', marginTop: 4, lineHeight: 1.6 }}>별숨에게 당신의 밤을 들려주세요</div>
                      </div>
                      {(diaryReviewResult || diaryReviewLoading) ? (
                        <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>📓</span>
                              <span style={{ fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 700 }}>별숨의 오늘 해석</span>
                            </div>
                            {diaryReviewResult && !diaryReviewLoading && (
                              <button onClick={resetDiaryReview} style={{ fontSize: '0.65rem', color: 'var(--t4)', background: 'none', border: '1px solid var(--line)', borderRadius: 20, padding: '3px 10px', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
                                다시 쓰기
                              </button>
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
                      {/* 낮에 본 오늘의 별숨 접기/펼치기 */}
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

                  {/* ── 낮 모드: 오늘 별숨 확인이 최우선 ── */}
                  {!nightMode && (
                    <div style={{ marginTop: 'var(--sp2)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
                      {/* 오늘의 별숨 처방 확인하기 — 메인 CTA */}
                      {(() => {
                        const dailyCardContent = dailyLoading ? (
                          <div className="dsc-loading-btn">
                            <span>별숨이 오늘을 읽고 있어요</span>
                            <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
                          </div>
                        ) : dailyResult ? (
                          <>
                            <DailyStarCardV2
                              result={dailyResult}
                              onBlockBadtime={onBlockBadtime}
                              isBlocking={isBlockingBadtime}
                              canBlockBadtime={onBlockBadtime != null}
                              currentBp={gamificationState.currentBp}
                            />
                            {dailyCount < DAILY_MAX ? (
                              <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '12px', marginTop: 8, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={askDailyHoroscope}>
                                다시 물어보기 ✦ ({dailyCount}/{DAILY_MAX})
                              </button>
                            ) : (
                              <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 8 }}>오늘 별숨을 모두 읽었어요 · 내일 다시 만나요</div>
                            )}
                          </>
                        ) : (
                          <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '18px', fontSize: 'var(--md)', fontWeight: 700 }} onClick={askDailyHoroscope}>
                            오늘 별숨의 기운 확인하기 ✦
                          </button>
                        );
                        return (
                          <div data-tour="daily-card">
                            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em', paddingTop: 6, marginBottom: 6 }}>
                              ✦ 오늘 하루 나의 별숨 · {today?.month}월 {today?.day}일
                              <span style={{ marginLeft: 6, opacity: 0.6 }}>매일 새로워져요</span>
                            </div>
                            {dailyCardContent}
                          </div>
                        );
                      })()}

                      {/* 별 메시지 */}
                      <div style={{ padding: '14px 0 4px', borderTop: '1px solid var(--line)', marginTop: 6 }}>
                        <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                          {today?.month}월 {today?.day}일의 별 메시지
                        </div>
                        <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontStyle: 'italic', lineHeight: 1.8, paddingLeft: 2 }}>
                          "{getDailyWord(today?.day)}"
                        </div>
                      </div>

                      {/* 별숨달력 */}
                      {formOk && (
                        <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '11px', background: 'none', border: '1px solid var(--line)', color: 'var(--t3)', fontSize: 'var(--xs)' }} onClick={() => setStep(10)}>
                          별숨달력 ✦
                        </button>
                      )}

                      {/* ── 오늘의 미션 ── */}
                      <div style={{ paddingTop: 8, borderTop: '1px solid var(--line)', marginTop: 6 }}>
                        <MissionDashboard
                          missions={missions}
                          onMissionComplete={onCompleteMission}
                          onDiaryClick={() => setStep(17)}
                          hasDiaryToday={hasDiaryToday}
                        />
                      </div>

                      {/* ── 타로 카드 위젯 ── */}
                      <button
                        onClick={() => setStep(34)}
                        style={{
                          width: '100%', padding: '14px 16px',
                          background: 'linear-gradient(135deg, rgba(13,11,30,0.9), rgba(20,16,44,0.85))',
                          border: '1px solid rgba(200,165,80,0.3)',
                          borderRadius: 12, cursor: 'pointer',
                          fontFamily: 'var(--ff)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '9px', color: 'rgba(200,165,80,0.6)', fontWeight: 700, letterSpacing: '.14em', marginBottom: 3 }}>✦ &nbsp;BYEOLSOOM TAROT</div>
                          <div style={{ fontSize: 'var(--xs)', color: 'rgba(220,190,100,0.9)', fontWeight: 700 }}>오늘의 세 별빛 열기</div>
                          <div style={{ fontSize: '10px', color: 'rgba(180,180,200,0.5)', marginTop: 2 }}>매일 새로운 카드가 기다려요</div>
                        </div>
                        {/* 미니 카드 3장 */}
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          {['-6px', '0px', '6px'].map((ml, i) => (
                            <div key={i} style={{
                              width: 24, height: 38, borderRadius: 4,
                              background: 'linear-gradient(160deg, #0d0b1e, #1a1040)',
                              border: '1px solid rgba(200,165,80,0.45)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginLeft: i === 0 ? 0 : ml,
                              transform: i === 0 ? 'rotate(-6deg)' : i === 1 ? 'rotate(0deg)' : 'rotate(6deg)',
                              boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
                              position: 'relative', overflow: 'hidden',
                            }}>
                              <svg width="14" height="14" viewBox="0 0 14 14" style={{ opacity: 0.6 }}>
                                <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(200,165,80,0.6)" strokeWidth="0.5"/>
                                {[0,60,120,180,240,300].map((deg, j) => {
                                  const r = deg * Math.PI / 180;
                                  return <line key={j} x1="7" y1="7" x2={7 + 5.5 * Math.cos(r)} y2={7 + 5.5 * Math.sin(r)} stroke="rgba(200,165,80,0.4)" strokeWidth="0.5"/>;
                                })}
                                <circle cx="7" cy="7" r="1" fill="rgba(200,165,80,0.8)"/>
                              </svg>
                            </div>
                          ))}
                        </div>
                      </button>

                      {/* ── 7일 운세 점수 히스토리 ── */}
                      {scoreHistory.some(s => s.score !== null) && (
                        <div style={{ paddingTop: 8, borderTop: '1px solid var(--line)', marginTop: 6 }}>
                          <div style={{ fontSize: '10px', color: 'var(--t4)', letterSpacing: '.04em', marginBottom: 8 }}>✦ 최근 7일 운세 흐름</div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 44 }}>
                            {scoreHistory.map((item, i) => {
                              const label = item.date.slice(5).replace('-', '/');
                              const hasScore = item.score !== null;
                              const barH = hasScore ? Math.max(6, Math.round((item.score / 100) * 36)) : 4;
                              return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {hasScore && (
                                      <div style={{ fontSize: '9px', color: 'var(--t4)', marginBottom: 2 }}>{item.score}</div>
                                    )}
                                    <div style={{
                                      width: '100%', minWidth: 14,
                                      height: barH,
                                      background: hasScore ? scoreColor(item.score) : 'var(--line)',
                                      borderRadius: 3,
                                      opacity: hasScore ? 1 : 0.4,
                                    }} />
                                  </div>
                                  <div style={{ fontSize: '8.5px', color: 'var(--t4)' }}>{label}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
    </div>
  );
}
