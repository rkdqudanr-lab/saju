/**
 * DaeunPage — 사주 대운(大運) 타임라인
 * 10년 주기 대운을 가로 스크롤 타임라인으로 시각화하고
 * AI 해설(isDaeun 모드)을 불러옵니다.
 */

import { useState, useRef, useEffect } from 'react';
import { getDaeun, getCurrentDaeunIndex, EL_COLOR } from '../../lib/daeun.js';
import { useAppStore } from '../store/useAppStore.js';
import { saveDaeunPDF } from '../utils/imageExport.js';
import FeatureLoadingScreen from './FeatureLoadingScreen.jsx';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_AGE_OFFSET = 0; // 현재 나이 계산용

function DaeunCard({ period, isCurrent, isNext }) {
  const mainEl = period.mainEl;
  const color = EL_COLOR[mainEl] || EL_COLOR['토'];

  return (
    <div
      style={{
        width: isCurrent ? 120 : 96,
        flexShrink: 0,
        padding: isCurrent ? '16px 10px' : '12px 8px',
        borderRadius: 'var(--r2, 16px)',
        background: isCurrent ? color.bg : 'var(--bg2)',
        border: `2px solid ${isCurrent ? color.border : isNext ? 'var(--acc)' : 'var(--line)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: 'relative',
        transition: 'all 0.2s ease',
        boxShadow: isCurrent ? `0 4px 16px ${color.bg}` : 'none',
        cursor: 'pointer',
        scrollSnapAlign: 'start',
      }}
      onClick={period.onClick}
    >
      {isCurrent && (
        <div style={{
          position: 'absolute',
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: color.border,
          color: '#fff',
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 10px',
          borderRadius: 20,
          whiteSpace: 'nowrap',
          letterSpacing: '.04em',
        }}>
          지금 여기
        </div>
      )}

      {/* 오행 뱃지 */}
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        color: isCurrent ? color.text : 'var(--t4)',
        letterSpacing: '.06em',
      }}>
        {mainEl}운 {period.cg}{period.jj}
      </div>

      {/* 나이 */}
      <div style={{
        fontSize: isCurrent ? '16px' : '14px',
        fontWeight: 800,
        color: isCurrent ? color.text : 'var(--t2)',
        lineHeight: 1.1,
      }}>
        {period.age}~{period.ageEnd}세
      </div>

      {/* 연도 */}
      <div style={{
        fontSize: '11px',
        color: 'var(--t4)',
        marginTop: 2,
      }}>
        {period.year}–{period.yearEnd}
      </div>

      {/* 천간·지지 오행 */}
      <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
        <span style={{
          fontSize: '11px',
          padding: '2px 7px',
          borderRadius: 20,
          background: 'var(--bg3)',
          color: 'var(--t3)',
          fontWeight: 600,
        }}>
          {period.cgEl}
        </span>
        <span style={{
          fontSize: '11px',
          padding: '2px 7px',
          borderRadius: 20,
          background: 'var(--bg3)',
          color: 'var(--t3)',
          fontWeight: 600,
        }}>
          {period.jjEl}
        </span>
      </div>
    </div>
  );
}

const PERIOD_CONFIG = {
  past: {
    tags: ['그당시흐름', '그당시전환', '오늘의나에게'],
    meta: [
      { tag: '그당시흐름',   label: '그 시기의 흐름',   desc: '어떤 10년이었는지',  icon: '🔙', color: 'rgba(150,150,180,.1)',   border: 'rgba(150,150,180,.3)' },
      { tag: '그당시전환',   label: '기회와 어려움',    desc: '그 시기의 패턴',     icon: '💭', color: 'rgba(232,176,72,.08)',  border: 'rgba(232,176,72,.25)' },
      { tag: '오늘의나에게', label: '지금의 나에게',    desc: '남겨진 것들',        icon: '🔗', color: 'rgba(107,191,181,.12)', border: 'rgba(107,191,181,.3)' },
    ],
    title: '대운 회고 — 지나온 흐름',
  },
  current: {
    tags: ['초반기', '중반기', '후반기'],
    meta: [
      { tag: '초반기', label: '초반기', desc: '지금부터 3~4년', icon: '🌱', color: 'rgba(107,191,181,.15)', border: 'rgba(107,191,181,.3)' },
      { tag: '중반기', label: '중반기', desc: '4~7년 뒤',       icon: '🌿', color: 'rgba(232,176,72,.08)',  border: 'rgba(232,176,72,.25)' },
      { tag: '후반기', label: '후반기', desc: '7~10년 뒤',      icon: '🌟', color: 'rgba(200,160,255,.08)', border: 'rgba(200,160,255,.25)' },
    ],
    title: '대운 흐름 — 3시기 분석',
  },
  future: {
    tags: ['앞으로의흐름', '이시기기회', '준비할것'],
    meta: [
      { tag: '앞으로의흐름', label: '앞으로의 흐름',   desc: '어떤 10년이 될지',   icon: '🔮', color: 'rgba(200,160,255,.12)', border: 'rgba(200,160,255,.3)' },
      { tag: '이시기기회',   label: '기회와 주의',     desc: '이 시기에 살릴 것', icon: '✨', color: 'rgba(232,176,72,.08)',  border: 'rgba(232,176,72,.25)' },
      { tag: '준비할것',     label: '지금 준비할 것',  desc: '미리 챙겨둘 것',    icon: '📋', color: 'rgba(107,191,181,.12)', border: 'rgba(107,191,181,.3)' },
    ],
    title: '대운 전망 — 앞으로의 흐름',
  },
};

export default function DaeunPage({ form, saju, callApi, buildCtx, showToast }) {
  const { user } = useAppStore();
  const scrollRef = useRef(null);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfSaving, setPdfSaving] = useState(false);
  const [daeunData, setDaeunData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [periodType, setPeriodType] = useState('current'); // 'past' | 'current' | 'future'
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollAtEnd, setScrollAtEnd] = useState(false);

  const gender = form?.gender || 'M';

  useEffect(() => {
    if (!form?.by || !form?.bm || !form?.bd) return;

    const data = getDaeun(
      Number(form.by),
      Number(form.bm),
      Number(form.bd),
      form.noTime ? 12 : Number(form.bh ?? 12),
      0,
      gender,
    );
    setDaeunData(data);

    const idx = getCurrentDaeunIndex(data.periods, Number(form.by), CURRENT_YEAR);
    setCurrentIdx(idx < 0 ? 0 : idx);
  }, [form, gender]);

  // 현재 대운 카드로 스크롤
  useEffect(() => {
    if (!scrollRef.current || currentIdx === 0) return;
    const cardWidth = 104; // card width(96) + gap(8)
    const offset = Math.max(0, currentIdx * cardWidth - 20);
    scrollRef.current.scrollLeft = offset;
  }, [currentIdx, daeunData]);

  // 카드 선택이 바뀌면 이전 해설 초기화
  useEffect(() => {
    setInterpretation('');
    setPeriodType('current');
  }, [currentIdx]);

  function handleTimelineScroll(e) {
    const el = e.currentTarget;
    if (!hasScrolled && el.scrollLeft > 20) setHasScrolled(true);
    setScrollAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 16);
  }

  async function handleAskInterpretation() {
    if (!daeunData || !user) {
      showToast('로그인 후 이용 가능해요', 'info');
      return;
    }
    setLoading(true);
    setInterpretation('');

    const selected = daeunData.periods[currentIdx];
    const next = daeunData.periods[currentIdx + 1];
    const ctx = buildCtx ? buildCtx() : '';
    const age = CURRENT_YEAR - Number(form.by);

    // 과거/현재/미래 판별 — type은 await 전에 확정하고, 상태 업데이트는 await 후 interpretation과 함께 배치
    const isPast = selected.ageEnd < age;
    const isFuture = selected.age > age;
    const type = isPast ? 'past' : isFuture ? 'future' : 'current';

    const baseInfo = [
      `현재 나이: ${age}세`,
      `순행 여부: ${daeunData.isForward ? '순행' : '역행'}`,
      `선택한 대운: ${selected.cg}${selected.jj} (${selected.age}~${selected.ageEnd}세, ${selected.cgEl}·${selected.jjEl})`,
      `전체 대운 흐름: ${daeunData.periods.map(p => `${p.cg}${p.jj}`).join('→')}`,
    ].join('\n');

    let prompt;
    if (type === 'past') {
      prompt = `나의 이미 지나간 대운을 회고해줘:\n${baseInfo}\n\n이 시기(${selected.age}~${selected.ageEnd}세)는 이미 지나간 시기예요. 그 당시 어떤 삶의 흐름이 있었을지를 회고 형식으로, 과거형 말투("~했을 거예요" "~하기 쉬웠어요")로 써줘.\n\n반드시 아래 태그 형식으로 답해줘:\n[그당시흐름] 이 10년이 어떤 성격의 시기였을지. 어떤 방향이 강했는지, 어떤 감정·선택·관계 패턴이 반복됐을지.\n[그당시전환] 이 시기의 기회와 어려움. 어떤 결정을 앞에 두었을지, 무엇이 발목을 잡았을지.\n[오늘의나에게] 그 시기가 지금의 나에게 남긴 것. 여전히 이어지는 것, 그때부터 달라진 것, 지금 살릴 수 있는 것.`;
    } else if (type === 'future') {
      prompt = `나의 앞으로 다가올 대운을 전망해줘:\n${baseInfo}\n\n이 시기(${selected.age}~${selected.ageEnd}세)는 아직 오지 않은 미래예요. 이 시기에 어떤 흐름이 펼쳐질 가능성이 높은지를 전망 형식으로 써줘. 단정 금지, 가능성으로 표현.\n\n반드시 아래 태그 형식으로 답해줘:\n[앞으로의흐름] 이 10년이 어떤 성격의 시기가 될지. 어떤 방향이 강해질지, 생활에서 어떤 변화가 나타날지.\n[이시기기회] 이 시기에 살릴 수 있는 기회와 주의할 패턴. 어떤 선택이 잘 맞고, 무엇을 조심하면 좋을지.\n[준비할것] 지금부터 이 시기를 위해 해두면 좋은 것. "이번 시기에 시작해볼 것: ~"으로 마무리.`;
    } else {
      const p1Start = selected.age;
      const p1End   = selected.age + 3;
      const p2End   = selected.age + 7;
      const p3End   = selected.ageEnd;
      const phaseState = (start, end) =>
        age >= end ? 'past' : age < start ? 'future' : 'current';
      const phase1 = phaseState(p1Start, p1End);
      const phase2 = phaseState(p1End, p2End);
      const phase3 = phaseState(p2End, p3End + 1);
      const phaseInstruction = (start, end, state, label) => {
        if (state === 'past')
          return `[${label}] ${start}~${end}세 (이미 지나간 시기 — "~했을 거예요" 과거형 말투로)`;
        if (state === 'current')
          return `[${label}] ${start}~${end}세 (현재 이 시기 — 지금의 흐름과 앞으로 이 시기가 어떻게 마무리될지)`;
        return `[${label}] ${start}~${end}세 (앞으로의 시기 — 미래 가능성으로)`;
      };
      prompt = `나의 현재 진행 중인 대운을 3시기로 나눠 해설해줘:\n${baseInfo}\n${next ? `다음 대운: ${next.cg}${next.jj} (${next.age}~${next.ageEnd}세)` : ''}\n\n각 시기가 이미 지나간 시기인지, 현재 시기인지, 앞으로의 시기인지를 반드시 반영해서 작성해줘. 지나간 시기는 과거형으로, 현재 시기는 현재형으로.\n\n반드시 아래 태그 형식으로 답해줘:\n${phaseInstruction(p1Start, p1End, phase1, '초반기')}\n${phaseInstruction(p1End, p2End, phase2, '중반기')}\n${phaseInstruction(p2End, p3End, phase3, '후반기')}`;
    }

    try {
      const result = await callApi(prompt, {
        context: ctx,
        isDaeun: true,
      });
      setPeriodType(type);
      setInterpretation(typeof result === 'string' ? result : result?.text || '');
    } catch {
      showToast('해설을 불러오지 못했어요. 다시 시도해봐요.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!form?.by) {
    return (
      <div className="page" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--t3)' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 12, color: 'var(--t4)' }}>✦</div>
        <div style={{ fontSize: 'var(--sm)' }}>생년월일을 입력하면 대운 흐름을 볼 수 있어요</div>
      </div>
    );
  }

  const currentAge = CURRENT_YEAR - Number(form.by);

  async function handleSavePDF() {
    setPdfSaving(true);
    try {
      await saveDaeunPDF(user?.nickname || '나의별숨');
    } catch (e) {
      showToast('PDF 저장에 실패했어요', 'error');
      console.error(e);
    } finally {
      setPdfSaving(false);
    }
  }

  return (
    <div id="daeun-report-root" className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
            ✦ 나의 대운 흐름
          </div>
          <button
            onClick={handleSavePDF}
            disabled={pdfSaving}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--line)',
              borderRadius: 20,
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              fontSize: 'var(--xs)',
              color: 'var(--t3)',
            }}
          >
            {pdfSaving ? '저장 중...' : 'PDF 저장'}
          </button>
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.3 }}>
          10년마다 바뀌는<br />나의 별 기운
        </div>
        <div style={{ marginTop: 8, fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
          대운은 사주의 월주(月柱)에서 이어지는 10년 단위의 기운 흐름이에요.
          지금 {currentAge}세인 나는 <strong style={{ color: 'var(--gold)' }}>
            {daeunData?.periods[currentIdx]?.cg}{daeunData?.periods[currentIdx]?.jj} 대운
          </strong> 중이에요.
        </div>
        {daeunData && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            background: 'var(--bg2)',
            borderRadius: 'var(--r1)',
            fontSize: 'var(--xs)',
            color: 'var(--t3)',
          }}>
            대운 시작 나이: <strong style={{ color: 'var(--t1)' }}>{daeunData.startAge}세</strong>
            &nbsp;·&nbsp;
            방향: <strong style={{ color: 'var(--t1)' }}>{daeunData.isForward ? '순행(↗)' : '역행(↙)'}</strong>
          </div>
        )}
      </div>

      {/* 타임라인 */}
      {daeunData && (
        <div style={{ padding: '0 0 4px' }}>
          {/* 스크롤 컨테이너 + 오른쪽 fade */}
          <div style={{ position: 'relative' }}>
            <div
              ref={scrollRef}
              onScroll={handleTimelineScroll}
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                padding: '12px 20px 16px',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollSnapType: 'x mandatory',
              }}
            >
              {daeunData.periods.map((period, idx) => (
                <DaeunCard
                  key={idx}
                  period={{...period, onClick: () => setCurrentIdx(idx)}}
                  isCurrent={idx === currentIdx}
                  isNext={idx === currentIdx + 1}
                />
              ))}
            </div>

            {/* 오른쪽 fade + 힌트 화살표 */}
            {!scrollAtEnd && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 56,
                background: 'linear-gradient(to right, transparent, var(--bg))',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 10,
              }}>
                {!hasScrolled && (
                  <div style={{
                    animation: 'daeunScrollHint 1.1s ease-in-out infinite',
                    fontSize: 18,
                    color: 'var(--t3)',
                    lineHeight: 1,
                  }}>›</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI 해설 영역 */}
      <div style={{ padding: '4px 20px 0' }}>
        {!interpretation && !loading && daeunData && (() => {
          const sel = daeunData.periods[currentIdx];
          const age = CURRENT_YEAR - Number(form.by);
          const isPast = sel.ageEnd < age;
          const isFuture = sel.age > age;
          const label = isPast
            ? `🔙 ${sel.age}~${sel.ageEnd}세 · 지나온 시기 회고`
            : isFuture
            ? `🔮 ${sel.age}~${sel.ageEnd}세 · 앞으로의 시기 전망`
            : `지금 · ${sel.age}~${sel.ageEnd}세 대운 분석`;
          return (
            <div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 8, textAlign: 'center' }}>
                {label}
              </div>
              <button
                onClick={handleAskInterpretation}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--goldf)',
                  border: '1.5px solid var(--acc)',
                  borderRadius: 'var(--r1)',
                  cursor: 'pointer',
                  fontFamily: 'var(--ff)',
                  fontSize: 'var(--sm)',
                  color: 'var(--gold)',
                  fontWeight: 700,
                  letterSpacing: '.02em',
                }}
              >
                ✦ 해설 읽기
              </button>
            </div>
          );
        })()}

        {loading && <FeatureLoadingScreen type="comprehensive" fullPage={false} />}

        {interpretation && (() => {
          let config = PERIOD_CONFIG[periodType] || PERIOD_CONFIG.current;
          if (periodType === 'current' && daeunData) {
            const sel = daeunData.periods[currentIdx];
            const ca = CURRENT_YEAR - Number(form.by);
            const p1End = sel.age + 3;
            const p2End = sel.age + 7;
            const phaseDesc = (start, end) => {
              if (ca >= end)    return `${start}~${end}세 · 지나온 시기`;
              if (ca >= start)  return `${start}~${end}세 · 현재`;
              return `${start}~${end}세 · 앞으로`;
            };
            config = {
              ...config,
              meta: [
                { ...config.meta[0], desc: phaseDesc(sel.age, p1End) },
                { ...config.meta[1], desc: phaseDesc(p1End, p2End) },
                { ...config.meta[2], desc: phaseDesc(p2End, sel.ageEnd) },
              ],
            };
          }
          const secs = {};
          for (let i = 0; i < config.tags.length; i++) {
            const tag = `[${config.tags[i]}]`;
            const start = interpretation.indexOf(tag);
            if (start === -1) continue;
            const cs = start + tag.length;
            let end = interpretation.length;
            for (let j = 0; j < config.tags.length; j++) {
              if (j === i) continue;
              const nx = interpretation.indexOf(`[${config.tags[j]}]`, cs);
              if (nx !== -1 && nx < end) end = nx;
            }
            secs[config.tags[i]] = interpretation.slice(cs, end).trim();
          }
          const hasStructure = config.tags.some(t => secs[t]);
          return (
            <div style={{ animation: 'fadeUp .4s ease' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 12, letterSpacing: '.06em' }}>
                ✦ {config.title}
              </div>
              {hasStructure ? config.meta.map(({ tag, label, desc, icon, color, border }) => secs[tag] ? (
                <div key={tag} style={{
                  background: color, border: `1px solid ${border}`,
                  borderRadius: 'var(--r1)', padding: '16px', marginBottom: 10,
                  animation: 'fadeUp .4s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: '1rem' }}>{icon}</span>
                    <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)' }}>{label}</span>
                    <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginLeft: 2 }}>· {desc}</span>
                  </div>
                  <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
                    {secs[tag]}
                  </div>
                </div>
              ) : null) : (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '16px', marginBottom: 10 }}>
                  <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {interpretation}
                  </div>
                </div>
              )}
              <button
                onClick={() => setInterpretation('')}
                style={{
                  marginTop: 8, background: 'none', border: 'none',
                  color: 'var(--t4)', fontSize: 'var(--xs)', cursor: 'pointer', fontFamily: 'var(--ff)',
                }}
              >
                다시 보기
              </button>
            </div>
          );
        })()}
      </div>

      {/* 안내 메시지 */}
      <div style={{
        margin: '24px 20px 0',
        padding: '12px 14px',
        background: 'var(--bg2)',
        borderRadius: 'var(--r1)',
        fontSize: '11px',
        color: 'var(--t4)',
        lineHeight: 1.7,
      }}>
        대운은 절기를 기준으로 계산되며, 한국 전통 사주 이론을 따릅니다.
        태어난 시간이 불명확하면 일부 오차가 있을 수 있어요.
      </div>
    </div>
  );
}
