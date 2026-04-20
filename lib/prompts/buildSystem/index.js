// ── buildSystem 라우터 ──
// 각 모드별 프롬프트를 동적 import로 필요한 것만 로드해요.
// 모드는 프론트엔드에서 명시적 boolean 플래그로 전달받아요.
// (userMessage 내용으로 모드를 추론하지 않아 프롬프트 인젝션 벡터를 차단해요)

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
 * @param {boolean} isDecision
 * @param {string} categoryExample
 * @param {boolean} isNatal
 * @param {boolean} isZodiac
 * @param {boolean} isComprehensive
 * @param {boolean} isAstrology
 * @param {string} responseStyle
 * @param {boolean} isSlot - 시간대별(오전/오후/저녁/새벽) 슬롯 모드 (프론트에서 명시적으로 전달)
 * @returns {Promise<string>}
 */
export async function buildSystem(today, season, categoryHint, endingHint, timeHorizon, userMessage, isChat, isReport, isLetter, isScenario, isStory, isDecision, categoryExample = '', isNatal = false, isZodiac = false, isComprehensive = false, isAstrology = false, responseStyle = 'M', isSlot = false, isWeekly = false, isDaily = false, isDaeun = false, isAnalytics = false, precision_level = 'low', gender = null, isProphecy = false, isYearly = false) {
  let base;
  if (isYearly) {
    const { yearlyPrompt } = await import('./yearly.js');
    base = yearlyPrompt(today, responseStyle);
  } else if (isDaeun) {
    const { daeunPrompt } = await import('./daeun.js');
    base = daeunPrompt(responseStyle);
  } else if (isAnalytics) {
    const { analyticsPrompt } = await import('./analytics.js');
    base = analyticsPrompt(responseStyle);
  } else if (isDaily) {
    const { buildDailyHoroscopeGamified } = await import('./daily_horoscope_gamified.js');
    base = buildDailyHoroscopeGamified(today, season, responseStyle, gender);
  } else if (isComprehensive) {
    const { comprehensivePrompt } = await import('./comprehensive.js');
    base = comprehensivePrompt(today, responseStyle);
  } else if (isAstrology) {
    const { astrologyPrompt } = await import('./astrology.js');
    base = astrologyPrompt(today, responseStyle);
  } else if (isNatal) {
    const { natalPrompt } = await import('./natal.js');
    base = natalPrompt(responseStyle);
  } else if (isZodiac) {
    const { zodiacPrompt } = await import('./natal.js');
    base = zodiacPrompt(responseStyle);
  } else if (isWeekly) {
    const { WEEKLY_PROMPT } = await import('../weekly.js');
    base = WEEKLY_PROMPT('이번 주');
  } else if (isProphecy) {
    const { prophecyPrompt } = await import('./letter.js');
    base = prophecyPrompt(today, responseStyle);
  } else if (isLetter) {
    const { letterPrompt } = await import('./letter.js');
    base = letterPrompt(today, responseStyle);
  } else if (isStory) {
    const { storyPrompt } = await import('./story.js');
    base = storyPrompt(today, responseStyle);
  } else if (isScenario) {
    const { scenarioPrompt } = await import('./scenario.js');
    base = scenarioPrompt(today, responseStyle);
  } else if (isSlot) {
    // 슬롯 모드: 프론트엔드에서 명시적으로 전달된 플래그만 사용 (userMessage 내용 미사용)
    const { slotPrompt } = await import('./slot.js');
    base = slotPrompt(today, responseStyle);
  } else if (isDecision && !isChat && !isReport) {
    // 결정형 질문 (갈까? 할까? 해도 될까? 등) — 일반 운세 템플릿 대신 직접 답변
    const { decisionPrompt } = await import('./decision.js');
    base = decisionPrompt(today, season, responseStyle);
  } else {
    const { mainPrompt } = await import('./main.js');
    base = mainPrompt(
      today, season, categoryHint, endingHint, timeHorizon,
      isReport, isChat, categoryExample, responseStyle
    );
  }

  // 데이터 정밀도에 따라 분석 깊이 지시 추가
  const depthNote = {
    mid:  '\n\n[분석 정밀도: 중] 사주 오행과 태양·달 별자리를 함께 연결해 답해요.',
    high: '\n\n[분석 정밀도: 고] 사주 대운 흐름, 행성 위상, 현재 고민 키워드를 통합해 초정밀 분석을 제공해요.',
  }[precision_level] || '';

  return base + depthNote;
}
