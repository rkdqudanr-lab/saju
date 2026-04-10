// api/stream.js — 별숨 채팅 실시간 스트리밍 엔드포인트
// chat 모드 전용 SSE(Server-Sent Events) 스트리밍
// Anthropic API의 stream: true 활용 → content_block_delta 이벤트를 실시간 전달

import { getTodayStr, getSeasonDesc } from "../lib/prompts/utils.js";
import { buildSystem } from "../lib/prompts/buildSystem/index.js";
import { verifyJWT } from "../lib/jwt.js";

// ── 사용자 인증 (ask.js와 동일 로직) ──
async function verifyUser(req) {
  const jwtSecret = process.env.JWT_SECRET;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (jwtSecret) {
      const payload = verifyJWT(token, jwtSecret);
      if (payload?.sub) return { ok: true, kakaoId: payload.sub };
      return { ok: false };
    }
    console.warn('[별숨:stream] JWT_SECRET 없음 — Bearer 토큰 형식 검증만 수행');
  }
  const kakaoId = req.body?.kakaoId;
  if (!kakaoId) return { ok: false };
  if (!/^\d{1,20}$/.test(String(kakaoId))) return { ok: false };

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
      console.error('[별숨:stream] verifyUser 오류:', e?.message);
      return { ok: false };
    }
  }
  return { ok: true, kakaoId };
}

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

// ── 마크다운 제거 (ask.js의 stripMarkdown과 동일 패턴) ──
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim();
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

  const today  = getTodayStr(clientHour);
  const season = getSeasonDesc(today.m);

  // chat 모드 전용 — 항상 isChat: true
  const systemBase = await buildSystem(
    today, season, '', '', '가장 가까운 시일 (1~2주) 범위로',
    userMessage, true, false, false, false, false, false,
    '', false, false, false, false, responseStyle, false, false, false
  );
  const systemWithContext = systemBase
    + (context ? `\n\n━━━ 오늘 상담하는 분의 기운 데이터 ━━━\n${context}\n` : '');

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
        max_tokens: 1200,
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
