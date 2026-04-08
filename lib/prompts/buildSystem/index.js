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
export async function buildSystem(today, season, categoryHint, endingHint, timeHorizon, userMessage, isChat, isReport, isLetter, isScenario, isStory, isDecision, categoryExample = '', isNatal = false, isZodiac = false, isComprehensive = false, isAstrology = false, responseStyle = 'M', isSlot = false, isWeekly = false, isDaily = false) {
  if (isDaily) {
    const { buildDailyHoroscopeGamified } = await import('./daily_horoscope_gamified.js');
    return buildDailyHoroscopeGamified(today, season, responseStyle);
  }
  if (isComprehensive) {
    const { comprehensivePrompt } = await import('./comprehensive.js');
    return comprehensivePrompt(today, responseStyle);
  }
  if (isAstrology) {
    const { astrologyPrompt } = await import('./astrology.js');
    return astrologyPrompt(today, responseStyle);
  }
  if (isNatal) {
    const { natalPrompt } = await import('./natal.js');
    return natalPrompt(responseStyle);
  }
  if (isZodiac) {
    const { zodiacPrompt } = await import('./natal.js');
    return zodiacPrompt(responseStyle);
  }
  if (isWeekly) {
    const { WEEKLY_PROMPT } = await import('../weekly.js');
    return WEEKLY_PROMPT('이번 주');
  }
  if (isLetter) {
    const { letterPrompt } = await import('./letter.js');
    return letterPrompt(today, responseStyle);
  }
  if (isStory) {
    const { storyPrompt } = await import('./story.js');
    return storyPrompt(today, responseStyle);
  }
  if (isScenario) {
    const { scenarioPrompt } = await import('./scenario.js');
    return scenarioPrompt(today, responseStyle);
  }
  // 슬롯 모드: 프론트엔드에서 명시적으로 전달된 플래그만 사용 (userMessage 내용 미사용)
  if (isSlot) {
    const { slotPrompt } = await import('./slot.js');
    return slotPrompt(today, responseStyle);
  }
  // 결정형 질문 (갈까? 할까? 해도 될까? 등) — 일반 운세 템플릿 대신 직접 답변
  if (isDecision && !isChat && !isReport) {
    const { decisionPrompt } = await import('./decision.js');
    return decisionPrompt(today, season, responseStyle);
  }
  const { mainPrompt } = await import('./main.js');
  return mainPrompt(
    today, season, categoryHint, endingHint, timeHorizon,
    isReport, isChat, categoryExample, responseStyle
  );
}
