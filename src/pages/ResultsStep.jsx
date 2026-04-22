import { useState } from "react";
import { ON } from "../utils/saju.js";
import { parseAccSummary, breakAtNatural, PKGS, SIGN_MOOD } from "../utils/constants.js";
import AccItem, { FeedbackBtn } from "../components/AccItem.jsx";
import PrecisionNudge from "../components/PrecisionNudge.jsx";
import { useUserCtx } from "../context/AppContext.jsx";
import { useSajuCtx } from "../context/AppContext.jsx";
import { useGamCtx } from "../context/AppContext.jsx";

const UNLOCK_COST = 10;

export default function ResultsStep({
  selQs, answers, openAcc, typedSet,
  cat, pkg,
  chatLeft, curPkg,
  showSubNudge,
  copyDone,
  resultsRef,
  handleAccToggle, handleTypingDone, retryAnswer,
  shareCard, handleCopyAll, shareResult,
  handleShareFortuneCard,
  spendBP,
  setStep, setSelQs, setDiy, setShowSidebar, setShowUpgradeModal,
  kakaoLogin, genReport, resetSession,
}) {
  const { user, form, showToast } = useUserCtx();
  const { saju, sun, moon, asc, today, formOk } = useSajuCtx();
  const { gamificationState } = useGamCtx();

  const [unlockedAnswers, setUnlockedAnswers] = useState(new Set([0]));

  const handleUnlock = async (i) => {
    if (!user) { kakaoLogin(); return; }
    const result = await spendBP(UNLOCK_COST, `answer_unlock_${i}`);
    if (result.success) {
      setUnlockedAnswers(prev => new Set([...prev, i]));
      showToast(`✦ 이야기가 열렸어요 (남은 BP: ${result.newBp})`, 'success');
    } else {
      showToast(result.message || 'BP가 부족해요', 'error');
      setShowUpgradeModal(true);
    }
  };

  return (
    <div className="page-top">
      <div className="res-wrap" ref={resultsRef} role="region" aria-label="별숨의 답변">
        <div className="res-card">
          <div className="res-top-bar">
            <button className="res-top-btn" onClick={() => { navigator.clipboard?.writeText(answers.join('\n\n')).then(() => showToast?.('복사됐어요', 'success')); }}>복사</button>
            {answers[0] && <button className="res-top-btn" onClick={() => shareCard(0)}>이미지</button>}
            {answers[0] && <button className="res-top-btn primary" onClick={handleShareFortuneCard}>카드 ✦</button>}
            {answers[0] && <button className="res-top-btn primary" onClick={() => shareResult('result')}>공유 ↗</button>}
          </div>

          <div className="res-header">
            <div className="res-av">✦</div>
            <div>
              <div className="res-name">{(form.nickname || form.name) ? `${form.nickname || form.name}에게 전하는 별의 이야기` : '오늘 밤 당신에게 전하는 이야기'}</div>
              <div className="res-chips">
                {saju && <div className="res-chip">{ON[saju.dom]} 기운</div>}
                {sun && <div className="res-chip">{sun.s} {sun.n}</div>}
                {moon && <div className="res-chip">달 {moon.n}</div>}
                {asc && <div className="res-chip">↑ {asc.n}</div>}
                <div className="res-chip">{today.month}/{today.day}</div>
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
            const { score: ansScore, summary: summaryStr } = parseAccSummary(answers[0]);
            return (
              <>
                {ansScore !== null && (
                  <div className="acc-score-wrap">
                    <div className="acc-score-value">별숨 점수 <strong>{ansScore}</strong></div>
                  </div>
                )}
                {summaryStr ? (
                  <div className="star-summary">
                    <span className="star-summary-icon">✦</span>
                    <span className="star-summary-text">{breakAtNatural(summaryStr)}</span>
                  </div>
                ) : null}
              </>
            );
          })()}

          {selQs.map((q, i) => {
            const isLocked = i > 0 && curPkg?.isFree && !unlockedAnswers.has(i);
            return (
              <div key={i}>
                {isLocked ? (
                  <div className="answer-locked-wrapper">
                    <div className="answer-locked-blur">
                      <AccItem
                        q={q}
                        text={answers[i] ? answers[i].slice(0, 80) + '...' : ''}
                        idx={i}
                        isOpen={false}
                        onToggle={() => {}}
                        shouldType={false}
                        onTypingDone={() => {}}
                        onRetry={() => {}}
                      />
                    </div>
                    <div className="answer-unlock-overlay">
                      <div className="unlock-icon">🔒</div>
                      <div className="unlock-title">Q{i + 1} 이야기가 잠겨있어요</div>
                      <div className="unlock-desc">별 머니 {UNLOCK_COST}개로 열기 · 현재 {gamificationState?.currentBp || 0}BP</div>
                      <button className="unlock-bp-btn" onClick={() => handleUnlock(i)}>
                        ✦ {UNLOCK_COST}BP로 열기
                      </button>
                      <button className="unlock-premium-btn" onClick={() => setShowUpgradeModal(true)}>
                        프리미엄으로 전체 보기
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            );
          })}

          <PrecisionNudge />

          <div className="res-actions">
            {/* 별숨과 더 깊은 대화하기 CTA */}
            <div style={{ marginBottom: 'var(--sp2)', animation: 'fadeUp .4s ease' }}>
              <button
                onClick={() => setStep(5)}
                style={{
                  width: '100%', padding: '14px', borderRadius: 'var(--r2)',
                  background: 'linear-gradient(135deg, var(--goldf), rgba(155,142,196,.08))',
                  border: '1.5px solid var(--acc)',
                  display: 'flex', alignItems: 'center', gap: 12,
                  fontFamily: 'var(--ff)', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🪬</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--gold)', marginBottom: 2 }}>별숨과 더 깊은 대화하기</div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>답변 기반으로 별숨과 자유롭게 이야기해요</div>
                </div>
                <span style={{ fontSize: '1.1rem', color: 'var(--gold)', flexShrink: 0 }}>→</span>
              </button>
            </div>

            {!user && (
              <div className="kakao-nudge">
                <span style={{ fontSize: '1.1rem' }}>🌙</span>
                <span className="kakao-nudge-text">로그인하면 연인 운세 · 직장 맞춤 · 내 기록이 모두 저장돼요</span>
                <button className="kakao-btn" style={{ width: 'auto', padding: '6px 14px', fontSize: 'var(--xs)' }} onClick={() => { if (typeof window.gtag === 'function') window.gtag('event', 'kakao_login_click'); kakaoLogin(); }}>카카오 로그인</button>
              </div>
            )}

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
                <button className="fg-card" onClick={() => setStep(35)}><span className="fg-icon" style={{ fontSize: 18 }}>✉</span><div className="fg-info"><div className="fg-name">별숨편지</div><div className="fg-desc">기운 맞는 익명의 누군가에게 편지 쓰고 받기</div></div></button>
                <button className="fg-card" onClick={() => setStep(7)}><span className="fg-icon" style={{ fontSize: 18 }}>✦</span><div className="fg-info"><div className="fg-name">사이 별점</div><div className="fg-desc">두 사람의 사주+별자리로 관계 시나리오 읽기</div></div></button>
                <button className="fg-card" onClick={() => setShowSidebar(true)}><span className="fg-icon" style={{ fontSize: 18 }}>≡</span><div className="fg-info"><div className="fg-name">지난 이야기</div><div className="fg-desc">내가 별숨에 물었던 모든 질문 기록</div></div></button>
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
