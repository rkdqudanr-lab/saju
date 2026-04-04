/**
 * ShieldBlockModal 컴포넌트
 * 배드타임 액막이 모달: 악운이 감지되었을 때 표시
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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '320px',
          width: '90%',
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '12px',
              animation: showAnimation && !canBlock ? 'none' : 'pulse 2s ease-in-out infinite',
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0D0B14',
              margin: '0 0 8px 0',
            }}
          >
            악운이 감지됐어요
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#666',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {symptom || '부정적인 기운이 감지되었습니다'}
          </p>
        </div>

        {/* BP 현황 */}
        <div
          style={{
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '8px' }}>
            <div>
              <div style={{ color: '#999', marginBottom: '4px' }}>현재 BP</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#4A8EC4' }}>
                💎 {currentBp}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#999' }}>
              →
            </div>
            <div>
              <div style={{ color: '#999', marginBottom: '4px' }}>필요한 BP</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#E05A3A' }}>
                💎 {cost}
              </div>
            </div>
          </div>
          {!canBlock && (
            <div
              style={{
                color: '#E05A3A',
                fontSize: '11px',
                fontWeight: '600',
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
              backgroundColor: '#FFE5E5',
              border: '1px solid #FFCCCC',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#E05A3A',
              lineHeight: 1.5,
            }}
          >
            {freeRechargeAvailable ? (
              <div>
                <strong>💎 무료 BP 충전이 가능해요!</strong>
                <div style={{ marginTop: '4px' }}>
                  {Math.ceil(bpShortage / 5)} BP 부족하니, 무료 충전으로 채우고 액막이를 발동할 수
                  있어요.
                </div>
              </div>
            ) : (
              <div>
                <strong>💎 BP가 부족합니다</strong>
                <div style={{ marginTop: '4px' }}>
                  다음 무료 충전까지 {freeRechargeTimeRemaining || '몇 시간'} 남았어요. 또는 미션을
                  완료해 BP를 획득해보세요.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 버튼 그룹 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {canBlock ? (
            <>
              <button
                onClick={onBlock}
                disabled={isBlocking}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#E05A3A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: isBlocking ? 'not-allowed' : 'pointer',
                  opacity: isBlocking ? 0.6 : 1,
                }}
              >
                {isBlocking ? '발동 중...' : '🛡️ 액막이 발동!'}
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                시간을 기다릴게요
              </button>
            </>
          ) : (
            <>
              {freeRechargeAvailable && (
                <button
                  onClick={onRecharge}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#5FAD7A',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  💎 무료 충전
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translate(-50%, -45%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}
