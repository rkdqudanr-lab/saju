// api/ask.js — 별숨 Vercel Serverless Function
import { getTodayStr, getSeasonDesc, getTimeHorizon } from "./prompts/utils.js";
import { getCategoryHint, pickEndingHint } from "./prompts/hints.js";
import { buildSystem } from "./prompts/buildSystem.js";

// ═══════════════════════════════════════════════════════════
//  🛡  Upstash Redis REST 기반 Rate Limiter
//  환경변수: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
//  미설정 시 로컬 개발용 인메모리 폴백으로 동작
// ═══════════════════════════════════════════════════════════
const RATE_MIN  = 10;   // 분당 최대 요청
const RATE_DAY  = 100;  // 일당 최대 요청

// ── 로컬 폴백용 인메모리 버킷 ──
const _memBuckets = new Map();
function _memIncr(key, ttlMs) {
  const now = Date.now();
  const entry = _memBuckets.get(key);
  if (!entry || entry.exp <= now) {
    _memBuckets.set(key, { val: 1, exp: now + ttlMs });
    return 1;
  }
  entry.val++;
  return entry.val;
}

async function upstashCmd(cmd, ...args) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // 미설정 → 인메모리 폴백
  const path = [cmd, ...args].map(encodeURIComponent).join('/');
  const res  = await fetch(`${url}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result;
}

async function checkRateLimit(ip) {
  const minKey = `rl:min:${ip}`;
  const dayKey = `rl:day:${ip}`;
  const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  let minCount, dayCount;
  if (useRedis) {
    // INCR + EXPIRE 파이프라인 (2-hop 최소화)
    const [mc, , dc] = await Promise.all([
      upstashCmd('incr', minKey),
      upstashCmd('expire', minKey, '60'),
      upstashCmd('incr', dayKey),
      upstashCmd('expire', dayKey, '86400'),
    ]);
    minCount = mc ?? 0;
    dayCount = dc ?? 0;
  } else {
    minCount = _memIncr(minKey, 60_000);
    dayCount = _memIncr(dayKey, 86_400_000);
  }

  if (minCount > RATE_MIN) return { ok: false, msg: '잠시 후 다시 시도해요 🌙' };
  if (dayCount > RATE_DAY) return { ok: false, msg: '오늘은 별이 충분히 이야기했어요 🌙 내일 다시 찾아와요.' };
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════
//  🚫  프롬프트 인젝션 패턴 필터
// ═══════════════════════════════════════════════════════════
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /forget\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?previous\s+instructions?/i,
  /override\s+(system|instructions?)/i,
  /you\s+are\s+now\s+(a|an)\s/i,
  /act\s+as\s+(a|an|if)\s/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /new\s+instructions?:/i,
  /reveal\s+(your\s+)?(prompt|instructions?|system)/i,
  /show\s+(me\s+)?(your\s+)?(system\s+)?prompt/i,
  /\[SYSTEM\]/,
  /---\s*system/i,
];

function hasInjection(text) {
  return INJECTION_PATTERNS.some(p => p.test(text));
}

// ═══════════════════════════════════════════════════════════
//  핸들러
// ═══════════════════════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── 클라이언트 IP ──
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || req.headers['x-real-ip']
           || req.socket?.remoteAddress
           || 'unknown';

  // ── Rate Limit ──
  const rl = await checkRateLimit(ip);
  if (!rl.ok) return res.status(429).json({ error: rl.msg });

  const { userMessage, context, isChat, isReport, isLetter = false, isScenario = false, isStory = false } = req.body;
  if (!userMessage) return res.status(400).json({ error: "userMessage가 없어요" });

  // ── 길이 제한 (500자) ──
  if (typeof userMessage !== 'string' || userMessage.length > 500) {
    return res.status(400).json({ error: "메시지는 500자 이내로 작성해줘요 🌙" });
  }

  // ── 프롬프트 인젝션 필터 ──
  if (hasInjection(userMessage)) {
    return res.status(400).json({ error: "별이 이해할 수 없는 메시지예요 🌙 다시 작성해봐요." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY 환경변수를 Vercel에 설정해주세요!" });

  const today        = getTodayStr();
  const season       = getSeasonDesc(today.m);
  const categoryHint = getCategoryHint(userMessage);
  const endingHint   = pickEndingHint();
  const timeHorizon  = getTimeHorizon(userMessage);

  const systemWithContext =
    buildSystem(today, season, categoryHint, endingHint, timeHorizon, userMessage, !!isChat, !!isReport, !!isLetter, !!isScenario, !!isStory)
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
