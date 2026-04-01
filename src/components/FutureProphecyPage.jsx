import { useState, useCallback } from "react";
import useWordTyping from "../hooks/useWordTyping.js";

// ═══════════════════════════════════════════════════════════
//  🔮 별숨의 예언 (구 미래의 별숨)
// ═══════════════════════════════════════════════════════════
const PERIOD_OPTIONS = [
  { id: '1일 후', label: '1일 후', desc: '내일의 흐름', emoji: '🌙' },
  { id: '3일 후', label: '3일 후', desc: '가까운 날들의 기운', emoji: '⭐' },
  { id: '1개월 후', label: '1개월 후', desc: '가장 가까운 미래', emoji: '🌱' },
  { id: '3개월 후', label: '3개월 후', desc: '한 계절이 지난 뒤', emoji: '🌸' },
  { id: '1년 후', label: '1년 후', desc: '일 년이 흐른 자리', emoji: '🍂' },
  { id: '10년 후', label: '10년 후', desc: '또 다른 나를 만날 때', emoji: '🌌' },
  { id: '30년 후', label: '30년 후', desc: '인생의 깊은 곳에서', emoji: '✨' },
];

export default function FutureProphecyPage({ form, buildCtx, callApi, onBack, shareResult, saveImage }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'result'
  const [selectedPeriod, setPeriod] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { shown, done, skipToEnd } = useWordTyping(text, !!text && !loading, 55);

  const fetchProphecy = useCallback(async (period) => {
    setLoading(true);
    setText('');
    setPhase('result');
    try {
      const pText = await callApi(
        `[요청] ${period} 시점의 미래에 대해 사주와 점성술을 기반으로 한 따뜻하고 통찰력 있는 예언 편지를 작성해주세요. "별숨이 전하는 이야기"라는 느낌으로 구체적이고 시적으로 써주세요. 존댓말을 사용해주세요.`,
        { isLetter: true }
      );
      setText(pText);
    } catch {
      setText('별의 궤도를 읽는 데 실패했어요 🌙\n잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [callApi]);

  const handleGenerate = () => {
    if (!selectedPeriod || loading) return;
    fetchProphecy(selectedPeriod);
  };

  // ── 결과 화면 ──
  if (phase === 'result') {
    const period = PERIOD_OPTIONS.find(p => p.id === selectedPeriod) || PERIOD_OPTIONS[0];
    return (
      <div className="page-top">
        <div className="inner" style={{ animation: 'fadeUp .5s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{period.emoji}</div>
            <div style={{ fontSize: 'var(--xl)', fontWeight: 700, color: 'var(--gold)' }}>별숨의 예언</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 6 }}>{period.label} — {period.desc}</div>
          </div>

          <div className="letter-envelope">
            <div className="letter-env-top" style={{ background: 'linear-gradient(135deg,var(--goldf),rgba(200,160,255,0.1))' }}>
              {period.emoji}
            </div>
            <div className="letter-body">
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 16, fontWeight: 600 }}>
                ✦ {period.label}의 예언
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--sp4) 0', color: 'var(--t3)', fontSize: 'var(--sm)' }}>
                  <div className="load-orb-wrap" style={{ marginTop: 0, marginBottom: 'var(--sp2)', transform: 'scale(0.8)' }}>
                    <div className="load-orb">
                      <div className="load-orb-core" />
                      <div className="load-orb-ring" />
                    </div>
                  </div>
                  시간의 장막을 걷어내는 중...
                </div>
              ) : (
                <div className="letter-content" style={{ padding: 0 }}>
                  <p>{shown}{!done && <span className="typing-cursor" />}</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'var(--sp2)' }}>
            {!done && text && (
              <button className="btn-main" style={{ marginTop: 0, flex: 1 }} onClick={skipToEnd}>
                결과 바로 보기 ✦
              </button>
            )}
            {done && text && (
              <>
                {saveImage && (
                  <button
                    className="res-top-btn"
                    style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)', fontSize: 'var(--xs)' }}
                    onClick={() => saveImage('prophecy', text, selectedPeriod)}
                  >
                    🖼 이미지 저장
                  </button>
                )}
                {shareResult && (
                  <button
                    className="res-top-btn primary"
                    style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)', fontSize: 'var(--xs)' }}
                    onClick={() => shareResult('prophecy', text, selectedPeriod)}
                  >
                    ↗ 공유하기
                  </button>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="res-btn"
              style={{ flex: 1, padding: 14, borderRadius: 'var(--r1)' }}
              onClick={() => { setPhase('intro'); setText(''); }}
            >
              ↩ 다른 미래 보기
            </button>
            <button
              className="res-btn"
              style={{ flex: 1, padding: 14, borderRadius: 'var(--r1)' }}
              onClick={onBack}
            >
              ← 결과로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 인트로 화면 ──
  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <div className="inner" style={{ animation: 'fadeUp .6s ease' }}>

        {/* 감성적 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp4)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto var(--sp2)',
            background: 'radial-gradient(circle at 35% 28%, rgba(232,176,72,.4), rgba(190,110,170,.3), rgba(50,30,90,.6))',
            border: '1px solid rgba(232,176,72,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 0 32px rgba(232,176,72,.15)',
            animation: 'orbPulse 4s infinite',
          }}>
            🔮
          </div>
          <div style={{ fontSize: 'var(--xl)', fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
            별숨의 예언
          </div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8 }}>
            별이 품은 시간의 이야기를<br />
            지금 당신에게 전해드릴게요
          </div>
        </div>

        {/* 핵심 질문 */}
        <div style={{
          textAlign: 'center',
          padding: 'var(--sp3) var(--sp2)',
          marginBottom: 'var(--sp3)',
          background: 'var(--bg1)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r2)',
        }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 10, letterSpacing: '.06em' }}>
            ✦ 오늘의 질문
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.6 }}>
            내가 알고 싶은<br />미래는?
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 10, lineHeight: 1.7 }}>
            {form?.name ? `${form.name}님의 별이` : '당신의 별이'} 가장 밝게 빛날<br />
            그 순간을 함께 들여다봐요
          </div>
        </div>

        {/* 기간 선택 */}
        <div style={{ marginBottom: 'var(--sp3)' }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 12, textAlign: 'center' }}>
            보고 싶은 미래의 시간을 선택해주세요
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 'var(--r1)',
                  border: selectedPeriod === p.id ? '1.5px solid var(--gold)' : '1px solid var(--line)',
                  background: selectedPeriod === p.id
                    ? 'linear-gradient(135deg, var(--goldf), rgba(200,160,255,0.06))'
                    : 'var(--bg2)',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  fontFamily: 'var(--ff)',
                  textAlign: 'left',
                  boxShadow: selectedPeriod === p.id ? '0 0 20px rgba(232,176,72,.12)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 'var(--md)', fontWeight: selectedPeriod === p.id ? 700 : 500,
                    color: selectedPeriod === p.id ? 'var(--gold)' : 'var(--t1)',
                    marginBottom: 2,
                  }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>{p.desc}</div>
                </div>
                {selectedPeriod === p.id && (
                  <span style={{ fontSize: '1rem', color: 'var(--gold)' }}>✦</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 생성 버튼 */}
        <button
          className="btn-main"
          disabled={!selectedPeriod}
          onClick={handleGenerate}
          style={{ width: '100%', opacity: selectedPeriod ? 1 : 0.5 }}
        >
          {selectedPeriod
            ? `✦ ${PERIOD_OPTIONS.find(p => p.id === selectedPeriod)?.label}의 예언 보기`
            : '시간을 선택해주세요'}
        </button>

        <button
          className="res-btn"
          style={{ width: '100%', marginTop: 8, padding: 14, borderRadius: 'var(--r1)' }}
          onClick={onBack}
        >
          ← 결과로 돌아가기
        </button>
      </div>
    </div>
  );
}
