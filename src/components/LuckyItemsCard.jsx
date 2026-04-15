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

/** dailyResult.text의 [별숨픽] 섹션에서 항목 추출 */
function parseSynergyFromResult(text) {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const idx = lines.findIndex(l => l.startsWith('[별숨픽]') || l.startsWith('[별숨 픽]'));
  if (idx === -1) return null;
  const end = lines.findIndex((l, i) => i > idx && l.startsWith('['));
  const section = lines.slice(idx + 1, end === -1 ? undefined : end);
  const s = { food: '', place: '', color: '', number: '', direction: '' };
  for (const line of section) {
    if (line.startsWith('음식:')) s.food = line.replace('음식:', '').split('—')[0].trim();
    else if (line.startsWith('장소:')) s.place = line.replace('장소:', '').split('—')[0].trim();
    else if (line.startsWith('색:')) s.color = line.replace('색:', '').split('—')[0].trim();
    else if (line.startsWith('숫자:')) s.number = line.replace('숫자:', '').trim();
    else if (line.startsWith('방향:')) s.direction = line.replace('방향:', '').trim();
  }
  return (s.food || s.color || s.number) ? s : null;
}

export default function LuckyItemsCard({ today, saju, dailyResult }) {
  const { ohaeng, data, luckyNum, word } = calcLuckyItems(today, saju);

  // API 결과 우선, 없으면 클라이언트 계산 fallback
  const apiSynergy = parseSynergyFromResult(dailyResult?.text);
  const fromApi = !!apiSynergy;

  const displayFood = apiSynergy?.food || data.food.items.join(' · ');
  const displayColor = apiSynergy?.color || data.color.name;
  const displayNumber = apiSynergy?.number || String(luckyNum);
  const displayDirection = apiSynergy?.direction || data.direction.label;
  const displayPlace = apiSynergy?.place || '';

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
      {/* 소스 뱃지 */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <span style={{
          display: 'inline-block', fontSize: '0.65rem', padding: '3px 10px',
          borderRadius: 20, fontWeight: 600, letterSpacing: '.04em',
          background: fromApi ? 'var(--goldf)' : 'var(--bg2)',
          border: `1px solid ${fromApi ? 'var(--acc)' : 'var(--line)'}`,
          color: fromApi ? 'var(--gold)' : 'var(--t4)',
        }}>
          {fromApi ? '✦ 오늘 별숨 결과 기반' : '사주 기반 · 오늘 기운 확인 후 업데이트'}
        </span>
      </div>

      {/* 오늘의 기운 헤더 */}
      <div style={{
        textAlign: 'center', marginBottom: 16,
        padding: '14px', borderRadius: 'var(--r1)',
        background: `${data.color.hex}12`,
        border: `1px solid ${data.color.hex}35`,
      }}>
        <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{data.color.emoji}</div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 2 }}>오늘의 기운</div>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: data.color.hex }}>
          {ohaeng} · {data.keyword}
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', marginTop: 6, lineHeight: 1.6 }}>
          {word}
        </div>
      </div>

      {/* 2×2 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Card title="🎨 행운의 색">
          <div style={{ fontSize: 'var(--sm)', fontWeight: 600, color: 'var(--t1)' }}>
            {displayColor}
          </div>
        </Card>

        <Card title="🔢 행운의 숫자">
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)' }}>
            {displayNumber}
          </div>
        </Card>

        <Card title="🧭 행운의 방향">
          <div style={{ fontSize: 'var(--sm)', fontWeight: 600, color: 'var(--t1)' }}>
            {displayDirection}
          </div>
        </Card>

        <Card title="🌿 오늘의 키워드">
          <div style={{ fontSize: 'var(--xs)', fontWeight: 600, color: 'var(--t1)' }}>
            {data.keyword}
          </div>
        </Card>
      </div>

      {/* 음식 추천 */}
      <Card title="🍽️ 오늘 먹으면 좋은 음식">
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 500, marginTop: 2 }}>
          {displayFood}
        </div>
      </Card>

      {/* 장소 (API 결과 있을 때만) */}
      {displayPlace && (
        <div style={{
          marginTop: 10, padding: '10px 14px', borderRadius: 'var(--r1)',
          background: 'var(--card)', border: '1px solid var(--line)',
        }}>
          <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>📍 오늘 가면 좋은 곳 </span>
          <span style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 600 }}>{displayPlace}</span>
        </div>
      )}

      {/* 오늘의 활동 */}
      <div style={{
        marginTop: 10, padding: '10px 14px', borderRadius: 'var(--r1)',
        background: 'var(--card)', border: '1px solid var(--line)',
      }}>
        <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>✨ 오늘 하면 좋은 것 </span>
        <span style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 600 }}>{data.activity}</span>
      </div>

      <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 14 }}>
        {fromApi ? '오늘 별숨 결과에서 업데이트됐어요 ✦' : '오늘 기운을 먼저 확인하면 더 정확해져요 ✦'}
      </div>
    </div>
  );
}
