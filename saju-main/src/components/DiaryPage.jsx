import { useState, useEffect } from "react";
import { supabase, getAuthenticatedClient } from "../lib/supabase.js";
import { DIARY_PROMPT, getMoonPhase } from "../utils/constants.js";
import { loadAnalysisCache, saveAnalysisCache } from "../lib/analysisCache.js";

// ═══════════════════════════════════════════════════════════
//  📓 나의 하루를 별숨에게 — 일기 페이지
// ═══════════════════════════════════════════════════════════

const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: '많이 힘들어요' },
  { value: 2, emoji: '😕', label: '조금 힘들어요' },
  { value: 3, emoji: '😐', label: '그냥 그래요' },
  { value: 4, emoji: '🙂', label: '좋은 편이에요' },
  { value: 5, emoji: '😄', label: '아주 좋아요' },
];

const WEATHER_OPTIONS = [
  { value: 'sunny', emoji: '☀️', label: '맑음' },
  { value: 'cloudy', emoji: '☁️', label: '흐림' },
  { value: 'rain', emoji: '🌧️', label: '비' },
  { value: 'snow', emoji: '❄️', label: '눈' },
  { value: 'fine_dust', emoji: '😷', label: '미세먼지' },
  { value: 'thunder', emoji: '⛈️', label: '천둥번개' },
  { value: 'wind', emoji: '🌬️', label: '바람' },
];

const ENERGY_OPTIONS = [
  { value: 1, emoji: '🪫', label: '방전' },
  { value: 2, emoji: '🔋', label: '낮음' },
  { value: 3, emoji: '🔋', label: '보통' },
  { value: 4, emoji: '🔋', label: '좋음' },
  { value: 5, emoji: '⚡', label: '가득!' },
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 12, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.8 }}>
        ✦ {title}
      </div>
      {children}
    </div>
  );
}

/** [후속질문] 태그에서 질문 추출 */
function parseFollowUpQuestions(text) {
  if (!text) return [];
  const match = text.match(/\[후속질문\]\s*(.+)/);
  if (!match) return [];
  return match[1].split('/').map(q => q.trim()).filter(Boolean).slice(0, 2);
}

/** diaryReviewResult에서 [후속질문] 태그 이전 본문만 반환 */
function stripFollowUp(text) {
  if (!text) return text;
  return text.replace(/\[후속질문\].*/s, '').trim();
}

export default function DiaryPage({ user, form, saju, sun, buildCtx, askReview, setStep, setDiy, viewDate, initialContent, initialMood, initialWeather, initialEnergy, embedded, diaryReviewResult, diaryReviewLoading, showToast }) {
  const [mood, setMood] = useState(initialMood || null);
  const [weather, setWeather] = useState(initialWeather || '');
  const [energy, setEnergy] = useState(initialEnergy || null);
  const [gratitude, setGratitude] = useState('');
  const [tomorrowGoal, setTomorrowGoal] = useState('');
  const [content, setContent] = useState(initialContent || '');
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayEntry, setTodayEntry] = useState(null);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [pastDiaryReview, setPastDiaryReview] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [diaryStreak, setDiaryStreak] = useState(0);

  const today = new Date().toISOString().slice(0, 10);
  const targetDate = viewDate || today;
  const isPastEntry = !!(viewDate && viewDate !== today);

  // 연속 작성 스트릭 계산
  useEffect(() => {
    if (!user?.id) return;
    const client = getAuthenticatedClient(user.id) || supabase;
    if (!client) return;
    (async () => {
      try {
        const { data: entries } = await client.from('diary_entries')
          .select('date').eq('kakao_id', String(user.id))
          .order('date', { ascending: false }).limit(60);
        if (!entries || entries.length === 0) { setDiaryStreak(0); return; }
        const dateSet = new Set(entries.map(e => e.date));
        let streak = 0;
        const cur = new Date(today);
        while (true) {
          const d = cur.toISOString().slice(0, 10);
          if (!dateSet.has(d)) break;
          streak++;
          cur.setDate(cur.getDate() - 1);
        }
        setDiaryStreak(streak);
      } catch {}
    })();
  }, [user?.id, today]);

  useEffect(() => {
    if (diaryReviewLoading || diaryReviewResult) setSubmitted(true);
  }, [diaryReviewLoading, diaryReviewResult]);

  useEffect(() => {
    if (!user?.id) { setLoadingEntry(false); return; }
    const client = getAuthenticatedClient(user.id) || supabase;
    if (!client) { setLoadingEntry(false); return; }
    (async () => {
      try {
        const { data } = await client.from('diary_entries')
          .select('*').eq('kakao_id', String(user.id)).eq('date', targetDate).maybeSingle();
        if (data) {
          setTodayEntry(data);
          if (data.mood) setMood(data.mood);
          if (data.weather) setWeather(data.weather);
          if (data.energy) setEnergy(data.energy);
          if (data.gratitude) setGratitude(data.gratitude);
          if (data.tomorrow_goal) setTomorrowGoal(data.tomorrow_goal);
          if (data.content) setContent(data.content);
          setSubmitted(true);
          setIsEditing(false);
        } else if (isPastEntry) {
          setSubmitted(false);
          setIsEditing(false);
        }
        try {
          const { data: cacheData } = await client
            .from('daily_cache')
            .select('content')
            .eq('kakao_id', String(user.id))
            .eq('cache_type', 'diary_review')
            .eq('cache_date', targetDate)
            .maybeSingle();
          if (cacheData?.content) setPastDiaryReview(cacheData.content);
        } catch {}
      } catch {}
      finally { setLoadingEntry(false); }
    })();
  }, [user?.id, targetDate]);

  const canSubmit = !!(mood || weather || energy || content.trim());

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const entry = {
      mood: mood || null,
      weather: weather || null,
      energy: energy || null,
      gratitude: gratitude.trim() || null,
      tomorrow_goal: tomorrowGoal.trim() || null,
      content: content.trim() || '',
    };

    if (user?.id) {
      try {
        const client = getAuthenticatedClient(user.id) || supabase;
        if (client) {
          const payload = { kakao_id: String(user.id), date: targetDate, ...entry };
          if (todayEntry?.id) {
            await client.from('diary_entries').update(entry).eq('id', todayEntry.id).eq('kakao_id', String(user.id));
          } else {
            const { data: inserted } = await client.from('diary_entries').insert(payload).single();
            if (inserted?.id) setTodayEntry({ id: inserted.id, ...payload });
          }
        }
      } catch (e) {
        showToast?.('일기 저장에 실패했어요...', 'error');
        setIsSubmitting(false);
        return;
      }
    }

    if (askReview && !isPastEntry) {
      const moodLabel = MOOD_OPTIONS.find(m => m.value === mood)?.label || '';
      const weatherLabel = WEATHER_OPTIONS.find(w => w.value === weather)?.label || '';
      const energyLabel = ENERGY_OPTIONS.find(e => e.value === energy)?.label || '';
      const context = `[오늘의 기분: ${moodLabel}] [날씨: ${weatherLabel}] [에너지: ${energyLabel}]${gratitude ? `\n[감사한 일: ${gratitude}]` : ''}${tomorrowGoal ? `\n[내일 목표: ${tomorrowGoal}]` : ''}`;
      const [ty, tm, td] = targetDate.split('-').map(Number);
      const moonPhase = getMoonPhase(ty, tm, td);
      askReview(`${context}\n\n${content.trim()}`, DIARY_PROMPT(moonPhase.label));
      setSubmitted(true);
      setIsEditing(false);
      if (embedded && setStep) setStep(17);
    } else {
      setSubmitted(true);
      setIsEditing(false);
      showToast?.('일기가 저장됐어요 🌙', 'info');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('이 일기를 삭제할까요?')) return;
    if (!todayEntry?.id) return;
    const client = getAuthenticatedClient(user.id) || supabase;
    try {
      await client.from('diary_entries').delete().eq('id', todayEntry.id).eq('kakao_id', String(user.id));
      showToast?.('일기가 삭제됐어요 🌙', 'info');
      setStep(20);
    } catch {
      showToast?.('삭제에 실패했어요...', 'error');
    }
  };

  const handleMonthlySummary = async () => {
    if (summaryLoading || !user?.id) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const cacheKey = `diary_summary_${yyyy}-${mm}`;
    const cached = await loadAnalysisCache(user.id, cacheKey);
    if (cached) { setSummaryText(cached); setShowSummary(true); return; }
    setSummaryLoading(true);
    try {
      const client = getAuthenticatedClient(user.id) || supabase;
      const { data: entries } = await client.from('diary_entries')
        .select('date,content,mood,energy,weather')
        .eq('kakao_id', String(user.id))
        .gte('date', `${yyyy}-${mm}-01`)
        .lte('date', `${yyyy}-${mm}-31`)
        .order('date');
      if (!entries || entries.length < 3) {
        showToast?.('이달 일기가 3개 이상 있어야 요약할 수 있어요 🌙', 'info');
        return;
      }
      const entrySummary = entries.map(e => {
        const moodLabel = ['', '많이 힘들어요', '조금 힘들어요', '그냥 그래요', '좋은 편이에요', '아주 좋아요'][e.mood] || '';
        return `[${e.date}] 기분:${moodLabel} 에너지:${e.energy || '?'}/5\n${e.content || '(내용 없음)'}`;
      }).join('\n\n');
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: `이번 달(${yyyy}년 ${now.getMonth() + 1}월)의 일기 ${entries.length}개를 사주·별자리 관점으로 따뜻하게 요약해줘요. 감정 흐름, 반복된 패턴, 성장한 부분을 짚어주세요.\n\n${entrySummary}`,
          context: '',
          isDiaryReview: true,
          kakaoId: user.id,
          clientHour: now.getHours(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const text = data.text || '';
      setSummaryText(text);
      setShowSummary(true);
      await saveAnalysisCache(user.id, cacheKey, text);
    } catch {
      showToast?.('이달 요약 생성에 실패했어요...', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loadingEntry) {
    const spinner = (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
      </div>
    );
    return embedded ? spinner : <div className="page"><div className="inner">{spinner}</div></div>;
  }

  const moodOpt   = MOOD_OPTIONS.find(m => m.value === mood);
  const weatherOpt = WEATHER_OPTIONS.find(w => w.value === weather);
  const energyOpt = ENERGY_OPTIONS.find(e => e.value === energy);

  const viewContent = (
    <div style={{ paddingTop: 8, paddingBottom: embedded ? 16 : 40 }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 'var(--xl)', marginBottom: 8 }}>📓</div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          나의 하루를 별숨에게
        </div>
        <div style={{ fontSize: 'var(--xxs)', color: 'var(--t4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 500 }}>
          <span>{new Date(targetDate + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
          {(() => { try { const [ty,tm,td] = (targetDate||'').split('-').map(Number); const mp = getMoonPhase(ty,tm,td); return mp ? <span title={mp.label} style={{ fontSize: 'var(--sm)' }}>{mp.icon}</span> : null; } catch { return null; } })()}
        </div>
      </div>

      {!isPastEntry && diaryStreak >= 2 && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,120,50,.12)', border: '1px solid rgba(255,120,50,.3)', borderRadius: 20, padding: '5px 14px', fontSize: 'var(--xs)', color: '#ff7832', fontWeight: 700 }}>
            🔥 {diaryStreak}일 연속 기록 중!
          </span>
        </div>
      )}

      {/* 기분 · 날씨 · 에너지 요약 카드 */}
      <div style={{ background: 'var(--bg-glass)', border: '0.5px solid var(--line)', borderRadius: 'var(--r2)', padding: '20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 32, backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow)' }}>
        {moodOpt && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--xl)' }}>{moodOpt.emoji}</div>
            <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 6, fontWeight: 600 }}>{moodOpt.label}</div>
          </div>
        )}
        {weatherOpt && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--xl)' }}>{weatherOpt.emoji}</div>
            <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 6, fontWeight: 600 }}>{weatherOpt.label}</div>
          </div>
        )}
        {energyOpt && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--xl)' }}>{energyOpt.emoji}</div>
            <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 6, fontWeight: 600 }}>LEVEL {energyOpt.value}/5</div>
          </div>
        )}
      </div>

      {/* 결과 섹션들 */}
      {gratitude && (
        <div style={{ marginBottom: 12, padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--r1)', border: '0.5px solid var(--line)', backdropFilter: 'blur(8px)' }}>
          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>✦ Daily Gratitude</div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.85 }}>{gratitude}</div>
        </div>
      )}
      {tomorrowGoal && (
        <div style={{ marginBottom: 12, padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--r1)', border: '0.5px solid var(--line)', backdropFilter: 'blur(8px)' }}>
          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>✦ Tomorrow's Intention</div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.85 }}>{tomorrowGoal}</div>
        </div>
      )}
      {content && (
        <div style={{ marginBottom: 24, padding: '18px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--r2)', border: '0.5px solid var(--line)', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>✦ The Day's Reflection</div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontWeight: 400 }}>{content}</div>
        </div>
      )}

      {/* 별숨의 해석 */}
      {(!isPastEntry && (diaryReviewLoading || diaryReviewResult)) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: 'var(--bg-glass-heavy)', borderRadius: 'var(--r2)', border: '0.5px solid var(--line)', overflow: 'hidden', backdropFilter: 'blur(12px)', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 'var(--lg)', color: 'var(--gold)' }}>✦</span>
              <div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 800 }}>별숨의 해석</div>
                <div style={{ fontSize: '9px', color: 'var(--t4)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stellar Interpretation</div>
              </div>
            </div>
            {diaryReviewLoading ? (
              <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--t3)', fontSize: 'var(--sm)' }}>
                <div style={{ width: 16, height: 16, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', flexShrink: 0 }} />
                오늘의 기운을 읽고 있어요...
              </div>
            ) : (
              <>
                <div style={{ padding: '20px', fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, whiteSpace: 'pre-line', letterSpacing: '-0.005em' }}>
                  {stripFollowUp(diaryReviewResult)}
                </div>
                {setDiy && setStep && (() => {
                  const followUps = parseFollowUpQuestions(diaryReviewResult);
                  if (!followUps.length) return null;
                  return (
                    <div style={{ padding: '0 20px 20px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 12, fontWeight: 600 }}>연결된 이야기 시나리오 →</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {followUps.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => { setDiy(q); setStep(1); }}
                            style={{
                              textAlign: 'left', padding: '12px 16px', borderRadius: 'var(--r1)',
                              border: '0.5px solid var(--acc)', background: 'var(--bg-glass)',
                              color: 'var(--gold)', fontSize: 'var(--xs)', fontWeight: 700,
                              fontFamily: 'var(--ff)', cursor: 'pointer', backdropFilter: 'blur(4px)'
                            }}
                          >
                            ✦ {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
      {isPastEntry && pastDiaryReview && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: 'var(--bg-glass-heavy)', borderRadius: 'var(--r2)', border: '0.5px solid var(--line)', overflow: 'hidden', backdropFilter: 'blur(12px)', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 'var(--lg)', color: 'var(--gold)' }}>✦</span>
              <div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 800 }}>별숨의 해석</div>
                <div style={{ fontSize: '9px', color: 'var(--t4)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Historical Reading</div>
              </div>
            </div>
            <div style={{ padding: '20px', fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, whiteSpace: 'pre-line', letterSpacing: '-0.005em' }}>
              {pastDiaryReview}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="res-btn" style={{ flex: 1 }} onClick={() => setStep(10)}>🗓️ 별숨달력</button>
        <button className="res-btn" style={{ flex: 1 }} onClick={() => setStep(20)}>📚 일기 목록</button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="res-btn" style={{ flex: 1 }} onClick={() => setIsEditing(true)}>✏️ 수정하기</button>
        {todayEntry?.id && (
          <button className="res-btn" style={{ flex: 1, color: 'var(--rose)' }} onClick={handleDelete}>🗑️ 삭제하기</button>
        )}
        {!embedded && <button className="res-btn" style={{ flex: 1 }} onClick={() => setStep(isPastEntry ? 20 : 0)}>{isPastEntry ? '← 목록으로' : '← 홈으로'}</button>}
      </div>

      {!embedded && user?.id && (
        <div style={{ marginTop: 16 }}>
          <button
            className="res-btn"
            style={{ width: '100%', color: 'var(--gold)', borderColor: 'var(--acc)' }}
            onClick={showSummary ? () => setShowSummary(false) : handleMonthlySummary}
            disabled={summaryLoading}
          >
            {summaryLoading ? '이달 이야기를 읽고 있어요...' : showSummary ? '▲ 이달 요약 닫기' : '✦ 이번 달 돌아보기'}
          </button>
          {showSummary && summaryText && (
            <div style={{ marginTop: 10, padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--r2)', border: '0.5px solid var(--acc)', fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
              {summaryText}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const pageContent = (
    <div style={{ paddingTop: 8, paddingBottom: embedded ? 16 : 40 }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 'var(--xl)', marginBottom: 8 }}>📓</div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>
          나의 하루를 별숨에게
        </div>
        <div style={{ fontSize: 'var(--xxs)', color: 'var(--t4)' }}>
          {new Date(targetDate + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
        </div>
      </div>

      {diaryStreak >= 2 && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,120,50,.12)', border: '1px solid rgba(255,120,50,.3)', borderRadius: 20, padding: '5px 14px', fontSize: 'var(--xs)', color: '#ff7832', fontWeight: 700 }}>
            🔥 {diaryStreak}일 연속 기록 중!
          </span>
        </div>
      )}

      {isEditing && submitted && (
        <div style={{ padding: '10px 14px', background: 'var(--goldf)', borderRadius: 'var(--r1)', border: '1px solid var(--acc)', fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 20, textAlign: 'center' }}>
          ✦ 수정 모드 — 저장하면 별숨이 다시 해석해줘요
        </div>
      )}

      <Section title="오늘의 기분">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {MOOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMood(opt.value)}
              style={{
                flex: 1, padding: '12px 4px',
                background: mood === opt.value ? 'var(--goldf)' : 'var(--bg-glass)',
                border: `0.5px solid ${mood === opt.value ? 'var(--gold)' : 'var(--line)'}`,
                borderRadius: 'var(--r1)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 22 }}>{opt.emoji}</span>
              <span style={{ fontSize: 9, color: mood === opt.value ? 'var(--gold)' : 'var(--t4)', textAlign: 'center', lineHeight: 1.2 }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="오늘의 날씨">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {WEATHER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setWeather(opt.value)}
              style={{
                padding: '8px 14px', borderRadius: 20,
                background: weather === opt.value ? 'var(--goldf)' : 'var(--bg-glass)',
                border: `0.5px solid ${weather === opt.value ? 'var(--gold)' : 'var(--line)'}`,
                color: weather === opt.value ? 'var(--gold)' : 'var(--t2)',
                fontSize: 'var(--sm)', fontFamily: 'var(--ff)',
                fontWeight: weather === opt.value ? 700 : 400,
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="오늘의 에너지">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {ENERGY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEnergy(opt.value)}
              style={{
                flex: 1, padding: '10px 4px',
                background: energy === opt.value ? 'var(--goldf)' : 'var(--bg-glass)',
                border: `0.5px solid ${energy === opt.value ? 'var(--gold)' : 'var(--line)'}`,
                borderRadius: 'var(--r1)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 18 }}>{opt.emoji}</span>
              <span style={{ fontSize: 9, color: energy === opt.value ? 'var(--gold)' : 'var(--t4)', textAlign: 'center' }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="오늘 감사했던 일">
        <input
          className="inp"
          placeholder="작은 것도 괜찮아요 🌿"
          value={gratitude}
          onChange={e => setGratitude(e.target.value)}
          style={{ marginBottom: 0, background: 'var(--bg3)', border: '0.5px solid var(--line)' }}
          maxLength={100}
        />
      </Section>

      <Section title="내일 한 가지 목표">
        <input
          className="inp"
          placeholder="내일의 나에게 한 가지만요 ✦"
          value={tomorrowGoal}
          onChange={e => setTomorrowGoal(e.target.value)}
          style={{ marginBottom: 0, background: 'var(--bg3)', border: '0.5px solid var(--line)' }}
          maxLength={100}
        />
      </Section>

      <Section title="오늘 있었던 일">
        <textarea
          className="diary-textarea"
          rows={5}
          placeholder="오늘 어떤 일이 있었나요?"
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={500}
          style={{ width: '100%', marginBottom: 4, background: 'var(--bg3)', border: '0.5px solid var(--line)', borderRadius: 'var(--r1)', padding: '12px' }}
        />
        <div style={{ fontSize: 'var(--xxs)', color: 'var(--t4)', textAlign: 'right', marginBottom: 16 }}>
          {content.length}/500
        </div>
      </Section>

      <button
        className="btn-main"
        disabled={!canSubmit || isSubmitting}
        onClick={handleSubmit}
        style={{ marginBottom: 8 }}
      >
        {isPastEntry ? (isSubmitting ? '저장 중...' : '저장하기 ✦') : (isSubmitting ? '저장 중...' : '저장하고 별숨의 해석듣기 ✦')}
      </button>

      {!embedded && (
        <button
          className="res-btn"
          style={{ width: '100%' }}
          onClick={() => setStep(0)}
        >
          ← 홈으로
        </button>
      )}
    </div>
  );

  const activeContent = (!embedded && submitted && !isEditing) ? viewContent : pageContent;

  if (embedded) return pageContent;
  return (
    <div className="page">
      <div className="inner">{activeContent}</div>
    </div>
  );
}
