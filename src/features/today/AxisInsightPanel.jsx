import { useState, useEffect } from 'react';
import { ASPECT_META, LOW_AXIS_SCORE_THRESHOLD, getAxisInsight, getRecommendedRow } from './getDailyAxisScores.js';
import AxisScoreMeter from './AxisScoreMeter.jsx';

export default function AxisInsightPanel({ scores, ownedRows, onUseItem, onInspectItem, setStep, canUseItems = true }) {
  const [openKey, setOpenKey] = useState(scores[0]?.key ?? null);

  useEffect(() => {
    if (!scores.some((s) => s.key === openKey)) setOpenKey(scores[0]?.key ?? null);
  }, [scores, openKey]);

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 6 }}>SCORE GUIDE</div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 12, lineHeight: 1.6 }}>
        각 영역을 눌러서 왜 이런 점수가 나왔는지, 오늘 해보면 좋은 일과 주의할 점을 바로 볼 수 있어요.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scores.map((score) => {
          const isOpen = openKey === score.key;
          const insight = getAxisInsight(score);
          const recommendedRow = getRecommendedRow(score, ownedRows);
          const recommendedItem = recommendedRow?.item || null;
          const isLowScore = score.total <= LOW_AXIS_SCORE_THRESHOLD;

          return (
            <div key={score.key} style={{ borderRadius: 14, border: `1px solid ${isOpen ? 'var(--acc)' : 'var(--line)'}`, background: isOpen ? 'var(--bg1)' : 'transparent', overflow: 'hidden' }}>
              <div style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : score.key)}
                  style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'var(--ff)', textAlign: 'left', padding: 0 }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{ASPECT_META[score.key]?.emoji || '?'}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)' }}>{score.label}</div>
                    <AxisScoreMeter score={score} compact />
                  </div>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {isLowScore && recommendedItem && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onUseItem?.(recommendedRow); }}
                      disabled={!canUseItems}
                      style={{ padding: '7px 10px', borderRadius: 999, border: '1px solid var(--acc)', background: 'var(--goldf)', color: 'var(--gold)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--ff)', cursor: canUseItems ? 'pointer' : 'not-allowed', opacity: canUseItems ? 1 : 0.45 }}
                    >
                      바로 쓰기
                    </button>
                  )}
                  <div style={{ color: isOpen ? 'var(--gold)' : 'var(--t4)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</div>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--line)' }}>
                  <div style={{ marginTop: 12 }}><AxisScoreMeter score={score} /></div>
                  <div style={{ marginTop: 12, fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>{insight.reason}</div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--t4)', lineHeight: 1.6 }}>{insight.baseReason}</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: score.bonus > 0 ? 'var(--gold)' : 'var(--t4)', lineHeight: 1.6 }}>{insight.itemReason}</div>

                  <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                    <div style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>DO</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>{insight.do}</div>
                    </div>
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, marginBottom: 4 }}>주의</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>{insight.caution}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>추천 아이템 연결</div>
                    {recommendedItem ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{ fontSize: 18 }}>{recommendedItem.emoji}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 700, lineHeight: 1.4 }}>{recommendedItem.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--gold)' }}>+{recommendedItem.boost}점</div>
                            </div>
                          </div>
                          <button onClick={() => onInspectItem?.(recommendedRow)} style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 999, border: '1px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontSize: 10, fontFamily: 'var(--ff)', cursor: 'pointer' }}>
                            보기
                          </button>
                        </div>
                        {isLowScore && <div style={{ marginTop: 8, fontSize: 10, color: 'var(--gold)', lineHeight: 1.5 }}>점수가 낮은 영역이라 지금 써도 체감 변화가 클 수 있어요.</div>}
                        <button onClick={() => onUseItem?.(recommendedRow)} disabled={!canUseItems} style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--acc)', background: 'var(--goldf)', color: 'var(--gold)', fontSize: 'var(--xs)', fontWeight: 700, fontFamily: 'var(--ff)', cursor: canUseItems ? 'pointer' : 'not-allowed', opacity: canUseItems ? 1 : 0.45 }}>
                          이 영역 아이템 바로 사용
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6 }}>지금 가진 아이템 중 이 영역에 바로 연결되는 아이템이 없어요.</div>
                        <button onClick={() => setStep?.(38)} style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
                          아이템 보러가기
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
