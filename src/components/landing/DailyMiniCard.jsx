import { useEffect, useMemo, useState } from 'react';
import { parseDailyLines } from '../../utils/parseDailyLines.js';
import { useSajuCtx } from '../../context/AppContext.jsx';
import Mascot from '../Mascot.jsx';
import AnimatedMascot from '../AnimatedMascot.jsx';

// 오늘 점수에 따라 별숨이 표정이 달라진다
function moodForScore(score) {
  if (score >= 80) return 'celebrate';
  if (score >= 65) return 'smile';
  if (score >= 50) return 'wink';
  if (score >= 38) return 'normal';
  return 'cheer';
}

function scoreTone(score) {
  if (score >= 85) {
    return { label: '강한 흐름' };
  }
  if (score >= 70) {
    return { label: '좋은 흐름' };
  }
  if (score >= 55) {
    return { label: '안정 흐름' };
  }
  if (score >= 40) {
    return { label: '조율 필요' };
  }
  return { label: '차분히 보기' };
}

function dynamicScoreColor(score) {
  if (score >= 80) return 'var(--gold)';
  if (score >= 60) return 'color-mix(in srgb, var(--gold) 78%, var(--t3))';
  if (score >= 40) return 'rgba(155,142,196,.95)';
  return 'rgba(232,123,138,.95)';
}


const _R = 36, _C = 2 * Math.PI * _R, _TRACK = _C * 0.75;

// 색상은 카드 루트의 --daily-score-color CSS 변수를 따른다 (SVG 속성은 var() 미지원)
function ScoreRing({ score }) {
  const s = Math.max(0, Math.min(100, score || 0));
  const fill = _TRACK * (s / 100);
  const endAngle = (135 + 270 * s / 100) * Math.PI / 180;
  const capX = 50 + _R * Math.cos(endAngle);
  const capY = 50 + _R * Math.sin(endAngle);
  return (
    <svg viewBox="0 0 100 100" className="dmc-ring" aria-hidden="true">
      <circle className="dmc-ring-track" cx="50" cy="50" r={_R} fill="none"
        strokeWidth="4.5"
        strokeDasharray={`${_TRACK} ${_C - _TRACK}`}
        strokeLinecap="round" transform="rotate(135 50 50)" />
      <circle className="dmc-ring-fill" cx="50" cy="50" r={_R} fill="none"
        strokeWidth="4.5"
        strokeDasharray={`${fill} ${_C - fill}`}
        strokeLinecap="round" transform="rotate(135 50 50)" />
      {s > 2 && (
        <circle className="dmc-ring-cap" cx={capX} cy={capY} r="2.6" />
      )}
    </svg>
  );
}

export default function DailyMiniCard({
  dailyResult,
  todayScore,
  loading = false,
  onAsk,
  onClick,
  boostCount = 0,
  topAxes = [],
  bottomAxes = [],
}) {
  const { today } = useSajuCtx();
  const [displayScore, setDisplayScore] = useState(0);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const parsed = useMemo(
    () => parseDailyLines(dailyResult?.text || ''),
    [dailyResult?.text],
  );

  const score = todayScore || parsed.score || dailyResult?.score;
  const numericScore = Math.max(0, Math.min(100, Number(score) || 0));
  const dateLabel = today ? `${today.month}월 ${today.day}일` : '';
  const tone = score ? scoreTone(score) : scoreTone(0);
  const scorePct = numericScore;

  useEffect(() => {
    if (!dailyResult || !numericScore) {
      setDisplayScore(0);
      setHasRevealed(false);
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayScore(numericScore);
      setHasRevealed(true);
      return undefined;
    }

    let rafId = 0;
    const duration = 780;
    const start = performance.now();
    const from = Math.min(displayScore || 0, numericScore);
    const delta = numericScore - from;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(from + delta * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setHasRevealed(true);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // displayScore는 애니메이션 시작점으로만 사용하며 score 변경 시에만 재실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyResult, numericScore]);

  useEffect(() => {
    if (!loading) return undefined;
    const interval = window.setInterval(() => {
      setLoadingMessageIndex((index) => (index + 1) % 3);
    }, 2200);
    return () => window.clearInterval(interval);
  }, [loading]);

  // 로딩 중
  if (loading) {
    const loadingMessages = [
      ['오늘의 별숨을 읽는 중', '사주와 별자리 흐름을 맞춰보고 있어요'],
      ['사주 흐름을 맞춰보는 중', '오늘 가까운 기운을 조용히 살펴보고 있어요'],
      ['별자리 기운을 더하는 중', '당신에게 닿은 흐름을 정리하고 있어요'],
    ];
    const [loadingTitle, loadingSub] = loadingMessages[loadingMessageIndex] || loadingMessages[0];
    return (
      <div className="daily-mini-loading" aria-busy="true" aria-label="오늘의 별숨 불러오는 중">
        <AnimatedMascot name="loading-reading" size={86} fps={6} staticMood="eureka" className="daily-mini-loading-mascot" />
        <div className="daily-mini-loading-text">{loadingTitle}</div>
        <div className="daily-mini-loading-sub">{loadingSub}</div>
      </div>
    );
  }

  // 운세 미조회
  if (!dailyResult) {
    return (
      <div className="daily-mini-card daily-mini-card--empty" style={{ textAlign: 'center' }}>
        <div className="daily-mini-eyebrow">
          오늘 하루 나의 별숨{dateLabel ? ` · ${dateLabel}` : ''}
        </div>
        <Mascot mood="eureka" size="md" float style={{ margin: '8px auto 2px' }} />
        <div className="daily-mini-empty-copy">
          오늘 어떤 쪽으로 움직이면 좋을지 볼까요?
        </div>
        <button
          type="button"
          className="daily-mini-cta"
          onClick={onAsk}
          aria-label="오늘 별숨의 기운 확인하기"
        >
          오늘 운세 확인하기
        </button>
      </div>
    );
  }

  // 운세 조회 완료
  return (
    <div
      className={`daily-mini-card daily-mini-card--compact ${hasRevealed ? 'is-revealed' : 'is-revealing'}`}
      data-tour="daily-card"
      style={{
        width: '100%',
        '--daily-score-pct': `${scorePct}%`,
        '--daily-score-color': dynamicScoreColor(scorePct),
      }}
    >
      <div className="daily-mini-glow" aria-hidden="true" />
      <div className="daily-mini-starfield" aria-hidden="true" />

      <button type="button" className="daily-mini-summary" onClick={onClick} aria-label={`오늘의 별숨 ${score}점, 자세히 보기`}>
        <span className="daily-mini-eyebrow">
          오늘 하루 나의 별숨{dateLabel ? ` · ${dateLabel}` : ''}
        </span>
        <span className="daily-mini-summary-row">
          <span className="daily-mini-summary-copy">
            <span className="daily-mini-summary-title">
              {parsed.summary || '오늘 운세'}
            </span>
            <span className="daily-mini-summary-sub">
              <span className="daily-mini-tone-dot" aria-hidden="true" />
              {tone.label} · 자세히 보기 ›
            </span>
          </span>
          <span className="daily-mini-score-cluster">
            <Mascot mood={moodForScore(numericScore)} size={44} float aria-hidden="true" className="daily-mini-compact-mascot" />
            <span className="dmc-ring-wrap dmc-ring-wrap--compact">
              <ScoreRing score={scorePct} />
              <span className="dmc-ring-center">
                <span className="dmc-ring-num">{displayScore || score}</span>
              </span>
            </span>
          </span>
        </span>
      </button>

      {(topAxes.length > 0 || bottomAxes.length > 0 || boostCount > 0) && (
        <div className="daily-mini-axis-chips daily-mini-axis-chips--compact">
          {topAxes.slice(0, 2).map((a) => (
            <span key={a.key} className="daily-mini-axis-chip daily-mini-axis-chip--high">
              <span className="daily-mini-axis-arrow" aria-hidden="true">▲</span>
              {a.label} <b>{a.total}</b>
            </span>
          ))}
          {bottomAxes.slice(0, 1).map((a) => (
            <span key={a.key} className="daily-mini-axis-chip daily-mini-axis-chip--low">
              <span className="daily-mini-axis-arrow" aria-hidden="true">▼</span>
              {a.label} <b>{a.total}</b>
            </span>
          ))}
          {boostCount > 0 && (
            <span className="daily-mini-axis-chip daily-mini-axis-chip--high">
              ✦ {boostCount}개 기운 적용
            </span>
          )}
        </div>
      )}

    </div>
  );
}
