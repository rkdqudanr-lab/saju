import { useRef, useEffect } from "react";

export default function StarCanvas({ isDark }) {
  const ref = useRef(null);
  const darkRef = useRef(isDark);
  useEffect(() => { darkRef.current = isDark; }, [isDark]);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); let raf;

    // 90 stars; first 8 have gentle drift
    const stars = Array.from({ length: 90 }, (_, idx) => ({
      x:  Math.random(),
      y:  Math.random(),
      r:  Math.random() * 1.3 + .15,
      a:  Math.random() * .6 + .05,
      da: (Math.random() - .5) * .003,
      vx: idx < 8 ? (Math.random() - .5) * 0.00007 : 0,
      vy: idx < 8 ? (Math.random() - .5) * 0.00007 : 0,
    }));

    // Meteor state
    const m = { active: false, x0: 0, y0: 0, dx: 0, dy: 0, t: 0 };
    const meteorTimer = { id: null };

    const launchMeteor = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        meteorTimer.id = setTimeout(launchMeteor, 30000 + Math.random() * 20000);
        return;
      }
      const angle = (30 + Math.random() * 30) * Math.PI / 180; // 30–60° downward
      m.x0 = Math.random() * c.width * 0.7;
      m.y0 = Math.random() * c.height * 0.3;
      m.dx = Math.cos(angle);
      m.dy = Math.sin(angle);
      m.t  = 0;
      m.active = true;
    };

    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Schedule first meteor after 8–18s
    meteorTimer.id = setTimeout(launchMeteor, 8000 + Math.random() * 10000);

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);

      // Stars
      stars.forEach(s => {
        // Breathing
        s.a = Math.max(.04, Math.min(.65, s.a + s.da));
        if (s.a <= .04 || s.a >= .65) s.da *= -1;
        // Drift
        if (s.vx || s.vy) {
          s.x = (s.x + s.vx + 1) % 1;
          s.y = (s.y + s.vy + 1) % 1;
        }
        ctx.beginPath();
        ctx.arc(s.x * c.width, s.y * c.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = darkRef.current
          ? `rgba(255,255,255,${s.a})`
          : `rgba(160,140,90,${s.a * .35})`;
        ctx.fill();
      });

      // Meteor
      if (m.active) {
        const speed = 180; // px per "unit" of t
        const tailLen = 55;
        const hx = m.x0 + m.dx * m.t * speed;
        const hy = m.y0 + m.dy * m.t * speed;
        const tx = hx - m.dx * tailLen;
        const ty = hy - m.dy * tailLen;
        const fade = 1 - m.t;
        const grad = ctx.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, 'rgba(255,248,220,0)');
        grad.addColorStop(1, `rgba(255,248,220,${0.75 * fade})`);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        m.t += 0.022;
        if (m.t >= 1) {
          m.active = false;
          meteorTimer.id = setTimeout(launchMeteor, 25000 + Math.random() * 20000);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(meteorTimer.id);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" role="presentation"/>;
}
