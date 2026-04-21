/**
 * ShopPage — 별숨 뽑기 + 숍 통합 허브 (step 31)
 * 탭: [기운 뽑기 | 테마 뽑기 | 아바타 뽑기 | 이펙트 뽑기 | 보관함]
 * - 기운 뽑기 : 우주/사주 기운 아이템 (from gachaItems.js)
 * - 테마/아바타/이펙트 뽑기 : 로컬 풀 (from shopGachaItems.js) + SVG
 * - 보관함 : 숍 아이템 + 직접 구매 특별 상담
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import { spendBP } from '../utils/gamificationLogic.js';
import {
  GACHA_POOL, GRADE_CONFIG, PROB_TABLE, pullOne, pull10, GRADE_ORDER,
  SAJU_POOL, SAJU_GRADE_CONFIG, SAJU_PROB_TABLE, pullOneSaju, pull10Saju, SAJU_GRADE_ORDER,
} from '../utils/gachaItems.js';
import {
  THEME_POOL, AVATAR_POOL, EFFECT_POOL,
  SHOP_GRADE_CONFIG, SHOP_PROB_TABLE, SHOP_GRADE_ORDER,
  ALL_SHOP_POOL, findShopItem,
  pullOneShop, pull10Shop,
} from '../utils/shopGachaItems.js';
import GachaGraphic from './GachaGraphic.jsx';
import ShopItemGraphic from './ShopItemGraphic.jsx';

// ─── 상수 ────────────────────────────────────────────────────
const SPIRIT_COST_1 = 10, SPIRIT_COST_10 = 90;
const SHOP_COST_1   = 20, SHOP_COST_10   = 180;
const DUPLICATE_REFUND = 5;

const MAIN_TABS = [
  { id: 'spirit', label: '기운 뽑기',   emoji: '🌌' },
  { id: 'theme',  label: '테마 뽑기',   emoji: '🎨' },
  { id: 'avatar', label: '아바타 뽑기', emoji: '👤' },
  { id: 'effect', label: '이펙트 뽑기', emoji: '✨' },
  { id: 'inv',    label: '보관함',      emoji: '🗃️' },
];

const CAT_DESC = {
  theme:           '앱 전체 색감과 분위기가 바뀌어요',
  avatar:          '내 프로필 아바타가 바뀌어요',
  effect:          '화면에 아름다운 이펙트가 표시돼요',
  special_reading: '특별한 AI 상담을 1회 사용할 수 있어요',
};
const RARITY_LABEL = { common: '일반', rare: '레어', legendary: '레전더리' };
const RARITY_COLOR = { common: 'var(--t4)', rare: '#B48EF0', legendary: '#E8B048' };

// ─── 반짝이 파티클 ────────────────────────────────────────────
function Sparkles({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {Array.from({length: 8}).map((_, i) => {
        const a = (i / 8) * 360;
        const d = 28 + (i % 3) * 10;
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 4, height: 4, borderRadius: '50%', background: color,
            '--sx': `${Math.cos(a*Math.PI/180)*d}px`,
            '--sy': `${Math.sin(a*Math.PI/180)*d}px`,
            animation: `gacha-sparkle ${0.5+Math.random()*0.4}s ease-out ${i*0.05}s forwards`,
            opacity: 0,
          }} />
        );
      })}
    </div>
  );
}

// ─── 통합 결과 오버레이 ───────────────────────────────────────
// results 항목은 gacha item(grade) 또는 shop item(rarity) 둘 다 OK
function PullResultOverlay({ results, system, onClose }) {
  const [revealed, setRevealed] = useState(new Set());
  const isSingle    = results.length === 1;
  const allRevealed = revealed.size === results.length;

  useEffect(() => {
    if (isSingle) {
      const t = setTimeout(() => setRevealed(new Set([0])), 350);
      return () => clearTimeout(t);
    }
  }, [isSingle]);

  // item에서 config(color,bg,border,label) 추출
  function getCfg(item) {
    if (item.grade)   return (system === 'saju' ? SAJU_GRADE_CONFIG : GRADE_CONFIG)[item.grade]   || {};
    if (item.rarity)  return SHOP_GRADE_CONFIG[item.rarity] || {};
    return {};
  }
  function isShopItem(item) { return !!item.rarity && !item.grade; }

  const topGrade = results.reduce((best, item) => {
    const cfg   = getCfg(item);
    const order = item.grade
      ? (system === 'saju' ? SAJU_GRADE_ORDER : GRADE_ORDER)
      : SHOP_GRADE_ORDER;
    const key   = item.grade || item.rarity;
    if (!best || order.indexOf(key) > order.indexOf(best)) return key;
    return best;
  }, null);
  const topCfg = topGrade
    ? (results[0].grade
        ? (system === 'saju' ? SAJU_GRADE_CONFIG : GRADE_CONFIG)[topGrade]
        : SHOP_GRADE_CONFIG[topGrade])
    : {};

  const bgGrad = topCfg?.bg
    ? `radial-gradient(ellipse at 50% 35%, ${topCfg.bg?.replace('0.15','0.28') || 'rgba(232,176,72,.28)'} 0%, rgba(13,11,20,.97) 65%)`
    : 'rgba(13,11,20,.96)';

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: bgGrad,
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
            background: 'none', color: 'rgba(255,255,255,.6)',
            fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}>닫기</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isSingle ? (() => {
          const item = results[0];
          const cfg  = getCfg(item);
          const rev  = revealed.has(0);
          const isShop = isShopItem(item);
          return (
            <div style={{
              width: 200, position: 'relative', borderRadius: 22,
              border: `2px solid ${rev ? cfg.border : 'rgba(255,255,255,.1)'}`,
              background: rev ? cfg.bg : 'rgba(255,255,255,.04)',
              padding: '32px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              animation: 'gacha-card-in .5s cubic-bezier(.34,1.56,.64,1) both',
              boxShadow: rev ? `0 0 32px ${cfg.border}` : 'none',
              transition: 'all .4s ease',
            }}>
              {rev ? (
                <>
                  <Sparkles color={cfg.color} />
                  <div style={{ animation: 'gacha-bounce .6s ease .2s both', marginTop: 8, marginBottom: 4 }}>
                    {isShop
                      ? <ShopItemGraphic item={item} size={90} />
                      : <GachaGraphic item={item} size={90} />
                    }
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, letterSpacing: '.06em' }}>
                    {item.grade
                      ? (system === 'saju' ? SAJU_GRADE_CONFIG : GRADE_CONFIG)[item.grade]?.label
                      : RARITY_LABEL[item.rarity]}
                  </div>
                  <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: item.affixColor || '#fff', textAlign: 'center' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 'var(--xs)', color: 'rgba(255,255,255,.55)', textAlign: 'center', lineHeight: 1.6 }}>
                    {item.description}
                  </div>
                  <div style={{
                    padding: '5px 12px', borderRadius: 20, background: cfg.bg,
                    border: `1px solid ${cfg.border}`, fontSize: '11px', color: cfg.color, fontWeight: 600, textAlign: 'center',
                  }}>
                    {item.effectLabel || item.effect}
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
        })() : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, width: '100%' }}>
            {results.map((item, i) => {
              const cfg    = getCfg(item);
              const rev    = revealed.has(i);
              const isShop = isShopItem(item);
              return (
                <div key={i}
                  onClick={() => !rev && setRevealed(prev => new Set([...prev, i]))}
                  style={{
                    position: 'relative', borderRadius: 12,
                    border: `1.5px solid ${rev ? cfg.border : 'var(--line)'}`,
                    background: rev ? cfg.bg : 'var(--bg2)',
                    padding: '10px 6px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    cursor: rev ? 'default' : 'pointer',
                    animation: `gacha-card-in .4s cubic-bezier(.34,1.56,.64,1) ${i * 0.06}s both`,
                    minHeight: 92, justifyContent: 'center',
                    transition: 'background .3s, border-color .3s',
                  }}
                >
                  {rev ? (
                    <>
                      <Sparkles color={cfg.color} />
                      <div style={{ animation: `gacha-bounce .5s ease ${i*0.06+0.15}s both` }}>
                        {isShop
                          ? <ShopItemGraphic item={item} size={34} />
                          : <GachaGraphic item={item} size={34} />
                        }
                      </div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: cfg.color, letterSpacing: '.04em' }}>
                        {item.grade
                          ? (system === 'saju' ? SAJU_GRADE_CONFIG : GRADE_CONFIG)[item.grade]?.label
                          : RARITY_LABEL[item.rarity]}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.25 }}>
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
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 16px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!allRevealed && !isSingle && (
          <button onClick={() => setRevealed(new Set(results.map((_, i) => i)))} style={{
            width: '100%', padding: '13px', background: 'var(--goldf)', border: '1.5px solid var(--acc)',
            borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
            fontSize: 'var(--sm)', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}>✦ 모두 공개</button>
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

// ─── 공용 뽑기 배너 ──────────────────────────────────────────
function PullBanner({ currentBP, pulling, onPull, cost1, cost10, title, subtitle, stats, accentColor, bgStyle, guarantee10Label }) {
  const canAfford1  = currentBP >= cost1;
  const canAfford10 = currentBP >= cost10;
  const seed = title.charCodeAt(0) % 8;
  return (
    <div style={{ margin: '0 20px', borderRadius: 'var(--r2)', ...bgStyle, padding: '20px 16px', position: 'relative', overflow: 'hidden' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${8+(i*14)%84}%`, left: `${5+(i*17)%90}%`,
          width: i%2===0 ? 3 : 2, height: i%2===0 ? 3 : 2,
          borderRadius: '50%', background: accentColor,
          opacity: 0.3+(i%3)*0.18,
          animation: `floatGently ${2.2+i%3}s ease infinite ${i*0.28}s`,
        }} />
      ))}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 'var(--xs)', color: accentColor, fontWeight: 700, letterSpacing: '.08em', marginBottom: 4, opacity: .9 }}>✦ {title}</div>
        <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: '#fff', marginBottom: 3 }}>{subtitle}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', marginBottom: 14, lineHeight: 1.6 }}>{stats}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onPull(1)} disabled={!!pulling || !canAfford1} style={{
            flex: 1, padding: '12px 6px', borderRadius: 'var(--r1)',
            background: canAfford1 ? `${accentColor}22` : 'rgba(255,255,255,.04)',
            border: `1.5px solid ${canAfford1 ? `${accentColor}80` : 'rgba(255,255,255,.08)'}`,
            color: canAfford1 ? accentColor : 'rgba(255,255,255,.25)',
            fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
            cursor: canAfford1 && !pulling ? 'pointer' : 'not-allowed', transition: 'all .2s',
          }}>
            {pulling === 'single' ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, border: `2px solid ${accentColor}40`, borderTopColor: accentColor, borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block' }} />
                뽑는 중...
              </span>
            ) : <>✦ 1회 뽑기<br /><span style={{ fontSize: '11px', fontWeight: 400 }}>{cost1} BP</span></>}
          </button>
          <button onClick={() => onPull(10)} disabled={!!pulling || !canAfford10} style={{
            flex: 1.4, padding: '12px 6px', borderRadius: 'var(--r1)',
            background: canAfford10 ? `${accentColor}30` : 'rgba(255,255,255,.04)',
            border: `1.5px solid ${canAfford10 ? `${accentColor}70` : 'rgba(255,255,255,.08)'}`,
            color: canAfford10 ? accentColor : 'rgba(255,255,255,.25)',
            fontWeight: 700, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
            cursor: canAfford10 && !pulling ? 'pointer' : 'not-allowed', transition: 'all .2s',
            position: 'relative', overflow: 'hidden',
          }}>
            {pulling === '10' ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, border: `2px solid ${accentColor}40`, borderTopColor: accentColor, borderRadius: '50%', animation: 'orbSpin .7s linear infinite', display: 'inline-block' }} />
                뽑는 중...
              </span>
            ) : (
              <>
                <span style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent)', animation: canAfford10 ? 'gacha-shine 2.5s ease infinite' : 'none' }} />
                ✦ 10연 뽑기<br />
                <span style={{ fontSize: '11px' }}>{cost10} BP</span>
                <span style={{ display: 'block', fontSize: '10px', color: guarantee10Label.color, marginTop: 2 }}>{guarantee10Label.text}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 확률표 토글 ──────────────────────────────────────────────
function ProbTable({ probTable }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: '8px 20px 0' }}>
      <button onClick={() => setOpen(p => !p)} style={{
        background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)',
        fontFamily: 'var(--ff)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {open ? '▲' : '▼'} 뽑기 확률 보기
      </button>
      {open && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '12px 14px', marginTop: 8, animation: 'fadeUp .25s ease' }}>
          {probTable.map(row => (
            <div key={row.grade || row.rarity} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color }} />
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>{row.label}</span>
              </div>
              <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: row.color }}>{row.prob}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 숍 아이템 미리보기 그리드 ───────────────────────────────
function ShopItemPreviewGrid({ pool, gradeConfig, gradeOrder }) {
  const [activeRarity, setActiveRarity] = useState(gradeOrder[0]);
  const cfg = gradeConfig[activeRarity];
  const filtered = pool.filter(i => i.rarity === activeRarity);

  return (
    <div style={{ padding: '14px 20px 0' }}>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 10 }}>
        ✦ 등장 아이템 미리보기
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {gradeOrder.map(r => {
          const c = gradeConfig[r];
          return (
            <button key={r} onClick={() => setActiveRarity(r)} style={{
              padding: '5px 11px', borderRadius: 20, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
              border: `1px solid ${activeRarity === r ? c.border : 'var(--line)'}`,
              background: activeRarity === r ? c.bg : 'none',
              color: activeRarity === r ? c.color : 'var(--t3)',
              fontWeight: activeRarity === r ? 700 : 400, cursor: 'pointer', transition: 'all .15s',
            }}>
              {c.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {filtered.map(item => (
          <div key={item.id} style={{
            background: 'var(--bg2)', border: `1px solid ${cfg.border}`,
            borderRadius: 12, padding: '14px 8px', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <ShopItemGraphic item={item} size={48} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--t1)', fontWeight: 600, lineHeight: 1.3, marginBottom: 3, wordBreak: 'keep-all' }}>
              {item.name}
            </div>
            <div style={{ fontSize: '10px', color: cfg.color, lineHeight: 1.4, wordBreak: 'keep-all' }}>
              {item.effect}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 기운 아이템 미리보기 (우주/사주) ────────────────────────
function SpiritItemPreview({ pool, gradeConfig, gradeOrder }) {
  const [activeGrade, setActiveGrade] = useState(gradeOrder[0]);
  const cfg = gradeConfig[activeGrade];
  const seen = new Set();
  const bodies = pool.filter(i => i.grade === activeGrade).filter(i => {
    if (seen.has(i.bodyId)) return false;
    seen.add(i.bodyId); return true;
  });

  return (
    <div style={{ padding: '14px 20px 0' }}>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 10 }}>
        ✦ 등장 아이템 미리보기
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {gradeOrder.map(grade => {
          const c = gradeConfig[grade];
          return (
            <button key={grade} onClick={() => setActiveGrade(grade)} style={{
              padding: '5px 11px', borderRadius: 20, fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
              border: `1px solid ${activeGrade === grade ? c.border : 'var(--line)'}`,
              background: activeGrade === grade ? c.bg : 'none',
              color: activeGrade === grade ? c.color : 'var(--t3)',
              fontWeight: activeGrade === grade ? 700 : 400, cursor: 'pointer', transition: 'all .15s',
            }}>
              {c.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {bodies.map(item => (
          <div key={item.bodyId} style={{
            background: 'var(--bg2)', border: `1px solid ${cfg.border}`,
            borderRadius: 12, padding: '14px 8px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 5 }}>{item.emoji}</div>
            <div style={{ fontSize: '11px', color: 'var(--t1)', fontWeight: 600, lineHeight: 1.3, marginBottom: 3, wordBreak: 'keep-all' }}>
              {item.bodyName}
            </div>
            <div style={{ fontSize: '10px', color: cfg.color, wordBreak: 'keep-all' }}>{item.effectLabel}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 보관함 아이템 카드 ───────────────────────────────────────
function InvCard({ item, isEquipped, onEquip, onUse }) {
  const canEquip  = ['theme','avatar','effect'].includes(item.category);
  const isSpecial = item.category === 'special_reading';
  const rarityColor = RARITY_COLOR[item.rarity] || 'var(--t4)';
  const rarityLabel = RARITY_LABEL[item.rarity];

  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${isEquipped ? 'var(--acc)' : 'var(--line)'}`,
      borderRadius: 'var(--r2)',
      padding: '16px 14px',
      display: 'flex', flexDirection: 'column', gap: 7,
      position: 'relative',
      boxShadow: isEquipped ? '0 0 10px rgba(232,176,72,0.2)' : 'none',
    }}>
      {item.rarity && item.rarity !== 'common' && (
        <div style={{ position: 'absolute', top: 8, right: 10, fontSize: '10px', fontWeight: 700, color: rarityColor }}>
          {rarityLabel}
        </div>
      )}

      {/* graphic */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {(item.category === 'theme' || item.category === 'avatar' || item.category === 'effect')
          ? <ShopItemGraphic item={item} size={52} />
          : <div style={{ fontSize: 32, lineHeight: 1 }}>{item.emoji}</div>
        }
      </div>

      <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)', textAlign: 'center' }}>{item.name}</div>
      <div style={{ fontSize: '10px', color: 'var(--t4)', lineHeight: 1.5, textAlign: 'center' }}>{item.description || CAT_DESC[item.category]}</div>

      {canEquip && (
        <button onClick={onEquip} style={{
          padding: '8px', textAlign: 'center', fontSize: 'var(--xs)', width: '100%',
          color: 'var(--gold)', fontWeight: 700, cursor: 'pointer',
          border: '1px solid var(--acc)', borderRadius: 'var(--r1)',
          background: isEquipped ? 'rgba(232,176,72,0.2)' : 'var(--goldf)',
          fontFamily: 'var(--ff)',
          boxShadow: isEquipped ? '0 0 8px rgba(232,176,72,0.35)' : 'none',
          transition: 'all .2s',
        }}>
          {isEquipped ? '✦ 장착 중 (해제)' : '장착하기'}
        </button>
      )}
      {isSpecial && (
        <button onClick={onUse} style={{
          padding: '8px', textAlign: 'center', fontSize: 'var(--xs)', width: '100%',
          color: 'var(--gold)', fontWeight: 700, cursor: 'pointer',
          border: '1px solid var(--acc)', borderRadius: 'var(--r1)',
          background: 'var(--goldf)', fontFamily: 'var(--ff)',
        }}>
          ✦ 지금 사용하기 →
        </button>
      )}
    </div>
  );
}

// ─── 구매 확인 모달 (특별 상담용) ────────────────────────────
function BuyModal({ item, currentBP, onConfirm, onClose, buying }) {
  const canAfford = currentBP >= (item.bp_cost || 0);
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ width: '100%', maxWidth: 360, background: 'var(--bg1)', borderRadius: 'var(--r2)', padding: '28px 24px', border: '1px solid var(--line)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{item.emoji}</div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>{item.name}</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 12 }}>{item.description}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--goldf)', borderRadius: 20, border: '1px solid var(--acc)' }}>
            <span style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--gold)' }}>{item.bp_cost} BP</span>
          </div>
        </div>
        <div style={{ padding: '12px', background: 'var(--bg2)', borderRadius: 'var(--r1)', marginBottom: 16, textAlign: 'center', fontSize: 'var(--xs)', color: canAfford ? 'var(--t3)' : 'var(--rose)' }}>
          현재 보유 BP: <strong style={{ color: canAfford ? 'var(--t1)' : 'var(--rose)' }}>{currentBP} BP</strong>
          {!canAfford && <div style={{ marginTop: 4, color: 'var(--rose)' }}>BP가 {item.bp_cost - currentBP} 부족해요</div>}
        </div>
        <button onClick={onConfirm} disabled={!canAfford || buying} style={{
          width: '100%', padding: '13px', background: canAfford ? 'var(--goldf)' : 'var(--bg3)',
          border: `1.5px solid ${canAfford ? 'var(--acc)' : 'var(--line)'}`, borderRadius: 'var(--r1)',
          color: canAfford ? 'var(--gold)' : 'var(--t4)', fontWeight: 700, fontSize: 'var(--sm)',
          fontFamily: 'var(--ff)', cursor: canAfford ? 'pointer' : 'not-allowed', marginBottom: 8,
        }}>
          {buying ? '구매 중...' : canAfford ? `✦ 구매하기 (${item.bp_cost} BP)` : 'BM 부족'}
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
          취소
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────
export default function ShopPage({ showToast }) {
  const user    = useAppStore(s => s.user);
  const setStep = useAppStore(s => s.setStep);
  const equippedSajuItem = useAppStore(s => s.equippedSajuItem);

  const [activeTab,   setActiveTab]   = useState('spirit');
  const [spiritTab,   setSpiritTab]   = useState('space'); // 'space'|'saju'
  const [currentBP,   setCurrentBP]   = useState(0);
  const [loadingBP,   setLoadingBP]   = useState(false);
  const [pulling,     setPulling]     = useState(false);  // 'single'|'10'|false
  const [results,     setResults]     = useState(null);   // pulled items
  const [resultSys,   setResultSys]   = useState('space');

  // 숍 아이템 (DB — special_reading only now; theme/avatar/effect via local pool)
  const [dbItems,       setDbItems]       = useState([]);
  const [ownedIds,      setOwnedIds]      = useState(new Set());
  const [equippedIds,   setEquippedIds]   = useState({ theme: null, avatar: null, effect: null });
  const [confirmItem,   setConfirmItem]   = useState(null);
  const [buying,        setBuying]        = useState(false);
  const [invFilter,     setInvFilter]     = useState('all');

  const kakaoId = user?.kakaoId || user?.id;

  // ── BP + 보유 아이템 로드 ────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!kakaoId) return;
    setLoadingBP(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const [bpRes, invRes, dbItemsRes] = await Promise.all([
        client.from('users').select('current_bp').eq('kakao_id', String(kakaoId)).single(),
        client.from('user_shop_inventory').select('item_id, is_equipped').eq('kakao_id', String(kakaoId)),
        client.from('shop_items').select('*').eq('is_active', true),
      ]);
      setCurrentBP(bpRes.data?.current_bp ?? 0);
      const inv = invRes.data || [];
      setOwnedIds(new Set(inv.map(r => String(r.item_id))));
      setDbItems((dbItemsRes.data || []).filter(i => i.category === 'special_reading'));

      const equippedMap = { theme: null, avatar: null, effect: null };
      const equippedRaw = inv.filter(r => r.is_equipped).map(r => String(r.item_id));
      for (const eid of equippedRaw) {
        // check local pool first
        const localItem = findShopItem(eid);
        if (localItem && equippedMap[localItem.category] === null) {
          equippedMap[localItem.category] = eid;
        }
      }
      setEquippedIds(equippedMap);
      const store = useAppStore.getState();
      const equippedThemeItem  = findShopItem(equippedMap.theme  || '') || null;
      const equippedAvatarItem = findShopItem(equippedMap.avatar || '') || null;
      store.setEquippedTheme?.(equippedThemeItem);
      store.setEquippedAvatar?.(equippedAvatarItem);
    } catch { /* silent */ }
    finally { setLoadingBP(false); }
  }, [kakaoId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setResults(null); }, [activeTab, spiritTab]);

  // ── 기운 뽑기 ────────────────────────────────────────────────
  async function doPullSpirit(count) {
    if (!kakaoId) { showToast?.('로그인 후 이용 가능해요', 'info'); return; }
    const cost = count === 1 ? SPIRIT_COST_1 : SPIRIT_COST_10;
    if (currentBP < cost) { showToast?.(`BP가 부족해요 (필요: ${cost} BP)`, 'error'); return; }
    setPulling(count === 1 ? 'single' : '10');
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok, newBP } = await spendBP(client, kakaoId, cost, `GACHA_SPIRIT_${spiritTab}_${count}_${Date.now()}`, `${spiritTab === 'saju' ? '사주' : '우주'} 기운 ${count}회`);
      if (!ok) { showToast?.('BP가 부족해요', 'error'); return; }
      const pulled = spiritTab === 'saju'
        ? (count === 1 ? [pullOneSaju()] : pull10Saju())
        : (count === 1 ? [pullOne()]     : pull10());
      await client.from('user_shop_inventory').insert(
        pulled.map(item => ({ kakao_id: String(kakaoId), item_id: item.id, is_equipped: false, unlocked_at: new Date().toISOString() }))
      );
      setCurrentBP(newBP ?? currentBP - cost);
      setResultSys(spiritTab);
      setResults(pulled);
    } catch { showToast?.('뽑기 중 오류가 발생했어요', 'error'); }
    finally { setPulling(false); }
  }

  // ── 숍 뽑기 (테마/아바타/이펙트) ────────────────────────────
  async function doPullShop(category, count) {
    if (!kakaoId) { showToast?.('로그인 후 이용 가능해요', 'info'); return; }
    const cost = count === 1 ? SHOP_COST_1 : SHOP_COST_10;
    if (currentBP < cost) { showToast?.(`BP가 부족해요 (필요: ${cost} BP)`, 'error'); return; }
    const poolMap = { theme: THEME_POOL, avatar: AVATAR_POOL, effect: EFFECT_POOL };
    const pool = poolMap[category] || [];
    if (!pool.length) return;

    setPulling(count === 1 ? 'single' : '10');
    const ownedSnap = new Set(ownedIds);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok, newBP } = await spendBP(client, kakaoId, cost, `GACHA_SHOP_${category}_${count}_${Date.now()}`, `${category} 뽑기 ${count}회`);
      if (!ok) { showToast?.('BP가 부족해요', 'error'); return; }

      const pulled = count === 1 ? [pullOneShop(pool)] : pull10Shop(pool);

      // 중복 처리
      let refund = 0;
      const toInsert = [];
      const newThisPull = new Set();
      for (const item of pulled) {
        if (ownedSnap.has(item.id) || newThisPull.has(item.id)) {
          refund += DUPLICATE_REFUND;
        } else {
          toInsert.push(item);
          newThisPull.add(item.id);
        }
      }
      if (toInsert.length > 0) {
        await client.from('user_shop_inventory').insert(
          toInsert.map(item => ({ kakao_id: String(kakaoId), item_id: item.id, is_equipped: false }))
        );
        setOwnedIds(prev => new Set([...prev, ...toInsert.map(i => i.id)]));
      }
      let finalBP = newBP ?? currentBP - cost;
      if (refund > 0) {
        const { data: fresh } = await client.from('users').select('current_bp').eq('kakao_id', String(kakaoId)).single();
        const freshBP = fresh?.current_bp ?? finalBP;
        await client.from('users').update({ current_bp: freshBP + refund }).eq('kakao_id', String(kakaoId));
        finalBP = freshBP + refund;
      }
      setCurrentBP(finalBP);
      setResultSys('shop');
      setResults(pulled);
    } catch { showToast?.('뽑기 중 오류가 발생했어요', 'error'); }
    finally { setPulling(false); }
  }

  // ── 장착/해제 ────────────────────────────────────────────────
  async function handleEquip(item) {
    if (!kakaoId) return;
    const cat  = item.category;
    const isEquipping = equippedIds[cat] !== item.id;
    try {
      const client = getAuthenticatedClient(kakaoId);
      const allCatIds = [...THEME_POOL, ...AVATAR_POOL, ...EFFECT_POOL].filter(i => i.category === cat).map(i => i.id);
      if (isEquipping) {
        if (allCatIds.length > 1) {
          await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId)).in('item_id', allCatIds.filter(id => id !== item.id));
        }
        await client.from('user_shop_inventory').update({ is_equipped: true }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
        setEquippedIds(prev => ({ ...prev, [cat]: item.id }));
        if (cat === 'theme')  useAppStore.getState().setEquippedTheme(item);
        if (cat === 'avatar') useAppStore.getState().setEquippedAvatar(item);
        showToast?.(`${item.name} 장착 완료! ✦`, 'success');
      } else {
        await client.from('user_shop_inventory').update({ is_equipped: false }).eq('kakao_id', String(kakaoId)).eq('item_id', item.id);
        setEquippedIds(prev => ({ ...prev, [cat]: null }));
        if (cat === 'theme')  useAppStore.getState().setEquippedTheme(null);
        if (cat === 'avatar') useAppStore.getState().setEquippedAvatar(null);
        showToast?.(`${item.name} 해제했어요.`, 'success');
      }
    } catch { showToast?.('장착 상태 변경에 실패했어요.', 'error'); }
  }

  // ── 특별 상담 구매 ────────────────────────────────────────────
  async function handleBuySpecial(item) {
    if (!kakaoId) { showToast?.('로그인 후 구매할 수 있어요', 'info'); return; }
    setBuying(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok, newBP } = await spendBP(client, kakaoId, item.bp_cost, 'SHOP_BUY', item.name);
      if (!ok) { showToast?.('BP가 부족해요', 'error'); setBuying(false); return; }
      await client.from('user_shop_inventory').insert({ kakao_id: String(kakaoId), item_id: item.id, is_equipped: false });
      setCurrentBP(newBP ?? currentBP - item.bp_cost);
      setOwnedIds(prev => new Set([...prev, String(item.id)]));
      setConfirmItem(null);
      showToast?.(`${item.name} 구매 완료! ✦`, 'success');
      setTimeout(() => setStep(33), 800);
    } catch { showToast?.('구매에 실패했어요.', 'error'); }
    finally { setBuying(false); }
  }

  // ── 보관함 아이템 목록 ────────────────────────────────────────
  const localOwnedItems = ALL_SHOP_POOL.filter(i => ownedIds.has(i.id));
  const dbOwnedItems    = dbItems.filter(i => ownedIds.has(String(i.id)));
  const allOwnedItems   = [...localOwnedItems, ...dbOwnedItems];
  const invItems = invFilter === 'all' ? allOwnedItems : allOwnedItems.filter(i => i.category === invFilter);

  // ─── 렌더 ────────────────────────────────────────────────────
  return (
    <div className="page step-fade" style={{ paddingBottom: 52 }}>

      {/* 헤더 */}
      <div style={{ padding: '22px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 3 }}>✦ 별숨 숍</div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.25 }}>뽑기 · 꾸미기 · 보관함</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--goldf)', borderRadius: 20, border: '1px solid var(--acc)', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--gold)' }}>✦</span>
          <span style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--gold)' }}>
            {loadingBP ? '...' : currentBP} BP
          </span>
        </div>
      </div>

      {/* 장착 기운 상태 */}
      {equippedSajuItem && (
        <div style={{ margin: '0 20px 12px', padding: '9px 12px', background: 'rgba(232,176,72,0.06)', border: '1px solid rgba(232,176,72,0.25)', borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1rem' }}>{equippedSajuItem.emoji}</span>
          <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', flex: 1 }}>
            <strong style={{ color: 'var(--gold)' }}>{equippedSajuItem.name}</strong> 기운이 AI 답변에 반영 중
          </span>
          <button onClick={() => setStep(38)} style={{ fontSize: '10px', color: 'var(--t4)', background: 'none', border: '1px solid var(--line)', borderRadius: 16, padding: '3px 8px', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
            변경
          </button>
        </div>
      )}

      {/* 메인 탭 */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 20px 14px', borderBottom: '1px solid var(--line)' }}>
        {MAIN_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flexShrink: 0, padding: '8px 12px', borderRadius: 20,
            border: `1px solid ${activeTab === tab.id ? 'var(--acc)' : 'transparent'}`,
            background: activeTab === tab.id ? 'var(--goldf)' : 'none',
            color: activeTab === tab.id ? 'var(--gold)' : 'var(--t3)',
            fontSize: 'var(--xs)', fontWeight: activeTab === tab.id ? 700 : 400,
            cursor: 'pointer', fontFamily: 'var(--ff)', whiteSpace: 'nowrap',
            transition: 'all .15s',
          }}>
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* ── 기운 뽑기 탭 ──────────────────────────────────────── */}
      {activeTab === 'spirit' && (
        <>
          {/* 우주/사주 서브탭 */}
          <div style={{ display: 'flex', margin: '14px 20px 0', background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 4, border: '1px solid var(--line)' }}>
            {[{k:'space', label:'🌌 우주 기운'}, {k:'saju', label:'☯️ 사주 기운'}].map(t => (
              <button key={t.k} onClick={() => setSpiritTab(t.k)} style={{
                flex: 1, padding: '9px', borderRadius: 8, border: 'none',
                background: spiritTab === t.k ? 'var(--goldf)' : 'none',
                color: spiritTab === t.k ? 'var(--gold)' : 'var(--t3)',
                fontWeight: spiritTab === t.k ? 700 : 400,
                fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
                outline: spiritTab === t.k ? '1px solid var(--acc)' : 'none',
                transition: 'all .18s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* 설명 */}
          <div style={{ margin: '12px 20px 0', padding: '10px 12px', background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
            ✦ 기운 아이템을 뽑아 <strong style={{ color: 'var(--gold)' }}>메인 기운</strong>으로 장착하면 모든 AI 답변에 반영돼요
          </div>

          {spiritTab === 'space' ? (
            <>
              <PullBanner
                currentBP={currentBP} pulling={pulling} onPull={doPullSpirit}
                cost1={SPIRIT_COST_1} cost10={SPIRIT_COST_10}
                title="우주 수집 가챠"
                subtitle={`${GACHA_POOL.length}종 천체 기운 아이템`}
                stats={`위성 ${GACHA_POOL.filter(i=>i.grade==='satellite').length}종 · 행성 ${GACHA_POOL.filter(i=>i.grade==='planet').length}종 · 은하 ${GACHA_POOL.filter(i=>i.grade==='galaxy').length}종 · 성운 ${GACHA_POOL.filter(i=>i.grade==='nebula').length}종`}
                accentColor="rgba(180,142,240,0.9)"
                bgStyle={{ background: 'linear-gradient(135deg, #0d0830 0%, #0d0b20 55%, #150a2e 100%)', border: '1px solid rgba(180,142,240,.3)' }}
                guarantee10Label={{ color: 'rgba(126,200,164,.85)', text: '행성 이상 1개 보장' }}
              />
              <ProbTable probTable={PROB_TABLE} />
              <SpiritItemPreview pool={GACHA_POOL} gradeConfig={GRADE_CONFIG} gradeOrder={GRADE_ORDER} />
            </>
          ) : (
            <>
              <PullBanner
                currentBP={currentBP} pulling={pulling} onPull={doPullSpirit}
                cost1={SPIRIT_COST_1} cost10={SPIRIT_COST_10}
                title="사주명리 가챠"
                subtitle={`${SAJU_POOL.length}종 사주 기운 아이템`}
                stats={`오행 ${SAJU_POOL.filter(i=>i.grade==='ohaeng').length}종 · 천간 ${SAJU_POOL.filter(i=>i.grade==='cheongan').length}종 · 지지 ${SAJU_POOL.filter(i=>i.grade==='jiji').length}종 · 육십갑자 ${SAJU_POOL.filter(i=>i.grade==='gapja').length}종`}
                accentColor="rgba(212,165,106,0.9)"
                bgStyle={{ background: 'linear-gradient(135deg, #1a0c10 0%, #100a0a 55%, #1a100a 100%)', border: '1px solid rgba(212,165,106,.3)' }}
                guarantee10Label={{ color: 'rgba(123,164,212,.85)', text: '천간 이상 1개 보장' }}
              />
              <ProbTable probTable={SAJU_PROB_TABLE} />
              <SpiritItemPreview pool={SAJU_POOL} gradeConfig={SAJU_GRADE_CONFIG} gradeOrder={SAJU_GRADE_ORDER} />
            </>
          )}

          {/* 기운 보관함·합성 링크 */}
          <div style={{ margin: '16px 20px 0', padding: '12px 14px', background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.5 }}>
              뽑은 기운 아이템 확인 · 합성 · 장착
            </div>
            <button onClick={() => setStep(38)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, background: 'var(--goldf)', border: '1px solid var(--acc)', color: 'var(--gold)', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--ff)', cursor: 'pointer' }}>
              내 기운 보관함 →
            </button>
          </div>
        </>
      )}

      {/* ── 테마/아바타/이펙트 뽑기 탭 ──────────────────────── */}
      {(activeTab === 'theme' || activeTab === 'avatar' || activeTab === 'effect') && (() => {
        const poolMap  = { theme: THEME_POOL, avatar: AVATAR_POOL, effect: EFFECT_POOL };
        const nameMap  = { theme: '테마', avatar: '아바타', effect: '이펙트' };
        const emojiMap = { theme: '🎨', avatar: '👤', effect: '✨' };
        const pool     = poolMap[activeTab];
        const label    = nameMap[activeTab];
        const accentMap = { theme: 'rgba(232,176,72,0.9)', avatar: 'rgba(180,142,240,0.9)', effect: 'rgba(126,200,164,0.9)' };
        const bgMap = {
          theme:  { background: 'linear-gradient(135deg, #1a1205 0%, #130e04 55%, #1a1205 100%)', border: '1px solid rgba(232,176,72,.3)' },
          avatar: { background: 'linear-gradient(135deg, #0e0b1e 0%, #14112c 55%, #0e0b1e 100%)', border: '1px solid rgba(180,142,240,.3)' },
          effect: { background: 'linear-gradient(135deg, #051410 0%, #081a10 55%, #051410 100%)', border: '1px solid rgba(126,200,164,.3)' },
        };
        const accent = accentMap[activeTab];
        const equippedId = equippedIds[activeTab];
        const equippedItem = equippedId ? findShopItem(equippedId) : null;

        return (
          <>
            {/* 장착 현황 */}
            {equippedItem ? (
              <div style={{ margin: '14px 20px 0', padding: '10px 12px', background: 'rgba(232,176,72,0.06)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShopItemGraphic item={equippedItem} size={32} />
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)', flex: 1 }}>
                  <strong style={{ color: 'var(--gold)' }}>{equippedItem.name}</strong> 장착 중
                </span>
              </div>
            ) : (
              <div style={{ margin: '14px 20px 0', padding: '10px 12px', background: 'var(--bg2)', border: '1px dashed var(--line)', borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: 'var(--t4)', textAlign: 'center' }}>
                {label} 아이템을 뽑아서 장착해봐요 ✦
              </div>
            )}

            <PullBanner
              currentBP={currentBP} pulling={pulling}
              onPull={(count) => doPullShop(activeTab, count)}
              cost1={SHOP_COST_1} cost10={SHOP_COST_10}
              title={`${label} 뽑기`}
              subtitle={`${pool.length}종 ${label} 아이템`}
              stats={`일반 60% · 레어 35% · 레전더리 5% · 중복 시 ${DUPLICATE_REFUND}BM 환불`}
              accentColor={accent}
              bgStyle={bgMap[activeTab]}
              guarantee10Label={{ color: 'rgba(232,176,72,.8)', text: '레어 이상 1개 보장' }}
            />
            <ProbTable probTable={SHOP_PROB_TABLE} />
            <ShopItemPreviewGrid pool={pool} gradeConfig={SHOP_GRADE_CONFIG} gradeOrder={SHOP_GRADE_ORDER} />
          </>
        );
      })()}

      {/* ── 보관함 탭 ─────────────────────────────────────────── */}
      {activeTab === 'inv' && (
        <>
          <div style={{ display: 'flex', gap: 6, padding: '14px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[{id:'all',label:'전체'},{id:'theme',label:'테마'},{id:'avatar',label:'아바타'},{id:'effect',label:'이펙트'},{id:'special_reading',label:'특별 상담'}].map(f => (
              <button key={f.id} onClick={() => setInvFilter(f.id)} style={{
                flexShrink: 0, padding: '6px 13px', borderRadius: 20,
                border: `1px solid ${invFilter === f.id ? 'var(--acc)' : 'var(--line)'}`,
                background: invFilter === f.id ? 'var(--goldf)' : 'none',
                color: invFilter === f.id ? 'var(--gold)' : 'var(--t3)',
                fontSize: 'var(--xs)', fontWeight: invFilter === f.id ? 700 : 400,
                cursor: 'pointer', fontFamily: 'var(--ff)',
              }}>{f.label}</button>
            ))}
          </div>

          {/* 특별 상담 구매 섹션 */}
          {(invFilter === 'all' || invFilter === 'special_reading') && dbItems.filter(i => !ownedIds.has(String(i.id))).length > 0 && (
            <div style={{ margin: '14px 20px 0' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 8, fontWeight: 600 }}>✦ 특별 상담 구매</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {dbItems.filter(i => !ownedIds.has(String(i.id))).map(item => (
                  <div key={item.id} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
                    <div style={{ fontSize: 28 }}>{item.emoji}</div>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)', textAlign: 'center' }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--t4)', textAlign: 'center', lineHeight: 1.5 }}>{item.description}</div>
                    <button onClick={() => setConfirmItem(item)} style={{
                      padding: '8px', width: '100%', background: 'var(--goldf)', border: '1.5px solid var(--acc)',
                      borderRadius: 'var(--r1)', color: 'var(--gold)', fontWeight: 700,
                      fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
                    }}>{item.bp_cost} BP</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 보유 아이템 그리드 */}
          <div style={{ padding: '14px 20px 0' }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 8, fontWeight: 600 }}>보유 아이템 ({invItems.length})</div>
            {invItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t4)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🗃️</div>
                <div style={{ fontSize: 'var(--sm)' }}>아직 수집한 아이템이 없어요</div>
                <div style={{ fontSize: 'var(--xs)', marginTop: 6 }}>뽑기로 아이템을 모아봐요</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {invItems.map(item => (
                  <InvCard
                    key={item.id}
                    item={item}
                    isEquipped={equippedIds[item.category] === item.id}
                    onEquip={() => handleEquip(item)}
                    onUse={() => setStep(33)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 기운 아이템 링크 */}
          <div style={{ margin: '16px 20px 0', padding: '12px 14px', background: 'var(--bg2)', borderRadius: 'var(--r1)', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.5 }}>
              기운 아이템(우주·사주) 확인 및 합성
            </div>
            <button onClick={() => setStep(38)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, background: 'none', border: '1px solid var(--line)', color: 'var(--t3)', fontSize: '11px', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
              기운 보관함 →
            </button>
          </div>
        </>
      )}

      {/* BP 획득 안내 */}
      <div style={{ margin: '20px 20px 0', padding: '12px 14px', background: 'var(--bg2)', borderRadius: 'var(--r1)', fontSize: '11px', color: 'var(--t4)', lineHeight: 1.7 }}>
        <div style={{ fontWeight: 700, color: 'var(--t3)', marginBottom: 5 }}>✦ BP 획득 방법</div>
        일일 출석 +5 · 미션 완료 +10 · 일기 작성 +5 · 앱 설치 +20 · 친구 공유 +3
      </div>

      {/* 결과 오버레이 */}
      {results && (
        <PullResultOverlay
          results={results}
          system={resultSys}
          onClose={() => { setResults(null); loadData(); }}
        />
      )}

      {/* 특별 상담 구매 확인 모달 */}
      {confirmItem && (
        <BuyModal
          item={confirmItem}
          currentBP={currentBP}
          onConfirm={() => handleBuySpecial(confirmItem)}
          onClose={() => setConfirmItem(null)}
          buying={buying}
        />
      )}
    </div>
  );
}
