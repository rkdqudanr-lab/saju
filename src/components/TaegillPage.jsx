import { useState, useMemo } from "react";
import { getSaju } from "../utils/saju.js";
import { TAEGIL_PROMPT } from "../utils/constants.js";
import FeatureLoadingScreen from "./FeatureLoadingScreen.jsx";
import { saveConsultationHistoryEntry } from "../utils/consultationHistory.js";
import FeatureResultSheet from "./FeatureResultSheet.jsx";

// ═══════════════════════════════════════════════════════════
//  🗓️ 택일 — 중요한 날, 별숨이 골라드릴게요
// ═══════════════════════════════════════════════════════════

const EVENT_TYPES = [
  { key: '결혼·혼인신고', emoji: '💍' },
  { key: '이사·입주', emoji: '🏠' },
  { key: '개업·창업', emoji: '🎊' },
  { key: '면접·시험', emoji: '📋' },
  { key: '계약·서명', emoji: '📝' },
  { key: '여행·출발', emoji: '✈️' },
  { key: '수술·치료', emoji: '🏥' },
  { key: '고백·프로포즈', emoji: '💌' },
];

// 천간·지지 이름
const GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const JI  = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const JI_ANIMAL = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

// 60갑자 길흉 간단 점수 (상생기준, 0=평범 1=길 -1=흉)
const FORTUNE_SCORES = { '갑자': 1, '갑오': 1, '을축': 0, '을미': 0, '병인': 1, '병신': 1, '정묘': 1, '정유': 0, '무진': 1, '무술': 0, '기사': 0, '기해': 1, '경오': 0, '경자': 1, '신미': 1, '신축': 1, '임신': 1, '임인': 1, '계유': 0, '계묘': 0 };

function getDateSajuDesc(y, m, d) {
  try {
    const s = getSaju(y, m, d, 12);
    const yGan = GAN[(s.y?.g - 1 + 10) % 10] || '';
    const yJi  = JI [(s.y?.j - 1 + 12) % 12] || '';
    const mGan = GAN[(s.m?.g - 1 + 10) % 10] || '';
    const mJi  = JI [(s.m?.j - 1 + 12) % 12] || '';
    const dGan = GAN[(s.il?.g - 1 + 10) % 10] || '';
    const dJi  = JI [(s.il?.j - 1 + 12) % 12] || '';
    const key = dGan + dJi;
    const score = FORTUNE_SCORES[key] ?? 0;
    return { desc: `${yGan}${yJi}년 ${mGan}${mJi}월 ${dGan}${dJi}일`, score, ganZhi: dGan + dJi };
  } catch { return { desc: '계산 오류', score: 0, ganZhi: '' }; }
}

function scoreToStars(score) {
  if (score >= 1) return '⭐⭐⭐⭐⭐';
  if (score === 0) return '⭐⭐⭐';
  return '⭐';
}

export default function TaegillPage({ form, buildCtx, callApi: callApiProp, showToast, onShareCard, user, consentFlags }) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [eventType, setEventType] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResultSheet, setShowResultSheet] = useState(true);

  // 후보 날짜 목록 (최대 14일, 날짜별 사주 정보)
  const candidateDates = useMemo(() => {
    if (!startDate || !endDate) return [];
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayCount = Math.min(Math.ceil((end - start) / 86400000) + 1, 14);
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
      const { desc, score, ganZhi } = getDateSajuDesc(y, m, day);
      const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      dates.push({ label: `${y}년 ${m}월 ${day}일(${weekday})`, sajuDesc: desc, score, ganZhi, y, m, d: day });
    }
    return dates.sort((a, b) => b.score - a.score);
  }, [startDate, endDate]);

  const callApi = callApiProp;

  const handleAsk = async () => {
    if (!eventType) { showToast('이벤트 유형을 선택해주세요', 'info'); return; }
    if (!startDate || !endDate) { showToast('날짜 범위를 설정해주세요', 'info'); return; }
    if (!callApi) { showToast('로그인이 필요해요', 'info'); return; }
    setLoading(true);
    setResult('');
    setShowResultSheet(true);
    try {
      const top = candidateDates.slice(0, 6);
      const prompt = TAEGIL_PROMPT({ eventType, candidateDates: top, sajuCtx: buildCtx?.() || '' });
      const text = await callApi(prompt, { isTaegil: true });
      setResult(text);
      saveConsultationHistoryEntry({
        user,
        consentFlags,
        questions: [`생일 길일: ${eventType} / ${startDate} ~ ${endDate}`],
        answers: [text],
      }).catch(() => {});
    } catch {
      showToast('별이 잠시 쉬고 있어요. 다시 시도해봐요', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <FeatureLoadingScreen type="taegil" />;

  return (
    <div className="page step-fade" style={{ paddingBottom: 100 }}>
      <div className="inner" style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 36, marginTop: 20 }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: 20, 
            background: 'var(--goldf)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 16px', fontSize: '1.8rem',
            border: '1px solid var(--acc)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>🗓️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>길일 택일 — 최고의 날 찾기</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 8, lineHeight: 1.6 }}>
            중요한 일정, 별숨의 기운이 가장 길한 날을<br/>정성을 다해 골라드릴게요.
          </p>
        </div>

        {/* 이벤트 유형 선택 */}
        <div style={{ 
          marginBottom: 24, padding: '20px', borderRadius: 24, 
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 800, marginBottom: 14, letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)' }} />
            어떤 특별한 날을 잡으시나요?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {EVENT_TYPES.map(e => (
              <button
                key={e.key}
                onClick={() => setEventType(prev => prev === e.key ? '' : e.key)}
                style={{
                  padding: '12px 14px', borderRadius: 16, cursor: 'pointer',
                  border: `1px solid ${eventType === e.key ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}`,
                  background: eventType === e.key ? 'var(--goldf)' : 'rgba(255,255,255,0.04)',
                  color: eventType === e.key ? 'var(--gold)' : 'var(--t2)',
                  fontSize: 'var(--xs)', textAlign: 'left', transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontWeight: eventType === e.key ? 700 : 400,
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{e.emoji}</span> {e.key}
              </button>
            ))}
          </div>
        </div>

        {/* 날짜 범위 */}
        <div style={{ 
          marginBottom: 24, padding: '20px', borderRadius: 24, 
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 800, marginBottom: 14, letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)' }} />
            검색 기간 설정 (최대 14일)
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 14px', borderRadius: 14, 
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--t1)', fontSize: 'var(--xs)', outline: 'none'
                }}
              />
            </div>
            <span style={{ color: 'var(--t4)', fontSize: 'var(--xs)' }}>—</span>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 14px', borderRadius: 14, 
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--t1)', fontSize: 'var(--xs)', outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* 후보 날짜 미리보기 */}
        {candidateDates.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 14, paddingLeft: 4, fontWeight: 500 }}>
              📋 분석 대상 {candidateDates.length}일 (기운이 좋은 순서)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {candidateDates.slice(0, 6).map((d, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px', borderRadius: 18,
                  background: i === 0 ? 'var(--goldf)' : 'rgba(255,255,255,0.02)',
                  border: i === 0 ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: i === 0 ? '0 4px 15px rgba(212,175,55,0.15)' : 'none',
                  animation: `fadeUp 0.4s ease ${i * 0.05}s both`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {i === 0 && <span style={{ fontSize: '1.2rem' }}>✨</span>}
                    <span style={{ fontSize: 'var(--xs)', fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--gold)' : 'var(--t2)' }}>
                      {d.label}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: 2 }}>{d.sajuDesc}</div>
                    <div style={{ fontSize: '10px', letterSpacing: '1px' }}>{scoreToStars(d.score)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 분석 버튼 */}
        <button
          onClick={handleAsk}
          disabled={loading || !eventType}
          style={{
            width: '100%', padding: '18px', borderRadius: 20, cursor: 'pointer',
            background: loading || !eventType ? 'var(--line)' : 'linear-gradient(135deg, var(--gold), #c8953a)',
            color: loading || !eventType ? 'var(--t4)' : '#1a1208',
            fontWeight: 800, fontSize: 'var(--sm)', border: 'none', marginBottom: 32,
            boxShadow: loading || !eventType ? 'none' : '0 10px 25px rgba(212,175,55,0.25)',
            transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: loading ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {loading ? '별의 흐름을 읽는 중...' : '🗓️ 최고의 길일 분석 받기'}
        </button>

        {/* 결과 인라인 (결과 시트 외에도 간단히 표시) */}
        {result && (
          <div style={{ 
            animation: 'fadeUp .5s ease', padding: '24px', borderRadius: 28,
            background: 'var(--bg2)', border: '1px solid var(--acc)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 800, marginBottom: 14, letterSpacing: '.1em' }}>
              ✦ 별숨의 택일 Insight
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.9, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
              {result}
            </div>
            
            {/* 택일 카드 공유 */}
            {onShareCard && candidateDates[0] && (
              <button
                onClick={() => onShareCard(candidateDates[0].label, eventType, form?.name)}
                style={{
                  width: '100%', padding: '14px', borderRadius: 16, marginTop: 24,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                  color: 'var(--t3)', fontSize: 'var(--xs)', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--goldf)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                📅 나의 최고의 날 카드로 저장하기
              </button>
            )}
          </div>
        )}

        {/* 결과 시트 (Overlay) */}
        {result && showResultSheet && (
          <FeatureResultSheet
            type="taegil"
            eyebrow="BYEOLSOOM TAEGIL"
            title="별숨의 택일 결과"
            text={result}
            highlights={[
              eventType ? { emoji: "📅", label: "찾는 일정", value: eventType } : null,
              candidateDates[0] ? { emoji: "🥇", label: "가장 좋은 후보", value: candidateDates[0].label, caption: candidateDates[0].sajuDesc } : null,
              candidateDates[1] ? { emoji: "🥈", label: "함께 볼 날짜", value: candidateDates[1].label } : null,
            ].filter(Boolean)}
            primaryAction={() => {
              setResult("");
              setShowResultSheet(false);
            }}
            primaryLabel="다른 날짜 다시 보기"
            onDismiss={() => setShowResultSheet(false)}
          />
        )}
      </div>
    </div>
  );
}
