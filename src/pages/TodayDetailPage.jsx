import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import DailyStarCardV2 from '../components/DailyStarCardV2.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import '../styles/TodayDetailPage.css';
import {
  GACHA_POOL,
  GRADE_CONFIG as SPACE_GRADE_CONFIG,
  SAJU_POOL,
  SAJU_GRADE_CONFIG,
} from '../utils/gachaItems.js';

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite' }} />
    </div>
  );
}

const AXES_9 = [
  { key: 'overall', label: '종합' },
  { key: 'wealth', label: '금전' },
  { key: 'love', label: '애정' },
  { key: 'career', label: '직장' },
  { key: 'study', label: '학업' },
  { key: 'health', label: '건강' },
  { key: 'social', label: '대인' },
  { key: 'travel', label: '이동' },
  { key: 'create', label: '창의' },
];

const ASPECT_META = {
  overall: { label: '종합', emoji: '✨' },
  wealth: { label: '금전', emoji: '💰' },
  love: { label: '애정', emoji: '💞' },
  career: { label: '직장', emoji: '📈' },
  study: { label: '학업', emoji: '📚' },
  health: { label: '건강', emoji: '🌿' },
  social: { label: '대인', emoji: '🤝' },
  travel: { label: '이동', emoji: '🧭' },
  create: { label: '창의', emoji: '🎨' },
};

const ALL_SPIRIT_MAP = Object.fromEntries(
  [...GACHA_POOL, ...SAJU_POOL].map((item) => [item.id, item])
);

function getItemGradeConfig(item) {
  if (!item?.grade) return {};
  return SPACE_GRADE_CONFIG[item.grade] || SAJU_GRADE_CONFIG[item.grade] || {};
}

function getDailyAxisScores(baseScore, equippedItems) {
  const todayDate = new Date().toISOString().slice(0, 10);

  const getDailyNoise = (idx) => {
    const val = Number(todayDate.replace(/-/g, '')) + idx;
    return (((val * 9301 + 49297) % 233280) / 233280) * 16 - 8;
  };

  return AXES_9.map((axis, idx) => {
    const base = Math.max(20, Math.min(85, (baseScore || 60) + getDailyNoise(idx)));
    let bonus = 0;
    let boostItem = null;

    (equippedItems || []).forEach((item) => {
      if (item.aspectKey === axis.key) {
        bonus += item.boost || 0;
        if (!boostItem) boostItem = item;
      } else if (item.category === 'talisman' && item.type === axis.key) {
        const talismanBoost = item.boost || 10;
        bonus += talismanBoost;
        if (!boostItem) boostItem = item;
      }
    });

    return {
      key: axis.key,
      label: axis.label,
      base: Math.round(base),
      total: Math.min(100, Math.round(base + bonus)),
      bonus: Math.round(bonus),
      boostItem,
    };
  });
}

const AXIS_GUIDE_COPY = {
  overall: {
    do: '오늘 흐름을 한 번에 정리하고 가장 중요한 한 가지에 힘을 모아보세요.',
    caution: '여러 가지를 동시에 벌리면 전체 리듬이 쉽게 흐트러질 수 있어요.',
    high: '전반 흐름이 안정적이라 작은 선택도 좋은 결과로 이어질 가능성이 커요.',
    mid: '기복은 크지 않지만 집중 방향에 따라 체감이 달라질 수 있는 날이에요.',
    low: '전체 밸런스가 조금 처져 있어서 일정과 에너지 배분을 가볍게 가져가는 편이 좋아요.',
  },
  wealth: {
    do: '지출과 수입을 짧게 점검하고, 작은 이득도 놓치지 않게 기록해두세요.',
    caution: '기분 따라 결제하거나 즉흥적으로 판단하면 만족도가 떨어질 수 있어요.',
    high: '금전 감각이 또렷해서 실속 있는 선택을 하기 좋은 흐름이에요.',
    mid: '큰 손실은 아니지만 꼼꼼함이 있어야 체감 운이 올라가는 구간이에요.',
    low: '재물 흐름이 예민해서 소비와 계약은 한 번 더 확인하는 편이 안전해요.',
  },
  love: {
    do: '마음을 먼저 정리한 뒤 부드럽고 분명하게 표현해보세요.',
    caution: '상대의 반응을 너무 빨리 단정하면 서운함이 커질 수 있어요.',
    high: '감정 교류가 잘 붙는 날이라 관계를 따뜻하게 만들기 쉬워요.',
    mid: '작은 표현 하나가 분위기를 좌우하는 무난하지만 섬세한 흐름이에요.',
    low: '애정 에너지가 흔들릴 수 있어 감정보다 태도와 말투를 안정시키는 게 중요해요.',
  },
  career: {
    do: '업무 우선순위를 선명하게 정하고, 끝낼 일부터 정리해보세요.',
    caution: '성과를 서두르다 보면 실수나 커뮤니케이션 누락이 생길 수 있어요.',
    high: '일 처리 감각과 존재감이 살아나는 흐름이라 추진력이 붙기 쉬워요.',
    mid: '평소 하던 일은 무난하지만 한 번 더 정리해야 결과가 좋아져요.',
    low: '업무 피로감이나 압박이 커질 수 있으니 속도보다 정확도를 챙기는 게 좋아요.',
  },
  study: {
    do: '짧게 끊어서 집중하고, 오늘 얻은 핵심만 남기는 방식이 잘 맞아요.',
    caution: '한 번에 많이 하려 하면 집중력이 금방 퍼질 수 있어요.',
    high: '이해력과 몰입감이 올라와서 공부나 정보 정리에 힘이 실리기 쉬워요.',
    mid: '집중 시간만 잘 관리하면 성과를 무난하게 낼 수 있는 흐름이에요.',
    low: '머리가 쉽게 분산될 수 있으니 학습량보다 리듬 회복을 먼저 챙겨보세요.',
  },
  health: {
    do: '수면, 수분, 식사 같은 기본 리듬을 안정적으로 챙겨보세요.',
    caution: '무리한 일정이나 회복 없는 강행군은 컨디션 저하로 바로 이어질 수 있어요.',
    high: '몸의 반응이 비교적 가벼워서 생활 리듬을 잘 유지하면 더 좋아져요.',
    mid: '큰 무리는 아니지만 피로 누적을 방치하지 않는 게 중요한 날이에요.',
    low: '체력과 회복력이 예민할 수 있어 휴식 우선 전략이 특히 중요해요.',
  },
  social: {
    do: '짧더라도 먼저 안부를 건네고, 편한 관계부터 연결을 넓혀보세요.',
    caution: '분위기에 맞추느라 내 페이스를 잃으면 피로가 커질 수 있어요.',
    high: '사람 운이 부드럽게 열려서 도움과 연결이 자연스럽게 붙기 쉬워요.',
    mid: '무난한 흐름이지만 먼저 움직일수록 체감이 좋아지는 날이에요.',
    low: '대인 에너지가 쉽게 소모될 수 있어 약속과 감정 소모를 줄이는 편이 좋아요.',
  },
  travel: {
    do: '이동 전후 시간을 여유 있게 잡고 준비물을 미리 체크해두세요.',
    caution: '서두르거나 즉흥적으로 경로를 바꾸면 피곤함이 커질 수 있어요.',
    high: '이동과 변화에 유연하게 대응하기 좋은 흐름이라 발걸음이 가벼워질 수 있어요.',
    mid: '보통 수준의 흐름이라 준비만 잘하면 무난하게 지나가기 쉬워요.',
    low: '이동 중 변수에 예민할 수 있어 일정 압축보다 여유를 두는 쪽이 좋아요.',
  },
  create: {
    do: '떠오르는 생각을 바로 적고, 완성보다 초안을 만드는 데 집중해보세요.',
    caution: '처음부터 완벽하게 만들려 하면 오히려 흐름이 끊길 수 있어요.',
    high: '영감과 표현력이 살아 있어 창작이나 기획 아이디어를 펼치기 좋은 날이에요.',
    mid: '아이디어는 나오지만 정리 방식에 따라 결과 차이가 생기기 쉬운 흐름이에요.',
    low: '창의 에너지가 잠깐 막힐 수 있으니 억지 생산보다 입력과 환기가 더 효과적이에요.',
  },
};

function getAxisInsight(score) {
  const guide = AXIS_GUIDE_COPY[score.key] || AXIS_GUIDE_COPY.overall;
  const reason =
    score.total >= 75 ? guide.high :
    score.total >= 50 ? guide.mid :
    guide.low;

  const itemReason = score.bonus > 0 && score.boostItem
    ? `${score.boostItem.name} 효과로 +${score.bonus}점 보정이 들어가 있어요.`
    : '오늘은 아직 이 영역에 아이템 보정이 직접 들어가진 않았어요.';

  const baseReason = score.bonus > 0
    ? `기본 흐름은 ${score.base}점이고, 아이템/부적으로 ${score.total}점까지 올라왔어요.`
    : `기본 흐름이 ${score.base}점으로 형성돼 있고 현재 총점은 ${score.total}점이에요.`;

  return {
    reason,
    itemReason,
    baseReason,
    do: guide.do,
    caution: guide.caution,
  };
}

function getRecommendedRow(score, ownedRows) {
  if (!ownedRows?.length) return null;

  const matchedRows = ownedRows.filter((row) => row.item?.aspectKey === score.key);
  if (matchedRows.length === 0) return null;

  return [...matchedRows].sort((a, b) => (b.item?.boost || 0) - (a.item?.boost || 0))[0];
}

function AxisInsightPanel({ scores, ownedRows, onUseItem, onInspectItem, setStep, canUseItems = true }) {
  const [openKey, setOpenKey] = useState(scores[0]?.key ?? null);

  useEffect(() => {
    if (!scores.some((score) => score.key === openKey)) {
      setOpenKey(scores[0]?.key ?? null);
    }
  }, [scores, openKey]);

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 6 }}>
        SCORE GUIDE
      </div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 12, lineHeight: 1.6 }}>
        각 영역을 눌러서 왜 이런 점수가 나왔는지, 오늘 해보면 좋은 일과 주의할 점을 바로 볼 수 있어요.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scores.map((score) => {
          const isOpen = openKey === score.key;
          const insight = getAxisInsight(score);
          const recommendedRow = getRecommendedRow(score, ownedRows);
          const recommendedItem = recommendedRow?.item || null;

          return (
            <div
              key={score.key}
              style={{
                borderRadius: 14,
                border: `1px solid ${isOpen ? 'var(--acc)' : 'var(--line)'}`,
                background: isOpen ? 'var(--bg1)' : 'transparent',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenKey(isOpen ? null : score.key)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--ff)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 18 }}>{ASPECT_META[score.key]?.emoji || '✦'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)' }}>{score.label}</div>
                    <div style={{ fontSize: 10, color: score.bonus > 0 ? 'var(--gold)' : 'var(--t4)' }}>
                      {score.total}점 {score.bonus > 0 ? `· 아이템 +${score.bonus}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink: 0, color: isOpen ? 'var(--gold)' : 'var(--t4)', fontSize: 12 }}>
                  {isOpen ? '▲' : '▼'}
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--line)' }}>
                  <div style={{ marginTop: 12, fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>
                    {insight.reason}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--t4)', lineHeight: 1.6 }}>
                    {insight.baseReason}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: score.bonus > 0 ? 'var(--gold)' : 'var(--t4)', lineHeight: 1.6 }}>
                    {insight.itemReason}
                  </div>

                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    <div style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>DO</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>{insight.do}</div>
                    </div>
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, marginBottom: 4 }}>주의</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.6 }}>{insight.caution}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>추천 아이템 연결</div>
                    {recommendedItem ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{ fontSize: 18 }}>{recommendedItem.emoji}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 700, lineHeight: 1.4 }}>
                                {recommendedItem.name}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--gold)' }}>
                                +{recommendedItem.boost}점
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onInspectItem?.(recommendedRow)}
                            style={{
                              flexShrink: 0,
                              padding: '6px 10px',
                              borderRadius: 999,
                              border: '1px solid var(--line)',
                              background: 'transparent',
                              color: 'var(--t3)',
                              fontSize: 10,
                              fontFamily: 'var(--ff)',
                              cursor: 'pointer',
                            }}
                          >
                            보기
                          </button>
                        </div>
                        <button
                          onClick={() => onUseItem?.(recommendedRow)}
                          disabled={!canUseItems}
                          style={{
                            width: '100%',
                            marginTop: 8,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1px solid var(--acc)',
                            background: 'var(--goldf)',
                            color: 'var(--gold)',
                            fontSize: 'var(--xs)',
                            fontWeight: 700,
                            fontFamily: 'var(--ff)',
                            cursor: canUseItems ? 'pointer' : 'not-allowed',
                            opacity: canUseItems ? 1 : 0.45,
                          }}
                        >
                          이 영역 아이템 바로 사용
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6 }}>
                          지금 가진 아이템 중 이 영역에 바로 연결되는 아이템이 없어요.
                        </div>
                        <button
                          onClick={() => setStep?.(38)}
                          style={{
                            width: '100%',
                            marginTop: 8,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1px solid var(--line)',
                            background: 'transparent',
                            color: 'var(--t3)',
                            fontSize: 'var(--xs)',
                            fontFamily: 'var(--ff)',
                            cursor: 'pointer',
                          }}
                        >
                          아이템 보러가기
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyRadarChart({ baseScore, equippedItems }) {
  const scores = getDailyAxisScores(baseScore, equippedItems);
  const cx = 130;
  const cy = 130;
  const r = 90;
  const n = AXES_9.length;
  const angleStep = (2 * Math.PI) / n;
  const toXY = (angle, radius) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  const basePoints = scores.map((s, i) => {
    const pt = toXY(angleStep * i, (s.base / 100) * r);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const totalPoints = scores.map((s, i) => {
    const pt = toXY(angleStep * i, (s.total / 100) * r);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const bonusAcc = scores.reduce((acc, s) => acc + s.bonus, 0);
  const weakestScore = [...scores].sort((a, b) => a.total - b.total)[0];
  const strongestScore = [...scores].sort((a, b) => b.total - a.total)[0];

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>
            오늘의 운세 점수
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>
            {bonusAcc > 0
              ? <span style={{ color: 'var(--gold)' }}>아이템 효과가 점수에 바로 반영되고 있어요.</span>
              : '오늘 운세를 본 뒤 더 올리고 싶은 항목에 아이템을 사용할 수 있어요.'}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 8,
        marginBottom: 14,
      }}>
        <div style={{ padding: '10px 12px', background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--t4)', marginBottom: 4 }}>9개 영역 평균</div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)' }}>
            {Math.round(scores.reduce((sum, score) => sum + score.total, 0) / scores.length)}점
          </div>
        </div>
        <div style={{ padding: '10px 12px', background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--t4)', marginBottom: 4 }}>가장 약한 영역</div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)' }}>
            {weakestScore.label} {weakestScore.total}점
          </div>
        </div>
        <div style={{ padding: '10px 12px', background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--t4)', marginBottom: 4 }}>가장 강한 영역</div>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)' }}>
            {strongestScore.label} {strongestScore.total}점
          </div>
        </div>
      </div>

      <svg viewBox="0 0 260 260" width="100%" style={{ maxWidth: 280, display: 'block', margin: '0 auto' }}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((level) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = toXY(angleStep * i, level * r);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={level} points={pts} fill="none" stroke="var(--line)" strokeWidth="1" />;
        })}

        {Array.from({ length: n }, (_, i) => {
          const outer = toXY(angleStep * i, r);
          return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--line)" strokeWidth="1" />;
        })}

        <polygon points={basePoints} fill="rgba(255,255,255,0.06)" stroke="var(--t4)" strokeWidth="1.5" strokeLinejoin="round" />

        {bonusAcc > 0 && (
          <polygon
            points={totalPoints}
            fill="rgba(232,176,72,0.15)"
            stroke="var(--gold)"
            strokeWidth="2"
            strokeLinejoin="round"
            style={{ transition: 'all 0.5s ease-out' }}
          />
        )}

        {scores.map((s, i) => {
          const pt = toXY(angleStep * i, (s.total / 100) * r);
          return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill={s.bonus > 0 ? 'var(--gold)' : 'var(--t4)'} style={{ transition: 'all 0.5s ease' }} />;
        })}

        {scores.map((s, i) => {
          const pt = toXY(angleStep * i, r + 22);
          const hasBonus = s.bonus > 0;
          return (
            <text
              key={i}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={hasBonus ? 'var(--gold)' : 'var(--t2)'}
              fontSize={hasBonus ? '12' : '10'}
              fontWeight={hasBonus ? '700' : '400'}
              fontFamily="var(--ff)"
            >
              {s.label}
            </text>
          );
        })}
      </svg>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {scores.map((s) => (
          <div key={s.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ minWidth: 34, fontSize: 11, color: s.bonus > 0 ? 'var(--gold)' : 'var(--t3)', fontWeight: s.bonus > 0 ? 700 : 400 }}>
                {s.label}
              </span>
              <div style={{ flex: 1, height: 5, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${s.total}%`,
                    background: s.bonus > 0 ? 'linear-gradient(90deg, var(--t4) 0%, var(--gold) 100%)' : 'var(--t4)',
                    borderRadius: 3,
                    transition: 'width 0.6s ease-out',
                  }}
                />
              </div>
              <span style={{ minWidth: 30, textAlign: 'right', fontSize: 11, fontWeight: 700, color: s.bonus > 0 ? 'var(--gold)' : 'var(--t3)' }}>
                {s.total}
              </span>
            </div>
            {s.bonus > 0 && s.boostItem && (
              <div style={{ paddingLeft: 42, marginTop: 2, fontSize: 10, color: 'var(--gold)', lineHeight: 1.4 }}>
                {s.boostItem.name} 효과로 +{s.bonus}점이 반영됐어요.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyTrendChart({ kakaoId, todayScore }) {
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    if (!kakaoId) {
      setTrend([]);
      return;
    }
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    const client = getAuthenticatedClient(String(kakaoId));
    client.from('daily_cache')
      .select('cache_date, content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_type', 'horoscope_score')
      .in('cache_date', last7)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((row) => { map[row.cache_date] = Number(row.content); });
        const today = new Date().toISOString().slice(0, 10);
        if (todayScore != null) map[today] = todayScore;
        setTrend(last7.reverse().map((date) => map[date] ?? null));
      })
      .catch(() => setTrend([]));
  }, [kakaoId, todayScore]);

  useEffect(() => {
    if (todayScore == null || !trend) return;
    setTrend((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[6] = todayScore;
      return next;
    });
  }, [todayScore]);

  if (trend === null) {
    return (
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)', textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 0.8s linear infinite', margin: '0 auto 8px' }} />
        최근 점수를 불러오는 중...
      </div>
    );
  }

  const hasAnyScore = trend.some((v) => v !== null);
  if (!hasAnyScore) return null;

  const validVals = trend.filter((v) => v !== null);
  const max = Math.max(...validVals);
  const min = Math.min(...validVals);
  const range = max - min || 1;
  const toY = (val) => 100 - ((val - min) / range) * 80 - 10;

  const segments = [];
  let seg = [];
  trend.forEach((val, i) => {
    if (val !== null) {
      seg.push(`${(i / 6) * 100},${toY(val)}`);
    } else {
      if (seg.length > 1) segments.push(seg.join(' '));
      seg = [];
    }
  });
  if (seg.length > 1) segments.push(seg.join(' '));

  const todayVal = trend[6];
  const yesterdayVal = trend.slice(0, 6).reverse().find((v) => v !== null);
  const isUp = todayVal !== null && yesterdayVal !== null && todayVal >= yesterdayVal;

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>
            최근 운세 흐름
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>
            {todayVal !== null && yesterdayVal !== null
              ? <>어제보다 <strong style={{ color: isUp ? '#ff7832' : '#7b9ec4' }}>{isUp ? '상승' : '하락'}</strong>했어요.</>
              : '오늘 점수가 쌓이면 흐름이 함께 기록돼요.'}
          </div>
        </div>
        {todayVal !== null && <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700 }}>{todayVal}점</div>}
      </div>

      <div style={{ position: 'relative', width: '100%', height: 60 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {segments.map((pts, idx) => (
            <polyline key={idx} fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pts} style={{ opacity: 0.8 }} />
          ))}
          {trend.map((val, i) => {
            if (val === null) return null;
            const x = (i / 6) * 100;
            const y = toY(val);
            return i === 6
              ? <circle key={i} cx={x} cy={y} r="4" fill="var(--gold)" stroke="var(--bg1)" strokeWidth="2" />
              : <circle key={i} cx={x} cy={y} r="2.5" fill="var(--gold)" opacity="0.5" />;
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--t4)' }}>
        <span>6일 전</span>
        <span>오늘</span>
      </div>
    </div>
  );
}

function PurifyOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div className="purify-overlay" aria-hidden="true">
      <div className="purify-orb">
        <div className="purify-orb-core" />
        <div className="purify-ring purify-ring-1" />
        <div className="purify-ring purify-ring-2" />
        <div className="purify-ring purify-ring-3" />
      </div>
      <div className="purify-sparks">
        {['✦', '✧', '✦', '✧', '✦'].map((spark, idx) => (
          <span key={idx} className={`purify-spark purify-spark-${idx + 1}`}>{spark}</span>
        ))}
      </div>
      <div className="purify-text">정화 재점 중...</div>
    </div>
  );
}

function BoostCTA({ hasBoostedToday, canPurify, remaining, onPurify, isPurifying, setStep }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r1)',
      padding: '14px 16px',
      marginBottom: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div>
        <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 4 }}>
          기운 보강
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6 }}>
          {hasBoostedToday
            ? '아이템을 쓴 뒤 다시 정화 재점을 눌러 오늘 흐름을 새로 확인할 수 있어요.'
            : '샵이나 보관함에서 오늘 점수를 올릴 아이템을 더 준비할 수 있어요.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setStep(38)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'transparent',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--r1)',
            color: 'var(--t3)',
            fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
          }}
        >
          내 아이템 보기
        </button>
        {canPurify ? (
          <button
            onClick={onPurify}
            disabled={isPurifying}
            style={{
              flex: 1.3,
              padding: '10px 12px',
              background: 'var(--goldf)',
              border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)',
              color: 'var(--gold)',
              fontWeight: 700,
              fontSize: 'var(--xs)',
              fontFamily: 'var(--ff)',
              cursor: isPurifying ? 'not-allowed' : 'pointer',
              opacity: isPurifying ? 0.6 : 1,
            }}
          >
            {isPurifying ? '재점 중...' : `정화재점 (${remaining}회 남음)`}
          </button>
        ) : (
          <div style={{
            flex: 1.1,
            padding: '10px 12px',
            background: 'var(--bg3)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--xs)',
            color: 'var(--t4)',
          }}>
            오늘 재점 완료
          </div>
        )}
      </div>
    </div>
  );
}

function ItemDetailModal({ row, onClose, onUse, canUseItems = true }) {
  if (!row?.item) return null;
  const item = row.item;
  const cfg = getItemGradeConfig(item);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(6, 8, 16, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--bg1)',
          borderRadius: 20,
          border: `1px solid ${cfg.border || 'var(--line)'}`,
          boxShadow: cfg.border ? `0 20px 50px ${cfg.border}` : '0 20px 50px rgba(0,0,0,.25)',
          padding: '22px 20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: cfg.bg || 'var(--bg2)',
            border: `1px solid ${cfg.border || 'var(--line)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            flexShrink: 0,
          }}>
            {item.emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: cfg.color || 'var(--gold)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 6 }}>
              {cfg.label || item.grade}
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 800, lineHeight: 1.35, marginBottom: 6 }}>
              {item.name}
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700 }}>
              {item.effectLabel || `+${item.boost} boost`}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
            ITEM STORY
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>
            {item.description || item.effect || '설명이 아직 준비되지 않았어요.'}
          </div>
        </div>

        {item.effect && (
          <div style={{ background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
              TODAY EFFECT
            </div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>
              {item.effect}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px 12px',
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--t3)',
              fontSize: 'var(--xs)',
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
          <button
            onClick={() => onUse(row)}
            disabled={!canUseItems}
            style={{
              flex: 1.4,
              padding: '11px 12px',
              borderRadius: 12,
              border: '1px solid var(--acc)',
              background: 'var(--goldf)',
              color: 'var(--gold)',
              fontSize: 'var(--xs)',
              fontWeight: 700,
              fontFamily: 'var(--ff)',
              cursor: canUseItems ? 'pointer' : 'not-allowed',
              opacity: canUseItems ? 1 : 0.45,
            }}
          >
            이 아이템 쓰기
          </button>
        </div>
      </div>
    </div>
  );
}

function OneShotItemPicker({ scores, ownedRows, onUse, onInspect, canUseItems = true }) {
  const byAxis = {};
  for (const row of ownedRows) {
    const aspectKey = row.item?.aspectKey;
    if (!aspectKey || !ASPECT_META[aspectKey]) continue;
    if (!byAxis[aspectKey]) byAxis[aspectKey] = [];
    byAxis[aspectKey].push(row);
  }

  const hasAny = Object.values(byAxis).some((list) => list.length > 0);
  if (!hasAny) return null;
  const sortedScores = [...scores].sort((a, b) => {
    if (a.total !== b.total) return a.total - b.total;
    return b.bonus - a.bonus;
  });

  return (
    <div style={{
      background: 'var(--bg2)',
      borderRadius: 'var(--r1)',
      border: '1px solid var(--line)',
      padding: 16,
      marginBottom: 16,
    }}>
      <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 6 }}>
        TODAY BOOST ITEMS
      </div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 14, lineHeight: 1.6 }}>
        오늘 별숨을 본 뒤 더 올리고 싶은 항목에 바로 아이템을 써보세요. 카드를 누르면 설명을 먼저 볼 수 있어요.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sortedScores.map((score) => {
          const rows = byAxis[score.key] || [];
          if (rows.length === 0) return null;

          return (
            <div key={score.key} style={{ padding: 12, borderRadius: 14, background: 'var(--bg1)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{ASPECT_META[score.key]?.emoji || '✦'}</span>
                  <div>
                    <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)' }}>{score.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>현재 {score.total}점</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>
                  사용 가능 {rows.length}개
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                {rows.map((row) => {
                  const item = row.item;
                  const cfg = getItemGradeConfig(item);
                  return (
                    <button
                      key={row.rowId}
                      onClick={() => onInspect(row)}
                      style={{
                        flexShrink: 0,
                        minWidth: 132,
                        textAlign: 'left',
                        borderRadius: 14,
                        border: `1px solid ${cfg.border || 'var(--line)'}`,
                        background: cfg.bg || 'var(--bg2)',
                        padding: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{item.emoji}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: cfg.color || 'var(--gold)', fontWeight: 700 }}>
                            {cfg.label || item.grade}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--t1)', fontWeight: 700, lineHeight: 1.3, wordBreak: 'keep-all' }}>
                            {item.name}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.45, minHeight: 28 }}>
                        {item.description || item.effect}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                        <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>
                          +{item.boost}점
                        </span>
                        <span
                          onClick={(e) => {
                            if (!canUseItems) return;
                            e.stopPropagation();
                            onUse(row);
                          }}
                          style={{
                            padding: '5px 9px',
                            borderRadius: 999,
                            border: '1px solid var(--acc)',
                            background: 'var(--goldf)',
                            color: 'var(--gold)',
                            fontSize: 10,
                            fontWeight: 700,
                            opacity: canUseItems ? 1 : 0.45,
                          }}
                        >
                          사용
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TodayDetailPage({
  dailyResult,
  dailyLoading,
  dailyCount = 0,
  DAILY_MAX = 3,
  gamificationState,
  onBlockBadtime = null,
  isBlockingBadtime,
  setStep,
  onRefresh,
}) {
  const user = useAppStore((s) => s.user);
  const kakaoId = user?.kakaoId || user?.id;
  const equippedTalisman = useAppStore((s) => s.equippedTalisman);
  const storeEquippedItems = useAppStore((s) => s.equippedItems) || [];
  const [usedItems, setUsedItems] = useState([]);
  const [ownedRows, setOwnedRows] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isPurifying, setIsPurifying] = useState(false);

  const mergedEquippedItems = useMemo(() => ([
    ...(equippedTalisman
      ? [...storeEquippedItems.filter((item) => item.id !== equippedTalisman.id), equippedTalisman]
      : storeEquippedItems),
    ...usedItems,
  ]), [equippedTalisman, storeEquippedItems, usedItems]);

  const axisScores = useMemo(
    () => getDailyAxisScores(dailyResult?.score, mergedEquippedItems),
    [dailyResult?.score, mergedEquippedItems]
  );

  useEffect(() => {
    if (!kakaoId) return;
    const client = getAuthenticatedClient(String(kakaoId));
    client.from('daily_cache')
      .select('content')
      .eq('kakao_id', String(kakaoId))
      .eq('cache_date', new Date().toISOString().slice(0, 10))
      .eq('cache_type', 'daily_transient_items')
      .maybeSingle()
      .then(({ data }) => {
        try {
          const ids = JSON.parse(data?.content || '[]');
          if (!Array.isArray(ids)) {
            setUsedItems([]);
            return;
          }
          setUsedItems(ids.map((id) => ALL_SPIRIT_MAP[String(id)]).filter(Boolean));
        } catch {
          setUsedItems([]);
        }
      })
      .catch(() => setUsedItems([]));
  }, [kakaoId]);

  useEffect(() => {
    if (!kakaoId || !dailyResult) return;
    const client = getAuthenticatedClient(String(kakaoId));
    client.from('user_shop_inventory')
      .select('id, item_id')
      .eq('kakao_id', String(kakaoId))
      .then(({ data }) => {
        const rows = (data || [])
          .map((row) => ({ rowId: row.id, item: ALL_SPIRIT_MAP[String(row.item_id)] }))
          .filter((row) => row.item?.aspectKey);
        setOwnedRows(rows);
      })
      .catch(() => setOwnedRows([]));
  }, [kakaoId, dailyResult]);

  const canPurify = !isPurifying && !dailyLoading && dailyCount < DAILY_MAX;
  const remaining = DAILY_MAX - dailyCount;
  const canUseItems = canPurify && !!onRefresh;

  const handleUseItem = useCallback(async (row) => {
    if (!kakaoId || !row?.item || !canUseItems) return;
    setIsPurifying(true);
    const nextUsedItems = [...usedItems, row.item];
    const animPromise = new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      await Promise.all([
        onRefresh?.({
          transientItems: nextUsedItems,
          skipBpCharge: true,
          skipConfirm: true,
          saveHistory: false,
        }),
        animPromise,
      ]);

      const client = getAuthenticatedClient(String(kakaoId));
      await client.from('user_shop_inventory').delete().eq('id', row.rowId);
      await client.from('daily_cache').upsert({
        kakao_id: String(kakaoId),
        cache_date: new Date().toISOString().slice(0, 10),
        cache_type: 'daily_transient_items',
        content: JSON.stringify(nextUsedItems.map((item) => item.id)),
      }, { onConflict: 'kakao_id,cache_date,cache_type' });
      setOwnedRows((prev) => (prev || []).filter((item) => item.rowId !== row.rowId));
      setUsedItems(nextUsedItems);
      setSelectedRow(null);
    } catch {
      await animPromise;
    } finally {
      setIsPurifying(false);
    }
  }, [kakaoId, canUseItems, onRefresh, usedItems]);

  const handlePurify = useCallback(async () => {
    if (isPurifying || dailyLoading || dailyCount >= DAILY_MAX) return;
    setIsPurifying(true);
    const animPromise = new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      await Promise.all([
        onRefresh?.({
          transientItems: usedItems,
          skipBpCharge: true,
          skipConfirm: true,
          saveHistory: false,
        }),
        animPromise,
      ]);
    } catch {
      await animPromise;
    } finally {
      setIsPurifying(false);
    }
  }, [isPurifying, dailyLoading, dailyCount, DAILY_MAX, onRefresh, usedItems]);

  return (
    <div className="today-detail-container">
      <PurifyOverlay visible={isPurifying} />

      <div className="today-detail-header">
        <button className="today-detail-back-btn" onClick={() => setStep(0)} aria-label="홈으로 돌아가기">
          ←
        </button>
        <span className="today-detail-title">오늘 하루 나의 별숨</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={`today-detail-content${isPurifying ? ' today-detail-content--blurred' : ''}`}>
        {dailyLoading && !dailyResult ? (
          <PageSpinner />
        ) : dailyResult ? (
          <Suspense fallback={<PageSpinner />}>
            <DailyRadarChart baseScore={dailyResult?.score} equippedItems={mergedEquippedItems} />
            <AxisInsightPanel
              scores={axisScores}
              ownedRows={ownedRows}
              onUseItem={handleUseItem}
              onInspectItem={setSelectedRow}
              setStep={setStep}
              canUseItems={canUseItems}
            />

            {ownedRows && ownedRows.length > 0 && (
              <OneShotItemPicker
                scores={axisScores}
                ownedRows={ownedRows}
                onUse={handleUseItem}
                onInspect={setSelectedRow}
                canUseItems={canUseItems}
              />
            )}

            <WeeklyTrendChart kakaoId={kakaoId} todayScore={dailyResult?.score} />

            <BoostCTA
              hasBoostedToday={usedItems.length > 0}
              canPurify={canPurify}
              remaining={remaining}
              onPurify={handlePurify}
              isPurifying={isPurifying}
              setStep={setStep}
            />

            <DailyStarCardV2
              result={dailyResult}
              onBlockBadtime={onBlockBadtime}
              isBlocking={isBlockingBadtime}
              canBlockBadtime={onBlockBadtime != null}
              currentBp={gamificationState?.currentBp || 0}
            />
          </Suspense>
        ) : (
          <div className="today-detail-empty">
            <div className="today-detail-empty-icon" style={{ fontSize: '2rem', color: 'var(--t4)', marginBottom: 8 }}>✦</div>
            <div className="today-detail-empty-text">
              운세를 불러오지 못했어요.<br />
              <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>아래 버튼으로 다시 시도해 주세요.</span>
            </div>
            {onRefresh && (
              <button
                className="today-intro-btn-primary"
                style={{ marginTop: 8, width: 'auto', padding: '12px 28px' }}
                onClick={onRefresh}
                disabled={dailyLoading}
              >
                다시 불러오기
              </button>
            )}
          </div>
        )}
      </div>

      <div className="today-detail-footer">
        <button className="today-detail-btn-home" onClick={() => setStep(0)}>
          홈으로
        </button>
        {usedItems.length > 0 && canPurify && (
          <button
            className="today-detail-btn-home"
            onClick={handlePurify}
            disabled={isPurifying}
            style={{
              background: 'var(--goldf)',
              border: '1px solid var(--acc)',
              color: 'var(--gold)',
              marginLeft: 8,
              opacity: isPurifying ? 0.7 : 1,
            }}
          >
            {isPurifying ? '재점 중...' : `정화재점 (${remaining}회 남음)`}
          </button>
        )}
      </div>

      {selectedRow && (
        <ItemDetailModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onUse={handleUseItem}
          canUseItems={canUseItems}
        />
      )}
    </div>
  );
}
