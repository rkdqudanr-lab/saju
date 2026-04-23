import { buildAiRequestContext, validateAiRequest } from "../lib/aiRequest.js";
import { verifyUser } from "../lib/auth.js";

async function checkRateLimit(ip) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { ok: true };

  const now = Math.floor(Date.now() / 1000);
  const minuteKey = `rl:stream:min:${ip}:${Math.floor(now / 60)}`;

  try {
    const pipe = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", minuteKey],
        ["EXPIRE", minuteKey, 60],
      ]),
    });

    const results = await pipe.json();
    const count = results?.[0]?.result ?? 0;
    if (count > 20) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.ok) {
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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let upstreamRes;
  try {
    upstreamRes = await fetch("https://api.anthropic.com/v1/messages", {
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
        stream: true,
        system: [{ type: "text", text: systemWithContext, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: data.userMessage }],
      }),
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    res.write(`data: ${JSON.stringify({ error: "별이 잠시 바빴어요. 다시 시도해주세요." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  if (!upstreamRes.ok) {
    clearTimeout(timeoutId);
    res.write(`data: ${JSON.stringify({ error: "AI 서버 응답을 가져오지 못했어요." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  const reader = upstreamRes.body?.getReader();
  if (!reader) {
    clearTimeout(timeoutId);
    res.write(`data: ${JSON.stringify({ error: "스트림을 열지 못했어요." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const raw = trimmed.slice(6);
        if (raw === "[DONE]") continue;

        try {
          const event = JSON.parse(raw);
          if (event.type === "content_block_delta" && event.delta?.text) {
            res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
          }
          if (event.type === "message_stop") {
            res.write("data: [DONE]\n\n");
          }
        } catch {
          // Ignore malformed upstream event lines.
        }
      }
    }
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error("[byeolsoom:stream] stream error:", error?.message);
    }
  } finally {
    clearTimeout(timeoutId);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
