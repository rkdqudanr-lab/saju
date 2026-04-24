import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
      
      // easeOutExpo 효과
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
 * 텍스트가 타이핑되듯 나타나는 메시지 컴포넌트
 */
export const TypingMessage = ({ text, delay = 0.045, className = '', isSummary = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsComplete(false);
      hasCompletedRef.current = false;
      return;
    }

    // 최초 타이핑 완료 후 text가 바뀌면 즉시 표시 (재타이핑 방지)
    if (hasCompletedRef.current) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    const timer = setInterval(() => {
      const char = text[index];
      index++;
      setDisplayedText((prev) => prev + char);
      if (index >= text.length) {
        clearInterval(timer);
        setIsComplete(true);
        hasCompletedRef.current = true;
      }
    }, delay * 1000);

    return () => clearInterval(timer);
  }, [text, delay]);

  return (
    <motion.div 
      className={`typing-message-wrapper ${className} ${isSummary ? 'summary-bubble' : 'advice-bubble'}`}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="message-content">
        {displayedText}
        {!isComplete && <motion.span 
          animate={{ opacity: [1, 0] }} 
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="typing-cursor"
        >┃</motion.span>}
      </div>
    </motion.div>
  );
};
