import { useState } from "react";
import { OC, OE, ON, ILGAN_DESC } from "../utils/saju.js";
import { useAppStore } from "../store/useAppStore.js";

// ── 오행 테마 ──
const ELEMENT_THEME = {
  목: { grad: 'linear-gradient(135deg, rgba(95,173,122,.18) 0%, rgba(95,173,122,.04) 100%)', border: 'rgba(95,173,122,.3)' },
  화: { grad: 'linear-gradient(135deg, rgba(224,90,58,.18) 0%, rgba(224,90,58,.04) 100%)',  border: 'rgba(224,90,58,.3)' },
  토: { grad: 'linear-gradient(135deg, rgba(192,136,48,.18) 0%, rgba(192,136,48,.04) 100%)', border: 'rgba(192,136,48,.3)' },
  금: { grad: 'linear-gradient(135deg, rgba(184,160,53,.18) 0%, rgba(184,160,53,.04) 100%)', border: 'rgba(184,160,53,.3)' },
  수: { grad: 'linear-gradient(135deg, rgba(74,142,196,.18) 0%, rgba(74,142,196,.04) 100%)', border: 'rgba(74,142,196,.3)' },
};

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
    <div style={{ overflowX: 'auto', marginBottom: 20, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', width: '100%' }}>
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

const MAX_SCORE = 50;
const LEVEL_META = {
  low:  { label: '기본',   color: 'var(--t4)',   bar: '#888' },
  mid:  { label: '중간',   color: '#6ab187',     bar: '#6ab187' },
  high: { label: '초정밀', color: 'var(--gold)', bar: 'var(--gold)' },
};
const DATA_POINTS = [
  { key: 'birth_date',     label: '생년월일',         pts: 10, icon: '◇', step: 1 },
  { key: 'birth_time',     label: '생시 (태어난 시간)', pts: 20, icon: '◷', step: 1 },
  { key: 'current_concern',label: '현재 고민 키워드',   pts: 10, icon: '◈', step: 1 },
  { key: 'life_stage',     label: '인생 단계 선택',    pts: 5,  icon: '↗', step: 1 },
  { key: 'other_profile',  label: '다른 사람 정보 추가', pts: 5,  icon: '◇', step: 1 },
];

// ── 메인 컴포넌트 ──
export default function NatalInterpretationPage({ saju, sun, moon, asc, form, onGoStep }) {
  const [tab, setTab] = useState(0); // 0: 사주원국, 1: 별자리
  const dataPrecision = useAppStore((s) => s.dataPrecision);
  const { total = 0, level = 'low', filled = [] } = dataPrecision || {};
  const pct      = Math.min(Math.round((total / MAX_SCORE) * 100), 100);
  const meta     = LEVEL_META[level] || LEVEL_META.low;
  const filledSet = new Set(filled);

  const domEl    = saju?.dom || '목';
  const elTheme  = ELEMENT_THEME[domEl] || ELEMENT_THEME['목'];
  const domColor = OC[domEl] || 'var(--gold)';

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
            나의 별숨 · 사주원국과 별자리
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
                  달 {moon.n}
                </span>
              )}
              {asc && (
                <span style={{ fontSize: 'var(--xs)', background: 'var(--bg3)', color: 'var(--t3)', borderRadius: 20, padding: '4px 12px' }}>
                  ↑ 상승 {asc.n}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── 정밀도 게이지 카드 ── */}
        <div
          style={{
            background: 'var(--bg2)',
            border: `1px solid ${meta.color}33`,
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 'var(--xs)', color: meta.color, fontWeight: 700, letterSpacing: '.06em' }}>
              ✦ 별숨 정밀도
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
              {total}점 · <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
            </div>
          </div>
          <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: meta.bar, borderRadius: 3, transition: 'width .6s ease' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DATA_POINTS.map(({ key, label, pts, icon }) => {
              const done = filledSet.has(key);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.75rem', width: 18, textAlign: 'center', opacity: done ? 1 : 0.4 }}>{icon}</span>
                  <span style={{ flex: 1, fontSize: 'var(--xs)', color: done ? 'var(--t2)' : 'var(--t4)', textDecoration: done ? 'none' : 'none' }}>
                    {label}
                  </span>
                  {done
                    ? <span style={{ fontSize: 'var(--xs)', color: meta.color, fontWeight: 600 }}>+{pts}</span>
                    : <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)', opacity: 0.6 }}>+{pts}점</span>
                  }
                  {!done && (
                    <button
                      onClick={() => onGoStep && onGoStep(1)}
                      style={{ padding: '3px 8px', background: 'none', border: '1px solid var(--line)', borderRadius: 10, fontSize: '0.6rem', color: 'var(--t4)', fontFamily: 'var(--ff)', cursor: 'pointer' }}
                    >
                      입력
                    </button>
                  )}
                </div>
              );
            })}
          </div>
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
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em', marginBottom: 10 }}>
              ✦ 네 기둥 이야기
            </div>
            <PillarCards saju={saju} />

            {/* 일간 설명 */}
            {saju && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 6, letterSpacing: '.04em' }}>✦ 일간의 기질</div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8 }}>{saju.ilganDesc || ILGAN_DESC[saju.ilgan] || ''}</div>
              </div>
            )}

            {/* 오행 균형 설명 */}
            {saju && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>⚖️ 오행 구성</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(saju.or).filter(([, v]) => v > 0).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 32, fontSize: 'var(--xs)', color: OC[k], fontWeight: 700 }}>{OE[k]} {ON[k]}</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(v / 8) * 100}%`, height: '100%', background: OC[k], borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)', width: 16, textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 별자리 탭 ── */}
        {tab === 1 && (
          <div>
            {sun ? (
              <>
                {/* 태양 별자리 */}
                <div
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--line)',
                    borderRadius: 20,
                    padding: '20px',
                    marginBottom: 12,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>{sun.s}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>{sun.n}</div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>☀ 태양 별자리</div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                    {sun.sm}월 {sun.sd}일 — {sun.em}월 {sun.ed}일
                  </div>
                  {sun.desc && (
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 10, lineHeight: 1.7 }}>
                      {sun.desc}
                    </div>
                  )}
                </div>

                {/* 달 별자리 */}
                {moon && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.1rem', color: 'var(--t3)' }}>☽</span>
                      <div>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 2 }}>달 별자리 · 감정과 내면</div>
                        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>{moon.s} {moon.n}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 상승 별자리 */}
                {asc && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.4rem' }}>↑</span>
                      <div>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 2 }}>상승 별자리 · 외면과 첫인상</div>
                        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>{asc.s} {asc.n}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)', fontSize: 'var(--sm)' }}>
                생년월일을 입력하면 별자리 정보를 볼 수 있어요
              </div>
            )}
          </div>
        )}

        {/* ── AI 분석으로 이동 버튼 ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28, marginBottom: 10 }}>
          <button
            onClick={() => onGoStep && onGoStep(14)}
            style={{
              flex: 1,
              padding: '14px 10px',
              borderRadius: 'var(--r1)',
              border: '1px solid rgba(180,140,50,0.5)',
              background: 'var(--goldf)',
              color: 'var(--gold)',
              fontSize: 'var(--sm)',
              fontWeight: 600,
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
              transition: 'opacity .15s',
              lineHeight: 1.4,
            }}
          >
            별숨의 종합사주 ✦
          </button>
          <button
            onClick={() => onGoStep && onGoStep(14)}
            style={{
              flex: 1,
              padding: '14px 10px',
              borderRadius: 'var(--r1)',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--t2)',
              fontSize: 'var(--sm)',
              fontWeight: 600,
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
              transition: 'opacity .15s',
              lineHeight: 1.4,
            }}
          >
            종합 점성술
          </button>
        </div>

        {/* ── 사주 명함 카드 버튼 ── */}
        <button
          onClick={() => onGoStep && onGoStep(21)}
          style={{
            width: '100%',
            padding: '13px 10px',
            borderRadius: 'var(--r1)',
            border: '1px solid var(--line)',
            background: 'transparent',
            color: 'var(--t3)',
            fontSize: 'var(--sm)',
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          나만의 사주 명함 카드 만들기
        </button>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
