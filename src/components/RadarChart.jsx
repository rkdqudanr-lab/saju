import { useState, useMemo } from "react";
import { getSaju, CGO, JJO, OC } from "../utils/saju.js";

// ─────────────────────────────────────────────
// 오행 상생(相生) / 상극(相克) 관계
// ─────────────────────────────────────────────
const SANGSAENG = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" }; // 생(生)
const SANGGEUK  = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" }; // 극(克)

function getElementRelation(a, b) {
  if (SANGSAENG[a] === b) return 1;   // a가 b를 생함
  if (SANGSAENG[b] === a) return 1;   // b가 a를 생함
  if (SANGGEUK[a] === b) return -1;   // a가 b를 극함
  if (SANGGEUK[b] === a) return -1;   // b가 a를 극함
  return 0; // 동일 or 무관
}

// ─────────────────────────────────────────────
// 5개 영역 점수 산출 (0~100)
// ─────────────────────────────────────────────
const AXES = ["소통", "감정", "가치관", "에너지", "성장"];
const AXIS_ELEMENTS = {
  소통:   ["목", "화"],
  감정:   ["화", "수"],
  가치관: ["토", "금"],
  에너지: ["화", "토"],
  성장:   ["목", "수"],
};

function calcScores(sajuA, sajuB) {
  if (!sajuA || !sajuB) return AXES.map(() => 50);
  return AXES.map(axis => {
    const elements = AXIS_ELEMENTS[axis];
    let score = 50;
    // 일간 오행 관계
    const relIlgan = getElementRelation(CGO[["갑","을","병","정","무","기","경","신","임","계"].indexOf(sajuA.ilgan)], CGO[["갑","을","병","정","무","기","경","신","임","계"].indexOf(sajuB.ilgan)]);
    score += relIlgan * 15;
    // 오행 분포 보완 관계
    elements.forEach(el => {
      const aHas = (sajuA.or[el] || 0) > 0;
      const bHas = (sajuB.or[el] || 0) > 0;
      if (aHas && bHas) score += 8;
      else if (aHas !== bHas) score += 4; // 한쪽이 부족한 걸 채워줌
    });
    // 일지(日支) 관계 보너스
    const jjList = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
    const ajj = jjList.indexOf(sajuA.ilji);
    const bjj = jjList.indexOf(sajuB.ilji);
    if (ajj !== -1 && bjj !== -1 && Math.abs(ajj - bjj) === 4) score += 10; // 삼합
    return Math.max(20, Math.min(95, Math.round(score)));
  });
}

// ─────────────────────────────────────────────
// SVG 레이더 차트 (정오각형)
// ─────────────────────────────────────────────
function RadarSVG({ scores }) {
  const cx = 130, cy = 130, r = 90;
  const n = AXES.length;
  const toXY = (angle, radius) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const angleStep = (2 * Math.PI) / n;

  const dataPoints = scores.map((s, i) => {
    const pt = toXY(angleStep * i, (s / 100) * r);
    return `${pt.x},${pt.y}`;
  });

  return (
    <svg viewBox="0 0 260 260" width="100%" style={{ maxWidth: 280, display: 'block', margin: '0 auto' }}>
      {/* 배경 격자 */}
      {gridLevels.map(level => {
        const pts = Array.from({ length: n }, (_, i) => {
          const p = toXY(angleStep * i, level * r);
          return `${p.x},${p.y}`;
        }).join(' ');
        return <polygon key={level} points={pts} fill="none" stroke="var(--line)" strokeWidth="1" />;
      })}

      {/* 축 선 */}
      {Array.from({ length: n }, (_, i) => {
        const outer = toXY(angleStep * i, r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--line)" strokeWidth="1" />;
      })}

      {/* 데이터 영역 */}
      <polygon
        points={dataPoints.join(' ')}
        fill="rgba(255,210,0,0.15)"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 데이터 포인트 */}
      {scores.map((s, i) => {
        const pt = toXY(angleStep * i, (s / 100) * r);
        return <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="var(--gold)" />;
      })}

      {/* 축 레이블 */}
      {AXES.map((label, i) => {
        const pt = toXY(angleStep * i, r + 20);
        return (
          <text
            key={i}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--t2)"
            fontSize="11"
            fontFamily="var(--ff)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function RadarChart({ form, otherProfiles, setStep, onAddOther }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const mySaju = useMemo(() => {
    if (!form?.by || !form?.bm || !form?.bd) return null;
    try { return getSaju(+form.by, +form.bm, +form.bd, form.bh ? Math.floor(+form.bh) : 12); }
    catch { return null; }
  }, [form]);

  const validOthers = (otherProfiles || []).filter(p => p?.by && p?.bm && p?.bd);

  const otherSaju = useMemo(() => {
    return validOthers.map(p => {
      try { return getSaju(+p.by, +p.bm, +p.bd, p.bh ? Math.floor(+p.bh) : 12); }
      catch { return null; }
    });
  }, [validOthers]);

  const currentOther = validOthers[selectedIdx];
  const currentOtherSaju = otherSaju[selectedIdx] || null;
  const scores = useMemo(() => calcScores(mySaju, currentOtherSaju), [mySaju, currentOtherSaju]);
  const totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  if (!form?.by) {
    return (
      <div className="page step-fade">
        <div className="inner" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🕸️</div>
          <div style={{ color: 'var(--t2)' }}>먼저 나의 생년월일을 입력해야 해요</div>
          <button className="btn-main" style={{ marginTop: 20, width: 'auto', padding: '12px 32px' }} onClick={() => setStep(1)}>프로필 입력하기 ✦</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page step-fade">
      <div className="inner">
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp3)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🕸️</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>나의 궁합 레이더</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>사주 오행으로 보는 5가지 궁합 영역</p>
        </div>

        {validOthers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>👥</div>
            <div style={{ color: 'var(--t2)', fontSize: 'var(--sm)', marginBottom: 16 }}>등록된 지인이 없어요<br />상대방을 추가하면 레이더가 그려져요</div>
            <button className="btn-main" style={{ width: 'auto', padding: '12px 28px' }} onClick={onAddOther}>+ 지인 추가하기</button>
          </div>
        ) : (
          <>
            {/* 지인 탭 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--sp3)', flexWrap: 'wrap' }}>
              {validOthers.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: selectedIdx === i ? '2px solid var(--gold)' : '1px solid var(--line)',
                    background: selectedIdx === i ? 'rgba(255,210,0,.1)' : 'var(--bg2)',
                    color: selectedIdx === i ? 'var(--gold)' : 'var(--t2)',
                    fontFamily: 'var(--ff)',
                    cursor: 'pointer',
                    fontSize: 'var(--sm)',
                    fontWeight: selectedIdx === i ? 700 : 400,
                  }}
                >
                  {p.name || `지인 ${i + 1}`}
                </button>
              ))}
              <button
                onClick={onAddOther}
                style={{ padding: '8px 16px', borderRadius: 20, border: '1px dashed var(--line)', background: 'none', color: 'var(--t4)', fontFamily: 'var(--ff)', cursor: 'pointer', fontSize: 'var(--sm)' }}
              >
                + 추가
              </button>
            </div>

            {/* 종합 점수 */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--sp2)' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gold)' }}>{totalScore}</div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)' }}>
                {form.name || '나'} ↔ {currentOther?.name || '지인'} 종합 궁합 점수
              </div>
            </div>

            {/* 레이더 SVG */}
            <RadarSVG scores={scores} />

            {/* 점수 행 */}
            <div style={{ marginTop: 'var(--sp3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {AXES.map((axis, i) => (
                <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, fontSize: 'var(--xs)', color: 'var(--t3)', textAlign: 'right', flexShrink: 0 }}>{axis}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${scores[i]}%`,
                      height: '100%',
                      background: scores[i] >= 70 ? '#5FAD7A' : scores[i] >= 50 ? 'var(--gold)' : '#E05A3A',
                      borderRadius: 4,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ width: 30, fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 600 }}>{scores[i]}</div>
                </div>
              ))}
            </div>

            {/* 해설 */}
            <div style={{ marginTop: 'var(--sp3)', background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: 'var(--sp3)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8 }}>
                {totalScore >= 75
                  ? `${currentOther?.name || '이 분'}과 당신은 사주 오행이 잘 맞아요. 서로의 기운이 자연스럽게 조화를 이루는 인연이에요 ✦`
                  : totalScore >= 55
                  ? `${currentOther?.name || '이 분'}과 당신은 노력이 필요한 궁합이에요. 서로 다른 기운을 이해하면 더 깊은 관계가 될 수 있어요.`
                  : `${currentOther?.name || '이 분'}과 당신은 오행적으로 충돌이 있어요. 다름을 인정하고 배려하는 것이 열쇠예요.`}
              </div>
            </div>
          </>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
