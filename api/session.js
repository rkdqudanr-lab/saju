import { authenticateRequest } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await authenticateRequest(req, res, { allowBodyFallback: false });
  if (!authResult.ok) {
    return res.status(401).json({ error: "로그인이 필요해요." });
  }

  return res.status(200).json({ ok: true, kakaoId: authResult.kakaoId || null, refreshed: !!authResult.refreshed });
}
