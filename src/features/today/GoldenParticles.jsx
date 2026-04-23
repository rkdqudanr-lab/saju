import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#FFC85C', '#FFE08C', '#E8B048', '#FFFFFF', '#FFD700', '#F5C842'];

function rand(min, max) { return min + Math.random() * (max - min); }

export default function GoldenParticles({ active, onComplete }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 여러 발사 지점에서 파티클 생성
    const launchers = [W * 0.2, W * 0.4, W * 0.6, W * 0.8];
    const particles = [];
    launchers.forEach((x) => {
      for (let i = 0; i < 18; i++) {
        const angleRad = rand(-110, -70) * (Math.PI / 180);
        const speed    = rand(8, 20);
        particles.push({
          x,
          y:       H,
          vx:      Math.cos(angleRad) * speed,
          vy:      Math.sin(angleRad) * speed,
          r:       rand(3, 7),
          color:   COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha:   1,
          decay:   rand(0.012, 0.022),
          gravity: rand(0.28, 0.42),
        });
      }
    });

    function tick() {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;
        p.vy  += p.gravity;
        p.x   += p.vx;
        p.y   += p.vy;
        p.alpha = Math.max(0, p.alpha - p.decay);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (alive) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        pointerEvents: 'none',
      }}
    />,
    document.body
  );
}
