import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore.js';

/**
 * 숫자가 부드럽게 올라가는 애니메이션 컴포넌트
 */
export const AnimatedScore = ({ value, duration = 1.2 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    if (start === end) return;

    let startTime = null;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(start + (end - start) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

/**
 * 텍스트가 부드럽게 플로팅되며 나타나는 메시지 컴포넌트
 * (이전 타이핑 애니메이션 대체)
 */
export const TypingMessage = ({ text, className = '', isSummary = false }) => {
  const instantTyping = useAppStore((s) => s.instantTyping);

  if (!text) return null;

  return (
    <motion.div
      className={`typing-message-wrapper ${className} ${isSummary ? 'summary-bubble' : 'advice-bubble'}`}
      initial={instantTyping ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="message-content">{text}</div>
    </motion.div>
  );
};
