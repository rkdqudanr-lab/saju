# 🔮 별숨 (Byeolsoom) — AI 사주 × 점성술 앱

MZ 여성을 위한 AI 기반 사주 & 서양 점성술 상담 앱

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

## 📦 배포 (Vercel)

1. GitHub에 push
2. vercel.com 에서 repo 연결
3. 환경변수 설정 (아래 참고)
4. 자동 배포 완료!

## 🔑 환경변수 설정 가이드

### Vercel 대시보드 > Settings > Environment Variables 에서 설정

| 변수명 | 설명 | 필수 | 클라이언트 노출 |
|--------|------|------|-----------------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API 키 | ✅ | ❌ 서버 전용 |
| `KAKAO_REST_API_KEY` | 카카오 REST API 키 | 카카오 로그인 사용 시 | ❌ 서버 전용 |
| `KAKAO_REDIRECT_URI` | 카카오 OAuth 리다이렉트 URI (예: `https://yourdomain.com`) | 카카오 로그인 사용 시 | ❌ 서버 전용 |
| `VITE_KAKAO_JS_KEY` | 카카오 JS SDK 키 (JavaScript 앱 키) | 카카오 로그인 사용 시 | ⚠️ 클라이언트 노출 — 도메인 제한 필수 |
| `VITE_GA_ID` | Google Analytics 4 측정 ID (예: `G-XXXXXXXXXX`) | 선택 | ✅ 공개 허용 |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Rate Limit 활성화 시 | ❌ 서버 전용 |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token | Rate Limit 활성화 시 | ❌ 서버 전용 |

### ⚠️ 보안 필수 사항

1. **`VITE_KAKAO_JS_KEY` 도메인 제한**
   - [Kakao Developers](https://developers.kakao.com) > 앱 > 플랫폼 > Web
   - "사이트 도메인"에 서비스 도메인만 등록 (예: `https://byeolsoom.vercel.app`)
   - 등록되지 않은 도메인에서는 SDK 동작 불가

2. **`ANTHROPIC_API_KEY` / `KAKAO_REST_API_KEY` 절대 클라이언트 노출 금지**
   - `VITE_` 접두사를 절대 붙이지 마세요
   - `api/` 서버리스 함수에서만 `process.env`로 읽어야 합니다

3. **Rate Limiting (Upstash Redis)**
   - [Upstash Console](https://console.upstash.com)에서 Redis 데이터베이스 생성
   - REST URL과 Token을 환경변수에 설정
   - 미설정 시 인메모리 폴백으로 동작 (단일 인스턴스에서만 유효)

4. **`KAKAO_REDIRECT_URI` 서버 환경변수**
   - 클라이언트에서 `redirectUri` 전달 방식은 보안 취약점 — 서버 환경변수에서만 읽음
   - Kakao Developers > 카카오 로그인 > Redirect URI 목록과 정확히 일치해야 함

### 로컬 개발용 `.env.local` 예시

```env
ANTHROPIC_API_KEY=sk-ant-...
KAKAO_REST_API_KEY=your_rest_api_key
KAKAO_REDIRECT_URI=http://localhost:5173
VITE_KAKAO_JS_KEY=your_js_app_key
VITE_GA_ID=G-XXXXXXXXXX
# Rate Limit (선택 — 미설정 시 인메모리 폴백)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

## 📁 구조

```
byeolsoom/
├── api/
│   ├── ask.js           ← AI 상담 API (rate limit, 프롬프트 인젝션 필터 포함)
│   ├── kakao-auth.js    ← 카카오 OAuth (CSRF state 검증, redirectUri 서버 환경변수)
│   └── prompts/         ← 시스템 프롬프트 빌더
├── src/
│   ├── App.jsx          ← 메인 앱
│   ├── hooks/           ← 커스텀 훅
│   ├── components/      ← UI 컴포넌트
│   ├── utils/           ← 사주/점성술 계산 유틸
│   └── styles/theme.js  ← CSS-in-JS 테마
├── index.html
├── vite.config.js
└── package.json
```
