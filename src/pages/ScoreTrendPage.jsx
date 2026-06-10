import { useEffect, useState } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useUserCtx } from '../context/AppContext.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { STEP } from '../utils/steps.js';

function scoreColor(score) {
  if (score >= 80) return 'var(--gold)';
  if (score >= 60) return 'rgba(255,200,92,.72)';
  if (score >= 40) return 'rgba(212,204,230,.62)';
  return 'rgba(232,123,138,.72)';
}

function ScoreLineChart({ data }) {
  if (!data.length) return null;

  const W = 320;
  const H = 200;
  const PAD = { top: 20, right: 16, bottom: 36, left: 38 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const validData = data.filter((d) => d.score !== null);
  if (!validData.length) return null;

  const pts = data.map((d, i) => ({
    ...d,
    x: PAD.left + (data.length > 1 ? (i / (data.length - 1)) * cw : cw / 2),
    y: d.score !== null ? PAD.top + (1 - d.score / 100) * ch : null,
  }));

  const validPts = pts.filter((p) => p.y !== null);

  const linePath = validPts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    validPts.length > 1
      ? `${linePath} L${validPts.at(-1).x.toFixed(1)},${(PAD.top + ch).toFixed(1)} L${validPts[0].x.toFixed(1)},${(PAD.top + ch).toFixed(1)} Z`
      : null;

  const yLabels = [0, 25, 50, 75, 100];
  const xStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="sgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* y축 그리드 */}
      {yLabels.map((val) => {
        const y = PAD.top + (1 - val / 100) * ch;
        return (
          <g key={val}>
            <line
              x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            <text
              x={PAD.left - 5} y={y + 4}
              textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* 영역 채우기 */}
      {areaPath && (
        <path d={areaPath} fill="url(#sgGrad)" />
      )}

      {/* 라인 */}
      {validPts.length > 1 && (
        <path
          d={linePath} fill="none"
          stroke="var(--gold)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />
      )}

      {/* 점 (30개 이하일 때만) */}
      {data.length <= 30 && validPts.map((p, i) => (
        <circle
          key={i} cx={p.x} cy={p.y} r="3.5"
          fill={scoreColor(p.score)} stroke="var(--bg1)" strokeWidth="1.5"
        />
      ))}

      {/* x축 날짜 레이블 */}
      {pts.map((p, i) => {
        if (i % xStep !== 0 && i !== data.length - 1) return null;
        const d = new Date(p.date);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        return (
          <text
            key={i} x={p.x} y={H - 8}
            textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export default function ScoreTrendPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserCtx();
  const setStep = useAppStore((s) => s.setStep);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const kakaoId = String(user.kakaoId || user.id);

    getAuthenticatedClient(kakaoId)
      ?.from('daily_scores')
      .select('score_date, score')
      .eq('kakao_id', kakaoId)
      .order('score_date', { ascending: true })
      .limit(90)
      .then(({ data }) => {
        setScores(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  const validScores = scores.map((d) => d.score).filter((s) => s !== null);
  const avg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;
  const maxScore = validScores.length ? Math.max(...validScores) : null;
  const minScore = validScores.length ? Math.min(...validScores) : null;

  return (
    <div className="page step-fade" style={{ justifyContent: 'flex-start', paddingTop: 0 }}>

      {/* 헤더 */}
      <div style={{ padding: '16px 20px 0' }}>
        <button
          type="button"
          onClick={() => setStep(STEP.HOME)}
          style={{
            background: 'none', border: 'none', color: 'var(--t3)',
            fontSize: 'var(--sm)', cursor: 'pointer', padding: '8px 0',
            fontFamily: 'var(--ff)',
          }}
        >
          ← 홈으로
        </button>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)' }}>
            별숨 점수 추이
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 2 }}>
            {scores.length > 0 ? `최근 ${scores.length}일 운세 흐름` : '운세 기록을 불러오는 중'}
          </div>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: 'var(--sm)' }}>
          기록을 불러오는 중...
        </div>
      )}

      {/* 데이터 없음 */}
      {!loading && scores.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}></div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7 }}>
            아직 기록된 운세 점수가 없어요.<br />오늘 별숨을 확인해보세요.
          </div>
          <button
            type="button"
            className="daily-mini-cta"
            style={{ marginTop: 20, maxWidth: 240 }}
            onClick={() => setStep(STEP.HOME)}
          >
            홈으로 돌아가기
          </button>
        </div>
      )}

      {/* 차트 + 통계 */}
      {!loading && scores.length > 0 && (
        <div style={{ padding: '16px 16px 60px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 라인 차트 */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--line)',
            borderRadius: 'var(--r2)', padding: '16px',
          }}>
            <ScoreLineChart
              data={scores.map((d) => ({ date: d.score_date, score: d.score }))}
            />
          </div>

          {/* 통계 3칸 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: '평균', value: avg },
              { label: '최고', value: maxScore },
              { label: '최저', value: minScore },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: 'var(--bg2)', border: '1px solid var(--line)',
                  borderRadius: 'var(--r1)', padding: '14px 8px', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: 820, color: 'var(--gold)' }}>{value ?? '-'}</div>
                <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 1 }}>점</div>
              </div>
            ))}
          </div>

          {/* 최근 기록 리스트 */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--line)',
            borderRadius: 'var(--r1)', padding: '16px',
          }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 12, fontWeight: 700 }}>
              최근 기록
            </div>
            {scores.slice(-14).reverse().map((d) => {
              const date = new Date(d.score_date);
              const label = `${date.getMonth() + 1}월 ${date.getDate()}일`;
              return (
                <div
                  key={d.score_date}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 60, height: 4, borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${d.score}%`,
                        background: scoreColor(d.score), borderRadius: 'inherit',
                      }} />
                    </div>
                    <span style={{ fontSize: 'var(--sm)', fontWeight: 700, color: scoreColor(d.score), minWidth: 32, textAlign: 'right' }}>
                      {d.score}점
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
