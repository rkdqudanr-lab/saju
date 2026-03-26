import { useState, useEffect, useCallback } from "react";
import { OC, OE, ON, ILGAN_DESC } from "../utils/saju.js";
import { stripMarkdown } from "../utils/constants.js";

// ── 섹션 파서 ──
// [본질] [균형] [강점] [과제] [재능] / [특성] [재능] [성장]
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

// ── 카드 섹션 정의 ──
const NATAL_SECTIONS = [
  { tag: '본질', icon: '🌱', title: '나의 타고난 본질' },
  { tag: '균형', icon: '⚖️', title: '오행의 균형' },
  { tag: '강점', icon: '✨', title: '타고난 강점' },
  { tag: '과제', icon: '🌿', title: '성장의 방향' },
  { tag: '재능', icon: '🎯', title: '숨겨진 재능' },
];
const ZODIAC_SECTIONS = [
  { tag: '특성', icon: '✦', title: '별자리의 결' },
  { tag: '재능', icon: '🌟', title: '빛나는 재능' },
  { tag: '성장', icon: '🌙', title: '성장의 방향' },
];

// ── 오행 테마 ──
const ELEMENT_THEME = {
  목: { grad: 'linear-gradient(135deg, rgba(95,173,122,.18) 0%, rgba(95,173,122,.04) 100%)', border: 'rgba(95,173,122,.3)' },
  화: { grad: 'linear-gradient(135deg, rgba(224,90,58,.18) 0%, rgba(224,90,58,.04) 100%)',  border: 'rgba(224,90,58,.3)' },
  토: { grad: 'linear-gradient(135deg, rgba(192,136,48,.18) 0%, rgba(192,136,48,.04) 100%)', border: 'rgba(192,136,48,.3)' },
  금: { grad: 'linear-gradient(135deg, rgba(184,160,53,.18) 0%, rgba(184,160,53,.04) 100%)', border: 'rgba(184,160,53,.3)' },
  수: { grad: 'linear-gradient(135deg, rgba(74,142,196,.18) 0%, rgba(74,142,196,.04) 100%)', border: 'rgba(74,142,196,.3)' },
};

// ── 로딩 스피너 ──
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
      <div style={{ width: 28, height: 28, border: '2.5px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

// ── 섹션 카드 ──
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

// ── 4기둥 카드 (가로 스크롤) ──
const PILLAR_META = [
  { key: 'yeon', label: '연주', role: '뿌리 · 조상', desc: '나의 뿌리와 집안 환경, 타고난 운의 씨앗이에요.' },
  { key: 'wol',  label: '월주', role: '성장 · 환경', desc: '자라난 환경과 성장기의 기운, 부모와의 연을 담아요.' },
  { key: 'il',   label: '일주', role: '자아 · 배우자', desc: '나 자신의 본성과 배우자와의 인연이 담긴 기둥이에요.' },
  { key: 'si',   label: '시주', role: '미래 · 자녀', desc: '자녀와의 인연, 나의 말년과 미래 방향을 나타내요.' },
];

function PillarCards({ saju }) {
  if (!saju) return null;
  return (
    <div style={{ overflowX: 'auto', marginBottom: 20, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
      <div style={{ display: 'flex', gap: 10, paddingBottom: 4, width: 'max-content' }}>
        {PILLAR_META.map(({ key, label, role, desc }) => {
          const p = saju[key];
          return (
            <div
              key={key}
              style={{
                width: 150,
                background: 'var(--bg2)',
                border: '1px solid var(--line)',
                borderRadius: 18,
                padding: '16px 14px',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '.06em', color: 'var(--t1)', lineHeight: 1.2, marginBottom: 2 }}>
                {p.gh}<br />{p.jh}
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 8 }}>{p.g}{p.j}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 600, letterSpacing: '.05em', marginBottom: 4 }}>{role}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--t4)', lineHeight: 1.6, wordBreak: 'keep-all' }}>{desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──
export default function NatalInterpretationPage({ saju, sun, moon, form, buildCtx }) {
  const [tab, setTab] = useState(0); // 0: 사주원국, 1: 별자리

  // ── 캐시 키 (출생 정보 기반) ──
  const natalKey  = `byeolsoom_natal_${form.by}${form.bm}${form.bd}${form.bh || ''}`;
  const zodiacKey = `byeolsoom_zodiac_${form.bm}${form.bd}`;

  const [natalText,    setNatalText]    = useState(() => localStorage.getItem(natalKey)  || '');
  const [zodiacText,   setZodiacText]   = useState(() => localStorage.getItem(zodiacKey) || '');
  const [natalLoading, setNatalLoading] = useState(false);
  const [zodiacLoading,setZodiacLoading]= useState(false);
  const [natalErr,     setNatalErr]     = useState(false);
  const [zodiacErr,    setZodiacErr]    = useState(false);

  // ── 원국 AI 요청 ──
  const fetchNatal = useCallback(async () => {
    if (!saju || natalLoading) return;
    setNatalLoading(true);
    setNatalErr(false);
    try {
      const sajuSummary = `연주 ${saju.yeon.g}${saju.yeon.j} / 월주 ${saju.wol.g}${saju.wol.j} / 일주 ${saju.il.g}${saju.il.j} / 시주 ${saju.si.g}${saju.si.j}. 타고난 기질: ${ILGAN_DESC[saju.ilgan] || ''}. 강한 기운: ${ON[saju.dom]}, 약한 기운: ${ON[saju.lac]}.`;
      const userMsg = `나의 사주 원국을 해석해주세요. ${sajuSummary}`;
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userMsg, context: buildCtx(), isNatal: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API 오류');
      const cleaned = stripMarkdown(data.text || '');
      setNatalText(cleaned);
      localStorage.setItem(natalKey, cleaned);
    } catch {
      setNatalErr(true);
    } finally {
      setNatalLoading(false);
    }
  }, [saju, buildCtx, natalKey, natalLoading]);

  // ── 별자리 AI 요청 ──
  const fetchZodiac = useCallback(async () => {
    if (!sun || zodiacLoading) return;
    setZodiacLoading(true);
    setZodiacErr(false);
    try {
      const userMsg = `나의 별자리(${sun.n} ${sun.s}) 해설을 해주세요. ${sun.desc || ''}`;
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userMsg, context: buildCtx(), isZodiac: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API 오류');
      const cleaned = stripMarkdown(data.text || '');
      setZodiacText(cleaned);
      localStorage.setItem(zodiacKey, cleaned);
    } catch {
      setZodiacErr(true);
    } finally {
      setZodiacLoading(false);
    }
  }, [sun, buildCtx, zodiacKey, zodiacLoading]);

  // ── 탭 전환 시 자동 로드 ──
  useEffect(() => {
    if (tab === 0 && !natalText && !natalLoading && saju) fetchNatal();
  }, [tab, saju]);

  useEffect(() => {
    if (tab === 1 && !zodiacText && !zodiacLoading && sun) fetchZodiac();
  }, [tab, sun]);

  // 초기 로드 (사주 탭)
  useEffect(() => {
    if (!natalText && !natalLoading && saju) fetchNatal();
  }, []);

  const natalSections  = parseSections(natalText,  NATAL_SECTIONS.map(s => s.tag));
  const zodiacSections = parseSections(zodiacText, ZODIAC_SECTIONS.map(s => s.tag));

  const domEl      = saju?.dom || '목';
  const elTheme    = ELEMENT_THEME[domEl] || ELEMENT_THEME['목'];
  const domColor   = OC[domEl] || 'var(--gold)';

  return (
    <div className="page step-fade">
      <div className="inner" style={{ paddingTop: 0 }}>

        {/* ── 히어로 카드 ── */}
        <div
          style={{
            background: elTheme.grad,
            border: `1px solid ${elTheme.border}`,
            borderRadius: 24,
            padding: '28px 20px 22px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 'var(--xs)', color: domColor, fontWeight: 700, letterSpacing: '.1em', marginBottom: 6, opacity: .85 }}>
            나의 사주 원국
          </div>
          {saju && (
            <>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--t1)', marginBottom: 4, letterSpacing: '.02em' }}>
                {saju.ilganPoetic}
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 16, lineHeight: 1.7 }}>
                {ILGAN_DESC[saju.ilgan] || ''}
              </div>
            </>
          )}

          {/* 오행 바 */}
          {saju && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 8 }}>
                {Object.entries(saju.or).map(([k, v]) => v > 0 && (
                  <div key={k} style={{ flex: v, background: OC[k] }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(saju.or).map(([k, v]) => v > 0 && (
                  <span
                    key={k}
                    style={{
                      fontSize: '0.65rem',
                      padding: '3px 9px',
                      borderRadius: 20,
                      background: `${OC[k]}18`,
                      color: OC[k],
                      border: `1px solid ${OC[k]}30`,
                      fontWeight: 600,
                    }}
                  >
                    {OE[k]} {ON[k]} {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 별자리 칩 */}
          {sun && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--xs)', background: 'var(--bg3)', color: 'var(--t3)', borderRadius: 20, padding: '4px 12px' }}>
                {sun.s} {sun.n}
              </span>
              {moon && (
                <span style={{ fontSize: 'var(--xs)', background: 'var(--bg3)', color: 'var(--t3)', borderRadius: 20, padding: '4px 12px' }}>
                  🌙 달 {moon.n}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── 탭 바 ── */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg2)',
            borderRadius: 14,
            padding: 4,
            marginBottom: 20,
            gap: 4,
          }}
        >
          {['사주 원국', '별자리'].map((label, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: 'none',
                fontFamily: 'var(--ff)',
                fontSize: 'var(--sm)',
                fontWeight: tab === i ? 700 : 500,
                cursor: 'pointer',
                transition: 'all .18s ease',
                background: tab === i ? 'var(--bg4)' : 'transparent',
                color: tab === i ? 'var(--t1)' : 'var(--t4)',
                boxShadow: tab === i ? '0 1px 6px rgba(0,0,0,.1)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 사주 원국 탭 ── */}
        {tab === 0 && (
          <div>
            {/* 4기둥 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em', marginBottom: 10 }}>
                ✦ 네 기둥 이야기
              </div>
              <PillarCards saju={saju} />
            </div>

            {/* AI 섹션들 */}
            {natalLoading && <Spinner />}

            {natalErr && !natalLoading && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t4)', marginBottom: 14 }}>
                  별이 잠시 쉬고 있어요 🌙
                </div>
                <button
                  onClick={fetchNatal}
                  style={{
                    background: 'none', border: '1px solid var(--line)', borderRadius: 20,
                    padding: '8px 20px', color: 'var(--t3)', fontSize: 'var(--xs)',
                    fontFamily: 'var(--ff)', cursor: 'pointer',
                  }}
                >
                  다시 불러오기
                </button>
              </div>
            )}

            {!natalLoading && !natalErr && natalText && NATAL_SECTIONS.map(({ tag, icon, title }, i) =>
              natalSections[tag] ? (
                <SectionCard
                  key={tag}
                  icon={icon}
                  title={title}
                  text={natalSections[tag]}
                  delay={i * 60}
                />
              ) : null
            )}

            {/* 텍스트는 있는데 파싱이 안 된 경우 (fallback) */}
            {!natalLoading && !natalErr && natalText && Object.keys(natalSections).length === 0 && (
              <div
                style={{
                  background: 'var(--bg2)', border: '1px solid var(--line)',
                  borderRadius: 20, padding: '20px',
                }}
              >
                <p style={{ margin: 0, fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                  {natalText}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 별자리 탭 ── */}
        {tab === 1 && (
          <div>
            {/* 별자리 히어로 */}
            {sun && (
              <div
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--line)',
                  borderRadius: 20,
                  padding: '20px',
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>{sun.s}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>{sun.n}</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                  {sun.sm}월 {sun.sd}일 — {sun.em}월 {sun.ed}일
                </div>
                {sun.desc && (
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 10, lineHeight: 1.7 }}>
                    {sun.desc}
                  </div>
                )}
              </div>
            )}

            {zodiacLoading && <Spinner />}

            {zodiacErr && !zodiacLoading && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t4)', marginBottom: 14 }}>
                  별이 잠시 쉬고 있어요 🌙
                </div>
                <button
                  onClick={fetchZodiac}
                  style={{
                    background: 'none', border: '1px solid var(--line)', borderRadius: 20,
                    padding: '8px 20px', color: 'var(--t3)', fontSize: 'var(--xs)',
                    fontFamily: 'var(--ff)', cursor: 'pointer',
                  }}
                >
                  다시 불러오기
                </button>
              </div>
            )}

            {!zodiacLoading && !zodiacErr && zodiacText && ZODIAC_SECTIONS.map(({ tag, icon, title }, i) =>
              zodiacSections[tag] ? (
                <SectionCard
                  key={tag}
                  icon={icon}
                  title={title}
                  text={zodiacSections[tag]}
                  delay={i * 60}
                />
              ) : null
            )}

            {/* fallback */}
            {!zodiacLoading && !zodiacErr && zodiacText && Object.keys(zodiacSections).length === 0 && (
              <div
                style={{
                  background: 'var(--bg2)', border: '1px solid var(--line)',
                  borderRadius: 20, padding: '20px',
                }}
              >
                <p style={{ margin: 0, fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                  {zodiacText}
                </p>
              </div>
            )}

            {!sun && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)', fontSize: 'var(--sm)' }}>
                생년월일을 입력하면 별자리 해설을 볼 수 있어요
              </div>
            )}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
