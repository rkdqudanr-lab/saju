/**
 * TarotPage — 별숨 타로
 * 22장 대아르카나 가로 라인업에서 3장을 직접 골라 AI 해석
 * step 34
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import FeatureLoadingScreen from './FeatureLoadingScreen.jsx';
import { useStreamResponse } from '../hooks/useStreamResponse.js';

const MAJOR_ARCANA = [
  { id: 0,  name: '광대',        emoji: '🌀', meaning: '새 시작, 순수한 모험심',    detail: '두려움 없이 새로운 길로 나서는 자유로운 영혼이에요.',          img: '/tarot/ar00.jpg' },
  { id: 1,  name: '마법사',      emoji: '🔮', meaning: '집중력, 창조적 의지',       detail: '손에 쥔 도구를 활용해 원하는 것을 현실로 만들 수 있어요.',    img: '/tarot/ar01.jpg' },
  { id: 2,  name: '여사제',      emoji: '📖', meaning: '직관, 신비, 내면의 지혜',   detail: '말하지 않아도 이미 알고 있어요. 내면의 소리를 믿어봐요.',     img: '/tarot/ar02.jpg' },
  { id: 3,  name: '여황제',      emoji: '🌸', meaning: '풍요, 창조성, 모성',        detail: '씨앗을 뿌리면 반드시 꽃이 피는 때예요. 풍요가 흘러들어요.',  img: '/tarot/ar03.jpg' },
  { id: 4,  name: '황제',        emoji: '👑', meaning: '질서, 안정, 리더십',        detail: '체계를 세우고 단단하게 지키는 힘이 필요한 시기예요.',          img: '/tarot/ar04.jpg' },
  { id: 5,  name: '교황',        emoji: '⛪', meaning: '전통, 지혜, 조언',          detail: '신뢰할 수 있는 스승이나 전통적인 방법에서 답을 찾아봐요.',    img: '/tarot/ar05.jpg' },
  { id: 6,  name: '연인',        emoji: '💞', meaning: '선택, 사랑, 조화',          detail: '마음 깊은 곳의 끌림을 따라 선택하는 순간이에요.',             img: '/tarot/ar06.jpg' },
  { id: 7,  name: '전차',        emoji: '⚔️', meaning: '의지, 승리, 통제',         detail: '앞으로만 나아가요. 집중과 결단이 승리를 만들어요.',            img: '/tarot/ar07.jpg' },
  { id: 8,  name: '힘',          emoji: '🦁', meaning: '내면의 힘, 인내, 용기',     detail: '거칠고 강한 것도 부드러운 사랑으로 다스릴 수 있어요.',        img: '/tarot/ar08.jpg' },
  { id: 9,  name: '은둔자',      emoji: '🕯️', meaning: '성찰, 고독, 내면 탐색',    detail: '혼자만의 시간이 빛이 되는 때예요. 깊이 들여다봐요.',          img: '/tarot/ar09.jpg' },
  { id: 10, name: '운명의 바퀴', emoji: '🎡', meaning: '변화, 전환점, 운명',        detail: '삶이 새로운 국면으로 접어들고 있어요. 흐름을 타봐요.',        img: '/tarot/ar10.jpg' },
  { id: 11, name: '정의',        emoji: '⚖️', meaning: '균형, 공정, 원인과 결과',  detail: '진실된 행동이 공정한 결과로 돌아오는 시기예요.',              img: '/tarot/ar11.jpg' },
  { id: 12, name: '매달린 자',   emoji: '🙃', meaning: '희생, 기다림, 새 시각',     detail: '잠시 멈추고 다른 관점으로 바라보는 지혜가 필요해요.',         img: '/tarot/ar12.jpg' },
  { id: 13, name: '죽음',        emoji: '🌑', meaning: '변환, 끝과 새 시작',        detail: '두려운 끝이 아니에요. 낡은 것이 떠나고 새것이 들어와요.',    img: '/tarot/ar13.jpg' },
  { id: 14, name: '절제',        emoji: '🌊', meaning: '균형, 조화, 인내',          detail: '서두르지 않아도 돼요. 조화롭게 섞이면 완성돼요.',             img: '/tarot/ar14.jpg' },
  { id: 15, name: '악마',        emoji: '🔗', meaning: '집착, 속박, 욕망',          detail: '스스로 만든 사슬임을 알아채는 순간 자유로워져요.',             img: '/tarot/ar15.jpg' },
  { id: 16, name: '탑',          emoji: '⚡', meaning: '갑작스런 변화, 해방',       detail: '흔들리는 것은 처음부터 불안정했기 때문이에요. 재건할 기회예요.', img: '/tarot/ar16.jpg' },
  { id: 17, name: '별',          emoji: '⭐', meaning: '희망, 영감, 치유',          detail: '어두운 밤에도 별은 빛나요. 희망을 놓지 마세요.',              img: '/tarot/ar17.jpg' },
  { id: 18, name: '달',          emoji: '🌙', meaning: '무의식, 환상, 불확실성',    detail: '모든 게 뚜렷하지 않아도 괜찮아요. 안개 속을 천천히 걸어봐요.', img: '/tarot/ar18.jpg' },
  { id: 19, name: '태양',        emoji: '☀️', meaning: '기쁨, 성공, 활력',         detail: '따뜻하게 빛나는 때예요. 자신 있게 앞으로 나서봐요.',          img: '/tarot/ar19.jpg' },
  { id: 20, name: '심판',        emoji: '🎺', meaning: '각성, 부활, 소환',          detail: '내 안의 진짜 목소리가 깨어나고 있어요. 응답해봐요.',           img: '/tarot/ar20.jpg' },
  { id: 21, name: '세계',        emoji: '🌍', meaning: '완성, 통합, 성취',          detail: '하나의 사이클이 완성되는 시점이에요. 충분히 이뤄냈어요.',     img: '/tarot/ar21.jpg' },
];

const POSITIONS = ['과거 — 지나온 흐름', '현재 — 지금의 기운', '미래 — 다가올 빛'];
const ROMAN = ['0', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ', 'ⅩⅢ', 'ⅩⅣ', 'ⅩⅤ', 'ⅩⅥ', 'ⅩⅦ', 'ⅩⅧ', 'ⅩⅨ', 'ⅩⅩ', 'ⅩⅪ'];

function shuffleDeck(userId = 'guest') {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    + String(userId).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return [...MAJOR_ARCANA].sort((a, b) => {
    const ha = Math.sin(seed + a.id) * 10000;
    const hb = Math.sin(seed + b.id) * 10000;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });
}

const SHUFFLE_ARCS = [
  { delay: 0   },
  { delay: 200 },
  { delay: 100 },
  { delay: 300 },
  { delay: 150 },
];

function CardBack({ opacity = 1 }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 58 92" style={{ opacity, position: 'absolute', inset: 0 }}>
      <rect width="58" height="92" rx="8" fill="url(#cbg)" />
      <defs>
        <linearGradient id="cbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d0b1e" />
          <stop offset="50%" stopColor="#1a1040" />
          <stop offset="100%" stopColor="#0d0b1e" />
        </linearGradient>
      </defs>
      <circle cx="29" cy="46" r="22" fill="none" stroke="rgba(200,165,80,0.45)" strokeWidth="0.6"/>
      <circle cx="29" cy="46" r="14" fill="none" stroke="rgba(200,165,80,0.28)" strokeWidth="0.5"/>
      <circle cx="29" cy="46" r="6"  fill="none" stroke="rgba(200,165,80,0.45)" strokeWidth="0.5"/>
      {[0,45,90,135,180,225,270,315].map((deg, j) => {
        const r = deg * Math.PI / 180;
        return <line key={j}
          x1={29 + 6 * Math.cos(r)} y1={46 + 6 * Math.sin(r)}
          x2={29 + 22 * Math.cos(r)} y2={46 + 22 * Math.sin(r)}
          stroke="rgba(200,165,80,0.2)" strokeWidth="0.5"/>;
      })}
      <circle cx="29" cy="46" r="2" fill="rgba(200,165,80,0.85)"/>
      <text x="4" y="11" fontSize="7" fill="rgba(200,165,80,0.4)" fontFamily="serif">✦</text>
      <text x="47" y="88" fontSize="7" fill="rgba(200,165,80,0.4)" fontFamily="serif" textAnchor="middle">✦</text>
    </svg>
  );
}

export default function TarotPage({ callApi, buildCtx, showToast }) {
  const user = useAppStore((s) => s.user);
  const deck = useRef(shuffleDeck(user?.id)).current;

  const [phase, setPhase]           = useState('idle');
  const [picks, setPicks]           = useState([]);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [imgErrors, setImgErrors]   = useState({});
  const [modalCard, setModalCard]   = useState(null);   // 확대 보기 카드
  const [modalMode, setModalMode]   = useState('image'); // 'image' | 'detail'
  const timerRef = useRef([]);

  const { streamText, isStreaming, streamError, startStream, resetStream } = useStreamResponse();

  const pickedCards = picks.map(i => deck[i]);

  useEffect(() => () => timerRef.current.forEach(clearTimeout), []);

  function addTimer(fn, ms) {
    const t = setTimeout(fn, ms);
    timerRef.current.push(t);
  }

  function handleSpread() {
    setPhase('shuffling');
    addTimer(() => setPhase('spread'), 1500);
  }

  function handlePick(deckIdx) {
    if (picks.includes(deckIdx) || picks.length >= 3) return;
    const next = [...picks, deckIdx];
    setPicks(next);
    if (next.length === 3) addTimer(() => setPhase('done'), 500);
  }

  function handleImgError(cardId) {
    setImgErrors(prev => ({ ...prev, [cardId]: true }));
  }

  const askReading = useCallback(async () => {
    if (isStreaming) return;
    resetStream();
    const cardDesc = pickedCards
      .map((c, i) => `${POSITIONS[i]}: [${c.name}] ${c.meaning}`)
      .join('\n');
    await startStream({
      userMessage: `[타로 3장 뽑기 결과]\n${cardDesc}\n\n위 3장의 타로 카드를 내 사주와 별자리 맥락에서 읽어줘요. 각 카드가 지금 내 상황에서 어떤 의미인지, 세 카드를 연결해서 하나의 흐름으로 이야기해줘요.`,
      context: buildCtx?.() || '',
      isChat: true,
      clientHour: new Date().getHours(),
    });
  }, [pickedCards, buildCtx, isStreaming, startStream, resetStream]);

  return (
    <div className="page step-fade" style={{ paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes tarotShimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes deckFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-7px) rotate(-1.5deg); }
          66%  { transform: translateY(-4px) rotate(1deg); }
        }
        @keyframes deckBounce {
          0%,100% { transform: translateY(0) scale(1); }
          20%  { transform: translateY(-10px) scale(1.03) rotate(-2deg); }
          40%  { transform: translateY(-4px) scale(0.98) rotate(1.5deg); }
          60%  { transform: translateY(-8px) scale(1.02) rotate(-1deg); }
          80%  { transform: translateY(-2px) scale(0.99) rotate(2deg); }
        }
        @keyframes shuffleArc0 {
          0%   { opacity:0; transform:translate(0,0) rotate(0deg) scale(0.8); }
          12%  { opacity:1; }
          45%  { transform:translate(-75px,-55px) rotate(-14deg) scale(1.06); }
          88%  { opacity:1; transform:translate(55px,-80px) rotate(18deg) scale(0.95); }
          100% { opacity:0; transform:translate(4px,4px) rotate(3deg) scale(0.82); }
        }
        @keyframes shuffleArc1 {
          0%   { opacity:0; transform:translate(0,0) rotate(0deg) scale(0.8); }
          12%  { opacity:1; }
          45%  { transform:translate(70px,-45px) rotate(12deg) scale(1.04); }
          88%  { opacity:1; transform:translate(-60px,-70px) rotate(-16deg) scale(0.93); }
          100% { opacity:0; transform:translate(-6px,6px) rotate(-4deg) scale(0.84); }
        }
        @keyframes shuffleArc2 {
          0%   { opacity:0; transform:translate(0,0) rotate(0deg) scale(0.75); }
          15%  { opacity:1; }
          50%  { transform:translate(-40px,-75px) rotate(-20deg) scale(1.08); }
          85%  { opacity:1; transform:translate(80px,-40px) rotate(10deg) scale(0.9); }
          100% { opacity:0; transform:translate(8px,-2px) rotate(6deg) scale(0.8); }
        }
        @keyframes shuffleArc3 {
          0%   { opacity:0; transform:translate(0,0) rotate(0deg) scale(0.82); }
          14%  { opacity:1; }
          48%  { transform:translate(50px,-65px) rotate(16deg) scale(1.05); }
          86%  { opacity:1; transform:translate(-80px,-50px) rotate(-12deg) scale(0.94); }
          100% { opacity:0; transform:translate(-5px,5px) rotate(-2deg) scale(0.83); }
        }
        @keyframes shuffleArc4 {
          0%   { opacity:0; transform:translate(0,0) rotate(0deg) scale(0.78); }
          16%  { opacity:1; }
          52%  { transform:translate(-65px,-35px) rotate(-10deg) scale(1.07); }
          84%  { opacity:1; transform:translate(45px,-90px) rotate(22deg) scale(0.92); }
          100% { opacity:0; transform:translate(2px,8px) rotate(5deg) scale(0.81); }
        }
        /* 가로 라인업 등장 */
        @keyframes lineCardIn {
          0%   { opacity:0; transform:translateY(36px) scale(0.72); filter:blur(4px); }
          55%  { filter:blur(0); }
          78%  { transform:translateY(-4px) scale(1.03); }
          100% { opacity:1; transform:translateY(0) scale(1); }
        }
        /* 라인업 idle 미세 부유 */
        @keyframes lineIdle {
          0%,100% { transform:translateY(0px); }
          50%     { transform:translateY(-4px); }
        }
        @keyframes tarotReveal {
          from { opacity:0; transform:scale(0.88) translateY(10px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes sparkle {
          0%,100% { opacity:0; transform:scale(0) rotate(0deg); }
          50%     { opacity:1; transform:scale(1) rotate(180deg); }
        }
        /* 스크롤바 숨기기 */
        .tarot-lineup::-webkit-scrollbar { display: none; }
        .tarot-lineup { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── 헤더 ── */}
      <div style={{ padding: '32px 20px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: 'rgba(200,165,80,0.8)', fontWeight: 700, letterSpacing: '.2em', marginBottom: 8, textTransform: 'uppercase' }}>
          ✦ &nbsp; B Y E O L S O O M &nbsp; T A R O T &nbsp; ✦
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.25, marginBottom: 6 }}>
          오늘의 세 별빛
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.8, minHeight: 22 }}>
          {phase === 'idle'      && '마음을 비우고, 끌리는 카드를 골라봐요'}
          {phase === 'shuffling' && '별숨이 오늘의 패를 섞고 있어요...'}
          {phase === 'spread'    && (picks.length < 3
            ? `${picks.length}/3장 골랐어요 — ${['첫 번째', '두 번째', '세 번째'][picks.length]} 카드를 골라봐요`
            : '세 별빛이 모였어요...')}
          {phase === 'done'      && '세 별빛이 모두 열렸어요 — 별숨에게 해석을 물어봐요'}
        </div>
      </div>

      {/* ══════════════════════════════════════
          IDLE
      ══════════════════════════════════════ */}
      {phase === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36, padding: '16px 20px 0' }}>
          <div style={{ position: 'relative', width: 80, height: 128, animation: 'deckFloat 4s ease-in-out infinite' }}>
            {[14, 9, 4, 0].map((offset, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: -offset / 3, top: offset / 2,
                width: 80, height: 128, borderRadius: 10,
                background: 'linear-gradient(160deg, #0d0b1e 0%, #1a1040 50%, #0d0b1e 100%)',
                border: `1px solid rgba(200,165,80,${0.5 - i * 0.1})`,
                boxShadow: `0 ${4 + i * 2}px ${16 + i * 4}px rgba(0,0,0,${0.55 - i * 0.08})`,
                opacity: 1 - i * 0.1,
              }}>
                {i === 0 && <CardBack opacity={0.6} />}
              </div>
            ))}
          </div>
          <button
            onClick={handleSpread}
            style={{
              padding: '16px 44px',
              background: 'linear-gradient(135deg, rgba(200,165,80,0.22), rgba(200,165,80,0.08))',
              border: '1px solid rgba(200,165,80,0.6)', borderRadius: 50,
              color: 'rgba(220,190,100,0.95)', fontWeight: 700,
              fontSize: 'var(--sm)', fontFamily: 'var(--ff)',
              cursor: 'pointer', letterSpacing: '.06em',
              boxShadow: '0 0 28px rgba(200,165,80,0.14)',
              transition: 'box-shadow .2s, border-color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 44px rgba(200,165,80,0.3)'; e.currentTarget.style.borderColor = 'rgba(200,165,80,0.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(200,165,80,0.14)'; e.currentTarget.style.borderColor = 'rgba(200,165,80,0.6)'; }}
          >
            ✦ 카드 펼치기
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          SHUFFLING
      ══════════════════════════════════════ */}
      {phase === 'shuffling' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 0', position: 'relative' }}>
          <div style={{ position: 'relative', width: 120, height: 160 }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', animation: 'deckBounce 1.5s ease-in-out infinite', zIndex: 5 }}>
              {[8, 5, 2, 0].map((off, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: -40 - off / 2, top: -64 - off / 2,
                  width: 80, height: 128, borderRadius: 10,
                  background: 'linear-gradient(160deg, #0d0b1e 0%, #1a1040 50%, #0d0b1e 100%)',
                  border: `1px solid rgba(200,165,80,${0.5 - i * 0.09})`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                  opacity: 1 - i * 0.1,
                }}>
                  {i === 0 && <CardBack opacity={0.55} />}
                </div>
              ))}
            </div>
            {SHUFFLE_ARCS.map((arc, i) => (
              <div key={i} style={{
                position: 'absolute', left: '50%', top: '50%',
                marginLeft: -29, marginTop: -46,
                width: 58, height: 92, borderRadius: 9,
                zIndex: 10 + i,
                animation: `shuffleArc${i} 0.48s cubic-bezier(.4,0,.2,1) ${arc.delay}ms both`,
                pointerEvents: 'none',
              }}>
                <CardBack opacity={0.9} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: 9, overflow: 'hidden', pointerEvents: 'none' }}>
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, width: '40%',
                    background: 'linear-gradient(105deg, transparent, rgba(255,220,120,0.18), transparent)',
                    animation: 'tarotShimmer 1.2s ease-in-out infinite',
                  }} />
                </div>
              </div>
            ))}
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${18 + i * 13}%`, top: `${28 + (i % 3) * 22}%`,
              fontSize: '8px', color: 'rgba(200,165,80,0.7)',
              animation: `sparkle ${0.8 + i * 0.2}s ease-in-out ${i * 180}ms infinite`,
              pointerEvents: 'none',
            }}>✦</div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          SPREAD — 가로 라인업
      ══════════════════════════════════════ */}
      {phase === 'spread' && (
        <div style={{ width: '100%' }}>
          {/* 선택 슬롯 3개 */}
          <div style={{ display: 'flex', gap: 10, padding: '0 20px', justifyContent: 'center', marginBottom: 14 }}>
            {POSITIONS.map((pos, i) => {
              const card = picks[i] !== undefined ? deck[picks[i]] : null;
              return (
                <div key={i} style={{ flex: 1, maxWidth: 58, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', aspectRatio: '5/8', borderRadius: 10,
                    border: card ? '1px solid rgba(200,165,80,0.7)' : '1.5px dashed rgba(200,165,80,0.22)',
                    background: card ? 'none' : 'rgba(200,165,80,0.03)',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: card ? '0 0 14px rgba(200,165,80,0.22)' : 'none',
                    transition: 'border .3s, box-shadow .3s',
                    animation: card ? 'tarotReveal 0.45s cubic-bezier(.34,1.56,.64,1)' : 'none',
                  }}>
                    {card ? (
                      imgErrors[card.id]
                        ? <div style={{ fontSize: 26 }}>{card.emoji}</div>
                        : <img src={card.img} alt={card.name} onError={() => handleImgError(card.id)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ fontSize: '16px', color: 'rgba(200,165,80,0.18)' }}>✦</div>
                    )}
                  </div>
                  <div style={{ fontSize: '8px', color: card ? 'rgba(200,165,80,0.75)' : 'var(--t4)', fontWeight: card ? 700 : 400, textAlign: 'center', lineHeight: 1.4, transition: 'color .3s' }}>
                    {pos.split('—')[0].trim()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 구분선 */}
          <div style={{ margin: '0 20px 14px', height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,165,80,0.25), transparent)' }} />

          {/* 5열 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
            padding: '4px 20px 16px',
          }}>
            {deck.map((card, i) => {
              const isPicked  = picks.includes(i);
              const isHovered = hoveredIdx === i;
              const canPick   = !isPicked && picks.length < 3;

              return (
                <div
                  key={card.id}
                  onClick={() => canPick && handlePick(i)}
                  onMouseEnter={() => canPick && setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onTouchStart={() => canPick && setHoveredIdx(i)}
                  onTouchEnd={() => setHoveredIdx(null)}
                  style={{
                    aspectRatio: '5/8',
                    borderRadius: 10,
                    border: `1.5px solid rgba(200,165,80,${isHovered ? 0.9 : isPicked ? 0.08 : 0.38})`,
                    boxShadow: isHovered
                      ? '0 0 20px rgba(200,165,80,0.5), 0 8px 24px rgba(0,0,0,0.45)'
                      : isPicked ? 'none' : '0 3px 10px rgba(0,0,0,0.3)',
                    opacity: isPicked ? 0.2 : 1,
                    cursor: canPick ? 'pointer' : 'default',
                    transform: isHovered ? 'translateY(-10px) scale(1.06)' : 'translateY(0) scale(1)',
                    transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), opacity .3s, border-color .2s, box-shadow .2s',
                    animation: `lineCardIn 0.45s cubic-bezier(.34,1.56,.64,1) ${i * 35}ms both`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <CardBack opacity={isPicked ? 0.3 : isHovered ? 0.8 : 0.65} />

                  {/* shimmer */}
                  {!isPicked && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 10, overflow: 'hidden', pointerEvents: 'none' }}>
                      <div style={{
                        position: 'absolute', top: 0, bottom: 0, width: '35%',
                        background: 'linear-gradient(105deg, transparent, rgba(255,220,120,0.1), transparent)',
                        animation: `tarotShimmer ${2.8 + (i % 5) * 0.4}s ease-in-out ${i * 90}ms infinite`,
                      }} />
                    </div>
                  )}

                  {/* hover glow overlay */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 10,
                      background: 'linear-gradient(160deg, rgba(200,165,80,0.14), rgba(200,165,80,0.04))',
                      pointerEvents: 'none',
                    }} />
                  )}

                  {/* 선택됨 */}
                  {isPicked && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(13,11,30,0.5)',
                    }}>
                      <span style={{ fontSize: 18, color: 'rgba(200,165,80,0.7)' }}>✦</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--t4)', letterSpacing: '.04em', paddingBottom: 4 }}>
            끌리는 카드를 3장 골라봐요
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          DONE
      ══════════════════════════════════════ */}
      {phase === 'done' && (
        <>
          <div style={{ display: 'flex', gap: 10, padding: '0 20px', justifyContent: 'center' }}>
            {pickedCards.map((card, idx) => (
              <div key={card.id}
                onClick={() => { setModalCard(card); setModalMode('image'); }}
                style={{
                  flex: 1, maxWidth: 66, aspectRatio: '5/8', borderRadius: 10,
                  border: '1px solid rgba(200,165,80,0.7)',
                  background: 'linear-gradient(160deg, #12102a 0%, #1e1a40 60%, #12102a 100%)',
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  animation: `tarotReveal 0.55s cubic-bezier(.34,1.56,.64,1) ${idx * 140}ms both`,
                  boxShadow: '0 0 22px rgba(200,165,80,0.22), 0 8px 32px rgba(0,0,0,0.4)',
                  position: 'relative',
                  cursor: 'pointer',
                }}>
                <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(200,165,80,0.15)', borderRadius: 10, pointerEvents: 'none', zIndex: 1 }} />
                <div style={{ fontSize: '8px', color: 'rgba(200,165,80,0.55)', textAlign: 'center', padding: '6px 0 3px', letterSpacing: '.1em', zIndex: 2 }}>{ROMAN[card.id]}</div>
                {imgErrors[card.id]
                  ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, zIndex: 2 }}>{card.emoji}</div>
                  : <img src={card.img} alt={card.name} onError={() => handleImgError(card.id)}
                      style={{ flex: 1, width: 'calc(100% - 10px)', margin: '0 5px', objectFit: 'cover', borderRadius: 6, minHeight: 0, zIndex: 2 }} />
                }
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,165,80,0.4), transparent)', margin: '4px 8px', zIndex: 2 }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(220,190,100,0.9)', textAlign: 'center', padding: '0 4px 8px', zIndex: 2 }}>{card.name}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, padding: '8px 20px 0', justifyContent: 'center' }}>
            {POSITIONS.map((pos, i) => (
              <div key={i} style={{ flex: 1, maxWidth: 66, textAlign: 'center' }}>
                <div style={{ fontSize: '8.5px', color: 'rgba(200,165,80,0.75)', fontWeight: 700, lineHeight: 1.5 }}>{pos.split('—')[0].trim()}</div>
                <div style={{ fontSize: '8px', color: 'var(--t4)', opacity: 0.6 }}>{pos.split('—')[1]?.trim()}</div>
              </div>
            ))}
          </div>

          <div style={{ margin: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pickedCards.map((card, idx) => (
              <div key={card.id} style={{
                padding: '14px',
                background: 'linear-gradient(135deg, rgba(18,16,42,0.92), rgba(26,22,56,0.75))',
                borderRadius: 12, border: '1px solid rgba(200,165,80,0.3)',
                animation: `tarotReveal 0.45s ease ${idx * 100 + 350}ms both`,
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{ flexShrink: 0, width: 44, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(200,165,80,0.4)' }}>
                  {imgErrors[card.id]
                    ? <div style={{ width: 44, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{card.emoji}</div>
                    : <img src={card.img} alt={card.name} onError={() => handleImgError(card.id)}
                        style={{ width: '100%', aspectRatio: '5/8', objectFit: 'cover', display: 'block' }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 800, color: 'rgba(220,190,100,0.92)' }}>{card.name}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(200,165,80,0.45)', letterSpacing: '.08em' }}>{ROMAN[card.id]}</div>
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(200,165,80,0.65)', marginBottom: 6, letterSpacing: '.04em' }}>
                    {POSITIONS[idx].split('—')[0].trim()} &nbsp;·&nbsp; {POSITIONS[idx].split('—')[1]?.trim()}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(210,185,245,0.95)', fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.meaning}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(230,222,248,0.9)', lineHeight: 1.7, wordBreak: 'keep-all' }}>{card.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {!streamText && !isStreaming && (
            <div style={{ padding: '20px 20px 0' }}>
              <button
                onClick={askReading}
                style={{
                  width: '100%', padding: '16px',
                  background: 'linear-gradient(135deg, rgba(200,165,80,0.18), rgba(200,165,80,0.07))',
                  border: '1px solid rgba(200,165,80,0.52)', borderRadius: 50,
                  color: 'rgba(220,190,100,0.95)', fontWeight: 700,
                  fontSize: 'var(--sm)', fontFamily: 'var(--ff)',
                  cursor: 'pointer', letterSpacing: '.04em',
                  boxShadow: '0 0 24px rgba(200,165,80,0.1)',
                  transition: 'all .2s',
                }}
              >
                ✦ 세 별빛의 흐름 읽어주기
              </button>
            </div>
          )}

          {/* 스트리밍 로딩 인디케이터 */}
          {isStreaming && !streamText && (
            <div style={{ margin: '20px 20px 0', padding: '20px 18px', background: 'linear-gradient(160deg, rgba(13,11,30,0.96), rgba(20,16,44,0.92))', borderRadius: 14, border: '1px solid rgba(200,165,80,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="typing-dots"><span /><span /><span /></div>
              <span style={{ fontSize: 'var(--xs)', color: 'rgba(200,165,80,0.7)', fontStyle: 'italic' }}>별빛을 읽는 중...</span>
            </div>
          )}

          {(streamText || streamError) && (
            <div style={{ margin: '20px 20px 0', padding: '20px 18px', background: 'linear-gradient(160deg, rgba(13,11,30,0.96), rgba(20,16,44,0.92))', borderRadius: 14, border: '1px solid rgba(200,165,80,0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <div style={{ width: 20, height: 1, background: 'rgba(200,165,80,0.5)' }} />
                <div style={{ fontSize: '9px', color: 'rgba(200,165,80,0.85)', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase' }}>별숨의 타로 해석</div>
                <div style={{ flex: 1, height: 1, background: 'rgba(200,165,80,0.5)' }} />
              </div>
              {streamError
                ? <div style={{ fontSize: 'var(--xs)', color: 'var(--rose)' }}>{streamError}</div>
                : <div style={{ fontSize: 'var(--xs)', color: 'rgba(238,232,252,0.95)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                    {streamText}{isStreaming && <span className="typing-cursor" />}
                  </div>
              }
            </div>
          )}
        </>
      )}

      <div style={{ margin: '20px 20px 0', padding: '10px 14px', background: 'rgba(200,165,80,0.04)', border: '1px solid rgba(200,165,80,0.1)', borderRadius: 10, textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: 'var(--t4)', lineHeight: 1.7 }}>
          오늘의 별빛은 매일 자정 새롭게 열려요 ✦
        </div>
      </div>

      {/* ══════════════════════════════════════
          카드 확대 모달
      ══════════════════════════════════════ */}
      {modalCard && (
        <div
          onClick={() => setModalCard(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(6,4,18,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 28px',
            animation: 'tarotReveal 0.22s ease',
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={e => { e.stopPropagation(); setModalCard(null); }}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(200,165,80,0.12)',
              border: '1px solid rgba(200,165,80,0.4)',
              color: 'rgba(220,190,100,0.9)', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontFamily: 'var(--ff)',
            }}
          >✕</button>

          {/* 카드 + 설명 컨테이너 */}
          <div
            onClick={e => { e.stopPropagation(); setModalMode(m => m === 'image' ? 'detail' : 'image'); }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 18, width: '100%', maxWidth: 280, cursor: 'pointer',
            }}
          >
            {/* 카드 이미지 */}
            <div style={{
              width: 160, borderRadius: 14,
              border: '1px solid rgba(200,165,80,0.65)',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(200,165,80,0.28), 0 16px 48px rgba(0,0,0,0.6)',
              background: 'linear-gradient(160deg, #12102a 0%, #1e1a40 60%, #12102a 100%)',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: '9px', color: 'rgba(200,165,80,0.55)', textAlign: 'center', padding: '8px 0 4px', letterSpacing: '.12em' }}>
                {ROMAN[modalCard.id]}
              </div>
              {imgErrors[modalCard.id]
                ? <div style={{ width: '100%', aspectRatio: '5/8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>{modalCard.emoji}</div>
                : <img src={modalCard.img} alt={modalCard.name} style={{ width: 'calc(100% - 12px)', margin: '0 6px 6px', aspectRatio: '5/8', objectFit: 'cover', borderRadius: 8, display: 'block' }} />
              }
            </div>

            {/* 카드 이름 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--md)', fontWeight: 800, color: 'rgba(220,190,100,0.95)', marginBottom: 4 }}>{modalCard.name}</div>
              <div style={{ fontSize: 'var(--xs)', color: 'rgba(200,165,80,0.6)' }}>{modalCard.meaning}</div>
            </div>

            {/* 상세 설명 (두 번째 탭) */}
            {modalMode === 'detail' && (
              <div style={{
                background: 'rgba(18,16,42,0.9)',
                border: '1px solid rgba(200,165,80,0.25)',
                borderRadius: 12, padding: '16px 18px',
                width: '100%',
                animation: 'tarotReveal 0.25s ease',
              }}>
                <div style={{ fontSize: 'var(--sm)', color: 'rgba(230,222,248,0.95)', lineHeight: 1.85, textAlign: 'center' }}>
                  {modalCard.detail}
                </div>
              </div>
            )}

            <div style={{ fontSize: '10px', color: 'rgba(200,165,80,0.35)', letterSpacing: '.04em' }}>
              {modalMode === 'image' ? '한 번 더 누르면 설명을 볼 수 있어요' : '다시 누르면 카드만 볼 수 있어요'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
