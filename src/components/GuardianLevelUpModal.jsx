/**
 * GuardianLevelUpModal — 수호신 레벨업 축하 모달
 * 레벨 승격 시 AI가 생성한 수호신 한마디를 보여줍니다.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const LEVEL_LABELS = {
  1: '초급 액막이사',
  2: '중급 액막이사',
  3: '고급 액막이사',
  4: '마스터 액막이사',
  5: '별숨의 수호자',
};

const LEVEL_COLORS = {
  1: '#9B8EC4',
  2: '#5FAD7A',
  3: '#C08830',
  4: '#E05A3A',
  5: '#B8A035',
};

const LEVEL_EMOJIS = {
  1: '⭐',
  2: '🌟',
  3: '💫',
  4: '✨',
  5: '🌠',
};

export default function GuardianLevelUpModal({ fromLevel, toLevel, guardianMessage, loading, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  const color = LEVEL_COLORS[toLevel] || '#B8A035';
  const emoji = LEVEL_EMOJIS[toLevel] || '✨';
  const label = LEVEL_LABELS[toLevel] || '';

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 360,
          background: 'var(--bg1)',
          borderRadius: 'var(--r2, 16px)',
          padding: '32px 24px 24px',
          border: `1.5px solid ${color}`,
          textAlign: 'center',
          transform: show ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 별 이펙트 */}
        <div style={{ fontSize: 48, marginBottom: 8, lineHeight: 1 }}>{emoji}</div>

        {/* 레벨 뱃지 */}
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: color,
          borderRadius: 20,
          color: '#fff',
          fontWeight: 800,
          fontSize: 'var(--sm)',
          marginBottom: 12,
          letterSpacing: '.02em',
        }}>
          Lv{toLevel} · {label}
        </div>

        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 20 }}>
          Lv{fromLevel}에서 Lv{toLevel}로 승격했어요!
        </div>

        {/* 수호신 메시지 */}
        <div style={{
          background: 'var(--bg2)',
          borderRadius: 'var(--r1)',
          padding: '14px 16px',
          border: `1px solid ${color}40`,
          marginBottom: 20,
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t4)', fontSize: 'var(--xs)' }}>
              <div style={{ width: 14, height: 14, border: '2px solid var(--line)', borderTopColor: color, borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', flexShrink: 0 }} />
              수호신이 메시지를 전하고 있어요...
            </div>
          ) : (
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8, whiteSpace: 'pre-line', textAlign: 'left' }}>
              {guardianMessage || '새로운 레벨의 힘이 당신과 함께해요.'}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '13px',
            background: color,
            border: 'none',
            borderRadius: 'var(--r1)',
            color: '#fff',
            fontWeight: 700, fontSize: 'var(--sm)',
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
          }}
        >
          고마워요, 더 성장할게요 ✦
        </button>
      </div>
    </div>,
    document.body
  );
}
