// api/ask.js — 별숨 Vercel Serverless Function
import { getTodayStr, getSeasonDesc, getTimeHorizon } from "./prompts/utils.js";
import { getCategoryHint, pickEndingHint } from "./prompts/hints.js";
import { buildSystem } from "./prompts/buildSystem.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userMessage, context, isChat, isReport, isLetter = false, isScenario = false } = req.body;
  if (!userMessage) return res.status(400).json({ error: "userMessage가 없어요" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY 환경변수를 Vercel에 설정해주세요!" });

  const today        = getTodayStr();
  const season       = getSeasonDesc(today.m);
  const categoryHint = getCategoryHint(userMessage);
  const endingHint   = pickEndingHint();
  const timeHorizon  = getTimeHorizon(userMessage);

  const systemWithContext =
    buildSystem(today, season, categoryHint, endingHint, timeHorizon, userMessage, !!isChat, !!isReport, !!isLetter, !!isScenario)
    + (context
      ? `\n\n━━━ 오늘 상담하는 분의 기운 데이터 ━━━\n${context}\n(위 데이터는 취재 노트예요. 이걸 그대로 보여주는 게 아니라, 에세이의 재료로 자연스럽게 녹여요.)`
      : '');

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: systemWithContext,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({ error: data.error?.message || "API 오류가 났어요" });
    }
    return res.status(200).json({ text: data.content?.[0]?.text || "" });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "서버 오류가 났어요. 잠시 후 다시 시도해봐요 🌙" });
  }
}
