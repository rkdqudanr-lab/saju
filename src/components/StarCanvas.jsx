import { useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
//  🌌 별 캔버스
// ═══════════════════════════════════════════════════════════
export default function StarCanvas({isDark}){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext('2d');let raf;
    const stars=Array.from({length:90},()=>({
      x:Math.random(),y:Math.random(),
      r:Math.random()*1.3+.15,
      a:Math.random()*.6+.05,
      da:(Math.random()-.5)*.003,
    }));
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    resize();
    window.addEventListener('resize',resize);
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      stars.forEach(s=>{
        s.a=Math.max(.04,Math.min(.65,s.a+s.da));
        if(s.a<=.04||s.a>=.65)s.da*=-1;
        ctx.beginPath();ctx.arc(s.x*c.width,s.y*c.height,s.r,0,Math.PI*2);
        ctx.fillStyle=isDark?`rgba(255,255,255,${s.a})`:`rgba(160,140,90,${s.a*.35})`;
        ctx.fill();
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[isDark]);
  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" role="presentation"/>;
}
