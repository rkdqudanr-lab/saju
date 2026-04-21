/**
 * ShieldBlockModal 컴포넌트
 * 기운 정화 모달: 지친 기운이 감지되었을 때 표시 (공포 UX → 따뜻한 위로 UX)
 */

import React, { useEffect, useState } from 'react';

export default function ShieldBlockModal({
  isOpen = false,
  symptom = '',
  currentBp = 0,
  cost = 20,
  freeRechargeTimeRemaining = null,
  freeRechargeAvailable = false,
  onBlock,
  onClose,
  onRecharge,
  isBlocking = false,
}) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    }
  }, [isOpen]);

  const canBlock = currentBp >= cost;
  const bpShortage = cost - currentBp;

  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
          animation: 'sbmFadeIn 0.25s ease',
        }}
      />

      {/* 모달 — 하단에서 슬라이드업 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--bg1)',
          borderRadius: 'var(--r3) var(--r3) 0 0',
          padding: '28px 24px 36px',
          maxWidth: '480px',
          width: '100%',
          zIndex: 10001,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
          animation: 'sbmSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          border: '1px solid var(--line)',
          borderBottom: 'none',
          maxHeight: '85svh',
          overflowY: 'auto',
        }}
      >
        {/* 핸들 바 */}
        <div style={{ width: 40, height: 4, background: 'var(--line)', borderRadius: 2, margin: '0 auto 24px' }} />

        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              fontSize: 52,
              marginBottom: 14,
              animation: 'sbmFloat 3s ease-in-out infinite',
              display: 'inline-block',
            }}
          >
            🌧️
          </div>
          <h2
            style={{
              fontSize: 'var(--lg)',
              fontWeight: 700,
              color: 'var(--t1)',
              margin: '0 0 10px 0',
              fontFamily: 'var(--ff)',
            }}
          >
            오늘의 기운이 조금 지쳐있어요
          </h2>
          <p
            style={{
              fontSize: 'var(--sm)',
              color: 'var(--t2)',
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            {symptom
              ? symptom
              : '오늘 조금 무거운 기운이 감돌고 있어요.\n별숨의 기운 정화가 도움이 될 거예요'}
          </p>
        </div>

        {/* BP 현황 */}
        <div
          style={{
            background: 'var(--bg2)',
            borderRadius: 'var(--r1)',
            border: '1px solid var(--line)',
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 10, letterSpacing: '.04em' }}>
            ✦ 별숨 포인트 현황
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 4 }}>보유 BP</div>
              <div style={{ fontSize: 'var(--xl)', fontWeight: 700, color: 'var(--lav)' }}>
                ✦ {currentBp}
              </div>
            </div>
            <div style={{ color: 'var(--t4)', fontSize: 'var(--sm)' }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 4 }}>정화에 필요한 BP</div>
              <div style={{ fontSize: 'var(--xl)', fontWeight: 700, color: 'var(--gold)' }}>
                ✦ {cost}
              </div>
            </div>
          </div>
          {!canBlock && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'var(--lavf)',
                borderRadius: 'var(--r1)',
                fontSize: 'var(--xs)',
                color: 'var(--lav)',
                textAlign: 'center',
              }}
            >
              BP가 {bpShortage}개 더 있으면 정화할 수 있어요
            </div>
          )}
        </div>

        {/* BP 부족 시 안내 */}
        {!canBlock && (
          <div
            style={{
              background: 'var(--lavf)',
              border: '1px solid var(--lavacc)',
              borderRadius: 'var(--r1)',
              padding: '14px 16px',
              marginBottom: 20,
              fontSize: 'var(--sm)',
              color: 'var(--lav)',
              lineHeight: 1.7,
            }}
          >
            {freeRechargeAvailable ? (
              <div>
                <strong>✦ 오늘치 별의 에너지를 받아볼까요?</strong>
                <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t2)' }}>
                  별숨 포인트(BM)로 나의 별에게 맑은 기운을 선물할 수 있어요.
                  무료 충전 후 기운을 정화해보세요.
                </div>
              </div>
            ) : (
              <div>
                <strong>✦ 미션을 완료하면 BP가 쌓여요</strong>
                <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t2)' }}>
                  다음 무료 충전까지 {freeRechargeTimeRemaining || '조금'} 남았어요.
                  오늘의 미션을 완료하거나 내일 다시 시도해보세요.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 버튼 그룹 */}
        <div style={{ display: 'flex', gap: 10 }}>
          {canBlock ? (
            <>
              <button
                onClick={onBlock}
                disabled={isBlocking}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, var(--lav), #7B6DB5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--r1)',
                  fontWeight: 700,
                  fontSize: 'var(--sm)',
                  fontFamily: 'var(--ff)',
                  cursor: isBlocking ? 'not-allowed' : 'pointer',
                  opacity: isBlocking ? 0.7 : 1,
                  transition: 'opacity .2s',
                }}
              >
                {isBlocking ? '정화 중...' : '✦ 기운 정화하기'}
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '14px 18px',
                  background: 'var(--bg2)',
                  color: 'var(--t3)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r1)',
                  fontWeight: 600,
                  fontSize: 'var(--sm)',
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                나중에
              </button>
            </>
          ) : (
            <>
              {freeRechargeAvailable && (
                <button
                  onClick={onRecharge}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, var(--teal), #4A9B91)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--r1)',
                    fontWeight: 700,
                    fontSize: 'var(--sm)',
                    fontFamily: 'var(--ff)',
                    cursor: 'pointer',
                  }}
                >
                  ✦ 별 에너지 받기
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--bg2)',
                  color: 'var(--t3)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r1)',
                  fontWeight: 600,
                  fontSize: 'var(--sm)',
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                }}
              >
                오늘은 쉬어갈게요
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sbmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sbmSlideUp {
          from { transform: translateX(-50%) translateY(100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes sbmFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </>
  );
}
