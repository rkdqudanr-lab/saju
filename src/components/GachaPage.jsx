/**
 * GachaPage — 별숨 뽑기 (step 40)
 * 탭 1: 🌌 우주 뽑기 (위성/행성/은하/성운)
 * 탭 2: ☯️ 사주 뽑기 (오행/천간/지지/육십갑자)
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import { spendBP } from '../utils/gamificationLogic.js';
import { saveConsultationHistoryEntry } from '../utils/consultationHistory.js';
import {
  GACHA_POOL,   GRADE_CONFIG,      PROB_TABLE,      pullOne,     pull10,      GRADE_ORDER,
  SAJU_POOL,    SAJU_GRADE_CONFIG,  SAJU_PROB_TABLE, pullOneSaju, pull10Saju, SAJU_GRADE_ORDER,
} from '../utils/gachaItems.js';
import GachaGraphic from './GachaGraphic.jsx';

// ─── 공용 — 반짝이 파티클 ─────────────────────────────────────
function Sparkles({ grade, cfg }) {
  const count = { 2: 5, 3: 9, 4: 14 }[['satellite','ohaeng'].includes(grade) ? 1 : ['planet','cheongan'].includes(grade) ? 2 : ['galaxy','jiji'].includes(grade) ? 3 : 4] ?? 5;
  if (count <= 1) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        const dist  = 28 + Math.random() * 18;
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 4, height: 4, borderRadius: '50%', background: cfg.color,
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

// ─── 공용 — 소형 결과 카드 (10연 그리드) ─────────────────────
function SmallResultCard({ item, index, revealed, gradeConfig, onClick }) {
  const cfg = gradeConfig[item.grade];
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
        minHeight: 92, justifyContent: 'center',
        transition: 'background .3s, border-color .3s',
      }}
    >
      {revealed ? (
        <>
          <Sparkles grade={item.grade} cfg={cfg} />
          <div style={{ animation: `gacha-bounce .5s ease ${index * 0.06 + 0.15}s both`, display:'flex', justifyContent:'center', marginBottom: 4 }}>
            <GachaGraphic item={item} size={36} />
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

// ─── 공용 — 결과 오버레이 ─────────────────────────────────────
function ResultOverlay({ results, gradeConfig, onClose }) {
  const [revealed, setRevealed] = useState(new Set());
  const isSingle    = results.length === 1;
  const allRevealed = revealed.size === results.length;
  const gradeOrder  = Object.keys(gradeConfig);
  const topGrade    = gradeOrder.slice().reverse().find(g => results.some(r => r.grade === g));
  const topCfg      = gradeConfig[topGrade] || {};

  useEffect(() => {
    if (isSingle) {
      const t = setTimeout(() => setRevealed(new Set([0])), 350);
      return () => clearTimeout(t);
    }
  }, [isSingle]);

  const bgGradient = topGrade === gradeOrder[gradeOrder.length - 1]
    ? `radial-gradient(ellipse at 50% 35%, ${topCfg.bg?.replace('0.15','0.35') || 'rgba(232,176,72,.35)'} 0%, #0d0b14 60%)`
    : topGrade === gradeOrder[gradeOrder.length - 2]
    ? `radial-gradient(ellipse at 50% 35%, ${topCfg.bg?.replace('0.15','0.25') || 'rgba(180,142,240,.25)'} 0%, #0d0b14 60%)`
    : '#0d0b14';

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: bgGradient,
      display: 'flex', flexDirection: 'column',
      animation: 'gacha-result-bg .3s ease',
    }}>
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: '#fff' }}>
          {isSingle ? '✦ 뽑기 결과' : '✦ 10연 뽑기 결과'}
        </div>
        {allRevealed && (
          <button onClick={onClose} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,.2)',
            background: 'none', color: 'rgba(255,255,255,.6)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}>닫기</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isSingle ? (() => {
          const item = results[0];
          const cfg  = gradeConfig[item.grade];
          const rev  = revealed.has(0);
          return (
            <div style={{
              width: 190, position: 'relative', borderRadius: 20,
              border: `2px solid ${rev ? cfg.border : 'rgba(255,255,255,.1)'}`,
              background: rev ? cfg.bg : 'rgba(255,255,255,.04)',
              padding: '32px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              animation: 'gacha-card-in .5s cubic-bezier(.34,1.56,.64,1) both',
              boxShadow: rev ? `0 0 30px ${cfg.border}` : 'none',
              transition: 'all .4s ease',
            }}>
              {rev ? (
                <>
                  <Sparkles grade={item.grade} cfg={cfg} />
                  <div style={{ animation: 'gacha-bounce .6s ease .2s both', marginTop: 10, marginBottom: 5 }}>
                    <GachaGraphic item={item} size={90} />
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, letterSpacing: '.06em' }}>{cfg.label}</div>
                  <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: item.affixColor || '#fff', textAlign: 'center' }}>{item.name}</div>
                  <div style={{ fontSize: 'var(--xs)', color: 'rgba(255,255,255,.55)', textAlign: 'center', lineHeight: 1.6 }}>{item.description}</div>
                  <div style={{
                    padding: '5px 12px', borderRadius: 20, background: cfg.bg,
                    border: `1px solid ${cfg.border}`, fontSize: '11px', color: cfg.color, fontWeight: 600, textAlign: 'center',
                  }}>{item.effectLabel}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 44, opacity: .3 }}>✦</div>
                  <div style={{ fontSize: 'var(--xs)', color: 'rgba(255,255,255,.3)' }}>공개 중...</div>
                </>
              )}
            </div>
          );
        })() : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7, width: '100%' }}>
            {results.map((item, i) => (
              <SmallResultCard
                key={i} item={item} index={i} revealed={revealed.has(i)}
                gradeConfig={gradeConfig}
                onClick={(idx) => setRevealed(prev => new Set([...prev, idx]))}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 16px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!allRevealed && !isSingle && (
          <button
            onClick={() => setRevealed(new Set(results.map((_, i) => i)))}
            style={{
              width: '100%', padding: '13px', background: 'var(--goldf)', border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
              fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >✦ 모두 공개</button>
        )}
        {allRevealed && (
          <button onClick={onClose} style={{
            width: '100%', padding: '13px', background: 'var(--goldf)', border: '1.5px solid var(--acc)',
            borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
            fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}>보관함에서 확인하기 →</button>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ─── 공용 — 뽑기 배너 ────────────────────────────────────────
function GachaBanner({ currentBP, pulling, onPull, bgStyle, accentColor, title, subtitle, statsLine, single1Label, single10Label }) {
  return (
    <div style={{
      margin: '18px 20px 0', borderRadius: 'var(--r2)',
      ...bgStyle,
      padding: '22px 18px', position: 'relative', overflow: 'hidden',
    }}>
      {/* 배경 파티클 */}
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${8 + (i * 11) % 84}%`, left: `${4 + (i * 18) % 92}%`,
          width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
          borderRadius: '50%', background: accentColor,
          opacity: 0.5 + (i % 3) * 0.15,
          animation: `floatGently ${2 + i % 3}s ease infinite ${i * 0.25}s`,
        }} />
      ))}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 'var(--xs)', color: accentColor, fontWeight: 700, letterSpacing: '.08em', marginBottom: 5, opacity: .85 }}>
          ✦ {title}
        </div>
        <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{subtitle}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', marginBottom: 18, lineHeight: 1.6 }}>
          {statsLine}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* 1회 */}
          <button
            onClick={() => onPull(1)}
            disabled={!!pulling || currentBP < 10}
            style={{
              flex: 1, padding: '13px 8px', borderRadius: 'var(--r1)',
              background: currentBP >= 10 ? `${accentColor}22` : 'rgba(255,255,255,.04)',
              border: `1.5px solid ${currentBP >= 10 ? `${accentColor}80` : 'rgba(255,255,255,.08)'}`,
              color: currentBP >= 10 ? accentColor : 'rgba(255,255,255,.25)',
              fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
              cursor: currentBP >= 10 && !pulling ? 'pointer' : 'not-allowed', transition: 'all .2s',
            }}
          >
            {pulling === 'single' ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ width: 11, height: 11, border: `2px solid ${accentColor}40`, borderTopColor: accentColor, borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block' }} />
                뽑는 중...
              </span>
            ) : (
              <>✦ 1회 뽑기<br /><span style={{ fontSize: '11px', fontWeight: 400 }}>10 BP</span></>
            )}
          </button>
          {/* 10연 */}
          <button
            onClick={() => onPull(10)}
            disabled={!!pulling || currentBP < 90}
            style={{
              flex: 1.4, padding: '13px 8px', borderRadius: 'var(--r1)',
              background: currentBP >= 90 ? `${accentColor}30` : 'rgba(255,255,255,.04)',
              border: `1.5px solid ${currentBP >= 90 ? `${accentColor}70` : 'rgba(255,255,255,.08)'}`,
              color: currentBP >= 90 ? accentColor : 'rgba(255,255,255,.25)',
              fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
              cursor: currentBP >= 90 && !pulling ? 'pointer' : 'not-allowed',
              transition: 'all .2s', position: 'relative', overflow: 'hidden',
            }}
          >
            {pulling === '10' ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ width: 11, height: 11, border: `2px solid ${accentColor}40`, borderTopColor: accentColor, borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block' }} />
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
                <span style={{ display: 'block', fontSize: '10px', color: single10Label.color, marginTop: 2 }}>
                  {single10Label.text}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 공용 — 아이템 미리보기 ─────────────────────────────────
function ItemPreview({ pool, gradeConfig, gradeOrder, probTable }) {
  const [activeGrade, setActiveGrade] = useState(gradeOrder[0]);
  const cfg = gradeConfig[activeGrade];

  const previewBodies = (() => {
    const seen = new Set();
    return pool.filter(i => i.grade === activeGrade).filter(i => {
      if (seen.has(i.bodyId)) return false;
      seen.add(i.bodyId); return true;
    });
  })();

  return (
    <div style={{ padding: '18px 20px 0' }}>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 10 }}>
        ✦ 등장 아이템 미리보기
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {gradeOrder.map(grade => {
          const gcfg = gradeConfig[grade];
          return (
            <button key={grade} onClick={() => setActiveGrade(grade)} style={{
              padding: '5px 11px', borderRadius: 20, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
              border: `1px solid ${activeGrade === grade ? gcfg.border : 'var(--line)'}`,
              background: activeGrade === grade ? gcfg.bg : 'none',
              color: activeGrade === grade ? gcfg.color : 'var(--t3)',
              fontWeight: activeGrade === grade ? 700 : 400, cursor: 'pointer', transition: 'all .15s',
            }}>
              {gcfg.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {previewBodies.map(item => (
          <div key={item.bodyId} style={{
            background: 'var(--bg2)', border: `1px solid ${cfg.border}`,
            borderRadius: 12, padding: '16px 8px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{item.emoji}</div>
            <div style={{ fontSize: '11px', color: 'var(--t1)', fontWeight: 600, lineHeight: 1.3, marginBottom: 4, wordBreak: 'keep-all' }}>
              {item.bodyName}
            </div>
            <div style={{ fontSize: '10px', color: cfg.color, wordBreak: 'keep-all' }}>{item.effectLabel}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 8 }}>
        {cfg.label} 등급: {pool.filter(i => i.grade === activeGrade).length}종
        ({previewBodies.length}개 × 6가지 속성)
      </div>
    </div>
  );
}

// ─── 공용 — 합성 안내 ────────────────────────────────────────
function SynthGuide({ gradeConfig, gradeOrder, setStep }) {
  return (
    <div style={{
      margin: '16px 20px 0', padding: '14px 16px',
      background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)',
    }}>
      <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>✦ 합성</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: '12px' }}>
        {gradeOrder.map((grade, i, arr) => {
          const gcfg = gradeConfig[grade];
          return (
            <span key={grade} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                padding: '3px 8px', borderRadius: 12, background: gcfg.bg,
                border: `1px solid ${gcfg.border}`, color: gcfg.color, fontWeight: 700, fontSize: '11px',
              }}>{gcfg.label}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--t4)', fontSize: '11px' }}>×3 →</span>}
            </span>
          );
        })}
      </div>
      <button
        onClick={() => setStep(38)}
        style={{
          marginTop: 10, padding: '8px 16px', background: 'var(--goldf)', border: '1px solid var(--acc)',
          borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
          fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
        }}
      >내 보관함 / 합성 →</button>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────
export default function GachaPage({ showToast, consentFlags }) {
  const user             = useAppStore(s => s.user);
  const setStep          = useAppStore(s => s.setStep);
  const equippedSajuItem = useAppStore(s => s.equippedSajuItem);
  const gamificationState = useAppStore(s => s.gamificationState);
  const kakaoId = user?.kakaoId || user?.id;

  const [tab, setTab]             = useState('space'); // 'space' | 'saju'
  const [currentBP, setCurrentBP] = useState(0);
  const [loadingBP, setLoadingBP] = useState(false);
  const [pulling, setPulling]     = useState(false);
  const [results, setResults]     = useState(null);
  const [showProb, setShowProb]   = useState(false);
  const [lastPullMeta, setLastPullMeta] = useState(null);

  useEffect(() => {
    if (!kakaoId) return;
    setLoadingBP(true);
    getAuthenticatedClient(kakaoId)
      .from('users').select('current_bp').eq('kakao_id', String(kakaoId)).single()
      .then(({ data }) => setCurrentBP(data?.current_bp ?? 0))
      .finally(() => setLoadingBP(false));
  }, [kakaoId]);

  // 탭 바뀔 때 결과 오버레이 닫기
  useEffect(() => { setResults(null); setShowProb(false); }, [tab]);

  useEffect(() => {
    if (!results?.length || !lastPullMeta) return;

    const resultSummary = results.map(item => `${item.name} (${item.grade})`).join(', ');
    saveConsultationHistoryEntry({
      user,
      consentFlags,
      questions: [`별숨 뽑기: ${lastPullMeta.label} ${lastPullMeta.count}회`],
      answers: [`획득 아이템: ${resultSummary}`],
    }).catch(() => {});
  }, [consentFlags, lastPullMeta, results, user]);

  async function doPull(count) {
    if (!kakaoId) { showToast?.('로그인 후 이용 가능해요', 'info'); return; }
    const cost = count === 1 ? 10 : 90;
    if (currentBP < cost) { showToast?.(`BP가 부족해요 (필요: ${cost} BP)`, 'error'); return; }
    setPulling(count === 1 ? 'single' : '10');
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok, newBP } = await spendBP(client, kakaoId, cost, `GACHA_${tab.toUpperCase()}_${count}_${Date.now()}`, `${tab === 'saju' ? '사주' : '우주'} 뽑기 ${count}회`);
      if (!ok) { showToast?.('BP가 부족해요', 'error'); return; }

      const pulled = tab === 'saju'
        ? (count === 1 ? [pullOneSaju()] : pull10Saju())
        : (count === 1 ? [pullOne()]     : pull10());

      await client.from('user_shop_inventory').insert(
        pulled.map(item => ({
          kakao_id: String(kakaoId), item_id: item.id,
          is_equipped: false, unlocked_at: new Date().toISOString(),
        }))
      );

      setCurrentBP(newBP ?? currentBP - cost);
      setLastPullMeta({ count, label: tab === 'saju' ? '사주 뽑기' : '우주 뽑기' });
      setResults(pulled);
    } catch {
      showToast?.('뽑기 중 오류가 발생했어요', 'error');
    } finally {
      setPulling(false);
    }
  }

  const isSaju   = tab === 'saju';
  const gradeConfig = isSaju ? SAJU_GRADE_CONFIG : GRADE_CONFIG;
  const gradeOrder  = isSaju ? SAJU_GRADE_ORDER  : GRADE_ORDER;
  const pool        = isSaju ? SAJU_POOL          : GACHA_POOL;
  const probTable   = isSaju ? SAJU_PROB_TABLE    : PROB_TABLE;

  return (
    <div className="page step-fade" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))', maxWidth: 480, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ padding: '22px 20px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8, animation: 'floatGently 3s ease infinite' }}>
          {isSaju ? '☯️' : '🌌'}
        </div>
        <h2 style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px' }}>
          별숨 뽑기
        </h2>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 18px', borderRadius: 24, background: 'var(--goldf)', border: '1px solid var(--acc)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--gold)' }}>✦</span>
          <span style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--gold)' }}>
            {loadingBP ? '...' : currentBP} BP
          </span>
        </div>
      </div>

      {/* ── 오늘 별숨 기반 추천 배너 ── */}
      {user && (
        <div style={{ margin: '14px 20px 0', padding: '11px 14px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.5 }}>
            {equippedSajuItem ? (
              <>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{equippedSajuItem.emoji} {equippedSajuItem.name}</span>
                <span> 기운 장착 중 · 뽑기로 더 강화해요</span>
              </>
            ) : (
              <span>뽑은 아이템을 <strong style={{ color: 'var(--gold)' }}>메인 기운</strong>으로 장착하면 AI 답변에 반영돼요</span>
            )}
          </div>
          {equippedSajuItem ? (
            <button onClick={() => setStep(38)} style={{ flexShrink: 0, fontSize: '10px', color: 'var(--t4)', background: 'none', border: '1px solid var(--line)', borderRadius: 20, padding: '3px 8px', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
              내 아이템
            </button>
          ) : (
            <button onClick={() => setStep(38)} style={{ flexShrink: 0, fontSize: '10px', color: 'var(--gold)', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 20, padding: '3px 10px', fontFamily: 'var(--ff)', cursor: 'pointer', fontWeight: 700 }}>
              장착하기
            </button>
          )}
        </div>
      )}

      {/* ── 탭 ── */}
      <div style={{
        display: 'flex', margin: '16px 20px 0',
        background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 4,
        border: '1px solid var(--line)',
      }}>
        {[
          { key: 'space', label: '🌌 우주 뽑기' },
          { key: 'saju',  label: '☯️ 사주 뽑기' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '9px', borderRadius: 8,
              border: 'none',
              background: tab === t.key ? 'var(--goldf)' : 'none',
              color: tab === t.key ? 'var(--gold)' : 'var(--t3)',
              fontWeight: tab === t.key ? 700 : 400,
              fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
              whiteSpace: 'nowrap', wordBreak: 'keep-all',
              transition: 'all .18s',
              outline: tab === t.key ? '1px solid var(--acc)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 탭별 배너 ── */}
      {isSaju ? (
        <GachaBanner
          currentBP={currentBP} pulling={pulling} onPull={doPull}
          bgStyle={{ background: 'linear-gradient(135deg, #1a0c10 0%, #100a0a 55%, #1a100a 100%)', border: '1px solid rgba(212,165,106,.3)' }}
          accentColor="rgba(212,165,106,0.9)"
          title="사주명리 가챠"
          subtitle={`${SAJU_POOL.length}종 사주 아이템`}
          statsLine={`오행 ${SAJU_POOL.filter(i=>i.grade==='ohaeng').length}종 · 천간 ${SAJU_POOL.filter(i=>i.grade==='cheongan').length}종 · 지지 ${SAJU_POOL.filter(i=>i.grade==='jiji').length}종 · 육십갑자 ${SAJU_POOL.filter(i=>i.grade==='gapja').length}종`}
          single10Label={{ color: 'rgba(123,164,212,.85)', text: '천간 이상 보장' }}
        />
      ) : (
        <GachaBanner
          currentBP={currentBP} pulling={pulling} onPull={doPull}
          bgStyle={{ background: 'linear-gradient(135deg, #0d0830 0%, #0d0b20 55%, #150a2e 100%)', border: '1px solid rgba(180,142,240,.3)' }}
          accentColor="rgba(180,142,240,0.9)"
          title="우주 수집 가챠"
          subtitle={`${GACHA_POOL.length}종 천체 아이템`}
          statsLine={`위성 ${GACHA_POOL.filter(i=>i.grade==='satellite').length}종 · 행성 ${GACHA_POOL.filter(i=>i.grade==='planet').length}종 · 은하 ${GACHA_POOL.filter(i=>i.grade==='galaxy').length}종 · 성운 ${GACHA_POOL.filter(i=>i.grade==='nebula').length}종`}
          single10Label={{ color: 'rgba(126,200,164,.85)', text: '행성 이상 보장' }}
        />
      )}

      {/* ── 확률 토글 ── */}
      <div style={{ padding: '8px 20px 0' }}>
        <button
          onClick={() => setShowProb(p => !p)}
          style={{
            background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {showProb ? '▲' : '▼'} 뽑기 확률 보기
        </button>
        {showProb && (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--line)',
            borderRadius: 'var(--r1)', padding: '14px 16px', marginTop: 8, animation: 'fadeUp .25s ease',
          }}>
            {probTable.map(row => (
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
            <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 8, lineHeight: 1.8 }}>
              ✦ 10연: {isSaju ? '천간' : '행성'} 이상 1개 보장<br />
              ✦ 합성: {gradeOrder.map(g => gradeConfig[g].label).join(' → ')}
            </div>
          </div>
        )}
      </div>

      {/* ── 미리보기 ── */}
      <ItemPreview
        key={`preview-${tab}`}
        pool={pool} gradeConfig={gradeConfig}
        gradeOrder={gradeOrder} probTable={probTable}
      />

      {/* ── 합성 안내 ── */}
      <SynthGuide gradeConfig={gradeConfig} gradeOrder={gradeOrder} setStep={setStep} />

      {/* ── 숍 교차 안내 ── */}
      <div style={{
        margin: '14px 20px 0', padding: '12px 14px',
        background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t2)', marginBottom: 2 }}>
            🛍️ 테마 · 아바타 · 이펙트 아이템도 있어요
          </div>
          <div style={{ fontSize: '11px', color: 'var(--t4)', lineHeight: 1.5 }}>
            별숨 숍에서 직접 구매하거나 랜덤 뽑기로 모아봐요
          </div>
        </div>
        <button
          onClick={() => setStep(31)}
          style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 20,
            background: 'none', border: '1px solid var(--line)',
            color: 'var(--t3)', fontSize: '11px', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          별숨 숍 →
        </button>
      </div>

      {/* 결과 오버레이 */}
      {results && (
        <ResultOverlay
          results={results}
          gradeConfig={gradeConfig}
          onClose={() => setResults(null)}
        />
      )}
    </div>
  );
}
