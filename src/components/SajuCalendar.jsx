import { useState, useMemo } from "react";
import { getSaju, ON } from "../utils/saju.js";

// ─────────────────────────────────────────────
// 일진 점수 계산
// ─────────────────────────────────────────────
const YANG_STEMS = new Set(["갑", "병", "무", "경", "임"]);
const LUCKY_EARTHLY = new Set(["자", "묘", "오", "유"]);
const UNLUCKY_CLASH = {
  자: "오", 축: "미", 인: "신", 묘: "유",
  진: "술", 사: "해", 오: "자", 미: "축",
  신: "인", 유: "묘", 술: "진", 해: "사",
};

function getDayScore(saju, userIlji) {
  if (!saju) return 50;
  const { ilgan, ilji, or } = saju;
  let score = 50;
  if (YANG_STEMS.has(ilgan)) score += 10;
  if (LUCKY_EARTHLY.has(ilji)) score += 12;
  const vals = Object.values(or);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  if (max - min <= 2) score += 10;
  if (max >= 5) score -= 10;
  if (userIlji && UNLUCKY_CLASH[userIlji] === ilji) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function scoreColor(score) {
  if (score >= 68) return '#5FAD7A';
  if (score < 38) return 'var(--rose)';
  return 'var(--t3)';
}

function scoreBg(score) {
  if (score >= 68) return 'rgba(95,173,122,0.15)';
  if (score < 38) return 'rgba(224,90,58,0.08)';
  return 'var(--bg2)';
}

function scoreLabel(score) {
  if (score >= 75) return '아주 좋은 날';
  if (score >= 68) return '좋은 날';
  if (score >= 50) return '무난한 날';
  if (score >= 38) return '조심할 날';
  return '피하면 좋은 날';
}

// ─────────────────────────────────────────────
// 이벤트 저장소 (localStorage)
// ─────────────────────────────────────────────
const STORAGE_KEY = "byeolsoom_calendar_events";

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveToStorage(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function dateKey(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

export default function SajuCalendar({ form, setStep, askQuick }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState(loadEvents);
  const [inputText, setInputText] = useState('');

  const userIlji = useMemo(() => {
    if (!form?.by || !form?.bm || !form?.bd) return null;
    try {
      return getSaju(+form.by, +form.bm, +form.bd, form.bh ? Math.floor(+form.bh) : 12).ilji;
    } catch { return null; }
  }, [form]);

  const daysData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      try {
        const s = getSaju(viewYear, viewMonth, d, 12);
        const score = getDayScore(s, userIlji);
        return { d, saju: s, score };
      } catch {
        return { d, saju: null, score: 50 };
      }
    });
  }, [viewYear, viewMonth, userIlji]);

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
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

  const selectedData = selected ? daysData.find(d => d.d === selected) : null;
  const selectedKey = selected ? dateKey(viewYear, viewMonth, selected) : null;
  const selectedEvents = selectedKey ? (events[selectedKey] || []) : [];

  const addEvent = () => {
    if (!inputText.trim() || !selectedKey) return;
    const newEvent = { id: Date.now(), title: inputText.trim() };
    const updated = { ...events, [selectedKey]: [...(events[selectedKey] || []), newEvent] };
    setEvents(updated);
    saveToStorage(updated);
    setInputText('');
  };

  const deleteEvent = (key, id) => {
    const updated = { ...events };
    updated[key] = (updated[key] || []).filter(e => e.id !== id);
    if (updated[key].length === 0) delete updated[key];
    setEvents(updated);
    saveToStorage(updated);
  };

  const askAboutEvent = (eventTitle, score, d) => {
    const q = `${viewMonth}월 ${d}일에 '${eventTitle}' 일정이 있어요. 이날 나의 사주 기운이 ${score}점인데, 이 일정이 잘 될까요?`;
    if (askQuick) {
      askQuick(q);
      setStep(3);
    }
  };

  // 이번 달 일정 있는 날짜 수
  const eventDays = Object.keys(events).filter(k => k.startsWith(`${viewYear}-${String(viewMonth).padStart(2,'0')}`));

  return (
    <div className="page step-fade">
      <div className="inner">
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp3)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🗓️</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>별숨 달력</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>
            일정을 입력하고 별숨에게 바로 물어봐요
          </p>
        </div>

        {/* 월 이동 */}
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
            const isSel = selected === d;
            const isT = isToday(d);
            const weekday = new Date(viewYear, viewMonth - 1, d).getDay();
            const key = dateKey(viewYear, viewMonth, d);
            const dayEvents = events[key] || [];
            const hasEvents = dayEvents.length > 0;
            return (
              <button
                key={d}
                onClick={() => setSelected(isSel ? null : d)}
                style={{
                  background: isSel ? 'var(--gold)' : scoreBg(score),
                  border: isT ? '2px solid var(--gold)' : isSel ? '2px solid var(--gold)' : '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '6px 2px',
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
                  position: 'relative',
                }}
              >
                <span>{d}</span>
                {saju && (
                  <span style={{ fontSize: '0.55rem', color: isSel ? '#0D0B14' : 'var(--t4)', lineHeight: 1 }}>
                    {saju.il.gh}{saju.il.jh}
                  </span>
                )}
                <span style={{ fontSize: '0.55rem', color: isSel ? '#0D0B14' : scoreColor(score), fontWeight: 600 }}>
                  {score}
                </span>
                {hasEvents && (
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: isSel ? '#0D0B14' : 'var(--gold)',
                    display: 'block',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10, fontSize: 'var(--xs)', color: 'var(--t4)', flexWrap: 'wrap' }}>
          <span><span style={{ color: '#5FAD7A' }}>■</span> 68+ 좋은 날</span>
          <span><span style={{ color: 'var(--rose)' }}>■</span> 38미만 조심</span>
          <span><span style={{ color: 'var(--gold)' }}>●</span> 일정 있음</span>
          <span style={{ border: '2px solid var(--gold)', borderRadius: 4, padding: '0 4px' }}>오늘</span>
        </div>

        {/* 선택된 날 패널 */}
        {selectedData && (
          <div style={{ marginTop: 'var(--sp3)', background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: 'var(--sp3)', border: '1px solid var(--line)' }}>
            {/* 날짜 정보 */}
            <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 10, fontSize: 'var(--md)' }}>
              {viewMonth}월 {selectedData.d}일 ({WEEKDAYS[new Date(viewYear, viewMonth - 1, selectedData.d).getDay()]}요일)
            </div>

            {selectedData.saju && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--r1)', border: `1px solid ${scoreColor(selectedData.score)}33` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 4 }}>
                    일진: <strong style={{ color: 'var(--gold)' }}>{selectedData.saju.il.gh}{selectedData.saju.il.jh}</strong>
                    &nbsp;·&nbsp;{selectedData.saju.ilganDesc || `${ON[selectedData.saju.dom]} 기운`}
                  </div>
                  <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)' }}>
                    나의 사주 기운&nbsp;
                    <strong style={{ color: scoreColor(selectedData.score), fontSize: '1.1rem' }}>{selectedData.score}점</strong>
                    &nbsp;<span style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>({scoreLabel(selectedData.score)})</span>
                  </div>
                </div>
              </div>
            )}

            {/* 일정 목록 */}
            {selectedEvents.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontWeight: 600, marginBottom: 8, letterSpacing: '.04em' }}>이날의 일정</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedEvents.map(ev => (
                    <div key={ev.id} style={{ background: 'var(--bg1)', borderRadius: 'var(--r1)', padding: '10px 12px', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 'var(--sm)', color: 'var(--t1)' }}>📅 {ev.title}</span>
                      <button
                        onClick={() => askAboutEvent(ev.title, selectedData.score, selectedData.d)}
                        style={{
                          background: 'linear-gradient(135deg, var(--goldf), rgba(155,142,196,.15))',
                          border: '1px solid var(--gold)',
                          borderRadius: 20,
                          padding: '5px 12px',
                          fontSize: 'var(--xs)',
                          color: 'var(--gold)',
                          fontFamily: 'var(--ff)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        별숨에게 물어보기 ✦
                      </button>
                      <button
                        onClick={() => deleteEvent(selectedKey, ev.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px', fontFamily: 'var(--ff)' }}
                        aria-label="일정 삭제"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 일정 입력 */}
            <div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontWeight: 600, marginBottom: 6, letterSpacing: '.04em' }}>
                {selectedEvents.length > 0 ? '일정 추가하기' : '이날 일정 입력하기'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="inp"
                  style={{ flex: 1, marginBottom: 0, padding: '10px 12px', fontSize: 'var(--sm)' }}
                  placeholder="예: 면접, 첫 데이트, 계약서 서명…"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addEvent(); }}
                  maxLength={40}
                />
                <button
                  onClick={addEvent}
                  disabled={!inputText.trim()}
                  style={{
                    background: inputText.trim() ? 'var(--gold)' : 'var(--bg3)',
                    color: inputText.trim() ? '#0D0B14' : 'var(--t4)',
                    border: 'none',
                    borderRadius: 'var(--r1)',
                    padding: '0 18px',
                    fontFamily: 'var(--ff)',
                    fontWeight: 700,
                    cursor: inputText.trim() ? 'pointer' : 'default',
                    fontSize: 'var(--sm)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  추가
                </button>
              </div>
              {inputText.trim() && (
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 6 }}>
                  입력 후 추가하면 '별숨에게 물어보기'로 바로 질문할 수 있어요
                </div>
              )}
            </div>
          </div>
        )}

        {/* 이달 일정 요약 */}
        {eventDays.length > 0 && !selected && (
          <div style={{ marginTop: 'var(--sp3)' }}>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 10 }}>✦ 이달의 일정</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {eventDays.sort().map(key => {
                const [, , d] = key.split('-');
                const dayNum = parseInt(d, 10);
                const dayData = daysData.find(dd => dd.d === dayNum);
                const dayEvs = events[key] || [];
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(dayNum)}
                    style={{
                      background: 'var(--bg2)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--r1)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      fontFamily: 'var(--ff)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ minWidth: 44, textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 'var(--sm)' }}>{viewMonth}/{dayNum}</div>
                      <div style={{ fontSize: 'var(--xs)', color: scoreColor(dayData?.score || 50), fontWeight: 600 }}>{dayData?.score || 50}점</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {dayEvs.map(ev => (
                        <div key={ev.id} style={{ fontSize: 'var(--xs)', color: 'var(--t2)', marginBottom: 2 }}>📅 {ev.title}</div>
                      ))}
                    </div>
                    <span style={{ color: 'var(--t4)', fontSize: 'var(--xs)' }}>›</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {eventDays.length === 0 && !selected && (
          <div style={{ marginTop: 'var(--sp4)', textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--sm)', lineHeight: 1.8 }}>
            날짜를 눌러 일정을 입력하면<br />별숨에게 바로 물어볼 수 있어요 🌙
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
