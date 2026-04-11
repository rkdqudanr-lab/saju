import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest 전략: src/sw.js를 커스텀 SW로 사용
      // (Web Push 알림 이벤트 핸들러 포함)
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: false, // public/manifest.json 직접 사용
      injectManifest: {
        globPatterns: ['**/*.{js,css,svg,png,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
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
