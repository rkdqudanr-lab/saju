import { useState } from 'react';

const ITEMS = [
  { key: 'history',   label: '상담 기록',  desc: '기기 바꿔도 이어볼 수 있어요',          defaultOn: true  },
  { key: 'partner',   label: '연인 정보',  desc: '두 사람 기운을 더 정확히 읽어요',        defaultOn: false },
  { key: 'workplace', label: '직장·상황', desc: '커리어 흐름을 더 구체적으로 봐요',        defaultOn: true  },
  { key: 'worry',     label: '고민 내용', desc: '지금 상황에 딱 맞는 별풀이를 해요',       defaultOn: false },
];

export default function ConsentModal({ flags, setFlags, onConfirm }) {
  const toggle = (key) => setFlags(f => ({ ...f, [key]: !f[key] }));

  return (
    <div
      className="upgrade-modal-bg"
      role="dialog"
      aria-modal="true"
      aria-label="별숨 데이터 동의"
    >
      <div className="upgrade-modal" onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: 6 }}>🌙</div>
        <div className="upgrade-modal-title" style={{ marginBottom: 4 }}>
          별숨이 당신을 더 깊이 알수록<br />별풀이가 더 정확해져요
        </div>
        <div className="upgrade-modal-sub" style={{ marginBottom: 20 }}>
          알려주고 싶은 것만 골라줘요.<br />
          선택 안 한 건 이 기기에서만 볼 수 있어요.
        </div>

        {/* 필수 항목 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 14px', borderRadius: 'var(--r1)',
          background: 'var(--bg2)', marginBottom: 8,
        }}>
          <div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 2 }}>[필수]</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 600 }}>생년월일 · 닉네임</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 2 }}>항상 저장돼요</div>
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', paddingLeft: 8 }}>–</div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: 'var(--line)', margin: '12px 0' }} />

        {/* 선택 항목 토글 */}
        {ITEMS.map(({ key, label, desc }) => (
          <div
            key={key}
            className="toggle-row"
            style={{ padding: '10px 0', cursor: 'pointer' }}
            onClick={() => toggle(key)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>{desc}</div>
              {!flags[key] && (
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 3 }}>당신의 기기 내에만 저장돼요</div>
              )}
            </div>
            <button
              className={`toggle ${flags[key] ? 'on' : 'off'}`}
              role="switch"
              aria-checked={flags[key]}
              aria-label={label}
              onClick={e => { e.stopPropagation(); toggle(key); }}
              style={{ flexShrink: 0, marginLeft: 12 }}
            />
          </div>
        ))}

        {/* 확인 버튼 */}
        <button className="btn-main" style={{ marginTop: 20 }} onClick={onConfirm}>
          이대로 별숨 시작하기 ✦
        </button>
      </div>
    </div>
  );
}
