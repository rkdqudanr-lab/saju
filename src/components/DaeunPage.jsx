/**
 * DaeunPage — 사주 대운(大運) 타임라인
 * 10년 주기 대운을 가로 스크롤 타임라인으로 시각화하고
 * AI 해설(isDaeun 모드)을 불러옵니다.
 */

import { useState, useRef, useEffect } from 'react';
import { getDaeun, getCurrentDaeunIndex, EL_COLOR } from '../../lib/daeun.js';
import { useAppStore } from '../store/useAppStore.js';
import { saveDaeunPDF } from '../utils/imageExport.js';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_AGE_OFFSET = 0; // 현재 나이 계산용

function DaeunCard({ period, isCurrent, isNext }) {
  const mainEl = period.mainEl;
  const color = EL_COLOR[mainEl] || EL_COLOR['토'];

  return (
    <div
      style={{
        minWidth: isCurrent ? 160 : 130,
        padding: isCurrent ? '18px 14px' : '14px 12px',
        borderRadius: 'var(--r2, 16px)',
        background: isCurrent ? color.bg : 'var(--bg2)',
        border: `2px solid ${isCurrent ? color.border : isNext ? 'var(--acc)' : 'var(--line)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexShrink: 0,
        position: 'relative',
        transition: 'all 0.2s ease',
        boxShadow: isCurrent ? `0 4px 16px ${color.bg}` : 'none',
        cursor: 'pointer',
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
        fontSize: isCurrent ? '20px' : '17px',
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

export default function DaeunPage({ form, saju, callApi, buildCtx, showToast }) {
  const { user } = useAppStore();
  const scrollRef = useRef(null);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfSaving, setPdfSaving] = useState(false);
  const [daeunData, setDaeunData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);

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
    const cardWidth = 145;
    const offset = Math.max(0, currentIdx * cardWidth - 40);
    scrollRef.current.scrollLeft = offset;
  }, [currentIdx, daeunData]);

  async function handleAskInterpretation() {
    if (!daeunData || !user) {
      showToast('로그인 후 이용 가능해요', 'info');
      return;
    }
    setLoading(true);
    setInterpretation('');

    const current = daeunData.periods[currentIdx];
    const next = daeunData.periods[currentIdx + 1];
    const ctx = buildCtx ? buildCtx() : '';

    const summary = [
      `현재 나이: ${CURRENT_YEAR - Number(form.by)}세`,
      `순행 여부: ${daeunData.isForward ? '순행' : '역행'}`,
      `현재 대운: ${current?.cg}${current?.jj} (${current?.age}~${current?.ageEnd}세, ${current?.cgEl}·${current?.jjEl})`,
      next ? `다음 대운: ${next.cg}${next.jj} (${next.age}~${next.ageEnd}세)` : '',
      `전체 대운 흐름: ${daeunData.periods.map(p => `${p.cg}${p.jj}`).join('→')}`,
    ].filter(Boolean).join('\n');

    try {
      const result = await callApi(`나의 대운 흐름을 해설해줘:\n${summary}`, {
        context: ctx,
        isDaeun: true,
      });
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
          <div style={{
            fontSize: 'var(--xs)',
            color: 'var(--t4)',
            padding: '0 20px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ opacity: 0.5 }}>← →</span> 전체 대운 확인
          </div>
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              padding: '12px 20px 16px',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              width: '100%',
              boxSizing: 'border-box'
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
        </div>
      )}

      {/* AI 해설 영역 */}
      <div style={{ padding: '4px 20px 0' }}>
        {!interpretation && !loading && (
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
        )}

        {loading && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: 'var(--t4)',
            fontSize: 'var(--xs)',
          }}>
            <div style={{
              width: 28,
              height: 28,
              border: '2px solid var(--line)',
              borderTopColor: 'var(--gold)',
              borderRadius: '50%',
              animation: 'orbSpin 0.8s linear infinite',
              margin: '0 auto 8px',
            }} />
            대운 흐름을 읽고 있어요...
          </div>
        )}

        {interpretation && (
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r2, 16px)',
            padding: '20px 18px',
          }}>
            <div style={{
              fontSize: 'var(--xs)',
              color: 'var(--gold)',
              fontWeight: 700,
              marginBottom: 14,
              letterSpacing: '.06em',
            }}>
              ✦ AI 대운 해설
            </div>
            {interpretation.split(/\[(현재대운|다음대운|전체흐름)\]/).map((part, i) => {
              if (!part.trim()) return null;
              const labels = ['현재대운', '다음대운', '전체흐름'];
              const isLabel = labels.includes(part.trim());
              if (isLabel) return (
                <div key={i} style={{
                  fontSize: 'var(--xs)',
                  fontWeight: 700,
                  color: 'var(--t2)',
                  marginTop: i > 0 ? 16 : 0,
                  marginBottom: 4,
                }}>
                  [{part.trim()}]
                </div>
              );
              return (
                <div key={i} style={{
                  fontSize: 'var(--sm)',
                  color: 'var(--t1)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                }}>
                  {part.trim()}
                </div>
              );
            })}
            <button
              onClick={() => setInterpretation('')}
              style={{
                marginTop: 16,
                background: 'none',
                border: 'none',
                color: 'var(--t4)',
                fontSize: 'var(--xs)',
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
              }}
            >
              다시 보기
            </button>
          </div>
        )}
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
