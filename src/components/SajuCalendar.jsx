import { useState, useMemo } from "react";
import { getSaju, CG, JJ, CGH, JJH, OC, ON } from "../utils/saju.js";

// ─────────────────────────────────────────────
// 길흉 판정: 일간(天干) 음/양 + 오행 균형으로 단순 점수화
// ─────────────────────────────────────────────
const YANG_STEMS = new Set(["갑", "병", "무", "경", "임"]);
const LUCKY_EARTHLY = new Set(["자", "묘", "오", "유"]); // 삼합 귀인지
const UNLUCKY_CLASH = {
  자: "오", 축: "미", 인: "신", 묘: "유",
  진: "술", 사: "해", 오: "자", 미: "축",
  신: "인", 유: "묘", 술: "진", 해: "사",
};

function getDayScore(saju) {
  if (!saju) return 50;
  const { ilgan, ilji, or } = saju;
  let score = 50;
  if (YANG_STEMS.has(ilgan)) score += 10;
  if (LUCKY_EARTHLY.has(ilji)) score += 12;
  const vals = Object.values(or);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  if (max - min <= 2) score += 10; // 오행 균형
  if (max >= 5) score -= 10;       // 한 오행 과다
  return Math.max(0, Math.min(100, score));
}

const RECOMMEND_TYPES = [
  { key: "결혼", emoji: "💍", threshold: 68 },
  { key: "이사", emoji: "🏡", threshold: 62 },
  { key: "계약", emoji: "📝", threshold: 65 },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월",
                "7월", "8월", "9월", "10월", "11월", "12월"];

export default function SajuCalendar({ form, setStep }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1-based
  const [selected, setSelected] = useState(null);

  // 사용자 사주의 일간(日干)으로 길충(吉沖) 판단에 활용
  const userIlji = useMemo(() => {
    if (!form?.by || !form?.bm || !form?.bd) return null;
    try {
      return getSaju(+form.by, +form.bm, +form.bd, form.bh ? Math.floor(+form.bh) : 12).ilji;
    } catch { return null; }
  }, [form]);

  // 이번 달 각 날짜의 사주 계산
  const daysData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      try {
        const s = getSaju(viewYear, viewMonth, d, 12);
        let score = getDayScore(s);
        // 사용자 일지와 충(沖) 관계면 감점
        if (userIlji && UNLUCKY_CLASH[userIlji] === s.ilji) score -= 15;
        return { d, saju: s, score: Math.max(0, Math.min(100, score)) };
      } catch {
        return { d, saju: null, score: 50 };
      }
    });
  }, [viewYear, viewMonth, userIlji]);

  // 목적별 추천일 (이달 상위 3개)
  const recommendations = useMemo(() => {
    return RECOMMEND_TYPES.map(type => {
      const candidates = daysData
        .filter(d => d.score >= type.threshold)
        .sort((a, b) => b.score - a.score);
      return { ...type, days: candidates.slice(0, 3).map(d => d.d) };
    });
  }, [daysData]);

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const selectedData = selected ? daysData.find(d => d.d === selected) : null;
  const isToday = (d) => d === now.getDate() && viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
    setSelected(null);
  };

  return (
    <div className="page step-fade">
      <div className="inner">
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp3)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🗓️</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>사주 달력</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>이번 달 길일 · 흉일을 한눈에 확인하세요</p>
        </div>

        {/* 월 이동 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp2)' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--t2)', fontFamily: 'var(--ff)' }}>‹</button>
          <div style={{ fontWeight: 700, color: 'var(--t1)' }}>{viewYear}년 {MONTHS[viewMonth - 1]}</div>
          <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--t2)', fontFamily: 'var(--ff)' }}>›</button>
        </div>

        {/* 요일 헤더 */}
        <div className="cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ textAlign: 'center', fontSize: 'var(--xs)', color: i === 0 ? 'var(--rose)' : i === 6 ? '#4A8EC4' : 'var(--t4)', padding: '4px 0', fontWeight: 600 }}>{w}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: firstWeekday }, (_, i) => <div key={`e${i}`} />)}
          {daysData.map(({ d, saju, score }) => {
            const isLucky = score >= 68;
            const isUnlucky = score < 38;
            const isSel = selected === d;
            const isT = isToday(d);
            const weekday = new Date(viewYear, viewMonth - 1, d).getDay();
            return (
              <button
                key={d}
                onClick={() => setSelected(isSel ? null : d)}
                style={{
                  background: isSel ? 'var(--gold)' : isLucky ? 'rgba(95,173,122,0.15)' : isUnlucky ? 'rgba(224,90,58,0.1)' : 'var(--bg2)',
                  border: isT ? '2px solid var(--gold)' : isSel ? '2px solid var(--gold)' : '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '8px 2px',
                  cursor: 'pointer',
                  fontFamily: 'var(--ff)',
                  color: isSel ? '#0D0B14' : weekday === 0 ? 'var(--rose)' : weekday === 6 ? '#4A8EC4' : 'var(--t1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: '0.85rem',
                  fontWeight: isT ? 700 : 400,
                  minHeight: 54,
                  transition: 'all 0.15s',
                }}
              >
                <span>{d}</span>
                {saju && (
                  <span style={{ fontSize: '0.6rem', color: isSel ? '#0D0B14' : 'var(--t4)', lineHeight: 1 }}>
                    {saju.il.gh}{saju.il.jh}
                  </span>
                )}
                {isLucky && <span style={{ fontSize: '0.55rem', color: isSel ? '#0D0B14' : '#5FAD7A' }}>✦</span>}
                {isUnlucky && <span style={{ fontSize: '0.55rem', color: 'var(--rose)' }}>△</span>}
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, fontSize: 'var(--xs)', color: 'var(--t4)' }}>
          <span><span style={{ color: '#5FAD7A' }}>✦</span> 길일</span>
          <span><span style={{ color: 'var(--rose)' }}>△</span> 흉일</span>
          <span style={{ border: '2px solid var(--gold)', borderRadius: 4, padding: '0 4px' }}>오늘</span>
        </div>

        {/* 선택된 날 상세 */}
        {selectedData && selectedData.saju && (
          <div style={{ marginTop: 'var(--sp3)', background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: 'var(--sp3)', border: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
              {viewMonth}월 {selectedData.d}일 ({WEEKDAYS[new Date(viewYear, viewMonth - 1, selectedData.d).getDay()]}요일)
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8 }}>
              <div>간지: <strong style={{ color: 'var(--gold)' }}>{selectedData.saju.il.gh}{selectedData.saju.il.jh} ({selectedData.saju.il.g}{selectedData.saju.il.j})</strong></div>
              <div>기운: <strong>{ON[selectedData.saju.dom]}</strong> 기운이 강한 날</div>
              <div>일진 점수: <strong style={{ color: selectedData.score >= 68 ? '#5FAD7A' : selectedData.score < 38 ? 'var(--rose)' : 'var(--t1)' }}>{selectedData.score}점</strong></div>
              <div style={{ marginTop: 6, color: 'var(--t3)', fontSize: 'var(--xs)' }}>{selectedData.saju.ilganDesc}</div>
            </div>
          </div>
        )}

        {/* 이달의 추천일 */}
        <div style={{ marginTop: 'var(--sp3)' }}>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 'var(--sp2)' }}>✦ 이달의 추천일</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map(rec => (
              <div key={rec.key} style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '12px 16px', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{rec.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--t1)', fontSize: 'var(--sm)' }}>{rec.key}</div>
                  {rec.days.length > 0 ? (
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 2 }}>
                      {rec.days.map(d => `${viewMonth}/${d}`).join('  ·  ')}
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 2 }}>이달은 적합한 날이 없어요</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
