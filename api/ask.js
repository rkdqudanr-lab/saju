// api/ask.js — Vercel Serverless Function
// 브라우저 → 여기 → Anthropic API (API 키가 서버에만 존재)

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // preflight
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.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;
  if (!apiKey) {
    return res.status(500).json({ error: "API 키가 설정되지 않았어요. Vercel 환경변수를 확인해주세요." });
  }

  try {
    const { system, userMessage } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: "userMessage가 없어요." });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: system || "",
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: `Anthropic API 오류: ${errData?.error?.message || response.statusText}`,
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    return res.status(200).json({ text });

  } catch (err) {
    console.error("ask.js error:", err);
    return res.status(500).json({ error: "서버 오류가 났어요. 잠시 후 다시 시도해봐요 🌙" });
  }
}
