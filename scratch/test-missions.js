import { generateMissionsFromHoroscope } from '../src/utils/missionGenerator.js';

const sampleHoroscope = `
[점수] 85

[요약] 오늘은 추진력이 좋은 날이에요.

[동양의 기운]
십신: 식신 — "재능을 발산하는 날" 쉽게 말하면 내 능력을 보여주는 날이에요.
기운: 목 기운이 강해서 새로 시작하기 좋아요.
DO: 가벼운 산책 (식신 — 기운을 순환시켜요)
DONT: 무리한 운동 (겁재 — 에너지가 분산될 수 있어요)

[별숨픽]
음식: 된장찌개 — 안정이 필요한 날, 깊고 담백한 한 끼.
장소: 서울숲 — 바깥 바람 한 번 쐬는 게 오늘 가장 좋은 리셋이에요.
색: 하늘색 — 직관력 집중.
아이템: 손목시계 — 시간 관리가 오늘 키포인트.
행동: 독서 — 마음의 양식을 쌓는 시간.
`;

const missions = generateMissionsFromHoroscope(sampleHoroscope);
console.log('--- Extracted Missions ---');
console.log(JSON.stringify(missions, null, 2));

const expectedTypes = ['color', 'menu', 'item', 'do', 'dont'];
const extractedTypes = missions.map(m => m.type);

console.log('\n--- Validation ---');
expectedTypes.forEach(type => {
  const found = extractedTypes.includes(type);
  console.log(`${type}: ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
});

if (missions.find(m => m.type === 'do')?.content === '가벼운 산책') {
  console.log('DO cleaning: ✅ SUCCESS');
} else {
  console.log('DO cleaning: ❌ FAILED', missions.find(m => m.type === 'do')?.content);
}

if (missions.find(m => m.type === 'dont')?.content === '무리한 운동') {
  console.log('DONT cleaning: ✅ SUCCESS');
} else {
  console.log('DONT cleaning: ❌ FAILED', missions.find(m => m.type === 'dont')?.content);
}
