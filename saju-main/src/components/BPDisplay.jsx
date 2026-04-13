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

  // 레벨별 색상 (CSS 변수 활용이 좋으나, 동적 색상이라 인라인 유지 또는 클래스 분기)
  const levelColors = {
    1: '#4A8EC4', // 수(파란색)
    2: '#5FAD7A', // 목(초록색)
    3: '#C08830', // 토(갈색)
    4: '#E05A3A', // 화(빨간색)
    5: '#B8A035', // 금(금색)
  };

  const color = levelColors[guardianLevel] || '#4A8EC4';
  const percentage = Math.min(100, (currentBp / maxBp) * 100);

  return (
    <div className={`bp-card ${className}`}>
      {/* 제목 */}
      <div className="bp-header">
        <div className="bp-label">별숨 포인트 (BP)</div>
        <div className="bp-value">
          {currentBp} / {maxBp}
        </div>
      </div>

      {/* 게이지 바 */}
      <div className="bp-guage-bg">
        <div
          className="bp-guage-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* 무료 충전 버튼 */}
      <button
        className="bp-recharge-btn"
        onClick={handleFreeRecharge}
        disabled={!freeRechargeAvailable || isRecharging}
        style={{ backgroundColor: color }}
      >
        {isRecharging ? (
          <>
            <span className="dsc-loading-dot" />
            <span>충전 중...</span>
          </>
        ) : (
          <>
            <span>🔋</span>
            <span>무료 충전 (1회/일)</span>
          </>
        )}
      </button>

      {/* 설명 텍스트 */}
      {!freeRechargeAvailable && (
        <div className="bp-recharge-hint">
          내일 다시 충전할 수 있습니다 🌙
        </div>
      )}
    </div>
  );
}
