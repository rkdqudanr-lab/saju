import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import useWordTyping from "../hooks/useWordTyping.js";
import { TIMING } from "../utils/constants.js";

// ═══════════════════════════════════════════════════════════
//  👍👎 피드백 버튼
// ═══════════════════════════════════════════════════════════
export function FeedbackBtn({ qIdx }) {
  const [sel, setSel] = useState(null);
  if (sel !== null) return <div className="fb-wrap"><span className="fb-done">✦ 고마워요!</span></div>;
  return (
    <div className="fb-wrap" role="group" aria-label="피드백">
      <span className="fb-label">이 이야기가 도움이 됐나요?</span>
      <button className="fb-btn" aria-label="도움이 됐어요" onClick={() => setSel('up')}>👍</button>
      <button className="fb-btn" aria-label="아쉬워요" onClick={() => setSel('down')}>👎</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  아코디언 아이템
// ═══════════════════════════════════════════════════════════
const ERR_PATTERN = /다시 시도해봐요/;

export default function AccItem({ q, text, idx, isOpen, onToggle, shouldType, onTypingDone, onRetry }) {
  const isError = ERR_PATTERN.test(text || '');
  const isTyping = shouldType && isOpen && !isError;
  // shown은 항상 전체 텍스트. done은 450ms 후 true → onTypingDone 콜백 체인 보존.
  const { done } = useWordTyping(text, isTyping, TIMING.typingWord);
  const summary = (text && text.includes('[요약]')) ? text.match(/\[요약\]\s*(.*?)(?:\n|$)/)?.[1] : '';
  const rawPreview = summary || (text ? text.replace(/\[[\w가-힣]+\][^\n]*/g, '').trim().slice(0, 40) : '');
  const display = isError ? text : !shouldType ? text : isOpen ? text : rawPreview;
  const bodyId = `acc-body-${idx}`;

  useEffect(() => { if (done && shouldType) onTypingDone(idx); }, [done, shouldType, idx, onTypingDone]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
  };

  return (
    <div className={`acc-item${isOpen ? ' open' : ''}`}>
      <button
        className={`acc-trigger${isOpen ? ' open' : ''}`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={bodyId}
      >
        <div className="acc-q-wrap">
          <div className="acc-q-num">Q{idx + 1}</div>
          <div className="acc-q-text">{q}</div>
          {!isOpen && isError && <div style={{ fontSize: 'var(--xs)', color: '#e06', marginTop: 3 }}>⚠ 오류 · 탭하여 다시 시도</div>}
          {!isOpen && !display && !isError && !text && <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 3 }}>이 이야기도 기다리고 있어요 ✦</div>}
        </div>
        <div className="acc-right">
          <span className={`acc-chevron${isOpen ? ' open' : ''}`} aria-hidden="true">▼</span>
        </div>
      </button>
      <div id={bodyId} className={`acc-body${isOpen ? ' open' : ' closed'}`} role="region" aria-label={`Q${idx + 1} 답변`}>
        <div className="acc-content">
          {isOpen && display ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >{display}</motion.p>
          ) : (
            <p>{display}</p>
          )}
          {isOpen && isError && onRetry && (
            <button
              className="skip-btn"
              style={{ marginTop: 8, color: 'var(--gold)', borderColor: 'var(--acc)' }}
              onClick={e => { e.stopPropagation(); onRetry(); }}
            >다시 불러오기 ↺</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  채팅 AI 버블 — 스트리밍 텍스트를 직접 표시 후 float-in
// ═══════════════════════════════════════════════════════════
export function ChatBubble({ text, isNew, isStreaming = false }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="chat-bubble">
        {text}
        {isStreaming && <span className="typing-cursor" />}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
//  리포트 본문 — 플로팅으로 등장
// ═══════════════════════════════════════════════════════════
export function ReportBody({ text }) {
  const cleaned = text
    ? text.replace(/\[점수\]\s*\d+\s*\n?/g, '').replace(/\[요약\].*?(\n|$)/g, '').trim()
    : text;
  return (
    <div className="report-content">
      <motion.div
        className="report-text"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        <p>{cleaned}</p>
      </motion.div>
    </div>
  );
}
