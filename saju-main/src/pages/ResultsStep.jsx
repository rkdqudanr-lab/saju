import { ON } from "../utils/saju.js";
import { parseAccSummary, breakAtNatural, PKGS, SIGN_MOOD, CHAT_SUGG } from "../utils/constants.js";
import AccItem, { FeedbackBtn } from "../components/AccItem.jsx";

export default function ResultsStep({
  form, saju, sun, moon, asc, today,
  selQs, answers, openAcc, typedSet,
  cat, pkg,
  chatLeft, curPkg,
  showSubNudge,
  user, copyDone,
  formOk, resultsRef,
  handleAccToggle, handleTypingDone, retryAnswer,
  shareCard, handleCopyAll, shareResult,
  setStep, setSelQs, setDiy, setShowSidebar, setShowUpgradeModal,
  kakaoLogin, genReport, resetSession,
  showToast,
}) {
  return (
    <div className="page-top">
      <div className="res-wrap" ref={resultsRef} role="region" aria-label="별숨의 답변">
        <div className="res-card">
          <div className="res-top-bar">
            <button className="res-top-btn" onClick={() => { navigator.clipboard?.writeText(answers.join('\n\n')).then(() => showToast?.('복사됐어요 📋', 'success')); }}>📋 복사</button>
            {answers[0] && <button className="res-top-btn" onClick={() => shareCard(0)}>🖼 저장</button>}
            {answers[0] && <button className="res-top-btn primary" onClick={() => shareResult('result')}>↗ 공유</button>}
          </div>

          <div className="res-header" style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
            <div className="res-av" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gold-grad)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--lg)', flexShrink: 0, boxShadow: '0 0 20px var(--gold-glow)' }}>✦</div>
            <div style={{ textAlign: 'left' }}>
              <div className="res-name" style={{ fontSize: 'var(--md)', fontWeight: 800, color: 'var(--t1)', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.4 }}>{form.name ? `${form.name}에게 전하는\n별의 이야기` : '오늘 밤 당신에게\n전하는 이야기'}</div>
              <div className="res-chips" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {saju && <div className="res-chip" style={{ fontSize: 'var(--xxs)', padding: '3px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--t2)', border: '0.5px solid var(--line)' }}>🀄 {ON[saju.dom]} 기운</div>}
                {sun && <div className="res-chip" style={{ fontSize: 'var(--xxs)', padding: '3px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--t2)', border: '0.5px solid var(--line)' }}>{sun.s} {sun.n}</div>}
                <div className="res-chip" style={{ fontSize: 'var(--xxs)', padding: '3px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--t2)', border: '0.5px solid var(--line)' }}>📅 {today.month}/{today.day}</div>
              </div>
            </div>
          </div>

          {sun && (() => {
            const mood = SIGN_MOOD[sun.n] || { color: 'var(--gold)', bg: 'var(--goldf)', word: '신비로운', emoji: '✦' };
            return (
              <div className="mood-banner" style={{ background: mood.bg, border: `0.5px solid ${mood.color}25`, padding: '16px', borderRadius: 'var(--r2)', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20, backdropFilter: 'blur(8px)' }}>
                <div className="mood-orb" style={{ width: 36, height: 36, borderRadius: '50%', background: `${mood.color}15`, border: `0.5px solid ${mood.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--sm)' }}>{mood.emoji}</div>
                <div style={{ textAlign: 'left' }}>
                  <div className="mood-label" style={{ fontSize: '10px', color: 'var(--t4)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>TODAY'S ORBIT</div>
                  <div className="mood-word" style={{ color: mood.color, fontSize: 'var(--sm)', fontWeight: 700 }}>{mood.word} 하루예요</div>
                </div>
              </div>
            );
          })()}

          {answers[0] && (() => {
            const summaryStr = parseAccSummary(answers[0]).summary;
            return summaryStr ? (
              <div className="star-summary">
                <span className="star-summary-icon">✦</span>
                <span className="star-summary-text">{breakAtNatural(summaryStr)}</span>
              </div>
            ) : null;
          })()}

          {selQs.map((q, i) => (
            <div key={i}>
              <AccItem
                q={q} text={parseAccSummary(answers[i] || '').text} idx={i}
                isOpen={openAcc === i}
                onToggle={() => handleAccToggle(i)}
                shouldType={!typedSet.has(i)}
                onTypingDone={handleTypingDone}
                onRetry={() => retryAnswer(i)}
              />
              {openAcc === i && typedSet.has(i) && answers[i] && (
                <div style={{ padding: '0 var(--sp4) var(--sp2)', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FeedbackBtn qIdx={i} />
                    <button className="res-top-btn" style={{ fontSize: 'var(--xs)' }} onClick={() => shareCard(i)}>↗ Q{i + 1} 이미지 저장</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="res-actions">
            {showSubNudge && (
              <div style={{ padding: 'var(--sp2) var(--sp3)', background: 'linear-gradient(135deg, var(--goldf), rgba(155,142,196,.08))', border: '1px solid var(--acc)', borderRadius: 'var(--r2)', marginBottom: 'var(--sp2)', display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp .4s ease' }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>✦</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--sm)', fontWeight: 600, color: 'var(--gold)', marginBottom: 3 }}>더 깊은 이야기가 있어요</div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>채팅으로 더 물어보거나, 이달 전체 리포트를 받아봐요</div>
                </div>
                <button className="up-btn" style={{ width: 'auto', padding: '8px 16px', flexShrink: 0, fontSize: 'var(--xs)' }} onClick={() => setStep(5)}>더 물어보기</button>
              </div>
            )}

            {curPkg.chat > 0 && (
              <button className="chat-cta-large" onClick={() => setStep(5)}>
                <span className="chat-cta-emoji">💬</span>
                <div className="chat-cta-info">
                  <div className="chat-cta-title">별숨과 더 깊은 대화하기</div>
                  <div className="chat-cta-desc">답변 내용으로 더 자세히 물어봐요</div>
                </div>
                <span style={{ fontSize: '1.1rem', color: 'var(--gold)', flexShrink: 0 }}>→</span>
              </button>
            )}

            <div className="action-grid" style={{ marginBottom: 'var(--sp2)' }}>
              {['love', 'family', 'relation'].includes(cat?.id ?? '') ? (
                <div className="action-card compat" onClick={() => setStep(7)}>
                  <div className="action-card-icon">💞</div>
                  <div className="action-card-title">우리가 만나면</div>
                  <div className="action-card-sub">두 사람의 별이 만나는 시나리오</div>
                </div>
              ) : (
                <div className="action-card" style={{ borderColor: 'var(--tealacc)' }} onClick={() => setStep(6)}>
                  <div className="action-card-icon">📜</div>
                  <div className="action-card-title">{cat?.label || '심층'} 심층 분석</div>
                  <div className="action-card-sub">이 분야만 깊게 파고들기</div>
                </div>
              )}
              <div className="action-card letter" onClick={() => setStep(8)}>
                <div className="action-card-icon">🔮</div>
                <div className="action-card-title">별숨의 예언</div>
                <div className="action-card-sub">시간이 흐른 뒤의 나의 예언</div>
              </div>
            </div>

            {!user && (
              <div className="kakao-nudge">
                <span style={{ fontSize: '1.1rem' }}>🌙</span>
                <span className="kakao-nudge-text">로그인하면 연인 운세 · 직장 맞춤 · 내 기록이 모두 저장돼요</span>
                <button className="kakao-btn" style={{ width: 'auto', padding: '6px 14px', fontSize: 'var(--xs)' }} onClick={() => { if (typeof window.gtag === 'function') window.gtag('event', 'kakao_login_click'); kakaoLogin(); }}>카카오 로그인</button>
              </div>
            )}

            <div className="upsell" style={{ background: 'var(--bg-glass-heavy)', border: '0.5px solid var(--line)', borderRadius: 'var(--r2)', padding: '24px 20px', textAlign: 'center', marginBottom: 20, boxShadow: 'var(--shadow)', backdropFilter: 'blur(10px)' }}>
              <div className="up-t" style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--gold)', marginBottom: 8, letterSpacing: '-0.01em' }}>✦ 이번 달 전체 운세가 궁금해요</div>
              <div className="up-d" style={{ fontSize: 'var(--xxs)', color: 'var(--t3)', lineHeight: 1.7, marginBottom: 20, wordBreak: 'keep-all' }}>연애 · 재물 · 건강 · 직업 종합 분석<br />사주와 별자리가 함께 쓴 월간 에세이</div>
              <button className="up-btn" onClick={() => setStep(6)} style={{ width: '100%', padding: '14px', background: 'var(--gold-grad)', border: 'none', borderRadius: 'var(--r1)', color: '#000', fontWeight: 700, fontSize: 'var(--sm)', cursor: 'pointer' }}>이달의 운세 리포트 보기 ✦</button>
            </div>

            <div className="res-btns">
              <button className="res-btn" onClick={() => { setSelQs([]); setDiy(''); resetSession(); setStep(formOk ? 2 : 1); }}>다른 질문</button>
              <button className="res-btn" onClick={() => setShowSidebar(true)}>지난 이야기</button>
              <button className="res-btn" onClick={() => setStep(0)}>홈으로</button>
            </div>

            <div className="kakao-channel-remind">
              <div className="kcr-icon">💌</div>
              <div className="kcr-body">
                <div className="kcr-title">내일 별숨 받기</div>
                <div className="kcr-desc">카카오 채널을 추가하면 매주 나만의 운세를 받을 수 있어요</div>
              </div>
              <a className="kcr-btn" href="https://pf.kakao.com/_msCVX/friend" target="_blank" rel="noopener noreferrer" aria-label="카카오 채널 친구 추가">채널 추가</a>
            </div>

            <div className="feature-guide" style={{ marginTop: 24 }}>
              <div className="feature-guide-title" style={{ fontSize: 'var(--xxs)', color: 'var(--t4)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>STELLAR UTILITIES</div>
              <div className="feature-guide-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <button className="fg-card" onClick={() => setStep(7)} style={{ background: 'var(--bg-glass)', border: '0.5px solid var(--line)', borderRadius: 'var(--r1)', padding: '14px 10px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="fg-icon" style={{ fontSize: 'var(--md)' }}>💞</span>
                  <div className="fg-info">
                    <div className="fg-name" style={{ fontSize: 'var(--xxs)', fontWeight: 700, color: 'var(--t1)' }}>사이 별점</div>
                    <div className="fg-desc" style={{ fontSize: '9px', color: 'var(--t4)', lineHeight: 1.4 }}>두 사람의 관계 시나리오</div>
                  </div>
                </button>
                <button className="fg-card" onClick={() => setStep(8)} style={{ background: 'var(--bg-glass)', border: '0.5px solid var(--line)', borderRadius: 'var(--r1)', padding: '14px 10px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="fg-icon" style={{ fontSize: 'var(--md)' }}>🔮</span>
                  <div className="fg-info">
                    <div className="fg-name" style={{ fontSize: 'var(--xxs)', fontWeight: 700, color: 'var(--t1)' }}>별숨의 예언</div>
                    <div className="fg-desc" style={{ fontSize: '9px', color: 'var(--t4)', lineHeight: 1.4 }}>먼 미래의 나에게 전하는</div>
                  </div>
                </button>
                <button className="fg-card" onClick={() => setStep(6)} style={{ background: 'var(--bg-glass)', border: '0.5px solid var(--line)', borderRadius: 'var(--r1)', padding: '14px 10px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="fg-icon" style={{ fontSize: 'var(--md)' }}>📜</span>
                  <div className="fg-info">
                    <div className="fg-name" style={{ fontSize: 'var(--xxs)', fontWeight: 700, color: 'var(--t1)' }}>월간 리포트</div>
                    <div className="fg-desc" style={{ fontSize: '9px', color: 'var(--t4)', lineHeight: 1.4 }}>이달의 종합 분석 에세이</div>
                  </div>
                </button>
                <button className="fg-card" onClick={handleCopyAll} style={{ background: 'var(--bg-glass)', border: '0.5px solid var(--line)', borderRadius: 'var(--r1)', padding: '14px 10px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="fg-icon" style={{ fontSize: 'var(--md)' }}>{copyDone ? '✅' : '📋'}</span>
                  <div className="fg-info">
                    <div className="fg-name" style={{ fontSize: 'var(--xxs)', fontWeight: 700, color: 'var(--t1)' }}>전체 복사</div>
                    <div className="fg-desc" style={{ fontSize: '9px', color: 'var(--t4)', lineHeight: 1.4 }}>{copyDone ? '복사 완료' : '전체 답변 클립보드 저장'}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
