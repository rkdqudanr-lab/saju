import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { calculateAnonSynergy } from '../utils/synergyLogic.js';

export default function AnonSynergyModal({ onClose, targetUser, myIlgan, mySunSign }) {
  const [animating, setAnimating] = useState(true);
  const [progress, setProgress] = useState(0);

  const synergy = calculateAnonSynergy(
    myIlgan, mySunSign,
    targetUser.ilgan, targetUser.sun_sign
  );

  useEffect(() => {
    // 가짜 로딩 애니메이션
    let start = Date.now();
    const duration = 1500; // 1.5초로 약간 늘려 여운을 줌

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      // easeOutQuint
      const val = 1 - Math.pow(1 - t, 5);
      setProgress(Math.floor(val * synergy.score));
      
      if (t >= 1) {
        clearInterval(timer);
        setAnimating(false);
        setProgress(synergy.score);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [synergy.score]);

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 11000,
      background: 'rgba(7, 5, 10, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div
        className="glass"
        style={{
          width: '100%', maxWidth: 340,
          borderRadius: '32px',
          padding: '40px 24px',
          boxSizing: 'border-box',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(232,176,72,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 장식용 빛 */}
        <div style={{
          position: 'absolute', top: '-20%', left: '-20%', width: '60%', height: '60%',
          background: 'radial-gradient(circle, rgba(232,176,72,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 800, letterSpacing: '.2em', marginBottom: 12, textTransform: 'uppercase' }}>
          ✦ Resonance Synergy ✦
        </div>
        
        <div style={{ fontSize: 'var(--md)', color: 'var(--t2)', marginBottom: 32, lineHeight: 1.5 }}>
          나와 <span style={{ fontWeight: 800, color: 'var(--t1)', borderBottom: '2px solid var(--acc)' }}>{targetUser.nickname || '별숨 유저'}</span>님의<br/>별빛 공명 지수는?
        </div>

        <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* 펄스 애니메이션 배경 */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(232,176,72,0.05)',
            border: '1px solid var(--acc)',
            animation: animating ? 'pulse resonancePulse 2s infinite' : 'none',
            opacity: animating ? 0.8 : 0.4,
            transition: 'all 0.8s ease',
          }} />
          
          <div style={{ 
            position: 'relative', zIndex: 2, 
            display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center' 
          }}>
            <div style={{ 
              fontSize: 54, fontWeight: 900, color: 'var(--gold)', 
              letterSpacing: '-2px', lineHeight: 1,
              textShadow: '0 0 20px rgba(232,176,72,0.4)'
            }}>
              {progress}<span style={{ fontSize: 24, fontWeight: 500, marginLeft: 2, opacity: 0.8 }}>%</span>
            </div>
            {!animating && (
              <div style={{ 
                marginTop: 8, fontSize: '10px', fontWeight: 700, 
                color: 'var(--gold)', background: 'var(--goldf)',
                padding: '2px 10px', borderRadius: '10px',
                animation: 'purifyFadeIn 0.5s ease both'
              }}>
                Match Found
              </div>
            )}
          </div>

          {/* 회전하는 링 장식 */}
          <div style={{
            position: 'absolute', inset: -10, borderRadius: '50%',
            border: '1px dashed rgba(255,255,255,0.1)',
            animation: 'synth-spin 10s linear infinite'
          }} />
        </div>

        {!animating && (
          <div className="fade-in-up">
            <div style={{ 
              fontSize: '1.2rem', color: 'var(--t1)', fontWeight: 800, 
              marginBottom: 12, letterSpacing: '-0.02em' 
            }}>
              "{synergy.keyword}"
            </div>
            <div style={{ 
              fontSize: '12px', color: 'var(--t3)', lineHeight: 1.8, 
              background: 'rgba(255,255,255,0.03)', padding: '16px', 
              borderRadius: '20px', border: '1px solid var(--line2)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--t4)' }}>내 별숨</span>
                <span style={{ fontWeight: 600 }}>{[myIlgan, mySunSign].filter(Boolean).join(' · ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <span style={{ color: 'var(--t4)' }}>상대방</span>
                <span style={{ fontWeight: 600 }}>{[targetUser.ilgan, targetUser.sun_sign].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 32, padding: '16px',
            border: 'none', borderRadius: '20px',
            background: 'var(--gold)', color: '#000',
            fontFamily: 'var(--ff)', fontSize: 'var(--sm)', fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 8px 24px rgba(232,176,72,0.2)'
          }}
        >
          운명 확인 완료
        </button>

        <style>{`
          .fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes resonancePulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(232,176,72,0.2); } 50% { transform: scale(1.05); box-shadow: 0 0 30px 10px rgba(232,176,72,0.1); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(232,176,72,0.2); } }
        `}</style>
      </div>
    </div>
  );
}
