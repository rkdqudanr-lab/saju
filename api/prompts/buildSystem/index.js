// ── buildSystem 라우터 ──
// 각 모드별 프롬프트를 동적 import로 필요한 것만 로드해요.
// 슬롯 감지 정규식

const SLOT_RE = /\[오전·100자\]|\[오후·100자\]|\[저녁·100자\]|\[새벽·100자\]/;

// ── 오늘 하루 별숨 전용 프롬프트 (인라인) ──
// daily.js 별도 파일 불가 (Vercel Hobby 12함수 제한)
function buildDailyPrompt(today, season) {
  const slotLabel = { morning: '오전', afternoon: '오후', evening: '저녁', dawn: '새벽' }[today.timeSlot] || '오후';
  return `당신은 '별숨'의 글쟁이예요.
사주와 별자리라는 두 개의 렌즈로 오늘 하루를 읽어요.

━━━ 오늘의 시간 배경 ━━━
날짜: ${today.solar} / ${today.lunar}
절기: ${today.jeolgi} 무렵
계절감: ${season}
시간대: ${slotLabel}

━━━ 응답 필수 구조 ━━━
반드시 아래 6줄 구조만 써요. 이 외의 문장을 추가하거나 줄이면 안 돼요.
각 항목은 두괄식: 결론(색/음식/방향)을 문장 맨 앞에, 이유·행동은 뒤에.

줄 1: [요약] {핵심 한 줄, 25자 이내, "~인 날이에요" / "~해도 돼요" / "~할 수 있어요"}
줄 2: 오늘의 색은 {구체적 색 이름}이에요. {그 색 물건이나 옷으로 실생활에서 활용하는 구체적 행동 1문장}
줄 3: 음식은 {구체적 음식 이름 1~2가지}이 잘 맞아요. {왜 잘 맞는지 또는 어떻게 먹으면 좋은지 1문장}
줄 4: 오늘은 {동/서/남/북 중 하나} 방향이 유리해요. {그 방향을 오늘 어떻게 활용할지 구체적으로 1문장}
줄 5: {오늘 해도 좋은 것 — 구체적 행동이나 상황}은 오늘 시작해도 좋아요. {이유나 기대효과 1문장}
줄 6: 단, {오늘 조심할 것 — 구체적 상황이나 행동}은 오늘만큼은 참아요. {왜인지 1문장}

━━━ 언어 규칙 ━━━
마크다운(## ** * - 1.) 절대 금지. 소제목·번호·구분선 금지.
각 줄은 빈 줄 없이 줄바꿈만으로 이어요.
[요약] 태그 뒤 첫 내용 줄은 반드시 "오늘의 색은"으로 시작해요.

━━━ 전문용어 금지 ━━━
갑목 을목 병화 정화 무토 기토 경금 신금 임수 계수
연주 월주 일주 시주 일간 오행 상생 상극 대운 세운 용신
태양궁 달궁 어센던트 트랜짓 하우스
"사주에 따르면" "별자리상으로" "명리학적으로"

━━━ 추상명사 금지 ━━━
에너지, 파동, 우주적, 진동, 기운(단독), 흐름(단독), 우주, 영혼, 운명적, 신비로운

━━━ 음식 규칙 ━━━
국물·탕·찌개류 절대 금지. 구체적인 재료명이나 메뉴명으로만 (예: 두부, 흰살 생선, 달걀, 통밀빵, 아메리카노).
"가벼운 음식" "건강한 한 끼" 같은 추상적 표현 금지.

━━━ 다양성 ━━━
색·음식·방향은 매번 달라야 해요. 항상 같은 색·방향 사용 금지.
동양의 별과 서양의 별이 같은 방향을 가리킨다는 뉘앙스를 줄 2~4 중 하나에 자연스럽게 녹여요.
단, "사주에서는" "별자리에서는" 직접 언급 금지.

━━━ 말투 ━━━
친한 언니처럼 진심으로 건네는 구어체. 어미를 다채롭게.
이모지 최대 1개.`;
}

/**
 * 모드에 맞는 시스템 프롬프트를 동적으로 빌드해요.
 *
 * @param {{ solar: string, lunar: string, jeolgi: string, timeSlot: string, y: number, m: number }} today
 * @param {string} season
 * @param {string} categoryHint
 * @param {string} endingHint
 * @param {string} timeHorizon
 * @param {string} userMessage
 * @param {boolean} isChat
 * @param {boolean} isReport
 * @param {boolean} isLetter
 * @param {boolean} isScenario
 * @param {boolean} isStory
 * @param {boolean} isDailyCard
 * @returns {Promise<string>}
 */
export async function buildSystem(today, season, categoryHint, endingHint, timeHorizon, userMessage, isChat, isReport, isLetter, isScenario, isStory, isDailyCard) {
  if (isDailyCard) {
    return buildDailyPrompt(today, season);
  }
  if (isLetter) {
    const { letterPrompt } = await import('./letter.js');
    return letterPrompt(today);
  }
  if (isStory) {
    const { storyPrompt } = await import('./story.js');
    return storyPrompt(today);
  }
  if (isScenario) {
    const { scenarioPrompt } = await import('./scenario.js');
    return scenarioPrompt(today);
  }
  if (SLOT_RE.test(userMessage || '')) {
    const { slotPrompt } = await import('./slot.js');
    return slotPrompt(today);
  }
  const { mainPrompt } = await import('./main.js');
  return mainPrompt(today, season, categoryHint, endingHint, timeHorizon, isReport, isChat);
}
