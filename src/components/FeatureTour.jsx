/**
 * FeatureTour — 첫 방문 시 UI 요소를 화살표로 하나씩 가리키는 코치마크 투어
 * localStorage 'byeolsoom_tour_v1' === 'done' 이면 표시 안 함
 */
import { useState, useEffect, useCallback } from 'react';

const TOUR_STEPS = [
  {
    selector: 'menu-btn',
    arrowDir: 'top',   // 툴팁이 타겟 아래에 표시 (화살표는 위를 가리킴)
    title: '메뉴를 열어봐요 ✦',
    desc: '모든 기능이 여기에 있어요. 사주 분석, 대운, 궁합까지.',
  },
  {
    selector: 'daily-card',
    arrowDir: 'top',
    title: '매일 오늘의 별숨 🌟',
    desc: '매일 아침 오늘 하루의 기운을 확인해요.',
  },
  {
    selector: 'nav-consult',
    arrowDir: 'bottom', // 툴팁이 타겟 위에 표시 (화살표는 아래를 가리킴)
    title: '별숨에게 물어봐요 💬',
    desc: '연애, 직장, 돈… 사주와 별자리를 아는 별숨이 답해드려요.',
  },
  {
    selector: 'nav-growth',
    arrowDir: 'bottom',
    title: '나를 채워봐요 ✨',
    desc: '정보를 더 채울수록 별숨의 분석이 더 깊어져요.',
  },
  {
    selector: 'nav-square',
    arrowDir: 'bottom',
    title: '함께하는 별숨 🏛️',
    desc: '다른 분들의 별숨 이야기를 나눠봐요.',
  },
];

const PADDING = 10; // 스포트라이트 여백 (px)

export default function FeatureTour({ onFinish }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // 타겟 요소 위치 계산
  const updateRect = useCallback(() => {
    const el = document.querySelector(`[data-tour="${step.selector}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step.selector]);

  useEffect(() => {
    updateRect();
    // 레이아웃 변경에 대비해 짧은 딜레이 후 재계산
    const t = setTimeout(updateRect, 100);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateRect);
    };
  }, [updateRect]);

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('byeolsoom_tour_v1', 'done');
      onFinish?.();
    } else {
      setCurrentStep(i => i + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('byeolsoom_tour_v1', 'done');
    onFinish?.();
  };

  // 스포트라이트 위치/크기
  const spot = targetRect
    ? {
        left:   targetRect.left   - PADDING,
        top:    targetRect.top    - PADDING,
        width:  targetRect.width  + PADDING * 2,
        height: targetRect.height + PADDING * 2,
      }
    : null;

  // 툴팁 위치 계산
  function getTooltipStyle() {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const TT_WIDTH  = 260;
    const TT_OFFSET = 18; // 스포트라이트와 툴팁 사이 간격
    const vw = window.innerWidth;

    let left = targetRect.left + targetRect.width / 2 - TT_WIDTH / 2;
    // 화면 밖으로 나가지 않도록 클램프
    left = Math.max(12, Math.min(left, vw - TT_WIDTH - 12));

    if (step.arrowDir === 'bottom') {
      // 타겟 위에 툴팁 표시
      return {
        position: 'fixed',
        left,
        bottom: window.innerHeight - targetRect.top + TT_OFFSET,
        width: TT_WIDTH,
        zIndex: 10000,
      };
    } else {
      // 타겟 아래에 툴팁 표시
      return {
        position: 'fixed',
        left,
        top: targetRect.bottom + TT_OFFSET,
        width: TT_WIDTH,
        zIndex: 10000,
      };
    }
  }

  // 화살표 위치 (CSS 삼각형)
  const arrowStyle = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    ...(step.arrowDir === 'bottom'
      ? {
          bottom: -10,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '10px solid var(--bg1)',
        }
      : {
          top: -10,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '10px solid var(--bg1)',
        }),
  };

  return (
    <>
      {/* 반투명 전체 오버레이 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9997,
          pointerEvents: 'none',
        }}
      />

      {/* 스포트라이트 (box-shadow로 주변을 어둡게) */}
      {spot && (
        <div
          style={{
            position: 'fixed',
            left:   spot.left,
            top:    spot.top,
            width:  spot.width,
            height: spot.height,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.70)',
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 오버레이 클릭 차단 (스포트라이트 바깥 영역) */}
      <div
        onClick={handleSkip}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'transparent',
          pointerEvents: spot ? 'all' : 'none',
        }}
      />

      {/* 툴팁 카드 */}
      <div
        style={{
          ...getTooltipStyle(),
          background: 'var(--bg1)',
          border: '1px solid var(--gold)',
          borderRadius: 18,
          padding: '16px 18px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 화살표 */}
        <div style={arrowStyle} />

        {/* 진행 점 */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 12, justifyContent: 'center' }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentStep ? 18 : 5,
                height: 5,
                borderRadius: 3,
                background: i === currentStep ? 'var(--gold)' : 'var(--line)',
                transition: 'all .25s ease',
              }}
            />
          ))}
        </div>

        {/* 내용 */}
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>
          {step.title}
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7, marginBottom: 14, wordBreak: 'keep-all' }}>
          {step.desc}
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleNext}
            style={{
              flex: 1,
              padding: '9px 0',
              background: 'var(--gold)',
              color: '#0D0B14',
              border: 'none',
              borderRadius: 10,
              fontSize: 'var(--sm)',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '.02em',
            }}
          >
            {isLast ? '시작하기 ✦' : '다음 →'}
          </button>
          <button
            onClick={handleSkip}
            style={{
              padding: '9px 12px',
              background: 'none',
              border: 'none',
              fontSize: 'var(--xs)',
              color: 'var(--t4)',
              cursor: 'pointer',
            }}
          >
            건너뛰기
          </button>
        </div>
      </div>
    </>
  );
}
