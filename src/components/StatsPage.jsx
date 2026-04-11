/**
 * StatsPage — 나의 별숨 통계 대시보드
 * consultation_history에서 상담 기록을 불러와 SVG 차트로 시각화하고
 * AI 인사이트(isAnalytics 모드)를 제공합니다.
 */

import { useState, useEffect } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';

// 카테고리 키워드 → 라벨 매핑
const CAT_KEYWORDS = [
  { label: '연애·관계', words: ['연애','연인','사랑','짝','이별','결혼','만남','남자','여자','남편','아내','남친','여친'] },
  { label: '직업·커리어', words: ['취업','직장','이직','사업','면접','진로','일','커리어','회사','창업','승진'] },
  { label: '재물·금전', words: ['돈','재물','투자','부동산','주식','재정','수입','빚','경제'] },
  { label: '건강', words: ['건강','병','아프','몸','다이어트','체력','피로','수술','치료'] },
  { label: '가족', words: ['부모','엄마','아빠','형제','자녀','자식','가족','형','누나','오빠','언니'] },
  { label: '학업', words: ['공부','시험','학교','대학','성적','수능','입시','학원'] },
  { label: '심리·기운', words: ['불안','우울','스트레스','힘들','걱정','외롭','기운','에너지','마음'] },
  { label: '일반 운세', words: [] },
];

function classifyQuestion(text) {
  const lower = text.toLowerCase();
  for (const cat of CAT_KEYWORDS) {
    if (cat.words.some(w => lower.includes(w))) return cat.label;
  }
  return '일반 운세';
}

function getTimeSlot(createdAt) {
  const h = new Date(createdAt).getHours();
  if (h >= 5 && h < 12) return '오전';
  if (h >= 12 && h < 18) return '오후';
  if (h >= 18 && h < 23) return '저녁';
  return '새벽';
}

// SVG 도넛 차트
function DonutChart({ data, total }) {
  if (!total) return null;
  const R = 50, CX = 65, CY = 65;
  const circumference = 2 * Math.PI * R;
  const COLORS = ['var(--gold)','#5FAD7A','#4A8EC4','#E05A3A','#B8A035','#C08830','#9b7ede','#aaa'];

  let offset = 0;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const slice = { ...d, dash, offset, color: COLORS[i % COLORS.length] };
    offset += dash;
    return slice;
  });

  return (
    <svg width={130} height={130} viewBox="0 0 130 130">
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={s.color}
          strokeWidth={18}
          strokeDasharray={`${s.dash} ${circumference - s.dash}`}
          strokeDashoffset={-s.offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px` }}
        />
      ))}
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--t1)">{total}</text>
      <text x={CX} y={CY + 14} textAnchor="middle" fontSize="9" fill="var(--t4)">총 상담</text>
    </svg>
  );
}

// SVG 바 차트
function BarChart({ data, maxVal, colorVar = 'var(--gold)' }) {
  if (!data.length) return null;
  const H = 60, BAR_W = 18, GAP = 8;
  const totalW = data.length * (BAR_W + GAP);

  return (
    <svg width={totalW} height={H + 28} viewBox={`0 0 ${totalW} ${H + 28}`}>
      {data.map((d, i) => {
        const barH = maxVal > 0 ? Math.max(2, (d.value / maxVal) * H) : 2;
        const x = i * (BAR_W + GAP);
        return (
          <g key={i}>
            <rect
              x={x} y={H - barH} width={BAR_W} height={barH}
              rx={4} fill={colorVar} opacity={0.8}
            />
            <text
              x={x + BAR_W / 2} y={H + 12}
              textAnchor="middle" fontSize="8" fill="var(--t4)"
            >
              {d.label}
            </text>
            {d.value > 0 && (
              <text
                x={x + BAR_W / 2} y={H - barH - 3}
                textAnchor="middle" fontSize="8" fill="var(--t2)" fontWeight="700"
              >
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function StatsPage({ callApi }) {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadHistory();
  }, [user]);

  async function loadHistory() {
    setLoading(true);
    try {
      const kakaoId = user.kakaoId || user.id;
      const client = getAuthenticatedClient(kakaoId);
      const { data, error } = await client
        .from('consultation_history')
        .select('questions, created_at, slot')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) setHistory(data);
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false);
    }
  }

  // 통계 계산
  const total = history.length;

  const catCount = {};
  const monthCount = {};
  const slotCount = { 새벽: 0, 오전: 0, 오후: 0, 저녁: 0 };

  history.forEach(h => {
    (h.questions || []).forEach(q => {
      const cat = classifyQuestion(q);
      catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const mo = new Date(h.created_at).getMonth() + 1;
    monthCount[mo] = (monthCount[mo] || 0) + 1;
    const slot = getTimeSlot(h.created_at);
    slotCount[slot]++;
  });

  const catData = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([label, value]) => ({ label, value }));

  const now = new Date();
  const monthData = Array.from({ length: 6 }, (_, i) => {
    const mo = ((now.getMonth() - 5 + i) + 12) % 12 + 1;
    return { label: `${mo}월`, value: monthCount[mo] || 0 };
  });
  const maxMonth = Math.max(1, ...monthData.map(d => d.value));

  const slotData = ['새벽','오전','오후','저녁'].map(s => ({ label: s, value: slotCount[s] }));
  const maxSlot = Math.max(1, ...slotData.map(d => d.value));

  async function handleInsight() {
    if (!user) return;
    setInsightLoading(true);
    setInsight('');

    const summary = [
      `총 상담 횟수: ${total}회`,
      `가장 많이 상담한 주제: ${catData.slice(0, 3).map(d => `${d.label}(${d.value}회)`).join(', ')}`,
      `시간대별: 새벽 ${slotCount['새벽']}회, 오전 ${slotCount['오전']}회, 오후 ${slotCount['오후']}회, 저녁 ${slotCount['저녁']}회`,
    ].join('\n');

    try {
      const res = await callApi({
        userMessage: `나의 별숨 상담 패턴을 분석해줘:\n${summary}`,
        isAnalytics: true,
      });
      setInsight(res?.text || '');
    } catch {
      // 조용히 실패
    } finally {
      setInsightLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="page" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--t3)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <div>로그인 후 통계를 볼 수 있어요</div>
      </div>
    );
  }

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
          ✦ 나의 별숨 통계
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)' }}>
          내 별숨 사용 패턴
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 6 }}>
          총 <strong style={{ color: 'var(--t1)' }}>{total}번</strong>의 상담 기록을 분석했어요
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
          기록을 불러오는 중...
        </div>
      ) : total === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--t3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 'var(--sm)' }}>아직 상담 기록이 없어요.<br />첫 상담을 시작해보세요!</div>
        </div>
      ) : (
        <>
          {/* 카테고리 분포 */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>주제별 상담 분포</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <DonutChart data={catData} total={total} />
              <div style={{ flex: 1 }}>
                {catData.slice(0, 5).map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: ['var(--gold)','#5FAD7A','#4A8EC4','#E05A3A','#B8A035'][i],
                    }} />
                    <div style={{ flex: 1, fontSize: 'var(--xs)', color: 'var(--t2)' }}>{d.label}</div>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)' }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 월별 추이 */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>최근 6개월 상담 횟수</div>
            <div style={{ overflowX: 'auto' }}>
              <BarChart data={monthData} maxVal={maxMonth} />
            </div>
          </div>

          {/* 시간대 분포 */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>시간대별 패턴</div>
            <BarChart data={slotData} maxVal={maxSlot} colorVar="#4A8EC4" />
          </div>

          {/* AI 인사이트 */}
          <div style={{ padding: '20px 20px 0' }}>
            {!insight && !insightLoading && (
              <button
                onClick={handleInsight}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--goldf)',
                  border: '1.5px solid var(--acc)',
                  borderRadius: 'var(--r1)',
                  cursor: 'pointer',
                  fontFamily: 'var(--ff)',
                  fontSize: 'var(--sm)',
                  color: 'var(--gold)',
                  fontWeight: 700,
                }}
              >
                ✦ AI 패턴 인사이트 보기
              </button>
            )}

            {insightLoading && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--t4)', fontSize: 'var(--xs)' }}>
                <div style={{
                  width: 24, height: 24, border: '2px solid var(--line)',
                  borderTopColor: 'var(--gold)', borderRadius: '50%',
                  animation: 'orbSpin 0.8s linear infinite', margin: '0 auto 8px',
                }} />
                패턴을 분석하는 중이에요...
              </div>
            )}

            {insight && (
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--line)',
                borderRadius: 'var(--r2, 16px)', padding: '18px 16px',
              }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 12 }}>
                  ✦ AI 인사이트
                </div>
                {insight.split(/\[(패턴|의미|조언)\]/).map((part, i) => {
                  if (!part.trim()) return null;
                  const isLabel = ['패턴', '의미', '조언'].includes(part.trim());
                  if (isLabel) return (
                    <div key={i} style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t3)', marginTop: i > 0 ? 14 : 0, marginBottom: 4 }}>
                      [{part.trim()}]
                    </div>
                  );
                  return (
                    <div key={i} style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {part.trim()}
                    </div>
                  );
                })}
                <button
                  onClick={() => setInsight('')}
                  style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', cursor: 'pointer', fontFamily: 'var(--ff)' }}
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
