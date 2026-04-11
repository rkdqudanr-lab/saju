// api/ask.js — 별숨 Vercel Serverless Function
import { getTodayStr, getSeasonDesc, getTimeHorizon, isDecisionQuestion } from "../lib/prompts/utils.js";
import { getCategoryHint, pickEndingHint, getCategoryExample } from "../lib/prompts/hints.js";
import { buildSystem } from "../lib/prompts/buildSystem/index.js";
import { verifyJWT } from "../lib/jwt.js";

// ── JWT 또는 kakao_id 기반 사용자 검증 ──
// 우선순위: Authorization: Bearer <JWT> → kakao_id 형식 검증 (하위 호환)
// JWT_SECRET 환경변수가 있으면 JWT 검증 활성화
async function verifyUser(req) {
  const jwtSecret = process.env.JWT_SECRET;

  // JWT 검증 (Authorization 헤더)
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (jwtSecret) {
      const payload = verifyJWT(token, jwtSecret);
      if (payload?.sub) return { ok: true, kakaoId: payload.sub };
      return { ok: false };
    }
    // JWT_SECRET 미설정: 토큰이 있어도 형식만 검증(로컬 개발용)
    console.warn('[별숨] JWT_SECRET 없음 — Bearer 토큰 형식 검증만 수행');
  }

  // 하위 호환: body의 kakaoId로 검증 (JWT_SECRET 미설정 또는 토큰 없는 구 클라이언트)
  const kakaoId = req.body?.kakaoId;
  if (!kakaoId) return { ok: false };
  if (!/^\d{1,20}$/.test(String(kakaoId))) return { ok: false };

  // Supabase DB 조회 (환경변수가 있을 때만)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/users?select=kakao_id&kakao_id=eq.${encodeURIComponent(String(kakaoId))}&limit=1`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return { ok: true, kakaoId };
      return { ok: false };
    } catch (e) {
      console.error('[별숨] verifyUser Supabase 연결 오류:', e?.message);
      return { ok: false };
    }
  }
  // 환경변수 미설정 = 로컬 개발 환경
  return { ok: true, kakaoId };
}

// ── IP 기반 레이트 리미팅 (Upstash Redis) ──
async function checkRateLimit(ip) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  // 환경변수 없으면 로컬 개발용으로 스킵
  if (!url || !token) return { ok: true };

  const now      = Math.floor(Date.now() / 1000);
  const minuteKey = `rl:min:${ip}:${Math.floor(now / 60)}`;
  const dayKey    = `rl:day:${ip}:${Math.floor(now / 86400)}`;

  async function redisCmd(cmd) {
    const res = await fetch(`${url}/${cmd.join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  try {
    // 파이프라인으로 incr + expire 동시 실행 (atomic)
    const pipe = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', minuteKey],
        ['EXPIRE', minuteKey, 60],
        ['INCR', dayKey],
        ['EXPIRE', dayKey, 86400],
      ]),
    });
    const results = await pipe.json();
    const minCount = results?.[0]?.result ?? 0;
    const dayCount = results?.[2]?.result ?? 0;

    if (minCount > 20) return { ok: false, reason: 'minute' };
    if (dayCount > 200) return { ok: false, reason: 'day' };
    return { ok: true };
  } catch (e) {
    // Redis 오류: 안전 우선으로 거부 (가용성보다 보안 우선)
    console.error('[별숨] Redis rate limit check failed:', e?.message);
    return { ok: false, reason: 'service' };
  }
}

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
  const { userMessage, context, isChat, isReport, isLetter, isScenario, isStory, isNatal, isZodiac, isComprehensive, isAstrology, isProfileQuestion, isGroupAnalysis, teamMode, isCalendarMonth, isSlot, isWeekly, isDaily, isDaeun, isAnalytics, responseStyle, kakaoId, clientHour } = body;

  if (typeof userMessage !== 'string' || !userMessage.trim()) {
    return { ok: false, reason: 'userMessage가 없거나 비어있어요' };
  }
  if (userMessage.length > 3000) {
    return { ok: false, reason: 'userMessage가 너무 길어요 (최대 3000자)' };
  }
  if (context !== undefined && typeof context !== 'string') {
    return { ok: false, reason: 'context는 문자열이어야 해요' };
  }

  // responseStyle: 'T' | 'M' | 'F' (기본: 'M')
  const validStyles = ['T', 'M', 'F'];
  const style = typeof responseStyle === 'string' && validStyles.includes(responseStyle) ? responseStyle : 'M';

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
      isNatal: !!isNatal,
      isZodiac: !!isZodiac,
      isComprehensive: !!isComprehensive,
      isAstrology: !!isAstrology,
      isProfileQuestion: !!isProfileQuestion,
      isGroupAnalysis: !!isGroupAnalysis,
      teamMode: !!(teamMode || isGroupAnalysis),
      isCalendarMonth: !!isCalendarMonth,
      isSlot: !!isSlot,
      isWeekly: !!isWeekly,
      isDaily: !!isDaily,
      isDaeun: !!isDaeun,
      isAnalytics: !!isAnalytics,
      responseStyle: style,
      kakaoId: kakaoId || null,
      clientHour: (typeof clientHour === 'number' && Number.isInteger(clientHour) && clientHour >= 0 && clientHour <= 23) ? clientHour : undefined,
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── 레이트 리미팅 ──
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    if (rl.reason === 'service') {
      return res.status(503).json({ error: '서비스가 잠시 점검 중이에요. 조금 뒤에 다시 시도해봐요 🌙' });
    }
    return res.status(429).json({ error: '너무 많은 요청이에요. 잠시 후 다시 시도해봐요 🌙' });
  }

  const validation = validateRequest(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.reason });
  }

  // ── 로그인 인증 (JWT 우선, kakaoId 하위 호환) ──
  const { kakaoId } = validation.data;
  if (!kakaoId) {
    return res.status(401).json({ error: '로그인이 필요해요 🌙' });
  }
  const authResult = await verifyUser(req);
  if (!authResult.ok) {
    return res.status(401).json({ error: '로그인이 필요해요 🌙' });
  }

  const { userMessage, context, isChat, isReport, isLetter, isScenario, isStory, isNatal, isZodiac, isComprehensive, isAstrology, isProfileQuestion, isGroupAnalysis, teamMode, isCalendarMonth, isSlot, isWeekly, isDaily, isDaeun, isAnalytics, responseStyle, clientHour } = validation.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY 환경변수를 Vercel에 설정해주세요!" });

  const today        = getTodayStr(clientHour);
  const season       = getSeasonDesc(today.m);
  // context 문자열에서 직업/상황 정보 추출 (직업 인식 힌트용)
  const userContext  = context ? context.slice(0, 500) : '';
  const categoryHint = getCategoryHint(userMessage, userContext);
  const endingHint      = pickEndingHint(userMessage);
  const categoryExample = getCategoryExample(userMessage);
  const timeHorizon     = getTimeHorizon(userMessage);
  const isDecision   = isDecisionQuestion(userMessage);

  // 모드별 동적 로드 — isSlot, isWeekly는 프론트에서 명시적으로 전달받아 사용 (userMessage 분석 없음)
  const systemBase = await buildSystem(
    today, season, categoryHint, endingHint, timeHorizon,
    userMessage, isChat, isReport, isLetter, isScenario, isStory, isDecision,
    categoryExample, isNatal, isZodiac, isComprehensive, isAstrology, responseStyle, isSlot, isWeekly, isDaily,
    isDaeun, isAnalytics
  );

  // isProfileQuestion: 프로필 맞춤 질문 생성 전용 시스템 프롬프트
  const profileQuestionSystem = isProfileQuestion
    ? `당신은 별숨(byeolsoom)이에요. 사주와 별자리를 기반으로 사용자를 깊이 이해하는 점성술 AI예요.
사용자의 20가지 자기소개 답변을 읽고, 그 사람에게만 맞는 심층 질문 5개를 JSON 배열로만 답해주세요.
각 질문은 사주와 별자리 관점에서 더 깊이 이해하기 위한 것으로, 개인적이고 구체적이어야 해요.
반드시 JSON만 응답하세요: [{"id":"aq_1","q":"질문 내용"},{"id":"aq_2","q":"..."},...]`
    : null;

  // teamMode/isGroupAnalysis: 그룹 관계 분석 전용 시스템 프롬프트
  const groupAnalysisSystem = (isGroupAnalysis || teamMode)
    ? `당신은 별숨(byeolsoom)이에요. 여러 사람의 사주와 별자리를 읽고 그들의 관계를 따뜻하고 재밌게 분석해줘요.
두 사람의 관계를 분석할 때는: 좋은 점, 조심해야 할 점, 함께하면 시너지가 나는 상황, 서로에게 필요한 것을 별숨의 언어로 이야기해주세요.
판단하지 말고, 재밌고 따뜻하게 두 별의 관계를 풀어주세요.
마크다운 문법(## --- ** * - 1.) 절대 금지. 소제목 금지. 번호 금지. 섹션 구분선 금지. 모든 텍스트는 일반 텍스트로만.`
    : null;

  const systemWithContext = (profileQuestionSystem || groupAnalysisSystem || systemBase)
    + (context
      ? `\n\n━━━ 오늘 상담하는 분의 기운 데이터 ━━━\n${context}\n(위 데이터는 취재 노트예요. 이걸 그대로 보여주는 게 아니라, 에세이의 재료로 자연스럽게 녹여요.)`
      : '');

  // 감성 깊이가 필요한 모드는 sonnet, 나머지는 haiku (비용 최적화)
  const model = "claude-haiku-4-5-20251001";

  // 모드별 최대 토큰 분기 — 응답이 중간에 끊기지 않도록 넉넉하게 설정
  const maxTokens =
    isComprehensive     ? 3500 :
    isAstrology         ? 3500 :
    isReport            ? 2500 :
    isCalendarMonth     ? 2000 :
    isLetter            ? 1500 :
    isStory             ? 3000 :
    isScenario          ? 2000 :
    isNatal             ? 2500 :
    isZodiac            ? 1200 :
    isGroupAnalysis     ? 1800 :
    isProfileQuestion   ?  800 :
    isDaily             ? 1800 :
    isDaeun             ? 2000 :
    isAnalytics         ? 1000 :
    isChat              ? 1200 :
                          1500;

  try {
    // Vercel 함수 30초 제한보다 5초 여유를 두고 25초 타임아웃 설정
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
          model: model,
          max_tokens: maxTokens,
          system: [
            {
              type: "text",
              text: systemWithContext,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [{ role: "user", content: userMessage }],
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic API error:", JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || "API 오류가 났어요" });
    }

    /** @type {AskResponse} */
    const result = { text: data.content?.[0]?.text || "" };
    return res.status(200).json(result);

  } catch (err) {
    if (err?.name === 'AbortError') {
      console.error("Anthropic API timeout (25s exceeded)");
      return res.status(504).json({ error: "별이 잠시 바빠요 🌙 잠시 후 다시 시도해봐요." });
    }
    console.error("Server error:", err?.message || err);
    return res.status(500).json({ error: "서버 오류가 났어요. 잠시 후 다시 시도해봐요 🌙" });
  }
}
