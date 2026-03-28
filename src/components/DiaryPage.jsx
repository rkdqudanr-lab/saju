import { useState, useEffect } from "react";
import { getAuthenticatedClient } from "../lib/supabase.js";
import { DIARY_PROMPT } from "../utils/constants.js";

// ═══════════════════════════════════════════════════════════
//  📓 오늘 하루 나의 별숨 — 일기 페이지
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
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
        ✦ {title}
      </div>
      {children}
    </div>
  );
}

export default function DiaryPage({ user, form, saju, sun, buildCtx, askReview, setStep, initialContent, initialMood, initialWeather, initialEnergy, embedded }) {
  const [mood, setMood] = useState(initialMood || null);
  const [weather, setWeather] = useState(initialWeather || '');
  const [energy, setEnergy] = useState(initialEnergy || null);
  const [gratitude, setGratitude] = useState('');
  const [tomorrowGoal, setTomorrowGoal] = useState('');
  const [content, setContent] = useState(initialContent || '');
  const [submitted, setSubmitted] = useState(false);
  const [todayEntry, setTodayEntry] = useState(null);
  const [loadingEntry, setLoadingEntry] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  // 오늘 일기 불러오기
  useEffect(() => {
    const authClient = getAuthenticatedClient(user?.id);
    if (!authClient || !user?.id) { setLoadingEntry(false); return; }
    (async () => {
      try {
        const { data } = await authClient.from('diary_entries')
          .select('*').eq('kakao_id', user.id).eq('date', today).single();
        if (data) {
          setTodayEntry(data);
          if (data.mood) setMood(data.mood);
          if (data.weather) setWeather(data.weather);
          if (data.energy) setEnergy(data.energy);
          if (data.gratitude) setGratitude(data.gratitude);
          if (data.tomorrow_goal) setTomorrowGoal(data.tomorrow_goal);
          if (data.content) setContent(data.content);
          setSubmitted(true);
        }
      } catch {}
      finally { setLoadingEntry(false); }
    })();
  }, [user?.id, today]);

  const canSubmit = mood && weather && energy && content.trim().length >= 5;

  const handleSubmit = async () => {
    const entry = {
      mood,
      weather,
      energy,
      gratitude: gratitude.trim() || null,
      tomorrow_goal: tomorrowGoal.trim() || null,
      content: content.trim(),
    };

    // Supabase 저장
    const authClient = getAuthenticatedClient(user?.id);
    if (authClient && user?.id) {
      try {
        const payload = { kakao_id: user.id, date: today, ...entry };
        if (todayEntry?.id) {
          await authClient.from('diary_entries').update(entry).eq('id', todayEntry.id);
        } else {
          await authClient.from('diary_entries').insert(payload);
        }
      } catch (e) {
        console.error('[DiaryPage] 저장 오류:', e);
      }
    }

    // 별숨 해석 요청
    if (askReview) {
      const moodLabel = MOOD_OPTIONS.find(m => m.value === mood)?.label || '';
      const weatherLabel = WEATHER_OPTIONS.find(w => w.value === weather)?.label || '';
      const energyLabel = ENERGY_OPTIONS.find(e => e.value === energy)?.label || '';
      const context = `[오늘의 기분: ${moodLabel}] [날씨: ${weatherLabel}] [에너지: ${energyLabel}]${gratitude ? `\n[감사한 일: ${gratitude}]` : ''}${tomorrowGoal ? `\n[내일 목표: ${tomorrowGoal}]` : ''}`;
      askReview(`${context}\n\n${content.trim()}`, DIARY_PROMPT);
      setSubmitted(true);
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

  const pageContent = (
    <div style={{ paddingTop: 8, paddingBottom: embedded ? 16 : 40 }}>
          {/* 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📓</div>
            <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
              오늘 하루 나의 별숨
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </div>
          </div>

          {submitted && todayEntry && (
            <div style={{
              padding: '10px 14px', background: 'var(--goldf)',
              borderRadius: 'var(--r1)', border: '1px solid var(--acc)',
              fontSize: 'var(--xs)', color: 'var(--gold)',
              marginBottom: 20, textAlign: 'center',
            }}>
              ✦ 오늘 일기를 이미 작성했어요. 수정할 수 있어요.
            </div>
          )}

          {/* 오늘의 기분 */}
          <Section title="오늘의 기분">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
              {MOOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMood(opt.value)}
                  style={{
                    flex: 1, padding: '12px 4px',
                    background: mood === opt.value ? 'var(--goldf)' : 'var(--bg2)',
                    border: `1px solid ${mood === opt.value ? 'var(--gold)' : 'var(--line)'}`,
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

          {/* 오늘의 날씨 */}
          <Section title="오늘의 날씨">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {WEATHER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setWeather(opt.value)}
                  style={{
                    padding: '8px 14px', borderRadius: 20,
                    background: weather === opt.value ? 'var(--goldf)' : 'transparent',
                    border: `1px solid ${weather === opt.value ? 'var(--gold)' : 'var(--line)'}`,
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

          {/* 에너지 수준 */}
          <Section title="오늘의 에너지">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
              {ENERGY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEnergy(opt.value)}
                  style={{
                    flex: 1, padding: '10px 4px',
                    background: energy === opt.value ? 'var(--goldf)' : 'var(--bg2)',
                    border: `1px solid ${energy === opt.value ? 'var(--gold)' : 'var(--line)'}`,
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

          {/* 감사한 일 */}
          <Section title="오늘 감사했던 일">
            <input
              className="inp"
              placeholder="작은 것도 괜찮아요 🌿"
              value={gratitude}
              onChange={e => setGratitude(e.target.value)}
              style={{ marginBottom: 0 }}
              maxLength={100}
            />
          </Section>

          {/* 내일 목표 */}
          <Section title="내일 한 가지 목표">
            <input
              className="inp"
              placeholder="내일의 나에게 한 가지만요 ✦"
              value={tomorrowGoal}
              onChange={e => setTomorrowGoal(e.target.value)}
              style={{ marginBottom: 0 }}
              maxLength={100}
            />
          </Section>

          {/* 오늘 있었던 일 */}
          <Section title="오늘 있었던 일">
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 8, lineHeight: 1.6 }}>
              기뻤던 일, 속상했던 일, 작은 설렘까지 — 모두 괜찮아요
            </div>
            <textarea
              className="diary-textarea"
              rows={5}
              placeholder="오늘 어떤 일이 있었나요?"
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={500}
              style={{ width: '100%', marginBottom: 4 }}
            />
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', textAlign: 'right', marginBottom: 16 }}>
              {content.length}/500
            </div>
          </Section>

          {/* 제출 버튼 */}
          <button
            className="btn-main"
            disabled={!canSubmit}
            onClick={handleSubmit}
            style={{ marginBottom: 8 }}
          >
            별숨의 해석 듣기 ✦
          </button>
          {!canSubmit && (
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', textAlign: 'center', marginBottom: 12 }}>
              기분 · 날씨 · 에너지를 선택하고 오늘 있었던 일을 적어주세요
            </div>
          )}

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

  if (embedded) return pageContent;
  return (
    <div className="page">
      <div className="inner">{pageContent}</div>
    </div>
  );
}
