// 프롬프트 수정 후 영향받은 모드만 재검증
import fs from 'fs';
import path from 'path';

const OUT = path.join(import.meta.dirname, 'results-retest');
fs.mkdirSync(OUT, { recursive: true });

const CTX = `[지민 · 29세 · 여성]

[사주 기운]
연주: 정축 / 월주: 신해 / 일주: 병오 / 시주: 무자
타고난 기질: 따뜻하고 표현이 풍부한 기질
강한 기운: 불 / 약한 기운: 물

[별자리]
태양: 전갈자리 / 달: 게자리 / 상승: 사자자리`;

const PARTNER_CTX = CTX + `

[상대방 정보]
[준호 · 31세 · 남성]
연주: 을해 / 월주: 무인 / 일주: 임신 / 시주: 정미
강한 기운: 물 / 약한 기운: 불
태양: 황소자리`;

const CASES = [
  { name: 'weekly',  body: { userMessage: '[이번 주의 경험과 감정]\n야근이 많아서 지쳤고, 주말에 친구를 만나 기분이 좀 풀렸어요. 다음 주에 중요한 발표가 있어요.', context: CTX, isWeekly: true } },
  { name: 'daeun',   body: { userMessage: '나의 10년 단위 대운 흐름을 읽어줘. 지금 대운의 특징과 다음 대운으로 넘어가는 시기를 알려줘.', context: CTX, isDaeun: true } },
  { name: 'group-full', body: { userMessage: '우리 모임 4명의 전체 별숨 흐름을 분석해주세요. 집단 분위기, 강점, 충돌이 생기기 쉬운 지점, 같이 움직이면 빛나는 순간을 팀 관점으로 설명해주세요.', context: PARTNER_CTX, teamMode: true, isGroupAnalysis: true, isFullGroupAnalysis: true } },
  { name: 'calendar-month', body: { userMessage: '[달력 월별 분석] 2026년 6월, 나의 [계약] 관련 기운을 날짜별로 분석해줘. 이 사주와 별자리를 바탕으로, 이번 달 계약 관련해서 특히 좋은 날 BEST 5와 주의할 날 TOP 3을 알려줘. 각 날짜마다 이유를 한 줄씩 간결하게 써줘. 형식: "N일 - 이유" 로 목록을 만들어줘.', context: CTX, isCalendarMonth: true } },
  { name: 'prophecy', body: { userMessage: '[예언 요청] 지금으로부터 1년 뒤의 미래를 사주와 별자리 흐름으로 읽어주세요.', context: CTX, isProphecy: true } },
  { name: 'taegil',  body: { userMessage: '[택일 요청] 이사 날짜를 골라줘요.\n후보: 2026년 6월 14일(일), 6월 20일(토), 6월 25일(목), 7월 4일(토)\n가장 좋은 날과 이유, 피할 날을 알려줘요.', context: CTX, isTaegil: true } },
  { name: 'yearly-weeks', body: { userMessage: '2026년 6월의 운세를 주차별로 나눠서 자세히 알려줘. 형식: [1주차] [2주차] [3주차] [4주차] 각 주차별로 어떤 흐름인지, 어떤 기회가 오는지, 무엇을 조심해야 하는지 구체적으로.', context: CTX, isYearly: true } },
];

async function run(c) {
  const t0 = Date.now();
  try {
    const res = await fetch('http://localhost:5173/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c.body),
    });
    const data = await res.json();
    const text = data.text || `[ERROR] ${JSON.stringify(data)}`;
    fs.writeFileSync(path.join(OUT, c.name + '.txt'), text, 'utf8');
    return `${c.name}: ${res.status} ${text.length}자 ${((Date.now()-t0)/1000).toFixed(1)}s`;
  } catch (e) {
    return `${c.name}: FAILED ${e.message}`;
  }
}

for (let i = 0; i < CASES.length; i += 4) {
  const results = await Promise.all(CASES.slice(i, i + 4).map(run));
  results.forEach(r => console.log(r));
}
console.log('DONE');
