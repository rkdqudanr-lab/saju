import { useState, useCallback, useEffect } from "react";
import { ON } from "../utils/saju.js";
import { stripMarkdown } from "../utils/constants.js";
import { supabase, getAuthenticatedClient } from "../lib/supabase.js";

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

const COMP_SECTIONS = [
  { tag: '기질', icon: '🌟', title: '타고난 기질' },
  { tag: '연애', icon: '💫', title: '연애 · 결혼운' },
  { tag: '재물', icon: '✨', title: '재물운' },
  { tag: '직업', icon: '🌙', title: '직업 · 적성' },
  { tag: '건강', icon: '🌿', title: '건강운' },
  { tag: '올해', icon: '🌊', title: '올해의 흐름' },
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
        padding: 'var(--sp3)',
        marginBottom: 'var(--sp2)',
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

// ── Supabase analysis_cache 헬퍼 ──
async function loadAnalysisCache(userId, cacheKey) {
  if (!supabase || !userId) return null;
  try {
    const authClient = getAuthenticatedClient(userId);
    const { data } = await (authClient || supabase)
      .from('analysis_cache').select('content').eq('kakao_id', String(userId)).eq('cache_key', cacheKey).single();
    return data?.content || null;
  } catch { return null; }
}
async function saveAnalysisCache(userId, cacheKey, content) {
  if (!supabase || !userId) return;
  try {
    const authClient = getAuthenticatedClient(userId);
    await (authClient || supabase).from('analysis_cache').upsert(
      { kakao_id: String(userId), cache_key: cacheKey, content },
      { onConflict: 'kakao_id,cache_key' }
    );
  } catch (e) { console.error('[별숨] analysis_cache 저장 오류:', e); }
}

// ── 메인 컴포넌트 ──
export default function ComprehensivePage({ saju, sun, form, buildCtx, user }) {
  const cacheKey = `comp_${form.by}${form.bm}${form.bd}${form.bh || ''}`;
  const localKey = `byeolsoom_comp_${form.by}${form.bm}${form.bd}${form.bh || ''}`;

  // 초기값: localStorage 캐시 (빠른 로드)
  const [text, setText]       = useState(() => { try { return localStorage.getItem(localKey) || ''; } catch { return ''; } });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  // 로그인 시 Supabase에서 캐시 로드
  useEffect(() => {
    if (!user?.id || text) return;
    loadAnalysisCache(user.id, cacheKey).then(content => {
      if (content) { setText(content); try { localStorage.setItem(localKey, content); } catch {} }
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetch_ = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(false);
    setText('');
    try { localStorage.removeItem(localKey); } catch {}
    try {
      const now = new Date().getFullYear();
      const sajuSummary = saju
        ? `연주 ${saju.yeon.g}${saju.yeon.j} / 월주 ${saju.wol.g}${saju.wol.j} / 일주 ${saju.il.g}${saju.il.j} / 시주 ${saju.si.g}${saju.si.j}. 타고난 기질: ${saju.ilganDesc || ''}. 강한 기운: ${ON[saju.dom]}.`
        : '';
      const sunSummary = sun ? `별자리: ${sun.n}(${sun.s}) — ${sun.desc}` : '';
      const userMsg = `나의 종합 사주 리포트를 작성해주세요. ${sajuSummary} ${sunSummary}. 현재 ${now}년.`;
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userMsg, context: buildCtx(), isComprehensive: true, kakaoId: user?.id || null, clientHour: new Date().getHours() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API 오류');
      const cleaned = stripMarkdown(data.text || '');
      setText(cleaned);
      // localStorage 캐시
      try { localStorage.setItem(localKey, cleaned); } catch {}
      // Supabase 캐시
      if (user?.id) await saveAnalysisCache(user.id, cacheKey, cleaned);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [saju, sun, buildCtx, cacheKey, localKey, loading, user?.id]);

  const sections = parseSections(text, COMP_SECTIONS.map(s => s.tag));
  const hasContent = Object.values(sections).some(v => v);

  return (
    <div className="page-top">
      <div className="inner">
        <div style={{ paddingBottom: 40 }}>
          {/* 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>✦</div>
            <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', letterSpacing: '.04em', marginBottom: 6 }}>
              별숨의 종합 사주
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.6 }}>
              {form.name || '그대'}의 타고난 별빛을<br />6가지 영역으로 깊이 읽어드려요
            </div>
            {saju && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                  { label: '연', val: `${saju.yeon.g}${saju.yeon.j}` },
                  { label: '월', val: `${saju.wol.g}${saju.wol.j}` },
                  { label: '일', val: `${saju.il.g}${saju.il.j}` },
                  { label: '시', val: `${saju.si.g}${saju.si.j}` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, padding: '6px 12px', fontSize: 'var(--xs)', color: 'var(--t2)' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 600, marginRight: 4 }}>{label}</span>{val}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 생성 버튼 */}
          {!hasContent && !loading && (
            <button className="btn-main" onClick={fetch_} style={{ marginBottom: 20 }}>
              별숨에게 종합 사주 풀어보기 ✦
            </button>
          )}

          {/* 로딩 */}
          {loading && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Spinner />
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 8 }}>
                별빛을 읽고 있어요... 잠시만 기다려줘요 🌙
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
              <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(180,140,50,0.06)', borderRadius: 12, border: '1px solid rgba(180,140,50,0.15)' }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>✦ 별숨의 종합 사주</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>타고난 본성부터 올해의 흐름까지</div>
              </div>
              {COMP_SECTIONS.map(({ tag, icon, title }, i) => (
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
