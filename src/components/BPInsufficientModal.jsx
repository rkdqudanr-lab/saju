/**
 * BPInsufficientModal 컴포넌트
 * BP가 부족할 때 표시되는 모달
 */

import React, { useEffect, useState } from 'react';

export default function BPInsufficientModal({
  isOpen = false,
  currentBp = 0,
  requiredBp = 30,
  freeRechargeAvailable = false,
  freeRechargeTimeRemaining = null,
  onClose,
  onRecharge,
  onMissionNavigate,
  isRecharging = false,
}) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    }
  }, [isOpen]);

  const shortage = requiredBp - currentBp;

  if (!isOpen) return null;

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
              animation: 'bounce 1s ease-in-out infinite',
            }}
          >
            💎
          </div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0D0B14',
              margin: '0 0 8px 0',
            }}
          >
            BP가 부족해요
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#666',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            질문하기 위해서는 {requiredBp} BP가 필요합니다
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
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ color: '#999', marginBottom: '4px' }}>현재 BP</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#4A8EC4' }}>
                {currentBp}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#999' }}>
              →
            </div>
            <div>
              <div style={{ color: '#999', marginBottom: '4px' }}>필요 BP</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#E05A3A' }}>
                {requiredBp}
              </div>
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              color: '#E05A3A',
              fontSize: '11px',
              fontWeight: '600',
            }}
          >
            {shortage}개 부족
          </div>
        </div>

        {/* 옵션 섹션 */}
        <div style={{ marginBottom: '20px' }}>
          {/* 무료 충전 옵션 */}
          {freeRechargeAvailable ? (
            <div
              style={{
                backgroundColor: '#E5F5E5',
                border: '1px solid #C0E0C0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#2D6B2D', fontWeight: '600', marginBottom: '4px' }}>
                💚 무료 BP 충전 가능!
              </div>
              <div style={{ fontSize: '11px', color: '#4A7C4A', lineHeight: 1.4 }}>
                레벨에 따라 {Math.ceil(shortage / 5)} 이상의 BP를 무료로 충전할 수 있어요.
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#FFE5E5',
                border: '1px solid #FFCCCC',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#E05A3A', fontWeight: '600', marginBottom: '4px' }}>
                ⏰ 무료 충전 대기 중
              </div>
              <div style={{ fontSize: '11px', color: '#C44A6A', lineHeight: 1.4 }}>
                다음 무료 충전까지 {freeRechargeTimeRemaining || '수 시간'} 남았어요.
              </div>
            </div>
          )}

          {/* 미션 옵션 */}
          <div
            style={{
              backgroundColor: '#E5E5FF',
              border: '1px solid #C0C0FF',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#2D2D6B', fontWeight: '600', marginBottom: '4px' }}>
              🎯 미션 완료로 획득
            </div>
            <div style={{ fontSize: '11px', color: '#4A4A7C', lineHeight: 1.4 }}>
              일일 미션을 완료하면 +10 BP를 획득할 수 있어요.
            </div>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {freeRechargeAvailable && (
            <button
              onClick={onRecharge}
              disabled={isRecharging}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#5FAD7A',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: isRecharging ? 'not-allowed' : 'pointer',
                opacity: isRecharging ? 0.6 : 1,
                fontSize: '13px',
              }}
            >
              {isRecharging ? '충전 중...' : '무료 충전'}
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
              fontSize: '13px',
            }}
          >
            {freeRechargeAvailable ? '닫기' : '나중에'}
          </button>
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

        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}
