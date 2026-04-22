import { exportReadingAsTxt } from "../utils/constants.js";
import FeatureLoadingScreen from "../components/FeatureLoadingScreen.jsx";

function parseMonthlyReport(text) {
  if (!text) return { scores: null, luckyColor: '', luckyItems: [], narrative: text || '' };

  const scoreMatch = text.match(/\[월간점수\]\s*([^\n]+)/);
  const colorMatch = text.match(/\[행운색\]\s*([^\n]+)/);
  const itemMatch = text.match(/\[행운아이템\]\s*([^\n]+)/);

  let scores = null;
  if (scoreMatch) {
    scores = {};
    scoreMatch[1].split(',').forEach((part) => {
      const [k, v] = part.trim().split(':');
      if (k && v) scores[k.trim()] = parseInt(v.trim(), 10);
    });
  }

  const luckyColor = colorMatch ? colorMatch[1].trim() : '';
  const luckyItems = itemMatch ? itemMatch[1].split(',').map((s) => s.trim()).filter(Boolean) : [];

  const narrative = text
    .replace(/\[월간점수\][^\n]*/g, '')
    .replace(/\[행운색\][^\n]*/g, '')
    .replace(/\[행운아이템\][^\n]*/g, '')
    .replace(/^\n+/, '')
    .trim();

  return { scores, luckyColor, luckyItems, narrative };
}

const AXES = [
  { key: '종합', label: '종합', emoji: '✨' },
  { key: '금전', label: '금전', emoji: '💰' },
  { key: '애정', label: '애정', emoji: '💞' },
  { key: '직장', label: '직장', emoji: '💼' },
  { key: '학업', label: '학업', emoji: '📘' },
  { key: '건강', label: '건강', emoji: '🌿' },
  { key: '대인', label: '대인', emoji: '🤝' },
  { key: '이동', label: '이동', emoji: '🚶' },
  { key: '창의', label: '창의', emoji: '🎨' },
];

function getScoreTone(score) {
  if (score >= 80) return { color: 'var(--gold)', glow: 'rgba(232,176,72,.18)' };
  if (score >= 65) return { color: '#7EC8A4', glow: 'rgba(126,200,164,.14)' };
  return { color: '#9BADCE', glow: 'rgba(155,173,206,.14)' };
}

function ScoreBar({ label, emoji, score }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const tone = getScoreTone(pct);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{emoji}</span>
      <span style={{ minWidth: 32, fontSize: '11px', color: 'var(--t2)', fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${tone.glow} 0%, ${tone.color} 100%)`,
            transition: 'width .7s ease-out',
          }}
        />
      </div>
      <span style={{ minWidth: 30, textAlign: 'right', fontSize: '11px', fontWeight: 700, color: tone.color }}>{pct}</span>
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
      <div className="inner report-page" style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 80 }}>
        <div className="report-header" style={{ marginBottom: 18 }}>
          <div className="report-date">{today.year}년 {today.month}월 · {today.lunar}</div>
          <div className="report-title">{form.nickname || form.name || '당신'}님의<br />이달의 별숨 흐름</div>
          <div className="report-name">오늘 하루 나의 별숨을 한 달 단위 흐름으로 확장해서 보여드려요</div>
        </div>

        {!reportLoading && !reportText ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp4) var(--sp3) var(--sp5)' }}>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.8, marginBottom: 'var(--sp4)' }}>
              이달의 행운 색과 행운 아이템,<br />8가지 운세 점수 흐름을 한 번에 확인해보세요.
            </div>
            <button className="up-btn" style={{ maxWidth: 340, margin: '0 auto' }} onClick={genReport}>
              {today.month}월 월간 리포트 보기
            </button>
          </div>
        ) : reportLoading ? (
          <FeatureLoadingScreen type="report" />
        ) : (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            {parsed.scores && (
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--line)', padding: '18px', marginBottom: 16 }}>
                <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.05em', marginBottom: 14 }}>
                  {today.month}월 8가지 별숨 점수
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {AXES.map((axis) => (
                    <ScoreBar key={axis.key} label={axis.label} emoji={axis.emoji} score={parsed.scores[axis.key] ?? 60} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', padding: '16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>이달의 행운 색</div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 700 }}>{parsed.luckyColor || '아직 읽는 중이에요'}</div>
              </div>
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', padding: '16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>이달의 행운 아이템</div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.7 }}>
                  {parsed.luckyItems.length > 0 ? parsed.luckyItems.join(' · ') : '아직 읽는 중이에요'}
                </div>
              </div>
            </div>

            {parsed.narrative && (
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--line)', padding: '18px', marginBottom: 16 }}>
                <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.05em', marginBottom: 12 }}>
                  이달의 별숨 이야기
                </div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.9, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
                  {parsed.narrative}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 'var(--sp2)', flexWrap: 'wrap' }}>
              <button className="res-top-btn" style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => (saveReportImage ? saveReportImage(reportText) : shareCard(0))}>이미지 저장</button>
              <button className="res-top-btn" style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => exportReadingAsTxt('월간리포트', reportText)}>텍스트 저장</button>
              <button className="res-top-btn primary" style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => shareResult('report', reportText, '이달의 별숨 흐름')}>공유하기</button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={genReport}
                style={{
                  padding: '9px 20px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--t4)',
                  fontSize: 'var(--xs)',
                  fontFamily: 'var(--ff)',
                }}
              >
                다시 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
