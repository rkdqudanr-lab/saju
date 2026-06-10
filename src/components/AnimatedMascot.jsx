import { useEffect, useMemo, useState } from 'react';
import '../styles/Mascot.css';

const STATIC_FALLBACK = {
  'loading-reading': 'eureka',
  'loading-thinking': 'thinking',
  'reward-pop': 'reward',
  'gacha-reveal': 'shock',
};

function getPrefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export default function AnimatedMascot({
  name = 'loading-reading',
  size = 96,
  fps = 6,
  loop = true,
  frameCount = 6,
  staticMood,
  className = '',
  alt = '움직이는 별숨이',
  ...rest
}) {
  const [frame, setFrame] = useState(0);
  const reduced = getPrefersReducedMotion();
  const fallbackMood = staticMood || STATIC_FALLBACK[name] || 'normal';

  const frames = useMemo(
    () => Array.from(
      { length: frameCount },
      (_, index) => `/mascot/anim/${name}/frame-${String(index + 1).padStart(2, '0')}.webp`,
    ),
    [frameCount, name],
  );

  useEffect(() => {
    if (reduced || frameCount <= 1 || fps <= 0) return undefined;
    setFrame(0);
    const interval = window.setInterval(() => {
      setFrame((current) => {
        const next = current + 1;
        if (next < frameCount) return next;
        return loop ? 0 : current;
      });
    }, 1000 / fps);
    return () => window.clearInterval(interval);
  }, [fps, frameCount, loop, name, reduced]);

  return (
    <img
      src={reduced ? `/mascot/${fallbackMood}.webp` : frames[frame]}
      alt={alt}
      width={size}
      height={size}
      className={`animated-mascot${className ? ` ${className}` : ''}`}
      draggable={false}
      {...rest}
    />
  );
}
