/**
 * StatsPage — 나의 별숨 통계 대시보드
 * consultation_history에서 상담 기록을 불러와 SVG 차트로 시각화하고
 * AI 인사이트(isAnalytics 모드)를 제공합니다.
 */

import { useState, useEffect } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import { saveStatsCard } from '../utils/imageExport.js';

// ── 점수 히트맵 (최근 365일) ──────────────────────────────────
const SCORE_COLORS = [
  { min: 0,  max: 0,   color: 'var(--bg3)' },      // no data
  { min: 1,  max: 29,  color: '#E05A3A' },           // 위험 (붉은)
  { min: 30, max: 49,  color: '#C08830' },           // 주의 (갈색)
  { min: 50, max: 69,  color: '#4A8EC4' },           // 보통 (파랑)
  { min: 70, max: 84,  color: '#5FAD7A' },           // 좋음 (초록)
  { min: 85, max: 100, color: '#C89030' },           // 최고 (골드)
];

function getScoreColor(score) {
  if (!score) return SCORE_COLORS[0].color;
  return (SCORE_COLORS.find(c => score >= c.min && score <= c.max) || SCORE_COLORS[0]).color;
}

function ScoreHeatmap({ scores }) {
  // 오늘 기준 최근 365일 날짜 배열
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const scoreMap = {};
  scores.forEach(s => { scoreMap[s.score_date] = s.score; });

  // 7×52 그리드 (52주 × 7일)
  const weeks = [];
  for (let w = 0; w < 53; w++) {
    weeks.push(days.slice(w * 7, w * 7 + 7));
  }

  const [tooltip, setTooltip] = useState(null);
  const CELL = 10, GAP = 2;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: GAP, width: 'fit-content' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
            {week.map(date => {
              const s = scoreMap[date];
              return (
                <div
                  key={date}
                  title={s ? `${date}: ${s}점` : date}
                  style={{
                    width: CELL, height: CELL,
                    borderRadius: 2,
                    background: getScoreColor(s),
                    cursor: s ? 'pointer' : 'default',
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* 범례 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: '10px', color: 'var(--t4)' }}>낮음</span>
        {SCORE_COLORS.slice(1).map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
        ))}
        <span style={{ fontSize: '10px', color: 'var(--t4)' }}>높음</span>
      </div>
    </div>
  );
}

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
  const { user, gamificationState, isDark } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [scores, setScores] = useState([]);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const kakaoId = user.kakaoId || user.id;
    loadHistory(kakaoId);
    loadScores(kakaoId);
  }, [user?.id]);

  async function loadHistory(kakaoId) {
    setLoading(true);
    try {
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

  async function loadScores(kakaoId) {
    try {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const client = getAuthenticatedClient(kakaoId);
      const { data } = await client
        .from('daily_scores')
        .select('score_date, score')
        .gte('score_date', yearAgo.toISOString().slice(0, 10))
        .order('score_date', { ascending: true });
      if (data) setScores(data);
    } catch {
      // 조용히 실패
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

  function handleShare() {
    setSharing(true);
    try {
      saveStatsCard({
        nickname: user?.nickname || '별숨 유저',
        total,
        catData,
        monthData,
        slotCount,
        guardianLevel: gamificationState?.guardianLevel ?? 1,
        currentBp: gamificationState?.currentBp ?? 0,
        isDark: isDark ?? true,
      });
    } finally {
      setSharing(false);
    }
  }

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
      const res = await callApi(`나의 별숨 상담 패턴을 분석해줘:\n${summary}`, {
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
        <div style={{ fontSize: '1.6rem', marginBottom: 12, color: 'var(--t4)' }}>✦</div>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)' }}>
            내 별숨 사용 패턴
          </div>
          {total > 0 && (
            <button
              onClick={handleShare}
              disabled={sharing}
              style={{
                padding: '7px 14px',
                border: '1px solid var(--line)',
                borderRadius: 20,
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
                fontSize: 'var(--xs)',
                color: 'var(--t3)',
              }}
            >
              {sharing ? '저장 중...' : '📤 공유'}
            </button>
          )}
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

          {/* 일별 점수 히트맵 */}
          {scores.length > 0 && (
            <div style={{ padding: '20px 20px 0' }}>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>별숨 점수 1년 기록</div>
              <ScoreHeatmap scores={scores} />
            </div>
          )}

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
