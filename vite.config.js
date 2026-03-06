import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 로컬 개발 시 /api/* 요청을 Vercel dev 서버로 프록시
    // npm run dev 대신 vercel dev 사용 시 이 설정 불필요
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
