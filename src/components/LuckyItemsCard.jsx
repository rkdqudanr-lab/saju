// ═══════════════════════════════════════════════════════════
//  🍀 오늘의 행운 아이템 — 사주·절기 기반 결정론적 계산
// ═══════════════════════════════════════════════════════════

// 천간 인덱스(0~9) → 오행
const GAN_OHAENG = ['木','金','木','火','土','火','土','金','水','水'];
// 지지 인덱스(0~11) → 오행
const JI_OHAENG  = ['水','土','木','木','土','火','火','土','金','金','土','水'];

const OHAENG_DATA = {
  木: {
    color:     { name: '초록·청록', hex: '#5B9B5E', emoji: '🌿' },
    number:    [3, 8],
    direction: { label: '동쪽', emoji: '🧭' },
    food:      { items: ['나물', '새싹채소', '녹차', '브로콜리'], emoji: '🥦' },
    activity:  '산책이나 가벼운 스트레칭',
    keyword:   '성장과 시작',
  },
  火: {
    color:     { name: '빨강·주황', hex: '#E8624A', emoji: '🔴' },
    number:    [2, 7],
    direction: { label: '남쪽', emoji: '🧭' },
    food:      { items: ['고추', '토마토', '붉은 과일', '쌈채소'], emoji: '🍅' },
    activity:  '밝은 장소에서 사람들 만나기',
    keyword:   '열정과 표현',
  },
  土: {
    color:     { name: '황금·베이지', hex: '#C8A84B', emoji: '🟡' },
    number:    [5, 10],
    direction: { label: '중앙', emoji: '🧭' },
    food:      { items: ['고구마', '감자', '된장국', '잡곡밥'], emoji: '🍠' },
    activity:  '집 정리나 계획 세우기',
    keyword:   '안정과 신뢰',
  },
  金: {
    color:     { name: '흰색·은색', hex: '#8A9BB8', emoji: '⚪' },
    number:    [4, 9],
    direction: { label: '서쪽', emoji: '🧭' },
    food:      { items: ['무', '도라지', '배', '흰살 생선'], emoji: '🐟' },
    activity:  '결단이 필요한 일 처리하기',
    keyword:   '결단과 집중',
  },
  水: {
    color:     { name: '검정·남색', hex: '#4A6B8A', emoji: '🔵' },
    number:    [1, 6],
    direction: { label: '북쪽', emoji: '🧭' },
    food:      { items: ['검은콩', '미역', '블루베리', '해산물'], emoji: '🦑' },
    activity:  '혼자만의 사색이나 독서',
    keyword:   '지혜와 흐름',
  },
};

const LUCKY_WORDS = [
  '오늘은 작은 친절이 큰 행운을 불러와요.',
  '지금 이 순간이 새로운 시작이에요.',
  '흘러가는 것에 집착하지 않으면 더 좋은 것이 와요.',
  '오늘 당신의 직감을 믿어봐요.',
  '멈춰있어도 괜찮아요. 뿌리가 자라는 중이에요.',
  '오늘 만나는 인연엔 조금 더 마음을 열어봐요.',
  '작은 행동 하나가 오늘의 흐름을 바꿀 수 있어요.',
  '걱정은 잠깐 내려놓고, 지금 앞에 있는 것에 집중해봐요.',
];

/**
 * 오늘 날짜 + 사주 기반으로 행운 아이템 계산
 * @param {object} today - { year, month, day }
 * @param {object} saju  - getSaju 결과 (il.g, il.j 등)
 */
export function calcLuckyItems(today, saju) {
  const { year = 2026, month = 1, day = 1 } = today || {};

  // 일간 오행 (사주 있으면 사용, 없으면 날짜 기반)
  let dayOhaeng = '土';
  if (saju?.il?.g != null) {
    dayOhaeng = GAN_OHAENG[(saju.il.g - 1 + 10) % 10] || '土';
  } else {
    // fallback: 날짜 수 기반
    const ganIdx = (year * 12 + month * 30 + day) % 10;
    dayOhaeng = GAN_OHAENG[ganIdx] || '土';
  }

  const data = OHAENG_DATA[dayOhaeng];

  // 행운 숫자: 오행 숫자 + 오늘 날짜 변형
  const luckyNum = data.number[(day % 2)];

  // 행운의 말: 날짜 기반 순환
  const word = LUCKY_WORDS[(day + month) % LUCKY_WORDS.length];

  return { ohaeng: dayOhaeng, data, luckyNum, word };
}

export default function LuckyItemsCard({ today, saju }) {
  const { ohaeng, data, luckyNum, word } = calcLuckyItems(today, saju);

  const Card = ({ title, children }) => (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 'var(--r1)', padding: '12px 14px',
    }}>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      {/* 오늘의 기운 */}
      <div style={{
        textAlign: 'center', marginBottom: 20,
        padding: '16px', borderRadius: 'var(--r1)',
        background: `${data.color.hex}15`,
        border: `1px solid ${data.color.hex}40`,
      }}>
        <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{data.color.emoji}</div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 2 }}>오늘의 기운</div>
        <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: data.color.hex }}>
          {ohaeng}({data.keyword})
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', marginTop: 8, lineHeight: 1.6 }}>
          {word}
        </div>
      </div>

      {/* 2×2 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Card title="🎨 행운의 색">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: data.color.hex, flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--sm)', fontWeight: 600, color: 'var(--t1)' }}>
              {data.color.name}
            </span>
          </div>
        </Card>

        <Card title="🔢 행운의 숫자">
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>
            {luckyNum}
          </div>
        </Card>

        <Card title={`${data.direction.emoji} 행운의 방향`}>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 600, color: 'var(--t1)' }}>
            {data.direction.label}
          </div>
        </Card>

        <Card title="🌿 오늘의 키워드">
          <div style={{ fontSize: 'var(--xs)', fontWeight: 600, color: 'var(--t1)' }}>
            {data.keyword}
          </div>
        </Card>
      </div>

      {/* 음식 추천 */}
      <Card title={`${data.food.emoji} 오늘 먹으면 좋은 음식`}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {data.food.items.map(f => (
            <span key={f} style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 'var(--xs)',
              background: 'var(--goldf)', border: '1px solid var(--acc)',
              color: 'var(--gold)',
            }}>{f}</span>
          ))}
        </div>
      </Card>

      {/* 오늘의 활동 */}
      <div style={{
        marginTop: 10, padding: '10px 14px', borderRadius: 'var(--r1)',
        background: 'var(--card)', border: '1px solid var(--line)',
      }}>
        <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>✨ 오늘 하면 좋은 것 </span>
        <span style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 600 }}>{data.activity}</span>
      </div>

      <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 14 }}>
        매일 자정 기준으로 새로워져요 ✦
      </div>
    </div>
  );
}
