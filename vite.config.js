import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { buildAiRequestContext, validateAiRequest } from './lib/aiRequest.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '';
  // ── 로컬용 API 미들웨어 (/api/ask, /api/stream) ──
  // dev(5173)와 preview(4173) 모두 등록 — preview에 등록하지 않으면 빌드 확인 시 AI 기능 전체가 404
  const registerApiMiddlewares = (server) => {
        // POST /api/ask
        server.middlewares.use('/api/ask', async (req, res) => {
          if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(Buffer.concat(chunks).toString());
              const validation = validateAiRequest(parsed);
              if (!validation.ok) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: validation.reason }));
                return;
              }
              if (!apiKey) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY 환경변수가 필요해요.' }));
                return;
              }
              const { systemWithContext, maxTokens } = await buildAiRequestContext(validation.data);
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 50000); // api/ask.js와 동일
              let anthropicRes;
              try {
                anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
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
                    // api/ask.js와 동일하게 유지 — 기본 1.0은 한국어 오타·조사 누락이 잦음
                    temperature: validation.data.isDaily ? 0.65 : 0.8,
                    system: [{ type: 'text', text: systemWithContext }],
                    messages: [{ role: 'user', content: validation.data.userMessage }],
                  }),
                });
              } finally {
                clearTimeout(timeout);
              }
              const body = await anthropicRes.json();
              if (!anthropicRes.ok) {
                console.error('[별숨:ask] Anthropic error:', JSON.stringify(body));
                res.writeHead(anthropicRes.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: body.error?.message || 'AI 오류' }));
                return;
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ text: body.content?.[0]?.text || '' }));
            } catch (e) {
              if (e?.name === 'AbortError') {
                res.writeHead(504, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '별이 잠시 바빴어요. 다시 시도해주세요.' }));
              } else {
                console.error('[별숨:ask] Error:', e?.message || e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '서버 오류가 있었어요.' }));
              }
            }
          });
        });

        // POST /api/stream (SSE)
        server.middlewares.use('/api/stream', async (req, res) => {
          if (req.method !== 'POST') {
            res.writeHead(405);
            res.end();
            return;
          }
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', async () => {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no',
            });
            const sendError = () => {
              try {
                res.write(`data: ${JSON.stringify({ error: 'AI 서버 오류 (로컬 dev)' })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
              } catch {}
            };
            try {
              const parsed = JSON.parse(Buffer.concat(chunks).toString());
              const validation = validateAiRequest(parsed);
              if (!validation.ok) { sendError(); return; }
              if (!apiKey) { sendError(); return; }
              const { systemWithContext, maxTokens } = await buildAiRequestContext(validation.data);
              const streamController = new AbortController();
              const streamTimeout = setTimeout(() => streamController.abort(), 48000); // api/stream.js와 동일 (종합분석 7000토큰 스트림이 30초 초과)
              let anthropicRes;
              try {
                anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  signal: streamController.signal,
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                  },
                  body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: maxTokens,
                    // api/stream.js와 동일하게 유지
                    temperature: validation.data.isDaily ? 0.65 : 0.8,
                    stream: true,
                    system: [{ type: 'text', text: systemWithContext }],
                    messages: [{ role: 'user', content: validation.data.userMessage }],
                  }),
                });
              } finally {
                clearTimeout(streamTimeout);
              }
              if (!anthropicRes.ok) { sendError(); return; }
              let buf = '';
              const decoder = new TextDecoder();
              for await (const chunk of anthropicRes.body) {
                buf += decoder.decode(chunk, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop() || '';
                for (const line of lines) {
                  const t = line.trim();
                  if (!t.startsWith('data: ')) continue;
                  const raw = t.slice(6);
                  if (raw === '[DONE]') continue;
                  try {
                    const ev = JSON.parse(raw);
                    if (ev.type === 'content_block_delta' && ev.delta?.text) {
                      res.write(`data: ${JSON.stringify({ text: ev.delta.text })}\n\n`);
                    }
                    if (ev.type === 'message_stop') {
                      res.write('data: [DONE]\n\n');
                    }
                  } catch { /* 파싱 실패 무시 */ }
                }
              }
              try { res.end(); } catch {}
            } catch (e) {
              console.error('[별숨:stream] Error:', e?.message || e);
              sendError();
            }
          });
        });
  };

  return {
  plugins: [
    react(),
    {
      name: 'byeolsoom-api',
      configureServer: registerApiMiddlewares,
      configurePreviewServer: registerApiMiddlewares,
    },
    VitePWA({
      // injectManifest 전략: src/sw.js를 커스텀 SW로 사용
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,svg,png,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('html2canvas')) return 'html2canvas';
          if (id.includes('jspdf')) return 'jspdf';
          if (id.includes('framer-motion')) return 'motion';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/zustand/')
          ) {
            return 'react-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
  }
})
