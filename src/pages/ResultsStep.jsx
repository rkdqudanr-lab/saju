import { useEffect, useRef, useState } from "react";
import { ON } from "../utils/saju.js";
import { parseAccSummary, breakAtNatural, SIGN_MOOD } from "../utils/constants.js";
import AccItem, { FeedbackBtn } from "../components/AccItem.jsx";
import PrecisionNudge from "../components/PrecisionNudge.jsx";
import { postAsk } from "../lib/askApi.js";
import { useUserCtx, useSajuCtx, useGamCtx } from "../context/AppContext.jsx";

function extractFollowUpQuestions(raw) {
  if (!raw) return [];
  let parsed = null;

  try {
    parsed = JSON.parse(raw.trim());
  } catch (e) {
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (e2) {}
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item, i) => {
      if (typeof item === 'string') {
        return { id: `fq_${i + 1}`, text: item };
      }
      if (item && typeof item === 'object' && item.text) {
        return { id: item.id || `fq_${i + 1}`, text: item.text };
      }
      return null;
    }).filter(Boolean);
  }
  return [];
}

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
  kakaoLogin, genReport, resetSession, onEnterChat,
}) {
  const { user, form, showToast } = useUserCtx();
  const { saju, sun, moon, asc, today, formOk } = useSajuCtx();
  const { gamificationState } = useGamCtx();

  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [unlockedAnswers, setUnlockedAnswers] = useState(new Set([0]));
  // 무한 루프 방지: fetch 시도 여부 추적 (parse 실패해도 재시도하지 않음)
  const followUpAttemptedRef = useRef(false);

  // 첫 번째 답변이 타이핑 완료되면 후속 질문 생성
  useEffect(() => {
    if (typedSet.has(0) && followUpQuestions.length === 0 && !loadingFollowUp && !followUpAttemptedRef.current) {
      followUpAttemptedRef.current = true;
      const fetchFollowUp = async () => {
        setLoadingFollowUp(true);
        try {
          const data = await postAsk({
            userMessage: `방금 답변한 내용을 바탕으로 후속 질문 5개를 만들어줘. (답변 요약: ${answers[0].slice(0, 100)})`,
            isFollowUpQ: true,
            kakaoId: user?.id,
          });
          if (data.text) {
            const parsed = extractFollowUpQuestions(data.text);
            if (parsed.length > 0) {
              setFollowUpQuestions(parsed);
            }
          }
        } catch (err) {
          console.error('Failed to fetch follow-up questions:', err);
        } finally {
          setLoadingFollowUp(false);
        }
      };
      fetchFollowUp();
    }
  }, [typedSet, answers, followUpQuestions.length, loadingFollowUp, user?.id]);

  const handleFollowUpClick = (q) => {
    if (q.id === 'fq_custom') {
      onEnterChat();
    } else {
      onEnterChat(q.text);
    }
  };

  const handleUnlock = async (index) => {
    if (unlockedAnswers.has(index)) return;

    const result = await spendBP?.(UNLOCK_COST, `answer_unlock_${index}`);
    if (!result?.success) {
      showToast?.('BP가 부족하거나 잠금 해제에 실패했어요.', 'error');
      return;
    }

    setUnlockedAnswers((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    showToast?.(`답변이 열렸어요. -${UNLOCK_COST} BP`, 'success');
  };

  return (
    <div className="page-top">
      <div className="res-wrap" ref={resultsRef} role="region" aria-label="별숨 응답">
        <div className="res-card">
          <div className="res-top-bar">
            <button className="res-top-btn" onClick={() => { navigator.clipboard?.writeText(answers.join('\n\n')).then(() => showToast?.('복사했어요', 'success')); }}>복사</button>
            {answers[0] && <button className="res-top-btn" onClick={() => shareCard(0)}>이미지</button>}
            {answers[0] && <button className="res-top-btn primary" onClick={handleShareFortuneCard}>카드 저장</button>}
            {answers[0] && <button className="res-top-btn primary" onClick={() => shareResult('result')}>공유</button>}
          </div>

          <div className="res-header">
            <div className="res-av">✨</div>
            <div>
              <div className="res-name">{(form.nickname || form.name) ? `${form.nickname || form.name}님께 전하는 별의 이야기` : '오늘 밤 당신께 전하는 이야기'}</div>
              <div className="res-chips">
                {saju && <div className="res-chip">{ON[saju.dom]} 기운</div>}
                {sun && <div className="res-chip">{sun.s} {sun.n}</div>}
                {moon && <div className="res-chip">달 {moon.n}</div>}
                {asc && <div className="res-chip">상승 {asc.n}</div>}
                <div className="res-chip">{today.month}/{today.day}</div>
              </div>
            </div>
          </div>

          {sun && (() => {
            const mood = SIGN_MOOD[sun.n] || { color: 'var(--gold)', bg: 'var(--goldf)', word: '부드러운', emoji: '✨' };
            return (
              <div className="mood-banner" style={{ background: mood.bg, borderColor: `${mood.color}33` }}>
                <div className="mood-orb" style={{ background: `${mood.color}22`, border: `1px solid ${mood.color}44` }}>{mood.emoji}</div>
                <div>
                  <div className="mood-label">오늘의 별자리 기운</div>
                  <div className="mood-word" style={{ color: mood.color }}>{mood.word} 흐름이 보여요</div>
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
                    <span className="star-summary-icon">🌙</span>
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
                        text={answers[i] ? `${answers[i].slice(0, 80)}...` : ''}
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
                      <div className="unlock-title">Q{i + 1} 이야기가 잠겨 있어요</div>
                      <div className="unlock-desc">BP {UNLOCK_COST}로 열 수 있어요. 현재 {gamificationState?.currentBp || 0}BP</div>
                      <button className="unlock-bp-btn" onClick={() => handleUnlock(i)}>
                        {UNLOCK_COST}BP로 열기
                      </button>
                      <button className="unlock-premium-btn" onClick={() => setShowUpgradeModal(true)}>
                        프리미엄으로 전체 보기
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <AccItem
                      q={q}
                      text={parseAccSummary(answers[i] || '').text}
                      idx={i}
                      isOpen={openAcc === i}
                      onToggle={() => handleAccToggle(i)}
                      shouldType={!typedSet.has(i)}
                      onTypingDone={handleTypingDone}
                      onRetry={() => retryAnswer(i)}
                    />
                    {openAcc === i && typedSet.has(i) && answers[i] && (
                      <div style={{ padding: '0 var(--sp4) var(--sp2)', borderBottom: '1px solid var(--line)' }}>
                        <div style={{ padding: '8px 12px', background: 'rgba(232,176,72,0.05)', borderRadius: 'var(--r1)', marginBottom: 12 }}>
                          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 8 }}>✦ 별숨이 추천하는 다음 질문</div>
                          {loadingFollowUp ? (
                            <div className="typing-dots" style={{ padding: '8px 0' }}><span /><span /><span /></div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {followUpQuestions.map((fq) => (
                                <button
                                  key={fq.id}
                                  onClick={() => handleFollowUpClick(fq)}
                                  style={{
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    border: '1px solid var(--line)',
                                    background: 'var(--bg1)',
                                    color: 'var(--t2)',
                                    fontSize: 'var(--sm)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {fq.text}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FeedbackBtn qIdx={i} />
                          <button className="res-top-btn" style={{ fontSize: 'var(--xs)' }} onClick={() => shareCard(i)}>Q{i + 1} 이미지 저장</button>
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
            <div style={{ marginBottom: 'var(--sp2)', animation: 'fadeUp .4s ease' }}>
              <button
                onClick={() => (typeof onEnterChat === 'function' ? onEnterChat() : setStep(5))}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--r2)',
                  background: 'linear-gradient(135deg, var(--goldf), rgba(155,142,196,.08))',
                  border: '1.5px solid var(--acc)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>💬</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--gold)', marginBottom: 2 }}>별숨과 더 깊은 대화하기</div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>방금 본 해석을 이어서 자연스럽게 대화해요</div>
                </div>
                <span style={{ fontSize: '1.1rem', color: 'var(--gold)', flexShrink: 0 }}>→</span>
              </button>
            </div>

            {!user && (
              <div className="kakao-nudge">
                <span style={{ fontSize: '1.1rem' }}>🔔</span>
                <span className="kakao-nudge-text">로그인하면 개인 운세와 질문 기록이 모두 저장돼요</span>
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
                <div className="kcr-title">매일 별숨 받기</div>
                <div className="kcr-desc">카카오 채널을 추가하면 매주 한 번씩 운세를 받아볼 수 있어요</div>
              </div>
              <a className="kcr-btn" href="https://pf.kakao.com/_msCVX/friend" target="_blank" rel="noopener noreferrer" aria-label="카카오 채널 친구 추가">채널 추가</a>
            </div>

            <div className="feature-guide">
              <div className="feature-guide-title">별숨의 다른 기능들</div>
              <div className="feature-guide-grid">
                <button className="fg-card" onClick={() => setStep(35)}><span className="fg-icon" style={{ fontSize: 18 }}>🔤</span><div className="fg-info"><div className="fg-name">이름 풀이</div><div className="fg-desc">기운에 맞는 이름 흐름을 확인해요</div></div></button>
                <button className="fg-card" onClick={() => setStep(7)}><span className="fg-icon" style={{ fontSize: 18 }}>💕</span><div className="fg-info"><div className="fg-name">사이 별점</div><div className="fg-desc">두 사람의 흐름을 사주와 별자리로 봐요</div></div></button>
                <button className="fg-card" onClick={() => setShowSidebar(true)}><span className="fg-icon" style={{ fontSize: 18 }}>📚</span><div className="fg-info"><div className="fg-name">지난 이야기</div><div className="fg-desc">내가 별숨에게 물었던 기록 보기</div></div></button>
                <button className="fg-card" onClick={handleCopyAll}>
                  <span className="fg-icon">{copyDone ? '✓' : '📋'}</span>
                  <div className="fg-info">
                    <div className="fg-name">전체 복사</div>
                    <div className="fg-desc">{copyDone ? '복사했어요' : '오늘 받은 모든 응답을 한 번에 복사해요'}</div>
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

