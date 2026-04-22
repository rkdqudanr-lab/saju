import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
//  한글 자소 단위 타이핑 훅 (사람이 직접 치는 듯한 효과)
// ═══════════════════════════════════════════════════════════
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function getTypingFrames(text) {
  const frames = [];
  let currentStr = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0) - 44032;
    if (code > -1 && code < 11172) {
      const cho = Math.floor(code / 588);
      const jung = Math.floor((code - (cho * 588)) / 28);
      const jong = code % 28;
      
      // 초성
      frames.push(currentStr + CHO[cho]);
      // 초성 + 중성
      frames.push(currentStr + String.fromCharCode(44032 + (cho * 588) + (jung * 28)));
      // 초성 + 중성 + 종성
      if (jong > 0) {
        frames.push(currentStr + char);
      }
      currentStr += char;
    } else {
      currentStr += char;
      frames.push(currentStr);
    }
  }
  return frames;
}

export default function useWordTyping(text, active, speed = 25) { // 스피드는 프레임 단위 (기본 25ms)
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);
  const rafRef = useRef(null);
  const animRef = useRef({ idx: 0, nextTime: 0, frames: [] });

  const getDelay = (frame, isLastFrameOfChar, base) => {
    if (!isLastFrameOfChar) return base; // 자소 타이핑 중엔 기본 딜레이
    const lastChar = frame.slice(-1);
    if (/[.!?…]/.test(lastChar)) return base + 350;
    if (/[,]/.test(lastChar)) return base + 180;
    if (/\n/.test(lastChar)) return base + 250;
    if (/\s/.test(lastChar)) return base + 20;
    return base + 15; // 글자 완성 후 살짝 딜레이
  };

  useEffect(() => {
    if (!active || !text) return;
    setShown(''); setDone(false);
    
    const frames = getTypingFrames(text);
    // 기본 속도를 좀 더 자연스럽게 보정 (기존 130ms는 단어 단위였음)
    const typingSpeed = speed > 50 ? 25 : speed; 
    animRef.current = { idx: 0, nextTime: performance.now() + typingSpeed, frames };

    const tick = (now) => {
      const a = animRef.current;
      if (a.idx >= a.frames.length) { setDone(true); return; }

      if (now < a.nextTime) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      while (a.idx < a.frames.length && a.nextTime <= now) {
        const frame = a.frames[a.idx];
        const nextFrame = a.frames[a.idx + 1];
        const isLastFrameOfChar = !nextFrame || nextFrame.length > frame.length;
        
        a.idx++;
        a.nextTime += getDelay(frame, isLastFrameOfChar, typingSpeed);
      }

      setShown(a.frames[Math.min(a.idx - 1, a.frames.length - 1)] || '');

      if (a.idx >= a.frames.length) { setDone(true); return; }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [text, active, speed]);

  const skipToEnd = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setShown(text); setDone(true);
  }, [text]);

  return { shown, done, skipToEnd };
}
