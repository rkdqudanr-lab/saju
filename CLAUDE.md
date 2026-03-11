# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**별숨 (Byeolsum) / 민중 (Minjung)** — AI 사주 × 점성술 앱
An AI-powered Korean fortune-telling app targeting MZ women (20s-30s), combining Eastern astrology (사주/Saju) with Western astrology (zodiac signs).

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start local dev server (Vite)
npm run build     # Production build
npm run preview   # Preview production build
```

No test or lint scripts are configured.

## Environment Variables

**Local development** (`npm run dev`):
- `ANTHROPIC_API_KEY` — Required for the Vite proxy to forward requests to Claude API

**Production (Vercel)**:
- `ANTHROPIC_API_KEY` — For `api/ask.js` serverless function
- `KAKAO_REST_API_KEY` — Kakao OAuth
- `KAKAO_ADMIN_KEY` — Kakao OAuth admin key

## Architecture

### Local Dev Proxy (vite.config.js)

In development, requests to `/api/ask` are intercepted by a **custom Vite proxy** that transforms the client-side request into an Anthropic API call directly (reading `ANTHROPIC_API_KEY` from env). This means in dev, `api/ask.js` is **not used**—Vite handles the API call itself. In production on Vercel, `api/ask.js` is used.

### Frontend (`src/App.jsx` — 2,800+ lines, monolithic)

The entire frontend is a single React component with no router or external state management. Key systems embedded in this file:

- **Saju (四柱) Engine** — `getSaju(y, m, d, h)` computes the 4-pillar birth chart (year/month/day/hour pillars) using Heavenly Stems (천간) and Earthly Branches (지지), calculates dominant (dom) and lacking (lac) five elements
- **Western Astrology** — `getSun()`, `getMoon()`, `getAsc()` compute solar sign, lunar sign, and ascendant
- **Lunar Calendar** — `solarToLunarFE()` uses a `LUNAR_TABLE_FE` lookup covering 2020–2028 to convert Gregorian dates
- **Time-Based UI** — `getTimeSlot()` returns morning/afternoon/evening/dawn and `TIME_CONFIG` applies matching colors, greetings, and prompt tone
- **Question Categories** (`CATS`) — 15 life topics (love, work, money, health, etc.), each with sample questions
- **Pricing Tiers** (`PKGS`) — 5 tiers controlling follow-up chat limits (0–20)

State is managed entirely with React hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`). Styling is done with inline React style objects.

### Backend (`api/ask.js` — Vercel Serverless)

Core prompt engineering lives here:

- `buildSystem(saju, astro, mode, ...)` — Builds the Claude system prompt. Supports modes: `essay`, `chat`, `report` (월간리포트), `letter`, `scenario` (compatibility)
- `getCategoryHint(question)` — Keyword-based category detection for tone adjustment (6 categories)
- Enforces `[요약]` summary tag in responses
- **Blacklisted terminology**: technical 사주 jargon (갑목, 을목, 병화, etc.) is forbidden to keep language accessible
- `ENDING_HINTS` — 8 rotating conclusion styles for variety

### Data Flow

```
User input (question + birth date/time)
  → Frontend calculates Saju + Astrology charts
  → Builds context (season, time slot, category)
  → POST /api/ask (with system prompt + user message)
  → [Dev] Vite proxy → Anthropic API
  → [Prod] api/ask.js → Anthropic API (claude-sonnet-4-20250514, max_tokens: 1200)
  → Parse [요약] tag, strip markdown
  → Render with time-specific styling
```

### Auth (`api/kakao-auth.js`)

Exchanges Kakao OAuth authorization code for access token, then fetches user profile (ID, nickname, profile image).
