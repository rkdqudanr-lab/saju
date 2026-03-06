// api/ask.js — Vercel Serverless Function
// ANTHROPIC_API_KEY 환경변수 이름을 정확히 이렇게 설정해야 해요!

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, userMessage } = req.body;
  if (!userMessage) {
    return res.status(400).json({ error: "userMessage가 없어요" });
  }

  // ✅ Vercel 환경변수 이름: ANTHROPIC_API_KEY (정확히 이 이름으로!)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API 키가 설정되지 않았어요. Vercel > Settings > Environment Variables에서 ANTHROPIC_API_KEY를 설정해주세요!" });
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
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
