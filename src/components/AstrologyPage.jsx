import { useState, useCallback } from "react";
import { stripMarkdown } from "../utils/constants.js";

// ── 섹션 파서 ──
function parseSections(text, tags) {
  if (!text) return {};
  const result = {};
  for (let i = 0; i < tags.length; i++) {
    const tag   = `[${tags[i]}]`;
    const next  = tags[i + 1] ? `[${tags[i + 1]}]` : null;
    const start = text.indexOf(tag);
    if (start === -1) continue;
    const contentStart = start + tag.length;
    const end = next ? text.indexOf(next) : text.length;
    result[tags[i]] = text.slice(contentStart, end !== -1 ? end : undefined).trim();
  }
  return result;
}

const ASTRO_SECTIONS = [
  { tag: '태양', icon: '☀️', title: '태양 · 본질적 자아' },
  { tag: '달',   icon: '🌙', title: '달 · 내면의 감정' },
  { tag: '상승', icon: '↑',  title: '상승 · 세상에 내보이는 모습' },
  { tag: '인연', icon: '💫', title: '인연 · 사랑의 패턴' },
  { tag: '재능', icon: '✨', title: '재능 · 빛나는 분야' },
  { tag: '흐름', icon: '🌊', title: `올해의 흐름` },
];

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{ width: 28, height: 28, border: '2.5px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

function SectionCard({ icon, title, text, delay = 0 }) {
  if (!text) return null;
  return (
    <div
      className="step-fade"
      style={{
        animationDelay: `${delay}ms`,
        background: 'var(--bg2)',
        border: '1px solid var(--line)',
        borderRadius: 20,
        padding: '20px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', letterSpacing: '.02em' }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
        {text}
      </p>
    </div>
  );
}

// ── 메인 컴포넌트 ──
export default function AstrologyPage({ sun, moon, asc, form, buildCtx }) {
  const cacheKey = `byeolsoom_astro_${form.by}${form.bm}${form.bd}${form.bh || ''}`;
  const [text, setText]       = useState(() => localStorage.getItem(cacheKey) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  const fetch_ = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(false);
    setText('');
    localStorage.removeItem(cacheKey);
    try {
      const now = new Date().getFullYear();
      const sunSummary  = sun  ? `태양(본질): ${sun.n}(${sun.s}) — ${sun.desc}` : '';
      const moonSummary = moon ? `달(감정): ${moon.n}(${moon.s}) — ${moon.desc}` : '달 정보 없음(태양 기반으로 감정 해석 부탁)';
      const ascSummary  = asc  ? `상승(첫인상): ${asc.n}(${asc.s}) — ${asc.desc}` : '상승 정보 없음(태양 기반으로 첫인상 해석 부탁)';
      const userMsg = `나의 종합 점성술 리포트를 작성해주세요. ${sunSummary}. ${moonSummary}. ${ascSummary}. 현재 ${now}년.`;
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userMsg, context: buildCtx(), isAstrology: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API 오류');
      const cleaned = stripMarkdown(data.text || '');
      setText(cleaned);
      localStorage.setItem(cacheKey, cleaned);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sun, moon, asc, buildCtx, cacheKey, loading]);

  const sections = parseSections(text, ASTRO_SECTIONS.map(s => s.tag));
  const hasContent = Object.values(sections).some(v => v);

  return (
    <div className="page-top">
      <div className="inner">
        <div style={{ paddingBottom: 40 }}>
          {/* 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>✦</div>
            <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', letterSpacing: '.04em', marginBottom: 6 }}>
              별숨의 종합 점성술
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.6 }}>
              {form.name || '그대'}의 하늘지도를<br />태양 · 달 · 상승으로 깊이 읽어드려요
            </div>
            {sun && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, padding: '6px 14px', fontSize: 'var(--xs)', color: 'var(--t2)' }}>
                  <span style={{ marginRight: 4 }}>☀️</span>{sun.s} {sun.n}
                </div>
                {moon && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, padding: '6px 14px', fontSize: 'var(--xs)', color: 'var(--t2)' }}>
                    <span style={{ marginRight: 4 }}>🌙</span>달 {moon.n}
                  </div>
                )}
                {asc && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, padding: '6px 14px', fontSize: 'var(--xs)', color: 'var(--t2)' }}>
                    <span style={{ marginRight: 4 }}>↑</span>상승 {asc.n}
                  </div>
                )}
                {!moon && !asc && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid rgba(180,140,50,0.2)', borderRadius: 10, padding: '6px 14px', fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                    태어난 시각을 입력하면 달·상승도 볼 수 있어요
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 생성 버튼 */}
          {!hasContent && !loading && (
            <button className="btn-main" onClick={fetch_} style={{ marginBottom: 20 }}>
              별숨에게 종합 점성술 풀어보기 ✦
            </button>
          )}

          {/* 로딩 */}
          {loading && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Spinner />
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 8 }}>
                하늘지도를 읽고 있어요... 잠시만 기다려줘요 🌙
              </div>
            </div>
          )}

          {/* 에러 */}
          {error && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginBottom: 12 }}>별이 잠시 쉬고 있어요 🌙</div>
              <button className="res-btn" onClick={fetch_}>다시 시도해봐요</button>
            </div>
          )}

          {/* 결과 섹션 카드 */}
          {hasContent && (
            <>
              <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(120,100,200,0.06)', borderRadius: 12, border: '1px solid rgba(120,100,200,0.15)' }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 600, marginBottom: 4 }}>✦ 별숨의 종합 점성술</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>태양 · 달 · 상승의 세 별빛으로 읽는 그대의 하늘지도</div>
              </div>
              {ASTRO_SECTIONS.map(({ tag, icon, title }, i) => (
                <SectionCard
                  key={tag}
                  icon={icon}
                  title={title}
                  text={sections[tag] || ''}
                  delay={i * 80}
                />
              ))}
              <button className="res-btn" onClick={fetch_} style={{ width: '100%', marginTop: 8 }}>
                다시 풀어보기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
