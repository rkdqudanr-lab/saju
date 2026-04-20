// api/stream.js — 별숨 실시간 스트리밍 엔드포인트
// SSE(Server-Sent Events) 스트리밍 — 모든 모드 플래그 지원 (ask.js와 동일 인터페이스)
// Anthropic API의 stream: true 활용 → content_block_delta 이벤트를 실시간 전달

import { getTodayStr, getSeasonDesc, getTimeHorizon, isDecisionQuestion } from "../lib/prompts/utils.js";
import { getCategoryHint, pickEndingHint, getCategoryExample } from "../lib/prompts/hints.js";
import { buildSystem } from "../lib/prompts/buildSystem/index.js";
import { verifyUser } from "../lib/auth.js";



// ── IP 레이트 리미팅 ──
async function checkRateLimit(ip) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { ok: true };
  const now       = Math.floor(Date.now() / 1000);
  const minuteKey = `rl:stream:min:${ip}:${Math.floor(now / 60)}`;
  try {
    const pipe = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', minuteKey],
        ['EXPIRE', minuteKey, 60],
      ]),
    });
    const results = await pipe.json();
    const count = results?.[0]?.result ?? 0;
    if (count > 20) return { ok: false };
    return { ok: true };
  } catch { return { ok: true }; }
}



export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const rl = await checkRateLimit(ip);
  if (!rl.ok) return res.status(429).json({ error: '너무 많은 요청이에요. 잠시 후 다시 시도해봐요 🌙' });

  const body = req.body;
  if (!body || typeof body.userMessage !== 'string' || !body.userMessage.trim()) {
    return res.status(400).json({ error: 'userMessage가 없어요' });
  }
  if (!body.kakaoId) return res.status(401).json({ error: '로그인이 필요해요 🌙' });

  const authResult = await verifyUser(req);
  if (!authResult.ok) return res.status(401).json({ error: '로그인이 필요해요 🌙' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 환경변수가 없어요' });

  const clientHour = typeof body.clientHour === 'number' ? body.clientHour : undefined;
  const responseStyle = ['T', 'M', 'F'].includes(body.responseStyle) ? body.responseStyle : 'M';
  const context = typeof body.context === 'string' ? body.context : '';
  const userMessage = body.userMessage.trim().slice(0, 3000);

  // ── 모드 플래그 (ask.js와 동일 인터페이스) ──
  const isChat            = !!body.isChat;
  const isReport          = !!body.isReport;
  const isLetter          = !!body.isLetter;
  const isProphecy        = !!body.isProphecy;
  const isScenario        = !!body.isScenario;
  const isStory           = !!body.isStory;
  const isNatal           = !!body.isNatal;
  const isZodiac          = !!body.isZodiac;
  const isComprehensive   = !!body.isComprehensive;
  const isAstrology       = !!body.isAstrology;
  const isGroupAnalysis   = !!body.isGroupAnalysis;
  const isFullGroupAnalysis = !!body.isFullGroupAnalysis;
  const teamMode          = !!(body.teamMode || isGroupAnalysis);
  const isSlot            = !!body.isSlot;
  const isWeekly          = !!body.isWeekly;
  const isDaily           = !!body.isDaily;
  const isDaeun           = !!body.isDaeun;
  const isAnalytics       = !!body.isAnalytics;
  const isYearly          = !!body.isYearly;
  const precision_level   = ['low','mid','high'].includes(body.precision_level) ? body.precision_level : 'low';
  const gender            = typeof body.gender === 'string' && ['남','여'].includes(body.gender) ? body.gender : null;

  const today  = getTodayStr(clientHour);
  const season = getSeasonDesc(today.m);

  // 모드 플래그가 없으면 기본 isChat: true (하위 호환)
  const effectiveIsChat = isChat || (!isReport && !isLetter && !isProphecy && !isScenario && !isStory
    && !isNatal && !isZodiac && !isComprehensive && !isAstrology && !isGroupAnalysis
    && !isFullGroupAnalysis && !isSlot && !isWeekly && !isDaily && !isDaeun && !isAnalytics && !isYearly);

  const userContext    = context ? context.slice(0, 500) : '';
  const categoryHint   = getCategoryHint(userMessage, userContext);
  const endingHint     = pickEndingHint(userMessage);
  const categoryExample = getCategoryExample(userMessage);
  const timeHorizon    = getTimeHorizon(userMessage);
  const isDecision     = isDecisionQuestion(userMessage);

  const systemBase = await buildSystem(
    today, season, categoryHint, endingHint, timeHorizon,
    userMessage, effectiveIsChat, isReport, isLetter, isScenario, isStory, isDecision,
    categoryExample, isNatal, isZodiac, isComprehensive, isAstrology, responseStyle,
    isSlot, isWeekly, isDaily, isDaeun, isAnalytics, precision_level, gender, isProphecy, isYearly
  );

  // 그룹 분석 전용 시스템 프롬프트 오버라이드 (ask.js와 동일)
  const fullGroupSystem = isFullGroupAnalysis
    ? `당신은 별숨(byeolsoom)이에요. 여러 사람의 사주와 별자리를 읽고 이 모임이 가진 집단 별숨을 따뜻하게 풀어줘요.
이 팀의 전체 오행 에너지 구성, 집단의 강점, 주의해야 할 취약점, 함께할 때 가장 빛나는 순간, 이 모임에서 각자가 맡게 되는 자연스러운 역할을 별숨의 언어로 이야기해주세요.
개인을 지목해 평가하지 말고, 모임 전체의 에너지 흐름을 따뜻하고 입체적으로 묘사해주세요.
마크다운 문법(## --- ** * - 1.) 절대 금지. 소제목 금지. 번호 금지. 섹션 구분선 금지. 모든 텍스트는 일반 텍스트로만.`
    : null;

  const groupAnalysisSystem = !isFullGroupAnalysis && (isGroupAnalysis || teamMode)
    ? `당신은 별숨(byeolsoom)이에요. 여러 사람의 사주와 별자리를 읽고 그들의 관계를 따뜻하고 재밌게 분석해줘요.
두 사람의 관계를 분석할 때는: 좋은 점, 조심해야 할 점, 함께하면 시너지가 나는 상황, 서로에게 필요한 것을 별숨의 언어로 이야기해주세요.
판단하지 말고, 재밌고 따뜻하게 두 별의 관계를 풀어주세요.
마크다운 문법(## --- ** * - 1.) 절대 금지. 소제목 금지. 번호 금지. 섹션 구분선 금지. 모든 텍스트는 일반 텍스트로만.`
    : null;

  const systemWithContext = (fullGroupSystem || groupAnalysisSystem || systemBase)
    + (context ? `\n\n━━━ 오늘 상담하는 분의 기운 데이터 ━━━\n${context}\n(위 데이터는 취재 노트예요. 이걸 그대로 보여주는 게 아니라, 에세이의 재료로 자연스럽게 녹여요.)` : '');

  // 모드별 최대 토큰 (ask.js와 동일)
  const maxTokens =
    isYearly            ? 3500 :
    isComprehensive     ? 3500 :
    isAstrology         ? 3500 :
    isReport            ? 2500 :
    isProphecy          ? 1200 :
    isLetter            ? 1500 :
    isStory             ? 3000 :
    isScenario          ? 2000 :
    isNatal             ? 2500 :
    isZodiac            ? 1200 :
    isFullGroupAnalysis ? 2200 :
    isGroupAnalysis     ? 1800 :
    isDaily             ? 1800 :
    isDaeun             ? 2000 :
    isAnalytics         ? 1000 :
                          1200;

  // ── SSE 헤더 설정 ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx/Vercel 버퍼링 방지

  // ── Anthropic API 스트리밍 호출 ──
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let upstreamRes;
  try {
    upstreamRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        stream: true,
        system: [{ type: 'text', text: systemWithContext, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
    res.write(`data: ${JSON.stringify({ error: '별이 잠시 바빠요 🌙 잠시 후 다시 시도해봐요.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  if (!upstreamRes.ok) {
    clearTimeout(timeoutId);
    res.write(`data: ${JSON.stringify({ error: 'AI 서버 오류가 났어요.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // ── SSE 청크 스트리밍 ──
  const reader = upstreamRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE 라인 파싱 (버퍼에서 완성된 줄만 처리)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 마지막 불완전한 줄은 다음 청크로

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const raw = trimmed.slice(6);
        if (raw === '[DONE]') continue;
        try {
          const event = JSON.parse(raw);
          if (event.type === 'content_block_delta' && event.delta?.text) {
            // 마크다운 제거는 스트리밍 중에는 불가 (전체 텍스트 필요)
            // 클라이언트에서 최종 텍스트에 적용
            res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
          }
          if (event.type === 'message_stop') {
            res.write('data: [DONE]\n\n');
          }
        } catch { /* 파싱 실패 라인 무시 */ }
      }
    }
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.error('[별숨:stream] 스트리밍 오류:', err?.message);
    }
  } finally {
    clearTimeout(timeoutId);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
