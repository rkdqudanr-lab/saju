export default function BoostCTA({ hasBoostedToday, canPurify, todayScore, onPurify, isPurifying, setStep }) {
  const isMaxed = (todayScore || 0) >= 100;
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '14px 16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>기운 보강</div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>
          {hasBoostedToday
            ? (isMaxed ? '오늘 점수가 100점에 도달해서 아이템 사용이 마무리됐어요.' : '100점이 될 때까지 아이템을 쓰고 다시 정화 재점으로 흐름을 새로 확인할 수 있어요.')
            : '샵이나 보관함에서 오늘 점수를 100점까지 올릴 아이템을 더 준비할 수 있어요.'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setStep(38)} style={{ flex: 1, padding: '10px 12px', background: 'transparent', border: '1.5px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
          내 아이템 보기
        </button>
        {canPurify ? (
          <button onClick={onPurify} disabled={isPurifying} style={{ flex: 1.3, padding: '10px 12px', background: 'var(--goldf)', border: '1.5px solid var(--acc)', borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: isPurifying ? 'not-allowed' : 'pointer', opacity: isPurifying ? 0.6 : 1 }}>
            {isPurifying ? '재점 중...' : (isMaxed ? '100점 달성' : '정화재점')}
          </button>
        ) : (
          <div style={{ flex: 1.1, padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--xs)', color: 'var(--t4)' }}>
            오늘 재점 완료
          </div>
        )}
      </div>
    </div>
  );
}
