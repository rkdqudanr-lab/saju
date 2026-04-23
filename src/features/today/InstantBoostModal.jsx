import { createPortal } from 'react-dom';
import GachaGraphic from '../../components/GachaGraphic.jsx';
import { GRADE_CONFIG, SAJU_GRADE_CONFIG } from '../../utils/gachaItems.js';

// 파티클 Sparkles — GachaPage의 동일 컴포넌트 인라인 복사
function Sparkles({ grade, cfg }) {
  const count = (
    ['satellite', 'ohaeng'].includes(grade) ? 5 :
    ['planet', 'cheongan'].includes(grade) ? 9 :
    ['galaxy', 'jiji'].includes(grade) ? 12 : 16
  );
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        const dist  = 32 + Math.random() * 22;
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 5, height: 5, borderRadius: '50%', background: cfg.color,
            '--sx': `${Math.cos((angle * Math.PI) / 180) * dist}px`,
            '--sy': `${Math.sin((angle * Math.PI) / 180) * dist}px`,
            animation: `gacha-sparkle ${0.55 + Math.random() * 0.45}s ease-out ${i * 0.04}s forwards`,
            opacity: 0,
          }} />
        );
      })}
    </div>
  );
}

function getGradeCfg(item) {
  if (!item?.grade) return {};
  return GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG[item.grade] || {};
}

/**
 * InstantBoostModal
 * phase: 'pulling' | 'reveal' | 'confirming' | null
 */
export default function InstantBoostModal({ phase, pulledItem, cost, currentBp, onConfirm, onClose }) {
  if (!phase) return null;

  const cfg     = getGradeCfg(pulledItem);
  const isPull  = phase === 'pulling';
  const isReveal = phase === 'reveal';
  const isConfirming = phase === 'confirming';

  const bgGradient =
    pulledItem?.grade === 'nebula' || pulledItem?.grade === 'gapja'
      ? `radial-gradient(ellipse at 50% 30%, rgba(232,176,72,0.35) 0%, #0d0b14 65%)`
      : pulledItem?.grade === 'galaxy' || pulledItem?.grade === 'jiji'
      ? `radial-gradient(ellipse at 50% 30%, rgba(180,142,240,0.28) 0%, #0d0b14 65%)`
      : '#0d0b14';

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: isReveal || isConfirming ? bgGradient : 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'purifyFadeIn 0.25s ease',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={undefined}
    >
      {/* 헤더 라벨 */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 32, textTransform: 'uppercase' }}>
        {isPull ? '✦ 기운을 뽑는 중...' : '✦ 즉시 운세 올리기'}
      </div>

      {/* 뽑기 중 스피너 */}
      {isPull && (
        <div style={{
          width: 60, height: 60,
          border: '3px solid rgba(200,160,80,0.25)',
          borderTopColor: 'var(--gold, #c8a050)',
          borderRadius: '50%',
          animation: 'orbSpin 0.7s linear infinite',
        }} />
      )}

      {/* 아이템 카드 (reveal / confirming) */}
      {(isReveal || isConfirming) && pulledItem && (
        <div style={{
          position: 'relative',
          width: 200,
          borderRadius: 22,
          border: `2px solid ${cfg.border || 'rgba(255,255,255,0.15)'}`,
          background: cfg.bg || 'rgba(255,255,255,0.06)',
          padding: '36px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          animation: 'gacha-card-in 0.5s cubic-bezier(.34,1.56,.64,1) both',
          boxShadow: `0 0 40px ${cfg.border || 'rgba(200,160,80,0.2)'}`,
        }}>
          <Sparkles grade={pulledItem.grade} cfg={cfg} />

          <div style={{ animation: 'gacha-bounce 0.6s ease 0.2s both', marginTop: 8 }}>
            <GachaGraphic item={pulledItem} size={96} />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color || 'var(--gold)', letterSpacing: '.06em' }}>
            {cfg.label || pulledItem.grade}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: pulledItem.affixColor || '#fff', textAlign: 'center', lineHeight: 1.3 }}>
            {pulledItem.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.6 }}>
            {pulledItem.description || pulledItem.effect}
          </div>
          <div style={{
            marginTop: 4, padding: '6px 18px',
            background: 'rgba(232,176,72,0.18)',
            border: '1px solid rgba(232,176,72,0.4)',
            borderRadius: 999,
            fontSize: 12, fontWeight: 700, color: 'var(--gold, #c8a050)',
          }}>
            +{pulledItem.boost}점 기운 부스트
          </div>
        </div>
      )}

      {/* 확인 버튼 */}
      {isReveal && (
        <button
          onClick={() => onConfirm(pulledItem)}
          style={{
            marginTop: 32,
            padding: '14px 40px',
            background: 'linear-gradient(135deg, rgba(232,176,72,0.28), rgba(200,160,80,0.18))',
            border: '1.5px solid var(--gold, #c8a050)',
            borderRadius: 50,
            color: 'var(--gold, #c8a050)',
            fontSize: 15, fontWeight: 800,
            fontFamily: 'var(--ff, inherit)',
            cursor: 'pointer',
            letterSpacing: '.04em',
            animation: 'gacha-card-in 0.4s cubic-bezier(.34,1.56,.64,1) 0.4s both',
          }}
        >
          ✦ 확인했어요
        </button>
      )}

      {/* 확인 중 로딩 */}
      {isConfirming && (
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28,
            border: '2px solid rgba(200,160,80,0.25)',
            borderTopColor: 'var(--gold, #c8a050)',
            borderRadius: '50%',
            animation: 'orbSpin 0.7s linear infinite',
          }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '.06em' }}>운세를 새로 계산 중...</div>
        </div>
      )}

      {/* 비용 안내 */}
      {isPull && (
        <div style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          {cost} BP 소모 · 잔여 {currentBp} BP
        </div>
      )}
    </div>,
    document.body
  );
}
