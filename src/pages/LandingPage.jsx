import { Suspense } from "react";
import { getDailyWord, CATS_ALL, REVIEWS, DAILY_QUESTIONS } from "../utils/constants.js";
import { isTodayAnswered } from "../utils/quiz.js";
import DailyStarCard from "../components/DailyStarCard.jsx";
import SamplePreview from "../components/SamplePreview.jsx";
const DiaryPage = /* @__PURE__ */ (() => import("../components/DiaryPage.jsx"))();

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

function LazyDiaryPage(props) {
  const Comp = require('../components/DiaryPage.jsx').default ?? null;
  return Comp ? <Comp {...props} /> : null;
}

export default function LandingPage({
  user, form, saju, sun, today,
  formOk, profile,
  quiz, quizInput, setQuizInput,
  dailyResult, dailyLoading, dailyCount, DAILY_MAX,
  diaryReviewResult, diaryReviewLoading,
  showDailyCard, setShowDailyCard,
  buildCtx,
  setStep, setDiy,
  kakaoLogin, kakaoLogout,
  setEditingMyProfile, setShowProfileModal,
  askDailyHoroscope, askDiaryReview, resetDiaryReview,
  handleQuizAnswer, handleQuizSkip,
  DiaryPageLazy,
}) {
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
                  {(() => {
                    const isAfter5 = new Date().getHours() >= 17;
                    if (isAfter5) {
                      return (
                        <>
                          <button
                            onClick={() => setShowDailyCard(v => !v)}
                            style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '10px 14px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <span>✦ 오늘 하루 나의 별숨 · {today.month}월 {today.day}일</span>
                            <span style={{ fontSize: '0.7em', opacity: 0.6 }}>{showDailyCard ? '▲ 접기' : '▼ 보기'}</span>
                          </button>
                          {showDailyCard && (
                            <div style={{ marginTop: 8 }}>
                              {dailyLoading ? (
                                <div className="dsc-loading-btn">
                                  <span>별숨이 오늘을 읽고 있어요</span>
                                  <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
                                </div>
                              ) : dailyResult ? (
                                <>
                                  <DailyStarCard result={dailyResult} />
                                  {dailyCount < DAILY_MAX ? (
                                    <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '12px', marginTop: 8, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={askDailyHoroscope}>
                                      다시 물어보기 ✦ ({dailyCount}/{DAILY_MAX})
                                    </button>
                                  ) : (
                                    <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 8 }}>오늘 별숨을 모두 읽었어요 · 내일 다시 만나요 🌙</div>
                                  )}
                                </>
                              ) : (
                                <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px' }} onClick={askDailyHoroscope}>오늘 기운 확인하기 ✦</button>
                              )}
                            </div>
                          )}

                          <Suspense fallback={<PageSpinner />}>
                            {DiaryPageLazy && (
                              <DiaryPageLazy
                                user={user} form={form} saju={saju} sun={sun} buildCtx={buildCtx}
                                askReview={askDiaryReview} setStep={setStep} embedded={true}
                                diaryReviewResult={diaryReviewResult} diaryReviewLoading={diaryReviewLoading}
                              />
                            )}
                          </Suspense>

                          {diaryReviewResult && (
                            <button onClick={resetDiaryReview} style={{ width: '100%', padding: '11px', background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t3)', fontFamily: 'var(--ff)', fontSize: 'var(--xs)', cursor: 'pointer', marginBottom: 8 }}>
                              ← 다시 쓰기
                            </button>
                          )}
                          <button className="cta-main" style={{ alignSelf: 'stretch', marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: diaryReviewResult ? 0 : 10, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={() => setStep(formOk ? 2 : 1)}>
                            별숨에게 질문하기 ✦
                          </button>
                        </>
                      );
                    }
                    return (
                      <>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em', paddingTop: 6, marginBottom: 6 }}>
                          ✦ 오늘 하루 나의 별숨 · {today.month}월 {today.day}일
                          <span style={{ marginLeft: 6, opacity: 0.6 }}>매일 새로워져요</span>
                        </div>
                        {dailyLoading ? (
                          <div className="dsc-loading-btn">
                            <span>별숨이 오늘을 읽고 있어요</span>
                            <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
                          </div>
                        ) : dailyResult ? (
                          <>
                            <DailyStarCard result={dailyResult} />
                            {dailyCount < DAILY_MAX ? (
                              <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '12px', marginTop: 8, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={askDailyHoroscope}>
                                다시 물어보기 ✦ ({dailyCount}/{DAILY_MAX})
                              </button>
                            ) : (
                              <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 8 }}>오늘 별숨을 모두 읽었어요 · 내일 다시 만나요 🌙</div>
                            )}
                          </>
                        ) : (
                          <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px' }} onClick={askDailyHoroscope}>오늘 기운 확인하기 ✦</button>
                        )}
                        <button className="cta-main" style={{ alignSelf: 'stretch', marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={() => setStep(formOk ? 2 : 1)}>
                          별숨에게 질문하기 ✦
                        </button>
                      </>
                    );
                  })()}

                  {/* ── 오늘 별숨의 질문 ── */}
                  {(() => {
                    const rawQIdx = quiz.nextQIdx || 0;
                    const todayDone = isTodayAnswered(quiz);
                    const answeredCount = Object.keys(quiz.answers || {}).length;

                    let qIdx = rawQIdx;
                    while (qIdx < DAILY_QUESTIONS.length) {
                      const cq = DAILY_QUESTIONS[qIdx];
                      if (cq.field && profile[cq.field]) { qIdx++; } else { break; }
                    }

                    let cycleNote = null;
                    if (qIdx >= DAILY_QUESTIONS.length) {
                      const firstUnanswered = DAILY_QUESTIONS.findIndex(dq => !quiz.answers?.[dq.id]);
                      if (firstUnanswered >= 0) { qIdx = firstUnanswered; cycleNote = '모든 질문을 한 바퀴 돌았어요. 아직 남은 질문이에요 🌀'; }
                    }

                    const allDone = qIdx >= DAILY_QUESTIONS.length;
                    const q = allDone ? null : DAILY_QUESTIONS[qIdx];
                    const lastAnsweredQ = rawQIdx > 0 ? DAILY_QUESTIONS[Math.min(rawQIdx - 1, DAILY_QUESTIONS.length - 1)] : null;
                    const lastAnsweredVal = lastAnsweredQ ? quiz.answers?.[lastAnsweredQ.id] : null;

                    return (
                      <div style={{ marginTop: 10, marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', border: '1px solid var(--line)' }}>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
                          ✦ 오늘 별숨의 질문 {answeredCount > 0 && <span style={{ fontWeight: 400, color: 'var(--t4)', marginLeft: 6 }}>{answeredCount}개 답했어요</span>}
                        </div>

                        {allDone ? (
                          <>
                            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7, marginBottom: 10 }}>
                              별숨이 당신을 잘 알게 됐어요 🌟<br/>
                              <span style={{ color: 'var(--t4)', fontSize: 'var(--xs)' }}>{answeredCount}개의 이야기를 모두 들었어요</span>
                            </div>
                            <button onClick={() => setShowProfileModal(true)} style={{ fontSize: 'var(--xs)', color: 'var(--gold)', background: 'none', border: 'none', fontFamily: 'var(--ff)', cursor: 'pointer', padding: 0 }}>
                              별숨에게 나를 알려주기 →
                            </button>
                          </>
                        ) : todayDone ? (
                          <>
                            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.7, marginBottom: 6 }}>"{lastAnsweredQ?.q}"</div>
                            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 8 }}>→ {lastAnsweredVal || '저장됐어요'} ✓</div>
                            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>내일 새로운 질문이 기다리고 있어요 🌙</div>
                          </>
                        ) : (
                          <>
                            {cycleNote && <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 8 }}>{cycleNote}</div>}
                            <div style={{ fontSize: 'var(--base)', color: 'var(--t1)', fontWeight: 500, lineHeight: 1.6, marginBottom: 4 }}>"{q.q}"</div>
                            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6, marginBottom: 12 }}>{q.sub}</div>

                            {(q.type === 'chips' || q.type === 'mixed') && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {q.chips.map(chip => (
                                  <button key={chip} onClick={() => handleQuizAnswer(q, chip)}
                                    style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--line)', background: 'transparent', color: 'var(--t2)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', transition: 'all .15s' }}
                                    onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--gold)'; }}
                                    onMouseLeave={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.color = 'var(--t2)'; }}>
                                    {chip}
                                  </button>
                                ))}
                              </div>
                            )}

                            {(q.type === 'text' || q.type === 'mixed') && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <input className="chat-inp"
                                  placeholder={q.placeholder || '직접 입력'}
                                  value={quizInput}
                                  onChange={e => setQuizInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleQuizAnswer(q, quizInput)}
                                  style={{ flex: 1 }} />
                                <button className="chat-send" onClick={() => handleQuizAnswer(q, quizInput)} disabled={!quizInput.trim()} style={{ flexShrink: 0 }}>✦</button>
                              </div>
                            )}

                            <button onClick={() => handleQuizSkip(qIdx)} style={{ marginTop: 10, fontSize: 'var(--xs)', color: 'var(--t4)', background: 'none', border: 'none', fontFamily: 'var(--ff)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                              건너뛸게요
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── 오늘의 추천질문 ── */}
                  {formOk && (() => {
                    const allQs = CATS_ALL.flatMap(c => c.qs.map(q => ({ q, icon: c.icon, label: c.label })));
                    const dayOfYear = Math.floor((new Date(today.year, today.month - 1, today.day) - new Date(today.year, 0, 0)) / 86400000);
                    const recQ = allQs[(today.year * 1000 + dayOfYear) % allQs.length];
                    return recQ ? (
                      <button
                        onClick={() => { setDiy(recQ.q); setStep(2); }}
                        style={{ alignSelf: 'stretch', marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', marginTop: 10, background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '12px 14px', color: 'var(--t2)', fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer', textAlign: 'left', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 4 }}
                      >
                        <span style={{ color: 'var(--gold)', fontSize: 'var(--xs)' }}>{recQ.icon} 오늘의 추천질문</span>
                        <span>"{recQ.q}"</span>
                      </button>
                    ) : null;
                  })()}

                  {/* ── 별숨달력 ── */}
                  {formOk && (
                    <button className="cta-main" style={{ alignSelf: 'stretch', marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid var(--line)', color: 'var(--t2)' }} onClick={() => setStep(10)}>
                      🗓️ 별숨달력 ✦
                    </button>
                  )}

                  {/* ── 별 메시지 ── */}
                  <div style={{ padding: '16px 0 8px', marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', borderTop: '1px solid var(--line)', marginTop: 6 }}>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 4, letterSpacing: '.06em' }}>✦ {today.month}월 {today.day}일의 별 메시지</div>
                    <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.75 }}>"{getDailyWord(today.day)}"</div>
                  </div>
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
