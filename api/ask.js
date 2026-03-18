// api/ask.js — 별숨 Vercel Serverless Function
import { getTodayStr, getSeasonDesc, getTimeHorizon, isDecisionQuestion } from "../lib/prompts/utils.js";
import { getCategoryHint, pickEndingHint } from "../lib/prompts/hints.js";
import { buildSystem } from "../lib/prompts/buildSystem/index.js";

// ── 요청 스키마 검증 ──
/**
 * @typedef {{ userMessage: string, context?: string, isChat?: boolean, isReport?: boolean, isLetter?: boolean, isScenario?: boolean, isStory?: boolean }} AskRequest
 * @typedef {{ text: string }} AskResponse
 */

/**
 * 요청 바디를 검증해요.
 * @param {unknown} body
 * @returns {{ ok: true, data: AskRequest } | { ok: false, reason: string }}
 */
function validateRequest(body) {
  if (!body || typeof body !== 'object') return { ok: false, reason: '요청 바디가 없어요' };
  const { userMessage, context, isChat, isReport, isLetter, isScenario, isStory } = body;

  if (typeof userMessage !== 'string' || !userMessage.trim()) {
    return { ok: false, reason: 'userMessage가 없거나 비어있어요' };
  }
  if (userMessage.length > 2000) {
    return { ok: false, reason: 'userMessage가 너무 길어요 (최대 2000자)' };
  }
  if (context !== undefined && typeof context !== 'string') {
    return { ok: false, reason: 'context는 문자열이어야 해요' };
  }

  return {
    ok: true,
    data: {
      userMessage: userMessage.trim(),
      context: typeof context === 'string' ? context : undefined,
      isChat: !!isChat,
      isReport: !!isReport,
      isLetter: !!isLetter,
      isScenario: !!isScenario,
      isStory: !!isStory,
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const validation = validateRequest(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.reason });
  }

  const { userMessage, context, isChat, isReport, isLetter, isScenario, isStory } = validation.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY 환경변수를 Vercel에 설정해주세요!" });

  const today        = getTodayStr();
  const season       = getSeasonDesc(today.m);
  const categoryHint = getCategoryHint(userMessage);
  const endingHint   = pickEndingHint(userMessage);
  const timeHorizon  = getTimeHorizon(userMessage);
  const isDecision   = isDecisionQuestion(userMessage);

  // 모드별 동적 로드
  const systemBase = await buildSystem(
    today, season, categoryHint, endingHint, timeHorizon,
    userMessage, isChat, isReport, isLetter, isScenario, isStory, isDecision
  );

  const systemWithContext = systemBase
    + (context
      ? `\n\n━━━ 오늘 상담하는 분의 기운 데이터 ━━━\n${context}\n(위 데이터는 취재 노트예요. 이걸 그대로 보여주는 게 아니라, 에세이의 재료로 자연스럽게 녹여요.)`
      : '');

  // 감성 깊이가 필요한 모드는 sonnet, 나머지는 haiku (비용 최적화)
  const model = (isLetter || isStory)
    ? "claude-sonnet-4-20250514"
    : "claude-haiku-4-5-20251001";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4000,
        system: systemWithContext,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic API error:", JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || "API 오류가 났어요" });
    }

    /** @type {AskResponse} */
    const result = { text: data.content?.[0]?.text || "" };
    return res.status(200).json(result);

  } catch (err) {
    console.error("Server error:", err?.message || err);
    return res.status(500).json({ error: "서버 오류가 났어요. 잠시 후 다시 시도해봐요 🌙" });
  }
}
