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
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.1em', marginBottom: 8, textTransform: 'uppercase', opacity: 0.8 }}>✦ Archives</div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em' }}>나의 별숨 일기</div>
          {entries.length > 0 && (
            <div style={{ fontSize: 'var(--xxs)', color: 'var(--t4)', marginTop: 6, fontWeight: 500, letterSpacing: '0.02em' }}>
              TOTAL {entries.length} RECORDS · OVER {months.length} MONTHS
            </div>
          )}
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t4)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📓</div>
            <div style={{ fontSize: 'var(--md)', fontWeight: 600, marginBottom: 8 }}>아직 일기가 없어요</div>
            <div style={{ fontSize: 'var(--sm)', marginBottom: 20, lineHeight: 1.7 }}>오늘의 하루를 별숨에게 처음 전해봐요 🌙</div>
            <button className="btn-main" onClick={() => setStep(17)} style={{ maxWidth: 200 }}>
              오늘 일기 쓰기 ✦
            </button>
          </div>
        ) : (
          <>
            {/* 월 필터 */}
            {months.length > 1 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 24, scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setSelectedMonth(null)}
                  style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, border: `0.5px solid ${!selectedMonth ? 'var(--gold)' : 'var(--line)'}`, background: !selectedMonth ? 'var(--goldf)' : 'var(--bg-glass)', color: !selectedMonth ? 'var(--gold)' : 'var(--t3)', fontSize: 'var(--xxs)', fontFamily: 'var(--ff)', cursor: 'pointer', fontWeight: 700, backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}
                >
                  ALL
                </button>
                {months.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m === selectedMonth ? null : m)}
                    style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, border: `0.5px solid ${selectedMonth === m ? 'var(--gold)' : 'var(--line)'}`, background: selectedMonth === m ? 'var(--goldf)' : 'var(--bg-glass)', color: selectedMonth === m ? 'var(--gold)' : 'var(--t3)', fontSize: 'var(--xxs)', fontFamily: 'var(--ff)', cursor: 'pointer', fontWeight: 600, backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}
                  >
                    {formatMonthLabel(m).toUpperCase()}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {monthEntries.map(entry => {
                    const dateObj = new Date(entry.date + 'T00:00:00');
                    const dayLabel = dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
                    const preview = (entry.content || '').replace(/\n/g, ' ').slice(0, 50);
                    return (
                      <div
                        key={entry.id}
                        onClick={() => { onSelectEntry?.(entry.date); setStep(17); }}
                        style={{ background: 'var(--bg-glass)', border: '0.5px solid var(--line)', borderRadius: 'var(--r2)', padding: '18px 16px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{dayLabel}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {entry.mood && <span style={{ fontSize: '1.2rem' }}>{MOOD_EMOJI[entry.mood]}</span>}
                              {entry.weather && <span style={{ fontSize: '1.1rem' }}>{WEATHER_EMOJI[entry.weather]}</span>}
                            </div>
                            {entry.energy && (
                              <span style={{ fontSize: '9px', color: 'var(--t4)', padding: '2px 8px', borderRadius: 10, background: 'var(--bg-glass-heavy)', border: '0.5px solid var(--line)', fontWeight: 700, letterSpacing: '0.04em' }}>
                                L{entry.energy}
                              </span>
                            )}
                          </div>
                        </div>
                        {preview ? (
                          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: 400 }}>
                            {preview}{entry.content?.length > 50 ? '...' : ''}
                          </div>
                        ) : (
                          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontStyle: 'italic', opacity: 0.6 }}>내용 없음</div>
                        )}
                        {entry.gratitude && (
                          <div style={{ marginTop: 10, fontSize: 'var(--xxs)', color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                             <span style={{ opacity: 0.7 }}>🌿</span> {entry.gratitude.slice(0, 40)}{entry.gratitude.length > 40 ? '...' : ''}
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
