import { useState, useEffect, useCallback } from "react";
import { useStreamResponse } from "../hooks/useStreamResponse.js";
import { useAppStore } from "../store/useAppStore.js";
import FeatureLoadingScreen from "./FeatureLoadingScreen.jsx";

// ═══════════════════════════════════════════════════════════
//  📅 연간 종합 리포트 — 별숨이 한 해를 읽어요
// ═══════════════════════════════════════════════════════════

const YEARLY_COST = 80; // BP 차감액

const MONTH_TAGS = [
  '[총평]',
  '[1월]','[2월]','[3월]','[4월]','[5월]','[6월]',
  '[7월]','[8월]','[9월]','[10월]','[11월]','[12월]',
  '[마무리]',
];

/** 스트리밍 텍스트를 섹션별로 분리 */
function parseSections(text) {
  if (!text) return {};
  const result = {};
  let remaining = text;
  for (let i = 0; i < MONTH_TAGS.length; i++) {
    const tag = MONTH_TAGS[i];
    const nextTag = MONTH_TAGS[i + 1];
    const start = remaining.indexOf(tag);
    if (start === -1) continue;
    const contentStart = start + tag.length;
    const end = nextTag ? remaining.indexOf(nextTag) : remaining.length;
    const content = remaining.slice(contentStart, end === -1 ? undefined : end).trim();
    result[tag] = content;
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

/** 섹션 카드 */
function SectionCard({ tag, content, isStreaming }) {
  const isMonth = tag !== '[총평]' && tag !== '[마무리]';
  const label = tag.replace('[', '').replace(']', '');
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 'var(--r1)', padding: '14px 16px', marginBottom: 10,
      animation: 'fadeUp .3s ease',
    }}>
      <div style={{
        fontSize: 'var(--xs)', fontWeight: 700, marginBottom: 8,
        color: isMonth ? 'var(--gold)' : 'var(--t2)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {isMonth ? '🌙' : tag === '[총평]' ? '✦' : '⭐'} {label}
      </div>
      <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
        {content}{isStreaming && <span className="typing-cursor" />}
      </div>
    </div>
  );
}

export default function YearlyReportPage({ form, buildCtx, showToast, spendBP, currentBp, setStep }) {
  const year = new Date().getFullYear();
  const user = useAppStore((s) => s.user);
  const [started, setStarted] = useState(false);
  const [paid, setPaid] = useState(false);   // BP 차감 완료 여부 — 재시도 시 재과금 방지
  const [activeSection, setActiveSection] = useState('[총평]');

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
    setActiveSection('[총평]');
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
      showToast(`별 포인트가 부족해요 (${YEARLY_COST}BM 필요)`, 'error');
      return;
    }
    if (!paid) {
      const spendResult = await spendBP(YEARLY_COST, 'yearly_report');
      if (!spendResult?.success) {
        showToast('BM 차감에 실패했어요. 다시 시도해 주세요.', 'error');
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

  // 풀페이지 로딩 (스트리밍 시작 전)
  if (isStreaming && !streamText) return <FeatureLoadingScreen type="report" />;

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
          </div>

          {/* BP 비용 배지 */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 20,
            background: 'var(--goldf)', border: '1px solid var(--acc)',
            fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 700,
            marginBottom: 20,
          }}>
            ⭐ {YEARLY_COST} BM 차감
            <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', fontWeight: 400 }}>
              (보유: {currentBp ?? 0} BM)
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
              BM이 부족해요. 미션을 완료하거나 출석 체크로 BM을 모아보세요.
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

        {/* 섹션 탭 스크롤 */}
        {availableTags.length > 0 && (
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8,
            marginBottom: 14, scrollbarWidth: 'none',
          }}>
            {availableTags.map(t => (
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

        {/* 완료 후 전체 보기 버튼 */}
        {!isStreaming && streamText && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700,
              marginBottom: 10, letterSpacing: '.04em',
            }}>
              ✦ 전체 월별 리포트
            </div>
            {MONTH_TAGS.filter(t => sections[t]).map(t => (
              <SectionCard key={t} tag={t} content={sections[t]} isStreaming={false} />
            ))}
          </div>
        )}

        {/* 뒤로 가기 */}
        <button
          onClick={() => setStep(0)}
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
