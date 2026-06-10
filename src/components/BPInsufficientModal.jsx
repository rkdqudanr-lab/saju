/**
 * BPInsufficientModal — BP 부족 시 표시되는 모달
 * 앱 다크 테마(CSS variables) 사용
 */
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { STEP } from '../utils/steps.js';

export default function BPInsufficientModal({
  isOpen = false,
  currentBp = 0,
  requiredBp = 30,
  freeRechargeAvailable = false,
  freeRechargeTimeRemaining = null,
  onClose,
  onRecharge,
  isRecharging = false,
}) {
  const setStep = useAppStore((s) => s.setStep);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortage = requiredBp - currentBp;

  const goMissions = () => {
    onClose?.();
    setStep(STEP.GROWTH_DASHBOARD);
  };

  const goGacha = () => {
    onClose?.();
    setStep(STEP.GACHA);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.55)',
          animation: 'fadeIn 0.18s ease',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 9991,
          maxWidth: 480, margin: '0 auto',
          background: 'var(--bg1)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px calc(20px + max(env(safe-area-inset-bottom), 16px))',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
          animation: 'slideUpDrawer 0.22s ease',
        }}
      >
        {/* 핸들 바 */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto 18px' }} />

        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 8 }}></div>
          <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>
            BP가 부족해요
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
            질문하려면 <strong style={{ color: 'var(--gold)' }}>{requiredBp} BP</strong>가 필요해요
            {shortage > 0 && <span> · <span style={{ color: 'var(--rose)' }}>{shortage}개 부족</span></span>}
          </div>
        </div>

        {/* BP 현황 바 */}
        <div style={{
          background: 'var(--bg2)', borderRadius: 'var(--r1)',
          border: '1px solid var(--line)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 3, letterSpacing: '.04em' }}>현재 BP</div>
            <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--gold)' }}>{currentBp}</div>
          </div>
          <div style={{ color: 'var(--t4)', fontSize: 'var(--sm)' }}>→</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 3, letterSpacing: '.04em' }}>필요 BP</div>
            <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--rose)' }}>{requiredBp}</div>
          </div>
        </div>

        {/* 충전 상태 안내 */}
        {freeRechargeAvailable ? (
          <div style={{
            background: 'rgba(95,173,122,0.08)', border: '1px solid rgba(95,173,122,0.3)',
            borderRadius: 'var(--r1)', padding: '10px 14px', marginBottom: 12,
            fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.5,
          }}>
            <span style={{ fontWeight: 700, color: '#5FAD7A' }}>💚 무료 BP 충전 가능!</span>
            <span style={{ color: 'var(--t3)' }}> 지금 바로 충전하면 계속 질문할 수 있어요.</span>
          </div>
        ) : freeRechargeTimeRemaining && (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--line)',
            borderRadius: 'var(--r1)', padding: '10px 14px', marginBottom: 12,
            fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.5,
          }}>
            ⏰ 다음 무료 충전까지 <strong style={{ color: 'var(--t1)' }}>{freeRechargeTimeRemaining}</strong> 남았어요
          </div>
        )}

        {/* CTA 버튼 그룹 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {freeRechargeAvailable && (
            <button
              onClick={onRecharge}
              disabled={isRecharging}
              style={{
                width: '100%', padding: '13px',
                background: 'var(--goldf)', border: '1.5px solid var(--acc)',
                borderRadius: 'var(--r1)', color: 'var(--gold)',
                fontWeight: 700, fontSize: 'var(--sm)',
                fontFamily: 'var(--ff)', cursor: isRecharging ? 'not-allowed' : 'pointer',
                opacity: isRecharging ? 0.6 : 1,
              }}
            >
              {isRecharging ? '충전 중...' : '💚 무료 충전하기'}
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={goMissions}
              style={{
                flex: 1, padding: '11px 8px',
                background: 'var(--bg2)', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', color: 'var(--t2)',
                fontSize: 'var(--xs)', fontWeight: 600,
                fontFamily: 'var(--ff)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <span>🎯</span><span>미션으로 BP 획득</span>
            </button>
            <button
              onClick={goGacha}
              style={{
                flex: 1, padding: '11px 8px',
                background: 'var(--bg2)', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', color: 'var(--t2)',
                fontSize: 'var(--xs)', fontWeight: 600,
                fontFamily: 'var(--ff)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <span>🎰</span><span>별숨 뽑기</span>
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '11px',
              background: 'none', border: '1px solid var(--line)',
              borderRadius: 'var(--r1)', color: 'var(--t4)',
              fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            나중에
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpDrawer {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
