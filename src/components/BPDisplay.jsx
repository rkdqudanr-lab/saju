/**
 * BPDisplay 컴포넌트
 * 현재 BP 게이지, 레벨별 색상, 무료 충전 버튼 표시
 */

import React, { useCallback, useState } from 'react';

export default function BPDisplay({
  currentBp = 0,
  maxBp = 100,
  guardianLevel = 1,
  onFreeRecharge = null,
  freeRechargeAvailable = true,
  className = '',
}) {
  const [isRecharging, setIsRecharging] = useState(false);

  const handleFreeRecharge = useCallback(async () => {
    if (!onFreeRecharge || isRecharging) return;
    setIsRecharging(true);
    try {
      await onFreeRecharge();
    } finally {
      setIsRecharging(false);
    }
  }, [onFreeRecharge, isRecharging]);

  const levelColors = {
    1: '#9B8EC4',
    2: '#5FAD7A',
    3: '#C08830',
    4: '#E05A3A',
    5: '#B8A035',
  };

  const color = levelColors[guardianLevel] || '#9B8EC4';
  const percentage = Math.min(100, (currentBp / maxBp) * 100);

  return (
    <div className={`bp-display ${className}`} style={{ padding: '16px 0' }}>
      {/* 제목 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--t1)' }}>
          별숨 포인트
        </div>
        <div style={{ fontSize: '14px', color: 'var(--t3)' }}>
          {currentBp} / {maxBp}
        </div>
      </div>

      {/* BP 용도 설명 */}
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: '10px' }}>
        액막이 발동과 별숨 상담에 사용돼요
      </div>

      {/* 게이지 바 */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'var(--bg3)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px',
      }}>
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: color,
            transition: 'width 0.3s ease',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* 무료 충전 버튼 */}
      <button
        onClick={handleFreeRecharge}
        disabled={!freeRechargeAvailable || isRecharging}
        style={{
          width: '100%',
          padding: '10px 12px',
          backgroundColor: freeRechargeAvailable ? color : 'var(--bg3)',
          color: freeRechargeAvailable ? '#fff' : 'var(--t4)',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          fontFamily: 'var(--ff)',
          cursor: freeRechargeAvailable && !isRecharging ? 'pointer' : 'not-allowed',
          transition: 'opacity 0.2s ease',
          opacity: isRecharging ? 0.7 : 1,
        }}
      >
        {isRecharging ? '충전 중...' : '무료 충전 (1회/일)'}
      </button>

      {/* 설명 텍스트 */}
      {!freeRechargeAvailable && (
        <div style={{
          fontSize: 'var(--xs)',
          color: 'var(--t4)',
          marginTop: '8px',
          textAlign: 'center',
        }}>
          내일 다시 충전할 수 있습니다
        </div>
      )}
    </div>
  );
}
