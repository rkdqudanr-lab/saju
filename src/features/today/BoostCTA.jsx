export default function BoostCTA({
  hasBoostedToday,
  canPurify,
  todayScore,
  onPurify,
  isPurifying,
  setStep,
  currentBp,
  boostCost,
  onInstantBoost,
}) {
  const isMaxed    = (todayScore || 0) >= 100;
  const canAfford  = (currentBp || 0) >= (boostCost || 10);
  const showBoost  = !isMaxed && typeof onInstantBoost === 'function';

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r1)',
      padding: '14px 16px',
      marginBottom: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* 섹션 타이틀 */}
      <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em' }}>
        {isMaxed ? '기운 보강 완료' : '✦ 즉시 운세 올리기'}
      </div>

      {/* 설명 텍스트 */}
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>
        {isMaxed
          ? '오늘 점수가 100점에 도달했어요. 최상의 기운이에요!'
          : showBoost && !canAfford
          ? `BP가 부족해요. (보유 ${currentBp} / 필요 ${boostCost} BP)`
          : hasBoostedToday
          ? '100점이 될 때까지 추가 부스트가 가능해요.'
          : 'BP를 소모해 랜덤 아이템을 즉시 뽑고 운세를 올려요.'}
      </div>

      {/* 메인 즉시 부스트 버튼 */}
      {showBoost && (
        <button
          onClick={canAfford ? onInstantBoost : undefined}
          disabled={!canAfford}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: canAfford
              ? 'linear-gradient(135deg, rgba(232,176,72,0.22), rgba(200,160,80,0.12))'
              : 'var(--bg3)',
            border: `1.5px solid ${canAfford ? 'var(--acc)' : 'var(--line)'}`,
            borderRadius: 'var(--r1)',
            color: canAfford ? 'var(--gold)' : 'var(--t4)',
            fontWeight: 800,
            fontSize: 'var(--sm)',
            fontFamily: 'var(--ff)',
            cursor: canAfford ? 'pointer' : 'not-allowed',
            opacity: canAfford ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'opacity .15s, transform .15s',
          }}
          onMouseDown={(e) => canAfford && (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = '')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
        >
          <span>✦ BP로 즉시 운세 올리기</span>
          <span style={{
            padding: '2px 10px',
            background: canAfford ? 'rgba(232,176,72,0.22)' : 'rgba(255,255,255,0.06)',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
          }}>
            {boostCost} BP
          </span>
        </button>
      )}

      {/* 보조 버튼 행: 내 아이템 보기 + 정화재점 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setStep(38)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'transparent',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--r1)',
            color: 'var(--t3)',
            fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
          }}
        >
          내 아이템 보기
        </button>

        {canPurify ? (
          <button
            onClick={onPurify}
            disabled={isPurifying}
            style={{
              flex: 1.3,
              padding: '10px 12px',
              background: isMaxed ? 'var(--goldf)' : 'transparent',
              border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)',
              color: 'var(--gold)',
              fontWeight: 700,
              fontSize: 'var(--xs)',
              fontFamily: 'var(--ff)',
              cursor: isPurifying ? 'not-allowed' : 'pointer',
              opacity: isPurifying ? 0.6 : 1,
            }}
          >
            {isPurifying ? '재점 중...' : (isMaxed ? '100점 달성' : '정화재점')}
          </button>
        ) : (
          <div style={{
            flex: 1.1,
            padding: '10px 12px',
            background: 'var(--bg3)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--xs)', color: 'var(--t4)',
          }}>
            오늘 재점 완료
          </div>
        )}
      </div>
    </div>
  );
}
