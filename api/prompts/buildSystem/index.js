// ── buildSystem 라우터 ──
// 각 모드별 프롬프트를 동적 import로 필요한 것만 로드해요.
// 슬롯 감지 정규식

const SLOT_RE = /\[오전·100자\]|\[오후·100자\]|\[저녁·100자\]|\[새벽·100자\]/;

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
 * @returns {Promise<string>}
 */
export async function buildSystem(today, season, categoryHint, endingHint, timeHorizon, userMessage, isChat, isReport, isLetter, isScenario, isStory, isDailyCard) {
  if (isDailyCard) {
    const { dailyPrompt } = await import('./daily.js');
    return dailyPrompt(today, season);
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
