import { useCallback } from 'react';
import { GRADE_CONFIG } from '../utils/gachaItems.js';

const ASPECT_LABELS = {
  overall: '종합운', wealth: '금전운', love: '애정운', career: '직장운',
  study: '학업운', health: '건강운', social: '대인운', travel: '이동운', create: '창의운',
};

function ItemChip({ row, isPending, onToggle, disabled }) {
  const { item } = row;
  const grade = GRADE_CONFIG[item?.grade] || GRADE_CONFIG.satellite;
  const isSelected = isPending;

  return (
    <button
      type="button"
      onClick={() => onToggle(row)}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 12,
        border: `1.5px solid ${isSelected ? grade.color : 'var(--line)'}`,
        background: isSelected ? grade.bg : 'var(--bg2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--ff)',
        textAlign: 'left',
        width: '100%',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.18s ease',
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{item?.emoji || '✦'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>
          {item?.name || '아이템'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: grade.color, fontWeight: 700, background: grade.bg, padding: '1px 6px', borderRadius: 6 }}>
            {grade.label}
          </span>
          <span style={{ fontSize: 10, color: 'var(--t4)' }}>
            {ASPECT_LABELS[item?.aspectKey] || item?.aspectKey}
          </span>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: isSelected ? grade.color : 'var(--t3)' }}>
          +{item?.boost || 0}
        </div>
        <div style={{ fontSize: 9, color: 'var(--t4)' }}>점</div>
      </div>
      {isSelected && (
        <span style={{ fontSize: 14, color: grade.color, flexShrink: 0 }}>✓</span>
      )}
    </button>
  );
}

export default function BoostItemSheet({
  isOpen,
  onClose,
  ownedRows,
  pendingItems,
  onToggleItem,
  onApply,
  isApplying,
  currentScore,
  appliedBoost,
  setStep,
}) {
  const totalPendingBoost = pendingItems.reduce((s, p) => s + (p.item?.boost || 0), 0);
  const baseDisplayScore = (currentScore ?? 0) + (appliedBoost || 0);
  const predictedScore = Math.min(100, baseDisplayScore + totalPendingBoost);
  const hasItems = ownedRows && ownedRows.length > 0;

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'purifyFadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg1)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.25s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* 핸들 */}
        <div style={{ width: 40, height: 4, background: 'var(--line)', borderRadius: 2, margin: '0 auto 16px' }} />

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>
              ✦ 점수 올리기
            </div>
            <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>
              현재 {baseDisplayScore}점
              {pendingItems.length > 0 && (
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
                  {' → '}{predictedScore}점 (+{totalPendingBoost})
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--t4)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* 아이템 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: 12, paddingRight: 2 }}>
          {ownedRows === null ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
              보관함 불러오는 중...
            </div>
          ) : !hasItems ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>✦</div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 16 }}>
                사용할 아이템이 없어요
              </div>
              <button
                type="button"
                onClick={() => { onClose(); setStep?.(40); }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 999,
                  background: 'var(--goldf)',
                  border: '1px solid var(--acc)',
                  color: 'var(--gold)',
                  fontWeight: 700,
                  fontSize: 'var(--xs)',
                  cursor: 'pointer',
                  fontFamily: 'var(--ff)',
                }}
              >
                아이템 얻으러 가기 →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ownedRows.map((row) => (
                <ItemChip
                  key={row.rowId}
                  row={row}
                  isPending={pendingItems.some((p) => p.rowId === row.rowId)}
                  onToggle={onToggleItem}
                  disabled={isApplying}
                />
              ))}
            </div>
          )}
        </div>

        {/* 하단 CTA */}
        {hasItems && (
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--line)', marginTop: 12 }}>
            {pendingItems.length > 0 && (
              <div style={{ fontSize: 10, color: 'var(--t4)', textAlign: 'center', marginBottom: 10 }}>
                {pendingItems.length}개 선택 · 해당 운세 텍스트가 새롭게 바뀌어요
              </div>
            )}
            <button
              type="button"
              onClick={onApply}
              disabled={pendingItems.length === 0 || isApplying}
              style={{
                width: '100%',
                padding: '15px 0',
                borderRadius: 14,
                background: pendingItems.length > 0 && !isApplying ? 'var(--gold)' : 'var(--bg3)',
                border: 'none',
                color: pendingItems.length > 0 && !isApplying ? '#fff' : 'var(--t4)',
                fontWeight: 800,
                fontSize: 15,
                cursor: pendingItems.length > 0 && !isApplying ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--ff)',
                transition: 'all 0.18s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isApplying ? (
                <>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'orbSpin 0.7s linear infinite' }} />
                  정화 중...
                </>
              ) : pendingItems.length > 0 ? (
                <>✦ 점수 올리기 <span style={{ opacity: 0.85, fontSize: 13 }}>+{totalPendingBoost}점</span></>
              ) : (
                '아이템을 선택해주세요'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
