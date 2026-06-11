// 전 기능 프롬프트 테스트 하니스 — 로컬 dev 서버(/api/ask)로 각 모드를 실호출해 출력 저장
import fs from 'fs';
import path from 'path';

const OUT = path.join(import.meta.dirname, 'results');
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
  { name: 'main-plain',    body: { userMessage: '오늘 입을 옷 색 하나만 추천해줘', context: CTX } },
  { name: 'main-emotion',  body: { userMessage: '요즘 회사에서 사람 때문에 스트레스를 너무 받아서 마음이 무거워요', context: CTX } },
  { name: 'main-decision', body: { userMessage: '지금 만나는 사람과 결혼해도 될까요?', context: CTX } },
  { name: 'chat',          body: { userMessage: '그럼 상견례는 언제쯤 하는 게 좋아?', context: CTX, isChat: true } },
  { name: 'followupq',     body: { userMessage: '[원래 질문]\n지금 만나는 사람과 결혼해도 될까요?\n\n[방금 내가 한 답변 요약]\n올해보다는 내년 봄이 더 안정적인 흐름이에요. 지금은 서로의 생활 패턴을 맞춰보는 시기로 보내세요.\n\n위 원래 질문의 주제와 직접 관련된 후속 질문 5개를 만들어줘.', context: CTX, isFollowUpQ: true } },
  { name: 'report-monthly', body: { userMessage: '[요청] 이번 달 월간 리포트를 작성해줘.\n[형식] [월간요약], [월간점수], [이번달핵심], [주차별가이드], [관계와감정], [일과돈], [건강과생활], [이번달피할것], [이번달실천], [행운색], [행운아이템], [별숨한마디]\n[주의] 태그 외 형식은 쓰지 말고, 점수는 9개 항목을 모두 포함해줘.', context: CTX, isReport: true } },
  { name: 'report-deepinterview', body: { userMessage: '아래 인터뷰 답변을 바탕으로 나를 심층 해석해줘.\n\nQ. 요즘 가장 큰 고민은? A. 진로 전환\nQ. 에너지가 나는 순간은? A. 새 프로젝트 시작할 때\nQ. 관계에서 힘든 점은? A. 거절을 잘 못해요\n\n- 단순한 운세 요약이 아니라 내면 패턴, 관계 방식, 감정의 결, 강점과 과제를 깊이 읽어주세요\n- 보고서체보다 자연스럽게 읽히는 긴 해석으로 써주세요', context: CTX, isReport: true } },
  { name: 'yearly-weeks',  body: { userMessage: '2026년 6월의 운세를 주차별로 나눠서 자세히 알려줘. 형식: [1주차] [2주차] [3주차] [4주차] 각 주차별로 어떤 흐름인지, 어떤 기회가 오는지, 무엇을 조심해야 하는지 구체적으로.', context: CTX, isYearly: true } },
  { name: 'daeun',         body: { userMessage: '나의 10년 단위 대운 흐름을 읽어줘. 지금 대운의 특징과 다음 대운으로 넘어가는 시기를 알려줘.', context: CTX, isDaeun: true } },
  { name: 'analytics',     body: { userMessage: '나의 별숨 상담 패턴을 분석해줘:\n총 상담 24회\n가장 많이 상담한 주제: 연애(9회), 직장(7회), 재물(4회)\n시간대별: 새벽 2회, 오전 3회, 오후 8회, 저녁 11회', context: CTX, isAnalytics: true } },
  { name: 'daily',         body: { userMessage: '오늘 하루 나의 별숨은?', context: CTX, isDaily: true } },
  { name: 'comprehensive', body: { userMessage: '사주와 별자리를 함께 읽어 나를 종합 분석해줘요.', context: CTX, isComprehensive: true } },
  { name: 'natal',         body: { userMessage: '내 타고난 사주 원국과 천체 배치를 해석해줘.', context: CTX, isNatal: true } },
  { name: 'weekly',        body: { userMessage: '[이번 주의 경험과 감정]\n야근이 많아서 지쳤고, 주말에 친구를 만나 기분이 좀 풀렸어요. 다음 주에 중요한 발표가 있어요.', context: CTX, isWeekly: true } },
  { name: 'prophecy',      body: { userMessage: '[예언 요청] 지금으로부터 1년 뒤의 미래를 사주와 별자리 흐름으로 읽어주세요.', context: CTX, isProphecy: true } },
  { name: 'letter',        body: { userMessage: '요즘 지친 나에게 별숨의 편지를 써줘요.', context: CTX, isLetter: true } },
  { name: 'story-compat',  body: { userMessage: '[두 별의 인연] 오늘(2026년 6월 11일) 두 사람의 사주와 별자리를 바탕으로 두 사람의 관계와 인연에 대해 소설처럼 이야기해줘요. 응답은 시스템 형식의 JSON 객체만 보내주세요.', context: PARTNER_CTX, isStory: true } },
  { name: 'slot',          body: { userMessage: '[질문]\n오늘 저녁 시간대의 흐름을 알려줘', context: CTX, isSlot: true } },
  { name: 'tarot',         body: { userMessage: '[타로 3장 뽑기 결과]\n과거: [달] 불안과 직감\n현재: [탑] 갑작스러운 변화\n미래: [별] 희망과 회복\n\n위 3장의 타로 카드를 내 사주와 별자리 맥락에서 읽어줘요. 각 카드가 지금 내 상황에서 어떤 의미인지, 세 카드를 연결해서 하나의 흐름으로 이야기해줘요.', context: CTX, isChat: true, isTarot: true } },
  { name: 'dream',         body: { userMessage: '[오늘의 달] 보름달\n[꿈의 감정] 불안했어요\n[꿈 키워드] 이빨, 추락\n\n[꿈 내용]\n이가 우수수 빠지는 꿈을 꿨어요. 빠진 이를 손에 들고 어쩔 줄 몰라 하다가 높은 곳에서 떨어졌어요.', context: CTX, isChat: true, isDream: true } },
  { name: 'name',          body: { userMessage: '[이름 풀이]\n이름: 김지민\n한자: 智旼\n\n이 이름의 소리 오행과 사주의 조화를 풀어줘요.', context: CTX, isName: true } },
  { name: 'taegil',        body: { userMessage: '[택일 요청] 이사 날짜를 골라줘요.\n후보: 2026년 6월 14일(일), 6월 20일(토), 6월 25일(목), 7월 4일(토)\n가장 좋은 날과 이유, 피할 날을 알려줘요.', context: CTX, isTaegil: true } },
  { name: 'calendar-month', body: { userMessage: '[달력 월별 분석] 2026년 6월, 나의 [계약] 관련 기운을 날짜별로 분석해줘. 이 사주와 별자리를 바탕으로, 이번 달 계약 관련해서 특히 좋은 날 BEST 5와 주의할 날 TOP 3을 알려줘. 각 날짜마다 이유를 한 줄씩 간결하게 써줘. 형식: "N일 - 이유" 로 목록을 만들어줘.', context: CTX, isCalendarMonth: true } },
  { name: 'profile-question', body: { userMessage: '사용자의 20가지 답변을 읽고, 이 사람에게 맞춤형 심층 질문 5개를 JSON 배열로만 답해주세요.\n형식: [{"id":"aq_1","q":"질문 내용"}]\n\n사용자 답변:\n직업: 디자이너 / 취미: 등산 / 고민: 진로 전환 / 좋아하는 것: 고양이', context: CTX, isProfileQuestion: true } },
  { name: 'axis-refresh',  body: { userMessage: '[선택 항목] 금전운\n[기존 한줄] 지출 관리에 신경 쓰면 좋은 날이에요\n[새 점수] 82 (+10, 행운 부적 아이템 사용)\n새 한줄 설명을 써줘.', context: CTX, isDailyAxisRefresh: true } },
  { name: 'group-full',    body: { userMessage: '우리 모임 4명의 전체 별숨 흐름을 분석해주세요. 집단 분위기, 강점, 충돌이 생기기 쉬운 지점, 같이 움직이면 빛나는 순간을 팀 관점으로 설명해주세요.', context: PARTNER_CTX, teamMode: true, isGroupAnalysis: true, isFullGroupAnalysis: true } },
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
    fs.writeFileSync(path.join(OUT, c.name + '.txt'), '[FETCH ERROR] ' + e.message, 'utf8');
    return `${c.name}: FAILED ${e.message}`;
  }
}

// 4개씩 배치 병렬
for (let i = 0; i < CASES.length; i += 4) {
  const batch = CASES.slice(i, i + 4);
  const results = await Promise.all(batch.map(run));
  results.forEach(r => console.log(r));
}
console.log('DONE');
