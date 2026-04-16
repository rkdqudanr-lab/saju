import { useState, useEffect } from "react";
import { supabase, getAuthenticatedClient } from "../lib/supabase.js";

// ═══════════════════════════════════════════════════════════
//  📚 일기 모아보기 — 과거 일기 목록 페이지 (Step 20)
// ═══════════════════════════════════════════════════════════

const MOOD_EMOJI = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };
const WEATHER_EMOJI = {
  sunny: '☀️', cloudy: '☁️', rain: '🌧️', snow: '❄️',
  fine_dust: '😷', thunder: '⛈️', wind: '🌬️',
};

// ── 잔디 심기 스트릭 달력 ──
function StreakCalendar({ entries }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // 일요일(0)을 마지막으로 보내는 월요일 시작 offset
  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = (firstDow + 6) % 7; // Mon=0 ... Sun=6

  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const doneSet = new Set(entries.map(e => e.date?.slice(0, 10)).filter(Boolean));

  // 연속 스트릭 계산 (오늘부터 거슬러 올라가기)
  let streak = 0;
  for (let d = now.getDate(); d >= 1; d--) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (doneSet.has(key)) streak++;
    else break;
  }

  // 이번 달 완료 수
  const thisMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const thisMonthCount = entries.filter(e => e.date?.startsWith(thisMonthPrefix)).length;

  // 그리드 셀 (빈칸 + 날짜)
  const cells = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--line)',
      borderRadius: 'var(--r2)', padding: 16, marginBottom: 20,
      animation: 'fadeUp .4s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)', letterSpacing: '.05em' }}>
          ✦ {month + 1}월 일기 기록
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>{thisMonthCount}일 작성</span>
          {streak > 0 && (
            <span style={{
              fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)',
              background: 'var(--goldf)', padding: '2px 8px', borderRadius: 10,
              border: '1px solid var(--acc)',
            }}>
              🔥 {streak}일 연속!
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--t4)', fontWeight: 600, padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`b${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const done = doneSet.has(dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = day > now.getDate();
          return (
            <div key={day} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6,
              background: done ? 'var(--goldf)' : isToday ? 'var(--bg3)' : 'transparent',
              border: isToday ? '1px solid var(--gold)' : '1px solid transparent',
            }}>
              {done ? (
                <span style={{ fontSize: 13, color: 'var(--gold)' }}>★</span>
              ) : (
                <span style={{ fontSize: 11, color: isFuture ? 'var(--t4)' : isToday ? 'var(--t1)' : 'var(--t3)', opacity: isFuture ? 0.3 : 1 }}>{day}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function groupByMonth(entries) {
  const groups = {};
  for (const e of entries) {
    const key = e.date.slice(0, 7); // "YYYY-MM"
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function formatMonthLabel(yyyyMM) {
  const [y, m] = yyyyMM.split('-');
  return `${y}년 ${parseInt(m)}월`;
}

export default function DiaryListPage({ user, setStep, onSelectEntry }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const client = getAuthenticatedClient(user.id) || supabase;
    if (!client) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await client
          .from('diary_entries')
          .select('id, date, content, mood, weather, energy, gratitude, tomorrow_goal')
          .eq('kakao_id', String(user.id))
          .order('date', { ascending: false })
          .limit(200);
        // 날짜 기준 중복 제거 (같은 날짜 첫 번째 항목만 유지)
        const seen = new Set();
        const deduped = (data || []).filter(e => {
          if (seen.has(e.date)) return false;
          seen.add(e.date);
          return true;
        });
        setEntries(deduped);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user?.id]);

  const grouped = groupByMonth(entries);
  const months = grouped.map(([k]) => k);

  const displayGroups = selectedMonth
    ? grouped.filter(([k]) => k === selectedMonth)
    : grouped;

  if (loading) {
    return (
      <div className="page">
        <div className="inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page step-fade">
      <div className="inner" style={{ paddingTop: 56, paddingBottom: 60 }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.1em', marginBottom: 4 }}>📚 일기 모아보기</div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)' }}>나의 별숨 일기</div>
          {entries.length > 0 && (
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 4 }}>
              총 {entries.length}개의 일기 · {months.length}개월
            </div>
          )}
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t4)' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 16, color: 'var(--t4)' }}>✦</div>
            <div style={{ fontSize: 'var(--md)', fontWeight: 600, marginBottom: 8 }}>아직 일기가 없어요</div>
            <div style={{ fontSize: 'var(--sm)', marginBottom: 20, lineHeight: 1.7 }}>오늘의 하루를 별숨에게 처음 전해봐요</div>
            <button className="btn-main" onClick={() => setStep(17)} style={{ maxWidth: 200 }}>
              오늘 일기 쓰기 ✦
            </button>
          </div>
        ) : (
          <>
            {/* 잔디 스트릭 달력 */}
            <StreakCalendar entries={entries} />

            {/* 월 필터 */}
            {months.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 20, scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setSelectedMonth(null)}
                  style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: `1px solid ${!selectedMonth ? 'var(--gold)' : 'var(--line)'}`, background: !selectedMonth ? 'var(--goldf)' : 'transparent', color: !selectedMonth ? 'var(--gold)' : 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', fontWeight: !selectedMonth ? 700 : 400 }}
                >
                  전체
                </button>
                {months.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m === selectedMonth ? null : m)}
                    style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: `1px solid ${selectedMonth === m ? 'var(--gold)' : 'var(--line)'}`, background: selectedMonth === m ? 'var(--goldf)' : 'transparent', color: selectedMonth === m ? 'var(--gold)' : 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', fontWeight: selectedMonth === m ? 700 : 400 }}
                  >
                    {formatMonthLabel(m)}
                  </button>
                ))}
              </div>
            )}

            {/* 월별 그룹 */}
            {displayGroups.map(([monthKey, monthEntries]) => (
              <div key={monthKey} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 10, paddingLeft: 2 }}>
                  ✦ {formatMonthLabel(monthKey)} ({monthEntries.length}개)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {monthEntries.map(entry => {
                    const dateObj = new Date(entry.date + 'T00:00:00');
                    const dayLabel = dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
                    const preview = (entry.content || '').replace(/\n/g, ' ').slice(0, 50);
                    return (
                      <div
                        key={entry.id}
                        onClick={() => { onSelectEntry?.(entry.date); setStep(17); }}
                        style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)', padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s, background .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--goldf)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--bg2)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>{dayLabel}</span>
                            {entry.mood && <span style={{ fontSize: '1.1rem' }}>{MOOD_EMOJI[entry.mood]}</span>}
                            {entry.weather && <span style={{ fontSize: '1rem' }}>{WEATHER_EMOJI[entry.weather]}</span>}
                            {entry.energy && (
                              <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)', padding: '1px 6px', borderRadius: 10, background: 'var(--bg1)', border: '1px solid var(--line)' }}>
                                ⚡{entry.energy}/5
                              </span>
                            )}
                          </div>
                        </div>
                        {preview ? (
                          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {preview}{entry.content?.length > 50 ? '...' : ''}
                          </div>
                        ) : (
                          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontStyle: 'italic' }}>내용 없음</div>
                        )}
                        {entry.gratitude && (
                          <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                            🌿 {entry.gratitude.slice(0, 40)}{entry.gratitude.length > 40 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* 오늘 일기 쓰기 버튼 */}
            <button className="btn-main" onClick={() => setStep(17)} style={{ marginTop: 8 }}>
              오늘 일기 쓰기 ✦
            </button>
          </>
        )}
      </div>
    </div>
  );
}
