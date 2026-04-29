import { useEffect, useMemo, useState } from 'react';
import { selectAutoRows } from './fortuneAxisTools.js';

function getProjectedScore(currentScore, selectedRows) {
  const totalBoost = selectedRows.reduce((sum, row) => sum + (Number(row?.item?.boost) || 0), 0);
  return Math.min(100, (currentScore || 0) + totalBoost);
}

export default function AxisItemPickerModal({
  axis,
  currentScore = 0,
  rows = [],
  isApplying = false,
  onClose,
  onApply,
  onGoGacha,
}) {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [axis?.key]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(String(row.rowId))),
    [rows, selectedIds],
  );

  const totalBoost = selectedRows.reduce((sum, row) => sum + (Number(row?.item?.boost) || 0), 0);
  const projectedScore = getProjectedScore(currentScore, selectedRows);

  if (!axis) return null;

  const isMaxed = currentScore >= 100;

  const toggleRow = (rowId) => {
    const safeId = String(rowId);
    setSelectedIds((prev) => (
      prev.includes(safeId)
        ? prev.filter((id) => id !== safeId)
        : [...prev, safeId]
    ));
  };

  const handleAutoSelect = () => {
    const autoRows = selectAutoRows(rows, currentScore, 100);
    setSelectedIds(autoRows.map((row) => String(row.rowId)));
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 420,
        background: 'rgba(0,0,0,0.58)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '80vh',
          overflow: 'auto',
          background: 'var(--bg1)',
          border: '1px solid var(--line)',
          borderRadius: 22,
          padding: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>AXIS ITEM PICKER</div>
            <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: 'var(--t1)' }}>{axis.label} 점수 올리기</div>
            <div style={{ fontSize: 'var(--xs)', color: isMaxed ? 'var(--gold)' : 'var(--t3)', marginTop: 4, lineHeight: 1.6 }}>
              {isMaxed
                ? '이미 100점이에요! 다른 축을 올려보세요.'
                : `현재 ${currentScore}점에서 시작해요. 필요한 만큼만 골라서 100점까지 채울 수 있어요.`}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--t4)',
              cursor: 'pointer',
              fontSize: 16,
            }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
          {[
            { label: '현재 점수', value: `${currentScore}점` },
            { label: '예상 점수', value: `${projectedScore}점` },
            { label: '선택 상승치', value: `+${totalBoost}점` },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '10px 12px', borderRadius: 14, background: 'var(--bg2)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10, color: 'var(--t4)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: label === '선택 상승치' ? 'var(--gold)' : 'var(--t1)' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            onClick={handleAutoSelect}
            disabled={!rows.length || isMaxed}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid var(--acc)',
              background: 'var(--goldf)',
              color: 'var(--gold)',
              fontWeight: 700,
              fontSize: 'var(--xs)',
              fontFamily: 'var(--ff)',
              cursor: (rows.length && !isMaxed) ? 'pointer' : 'not-allowed',
              opacity: (rows.length && !isMaxed) ? 1 : 0.45,
            }}
          >
            최대 선택
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            disabled={!selectedIds.length}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--t3)',
              fontWeight: 700,
              fontSize: 'var(--xs)',
              fontFamily: 'var(--ff)',
              cursor: selectedIds.length ? 'pointer' : 'not-allowed',
              opacity: selectedIds.length ? 1 : 0.45,
            }}
          >
            선택 초기화
          </button>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: '24px 18px', borderRadius: 16, background: 'var(--bg2)', border: '1px solid var(--line)', textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🎰</div>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>
              {axis.label} 아이템이 아직 없어요
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6, marginBottom: 16 }}>
              별숨 아이템 뽑기에서 이 운세에 맞는 기운을 먼저 모아보세요.
            </div>
            <button
              type="button"
              onClick={onGoGacha}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 12,
                border: '1px solid var(--acc)',
                background: 'var(--goldf)',
                color: 'var(--gold)',
                fontWeight: 700,
                fontSize: 'var(--xs)',
                fontFamily: 'var(--ff)',
                cursor: 'pointer',
              }}
            >
              별숨 아이템 뽑으러 가기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {rows.map((row) => {
              const isSelected = selectedIds.includes(String(row.rowId));
              return (
                <button
                  key={row.rowId}
                  type="button"
                  onClick={() => toggleRow(row.rowId)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 14,
                    border: `1px solid ${isSelected ? 'var(--acc)' : 'var(--line)'}`,
                    background: isSelected ? 'var(--goldf)' : 'var(--bg2)',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{row.item?.emoji || '✨'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 700, lineHeight: 1.4 }}>
                      {row.item?.name || '이름 없는 기운'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 3, lineHeight: 1.5 }}>
                      {row.item?.description || row.item?.effect || '이 운세를 살짝 끌어올리는 아이템이에요.'}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 800, color: 'var(--gold)' }}>+{row.item?.boost || 0}</div>
                    <div style={{ fontSize: 10, color: isSelected ? 'var(--gold)' : 'var(--t4)', marginTop: 3 }}>
                      {isSelected ? '선택됨' : '선택'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {rows.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onGoGacha}
              style={{
                flex: 1,
                padding: '11px 12px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--t3)',
                fontWeight: 700,
                fontSize: 'var(--xs)',
                fontFamily: 'var(--ff)',
                cursor: 'pointer',
              }}
            >
              더 뽑으러 가기
            </button>
            <button
              type="button"
              onClick={() => onApply?.(selectedRows)}
              disabled={!selectedRows.length || isApplying || isMaxed}
              style={{
                flex: 1.4,
                padding: '11px 12px',
                borderRadius: 12,
                border: '1px solid var(--acc)',
                background: 'var(--goldf)',
                color: 'var(--gold)',
                fontWeight: 800,
                fontSize: 'var(--xs)',
                fontFamily: 'var(--ff)',
                cursor: (!selectedRows.length || isApplying || isMaxed) ? 'not-allowed' : 'pointer',
                opacity: (!selectedRows.length || isApplying || isMaxed) ? 0.45 : 1,
              }}
            >
              {isApplying ? '적용 중...' : isMaxed ? '이미 100점' : `${axis.label}에 적용하기`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
