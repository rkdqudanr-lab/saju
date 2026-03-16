import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️  VITE_ 환경변수 보안 주의사항
// VITE_ 접두사가 붙은 환경변수는 빌드 시 클라이언트 번들에 인라인됩니다.
// 현재 노출되는 변수:
//   - VITE_KAKAO_JS_KEY : Kakao JS SDK 초기화용. 클라이언트 노출은 불가피하나
//     Kakao Developers(https://developers.kakao.com) 앱 설정에서
//     "플랫폼 > 사이트 도메인"을 반드시 허용 도메인으로만 제한해야 합니다.
//   - VITE_GA_ID        : Google Analytics 측정 ID. 공개 허용 값입니다.
//
// 절대 VITE_ 접두사로 노출하면 안 되는 값:
//   - ANTHROPIC_API_KEY, KAKAO_REST_API_KEY, KAKAO_ADMIN_KEY
//   → 위 키들은 api/ 서버리스 함수에서만 process.env로 읽어야 합니다.

export default defineConfig({
  plugins: [react()],
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
