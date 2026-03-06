// api/ask.js
// Vercel Serverless Function
// API 키가 서버에서만 처리되어 브라우저에 노출되지 않아요

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: "userMessage가 없어요" });
  }

  const apiKey = process.env.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;
  if (!apiKey) {
    return res.status(500).json({ error: "API 키가 설정되지 않았어요" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system: system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({ error: data.error?.message || "API 오류" });
    }

    const text = data.content?.[0]?.text || "";
    return res.status(200).json({ text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "서버 오류가 났어요. 잠시 후 다시 해봐요 🌙" });
  }
}
