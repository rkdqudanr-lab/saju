import { useState, useMemo } from "react";
import { getSaju } from "../utils/saju.js";
import { TAEGIL_PROMPT } from "../utils/constants.js";
import FeatureLoadingScreen from "./FeatureLoadingScreen.jsx";
import { saveConsultationHistoryEntry } from "../utils/consultationHistory.js";

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
    try {
      const top = candidateDates.slice(0, 6);
      const prompt = TAEGIL_PROMPT({ eventType, candidateDates: top, sajuCtx: buildCtx?.() || '' });
      const text = await callApi(prompt);
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
    <div className="page step-fade">
      <div className="inner">
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗓️</div>
          <h2 style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>택일 — 길일 찾기</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>
            중요한 날, 별숨이 가장 좋은 날을 골라드릴게요
          </p>
        </div>

        {/* 이벤트 유형 선택 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
            ✦ 어떤 날을 잡으시나요?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {EVENT_TYPES.map(e => (
              <button
                key={e.key}
                onClick={() => setEventType(prev => prev === e.key ? '' : e.key)}
                style={{
                  padding: '10px 12px', borderRadius: 'var(--r1)', cursor: 'pointer',
                  border: `1px solid ${eventType === e.key ? 'var(--gold)' : 'var(--line)'}`,
                  background: eventType === e.key ? 'var(--goldf)' : 'var(--card)',
                  color: eventType === e.key ? 'var(--gold)' : 'var(--t2)',
                  fontSize: 'var(--xs)', textAlign: 'left', transition: 'all .15s',
                }}
              >
                {e.emoji} {e.key}
              </button>
            ))}
          </div>
        </div>

        {/* 날짜 범위 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
            ✦ 검색 기간 (최대 14일)
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 'var(--r1)', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--t1)', fontSize: 'var(--xs)' }}
            />
            <span style={{ color: 'var(--t3)', fontSize: 'var(--xs)' }}>~</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 'var(--r1)', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--t1)', fontSize: 'var(--xs)' }}
            />
          </div>
        </div>

        {/* 후보 날짜 미리보기 */}
        {candidateDates.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 10 }}>
              📋 분석 대상 날짜 ({candidateDates.length}일) — 사주 기운 순
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {candidateDates.slice(0, 6).map((d, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 8,
                  background: i === 0 ? 'var(--goldf)' : 'var(--card)',
                  border: `1px solid ${i === 0 ? 'var(--acc)' : 'var(--line)'}`,
                }}>
                  <span style={{ fontSize: 'var(--xs)', color: i === 0 ? 'var(--gold)' : 'var(--t2)' }}>
                    {i === 0 && '🥇 '}{d.label}
                  </span>
                  <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>
                    {d.sajuDesc} {scoreToStars(d.score)}
                  </span>
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
            width: '100%', padding: '13px', borderRadius: 'var(--r1)', cursor: 'pointer',
            background: loading || !eventType ? 'var(--line)' : 'linear-gradient(135deg, var(--gold), #c8953a)',
            color: loading || !eventType ? 'var(--t3)' : '#1a1208',
            fontWeight: 700, fontSize: 'var(--sm)', border: 'none', marginBottom: 24,
          }}
        >
          {loading ? '별숨이 길일을 찾고 있어요...' : '🗓️ 길일 분석 받기'}
        </button>

        {/* 결과 */}
        {result && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 'var(--r1)', padding: '16px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>
                ✦ 별숨의 택일 분석
              </div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {result}
              </div>
            </div>
            {/* 택일 카드 공유 */}
            {onShareCard && candidateDates[0] && (
              <button
                onClick={() => onShareCard(candidateDates[0].label, eventType, form?.name)}
                style={{
                  width: '100%', padding: '10px', borderRadius: 'var(--r1)',
                  border: '1px solid var(--line)', background: 'var(--bg2)',
                  color: 'var(--t2)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.color = 'var(--gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--t2)'; }}
              >
                📅 나의 최고의 날 카드로 저장
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
