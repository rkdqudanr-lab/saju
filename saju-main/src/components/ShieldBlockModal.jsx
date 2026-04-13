/**
 * ShieldBlockModal 컴포넌트
 * 배드타임 액막이 모달: 악운이 감지되었을 때 표시
 * glassmorphism 기반 프리미엄 디자인
 */

import React, { useEffect, useState } from 'react';

export default function ShieldBlockModal({
  isOpen = false,
  symptom = '',
  currentBp = 0,
  cost = 20,
  freeRechargeTimeRemaining = null,
  freeRechargeAvailable = false,
  onBlock,
  onClose,
  onRecharge,
  isBlocking = false,
}) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canBlock = currentBp >= cost;
  const bpShortage = cost - currentBp;

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* 모달 */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg-glass-heavy)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRadius: 'var(--r3)',
          border: '0.5px solid var(--line)',
          padding: '32px 24px',
          maxWidth: '340px',
          width: '90%',
          zIndex: 1000,
          boxShadow: 'var(--shadow)',
          animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '14px',
              animation: showAnimation && !canBlock ? 'none' : 'orbPulse 2s ease-in-out infinite',
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              fontSize: 'var(--lg)',
              fontWeight: 800,
              color: 'var(--t1)',
              margin: '0 0 10px 0',
              letterSpacing: '-0.02em',
            }}
          >
            악운이 감지됐어요
          </h2>
          <p
            style={{
              fontSize: 'var(--sm)',
              color: 'var(--t3)',
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            {symptom || '부정적인 기운이 감지되었습니다'}
          </p>
        </div>

        {/* BP 현황 */}
        <div
          style={{
            background: 'var(--bg-glass)',
            border: '0.5px solid var(--line)',
            borderRadius: 'var(--r2)',
            padding: '16px',
            marginBottom: '20px',
            fontSize: 'var(--xs)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
            <div>
              <div style={{ color: 'var(--t4)', marginBottom: '6px', fontSize: 'var(--xxs)', fontWeight: 600 }}>현재 BP</div>
              <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--ff-inter)' }}>
                💎 {currentBp}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--t4)' }}>
              →
            </div>
            <div>
              <div style={{ color: 'var(--t4)', marginBottom: '6px', fontSize: 'var(--xxs)', fontWeight: 600 }}>필요한 BP</div>
              <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--rose)', fontFamily: 'var(--ff-inter)' }}>
                💎 {cost}
              </div>
            </div>
          </div>
          {!canBlock && (
            <div
              style={{
                color: 'var(--rose)',
                fontSize: 'var(--xxs)',
                fontWeight: 700,
              }}
            >
              BP가 {bpShortage}개 부족해요
            </div>
          )}
        </div>

        {/* 조건에 따른 메시지 */}
        {!canBlock && (
          <div
            style={{
              background: 'var(--rosef)',
              border: '1px solid var(--roseacc)',
              borderRadius: 'var(--r1)',
              padding: '14px 16px',
              marginBottom: '20px',
              fontSize: 'var(--xs)',
              color: 'var(--t2)',
              lineHeight: 1.7,
            }}
          >
            {freeRechargeAvailable ? (
              <div>
                <strong style={{ color: 'var(--gold)' }}>💎 무료 BP 충전이 가능해요!</strong>
                <div style={{ marginTop: '6px' }}>
                  {Math.ceil(bpShortage / 5)} BP 부족하니, 무료 충전으로 채우고 액막이를 발동할 수
                  있어요.
                </div>
              </div>
            ) : (
              <div>
                <strong style={{ color: 'var(--rose)' }}>💎 BP가 부족합니다</strong>
                <div style={{ marginTop: '6px' }}>
                  다음 무료 충전까지 {freeRechargeTimeRemaining || '몇 시간'} 남았어요. 또는 미션을
                  완료해 BP를 획득해보세요.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 버튼 그룹 */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {canBlock ? (
            <>
              <button
                onClick={onBlock}
                disabled={isBlocking}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--gold-grad)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 'var(--r1)',
                  fontWeight: 800,
                  fontSize: 'var(--sm)',
                  fontFamily: 'var(--ff)',
                  cursor: isBlocking ? 'not-allowed' : 'pointer',
                  opacity: isBlocking ? 0.6 : 1,
                  boxShadow: '0 4px 15px var(--gold-glow)',
                  transition: 'all 0.3s',
                }}
              >
                {isBlocking ? '발동 중...' : '🛡️ 액막이 발동!'}
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--bg-glass)',
                  color: 'var(--t3)',
                  border: '0.5px solid var(--line)',
                  borderRadius: 'var(--r1)',
                  fontWeight: 600,
                  fontSize: 'var(--sm)',
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                기다릴게요
              </button>
            </>
          ) : (
            <>
              {freeRechargeAvailable && (
                <button
                  onClick={onRecharge}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'var(--teal)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--r1)',
                    fontWeight: 700,
                    fontSize: 'var(--sm)',
                    fontFamily: 'var(--ff)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(107,191,181,0.3)',
                    transition: 'all 0.3s',
                  }}
                >
                  💎 무료 충전
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--bg-glass)',
                  color: 'var(--t3)',
                  border: '0.5px solid var(--line)',
                  borderRadius: 'var(--r1)',
                  fontWeight: 600,
                  fontSize: 'var(--sm)',
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                닫기
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
