# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

> **세션 시작 시 반드시 먼저 읽을 것**: [`docs/DASHBOARD.md`](docs/DASHBOARD.md)
> 전체 기능 Q&A, 키 매핑, 버그 패턴, 리팩토링 로드맵이 정리되어 있음.
>
> **한글 파일 수정 최우선 원칙**
> - 한글이 포함된 파일은 반드시 UTF-8로만 읽고/수정/저장할 것
> - 인코딩을 확실히 보장할 수 없는 도구/방식으로는 한글 파일을 수정하지 말 것
> - 수정 직후 깨진 한글(`�`, `ì`, `ë`, `ê`, `Ã`, `Â` 등)이 없는지 즉시 확인할 것

## Project Overview

**별숨 (Byeolsoom)** — AI-based Korean Saju (四柱) fortune-telling × Western astrology app. Korean-language UI, deployed on Vercel as a PWA. Frontend is React + Vite; backend is Vercel serverless functions. AI responses come from Anthropic's Codex API (Codex-haiku-4-5-20251001).

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

## Encoding Rules

- 모든 신규/수정 텍스트 파일은 반드시 UTF-8로 저장한다.
- 가능하면 UTF-8(BOM 없음) 기준을 유지하고, 한글이 포함된 파일을 CP949/EUC-KR/ANSI로 다시 저장하지 않는다.
- 한글이 들어 있는 기존 파일은 파일 전체 재작성보다 필요한 부분만 정확히 수정해 인코딩 변형 위험을 줄인다.
- PowerShell, 스크립트, 에디터 설정 등 파일 입출력 경로에서도 UTF-8을 명시한다. 인코딩을 보장할 수 없는 도구로는 한글 파일을 수정하지 않는다.
- 수정 직후 diff 또는 파일 재열람으로 `�`, `ì`, `ë`, `ê`, `Ã`, `Â` 같은 깨짐 문자가 없는지 반드시 검증한다.
- 한글이 깨져 보이면 내용을 먼저 바꾸지 말고 인코딩 문제 여부를 확인한 뒤, 의미를 복구해서 UTF-8로 정상 저장한다.

No test runner is configured. There is a standalone script:
```bash
node test-iljin.mjs   # Manual test for jeolgi/iljin calculation logic
node scripts/check-response-diversity.mjs  # Check AI response diversity
```

## Environment Variables

For local dev, create a `.env` file:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...          # Used by vite.config.js dev proxy
```

For the Vercel serverless functions (`api/`), set these in the Vercel dashboard:
- `ANTHROPIC_API_KEY` — required for all AI calls
- `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — for user verification
- `JWT_SECRET` — enables JWT auth (falls back to kakao_id body param if unset)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — rate limiting (skipped if unset)

## Architecture

### State Management
Global state lives in a single **Zustand store** (`src/store/useAppStore.js`). Several custom hooks populate the store at runtime:
- `useUserProfile` → injects `user`, `profile`, `form`, auth functions
- `useSajuContext` → injects `saju`, `sun`, `moon`, `asc`, `today`, `buildCtx`
- `useGamification` → injects `gamificationState`, `missions`

`src/context/AppContext.jsx` is a **shim** that re-exports `useUserCtx`, `useSajuCtx`, `useGamCtx` from the Zustand store using `useShallow` to prevent infinite re-renders (Zustand v5 behavior).

### Routing
There is **no React Router**. Navigation is done via `step` (integer) in the Zustand store. `src/hooks/useNavigation.js` provides `goTo(step)` helpers. Most pages/components are lazy-loaded in `App.jsx`.

### Saju / Astrology Logic
- `src/utils/saju.js` — core Korean 사주 calculation (4 pillars: year/month/day/hour), lunar calendar conversion, jeolgi-based month boundaries
- `src/utils/astrology.js` — Western astrology (sun sign, moon sign, ascendant)
- `lib/jeolgi.js` — solar term (절기) calculation used by saju.js

### AI Prompt System
`lib/prompts/buildSystem/` contains all system prompt builders. `index.js` routes to the correct builder based on boolean mode flags received from the frontend. **Mode detection is flag-based only** (never inferred from `userMessage` content) to prevent prompt injection.

Mode flags sent to `POST /api/ask`:
- `isChat`, `isReport`, `isLetter`, `isScenario`, `isStory` — content format modes
- `isNatal`, `isZodiac`, `isComprehensive`, `isAstrology` — Western astrology modes
- `isSlot`, `isWeekly`, `isDaily`, `isDaeun` — time-based fortune modes
- `isGroupAnalysis` / `teamMode` — multi-person compatibility
- `responseStyle`: `'T'` (brief), `'M'` (medium, default), `'F'` (full)
- `precision_level`: `'low'` | `'mid'` | `'high'` — data depth hint for prompts

### API Endpoint (`api/ask.js`)
Single Vercel serverless function. Auth flow: JWT Bearer header → kakao_id body fallback. Rate limiting via Upstash Redis (20 req/min, 200 req/day per IP). Uses `anthropic-beta: prompt-caching-2024-07-31` for system prompt caching.

In local dev, `vite.config.js` proxies `/api/ask` directly to Anthropic's API.

### Gamification / BP System
BP (별 포인트) currency drives feature unlocks. Logic is in `src/utils/gamificationLogic.js` and managed by `src/hooks/useGamification.js`. Guardian levels are earned by completing missions. BP is stored in Supabase.

### Supabase
`src/lib/supabase.js` exports two clients:
- `supabase` — anonymous client
- `getAuthenticatedClient(kakaoId)` — injects `x-kakao-id` header for RLS row-level security; singleton-cached per `kakaoId`

Auth is Kakao OAuth (`api/kakao-auth.js`), not Supabase Auth. JWT tokens are issued server-side and stored client-side.

### PWA
Custom service worker at `src/sw.js`, registered via `vite-plugin-pwa` with `injectManifest` strategy. `vercel.json` disables caching for `sw.js` and `index.html`.
