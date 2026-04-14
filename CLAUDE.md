# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**별숨 (Byeolsoom)** — AI-based Korean Saju (四柱) fortune-telling × Western astrology app. Korean-language UI, deployed on Vercel as a PWA. Frontend is React + Vite; backend is Vercel serverless functions. AI responses come from Anthropic's Claude API (claude-haiku-4-5-20251001).

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

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
