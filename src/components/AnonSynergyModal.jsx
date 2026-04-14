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
    const duration = 1200; // 1.2초

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
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          width: '85%', maxWidth: 320,
          background: 'var(--bg1)',
          borderRadius: '24px',
          padding: '30px 24px',
          boxSizing: 'border-box',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
          ✦ 랜선 궁합 결과
        </div>
        
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', marginBottom: 20 }}>
          나와 <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{targetUser.nickname || '별숨 유저'}</span>님의 시너지는?
        </div>

        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* 펄스 애니메이션 배경 */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'var(--goldf)',
            animation: animating ? 'pulse 1s infinite' : 'none',
            border: '2px solid var(--acc)',
            opacity: animating ? 0.8 : 0.3,
            transition: 'all 0.5s',
          }} />
          
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--gold)', letterSpacing: '-1px', lineHeight: 1 }}>
              {progress}<span style={{ fontSize: 20 }}>%</span>
            </div>
          </div>
        </div>

        {!animating && (
          <div className="fade-in-up">
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 700, marginBottom: 8 }}>
              "{synergy.keyword}"
            </div>
            <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.6, background: 'var(--bg2)', padding: '12px', borderRadius: '12px' }}>
              내정보: {[myIlgan, mySunSign].filter(Boolean).join(' · ') || '정보없음'}<br/>
              상대방: {[targetUser.ilgan, targetUser.sun_sign].filter(Boolean).join(' · ') || '정보없음'}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 24, padding: '13px',
            border: 'none', borderRadius: 'var(--r1)',
            background: 'var(--bg3)', color: 'var(--t2)',
            fontFamily: 'var(--ff)', fontSize: 'var(--sm)', fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          확인
        </button>

        <style>{`
          .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 0.8; } 100% { transform: scale(0.95); opacity: 0.5; } }
        `}</style>
      </div>
    </div>
  );
}
