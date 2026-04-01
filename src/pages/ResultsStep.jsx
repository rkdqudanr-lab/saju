import { ON } from "../utils/saju.js";
import { parseAccSummary, PKGS, SIGN_MOOD, CHAT_SUGG } from "../utils/constants.js";
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

          <div className="res-header">
            <div className="res-av">✦</div>
            <div>
              <div className="res-name">{form.name ? `${form.name}에게 전하는 별의 이야기` : '오늘 밤 당신에게 전하는 이야기'}</div>
              <div className="res-chips">
                {saju && <div className="res-chip">🀄 {ON[saju.dom]} 기운</div>}
                {sun && <div className="res-chip">{sun.s} {sun.n}</div>}
                {moon && <div className="res-chip">🌙 달 {moon.n}</div>}
                {asc && <div className="res-chip">↑ {asc.n}</div>}
                <div className="res-chip">📅 {today.month}월 {today.day}일</div>
              </div>
            </div>
          </div>

          {sun && (() => {
            const mood = SIGN_MOOD[sun.n] || { color: 'var(--gold)', bg: 'var(--goldf)', word: '신비로운', emoji: '✦' };
            return (
              <div className="mood-banner" style={{ background: mood.bg, borderColor: mood.color + '33' }}>
                <div className="mood-orb" style={{ background: mood.color + '22', border: `1px solid ${mood.color}44` }}>{mood.emoji}</div>
                <div>
                  <div className="mood-label">오늘의 별자리 기운</div>
                  <div className="mood-word" style={{ color: mood.color }}>{mood.word} 하루예요</div>
                </div>
              </div>
            );
          })()}

          {answers[0] && (() => {
            const summaryStr = parseAccSummary(answers[0]).summary;
            return summaryStr ? (
              <div className="star-summary">
                <span className="star-summary-icon">✦</span>
                <span className="star-summary-text">{summaryStr}</span>
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

            <div className="upsell">
              <div className="up-t">✦ 이번 달 전체 운세가 궁금해요</div>
              <div className="up-d">연애 · 재물 · 건강 · 직업 종합 분석<br />사주와 별자리가 함께 쓴 월간 에세이</div>
              <button className="up-btn" onClick={() => setStep(6)}>이달의 운세 리포트 보기 ✦</button>
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

            <div className="feature-guide">
              <div className="feature-guide-title">✦ 별숨의 다른 기능들</div>
              <div className="feature-guide-grid">
                <button className="fg-card" onClick={() => setStep(7)}><span className="fg-icon">💞</span><div className="fg-info"><div className="fg-name">사이 별점</div><div className="fg-desc">두 사람의 사주+별자리로 관계 시나리오 읽기</div></div></button>
                <button className="fg-card" onClick={() => setStep(8)}><span className="fg-icon">🔮</span><div className="fg-info"><div className="fg-name">별숨의 예언</div><div className="fg-desc">1개월~30년 후의 나에게 전하는 예언</div></div></button>
                <button className="fg-card" onClick={() => setStep(6)}><span className="fg-icon">📜</span><div className="fg-info"><div className="fg-name">월간 리포트</div><div className="fg-desc">이달의 연애·재물·직업·건강 에세이</div></div></button>
                <button className="fg-card" onClick={() => setStep(5)}><span className="fg-icon">💬</span><div className="fg-info"><div className="fg-name">별숨에게 더 물어보기</div><div className="fg-desc">답변 기반 후속 상담 채팅</div></div></button>
                <button className="fg-card" onClick={() => setShowSidebar(true)}><span className="fg-icon">🗂️</span><div className="fg-info"><div className="fg-name">지난 이야기</div><div className="fg-desc">내가 별숨에 물었던 모든 질문 기록</div></div></button>
                <button className="fg-card" onClick={handleCopyAll}>
                  <span className="fg-icon">{copyDone ? '✅' : '📋'}</span>
                  <div className="fg-info">
                    <div className="fg-name">전체 복사</div>
                    <div className="fg-desc">{copyDone ? '복사됐어요!' : '오늘 받은 모든 답변 클립보드 복사'}</div>
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
