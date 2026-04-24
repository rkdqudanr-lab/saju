import { getTodayStr, getSeasonDesc, getTimeHorizon, isDecisionQuestion } from "./prompts/utils.js";
import { getCategoryHint, pickEndingHint, getCategoryExample } from "./prompts/hints.js";
import { buildSystem } from "./prompts/buildSystem/index.js";

export function validateAiRequest(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, reason: "요청 본문이 없어요." };
  }

  const {
    userMessage,
    context,
    isChat,
    isReport,
    isLetter,
    isProphecy,
    isScenario,
    isStory,
    isNatal,
    isZodiac,
    isComprehensive,
    isAstrology,
    isProfileQuestion,
    isGroupAnalysis,
    isFullGroupAnalysis,
    teamMode,
    isCalendarMonth,
    isSlot,
    isWeekly,
    isDaily,
    isDaeun,
    isAnalytics,
    isYearly,
    isFollowUpQ,
    isTarot,
    isDream,
    isName,
    isTaegil,
    responseStyle,
    kakaoId,
    clientHour,
    precision_level,
    gender,
  } = body;

  if (typeof userMessage !== "string" || !userMessage.trim()) {
    return { ok: false, reason: "userMessage가 비어 있어요." };
  }
  if (userMessage.length > 3000) {
    return { ok: false, reason: "userMessage가 너무 길어요. 최대 3000자예요." };
  }
  if (context !== undefined && typeof context !== "string") {
    return { ok: false, reason: "context는 문자열이어야 해요." };
  }

  const validStyles = ["T", "M", "F"];
  const style = typeof responseStyle === "string" && validStyles.includes(responseStyle) ? responseStyle : "M";

  const validLevels = ["low", "mid", "high"];
  const precisionLevel = typeof precision_level === "string" && validLevels.includes(precision_level) ? precision_level : "low";

  return {
    ok: true,
    data: {
      userMessage: userMessage.trim(),
      context: typeof context === "string" ? context : "",
      isChat: !!isChat,
      isReport: !!isReport,
      isLetter: !!isLetter,
      isProphecy: !!isProphecy,
      isScenario: !!isScenario,
      isStory: !!isStory,
      isNatal: !!isNatal,
      isZodiac: !!isZodiac,
      isComprehensive: !!isComprehensive,
      isAstrology: !!isAstrology,
      isProfileQuestion: !!isProfileQuestion,
      isGroupAnalysis: !!isGroupAnalysis,
      isFullGroupAnalysis: !!isFullGroupAnalysis,
      teamMode: !!(teamMode || isGroupAnalysis),
      isCalendarMonth: !!isCalendarMonth,
      isSlot: !!isSlot,
      isWeekly: !!isWeekly,
      isDaily: !!isDaily,
      isDaeun: !!isDaeun,
      isAnalytics: !!isAnalytics,
      isYearly: !!isYearly,
      isFollowUpQ: !!isFollowUpQ,
      isTarot: !!isTarot,
      isDream: !!isDream,
      isName: !!isName,
      isTaegil: !!isTaegil,
      responseStyle: style,
      precision_level: precisionLevel,
      kakaoId: kakaoId || null,
      clientHour: typeof clientHour === "number" && Number.isInteger(clientHour) && clientHour >= 0 && clientHour <= 23
        ? clientHour
        : undefined,
      gender: typeof gender === "string" && ["남성", "여성"].includes(gender) ? gender : null,
    },
  };
}

export function getAiMaxTokens(data) {
  if (data.isYearly) return 3500;
  if (data.isComprehensive) return 3500;
  if (data.isAstrology) return 3500;
  if (data.isReport) return 2500;
  if (data.isCalendarMonth) return 2000;
  if (data.isProphecy) return 1200;
  if (data.isLetter) return 1500;
  if (data.isStory) return 3000;
  if (data.isScenario) return 2000;
  if (data.isNatal) return 2500;
  if (data.isZodiac) return 1200;
  if (data.isFullGroupAnalysis) return 2200;
  if (data.isGroupAnalysis) return 1800;
  if (data.isProfileQuestion) return 800;
  if (data.isDaily) return 1800;
  if (data.isDaeun) return 2000;
  if (data.isAnalytics) return 1000;
  if (data.isTarot || data.isDream || data.isName || data.isTaegil) return 1800;
  if (data.isChat) return 1200;
  if (data.isFollowUpQ) return 600;
  return 1500;
}

function buildSpecialSystem(data, systemBase) {
  if (data.isProfileQuestion) {
    return `당신은 별숨(byeolsoom)에서 사주와 별자리를 기반으로 사용자를 깊이 이해하는 섬세한 AI예요.
사용자의 20가지 자기소개 답변을 읽고, 그 사람에게만 맞는 추가 질문 5개를 JSON 배열로만 반환해주세요.
각 질문은 사주와 별자리 관점에서 더 깊이 이해하기 위한 것이어야 해요.
반드시 JSON만 답해주세요. [{"id":"aq_1","q":"질문 내용"}]`;
  }

  if (data.isFullGroupAnalysis) {
    return `당신은 별숨(byeolsoom)에서 여러 명의 사주와 별자리를 읽고 모임 전체의 분위기를 풀어주는 분석가예요.
개인을 따로 평가하지 말고, 모임 전체의 흐름과 시너지를 자연스러운 일반 문장으로만 설명해주세요.
마크다운 제목, 번호 목록, 섹션 구분은 쓰지 마세요.`;
  }

  if (data.isGroupAnalysis || data.teamMode) {
    return `당신은 별숨(byeolsoom)에서 여러 사람의 사주와 별자리를 읽고 관계를 부드럽게 설명해주는 분석가예요.
좋은 점과 조심할 지점을 자연스러운 일반 문장으로만 설명해주세요.
마크다운 제목, 번호 목록, 섹션 구분은 쓰지 마세요.`;
  }

  return systemBase;
}

export async function buildAiRequestContext(data) {
  const today = getTodayStr(data.clientHour);
  const season = getSeasonDesc(today.m);
  const userContext = data.context ? data.context.slice(0, 3000) : "";
  const categoryHint = getCategoryHint(data.userMessage, userContext);
  const endingHint = pickEndingHint(data.userMessage);
  const categoryExample = getCategoryExample(data.userMessage);
  const timeHorizon = getTimeHorizon(data.userMessage);
  const isDecision = isDecisionQuestion(data.userMessage);

  const effectiveIsChat = data.isChat || (
    !data.isReport &&
    !data.isLetter &&
    !data.isProphecy &&
    !data.isScenario &&
    !data.isStory &&
    !data.isNatal &&
    !data.isZodiac &&
    !data.isComprehensive &&
    !data.isAstrology &&
    !data.isGroupAnalysis &&
    !data.isFullGroupAnalysis &&
    !data.isSlot &&
    !data.isWeekly &&
    !data.isDaily &&
    !data.isDaeun &&
    !data.isAnalytics &&
    !data.isYearly &&
    !data.isTarot &&
    !data.isDream &&
    !data.isName &&
    !data.isTaegil
  );

  const systemBase = await buildSystem(
    today,
    season,
    categoryHint,
    endingHint,
    timeHorizon,
    data.userMessage,
    effectiveIsChat,
    data.isReport,
    data.isLetter,
    data.isScenario,
    data.isStory,
    isDecision,
    categoryExample,
    data.isNatal,
    data.isZodiac,
    data.isComprehensive,
    data.isAstrology,
    data.responseStyle,
    data.isSlot,
    data.isWeekly,
    data.isDaily,
    data.isDaeun,
    data.isAnalytics,
    data.precision_level,
    data.gender,
    data.isProphecy,
    data.isYearly,
    data.isFollowUpQ,
    data.isTarot,
    data.isDream,
    data.isName,
    data.isTaegil,
  );

  const systemText = buildSpecialSystem(data, systemBase);
  const systemWithContext = systemText + (
    data.context
      ? `\n\n[참고할 사용자 맥락]\n${data.context}\n(맥락은 참고용 힌트예요. 그대로 복사하지 말고 자연스럽게 녹여주세요.)`
      : ""
  );

  return {
    systemWithContext,
    maxTokens: getAiMaxTokens({ ...data, isChat: effectiveIsChat }),
  };
}
