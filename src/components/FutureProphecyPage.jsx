import { useState, useCallback } from "react";
import useWordTyping from "../hooks/useWordTyping.js";
import { TIMING } from "../utils/constants.js";
import FeatureLoadingScreen from "./FeatureLoadingScreen.jsx";
import { saveConsultationHistoryEntry } from "../utils/consultationHistory.js";

// ═══════════════════════════════════════════════════════════
//  🔮 별숨의 예언 (구 미래의 별숨)
// ═══════════════════════════════════════════════════════════
const PERIOD_OPTIONS = [
  { id: '1일 후',   label: '1일 후',   desc: '내일의 흐름' },
  { id: '3일 후',   label: '3일 후',   desc: '가까운 날들의 기운' },
  { id: '1개월 후', label: '1개월 후', desc: '가장 가까운 미래' },
  { id: '3개월 후', label: '3개월 후', desc: '한 계절이 지난 뒤' },
  { id: '1년 후',   label: '1년 후',   desc: '일 년이 흐른 자리' },
  { id: '10년 후',  label: '10년 후',  desc: '또 다른 나를 만날 때' },
  { id: '30년 후',  label: '30년 후',  desc: '인생의 깊은 곳에서' },
];

const PERIOD_ICON = {
  '1일 후': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 0 1 9.21 3a7 7 0 1 0 11.79 9.79Z"/>
    </svg>
  ),
  '3일 후': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 2L22 12L12 22L2 12Z"/>
    </svg>
  ),
  '1개월 후': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 2L22 12L12 22L2 12Z"/>
      <circle cx="12" cy="12" r="2.8" fill="currentColor" stroke="none"/>
    </svg>
  ),
  '3개월 후': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10Z"/>
    </svg>
  ),
  '1년 후': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10Z"/>
    </svg>
  ),
  '10년 후': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="7" x2="12" y2="17"/>
      <line x1="7" y1="12" x2="17" y2="12"/>
    </svg>
  ),
  '30년 후': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="7"   x2="12"   y2="17"/>
      <line x1="7.2" y1="9"  x2="16.8" y2="15"/>
      <line x1="16.8" y1="9" x2="7.2"  y2="15"/>
    </svg>
  ),
};

export default function FutureProphecyPage({ form, buildCtx, callApi, onBack, shareResult, saveImage, user, consentFlags }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'result'
  const [selectedPeriod, setPeriod] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { shown, done, skipToEnd } = useWordTyping(text, !!text && !loading, TIMING.typingWord);

  const fetchProphecy = useCallback(async (period) => {
    setLoading(true);
    setText('');
    setPhase('result');
    try {
      const pText = await callApi(
        `[예언 요청] 지금으로부터 ${period} 뒤의 미래를 사주와 점성술로 읽어주세요.`,
        { isProphecy: true }
      );
      setText(pText);
      saveConsultationHistoryEntry({
        user,
        consentFlags,
        questions: [`미래 예언: ${period}`],
        answers: [pText],
      }).catch(() => {});
    } catch {
      setText('별의 궤도를 읽는 데 실패했어요.\n잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [callApi]);

  const handleGenerate = () => {
    if (!selectedPeriod || loading) return;
    fetchProphecy(selectedPeriod);
  };

  // ── 결과 화면 ──
  if (phase === 'result' && loading) return <FeatureLoadingScreen type="prophecy" />;

  if (phase === 'result') {
    const period = PERIOD_OPTIONS.find(p => p.id === selectedPeriod) || PERIOD_OPTIONS[0];
    return (
      <div className="page-top">
        <div className="inner" style={{ animation: 'fadeUp .5s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8, display: 'flex', justifyContent: 'center', color: 'var(--gold)' }}>{PERIOD_ICON[period.id]}</div>
            <div style={{ fontSize: 'var(--xl)', fontWeight: 700, color: 'var(--gold)' }}>별숨의 예언</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 6 }}>{period.label} — {period.desc}</div>
          </div>

          <div className="letter-envelope">
            <div className="letter-env-top" style={{ background: 'linear-gradient(135deg,var(--goldf),rgba(200,160,255,0.1))' }}>
              <span style={{ color: 'var(--gold)' }}>{PERIOD_ICON[period.id]}</span>
            </div>
            <div className="letter-body">
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 16, fontWeight: 600 }}>
                ✦ {period.label}의 예언
              </div>
              <div className="letter-content" style={{ padding: 0 }}>
                <p>{shown}{!done && <span className="typing-cursor" />}</p>
              </div>
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
                    style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)', fontSize: 'var(--xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => saveImage('prophecy', text, selectedPeriod)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    이미지 저장
                  </button>
                )}
                {shareResult && (
                  <button
                    className="res-top-btn primary"
                    style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)', fontSize: 'var(--xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => shareResult('prophecy', text, selectedPeriod)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    공유하기
                  </button>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="res-btn"
              style={{ flex: 1, padding: 14, borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => { setPhase('intro'); setText(''); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.96"/>
              </svg>
              다른 미래 보기
            </button>
            <button
              className="res-btn"
              style={{ flex: 1, padding: 14, borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={onBack}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              결과로 돌아가기
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
            boxShadow: '0 0 32px rgba(232,176,72,.15)',
            animation: 'orbPulse 4s infinite',
            color: 'var(--gold)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10Z"/>
            </svg>
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
            {(form?.nickname || form?.name) ? `${form.nickname || form.name}님의 별이` : '당신의 별이'} 가장 밝게 빛날<br />
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
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: selectedPeriod === p.id ? 'var(--gold)' : 'var(--t3)', transition: 'color .2s' }}>
                  {PERIOD_ICON[p.id]}
                </span>
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" style={{ flexShrink: 0 }}>
                    <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10Z"/>
                  </svg>
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
          style={{ width: '100%', marginTop: 8, padding: 14, borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={onBack}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          결과로 돌아가기
        </button>
      </div>
    </div>
  );
}
