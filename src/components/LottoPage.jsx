/**
 * LottoPage — 오늘의 별숨 로또 번호 뽑기
 * 사주 기운 기반 시드로 오늘 하루 고정된 6개의 행운 번호를 생성합니다.
 */

import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { saveConsultationHistoryEntry } from '../utils/consultationHistory.js';

// xoshiro128** — 균등 분포 PRNG (128비트 상태)
function createRng(seed) {
  // 시드 문자열 → 4개의 32비트 정수
  function hash(s, salt) {
    let h = salt >>> 0;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 0x9e3779b9) | 0;
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  let s0 = hash(seed, 0x12345678);
  let s1 = hash(seed, 0x9abcdef0);
  let s2 = hash(seed, 0xdeadbeef);
  let s3 = hash(seed, 0xcafebabe);
  if (!s0 && !s1 && !s2 && !s3) s0 = 1;

  return function next() {
    const r = Math.imul(s1, 5);
    const t = s1 << 9;
    s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);
    return (((r << 7) | (r >>> 25)) >>> 0) / 0x100000000;
  };
}

function getLottoNumbers(kakaoId, saju, drawId) {
  const seedStr = `lotto2:${kakaoId}:${saju?.il?.g || ''}${saju?.wol?.g || ''}:${saju?.il?.j || ''}:${drawId}`;
  const rng = createRng(seedStr);

  // Fisher-Yates shuffle로 1~45 중 6개 선택 (균등 분포 보장)
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = 44; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 6).sort((a, b) => a - b);
}

function getBallColor(n) {
  if (n <= 10) return '#f5a623';
  if (n <= 20) return '#7ed321';
  if (n <= 30) return '#4a90e2';
  if (n <= 40) return '#d0021b';
  return '#9b9b9b';
}

const DRAW_COST = 10;

export default function LottoPage({ consentFlags, spendBP, showToast }) {
  const { user, saju } = useAppStore();
  const [numbers, setNumbers] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [drawCount, setDrawCount] = useState(0);
  const [lastDrawId, setLastDrawId] = useState('');

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const kakaoId = user?.kakaoId || user?.id || 'guest';

  const handleDraw = async () => {
    if (spendBP) {
      try {
        const result = await spendBP(DRAW_COST, 'LOTTO_DRAW');
        if (!result?.success) {
          showToast?.(result?.message || 'BP가 부족해요');
          return;
        }
      } catch (err) {
        console.error('[LottoPage] spendBP 오류:', err);
        showToast?.('BP 차감 중 오류가 발생했어요. 다시 시도해주세요.');
        return;
      }
    }
    setSpinning(true);
    setRevealed(false);
    setNumbers(null);
    const nextCount = drawCount + 1;
    setDrawCount(nextCount);
    setTimeout(() => {
      const drawId = `${dateStr}:${nextCount}`;
      setLastDrawId(drawId);
      setNumbers(getLottoNumbers(kakaoId, saju, drawId));
      setSpinning(false);
      setTimeout(() => setRevealed(true), 100);
    }, 800);
  };

  useEffect(() => {
    if (!numbers || !revealed || !lastDrawId) return;
    saveConsultationHistoryEntry({
      user,
      consentFlags,
      questions: [`별숨 로또 번호: ${lastDrawId}`],
      answers: [`추천 번호 ${numbers.join(', ')}`],
    }).catch(() => {});
  }, [consentFlags, lastDrawId, numbers, revealed, user]);

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
          ✦ 오늘의 행운 번호
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)' }}>
          별숨 로또 번호 뽑기
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 6, lineHeight: 1.6 }}>
          오늘의 사주 기운을 담아 1~45 범위에서<br />6개의 행운 번호를 뽑아드려요.
        </div>
      </div>

      <div style={{ padding: '28px 24px' }}>
        {/* 번호 표시 영역 */}
        <div style={{
          background: 'var(--bg2)',
          borderRadius: 'var(--r2)',
          border: '1px solid var(--line)',
          padding: '28px 16px',
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          {!numbers && !spinning && (
            <div style={{ textAlign: 'center', color: 'var(--t4)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>🍀</div>
              <div style={{ fontSize: 'var(--xs)' }}>버튼을 눌러 오늘의 번호를 뽑아보세요</div>
            </div>
          )}

          {spinning && (
            <div style={{ textAlign: 'center', color: 'var(--t4)' }}>
              <div style={{
                width: 32, height: 32,
                border: '3px solid var(--line)',
                borderTopColor: 'var(--gold)',
                borderRadius: '50%',
                animation: 'orbSpin 0.7s linear infinite',
                margin: '0 auto 12px',
              }} />
              <div style={{ fontSize: 'var(--xs)' }}>별숨이 기운을 읽는 중...</div>
            </div>
          )}

          {numbers && revealed && (
            <>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 16 }}>
                오늘의 별숨 로또 번호
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {numbers.map((n, idx) => (
                  <div
                    key={n}
                    style={{
                      width: 44, height: 44,
                      borderRadius: '50%',
                      background: getBallColor(n),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1rem',
                      animation: `fadeIn 0.3s ease ${idx * 0.08}s both`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 14, textAlign: 'center' }}>
                {dateStr} · 오늘 하루 유효한 번호예요
              </div>
            </>
          )}
        </div>

        {/* 색상 범례 */}
        {numbers && revealed && (
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
            marginBottom: 20, padding: '12px 16px',
            background: 'var(--bg2)', borderRadius: 'var(--r1)',
            border: '1px solid var(--line)',
          }}>
            {[
              { range: '1~10', color: '#f5a623' },
              { range: '11~20', color: '#7ed321' },
              { range: '21~30', color: '#4a90e2' },
              { range: '31~40', color: '#d0021b' },
              { range: '41~45', color: '#9b9b9b' },
            ].map(({ range, color }) => (
              <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '10px', color: 'var(--t4)' }}>{range}</span>
              </div>
            ))}
          </div>
        )}

        {/* 뽑기 버튼 */}
        <button
          onClick={handleDraw}
          disabled={spinning}
          style={{
            width: '100%',
            padding: '16px',
            background: spinning ? 'var(--bg2)' : 'var(--goldf)',
            border: '1.5px solid var(--acc)',
            borderRadius: 'var(--r1)',
            cursor: spinning ? 'default' : 'pointer',
            fontFamily: 'var(--ff)',
            fontSize: 'var(--sm)',
            color: 'var(--gold)',
            fontWeight: 700,
            transition: 'opacity 0.2s',
            opacity: spinning ? 0.6 : 1,
          }}
        >
          {spinning ? '뽑는 중...' : numbers ? `🍀 다시 뽑기 (${DRAW_COST} BP)` : `🍀 번호 뽑기 (${DRAW_COST} BP)`}
        </button>

        {/* 안내 */}
        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: 'var(--bg2)', borderRadius: 'var(--r1)',
          border: '1px solid var(--line)',
          fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--t3)', marginBottom: 6 }}>안내</div>
          오늘의 별숨 번호는 사주 일주·월주의 기운과 날짜를 결합해 생성돼요. 오락·재미 목적의 서비스이며 당첨을 보장하지 않습니다.
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
