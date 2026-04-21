/**
 * GachaPage — 별숨 뽑기 (step 40)
 * 위성 · 행성 · 은하 · 성운 등급의 우주 아이템 수집
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import { spendBP } from '../utils/gamificationLogic.js';
import {
  GACHA_POOL, GRADE_CONFIG, PROB_TABLE, pullOne, pull10, GRADE_ORDER,
} from '../utils/gachaItems.js';

// ─── 반짝이 파티클 ─────────────────────────────────────────────
function Sparkles({ grade }) {
  if (grade === 'satellite') return null;
  const count = { planet: 5, galaxy: 9, nebula: 14 }[grade] ?? 5;
  const color  = GRADE_CONFIG[grade].color;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        const dist  = 28 + Math.random() * 18;
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: grade === 'nebula' ? 5 : 3, height: grade === 'nebula' ? 5 : 3,
            borderRadius: '50%', background: color,
            '--sx': `${Math.cos((angle * Math.PI) / 180) * dist}px`,
            '--sy': `${Math.sin((angle * Math.PI) / 180) * dist}px`,
            animation: `gacha-sparkle ${0.55 + Math.random() * 0.45}s ease-out ${i * 0.05}s forwards`,
            opacity: 0,
          }} />
        );
      })}
    </div>
  );
}

// ─── 결과 카드 (10연 그리드용) ─────────────────────────────────
function SmallResultCard({ item, index, revealed, onClick }) {
  const cfg = GRADE_CONFIG[item.grade];
  return (
    <div
      onClick={() => !revealed && onClick(index)}
      style={{
        position: 'relative', borderRadius: 12,
        border: `1.5px solid ${revealed ? cfg.border : 'var(--line)'}`,
        background: revealed ? cfg.bg : 'var(--bg2)',
        padding: '10px 6px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        cursor: revealed ? 'default' : 'pointer',
        animation: `gacha-card-in .4s cubic-bezier(.34,1.56,.64,1) ${index * 0.06}s both`,
        minHeight: 92,
        justifyContent: 'center',
        transition: 'background .3s, border-color .3s',
        boxShadow: revealed && (grade => grade === 'nebula'
          ? '0 0 14px rgba(232,176,72,.3)'
          : grade === 'galaxy'
          ? '0 0 10px rgba(180,142,240,.2)'
          : 'none')(item.grade),
      }}
    >
      {revealed ? (
        <>
          <Sparkles grade={item.grade} />
          <div style={{ fontSize: 22, lineHeight: 1, animation: `gacha-bounce .5s ease ${index * 0.06 + 0.15}s both` }}>
            {item.emoji}
          </div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: cfg.color, letterSpacing: '.04em' }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t1)', textAlign: 'center', lineHeight: 1.25 }}>
            {item.name}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 18, opacity: .35 }}>✦</div>
          <div style={{ fontSize: '9px', color: 'var(--t4)' }}>탭</div>
        </>
      )}
    </div>
  );
}

// ─── 결과 오버레이 ─────────────────────────────────────────────
function ResultOverlay({ results, onClose }) {
  const [revealed, setRevealed] = useState(new Set());
  const isSingle    = results.length === 1;
  const allRevealed = revealed.size === results.length;
  const topGrade    = GRADE_ORDER.slice().reverse().find(g => results.some(r => r.grade === g));

  // 단일 뽑기는 자동 공개
  useEffect(() => {
    if (isSingle) {
      const t = setTimeout(() => setRevealed(new Set([0])), 350);
      return () => clearTimeout(t);
    }
  }, [isSingle]);

  const bgGradient = {
    nebula:    'radial-gradient(ellipse at 50% 35%, rgba(232,176,72,.22) 0%, rgba(13,11,20,.97) 65%)',
    galaxy:    'radial-gradient(ellipse at 50% 35%, rgba(180,142,240,.2) 0%, rgba(13,11,20,.97) 65%)',
    planet:    'radial-gradient(ellipse at 50% 35%, rgba(126,200,164,.18) 0%, rgba(13,11,20,.97) 65%)',
    satellite: 'rgba(13,11,20,.96)',
  }[topGrade] || 'rgba(13,11,20,.96)';

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: bgGradient,
      display: 'flex', flexDirection: 'column',
      animation: 'gacha-result-bg .3s ease',
    }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: '#fff' }}>
          {isSingle ? '✦ 뽑기 결과' : `✦ 10연 뽑기 결과`}
        </div>
        {allRevealed && (
          <button onClick={onClose} style={{
            padding: '6px 14px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,.2)', background: 'none',
            color: 'rgba(255,255,255,.6)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}>닫기</button>
        )}
      </div>

      {/* 카드 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isSingle ? (
          (() => {
            const item = results[0];
            const cfg  = GRADE_CONFIG[item.grade];
            const rev  = revealed.has(0);
            return (
              <div style={{
                width: 190, position: 'relative',
                borderRadius: 20,
                border: `2px solid ${rev ? cfg.border : 'rgba(255,255,255,.1)'}`,
                background: rev ? cfg.bg : 'rgba(255,255,255,.04)',
                padding: '32px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                animation: 'gacha-card-in .5s cubic-bezier(.34,1.56,.64,1) both',
                boxShadow: rev && item.grade === 'nebula' ? '0 0 40px rgba(232,176,72,.35)' : rev && item.grade === 'galaxy' ? '0 0 28px rgba(180,142,240,.28)' : 'none',
                transition: 'all .4s ease',
              }}>
                {rev ? (
                  <>
                    <Sparkles grade={item.grade} />
                    <div style={{ fontSize: 54, lineHeight: 1, animation: 'gacha-bounce .6s ease .2s both' }}>
                      {item.emoji}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, letterSpacing: '.06em' }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: '#fff', textAlign: 'center' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 'var(--xs)', color: 'rgba(255,255,255,.55)', textAlign: 'center', lineHeight: 1.6 }}>
                      {item.description}
                    </div>
                    <div style={{
                      padding: '5px 12px', borderRadius: 20,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      fontSize: '11px', color: cfg.color, fontWeight: 600, textAlign: 'center',
                    }}>
                      {item.effectLabel}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 44, opacity: .3 }}>✦</div>
                    <div style={{ fontSize: 'var(--xs)', color: 'rgba(255,255,255,.3)' }}>공개 중...</div>
                  </>
                )}
              </div>
            );
          })()
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7, width: '100%',
          }}>
            {results.map((item, i) => (
              <SmallResultCard
                key={i}
                item={item}
                index={i}
                revealed={revealed.has(i)}
                onClick={(idx) => setRevealed(prev => new Set([...prev, idx]))}
              />
            ))}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div style={{ padding: '10px 16px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!allRevealed && !isSingle && (
          <button
            onClick={() => setRevealed(new Set(results.map((_, i) => i)))}
            style={{
              width: '100%', padding: '13px',
              background: 'var(--goldf)', border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
              fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            ✦ 모두 공개
          </button>
        )}
        {allRevealed && (
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '13px',
              background: 'var(--goldf)', border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
              fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            보관함에서 확인하기 →
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────────
export default function GachaPage({ showToast }) {
  const user    = useAppStore(s => s.user);
  const setStep = useAppStore(s => s.setStep);
  const kakaoId = user?.kakaoId || user?.id;

  const [currentBP, setCurrentBP]   = useState(0);
  const [loadingBP, setLoadingBP]   = useState(false);
  const [pulling, setPulling]       = useState(false); // 'single' | '10' | false
  const [results, setResults]       = useState(null);
  const [showProb, setShowProb]     = useState(false);
  const [activeGrade, setActiveGrade] = useState('satellite'); // 미리보기 탭

  useEffect(() => {
    if (!kakaoId) return;
    setLoadingBP(true);
    getAuthenticatedClient(kakaoId)
      .from('users').select('current_bp').eq('kakao_id', String(kakaoId)).single()
      .then(({ data }) => setCurrentBP(data?.current_bp ?? 0))
      .finally(() => setLoadingBP(false));
  }, [kakaoId]);

  async function doPull(count) {
    if (!kakaoId) { showToast?.('로그인 후 이용 가능해요', 'info'); return; }
    const cost = count === 1 ? 10 : 90;
    if (currentBP < cost) { showToast?.(`BP가 부족해요 (필요: ${cost} BP)`, 'error'); return; }
    setPulling(count === 1 ? 'single' : '10');
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok, newBP } = await spendBP(
        client, kakaoId, cost,
        `GACHA_PULL_${count}_${Date.now()}`,
        count === 1 ? '뽑기 1회' : '뽑기 10연',
      );
      if (!ok) { showToast?.('BP가 부족해요', 'error'); return; }

      const pulled = count === 1 ? [pullOne()] : pull10();

      await getAuthenticatedClient(kakaoId).from('user_shop_inventory').insert(
        pulled.map(item => ({
          kakao_id: String(kakaoId),
          item_id: item.id,
          is_equipped: false,
          acquired_at: new Date().toISOString(),
        }))
      );

      setCurrentBP(newBP ?? currentBP - cost);
      setResults(pulled);
    } catch {
      showToast?.('뽑기 중 오류가 발생했어요', 'error');
    } finally {
      setPulling(false);
    }
  }

  // 등급별 미리보기 — 해당 등급 천체만 (각 천체 대표 1개)
  const previewBodies = (() => {
    const seen = new Set();
    return GACHA_POOL
      .filter(i => i.grade === activeGrade)
      .filter(i => { if (seen.has(i.bodyId)) return false; seen.add(i.bodyId); return true; });
  })();

  const cfg = GRADE_CONFIG[activeGrade];

  return (
    <div className="page step-fade" style={{ paddingBottom: 52 }}>
      {/* 헤더 */}
      <div style={{ padding: '22px 20px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8, animation: 'floatGently 3s ease infinite' }}>🌌</div>
        <h2 style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px' }}>
          별숨 뽑기
        </h2>
        <p style={{ fontSize: 'var(--xs)', color: 'var(--t3)', margin: 0, lineHeight: 1.7 }}>
          우주 천체 아이템을 수집하고 합성해요<br />
          위성 → 행성 → 은하 → 성운 등급이 있어요
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 18px', borderRadius: 24,
          background: 'var(--goldf)', border: '1px solid var(--acc)', marginTop: 12,
        }}>
          <span style={{ fontSize: 13, color: 'var(--gold)' }}>✦</span>
          <span style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--gold)' }}>
            {loadingBP ? '...' : currentBP} BP
          </span>
        </div>
      </div>

      {/* 뽑기 배너 */}
      <div style={{
        margin: '18px 20px 0',
        borderRadius: 'var(--r2)',
        background: 'linear-gradient(135deg, #0d0830 0%, #0d0b20 55%, #150a2e 100%)',
        border: '1px solid rgba(180,142,240,.3)',
        padding: '22px 18px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* 배경 별빛 */}
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${8 + (i * 11) % 84}%`, left: `${4 + (i * 18) % 92}%`,
            width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2,
            borderRadius: '50%',
            background: ['rgba(155,173,206,.7)', 'rgba(126,200,164,.6)', 'rgba(180,142,240,.6)', 'rgba(232,176,72,.5)'][i % 4],
            animation: `floatGently ${2 + i % 3}s ease infinite ${i * 0.25}s`,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'rgba(180,142,240,.8)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 5 }}>
            ✦ 우주 수집 가챠
          </div>
          <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            {GACHA_POOL.length}종 천체 아이템
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', marginBottom: 18, lineHeight: 1.6 }}>
            위성 {GACHA_POOL.filter(i => i.grade === 'satellite').length}종 ·
            행성 {GACHA_POOL.filter(i => i.grade === 'planet').length}종 ·
            은하 {GACHA_POOL.filter(i => i.grade === 'galaxy').length}종 ·
            성운 {GACHA_POOL.filter(i => i.grade === 'nebula').length}종
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {/* 1회 */}
            <button
              onClick={() => doPull(1)}
              disabled={!!pulling || currentBP < 10}
              style={{
                flex: 1, padding: '13px 8px', borderRadius: 'var(--r1)',
                background: currentBP >= 10 ? 'rgba(155,173,206,.15)' : 'rgba(255,255,255,.04)',
                border: `1.5px solid ${currentBP >= 10 ? 'rgba(155,173,206,.5)' : 'rgba(255,255,255,.08)'}`,
                color: currentBP >= 10 ? '#9BADCE' : 'rgba(255,255,255,.25)',
                fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
                cursor: currentBP >= 10 && !pulling ? 'pointer' : 'not-allowed',
                transition: 'all .2s',
              }}
            >
              {pulling === 'single' ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <span style={{ width: 11, height: 11, border: '2px solid rgba(155,173,206,.4)', borderTopColor: '#9BADCE', borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block' }} />
                  뽑는 중...
                </span>
              ) : (
                <>✦ 1회 뽑기<br /><span style={{ fontSize: '11px', fontWeight: 400 }}>10 BP</span></>
              )}
            </button>

            {/* 10연 */}
            <button
              onClick={() => doPull(10)}
              disabled={!!pulling || currentBP < 90}
              style={{
                flex: 1.4, padding: '13px 8px', borderRadius: 'var(--r1)',
                background: currentBP >= 90
                  ? 'linear-gradient(135deg, rgba(180,142,240,.25), rgba(232,176,72,.12))'
                  : 'rgba(255,255,255,.04)',
                border: `1.5px solid ${currentBP >= 90 ? 'rgba(180,142,240,.5)' : 'rgba(255,255,255,.08)'}`,
                color: currentBP >= 90 ? '#B48EF0' : 'rgba(255,255,255,.25)',
                fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
                cursor: currentBP >= 90 && !pulling ? 'pointer' : 'not-allowed',
                transition: 'all .2s', position: 'relative', overflow: 'hidden',
              }}
            >
              {pulling === '10' ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <span style={{ width: 11, height: 11, border: '2px solid rgba(180,142,240,.4)', borderTopColor: '#B48EF0', borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block' }} />
                  뽑는 중...
                </span>
              ) : (
                <>
                  <span style={{
                    position: 'absolute', inset: 0, borderRadius: 'inherit',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent)',
                    animation: currentBP >= 90 ? 'gacha-shine 2.5s ease infinite' : 'none',
                  }} />
                  ✦ 10연 뽑기<br />
                  <span style={{ fontSize: '11px' }}>90 BP</span>
                  <span style={{ display: 'block', fontSize: '10px', color: 'rgba(126,200,164,.8)', marginTop: 2 }}>행성 이상 보장</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 확률 토글 */}
      <div style={{ padding: '8px 20px 0' }}>
        <button
          onClick={() => setShowProb(p => !p)}
          style={{
            background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {showProb ? '▲' : '▼'} 뽑기 확률 · 합성 정보 보기
        </button>
        {showProb && (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--line)',
            borderRadius: 'var(--r1)', padding: '14px 16px', marginTop: 8,
            animation: 'fadeUp .25s ease',
          }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', fontWeight: 700, marginBottom: 10 }}>
              뽑기 확률
            </div>
            {PROB_TABLE.map(row => (
              <div key={row.grade} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '1px solid var(--line)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color }} />
                  <span style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>{row.label}</span>
                </div>
                <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: row.color }}>{row.prob}%</span>
              </div>
            ))}
            <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 10, lineHeight: 1.8 }}>
              ✦ 10연 뽑기: 행성 이상 1개 보장<br />
              ✦ 합성: 위성 3개 → 행성 / 행성 3개 → 은하 / 은하 3개 → 성운
            </div>
          </div>
        )}
      </div>

      {/* 아이템 미리보기 */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 10 }}>
          ✦ 등장 아이템 미리보기
        </div>

        {/* 등급 탭 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {Object.entries(GRADE_CONFIG).map(([grade, gcfg]) => (
            <button
              key={grade}
              onClick={() => setActiveGrade(grade)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
                border: `1px solid ${activeGrade === grade ? gcfg.border : 'var(--line)'}`,
                background: activeGrade === grade ? gcfg.bg : 'none',
                color: activeGrade === grade ? gcfg.color : 'var(--t3)',
                fontWeight: activeGrade === grade ? 700 : 400, cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {gcfg.label}
            </button>
          ))}
        </div>

        {/* 아이템 카드 가로 스크롤 */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {previewBodies.map(item => (
            <div key={item.bodyId} style={{
              flexShrink: 0, width: 76,
              background: 'var(--bg2)', border: `1px solid ${cfg.border}`,
              borderRadius: 12, padding: '10px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{item.emoji}</div>
              <div style={{ fontSize: '10px', color: 'var(--t1)', fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>
                {item.bodyName}
              </div>
              <div style={{ fontSize: '9px', color: cfg.color }}>
                {item.effectLabel}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 8 }}>
          {cfg.label} 등급: {GACHA_POOL.filter(i => i.grade === activeGrade).length}종 아이템
          ({previewBodies.length}개 천체 × 6가지 속성)
        </div>
      </div>

      {/* 합성 안내 */}
      <div style={{
        margin: '16px 20px 0', padding: '14px 16px',
        background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)',
      }}>
        <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>
          ✦ 합성 시스템
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: '12px' }}>
          {Object.entries(GRADE_CONFIG).map(([grade, gcfg], i, arr) => (
            <span key={grade} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                padding: '3px 8px', borderRadius: 12,
                background: gcfg.bg, border: `1px solid ${gcfg.border}`,
                color: gcfg.color, fontWeight: 700, fontSize: '11px',
              }}>
                {gcfg.label}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: 'var(--t4)', fontSize: '11px' }}>×3 →</span>
              )}
            </span>
          ))}
        </div>
        <button
          onClick={() => setStep(38)}
          style={{
            marginTop: 12, padding: '8px 16px',
            background: 'var(--goldf)', border: '1px solid var(--acc)',
            borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
            fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          내 보관함 / 합성 →
        </button>
      </div>

      {/* 결과 오버레이 */}
      {results && <ResultOverlay results={results} onClose={() => setResults(null)} />}
    </div>
  );
}
