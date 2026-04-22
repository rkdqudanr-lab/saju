import { useState, useMemo, useEffect, useCallback } from "react";
import { getSaju, ON } from "../utils/saju.js";
import { supabase, getAuthenticatedClient } from "../lib/supabase.js";
import { CATS_ALL, breakAtNatural } from "../utils/constants.js";
import { calcBiorhythm, BIORHYTHM_CHANNELS, toBarWidth, getBiorhythmStatus, BIORHYTHM_STATUS_LABEL } from "../utils/biorhythm.js";

// ─────────────────────────────────────────────
// 일진 점수 계산 (5단계 색상)
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

// ─────────────────────────────────────────────
// 길일 카테고리 뱃지 (결혼/계약/이사/여행)
// ─────────────────────────────────────────────
const AUSPICIOUS_STEMS = new Set(['갑', '병', '임']);   // 양기 강한 천간
const AUSPICIOUS_BRANCHES = new Set(['자', '오', '묘', '유']); // 사정위(四正位)
const STABLE_BRANCHES = new Set(['인', '신', '사', '해']); // 역마살 — 이동 길일

/** 점수 + 지지 조합으로 길일 카테고리 배열 반환 */
function getLuckyCategories(saju, score) {
  if (!saju || score < 65) return [];
  const { ilgan, ilji } = saju;
  const categories = [];

  // 결혼 길일: 양간 + 사정위 지지 + 점수 80+
  if (score >= 80 && AUSPICIOUS_STEMS.has(ilgan) && AUSPICIOUS_BRANCHES.has(ilji)) {
    categories.push({ label: '결혼', emoji: '💍', color: '#E8B048' });
  }
  // 계약/거래 길일: 양간 + 점수 75+
  if (score >= 75 && AUSPICIOUS_STEMS.has(ilgan)) {
    categories.push({ label: '계약', emoji: '📝', color: '#5FAD7A' });
  }
  // 이사 길일: 역마지지(인신사해) + 점수 70+
  if (score >= 70 && STABLE_BRANCHES.has(ilji)) {
    categories.push({ label: '이사', emoji: '🏠', color: '#4A9EFF' });
  }
  // 여행 길일: 역마지지 또는 점수 75+
  if (score >= 75 || (score >= 65 && STABLE_BRANCHES.has(ilji))) {
    categories.push({ label: '여행', emoji: '✈️', color: '#7B6CF6' });
  }
  return categories;
}

// 5단계 색상 시스템
function scoreColor(score) {
  if (score >= 85) return '#4CAF50';
  if (score >= 68) return '#81C784';
  if (score >= 50) return '#E6C35A';
  if (score >= 38) return '#FF8A65';
  return '#E05A3A';
}

function scoreBg(score) {
  if (score >= 85) return 'rgba(76,175,80,0.18)';
  if (score >= 68) return 'rgba(129,199,132,0.15)';
  if (score >= 50) return 'rgba(230,195,90,0.12)';
  if (score >= 38) return 'rgba(255,138,101,0.12)';
  return 'rgba(224,90,58,0.12)';
}

function scoreLabel(score) {
  if (score >= 85) return '최고의 날 ✦';
  if (score >= 68) return '좋은 날';
  if (score >= 50) return '무난한 날';
  if (score >= 38) return '조심할 날';
  return '피하면 좋은 날';
}

function dateKey(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

// 일정 시간 파싱 — "[HH:MM] 제목" 형식
function parseEventTitle(raw) {
  const m = raw.match(/^\[(\d{2}:\d{2})\]\s*(.+)$/);
  if (m) return { time: m[1], title: m[2] };
  return { time: null, title: raw };
}

function sortedEvents(evs) {
  return [...evs].sort((a, b) => {
    const ta = parseEventTitle(a.title).time || '99:99';
    const tb = parseEventTitle(b.title).time || '99:99';
    return ta.localeCompare(tb);
  });
}

// 운세/일기 표시용 맵
const MOOD_MAP = {
  1: { emoji: '😞', label: '많이 힘들어요' },
  2: { emoji: '😕', label: '조금 힘들어요' },
  3: { emoji: '😐', label: '그냥 그래요' },
  4: { emoji: '🙂', label: '좋은 편이에요' },
  5: { emoji: '😄', label: '아주 좋아요' },
};
const WEATHER_MAP = {
  sunny: '☀️', cloudy: '☁️', rain: '🌧️', snow: '❄️',
  fine_dust: '😷', thunder: '⛈️', wind: '🌬️',
};
const ENERGY_MAP = { 1: '🪫', 2: '🔋', 3: '🔋', 4: '🔋', 5: '⚡' };

// 오늘 별숨 카드 텍스트 파싱 (달력 내 미리보기용)
function parseFortuneText(text) {
  if (!text) return { summary: '', items: [] };
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let summary = '';
  const items = [];
  const summaryIdx = lines.findIndex(l => l.startsWith('[요약]'));
  if (summaryIdx !== -1) summary = lines[summaryIdx].replace('[요약]', '').trim();
  const colorStart = lines.findIndex(l => l.includes('오늘의 색은'));
  const itemStart = colorStart !== -1 ? colorStart : (summaryIdx !== -1 ? summaryIdx + 1 : 0);
  for (let i = itemStart; i < lines.length && items.length < 5; i++) items.push(lines[i]);
  return { summary, items };
}

const FORTUNE_ITEM_ICONS = ['🎨', '🌿', '🧭', '✨', '🌙'];

export default function SajuCalendar({ form, setStep, askQuick, user, callApi, showToast, setDiaryViewDate }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  // 오늘 날짜를 기본으로 선택
  const [selected, setSelected] = useState(now.getDate());
  const [events, setEvents] = useState({});
  const [inputText, setInputText] = useState('');
  const [inputTime, setInputTime] = useState('');
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEventText, setEditingEventText] = useState('');

  // 운세·일기 기록 (날짜 → 데이터)
  const [dailyFortunes, setDailyFortunes] = useState({});
  const [diaryEntries, setDiaryEntries] = useState({});
  const [diaryReviews, setDiaryReviews] = useState({});

  // 월별 상황 분석
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [monthlyResult, setMonthlyResult] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // ── Supabase 이벤트 로드 (로그인 시) ──
  useEffect(() => {
    if (!user?.id) return;
    const authClient = getAuthenticatedClient(user.id);
    (authClient || supabase)
      .from('calendar_events')
      .select('date, title, id')
      .eq('kakao_id', String(user.id))
      .then(({ data }) => {
        const fresh = {};
        (data || []).forEach(row => {
          const key = row.date;
          if (!fresh[key]) fresh[key] = [];
          fresh[key].push({ id: row.id, supabaseId: row.id, title: row.title });
        });
        setEvents(fresh);
      });
  }, [user?.id]);

  // ── 운세·일기 기록 로드 (월 변경 시 갱신) ──
  useEffect(() => {
    if (!user?.id) return;
    const authClient = getAuthenticatedClient(user.id);
    const ym = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
    const dateFrom = `${ym}-01`;
    const lastDay = new Date(viewYear, viewMonth, 0).getDate();
    const dateTo = `${ym}-${String(lastDay).padStart(2, '0')}`;

    // 오늘 별숨 카드 기록 (cache_type = 'horoscope')
    (authClient || supabase)
      .from('daily_cache')
      .select('cache_date, content')
      .eq('kakao_id', String(user.id))
      .eq('cache_type', 'horoscope')
      .gte('cache_date', dateFrom)
      .lte('cache_date', dateTo)
      .then(({ data }) => {
        const fresh = {};
        (data || []).forEach(row => { fresh[row.cache_date] = row.content; });
        setDailyFortunes(fresh);
      })
      .catch(e => console.error('[별숨] 달력 운세 로드 오류:', e));

    // 일기 기록
    (authClient || supabase)
      .from('diary_entries')
      .select('id, date, mood, weather, energy, content, gratitude, tomorrow_goal')
      .eq('kakao_id', String(user.id))
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .then(({ data }) => {
        const fresh = {};
        (data || []).forEach(row => { fresh[row.date] = row; });
        setDiaryEntries(fresh);
      })
      .catch(e => console.error('[별숨] 달력 일기 로드 오류:', e));

    // 별숨 해석 기록 (diary_review)
    (authClient || supabase)
      .from('daily_cache')
      .select('cache_date, content')
      .eq('kakao_id', String(user.id))
      .eq('cache_type', 'diary_review')
      .gte('cache_date', dateFrom)
      .lte('cache_date', dateTo)
      .then(({ data }) => {
        const fresh = {};
        (data || []).forEach(row => { fresh[row.cache_date] = row.content; });
        setDiaryReviews(fresh);
      })
      .catch(e => console.error('[별숨] 달력 일기 해석 로드 오류:', e));
  }, [user?.id, viewYear, viewMonth]);

  // 월 변경 시 월별 분석 결과 초기화
  useEffect(() => { setMonthlyResult(null); }, [viewYear, viewMonth]);

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
  const sortedSelectedEvents = useMemo(() => sortedEvents(selectedEvents), [selectedEvents]);
  const selectedFortune = selectedKey ? (dailyFortunes[selectedKey] || null) : null;
  const selectedDiary = selectedKey ? (diaryEntries[selectedKey] || null) : null;
  const selectedDiaryReview = selectedKey ? (diaryReviews[selectedKey] || null) : null;
  const todayKey = dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const upcomingSelectedEvents = sortedSelectedEvents.slice(0, 3);

  const addEvent = async () => {
    if (!inputText.trim() || !selectedKey) return;
    const title = inputTime ? `[${inputTime}] ${inputText.trim()}` : inputText.trim();
    setInputText('');
    setInputTime('');
    if (user?.id) {
      const authClient = getAuthenticatedClient(user.id);
      const { data, error } = await (authClient || supabase)
        .from('calendar_events')
        .insert({ kakao_id: user.id, date: selectedKey, title })
        .select('id').single();
      if (error || !data?.id) {
        setInputText(title); // 텍스트 복원
        showToast?.('일정 저장에 실패했어요. 다시 시도해봐요', 'error');
        return;
      }
      const newEvent = { id: data.id, supabaseId: data.id, title };
      setEvents(prev => ({ ...prev, [selectedKey]: [...(prev[selectedKey] || []), newEvent] }));
    } else {
      // 비로그인: 세션 메모리에만 (저장 안 됨)
      const newEvent = { id: Date.now(), title };
      setEvents(prev => ({ ...prev, [selectedKey]: [...(prev[selectedKey] || []), newEvent] }));
    }
  };

  const deleteEvent = async (key, id) => {
    const target = (events[key] || []).find(e => e.id === id);
    if (!target) return;
    // DB 삭제 먼저, 성공 후 로컬 상태 업데이트
    if (user?.id && target?.supabaseId) {
      try {
        const authClient = getAuthenticatedClient(user.id);
        await (authClient || supabase).from('calendar_events').delete().eq('id', target.supabaseId).eq('kakao_id', String(user.id));
      } catch (e) {
        console.error('[별숨] 일정 삭제 오류:', e);
        showToast?.('일정 삭제에 실패했어요...', 'error');
        return; // DB 실패 시 로컬 상태 유지
      }
    }
    setEvents(prev => {
      const updated = { ...prev };
      updated[key] = (updated[key] || []).filter(e => e.id !== id);
      if (updated[key].length === 0) delete updated[key];
      return updated;
    });
  };

  const startEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setEditingEventText(ev.title);
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setEditingEventText('');
  };

  const saveEditEvent = async (key, id) => {
    const title = editingEventText.trim();
    if (!title) return;
    const target = (events[key] || []).find(e => e.id === id);
    if (user?.id && target?.supabaseId) {
      try {
        const authClient = getAuthenticatedClient(user.id);
        await (authClient || supabase).from('calendar_events').update({ title }).eq('id', target.supabaseId).eq('kakao_id', String(user.id));
      } catch (e) {
        console.error('[별숨] 일정 수정 오류:', e);
        showToast?.('일정 수정에 실패했어요...', 'error');
        setEditingEventId(null);
        setEditingEventText('');
        return;
      }
    }
    setEvents(prev => {
      const updated = { ...prev };
      updated[key] = (updated[key] || []).map(e => e.id === id ? { ...e, title } : e);
      return updated;
    });
    setEditingEventId(null);
    setEditingEventText('');
  };

  const handleDeleteDiary = async (dateKey) => {
    if (!window.confirm('이 일기를 삭제할까요?')) return;
    const entry = diaryEntries[dateKey];
    if (!entry?.id) { showToast?.('삭제할 일기 정보가 없어요.', 'error'); return; }
    const authClient = getAuthenticatedClient(user.id);
    try {
      await (authClient || supabase)
        .from('diary_entries').delete()
        .eq('id', entry.id).eq('kakao_id', String(user.id));
      setDiaryEntries(prev => { const next = { ...prev }; delete next[dateKey]; return next; });
      showToast?.('일기가 삭제됐어요', 'info');
    } catch {
      showToast?.('삭제에 실패했어요...', 'error');
    }
  };

  const askAboutEvent = (eventTitle, score, d) => {
    const q = `${viewMonth}월 ${d}일에 '${eventTitle}' 일정이 있어요. 이날 나의 사주 기운이 ${score}점인데, 이 일정이 잘 될까요?`;
    if (askQuick) { askQuick(q); setStep(3); }
  };

  // ── 이번 달의 별숨 날짜 보기 (상황별 AI 분석) ──
  const askMonthlyAnalysis = useCallback(async () => {
    if (!selectedCatId || !callApi) return;
    const cat = CATS_ALL.find(c => c.id === selectedCatId);
    if (!cat) return;
    setMonthlyLoading(true);
    setMonthlyResult(null);
    try {
      const result = await callApi(
        `[달력 월별 분석] ${viewYear}년 ${viewMonth}월, 나의 [${cat.label}] 관련 기운을 날짜별로 분석해줘. 이 사주와 별자리를 바탕으로, 이번 달 ${cat.label} 관련해서 특히 좋은 날 BEST 5와 주의할 날 TOP 3을 알려줘. 각 날짜마다 이유를 한 줄씩 간결하게 써줘. 형식: "N일 - 이유" 로 목록을 만들어줘.`,
        { isCalendarMonth: true }
      );
      setMonthlyResult(result);
    } catch {
      setMonthlyResult('별이 잠시 쉬고 있어요\n잠시 후 다시 시도해봐요.');
    } finally {
      setMonthlyLoading(false);
    }
  }, [selectedCatId, callApi, viewYear, viewMonth]);

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
            const hasEvents = (events[key] || []).length > 0;
            const hasFortune = !!dailyFortunes[key];
            const hasDiary = !!diaryEntries[key];
            return (
              <button
                key={d}
                onClick={() => setSelected(isSel ? null : d)}
                style={{
                  background: isSel ? 'var(--gold)' : scoreBg(score),
                  border: isT ? '2px solid var(--gold)' : isSel ? '2px solid var(--gold)' : `1px solid ${scoreColor(score)}44`,
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
                  minHeight: 56,
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
                <span style={{ fontSize: '0.6rem', color: isSel ? '#0D0B14' : scoreColor(score), fontWeight: 700 }}>
                  {score}
                </span>
                {/* 기록 인디케이터 */}
                {(hasEvents || hasFortune || hasDiary) && (
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {hasFortune && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? '#0D0B14' : 'var(--gold)', display: 'block' }} title="운세 기록" />
                    )}
                    {hasDiary && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? '#0D0B14' : 'var(--lav, #9b8ec4)', display: 'block' }} title="일기 기록" />
                    )}
                    {hasEvents && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? '#0D0B14' : 'var(--teal, #4DB6AC)', display: 'block' }} title="일정" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10, fontSize: '0.6rem', color: 'var(--t4)', flexWrap: 'wrap' }}>
          <span><span style={{ color: '#4CAF50' }}>■</span> 85+ 최고</span>
          <span><span style={{ color: '#81C784' }}>■</span> 68+ 좋음</span>
          <span><span style={{ color: '#E6C35A' }}>■</span> 50+ 무난</span>
          <span><span style={{ color: '#FF8A65' }}>■</span> 38+ 조심</span>
          <span><span style={{ color: '#E05A3A' }}>■</span> 38미만 주의</span>
        </div>
        {/* 기록 인디케이터 범례 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 6, fontSize: '0.6rem', color: 'var(--t4)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} /> 운세 기록
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lav, #9b8ec4)', display: 'inline-block' }} /> 일기 기록
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--teal, #4DB6AC)', display: 'inline-block' }} /> 일정
          </span>
        </div>

        {/* ── 이번 달의 별숨 날짜 보기 (상황별 분석) ── */}
        <div style={{ marginTop: 20, background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: 16, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
            ✦ 이번 달의 별숨 날짜 보기
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 10 }}>
            상황을 선택하고 이번 달 기운 좋은 날을 별숨에게 물어봐요
          </div>
          {/* 20가지 상황 버튼 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {CATS_ALL.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCatId(prev => prev === cat.id ? null : cat.id); setMonthlyResult(null); }}
                style={{
                  background: selectedCatId === cat.id ? 'var(--gold)' : 'var(--bg3)',
                  border: `1px solid ${selectedCatId === cat.id ? 'var(--gold)' : 'var(--line)'}`,
                  borderRadius: 20,
                  padding: '5px 10px',
                  fontSize: 'var(--xs)',
                  color: selectedCatId === cat.id ? '#0D0B14' : 'var(--t2)',
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                  fontWeight: selectedCatId === cat.id ? 700 : 400,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          {/* 분석 버튼 */}
          {selectedCatId && (
            <button
              className="cta-main"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '12px', marginBottom: monthlyResult || monthlyLoading ? 12 : 0 }}
              onClick={askMonthlyAnalysis}
              disabled={monthlyLoading}
            >
              {monthlyLoading ? '별숨이 날짜를 읽고 있어요 ✦' : `${viewMonth}월 ${CATS_ALL.find(c => c.id === selectedCatId)?.label} 날짜 보기 ✦`}
            </button>
          )}
          {/* 분석 결과 */}
          {monthlyLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)', fontSize: 'var(--xs)', padding: '8px 0' }}>
              <span>별숨이 이번 달을 읽고 있어요</span>
              <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
            </div>
          )}
          {monthlyResult && !monthlyLoading && (
            <div style={{ background: 'var(--bg1)', borderRadius: 'var(--r1)', padding: '14px 16px', border: '1px solid var(--acc)', fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
              {monthlyResult}
            </div>
          )}
        </div>

        {/* 선택된 날 패널 */}
        {selectedData && (
          <div style={{ marginTop: 'var(--sp3)', background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: 'var(--sp3)', border: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 10, fontSize: 'var(--md)' }}>
              {viewMonth}월 {selectedData.d}일 ({WEEKDAYS[new Date(viewYear, viewMonth - 1, selectedData.d).getDay()]}요일)
            </div>

            <div style={{ marginBottom: 14, background: 'var(--bg1)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em' }}>🗓️ 일정 입력하기</span>
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                  {selectedEvents.length > 0 ? `${selectedEvents.length}개의 일정이 있어요` : '아직 등록된 일정이 없어요'}
                </span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    type="time"
                    value={inputTime}
                    onChange={e => setInputTime(e.target.value)}
                    style={{
                      padding: '10px 8px', border: '1px solid var(--line)', borderRadius: 'var(--r1)',
                      background: 'var(--bg2)', color: 'var(--t2)', fontSize: 'var(--xs)',
                      fontFamily: 'var(--ff)', outline: 'none', width: 96, flexShrink: 0,
                    }}
                  />
                  <input
                    className="inp"
                    style={{ flex: 1, marginBottom: 0, padding: '10px 12px', fontSize: 'var(--sm)' }}
                    placeholder="오늘 일정 제목"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) addEvent(); }}
                    maxLength={40}
                  />
                  <button
                    onClick={addEvent}
                    disabled={!inputText.trim()}
                    style={{ background: inputText.trim() ? 'var(--gold)' : 'var(--bg3)', color: inputText.trim() ? '#0D0B14' : 'var(--t4)', border: 'none', borderRadius: 'var(--r1)', padding: '0 16px', fontFamily: 'var(--ff)', fontWeight: 700, cursor: inputText.trim() ? 'pointer' : 'default', fontSize: 'var(--sm)', whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0 }}
                  >
                    추가
                  </button>
                </div>
                {!user?.id && (
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 4 }}>
                    로그인하면 일정이 저장돼요
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 14, background: 'var(--bg1)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--lav, #9b8ec4)', fontWeight: 700, letterSpacing: '.04em' }}>✦ 오늘 일정</span>
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                  {sortedSelectedEvents.length > 0 ? '시간순으로 정렬했어요' : '먼저 일정을 추가해보세요'}
                </span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                {sortedSelectedEvents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {upcomingSelectedEvents.map((event) => {
                      const { time, title } = parseEventTitle(event.title);
                      return (
                        <div key={event.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 'var(--r1)', background: 'var(--bg2)', border: '1px solid var(--line)' }}>
                          <div style={{ minWidth: 56, fontSize: 'var(--xs)', color: time ? 'var(--gold)' : 'var(--t4)', fontWeight: 700 }}>
                            {time || '미정'}
                          </div>
                          <div style={{ flex: 1, fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.5 }}>
                            {title}
                          </div>
                        </div>
                      );
                    })}
                    {sortedSelectedEvents.length > upcomingSelectedEvents.length && (
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                        아래에서 나머지 {sortedSelectedEvents.length - upcomingSelectedEvents.length}개 일정도 확인할 수 있어요.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.7 }}>
                    이 날짜를 누르자마자 바로 일정을 적을 수 있게 준비해뒀어요.
                    <br />
                    시간을 입력하면 아래에서 시간대별로 정리해서 보여드려요.
                  </div>
                )}
              </div>
            </div>

            {selectedData.saju && (() => {
              // 생체리듬 계산 (생년월일이 있을 때만)
              const biorhythm = form?.by && form?.bm && form?.bd
                ? calcBiorhythm(
                    new Date(+form.by, +form.bm - 1, +form.bd),
                    new Date(viewYear, viewMonth - 1, selectedData.d)
                  )
                : null;

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: biorhythm ? 8 : 14, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--r1)', border: `2px solid ${scoreColor(selectedData.score)}44` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 4 }}>
                        일진: <strong style={{ color: 'var(--gold)' }}>{selectedData.saju.il.gh}{selectedData.saju.il.jh}</strong>
                        &nbsp;·&nbsp;{selectedData.saju.ilganDesc || `${ON[selectedData.saju.dom]} 기운`}
                      </div>
                      <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        나의 사주 기운&nbsp;
                        <strong style={{ color: scoreColor(selectedData.score), fontSize: '1.3rem' }}>{selectedData.score}점</strong>
                        <span style={{ fontSize: 'var(--xs)', color: scoreColor(selectedData.score), fontWeight: 600, background: `${scoreColor(selectedData.score)}22`, padding: '2px 8px', borderRadius: 10 }}>
                          {scoreLabel(selectedData.score)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 길일 카테고리 뱃지 */}
                  {(() => {
                    const cats = getLuckyCategories(selectedData.saju, selectedData.score);
                    return cats.length > 0 ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {cats.map(c => (
                          <span key={c.label} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                            background: c.color + '22', border: `1px solid ${c.color}66`, color: c.color,
                          }}>
                            {c.emoji} {c.label} 길일
                          </span>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {/* 생체리듬 오버레이 */}
                  {biorhythm && (
                    <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--r1)', border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 8 }}>
                        ◈ 생체리듬
                      </div>
                      {BIORHYTHM_CHANNELS.map(ch => {
                        const val = biorhythm[ch.key];
                        const status = getBiorhythmStatus(val);
                        const barW = toBarWidth(val);
                        return (
                          <div key={ch.key} style={{ marginBottom: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{ch.emoji} {ch.label}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 600,
                                color: status === 'high' ? ch.color : status === 'low' ? 'var(--rose)' : status === 'critical' ? 'var(--t4)' : 'var(--t3)',
                              }}>
                                {BIORHYTHM_STATUS_LABEL[status]}{status === 'critical' ? ' ⚡' : ''}
                              </span>
                            </div>
                            {/* 중앙 기준 바 (0 = 50% 위치) */}
                            <div style={{ position: 'relative', height: 5, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                              {/* 중앙선 */}
                              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--t5)', opacity: 0.5 }} />
                              {val >= 0 ? (
                                <div style={{
                                  position: 'absolute', left: '50%', top: 0, bottom: 0,
                                  width: `${(val / 100) * 50}%`,
                                  background: ch.color, borderRadius: '0 3px 3px 0',
                                }} />
                              ) : (
                                <div style={{
                                  position: 'absolute', right: `${50 + (val / 100) * 50}%`, top: 0, bottom: 0,
                                  left: `${50 + (val / 100) * 50}%`,
                                  background: 'var(--rose)', borderRadius: '3px 0 0 3px',
                                }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {/* ── 오늘 하루 나의 별숨 기록 ── */}
            {selectedFortune && (() => {
              const { summary, items } = parseFortuneText(selectedFortune);
              return (
                <div style={{ marginBottom: 14, background: 'var(--bg1)', borderRadius: 'var(--r1)', border: '1px solid var(--acc)', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em' }}>✦ 오늘 하루 나의 별숨</span>
                  </div>
                  <div style={{ padding: '10px 14px 12px' }}>
                    {summary && (
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', marginBottom: 8, lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
                        "{breakAtNatural(summary)}"
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>
                          <span style={{ flexShrink: 0 }}>{FORTUNE_ITEM_ICONS[i] || '·'}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── 나의 하루를 별숨에게 (일기 기록) ── */}
            {selectedDiary && (
              <div style={{ marginBottom: 14, background: 'var(--bg1)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--lav, #9b8ec4)', fontWeight: 700, letterSpacing: '.04em' }}>📓 나의 하루를 별숨에게</span>
                  {user?.id && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        onClick={() => { setDiaryViewDate?.(selectedKey); setStep(17); }}
                        style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', fontFamily: 'var(--ff)' }}
                        aria-label="일기 수정"
                      >✎ 수정</button>
                      <button
                        onClick={() => handleDeleteDiary(selectedKey)}
                        style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', fontFamily: 'var(--ff)' }}
                        aria-label="일기 삭제"
                      >✕ 삭제</button>
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 14px 12px' }}>
                  {/* 기분·날씨·에너지 */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    {selectedDiary.mood && (
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', background: 'var(--bg2)', borderRadius: 20, padding: '3px 10px' }}>
                        {MOOD_MAP[selectedDiary.mood]?.emoji} {MOOD_MAP[selectedDiary.mood]?.label}
                      </span>
                    )}
                    {selectedDiary.weather && (
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', background: 'var(--bg2)', borderRadius: 20, padding: '3px 10px' }}>
                        {WEATHER_MAP[selectedDiary.weather] || ''} 날씨
                      </span>
                    )}
                    {selectedDiary.energy && (
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', background: 'var(--bg2)', borderRadius: 20, padding: '3px 10px' }}>
                        {ENERGY_MAP[selectedDiary.energy]} 에너지
                      </span>
                    )}
                  </div>
                  {selectedDiary.content && (
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7, marginBottom: selectedDiary.gratitude || selectedDiary.tomorrow_goal ? 8 : 0, whiteSpace: 'pre-wrap' }}>
                      {selectedDiary.content}
                    </div>
                  )}
                  {selectedDiary.gratitude && (
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 4 }}>
                      🌿 감사했던 일: {selectedDiary.gratitude}
                    </div>
                  )}
                  {selectedDiary.tomorrow_goal && (
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: selectedDiaryReview ? 8 : 0 }}>
                      ✦ 내일 목표: {selectedDiary.tomorrow_goal}
                    </div>
                  )}
                  {selectedDiaryReview && (
                    <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--goldf)', borderRadius: 'var(--r1)', border: '1px solid var(--acc)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>✦ 별숨의 해석</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                        {selectedDiaryReview}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 오늘 기록이 없으면 일기 쓰러 가기 버튼 ── */}
            {!selectedDiary && selectedKey === todayKey && user?.id && (
              <button
                onClick={() => setStep(17)}
                style={{
                  width: '100%', marginBottom: 14, padding: '10px 14px',
                  background: 'var(--bg1)', border: '1px dashed var(--lav, #9b8ec4)',
                  borderRadius: 'var(--r1)', cursor: 'pointer', fontFamily: 'var(--ff)',
                  fontSize: 'var(--xs)', color: 'var(--lav, #9b8ec4)', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                📓 오늘 하루를 별숨에게 기록하러 가기 →
              </button>
            )}

            {/* 일정 목록 (시간순 정렬) */}
            {sortedSelectedEvents.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontWeight: 600, marginBottom: 8, letterSpacing: '.04em' }}>시간대별 일정</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sortedSelectedEvents.map(ev => {
                    const { time, title: evTitle } = parseEventTitle(ev.title);
                    return (
                    <div key={ev.id} style={{ background: 'var(--bg1)', borderRadius: 'var(--r1)', padding: '10px 12px', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {editingEventId === ev.id ? (
                        <>
                          <input
                            className="inp"
                            style={{ flex: 1, marginBottom: 0, padding: '6px 10px', fontSize: 'var(--sm)' }}
                            value={editingEventText}
                            onChange={e => setEditingEventText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) saveEditEvent(selectedKey, ev.id); if (e.key === 'Escape') cancelEditEvent(); }}
                            maxLength={50}
                            autoFocus
                          />
                          <button
                            onClick={() => saveEditEvent(selectedKey, ev.id)}
                            style={{ background: 'var(--gold)', border: 'none', borderRadius: 20, padding: '5px 12px', fontSize: 'var(--xs)', color: '#0D0B14', fontFamily: 'var(--ff)', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
                          >저장</button>
                          <button
                            onClick={cancelEditEvent}
                            style={{ background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px', fontFamily: 'var(--ff)' }}
                          >✕</button>
                        </>
                      ) : (
                        <>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {time && (
                              <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 2 }}>🕐 {time}</div>
                            )}
                            <span style={{ fontSize: 'var(--sm)', color: 'var(--t1)' }}>📅 {evTitle}</span>
                          </div>
                          <button
                            onClick={() => askAboutEvent(evTitle, selectedData.score, selectedData.d)}
                            style={{ background: 'linear-gradient(135deg, var(--goldf), rgba(155,142,196,.15))', border: '1px solid var(--gold)', borderRadius: 20, padding: '5px 10px', fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--ff)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            별숨에게 ✦
                          </button>
                          <button
                            onClick={() => startEditEvent(ev)}
                            style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px', fontFamily: 'var(--ff)', flexShrink: 0 }}
                            aria-label="일정 수정"
                          >✎</button>
                          <button
                            onClick={() => deleteEvent(selectedKey, ev.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px', fontFamily: 'var(--ff)', flexShrink: 0 }}
                            aria-label="일정 삭제"
                          >✕</button>
                        </>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                    style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'var(--ff)', textAlign: 'left' }}
                  >
                    <div style={{ minWidth: 44, textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 'var(--sm)' }}>{viewMonth}/{dayNum}</div>
                      <div style={{ fontSize: 'var(--xs)', color: scoreColor(dayData?.score || 50), fontWeight: 600 }}>{dayData?.score || 50}점</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {sortedEvents(dayEvs).map(ev => {
                        const { time, title: evT } = parseEventTitle(ev.title);
                        return (
                          <div key={ev.id} style={{ fontSize: 'var(--xs)', color: 'var(--t2)', marginBottom: 2 }}>
                            {time && <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{time} </span>}📅 {evT}
                          </div>
                        );
                      })}
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
            날짜를 눌러 일정을 입력하면<br />별숨에게 바로 물어볼 수 있어요
          </div>
        )}

        {/* ── 빠른 연결 버튼 ── */}
        <div style={{ marginTop: 28, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontWeight: 600, marginBottom: 12, letterSpacing: '.04em' }}>
            ✦ 함께 이용해보세요
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => setStep(17)}
              style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '12px 14px', fontFamily: 'var(--ff)', fontSize: 'var(--xs)', color: 'var(--t2)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ fontSize: '1rem' }}>📓</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>오늘 하루를 별숨에게</div>
                <div style={{ color: 'var(--t4)', fontSize: '0.65rem' }}>일기를 쓰고 별숨의 해석을 들어봐요</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--t4)' }}>›</span>
            </button>
            <button
              onClick={() => setStep(18)}
              style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '12px 14px', fontFamily: 'var(--ff)', fontSize: 'var(--xs)', color: 'var(--t2)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ fontSize: '1rem' }}>✦</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>오늘 하루 나의 별숨</div>
                <div style={{ color: 'var(--t4)', fontSize: '0.65rem' }}>오늘의 운세 카드를 확인해봐요</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--t4)' }}>›</span>
            </button>
            <button
              onClick={() => setStep(2)}
              style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '12px 14px', fontFamily: 'var(--ff)', fontSize: 'var(--xs)', color: 'var(--t2)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ fontSize: '1rem', color: 'var(--t3)' }}>◈</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>별숨에게 질문하기</div>
                <div style={{ color: 'var(--t4)', fontSize: '0.65rem' }}>궁금한 것을 직접 물어봐요</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--t4)' }}>›</span>
            </button>
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
