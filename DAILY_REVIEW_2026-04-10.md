# 별숨 일일 코드 리뷰 — 2026-04-10

> 리뷰 대상 커밋: `5bc19e7` (Merge) ← `b976eef`
> 변경 파일: 16개 / +871줄 -80줄

---

## 오늘 추가된 기능 요약

| 파일 | 변경 내용 |
|------|----------|
| `api/stream.js` | 신규: SSE 스트리밍 채팅 엔드포인트 |
| `src/hooks/useConsultation.js` | `sendStreamChat` 추가 (SSE 클라이언트) |
| `src/components/CompatPage.jsx` | 궁합 티어 배지 (`getCompatTier`) 추가 |
| `src/components/SajuCardPage.jsx` | 오행 테마 + 스티커 기능으로 전면 개편 |
| `src/components/DiaryListPage.jsx` | 일기 목록 페이지 신규 추가 |
| `src/components/GroupBulseumPage.jsx` | localStorage 백업 폴백 추가 |

---

## 1. `api/stream.js` — SSE 스트리밍 엔드포인트 ✅ 양호 / ⚠️ 주의사항 있음

### 잘된 점
- IP 기반 레이트 리미팅 구현 (분당 20회 제한, Upstash Redis)
- `AbortController` + 25초 타임아웃으로 Vercel 함수 제한 대응
- `X-Accel-Buffering: no` 헤더로 Nginx/Vercel 버퍼링 방지
- JWT → kakaoId 순으로 인증 우선순위 명확

### 문제점

**[중요] `stripMarkdown` 함수 중복 정의**
- `api/stream.js:69`에 정의되어 있으나 스트리밍 중에는 사용되지 않음 (주석으로 "클라이언트에서 처리" 명시)
- `ask.js`에도 동일 함수 존재 → 공유 유틸로 추출 필요
- 현재 dead code 상태

```js
// api/stream.js:68 — 사용 안 됨, 제거 권장
function stripMarkdown(text) { ... }
```

**[주의] `verifyUser` 로직이 `ask.js`와 완전히 중복**
- `api/stream.js:10-43` ↔ `api/ask.js`의 verifyUser 로직이 복사-붙여넣기
- 향후 인증 로직 변경 시 두 파일을 모두 수정해야 하는 유지보수 위험
- `lib/auth.js` 등으로 분리 권장

**[경미] `message_stop` 이벤트 후 루프가 계속 돌 가능성**
- `res.write('data: [DONE]\n\n')` 후 break가 없어 나머지 줄을 계속 처리함
- Anthropic이 `message_stop` 다음에 추가 라인을 보내지 않아 실제 문제는 없으나 명시적 break 권장

---

## 2. `useConsultation.js` — `sendStreamChat` 추가 ✅ 양호

### 잘된 점
- 기존 `sendChat`과 분리된 별도 함수로 SSE 전용 처리
- `streaming: true` 플래그를 chatHistory에 추가해 UI 상태 구분

### 문제점

**[주의] `sendStreamChat`과 `sendChat` 두 함수의 의존성 배열 불일치**
- `sendChat`의 deps: `[chatInput, chatLoading, chatLeft, selQs, answers, chatHistory, callApi]`
- `sendStreamChat`의 deps: `[chatInput, chatLoading, chatLeft, selQs, answers, chatHistory, buildCtx, responseStyle, user?.id]`
- `sendStreamChat`은 `callApi`를 통하지 않고 직접 fetch → 향후 공통 에러 처리나 토큰 갱신 로직에서 누락될 수 있음

**[경미] 스트리밍 중 컴포넌트 언마운트 시 setState 호출 가능**
- SSE reader는 컴포넌트가 사라져도 계속 읽음
- cleanup 없이 `setChatHistory`를 계속 호출 → React warning 발생 가능
- `useRef`로 마운트 여부 추적하거나 AbortController를 prop으로 받아야 함

---

## 3. `CompatPage.jsx` — 궁합 티어 배지 ✅ 잘됨

### 잘된 점
- `getCompatTier(score)` 함수 분리가 깔끔함
- 점수 범위별 레이블/이모지/색상 일관성 있음
- 인라인 IIFE `(() => {...})()` 패턴으로 조건부 렌더링 처리

### 개선 제안 (필수 아님)
- `COMP_TIERS` 상수 배열로 뽑으면 향후 변경이 쉬워짐

```js
// 현재 방식
if (score >= 90) return { ... }
if (score >= 75) return { ... }
// ...

// 개선안 (선택)
const TIERS = [
  { min: 90, label: '환상의 티키타카', emoji: '✨', color: '#E8B048' },
  ...
].find(t => score >= t.min) ?? { ... };
```

---

## 4. `SajuCardPage.jsx` — 오행 테마 전면 개편 ✅ 양호

### 잘된 점
- `ELEMENT_THEMES` 객체로 테마를 데이터로 관리
- Canvas 기반 이미지 생성 로직이 `saveEnhancedSajuCard` 함수로 분리됨

### 문제점

**[주의] Canvas 생성 함수가 컴포넌트 파일 내에 상주**
- `drawRoundRect`, `saveEnhancedSajuCard` 함수는 `utils/imageExport.js`가 이미 존재하는데 분리되지 않음
- 기존 `imageExport.js`와 역할 중복 가능성 → 통합 필요

---

## 5. Supabase 연동 상태 점검

| 항목 | 상태 | 비고 |
|------|------|------|
| `supabase.js` `persistSession: false` | ✅ 정상 | Supabase 자체 세션 로컬 저장 없음 |
| JWT 토큰 localStorage 저장 | ✅ 의도적 | 앱 재진입 시 자동 로그인 필수 |
| `analysis_cache` Supabase 저장 | ✅ 정상 | `analysisCache.js` → DB upsert |
| `AstrologyPage` localStorage 이중 캐시 | ⚠️ 의도적 | 빠른 초기 렌더 목적, Supabase가 원본 |
| `ComprehensivePage` localStorage 이중 캐시 | ⚠️ 의도적 | 동일 패턴 |
| `byeolsoom_profile` localStorage | 🔴 제거 완료 | 읽는 곳 없는 dead code → 이번에 제거 |
| `GroupBulseumPage` localStorage 백업 | ✅ 정상 | Supabase 없을 때만 폴백 |
| `PWAInstallBanner` localStorage | ✅ 정상 | 기기별 UI 설정, DB 동기화 불필요 |

---

## 오늘의 수정 사항

- `SettingsPage.jsx:116` — `byeolsoom_profile` localStorage 저장 제거 (읽는 곳 없음)
- `CONTEXT_GUIDE.md` — Claude 작업 규칙 섹션 추가

---

## 내일 권장 작업

1. **`api/stream.js`의 `stripMarkdown` 제거** (dead code)
2. **`verifyUser` 로직을 `lib/auth.js`로 추출** (ask.js + stream.js 공유)
3. **`sendStreamChat`에 AbortController 추가** (언마운트 시 스트리밍 정리)
4. **`SajuCardPage`의 Canvas 유틸을 `imageExport.js`로 통합**
