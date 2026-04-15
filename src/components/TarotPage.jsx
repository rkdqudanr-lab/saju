/**
 * TarotPage — 별숨 타로
 * 22장 대아르카나에서 3장을 뽑아 사주·별자리 맥락으로 AI 해석
 * step 34
 */

import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore.js';

const MAJOR_ARCANA = [
  { id: 0,  name: '광대',    emoji: '🌀', meaning: '새 시작, 순수한 모험심', detail: '두려움 없이 새로운 길로 나서는 자유로운 영혼이에요.' },
  { id: 1,  name: '마법사',  emoji: '🔮', meaning: '집중력, 창조적 의지', detail: '손에 쥔 도구를 활용해 원하는 것을 현실로 만들 수 있어요.' },
  { id: 2,  name: '여사제',  emoji: '📖', meaning: '직관, 신비, 내면의 지혜', detail: '말하지 않아도 이미 알고 있어요. 내면의 소리를 믿어봐요.' },
  { id: 3,  name: '여황제',  emoji: '🌸', meaning: '풍요, 창조성, 모성', detail: '씨앗을 뿌리면 반드시 꽃이 피는 때예요. 풍요가 흘러들어요.' },
  { id: 4,  name: '황제',    emoji: '👑', meaning: '질서, 안정, 리더십', detail: '체계를 세우고 단단하게 지키는 힘이 필요한 시기예요.' },
  { id: 5,  name: '교황',    emoji: '⛪', meaning: '전통, 지혜, 조언', detail: '신뢰할 수 있는 스승이나 전통적인 방법에서 답을 찾아봐요.' },
  { id: 6,  name: '연인',    emoji: '💞', meaning: '선택, 사랑, 조화', detail: '마음 깊은 곳의 끌림을 따라 선택하는 순간이에요.' },
  { id: 7,  name: '전차',    emoji: '⚔️', meaning: '의지, 승리, 통제', detail: '앞으로만 나아가요. 집중과 결단이 승리를 만들어요.' },
  { id: 8,  name: '힘',      emoji: '🦁', meaning: '내면의 힘, 인내, 용기', detail: '거칠고 강한 것도 부드러운 사랑으로 다스릴 수 있어요.' },
  { id: 9,  name: '은둔자',  emoji: '🕯️', meaning: '성찰, 고독, 내면 탐색', detail: '혼자만의 시간이 빛이 되는 때예요. 깊이 들여다봐요.' },
  { id: 10, name: '운명의 바퀴', emoji: '🎡', meaning: '변화, 전환점, 운명', detail: '삶이 새로운 국면으로 접어들고 있어요. 흐름을 타봐요.' },
  { id: 11, name: '정의',    emoji: '⚖️', meaning: '균형, 공정, 원인과 결과', detail: '진실된 행동이 공정한 결과로 돌아오는 시기예요.' },
  { id: 12, name: '매달린 자', emoji: '🙃', meaning: '희생, 기다림, 새 시각', detail: '잠시 멈추고 다른 관점으로 바라보는 지혜가 필요해요.' },
  { id: 13, name: '죽음',    emoji: '🌑', meaning: '변환, 끝과 새 시작', detail: '두려운 끝이 아니에요. 낡은 것이 떠나고 새것이 들어와요.' },
  { id: 14, name: '절제',    emoji: '🌊', meaning: '균형, 조화, 인내', detail: '서두르지 않아도 돼요. 조화롭게 섞이면 완성돼요.' },
  { id: 15, name: '악마',    emoji: '🔗', meaning: '집착, 속박, 욕망', detail: '스스로 만든 사슬임을 알아채는 순간 자유로워져요.' },
  { id: 16, name: '탑',      emoji: '⚡', meaning: '갑작스런 변화, 해방', detail: '흔들리는 것은 처음부터 불안정했기 때문이에요. 재건할 기회예요.' },
  { id: 17, name: '별',      emoji: '⭐', meaning: '희망, 영감, 치유', detail: '어두운 밤에도 별은 빛나요. 희망을 놓지 마세요.' },
  { id: 18, name: '달',      emoji: '🌙', meaning: '무의식, 환상, 불확실성', detail: '모든 게 뚜렷하지 않아도 괜찮아요. 안개 속을 천천히 걸어봐요.' },
  { id: 19, name: '태양',    emoji: '☀️', meaning: '기쁨, 성공, 활력', detail: '따뜻하게 빛나는 때예요. 자신 있게 앞으로 나서봐요.' },
  { id: 20, name: '심판',    emoji: '🎺', meaning: '각성, 부활, 소환', detail: '내 안의 진짜 목소리가 깨어나고 있어요. 응답해봐요.' },
  { id: 21, name: '세계',    emoji: '🌍', meaning: '완성, 통합, 성취', detail: '하나의 사이클이 완성되는 시점이에요. 충분히 이뤄냈어요.' },
];

const POSITIONS = ['과거 — 지나온 흐름', '현재 — 지금의 기운', '미래 — 다가올 빛'];
const ROMAN = ['0', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ', 'ⅩⅢ', 'ⅩⅣ', 'ⅩⅤ', 'ⅩⅥ', 'ⅩⅦ', 'ⅩⅧ', 'ⅩⅨ', 'ⅩⅩ', 'ⅩⅪ'];

// 카드 뒷면 만달라 SVG
function CardBackFace({ posLabel }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 14,
      backfaceVisibility: 'hidden',
      background: 'linear-gradient(160deg, #0d0b1e 0%, #1a1040 50%, #0d0b1e 100%)',
      border: '1px solid rgba(200,165,80,0.45)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 0,
      overflow: 'hidden',
    }}>
      {/* 이중 내부 프레임 */}
      <div style={{ position: 'absolute', inset: 5, border: '1px solid rgba(200,165,80,0.2)', borderRadius: 10, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 8, border: '1px solid rgba(200,165,80,0.1)', borderRadius: 8, pointerEvents: 'none' }} />
      {/* 만달라 SVG */}
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ opacity: 0.75, marginBottom: 6 }}>
        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(200,165,80,0.35)" strokeWidth="0.6"/>
        <circle cx="36" cy="36" r="22" fill="none" stroke="rgba(200,165,80,0.25)" strokeWidth="0.6"/>
        <circle cx="36" cy="36" r="10" fill="none" stroke="rgba(200,165,80,0.4)" strokeWidth="0.6"/>
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const r = deg * Math.PI / 180;
          return <line key={i} x1={36 + 10 * Math.cos(r)} y1={36 + 10 * Math.sin(r)} x2={36 + 30 * Math.cos(r)} y2={36 + 30 * Math.sin(r)} stroke="rgba(200,165,80,0.3)" strokeWidth="0.6"/>;
        })}
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const r = deg * Math.PI / 180;
          const x = 36 + 22 * Math.cos(r); const y = 36 + 22 * Math.sin(r);
          return <circle key={i} cx={x} cy={y} r="1.4" fill="rgba(200,165,80,0.6)"/>;
        })}
        <circle cx="36" cy="36" r="2.5" fill="rgba(200,165,80,0.9)"/>
      </svg>
      {/* 포지션 레이블 */}
      <div style={{ fontSize: '8.5px', color: 'rgba(200,165,80,0.65)', letterSpacing: '.12em', fontWeight: 600, textTransform: 'uppercase' }}>
        {posLabel}
      </div>
      {/* shimmer 레이어 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 14,
        background: 'linear-gradient(105deg, transparent 40%, rgba(255,220,120,0.06) 50%, transparent 60%)',
        backgroundSize: '200% 100%',
        animation: 'tarotShimmer 2.4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// 오늘 날짜 + userId 기반 시드로 카드 뽑기 (같은 날은 같은 카드)
function drawCards(userId = 'guest') {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    + String(userId).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...MAJOR_ARCANA].sort((a, b) => {
    const ha = Math.sin(seed + a.id) * 10000;
    const hb = Math.sin(seed + b.id) * 10000;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });
  return shuffled.slice(0, 3);
}

export default function TarotPage({ callApi, showToast }) {
  const user = useAppStore((s) => s.user);
  const cards = useRef(drawCards(user?.id)).current;

  const [flipped, setFlipped]     = useState([false, false, false]);
  const [reading, setReading]     = useState('');
  const [readingLoading, setReadingLoading] = useState(false);
  const allFlipped = flipped.every(Boolean);

  function flipCard(idx) {
    setFlipped(prev => prev.map((v, i) => i === idx ? true : v));
  }

  const askReading = useCallback(async () => {
    if (readingLoading) return;
    setReadingLoading(true);
    try {
      const cardDesc = cards
        .map((c, i) => `${POSITIONS[i]}: [${c.name}] ${c.meaning}`)
        .join('\n');
      const ans = await callApi(
        `[타로 3장 뽑기 결과]\n${cardDesc}\n\n위 3장의 타로 카드를 내 사주와 별자리 맥락에서 읽어줘요. 각 카드가 지금 내 상황에서 어떤 의미인지, 세 카드를 연결해서 하나의 흐름으로 이야기해줘요.`,
        { isChat: true }
      );
      setReading(ans);
    } catch {
      showToast?.('별이 잠시 바빠요. 다시 시도해봐요', 'error');
    } finally {
      setReadingLoading(false);
    }
  }, [cards, callApi, readingLoading]);

  return (
    <div className="page step-fade" style={{ paddingBottom: 80 }}>
      <style>{`
        @keyframes tarotShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes tarotGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(200,165,80,0.25), 0 4px 20px rgba(0,0,0,0.4); }
          50%       { box-shadow: 0 0 22px rgba(200,165,80,0.45), 0 4px 24px rgba(0,0,0,0.5); }
        }
        @keyframes tarotReveal {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ── 헤더 ── */}
      <div style={{ padding: '32px 20px 24px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(13,11,30,0.6) 0%, transparent 100%)' }}>
        <div style={{ fontSize: '10px', color: 'rgba(200,165,80,0.8)', fontWeight: 700, letterSpacing: '.2em', marginBottom: 8, textTransform: 'uppercase' }}>
          ✦ &nbsp; B Y E O L S O O M &nbsp; T A R O T &nbsp; ✦
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.25, marginBottom: 6 }}>
          오늘의 세 별빛
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.8 }}>
          {allFlipped
            ? '세 별빛이 모두 열렸어요 — 별숨에게 해석을 물어봐요'
            : '카드를 눌러 오늘의 운명을 열어봐요'}
        </div>
      </div>

      {/* ── 카드 3장 ── */}
      <div style={{ display: 'flex', gap: 14, padding: '0 18px', justifyContent: 'center' }}>
        {cards.map((card, idx) => (
          <div
            key={card.id}
            onClick={() => !flipped[idx] && flipCard(idx)}
            style={{
              flex: 1, maxWidth: 108,
              aspectRatio: '5/8',
              borderRadius: 14,
              cursor: flipped[idx] ? 'default' : 'pointer',
              perspective: 800,
              position: 'relative',
              filter: !flipped[idx] ? 'drop-shadow(0 6px 18px rgba(0,0,0,0.55))' : 'none',
              transition: 'transform 0.15s ease',
            }}
          >
            <div style={{
              width: '100%', height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)',
              transform: flipped[idx] ? 'rotateY(180deg)' : 'none',
            }}>
              {/* 뒷면(뒤집기 전) */}
              <CardBackFace posLabel={POSITIONS[idx].split('—')[0].trim()} />

              {/* 앞면(공개 후) */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 14,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'linear-gradient(160deg, #12102a 0%, #1e1a40 60%, #12102a 100%)',
                border: '1px solid rgba(200,165,80,0.7)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '10px 8px 12px', gap: 4, textAlign: 'center',
                animation: flipped[idx] ? 'tarotGlow 3s ease-in-out infinite' : 'none',
                overflow: 'hidden',
              }}>
                {/* 이중 내부 프레임 */}
                <div style={{ position: 'absolute', inset: 5, border: '1px solid rgba(200,165,80,0.2)', borderRadius: 10, pointerEvents: 'none' }} />
                {/* 로마 숫자 */}
                <div style={{ fontSize: '9px', color: 'rgba(200,165,80,0.6)', letterSpacing: '.12em', fontWeight: 600, marginBottom: 2 }}>
                  {ROMAN[card.id]}
                </div>
                {/* 이모지 */}
                <div style={{ fontSize: 32, lineHeight: 1, filter: 'drop-shadow(0 0 8px rgba(200,165,80,0.5))' }}>
                  {card.emoji}
                </div>
                {/* 구분선 */}
                <div style={{ width: '60%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,165,80,0.5), transparent)', margin: '4px 0' }} />
                {/* 카드명 */}
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(220,190,100,0.95)', lineHeight: 1.2, letterSpacing: '.02em' }}>{card.name}</div>
                {/* 키워드 */}
                <div style={{ fontSize: '8.5px', color: 'rgba(180,180,200,0.65)', lineHeight: 1.4, marginTop: 1 }}>{card.meaning}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 포지션 라벨 ── */}
      <div style={{ display: 'flex', gap: 14, padding: '10px 18px 0', justifyContent: 'center' }}>
        {POSITIONS.map((pos, i) => (
          <div key={i} style={{ flex: 1, maxWidth: 108, textAlign: 'center' }}>
            <div style={{ fontSize: '8.5px', color: flipped[i] ? 'rgba(200,165,80,0.75)' : 'var(--t4)', lineHeight: 1.5, fontWeight: flipped[i] ? 700 : 400, transition: 'color 0.4s' }}>
              {pos.split('—')[0].trim()}
            </div>
            <div style={{ fontSize: '8px', color: 'var(--t4)', opacity: 0.6 }}>{pos.split('—')[1]?.trim()}</div>
          </div>
        ))}
      </div>

      {/* ── 카드 설명 (뒤집힌 것만) ── */}
      {flipped.some(Boolean) && (
        <div style={{ margin: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cards.map((card, idx) => flipped[idx] && (
            <div key={card.id} style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(18,16,42,0.9), rgba(26,22,56,0.7))',
              borderRadius: 12,
              border: '1px solid rgba(200,165,80,0.3)',
              animation: 'tarotReveal 0.4s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(200,165,80,0.1)', border: '1px solid rgba(200,165,80,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {card.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--xs)', fontWeight: 800, color: 'rgba(220,190,100,0.9)', marginBottom: 1 }}>{card.name}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(200,165,80,0.55)', letterSpacing: '.08em' }}>{POSITIONS[idx].split('—')[0].trim()} &nbsp;·&nbsp; {ROMAN[card.id]}</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.75, paddingLeft: 2 }}>{card.detail}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── AI 해석 버튼 ── */}
      {allFlipped && !reading && (
        <div style={{ padding: '20px 20px 0' }}>
          <button
            onClick={askReading}
            disabled={readingLoading}
            style={{
              width: '100%', padding: '16px',
              background: readingLoading ? 'rgba(200,165,80,0.08)' : 'linear-gradient(135deg, rgba(200,165,80,0.18), rgba(200,165,80,0.08))',
              border: '1px solid rgba(200,165,80,0.5)',
              borderRadius: 12,
              color: 'rgba(220,190,100,0.95)', fontWeight: 700,
              fontSize: 'var(--sm)', fontFamily: 'var(--ff)',
              cursor: readingLoading ? 'not-allowed' : 'pointer',
              letterSpacing: '.02em',
            }}
          >
            {readingLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(200,165,80,0.3)', borderTopColor: 'rgba(200,165,80,0.9)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', display: 'inline-block' }} />
                별숨이 별빛을 읽고 있어요...
              </span>
            ) : '✦ 세 별빛의 흐름 읽어주기'}
          </button>
        </div>
      )}

      {/* ── AI 해석 결과 ── */}
      {reading && (
        <div style={{ margin: '20px 20px 0', padding: '20px 18px', background: 'linear-gradient(160deg, rgba(13,11,30,0.95), rgba(20,16,44,0.9))', borderRadius: 14, border: '1px solid rgba(200,165,80,0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <div style={{ width: 20, height: 1, background: 'rgba(200,165,80,0.5)' }} />
            <div style={{ fontSize: '9px', color: 'rgba(200,165,80,0.8)', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase' }}>별숨의 타로 해석</div>
            <div style={{ flex: 1, height: 1, background: 'rgba(200,165,80,0.5)' }} />
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
            {reading}
          </div>
        </div>
      )}

      {/* ── 안내 ── */}
      <div style={{ margin: '20px 20px 0', padding: '10px 14px', background: 'rgba(200,165,80,0.05)', border: '1px solid rgba(200,165,80,0.12)', borderRadius: 10, textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: 'var(--t4)', lineHeight: 1.7 }}>
          오늘의 별빛은 매일 자정 새롭게 열려요 ✦
        </div>
      </div>
    </div>
  );
}
