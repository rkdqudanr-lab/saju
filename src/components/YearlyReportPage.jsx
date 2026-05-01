import { useState, useEffect, useCallback, useRef } from "react";
import { useStreamResponse } from "../hooks/useStreamResponse.js";
import { useAppStore } from "../store/useAppStore.js";
import FeatureLoadingScreen from "./FeatureLoadingScreen.jsx";
import { STEP } from "../utils/steps.js";

// ═══════════════════════════════════════════════════════════
//  📅 연간 종합 리포트 — 별숨이 한 해를 읽어요
// ═══════════════════════════════════════════════════════════

const YEARLY_COST = 80; // BP 차감액

const ALL_TAGS = [
  '[연간요약]','[올해핵심키워드]',
  '[상반기흐름]','[하반기흐름]','[분기별테마]',
  '[좋은시기]','[주의시기]',
  '[1월]','[2월]','[3월]','[4월]','[5월]','[6월]',
  '[7월]','[8월]','[9월]','[10월]','[11월]','[12월]',
  '[올해의선택기준]','[별숨마무리]',
  // 구버전 호환
  '[총평]','[마무리]',
];

const MONTH_TAGS = ALL_TAGS; // alias

const TAB_GROUPS = {
  summary: { label: '요약', tags: ['[연간요약]','[올해핵심키워드]','[상반기흐름]','[하반기흐름]','[분기별테마]','[좋은시기]','[주의시기]','[총평]'] },
  monthly: { label: '월별', tags: ['[1월]','[2월]','[3월]','[4월]','[5월]','[6월]','[7월]','[8월]','[9월]','[10월]','[11월]','[12월]'] },
  wrap:    { label: '마무리', tags: ['[올해의선택기준]','[별숨마무리]','[마무리]'] },
};

const MONTH_LABELS = {
  '[1월]':'1월','[2월]':'2월','[3월]':'3월','[4월]':'4월',
  '[5월]':'5월','[6월]':'6월','[7월]':'7월','[8월]':'8월',
  '[9월]':'9월','[10월]':'10월','[11월]':'11월','[12월]':'12월',
};

/** 스트리밍 텍스트를 섹션별로 분리 */
function parseSections(text) {
  if (!text) return {};
  const result = {};
  for (let i = 0; i < ALL_TAGS.length; i++) {
    const tag = ALL_TAGS[i];
    const start = text.indexOf(tag);
    if (start === -1) continue;
    const contentStart = start + tag.length;
    let end = text.length;
    for (let j = 0; j < ALL_TAGS.length; j++) {
      if (j === i) continue;
      const nx = text.indexOf(ALL_TAGS[j], contentStart);
      if (nx !== -1 && nx < end) end = nx;
    }
    result[tag] = text.slice(contentStart, end).trim();
  }
  return result;
}

/** 월 타임라인 탭 */
function MonthTab({ tag, label, active, done, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 14, fontSize: '11px', cursor: 'pointer',
        border: `1px solid ${active ? 'var(--gold)' : done ? 'var(--acc)' : 'var(--line)'}`,
        background: active ? 'var(--goldf)' : done ? 'rgba(255,200,80,.08)' : 'var(--card)',
        color: active ? 'var(--gold)' : done ? 'var(--acc)' : 'var(--t3)',
        fontWeight: active ? 700 : 400,
        transition: 'all .15s',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

/** 주차별 가이드 컴포넌트 */
function WeeklyGuide({ monthTag, monthLabel, callApi, year }) {
  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState('');
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const handleFetch = useCallback(async () => {
    if (fetchedRef.current || loading) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const result = await callApi(
        `${year}년 ${monthLabel}의 운세를 주차별로 나눠서 자세히 알려줘. 형식: [1주차] [2주차] [3주차] [4주차] 각 주차별로 어떤 흐름인지, 어떤 기회가 오는지, 무엇을 조심해야 하는지 구체적으로.`,
        { isYearly: true }
      );
      setGuide(typeof result === 'string' ? result : result?.text || '');
    } catch {
      setGuide('별빛이 잠시 흐려졌어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [callApi, year, monthLabel, loading]);

  const handleToggle = () => {
    if (!open && !guide && !loading) handleFetch();
    setOpen(o => !o);
  };

  // 주차 파싱
  const WEEK_TAGS = ['1주차', '2주차', '3주차', '4주차'];
  const weekSecs = {};
  if (guide) {
    for (let i = 0; i < WEEK_TAGS.length; i++) {
      const tag = `[${WEEK_TAGS[i]}]`;
      const start = guide.indexOf(tag);
      if (start === -1) continue;
      const cs = start + tag.length;
      let end = guide.length;
      for (let j = 0; j < WEEK_TAGS.length; j++) {
        if (j === i) continue;
        const nx = guide.indexOf(`[${WEEK_TAGS[j]}]`, cs);
        if (nx !== -1 && nx < end) end = nx;
      }
      weekSecs[WEEK_TAGS[i]] = guide.slice(cs, end).trim();
    }
  }
  const hasWeekStructure = WEEK_TAGS.some(t => weekSecs[t]);

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={handleToggle}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
          border: '1px solid var(--line)', background: 'transparent',
          color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all .15s',
        }}
      >
        <span>📆 {monthLabel} 주차별 가이드</span>
        <span style={{ fontSize: '10px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 8, animation: 'fadeUp .3s ease' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
              <div style={{ width: 20, height: 20, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', margin: '0 auto 6px' }} />
              주차별 흐름을 읽는 중이에요...
            </div>
          )}
          {!loading && guide && (
            hasWeekStructure ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {WEEK_TAGS.map((wk, i) => weekSecs[wk] ? (
                  <div key={wk} style={{
                    background: 'var(--bg2)', border: '1px solid var(--line)',
                    borderRadius: 8, padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>
                      {i + 1}주차
                    </div>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {weekSecs[wk]}
                    </div>
                  </div>
                ) : null)}
              </div>
            ) : (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 8, padding: '12px' }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {guide}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/** 섹션 카드 */
function SectionCard({ tag, content, isStreaming, callApi, year }) {
  const isMonthTag = Object.keys(MONTH_LABELS).includes(tag);
  const label = tag.replace('[', '').replace(']', '');
  const monthLabel = MONTH_LABELS[tag] || label;
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 'var(--r1)', padding: '14px 16px', marginBottom: 10,
      animation: 'fadeUp .3s ease',
    }}>
      <div style={{
        fontSize: 'var(--xs)', fontWeight: 700, marginBottom: 8,
        color: isMonthTag ? 'var(--gold)' : 'var(--t2)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {isMonthTag ? '🌙' : tag === '[총평]' ? '✦' : '⭐'} {label}
      </div>
      <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
        {content}
      </div>
      {/* 월별 섹션에는 주차별 가이드 버튼 추가 */}
      {isMonthTag && !isStreaming && callApi && (
        <WeeklyGuide monthTag={tag} monthLabel={monthLabel} callApi={callApi} year={year} />
      )}
    </div>
  );
}

export default function YearlyReportPage({ form, buildCtx, showToast, spendBP, currentBp, setStep, callApi }) {
  const year = new Date().getFullYear();
  const user = useAppStore((s) => s.user);
  const [started, setStarted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [activeSection, setActiveSection] = useState('[연간요약]');
  const [activeTabGroup, setActiveTabGroup] = useState('summary');

  const { streamText, isStreaming, streamError, startStream, resetStream } = useStreamResponse();

  const sections = parseSections(streamText);
  const availableTags = MONTH_TAGS.filter(t => sections[t] !== undefined);

  // 스트리밍 중 마지막으로 도달한 섹션으로 activeSection 자동 이동
  useEffect(() => {
    if (isStreaming && availableTags.length > 0) {
      setActiveSection(availableTags[availableTags.length - 1]);
    }
  }, [availableTags.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const doStream = useCallback(async () => {
    resetStream();
    setActiveSection('[연간요약]');
    setActiveTabGroup('summary');
    const ctx = buildCtx?.() || '';
    const userMessage = `${year}년 나의 연간 운세 리포트를 부탁해요.`;
    await startStream({
      userMessage,
      context: ctx,
      isYearly: true,
      clientHour: new Date().getHours(),
    });
  }, [buildCtx, year, startStream, resetStream]);

  // 최초 실행: BP 차감 후 스트리밍
  const handleStart = useCallback(async () => {
    if (!user?.id) { showToast('로그인이 필요해요', 'info'); return; }
    if (currentBp < YEARLY_COST) {
      showToast(`별 포인트가 부족해요 (${YEARLY_COST}BP 필요)`, 'error');
      return;
    }
    if (!paid) {
      const spendResult = await spendBP(YEARLY_COST, 'yearly_report');
      if (!spendResult?.success) {
        showToast('BP 차감에 실패했어요. 다시 시도해 주세요.', 'error');
        return;
      }
      setPaid(true);
    }
    setStarted(true);
    await doStream();
  }, [user?.id, currentBp, paid, spendBP, doStream, showToast]);

  // 재시도: BP 재차감 없이 스트리밍만
  const handleRetry = useCallback(async () => {
    await doStream();
  }, [doStream]);

  // 풀페이지 로딩 (스트리밍 시작 전 또는 텍스트 없을 때)
  if (started && isStreaming && !streamText) return <FeatureLoadingScreen type="report" />;

  // ── 시작 전 랜딩 화면 ──
  if (!started) {
    return (
      <div className="page step-fade">
        <div className="inner" style={{ textAlign: 'center', paddingTop: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
          <h2 style={{ fontSize: 'var(--xl)', fontWeight: 800, color: 'var(--t1)', margin: '0 0 10px' }}>
            {year}년 연간 종합 리포트
          </h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.8, margin: '0 0 32px' }}>
            사주와 별자리 데이터로 {year}년 한 해의 흐름을
            월별로 풀어드려요. 재물·연애·건강·커리어
            4대 분야와 오행 에너지 변화를 담았어요.
          </p>

          {/* 미리보기 섹션 목록 */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--line)',
            borderRadius: 'var(--r1)', padding: '16px 20px', marginBottom: 28, textAlign: 'left',
          }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 12 }}>
              ✦ 리포트 구성
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MONTH_TAGS.map(t => (
                <span key={t} style={{
                  padding: '3px 10px', borderRadius: 12,
                  background: 'var(--bg2)', border: '1px solid var(--line)',
                  fontSize: '11px', color: 'var(--t2)',
                }}>
                  {t.replace('[','').replace(']','')}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 'var(--xs)', color: 'var(--t3)', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              📆 각 월별 섹션에서 주차별 가이드도 확인할 수 있어요
            </div>
          </div>

          {/* BP 비용 배지 */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 20,
            background: 'var(--goldf)', border: '1px solid var(--acc)',
            fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 700,
            marginBottom: 20,
          }}>
            ⭐ {YEARLY_COST} BP 차감
            <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', fontWeight: 400 }}>
              (보유: {currentBp ?? 0} BP)
            </span>
          </div>

          <button
            onClick={handleStart}
            disabled={!user?.id || currentBp < YEARLY_COST}
            style={{
              width: '100%', padding: '14px', borderRadius: 'var(--r1)',
              cursor: user?.id && currentBp >= YEARLY_COST ? 'pointer' : 'not-allowed',
              background: user?.id && currentBp >= YEARLY_COST
                ? 'linear-gradient(135deg, var(--gold), #c8953a)'
                : 'var(--line)',
              color: user?.id && currentBp >= YEARLY_COST ? '#1a1208' : 'var(--t3)',
              fontWeight: 700, fontSize: 'var(--sm)', border: 'none', transition: 'all .2s',
            }}
          >
            📅 {year}년 리포트 받기
          </button>

          {!user?.id && (
            <p style={{ fontSize: 'var(--xs)', color: 'var(--rose)', marginTop: 10 }}>
              로그인이 필요해요.
            </p>
          )}
          {user?.id && currentBp < YEARLY_COST && (
            <p style={{ fontSize: 'var(--xs)', color: 'var(--rose)', marginTop: 10 }}>
              BP가 부족해요. 미션을 완료하거나 출석 체크로 BP를 모아보세요.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── 결과 화면 ──
  return (
    <div className="page step-fade">
      <div className="inner">
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2rem', marginBottom: 6 }}>📅</div>
          <h2 style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
            {year}년 연간 종합 리포트
          </h2>
          {isStreaming && (
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginTop: 6 }}>
              ✦ 별숨이 한 해를 읽고 있어요...
            </div>
          )}
        </div>

        {/* 그룹 탭 (요약 / 월별 / 마무리) */}
        {availableTags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {Object.entries(TAB_GROUPS).map(([key, g]) => {
              const hasAny = g.tags.some(t => sections[t]);
              if (!hasAny) return null;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTabGroup(key);
                    const first = g.tags.find(t => sections[t]);
                    if (first) setActiveSection(first);
                  }}
                  style={{
                    padding: '5px 14px', borderRadius: 14, fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${activeTabGroup === key ? 'var(--gold)' : 'var(--line)'}`,
                    background: activeTabGroup === key ? 'var(--goldf)' : 'var(--card)',
                    color: activeTabGroup === key ? 'var(--gold)' : 'var(--t3)',
                    fontWeight: activeTabGroup === key ? 700 : 400,
                    transition: 'all .15s',
                  }}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 현재 그룹의 섹션 탭 */}
        {availableTags.length > 0 && (
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8,
            marginBottom: 14, scrollbarWidth: 'none',
          }}>
            {(TAB_GROUPS[activeTabGroup]?.tags || []).filter(t => sections[t]).map(t => (
              <MonthTab
                key={t}
                tag={t}
                label={t.replace('[','').replace(']','')}
                active={activeSection === t}
                done={sections[t]?.length > 0}
                onClick={() => setActiveSection(t)}
              />
            ))}
          </div>
        )}

        {/* 선택된 섹션 표시 */}
        {sections[activeSection] !== undefined && (
          <SectionCard
            tag={activeSection}
            content={sections[activeSection]}
            isStreaming={isStreaming && availableTags[availableTags.length - 1] === activeSection}
            callApi={callApi}
            year={year}
          />
        )}

        {/* 스트리밍 중 다음 섹션 안내 */}
        {isStreaming && (
          <div style={{
            textAlign: 'center', padding: '12px',
            fontSize: 'var(--xs)', color: 'var(--t3)',
          }}>
            <span className="dsc-loading-dot" style={{ marginRight: 4 }} />
            다음 달을 읽는 중이에요
          </div>
        )}

        {/* 오류 */}
        {streamError && (
          <div style={{
            textAlign: 'center', padding: 16,
            background: 'var(--card)', border: '1px solid var(--rose)',
            borderRadius: 'var(--r1)', marginBottom: 10,
          }}>
            <div style={{ color: 'var(--rose)', fontSize: 'var(--xs)', marginBottom: 10 }}>
              별이 잠시 쉬고 있어요 🌙<br />
              <span style={{ color: 'var(--t4)', fontSize: '11px' }}>{streamError}</span>
            </div>
            <button
              onClick={handleRetry}
              disabled={isStreaming}
              style={{
                padding: '8px 20px', borderRadius: 20, cursor: 'pointer',
                background: 'var(--goldf)', border: '1px solid var(--acc)',
                color: 'var(--gold)', fontSize: 'var(--xs)', fontWeight: 700,
                fontFamily: 'var(--ff)',
              }}
            >
              ↺ 다시 시도 (BP 재차감 없음)
            </button>
          </div>
        )}

        {/* 완료 후 현재 그룹 전체 표시 */}
        {!isStreaming && streamText && (
          <div style={{ marginTop: 16 }}>
            {(TAB_GROUPS[activeTabGroup]?.tags || []).filter(t => sections[t] && t !== activeSection).map(t => (
              <SectionCard key={t} tag={t} content={sections[t]} isStreaming={false} callApi={callApi} year={year} />
            ))}
          </div>
        )}

        {/* 뒤로 가기 */}
        <button
          onClick={() => setStep(STEP.HOME)}
          style={{
            width: '100%', padding: '12px', marginTop: 12,
            borderRadius: 'var(--r1)', border: '1px solid var(--line)',
            background: 'var(--bg2)', color: 'var(--t2)',
            fontSize: 'var(--xs)', cursor: 'pointer',
          }}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
