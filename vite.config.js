import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: false, // public/manifest.json 직접 사용
      workbox: {
        // App Shell 캐싱 전략
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // API 호출은 네트워크 우선, 실패 시 캐시
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 20, maxAgeSeconds: 3600 },
            },
          },
          {
            // 폰트/CDN 리소스 캐시
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 86400 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    proxy: {
      // 로컬 개발 시 /api/ask → 직접 Anthropic API로 프록시
      // (로컬에서는 .env.local의 ANTHROPIC_API_KEY 사용)
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
    },
  },
})
