import { Suspense, useState } from "react";
import { getDailyWord, CATS_ALL, REVIEWS, DAILY_QUESTIONS } from "../utils/constants.js";
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

export default function LandingPage({
  user, form, saju, sun, today,
  otherProfiles,
  formOk, formOkApprox, isApproximate, profile,
  quiz, quizInput, setQuizInput,
  dailyResult, dailyLoading, dailyCount, DAILY_MAX,
  diaryReviewResult, diaryReviewLoading,
  showDailyCard, setShowDailyCard,
  buildCtx,
  setStep, setDiy,
  kakaoLogin, kakaoLogout,
  setEditingMyProfile, setShowProfileModal,
  askDailyHoroscope, askDiaryReview, askWeeklyReview, resetDiaryReview,
  handleQuizAnswer, handleQuizSkip,
  showToast,
  DiaryPageLazy,
  // 게이미피케이션 props
  gamificationState = { currentBp: 0, guardianLevel: 1, loginStreak: 0, todayMissionsDone: 0 },
  missions = [],
  onBlockBadtime = null,
  onCompleteMission = null,
  onFreeRecharge = null,
  isBlockingBadtime = false,
  freeRechargeAvailable = true,
}) {
  const nightMode = isNightMode();
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
            🚀 프로필 완성률 50% — 생일 일자를 추가하고<br />
            <strong>숨겨진 나의 진짜 별자리를 확인하세요 →</strong>
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
                  <div className="llc-name">{user.nickname} <span style={{ color: 'var(--gold)' }}>✦</span></div>
                  <div className="llc-sub">
                    {form.by && saju ? (saju.ilganPoetic ? `${saju.ilganPoetic}` : '') : '별숨이 당신을 기억해요'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditingMyProfile(true); setStep(1); }} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>수정</button>
                  <button onClick={kakaoLogout} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>로그아웃</button>
                </div>
              </div>
              {form.by ? (
                <>

                  {/* ── 밤 모드: 하루 마무리 & 일기 ── */}
                  {nightMode && (
                    <div style={{ marginTop: 'var(--sp2)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em' }}>🌙 오늘 하루, 별이 예고한 대로 흘러갔나요?</div>
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
                              askReview={askDiaryReview} setStep={setStep} embedded={true}
                              diaryReviewResult={diaryReviewResult} diaryReviewLoading={diaryReviewLoading}
                              showToast={showToast}
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
                            <span>✦ 오늘 하루 나의 별숨 · {today.month}월 {today.day}일</span>
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
                              <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 8 }}>오늘 별숨을 모두 읽었어요 · 내일 다시 만나요 🌙</div>
                            )}
                          </>
                        ) : (
                          <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '18px', fontSize: 'var(--md)', fontWeight: 700 }} onClick={askDailyHoroscope}>
                            오늘 별숨의 기운 확인하기 ✦
                          </button>
                        );
                        return (
                          <>
                            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em', paddingTop: 6, marginBottom: 6 }}>
                              ✦ 오늘 하루 나의 별숨 · {today.month}월 {today.day}일
                              <span style={{ marginLeft: 6, opacity: 0.6 }}>매일 새로워져요</span>
                            </div>
                            {dailyCardContent}
                          </>
                        );
                      })()}

                      {/* 별 메시지 */}
                      <div style={{ padding: '14px 0 4px', borderTop: '1px solid var(--line)', marginTop: 6 }}>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 4, letterSpacing: '.06em' }}>✦ {today.month}월 {today.day}일의 별 메시지</div>
                        <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.75 }}>"{getDailyWord(today.day)}"</div>
                      </div>

                      {/* 별숨달력 */}
                      {formOk && (
                        <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '12px', background: 'none', border: '1px solid var(--line)', color: 'var(--t2)' }} onClick={() => setStep(10)}>
                          🗓️ 별숨달력 ✦
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── 미션 현황 (달성 시 보상 느낌으로 하단에 조용히 배치) ── */}
                  {missions.length > 0 && (
                    <div style={{ marginTop: 'var(--sp3)' }}>
                      <MissionDashboard missions={missions} onMissionComplete={onCompleteMission} />
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
          { label: form.name || '나', bm: form.bm, bd: form.bd },
          ...(otherProfiles || []).map(p => ({ label: p.name || '이름없음', bm: p.bm, bd: p.bd })),
        ];
        const cards = all
          .map(p => ({ label: p.label, dday: getBdayDday(p.bm, p.bd) }))
          .filter(c => c.dday !== null && c.dday <= 30)
          .sort((a, b) => a.dday - b.dday);
        if (cards.length === 0) return null;
        return (
          <div style={{ padding: '0 var(--sp3) var(--sp2)' }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 8, letterSpacing: '.04em' }}>🎂 다가오는 생일</div>
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
            <div className="daily-label">✦ {today.month}월 {today.day}일의 별 메시지</div>
            <div className="daily-text">{'"' + getDailyWord(today.day) + '"'}</div>
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
