import { useState, useCallback, useEffect, useRef } from "react";
import { ON } from "../utils/saju.js";
import { stripMarkdown } from "../utils/constants.js";
import { loadAnalysisCache, saveAnalysisCache } from "../lib/analysisCache.js";
import { postAskText } from "../lib/askApi.js";
import PrecisionNudge from "./PrecisionNudge.jsx";
import FeatureLoadingScreen from "./FeatureLoadingScreen.jsx";
import { saveConsultationHistoryEntry } from "../utils/consultationHistory.js";

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

const ASTRO_SECTIONS = [
  { tag: '태양', icon: '☀️', title: '태양 · 본질적 자아' },
  { tag: '달',   icon: '🌙', title: '달 · 내면의 감정' },
  { tag: '상승', icon: '↑',  title: '상승 · 세상에 내보이는 모습' },
  { tag: '인연', icon: '💫', title: '인연 · 사랑의 패턴' },
  { tag: '재능', icon: '✨', title: '재능 · 빛나는 분야' },
  { tag: '흐름', icon: '🌊', title: '올해의 흐름' },
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

// ── 사주 분석 패널 ──
function SajuPanel({ saju, sun, form, buildCtx, user, consentFlags }) {
  const cacheKey = `comp_${form.by}${form.bm}${form.bd}${form.bh || ''}`;
  const localKey = `byeolsoom_comp_${form.by}${form.bm}${form.bd}${form.bh || ''}`;

  const [text, setText]       = useState(() => { try { return localStorage.getItem(localKey) || ''; } catch { return ''; } });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);
  const loadingRef            = useRef(false);

  useEffect(() => {
    if (!user?.id || text) return;
    loadAnalysisCache(user.id, cacheKey).then(content => {
      if (content) { setText(content); try { localStorage.setItem(localKey, content); } catch {} }
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetch_ = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
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
      const text = await postAskText({
        userMessage: userMsg,
        context: buildCtx(),
        isComprehensive: true,
        kakaoId: user?.id || null,
        clientHour: new Date().getHours(),
      });
      const cleaned = stripMarkdown(text);
      setText(cleaned);
      try { localStorage.setItem(localKey, cleaned); } catch {}
      if (user?.id) await saveAnalysisCache(user.id, cacheKey, cleaned);
      saveConsultationHistoryEntry({
        user,
        consentFlags,
        questions: ['종합 사주 분석'],
        answers: [cleaned],
      }).catch(() => {});
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [saju, sun, buildCtx, cacheKey, localKey, user?.id]);

  const sections = parseSections(text, COMP_SECTIONS.map(s => s.tag));
  const hasContent = Object.values(sections).some(v => v);

  return (
    <div>
      {/* 사주 정보 칩 */}
      {saju && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
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

      {!hasContent && !loading && (
        <button className="btn-main" onClick={fetch_} style={{ marginBottom: 20 }}>
          별숨에게 종합 사주 풀어보기 ✦
        </button>
      )}

      {loading && <FeatureLoadingScreen type="comprehensive" />}

      {error && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginBottom: 12 }}>별이 잠시 쉬고 있어요 🌙</div>
          <button className="res-btn" onClick={fetch_}>다시 시도해봐요</button>
        </div>
      )}

      {hasContent && (
        <>
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(180,140,50,0.06)', borderRadius: 12, border: '1px solid rgba(180,140,50,0.15)' }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>✦ 별숨의 종합 사주</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>타고난 본성부터 올해의 흐름까지</div>
          </div>
          {COMP_SECTIONS.map(({ tag, icon, title }, i) => (
            <SectionCard key={tag} icon={icon} title={title} text={sections[tag] || ''} delay={i * 80} />
          ))}
          <button className="res-btn" onClick={fetch_} style={{ width: '100%', marginTop: 8 }}>다시 풀어보기</button>
        </>
      )}
    </div>
  );
}

// ── 점성술 분석 패널 ──
function AstroPanel({ sun, moon, asc, form, buildCtx, user, consentFlags }) {
  const cacheKey = `astro_${form.by}${form.bm}${form.bd}${form.bh || ''}`;
  const localKey = `byeolsoom_astro_${form.by}${form.bm}${form.bd}${form.bh || ''}`;

  const [text, setText]       = useState(() => { try { return localStorage.getItem(localKey) || ''; } catch { return ''; } });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);
  const loadingRef            = useRef(false);

  useEffect(() => {
    if (!user?.id || text) return;
    loadAnalysisCache(user.id, cacheKey).then(content => {
      if (content) { setText(content); try { localStorage.setItem(localKey, content); } catch {} }
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetch_ = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    setText('');
    try { localStorage.removeItem(localKey); } catch {}
    try {
      const now = new Date().getFullYear();
      const sunSummary  = sun  ? `태양(본질): ${sun.n}(${sun.s}) — ${sun.desc}` : '';
      const moonSummary = moon ? `달(감정): ${moon.n}(${moon.s}) — ${moon.desc}` : '달 정보 없음(태양 기반으로 감정 해석 부탁)';
      const ascSummary  = asc  ? `상승(첫인상): ${asc.n}(${asc.s}) — ${asc.desc}` : '상승 정보 없음(태양 기반으로 첫인상 해석 부탁)';
      const userMsg = `나의 종합 점성술 리포트를 작성해주세요. ${sunSummary}. ${moonSummary}. ${ascSummary}. 현재 ${now}년.`;
      const text = await postAskText({
        userMessage: userMsg,
        context: buildCtx(),
        isAstrology: true,
        kakaoId: user?.id || null,
        clientHour: new Date().getHours(),
      });
      const cleaned = stripMarkdown(text);
      setText(cleaned);
      try { localStorage.setItem(localKey, cleaned); } catch {}
      if (user?.id) await saveAnalysisCache(user.id, cacheKey, cleaned);
      saveConsultationHistoryEntry({
        user,
        consentFlags,
        questions: ['종합 점성술 분석'],
        answers: [cleaned],
      }).catch(() => {});
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [sun, moon, asc, buildCtx, cacheKey, localKey, user?.id]);

  const sections = parseSections(text, ASTRO_SECTIONS.map(s => s.tag));
  const hasContent = Object.values(sections).some(v => v);

  return (
    <div>
      {/* 별자리 정보 칩 */}
      {sun && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, padding: '6px 14px', fontSize: 'var(--xs)', color: 'var(--t2)' }}>
            <span style={{ marginRight: 4 }}>☀️</span>{sun.s} {sun.n}
          </div>
          {moon && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, padding: '6px 14px', fontSize: 'var(--xs)', color: 'var(--t2)' }}>
              <span style={{ marginRight: 4 }}>☽</span>달 {moon.n}
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

      {!hasContent && !loading && (
        <button className="btn-main" onClick={fetch_} style={{ marginBottom: 20 }}>
          별숨에게 종합 점성술 풀어보기 ✦
        </button>
      )}

      {loading && <FeatureLoadingScreen type="comprehensive" />}

      {error && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginBottom: 12 }}>별이 잠시 쉬고 있어요 🌙</div>
          <button className="res-btn" onClick={fetch_}>다시 시도해봐요</button>
        </div>
      )}

      {hasContent && (
        <>
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(120,100,200,0.06)', borderRadius: 12, border: '1px solid rgba(120,100,200,0.15)' }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 600, marginBottom: 4 }}>✦ 별숨의 종합 점성술</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>태양 · 달 · 상승의 세 별빛으로 읽는 그대의 하늘지도</div>
          </div>
          {ASTRO_SECTIONS.map(({ tag, icon, title }, i) => (
            <SectionCard key={tag} icon={icon} title={title} text={sections[tag] || ''} delay={i * 80} />
          ))}
          <button className="res-btn" onClick={fetch_} style={{ width: '100%', marginTop: 8 }}>다시 풀어보기</button>
        </>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ──
export default function ComprehensivePage({ saju, sun, moon, asc, form, buildCtx, user, consentFlags }) {
  const [activeTab, setActiveTab] = useState('saju');

  return (
    <div className="page-top">
      <div className="inner">
        <div style={{ paddingBottom: 40 }}>
          {/* 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>✦</div>
            <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', letterSpacing: '.04em', marginBottom: 6 }}>
              종합 분석
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.6 }}>
              {form.nickname || form.name || '그대'}의 사주와 별자리를<br />깊이 읽어드려요
            </div>
          </div>

          {/* 탭 전환 */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 14, border: '1px solid var(--line)', overflow: 'hidden' }}>
            {[
              { id: 'saju', label: '✦ 사주 분석' },
              { id: 'astro', label: '🌟 점성술 분석' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '11px 8px',
                  border: 'none',
                  borderRight: tab.id === 'saju' ? '1px solid var(--line)' : 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--sm)',
                  fontWeight: activeTab === tab.id ? 700 : 400,
                  color: activeTab === tab.id ? 'var(--gold)' : 'var(--t3)',
                  background: activeTab === tab.id ? 'rgba(180,140,50,0.08)' : 'var(--bg1)',
                  transition: 'all .15s ease',
                  letterSpacing: '.02em',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 패널 */}
          <div key={activeTab} className="step-fade">
            {activeTab === 'saju'
              ? <SajuPanel saju={saju} sun={sun} form={form} buildCtx={buildCtx} user={user} consentFlags={consentFlags} />
              : <AstroPanel sun={sun} moon={moon} asc={asc} form={form} buildCtx={buildCtx} user={user} consentFlags={consentFlags} />
            }
          </div>

          <PrecisionNudge />
        </div>
      </div>
    </div>
  );
}


