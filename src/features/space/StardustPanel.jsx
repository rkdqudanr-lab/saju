import { getClaimableStardust } from '../../utils/spaceProgress.js';

function formatRemain(progress) {
  const claimable = getClaimableStardust(progress);
  if (claimable > 0) return '수령 가능';
  const last = Number(progress?.lastClaimAt || Date.now());
  const nextAt = last + 3600000;
  const remainMin = Math.max(1, Math.ceil((nextAt - Date.now()) / 60000));
  return `${remainMin}분 뒤`;
}

export default function StardustPanel({ progress, onClaim }) {
  const claimable = getClaimableStardust(progress);

  return (
    <section style={{ borderRadius: 22, border: '1px solid var(--line)', background: 'var(--bg2)', padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 900, letterSpacing: '.08em', marginBottom: 4 }}>STARDUST</div>
          <div style={{ fontSize: 'var(--xl)', color: 'var(--t1)', fontWeight: 900 }}>{Math.floor(progress?.stardust || 0).toLocaleString()} 별가루</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.55, marginTop: 4 }}>
            별숨공간이 쉬는 동안 별가루를 모아요. MVP에서는 최대 8시간까지 쌓입니다.
          </div>
        </div>
        <button
          type="button"
          onClick={onClaim}
          disabled={claimable <= 0}
          style={{
            flexShrink: 0,
            minWidth: 86,
            borderRadius: 16,
            border: claimable > 0 ? '1px solid var(--acc)' : '1px solid var(--line)',
            background: claimable > 0 ? 'var(--goldf)' : 'var(--bg1)',
            color: claimable > 0 ? 'var(--gold)' : 'var(--t4)',
            padding: '10px 11px',
            fontFamily: 'var(--ff)',
            fontWeight: 900,
            cursor: claimable > 0 ? 'pointer' : 'default',
          }}
        >
          {claimable > 0 ? `+${claimable}` : formatRemain(progress)}
        </button>
      </div>
    </section>
  );
}
