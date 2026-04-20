import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
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
    sourcemap: true,
  },
  server: {
    proxy: {
      // ── /api/ask: 로컬 dev용 Anthropic 직접 프록시 ──
      '/api/ask': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: () => '/v1/messages',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const body = [];
            req.on('data', chunk => body.push(chunk));
            req.on('end', () => {
              try {
                const parsed = JSON.parse(Buffer.concat(body).toString());
                const newBody = JSON.stringify({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 1200,
                  system: parsed.system,
                  messages: [{ role: 'user', content: parsed.userMessage }],
                });
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('x-api-key', process.env.ANTHROPIC_API_KEY || '');
                proxyReq.setHeader('anthropic-version', '2023-06-01');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(newBody));
                proxyReq.write(newBody);
                proxyReq.end();
              } catch (e) {
                console.error('Proxy error:', e);
              }
            });
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const chunks = [];
            proxyRes.on('data', chunk => chunks.push(chunk));
            proxyRes.on('end', () => {
              try {
                const data = JSON.parse(Buffer.concat(chunks).toString());
                const out = JSON.stringify({ text: data.content?.[0]?.text || '' });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(out);
              } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: '파싱 오류' }));
              }
            });
          });
        },
        selfHandleResponse: true,
      },

      // ── /api/stream: 로컬 dev용 SSE 스트리밍 프록시 ──
      '/api/stream': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: () => '/v1/messages',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const body = [];
            req.on('data', chunk => body.push(chunk));
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(Buffer.concat(body).toString());
                const year = new Date().getFullYear();

                // 모드별 간이 시스템 프롬프트 (로컬 dev 전용)
                let systemPrompt = '당신은 별숨이에요. 사주와 별자리로 운세를 봐줘요. 마크다운 금지.';
                if (parsed.isYearly) {
                  systemPrompt = `당신은 별숨이에요. 사주와 별자리 데이터로 ${year}년 운세를 월별로 분석해요.\n[총평] 3~4문장. [1월]~[12월] 각 2~3문장 (재물·연애·건강·커리어 포함). [마무리] 1~2문장. 마크다운 금지.`;
                } else if (parsed.isComprehensive || parsed.isAstrology) {
                  systemPrompt = '당신은 별숨이에요. 사주와 점성술을 종합 분석해줘요. 마크다운 금지.';
                } else if (parsed.isLetter || parsed.isProphecy) {
                  systemPrompt = '당신은 별숨이에요. 따뜻한 운세 편지를 써줘요. 마크다운 금지.';
                }

                const contextNote = parsed.context
                  ? `\n\n[사용자 데이터]\n${String(parsed.context).slice(0, 800)}`
                  : '';

                const maxTokens =
                  parsed.isYearly || parsed.isComprehensive || parsed.isAstrology ? 3500 :
                  parsed.isLetter || parsed.isStory ? 2000 : 1400;

                const newBody = JSON.stringify({
                  model: 'claude-haiku-4-5-20251001',
                  max_tokens: maxTokens,
                  stream: true,
                  system: [{ type: 'text', text: systemPrompt + contextNote }],
                  messages: [{ role: 'user', content: String(parsed.userMessage || '').slice(0, 3000) }],
                });
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('x-api-key', process.env.ANTHROPIC_API_KEY || '');
                proxyReq.setHeader('anthropic-version', '2023-06-01');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(newBody));
                proxyReq.write(newBody);
                proxyReq.end();
              } catch (e) {
                console.error('[별숨:stream-proxy] Error:', e);
              }
            });
          });

          // Anthropic SSE → 별숨 SSE 포맷으로 변환
          proxy.on('proxyRes', (proxyRes, _req, res) => {
            res.writeHead(proxyRes.statusCode >= 400 ? 200 : proxyRes.statusCode, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no',
            });
            if (proxyRes.statusCode >= 400) {
              res.write(`data: ${JSON.stringify({ error: 'AI 서버 오류 (로컬 dev)' })}\n\n`);
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }
            let buf = '';
            proxyRes.on('data', chunk => {
              buf += chunk.toString();
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
            });
            proxyRes.on('end', () => { try { res.end(); } catch {} });
            proxyRes.on('error', () => {
              try {
                res.write('data: [DONE]\n\n');
                res.end();
              } catch {}
            });
          });
        },
        selfHandleResponse: true,
      },
    },
  },
})
