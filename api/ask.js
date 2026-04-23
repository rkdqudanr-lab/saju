import { buildAiRequestContext, validateAiRequest } from "../lib/aiRequest.js";
import { verifyUser } from "../lib/auth.js";

async function checkRateLimit(ip) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { ok: true };

  const now = Math.floor(Date.now() / 1000);
  const minuteKey = `rl:min:${ip}:${Math.floor(now / 60)}`;
  const dayKey = `rl:day:${ip}:${Math.floor(now / 86400)}`;

  try {
    const pipe = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", minuteKey],
        ["EXPIRE", minuteKey, 60],
        ["INCR", dayKey],
        ["EXPIRE", dayKey, 86400],
      ]),
    });

    const results = await pipe.json();
    const minCount = results?.[0]?.result ?? 0;
    const dayCount = results?.[2]?.result ?? 0;

    if (minCount > 20) return { ok: false, reason: "minute" };
    if (dayCount > 200) return { ok: false, reason: "day" };
    return { ok: true };
  } catch (error) {
    console.error("[byeolsoom] Redis rate limit check failed:", error?.message);
    return { ok: false, reason: "service" };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.ok) {
    if (rateLimit.reason === "service") {
      return res.status(503).json({ error: "서비스가 잠시 바빠요. 조금 뒤에 다시 시도해주세요." });
    }
    return res.status(429).json({ error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." });
  }

  const validation = validateAiRequest(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.reason });
  }

  const data = validation.data;
  if (!data.kakaoId) {
    return res.status(401).json({ error: "로그인이 필요해요." });
  }

  const authResult = await verifyUser(req);
  if (!authResult.ok) {
    return res.status(401).json({ error: "로그인이 필요해요." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY 환경변수가 필요해요." });
  }

  const { systemWithContext, maxTokens } = await buildAiRequestContext(data);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "prompt-caching-2024-07-31",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: maxTokens,
          ...(data.isDaily ? { temperature: 0.3 } : {}),
          system: [{ type: "text", text: systemWithContext, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: data.userMessage }],
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const body = await response.json();
    if (!response.ok) {
      console.error("Anthropic API error:", JSON.stringify(body));
      return res.status(response.status).json({ error: body.error?.message || "AI 응답을 가져오지 못했어요." });
    }

    return res.status(200).json({ text: body.content?.[0]?.text || "" });
  } catch (error) {
    if (error?.name === "AbortError") {
      console.error("Anthropic API timeout (25s exceeded)");
      return res.status(504).json({ error: "별이 잠시 바빴어요. 다시 시도해주세요." });
    }

    console.error("Server error:", error?.message || error);
    return res.status(500).json({ error: "서버 오류가 있었어요. 잠시 후 다시 시도해주세요." });
  }
}
