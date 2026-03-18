import { useState, useMemo, useCallback } from "react";
import { getSaju, CG, JJ, CGH, JJH, OC, ON } from "../utils/saju.js";

// ─────────────────────────────────────────────
// 길흉 판정: 목적별 가중치 적용
// ─────────────────────────────────────────────
const YANG_STEMS = new Set(["갑", "병", "무", "경", "임"]);
const LUCKY_EARTHLY = new Set(["자", "묘", "오", "유"]);
const UNLUCKY_CLASH = {
  자: "오", 축: "미", 인: "신", 묘: "유",
  진: "술", 사: "해", 오: "자", 미: "축",
  신: "인", 유: "묘", 술: "진", 해: "사",
};

// 목적별 추가 가중치: 음양오행 특성 반영
const PURPOSE_WEIGHTS = {
  결혼: { yangBonus: 5, earthlyBonus: { 자: 8, 오: 8, 묘: 6, 유: 6 }, domBonus: { 목: 5, 화: 8, 토: 3 } },
  이사: { yangBonus: 8, earthlyBonus: { 인: 8, 신: -5, 자: 5 }, domBonus: { 목: 8, 토: 5, 수: 6 } },
  계약: { yangBonus: 10, earthlyBonus: { 자: 5, 묘: 8, 유: 5 }, domBonus: { 금: 10, 목: 5, 수: 3 } },
  시험: { yangBonus: 8, earthlyBonus: { 자: 10, 묘: 8, 오: 5 }, domBonus: { 수: 10, 목: 8, 금: 3 } },
};

function getDayScore(saju, userIlji, purpose) {
  if (!saju) return 50;
  const { ilgan, ilji, or } = saju;
  let score = 50;
  const pw = purpose ? PURPOSE_WEIGHTS[purpose] : null;

  if (YANG_STEMS.has(ilgan)) score += pw ? pw.yangBonus : 10;
  if (LUCKY_EARTHLY.has(ilji)) score += pw ? (pw.earthlyBonus?.[ilji] ?? 12) : 12;
  if (pw?.domBonus) {
    const dom = Object.entries(or).sort(([,a],[,b])=>b-a)[0]?.[0];
    score += pw.domBonus[dom] || 0;
  }
  const vals = Object.values(or);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  if (max - min <= 2) score += 10;
  if (max >= 5) score -= 10;
  if (userIlji && UNLUCKY_CLASH[userIlji] === ilji) score -= 15;
  return Math.max(0, Math.min(100, score));
}

const RECOMMEND_TYPES = [
  { key: "결혼", emoji: "💍", threshold: 68 },
  { key: "이사", emoji: "🏡", threshold: 62 },
  { key: "계약", emoji: "📝", threshold: 65 },
  { key: "시험", emoji: "📚", threshold: 60 },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

export default function SajuCalendar({ form, callApi, setStep, embedded = false }) {
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected]   = useState(null);

  // 날짜 클릭 후 이벤트 입력 상태
  const [eventLabel, setEventLabel]       = useState('');
  const [eventLoading, setEventLoading]   = useState(false);
  const [eventResult, setEventResult]     = useState('');

  // 직접 입력 추천 날짜
  const [customOccasion, setCustomOccasion]       = useState('');
  const [customRecs, setCustomRecs]               = useState(null);  // { label, days[] }
  const [customRecsLoading, setCustomRecsLoading] = useState(false);

  const userIlji = useMemo(() => {
    if (!form?.by || !form?.bm || !form?.bd) return null;
    try { return getSaju(+form.by, +form.bm, +form.bd, form.bh ? Math.floor(+form.bh) : 12).ilji; }
    catch { return null; }
  }, [form]);

  const daysData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      try {
        const s = getSaju(viewYear, viewMonth, d, 12);
        // 기본 점수 (목적 없이)
        const score = getDayScore(s, userIlji, null);
        return { d, saju: s, score };
      } catch { return { d, saju: null, score: 50 }; }
    });
  }, [viewYear, viewMonth, userIlji]);

  // 목적별 추천일 (각각 독립 점수)
  const recommendations = useMemo(() => {
    return RECOMMEND_TYPES.map(type => {
      const scored = daysData.map(item => ({
        ...item,
        purposeScore: item.saju ? getDayScore(item.saju, userIlji, type.key) : 50,
      }));
      const candidates = scored
        .filter(d => d.purposeScore >= type.threshold)
        .sort((a, b) => b.purposeScore - a.purposeScore);
      return { ...type, days: candidates.slice(0, 3).map(d => d.d) };
    });
  }, [daysData, userIlji]);

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const selectedData = selected ? daysData.find(d => d.d === selected) : null;
  const isToday = (d) => d === now.getDate() && viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
    setSelected(null); setEventLabel(''); setEventResult('');
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
    setSelected(null); setEventLabel(''); setEventResult('');
  };

  const handleSelectDate = (d) => {
    if (selected === d) { setSelected(null); setEventLabel(''); setEventResult(''); }
    else { setSelected(d); setEventLabel(''); setEventResult(''); }
  };

  // 선택된 날짜 + 이벤트로 기념일 운세 조회
  const handleAskEvent = useCallback(async () => {
    if (!selected || !eventLabel.trim() || !callApi) return;
    setEventLoading(true);
    setEventResult('');
    try {
      const dateStr = `${viewYear}년 ${viewMonth}월 ${selected}일`;
      const sajuDesc = selectedData?.saju
        ? `간지 ${selectedData.saju.il.gh}${selectedData.saju.il.jh}, ${ON[selectedData.saju.dom]} 기운`
        : '';
      const prompt = `사용자가 특별한 날짜를 가져왔어요. '${eventLabel.trim()}' — ${dateStr}${sajuDesc ? ` (${sajuDesc})` : ''}입니다.\n이 날의 사주(간지, 오행, 기운)를 바탕으로, 왜 이 날이 특별한지, 어떤 에너지가 담겨 있는지, "이 날을 선택한 이유가 있었군요"라는 관점으로 따뜻하게 해석해주세요.`;
      const result = await callApi(prompt);
      setEventResult(result);
    } catch {
      setEventResult('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.');
    } finally {
      setEventLoading(false);
    }
  }, [selected, eventLabel, viewYear, viewMonth, selectedData, callApi]);

  // 직접 입력 → API 추천 날짜
  const handleCustomRecs = useCallback(async () => {
    if (!customOccasion.trim() || !callApi) return;
    setCustomRecsLoading(true);
    setCustomRecs(null);
    try {
      const prompt = `이번 달(${viewYear}년 ${viewMonth}월) 중에서 '${customOccasion.trim()}'에 가장 좋은 날 3일을 추천해줘요. 사주의 간지와 오행을 기준으로 분석해서, 날짜 숫자만 쉼표로 구분해서 답해줘요. 예: 3, 11, 24`;
      const result = await callApi(prompt);
      // "3, 11, 24" 같은 형태로 파싱
      const days = result.match(/\d+/g)?.map(Number).filter(d => d >= 1 && d <= 31).slice(0, 3) || [];
      setCustomRecs({ label: customOccasion.trim(), days });
    } catch {
      setCustomRecs({ label: customOccasion.trim(), days: [] });
    } finally {
      setCustomRecsLoading(false);
    }
  }, [customOccasion, viewYear, viewMonth, callApi]);

  const content = (
    <>
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp3)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🗓️</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>별숨 달력</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>이달 길일·흉일 확인 · 날짜를 눌러 기념일 운세를 봐요</p>
        </div>

        {/* 월 이동 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp2)' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--t2)', fontFamily: 'var(--ff)' }}>‹</button>
          <div style={{ fontWeight: 700, color: 'var(--t1)' }}>{viewYear}년 {MONTHS[viewMonth - 1]}</div>
          <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--t2)', fontFamily: 'var(--ff)' }}>›</button>
        </div>

        {/* 요일 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ textAlign: 'center', fontSize: 'var(--xs)', color: i === 0 ? 'var(--rose)' : i === 6 ? '#4A8EC4' : 'var(--t4)', padding: '4px 0', fontWeight: 600 }}>{w}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
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
                onClick={() => handleSelectDate(d)}
                style={{
                  background: isSel ? 'var(--gold)' : isLucky ? 'rgba(95,173,122,0.15)' : isUnlucky ? 'rgba(224,90,58,0.1)' : 'var(--bg2)',
                  border: isT ? '2px solid var(--gold)' : isSel ? '2px solid var(--gold)' : '1px solid var(--line)',
                  borderRadius: 8, padding: '8px 2px', cursor: 'pointer', fontFamily: 'var(--ff)',
                  color: isSel ? '#0D0B14' : weekday === 0 ? 'var(--rose)' : weekday === 6 ? '#4A8EC4' : 'var(--t1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  fontSize: '0.85rem', fontWeight: isT ? 700 : 400, minHeight: 54, transition: 'all 0.15s',
                }}
              >
                <span>{d}</span>
                {saju && <span style={{ fontSize: '0.6rem', color: isSel ? '#0D0B14' : 'var(--t4)', lineHeight: 1 }}>{saju.il.gh}{saju.il.jh}</span>}
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

        {/* 선택된 날 상세 + 기념일 운세 */}
        {selectedData && selectedData.saju && (
          <div style={{ marginTop: 'var(--sp3)', background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: 'var(--sp3)', border: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
              {viewMonth}월 {selectedData.d}일 ({WEEKDAYS[new Date(viewYear, viewMonth - 1, selectedData.d).getDay()]}요일)
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8, marginBottom: 'var(--sp2)' }}>
              <div>간지: <strong style={{ color: 'var(--gold)' }}>{selectedData.saju.il.gh}{selectedData.saju.il.jh} ({selectedData.saju.il.g}{selectedData.saju.il.j})</strong></div>
              <div>기운: <strong>{ON[selectedData.saju.dom]}</strong> 기운이 강한 날</div>
              <div>일진: <strong style={{ color: selectedData.score >= 68 ? '#5FAD7A' : selectedData.score < 38 ? 'var(--rose)' : 'var(--t1)' }}>{selectedData.score}점</strong></div>
            </div>

            {/* 기념일 운세 입력 */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--sp2)', marginTop: 'var(--sp2)' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 8 }}>이 날에 무슨 일이 있나요?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="inp"
                  style={{ flex: 1, marginBottom: 0, fontSize: 'var(--sm)', padding: '10px 12px' }}
                  placeholder="예: 면접, 첫 만남, 계약서 서명..."
                  value={eventLabel}
                  onChange={e => { setEventLabel(e.target.value); setEventResult(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAskEvent()}
                  maxLength={30}
                />
                <button
                  className="btn-main"
                  style={{ whiteSpace: 'nowrap', padding: '10px 14px', fontSize: 'var(--sm)', flexShrink: 0 }}
                  disabled={!eventLabel.trim() || eventLoading}
                  onClick={handleAskEvent}
                >
                  {eventLoading ? '⋯' : '기념일 운세'}
                </button>
              </div>

              {eventResult && (
                <div style={{ marginTop: 'var(--sp2)', background: 'var(--bg3)', borderRadius: 'var(--r1)', padding: 'var(--sp2)', fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {eventResult}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 이달의 추천일 (목적별 — 날짜만 표시) */}
        <div style={{ marginTop: 'var(--sp3)', background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: '14px 16px', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t3)', marginBottom: 10, letterSpacing: '.05em' }}>✦ 이달의 추천일</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recommendations.map(rec => (
              <div key={rec.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{rec.emoji}</span>
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', width: 36, flexShrink: 0 }}>{rec.key}</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {rec.days.length > 0 ? rec.days.map(d => (
                    <button key={d} onClick={() => handleSelectDate(d)}
                      style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer', color: 'var(--gold)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', padding: '2px 8px' }}>
                      {viewMonth}/{d}
                    </button>
                  )) : <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>없음</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 직접 입력 추천 날짜 */}
        {callApi && (
          <div style={{ marginTop: 'var(--sp3)', background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: 'var(--sp3)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>✦ 직접 입력하여 날짜 추천받기</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 'var(--sp2)' }}>어떤 일을 위한 날짜인지 알려주세요. 별숨이 이달 중 좋은 날을 골라드려요.</div>
            <input
              className="inp"
              style={{ width: '100%', marginBottom: 'var(--sp2)', fontSize: 'var(--sm)', padding: '10px 12px' }}
              placeholder="예: 사업 시작, 고백, 중요한 발표..."
              value={customOccasion}
              onChange={e => { setCustomOccasion(e.target.value); setCustomRecs(null); }}
              onKeyDown={e => e.key === 'Enter' && handleCustomRecs()}
              maxLength={30}
            />
            <button
              className="btn-main"
              style={{ width: '100%', padding: '12px 14px', fontSize: 'var(--sm)' }}
              disabled={!customOccasion.trim() || customRecsLoading}
              onClick={handleCustomRecs}
            >
              {customRecsLoading ? '별숨에게 날짜를 받아오는 중 ⋯' : '별숨에게 날짜 받아오기 ✦'}
            </button>
            {customRecs && (
              <div style={{ marginTop: 'var(--sp2)' }}>
                {customRecs.days.length > 0 ? (
                  <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{customRecs.label}</span>에 좋은 날:{' '}
                    {customRecs.days.map(d => (
                      <button key={d} onClick={() => handleSelectDate(d)}
                        style={{ background: 'rgba(232,176,72,.1)', border: '1px solid var(--gold)', borderRadius: 6, cursor: 'pointer', color: 'var(--gold)', fontSize: 'var(--sm)', fontFamily: 'var(--ff)', padding: '2px 10px', marginLeft: 6 }}>
                        {viewMonth}/{d}일
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>이달은 적합한 날을 찾지 못했어요. 다음 달을 확인해봐요.</div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ height: embedded ? 16 : 40 }} />
    </>
  );

  if (embedded) {
    return <div style={{ marginTop: 'var(--sp3)' }}>{content}</div>;
  }
  return (
    <div className="page step-fade">
      <div className="inner">{content}</div>
    </div>
  );
}
