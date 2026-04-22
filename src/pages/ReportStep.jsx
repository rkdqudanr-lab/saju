import { exportReadingAsTxt } from "../utils/constants.js";
import FeatureLoadingScreen from "../components/FeatureLoadingScreen.jsx";

// ─── 파서: [월간점수] / [행운색] / [행운아이템] 태그 추출 ─────────
function parseMonthlyReport(text) {
  if (!text) return { scores: null, luckyColor: '', luckyItems: [], narrative: text || '' };

  const scoreMatch = text.match(/\[월간점수\]\s*([^\n]+)/);
  const colorMatch = text.match(/\[행운색\]\s*([^\n]+)/);
  const itemMatch = text.match(/\[행운아이템\]\s*([^\n]+)/);

  let scores = null;
  if (scoreMatch) {
    scores = {};
    scoreMatch[1].split(',').forEach(part => {
      const [k, v] = part.trim().split(':');
      if (k && v) scores[k.trim()] = parseInt(v.trim(), 10);
    });
  }

  const luckyColor = colorMatch ? colorMatch[1].trim() : '';
  const luckyItems = itemMatch ? itemMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];

  // 태그 줄들을 제거한 순수 서사
  const narrative = text
    .replace(/\[월간점수\][^\n]*/g, '')
    .replace(/\[행운색\][^\n]*/g, '')
    .replace(/\[행운아이템\][^\n]*/g, '')
    .replace(/^\n+/, '')
    .trim();

  return { scores, luckyColor, luckyItems, narrative };
}

const AXES = [
  { key: '종합', label: '종합', emoji: '🌟' },
  { key: '금전', label: '금전', emoji: '💰' },
  { key: '애정', label: '애정', emoji: '💫' },
  { key: '직장', label: '직장', emoji: '👑' },
  { key: '학업', label: '학업', emoji: '📚' },
  { key: '건강', label: '건강', emoji: '✨' },
  { key: '대인', label: '대인', emoji: '🤝' },
  { key: '이동', label: '이동', emoji: '🚀' },
  { key: '창의', label: '창의', emoji: '🎨' },
];

function ScoreBar({ label, emoji, score }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color = pct >= 75 ? 'var(--gold)' : pct >= 50 ? '#7EC8A4' : '#9BADCE';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{emoji}</span>
      <span style={{ minWidth: 28, fontSize: '11px', color: 'var(--t2)', fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 3,
          background: `linear-gradient(90deg, var(--t4) 0%, ${color} 100%)`,
          transition: 'width 0.7s ease-out',
        }} />
      </div>
      <span style={{ minWidth: 28, textAlign: 'right', fontSize: '11px', fontWeight: 700, color }}>{pct}</span>
    </div>
  );
}

export default function ReportStep({
  form, today,
  reportText, reportLoading,
  genReport, shareCard, shareResult, saveReportImage,
}) {
  const parsed = parseMonthlyReport(reportText);

  return (
    <div className="page-top">
      <div className="inner report-page">
        <div className="report-header">
          <div className="report-date">{today.year}년 {today.month}월 · {today.lunar}</div>
          <div className="report-title">{form.nickname || form.name || '당신'}님의<br />이달의 별숨</div>
          <div className="report-name">사주 × 별자리 월간 운세</div>
        </div>

        {!reportLoading && !reportText ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp4) var(--sp3) var(--sp5)' }}>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.8, marginBottom: 'var(--sp4)' }}>
              이번 달 8가지 운세 영역의 점수와<br />행운 아이템·색상을 알려줄게요
            </div>
            <button className="up-btn" style={{ maxWidth: 320, margin: '0 auto' }} onClick={genReport}>
              {today.month}월 별숨 받기 ✦
            </button>
          </div>
        ) : reportLoading ? (
          <FeatureLoadingScreen type="report" />
        ) : (
          <div style={{ animation: 'fadeUp .4s ease' }}>

            {/* 8축 운세 점수 */}
            {parsed.scores && (
              <div style={{
                background: 'var(--bg2)', borderRadius: 'var(--r2)',
                border: '1px solid var(--line)', padding: '18px',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.05em', marginBottom: 14 }}>
                  ✦ {today.month}월 8대 운세 점수
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {AXES.map(axis => (
                    <ScoreBar
                      key={axis.key}
                      label={axis.label}
                      emoji={axis.emoji}
                      score={parsed.scores[axis.key] ?? parsed.scores[axis.label] ?? 60}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 행운 아이템 + 행운 색 */}
            {(parsed.luckyColor || parsed.luckyItems.length > 0) && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16,
              }}>
                {parsed.luckyColor && (
                  <div style={{
                    background: 'var(--bg2)', borderRadius: 'var(--r1)',
                    border: '1px solid var(--line)', padding: '14px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>행운 색</div>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 600 }}>{parsed.luckyColor}</div>
                  </div>
                )}
                {parsed.luckyItems.length > 0 && (
                  <div style={{
                    background: 'var(--bg2)', borderRadius: 'var(--r1)',
                    border: '1px solid var(--line)', padding: '14px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>행운 아이템</div>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', lineHeight: 1.6 }}>
                      {parsed.luckyItems.join(' · ')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 서사 */}
            {parsed.narrative && (
              <div style={{
                background: 'var(--bg2)', borderRadius: 'var(--r2)',
                border: '1px solid var(--line)', padding: '18px',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.05em', marginBottom: 12 }}>
                  ✦ 이달의 별숨 이야기
                </div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.9, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
                  {parsed.narrative}
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            {reportText && (
              <div style={{ display: 'flex', gap: 8, marginTop: 'var(--sp2)', flexWrap: 'wrap' }}>
                <button className="res-top-btn" style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => saveReportImage ? saveReportImage(reportText) : shareCard(0)}>이미지 저장</button>
                <button className="res-top-btn" style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => exportReadingAsTxt('월간리포트', reportText)}>텍스트 저장</button>
                <button className="res-top-btn primary" style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => shareResult('report', reportText, '이달의 별숨')}>↗ 공유하기</button>
              </div>
            )}

            {/* 다시 받기 */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={genReport}
                style={{
                  padding: '9px 20px', borderRadius: 20, cursor: 'pointer',
                  border: '1px solid var(--line)', background: 'transparent',
                  color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
                }}
              >
                다시 받기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
