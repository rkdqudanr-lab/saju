# 별숨(Byeolsoom) Context Guide

> 이 파일 하나로 프로젝트 현재 상태를 100% 파악할 수 있도록 작성됨.
> 마지막 업데이트: 2026-04-07

---

## 프로젝트 개요

- **서비스명**: 별숨 (byeolsoom.com)
- **설명**: AI 기반 사주팔자 + 점성술 운세 웹앱 (PWA)
- **스택**: React 18 + Vite 5 + Supabase + Vercel Serverless + Anthropic Claude API
- **인증**: 카카오 OAuth → JWT 발급 → `Authorization: Bearer <JWT>` 헤더
- **배포**: Vercel (SPA, `vercel.json`에서 `/*` → `/index.html` 리라이트)

---

## 폴더 구조

```
saju/
├── index.html                   # PWA 메타태그, OG 태그, canonical
├── vite.config.js               # Vite + PWA 설정, /api/ask 로컬 프록시
├── vercel.json                  # SPA 라우팅 리라이트
├── package.json                 # 의존성: react, supabase-js, vite-plugin-pwa
│
├── api/                         # Vercel Serverless Functions
│   ├── ask.js                   # Claude API 호출 엔드포인트 (JWT 인증 포함)
│   └── kakao-auth.js            # 카카오 OAuth 처리 + JWT 발급
│
├── lib/                         # 서버/공유 유틸
│   ├── jwt.js                   # JWT 서명/검증 (JWT_SECRET 환경변수)
│   ├── jeolgi.js                # 절기 계산 로직
│   └── prompts/                 # Claude 프롬프트 빌더
│       ├── buildSystem/         # 시스템 프롬프트 조합 로직
│       ├── hints.js             # 카테고리별 힌트/엔딩 문구
│       ├── lunar.js             # 음력 변환
│       ├── utils.js             # 날짜/계절/시간대 유틸
│       └── weekly.js            # 주간 운세 로직
│
├── supabase/
│   └── schema.sql               # DB 스키마 + RLS 정책 전체
│
├── src/
│   ├── main.jsx                 # 앱 진입점
│   ├── App.jsx                  # 최상위 컴포넌트, Step 기반 라우팅 (0~23)
│   ├── index.css                # 전역 스타일
│   │
│   ├── pages/                   # 주요 페이지 (App.jsx에서 직접 import)
│   │   ├── LandingPage.jsx      # Step 0: 랜딩
│   │   ├── ProfileStep.jsx      # Step 1: 생년월일 입력
│   │   ├── QuestionStep.jsx     # Step 2: 질문 선택
│   │   ├── ReportStep.jsx       # Step 3: 로딩 (스켈레톤)
│   │   ├── ResultsStep.jsx      # Step 4: 결과
│   │   ├── ChatStep.jsx         # Step 5: 채팅
│   │   ├── DailyHoroscopePage.jsx # Step 6: 월간 리포트
│   │   ├── TodayIntroPage.jsx   # Step 22: 오늘의 별숨 인트로
│   │   └── TodayDetailPage.jsx  # Step 23: 오늘의 별숨 상세
│   │
│   ├── components/              # 기능별 컴포넌트 (lazy import 위주)
│   │   ├── Sidebar.jsx          # 사이드바 네비게이션
│   │   ├── StarCanvas.jsx       # 배경 별 애니메이션
│   │   ├── CompatPage.jsx       # Step 7: 궁합
│   │   ├── FutureProphecyPage.jsx # Step 8: 미래 예언
│   │   ├── HistoryPage.jsx      # Step 9: 히스토리
│   │   ├── SajuCalendar.jsx     # Step 10: 별숨 달력
│   │   ├── GroupBulseumPage.jsx # Step 11: 모임 별숨
│   │   ├── AnniversaryPage.jsx  # Step 12: 기념일 운세
│   │   ├── NatalInterpretationPage.jsx # Step 13: 사주원국+별자리
│   │   ├── ComprehensivePage.jsx # Step 14: 종합 사주
│   │   ├── OnboardingCards.jsx  # Step 15: 온보딩
│   │   ├── AstrologyPage.jsx    # Step 16: 종합 점성술
│   │   ├── DiaryPage.jsx        # Step 17: 일기 작성
│   │   ├── GamificationDashboard.jsx # Step 18: 운세 카드/게이미피케이션
│   │   ├── SettingsPage.jsx     # Step 19: 설정
│   │   ├── DiaryListPage.jsx    # Step 20: 일기 모아보기
│   │   ├── SajuCardPage.jsx     # Step 21: 사주 명함 카드
│   │   ├── GamificationHeaderV2.jsx  # 게이미피케이션 헤더 (BP/레벨 표시)
│   │   ├── BPDisplay.jsx        # BP 게이지 컴포넌트
│   │   ├── UpgradeModal.jsx     # BP 부족 시 업그레이드 안내
│   │   ├── ShieldBlockModal.jsx # 액막이 발동 모달
│   │   ├── ShareModal.jsx       # 공유 모달
│   │   ├── InviteModal.jsx      # 친구 초대 모달
│   │   ├── ProfileModal.jsx     # 내 프로필 모달
│   │   ├── OtherProfileModal.jsx # 타인 프로필 모달
│   │   ├── ConsentModal.jsx     # 동의 모달 (최초 1회)
│   │   ├── SamplePreview.jsx    # 결과 미리보기
│   │   ├── RadarChart.jsx       # 오행 레이더 차트
│   │   ├── DailyStarCard.jsx / DailyStarCardV2.jsx # 일별 운세 카드
│   │   ├── MissionDashboard.jsx # 미션 현황
│   │   ├── SocialSynergyMission.jsx # 소셜 시너지 미션
│   │   ├── OrbitalFrequencyMiniGame.jsx # 미니게임
│   │   ├── ZodiacSlot.jsx       # 별자리 슬롯
│   │   ├── GuardianLevelBadge.jsx # 레벨 뱃지
│   │   ├── PWAInstallBanner.jsx # PWA 설치 배너
│   │   └── SkeletonLoader.jsx   # 로딩 스켈레톤
│   │
│   ├── hooks/
│   │   ├── useUserProfile.js    # 사용자 프로필 로드/저장 (Supabase)
│   │   ├── useSajuContext.js    # 사주 계산 컨텍스트
│   │   ├── useConsultation.js   # Claude API 호출 + 스트리밍
│   │   ├── useNavigation.js     # refCode/groupCode URL 파싱
│   │   ├── useAppHandlers.js    # 앱 전역 이벤트 핸들러
│   │   ├── useGamification.js   # BP/레벨/미션/배드타임 상태 관리
│   │   ├── usePayment.js        # 결제 로직
│   │   ├── useBPCostGate.js     # BP 차감 게이트
│   │   └── useWordTyping.js     # 타이핑 애니메이션
│   │
│   ├── utils/
│   │   ├── constants.js         # DAILY_WORDS, PKGS, TIMING, MOON_PHASES 등
│   │   ├── saju.js              # 사주팔자 계산 핵심 로직
│   │   ├── astrology.js         # 서양 점성술 계산
│   │   ├── gamificationLogic.js # BP 규칙, 레벨 임계값, 게이지 색상
│   │   ├── missionGenerator.js  # 미션 생성 로직
│   │   ├── synergyMissionLogic.js # 소셜 시너지 미션
│   │   ├── orbitalFrequencyGenerator.js # 미니게임 로직
│   │   ├── imageExport.js       # 카드 이미지 내보내기
│   │   ├── history.js           # 상담 히스토리 유틸
│   │   ├── quiz.js              # 퀴즈 로직
│   │   └── time.js              # 시간대/절기 유틸
│   │
│   ├── lib/
│   │   ├── supabase.js          # Supabase 클라이언트 싱글턴 + getAuthenticatedClient
│   │   └── analysisCache.js     # 분석 결과 로컬 캐시
│   │
│   └── styles/
│       ├── theme.js / theme.css # 디자인 토큰
│       ├── TodayIntroPage.css
│       └── TodayDetailPage.css
│
└── public/
    ├── manifest.json            # PWA 매니페스트
    ├── favicon.svg
    ├── sitemap.xml
    ├── robots.txt
    └── icons/                   # PWA 아이콘 (72~512px, PNG+SVG)
```

---

## Step 라우팅 맵 (App.jsx)

| Step | 컴포넌트 | 설명 |
|------|----------|------|
| 0 | LandingPage | 랜딩, 탭 네비게이션 |
| 1 | ProfileStep | 생년월일/시간 입력 |
| 2 | QuestionStep | 질문 선택 |
| 3 | ReportStep | 로딩 |
| 4 | ResultsStep | AI 사주 결과 |
| 5 | ChatStep | 추가 질문 채팅 |
| 6 | DailyHoroscopePage | 월간 리포트 |
| 7 | CompatPage | 궁합 |
| 8 | FutureProphecyPage | 미래 예언 |
| 9 | HistoryPage | 상담 히스토리 |
| 10 | SajuCalendar | 별숨 달력 |
| 11 | GroupBulseumPage | 모임 별숨 |
| 12 | AnniversaryPage | 기념일 운세 |
| 13 | NatalInterpretationPage | 사주원국 + 별자리 |
| 14 | ComprehensivePage | 종합 사주 |
| 15 | OnboardingCards | 온보딩 |
| 16 | AstrologyPage | 종합 점성술 |
| 17 | DiaryPage | 일기 작성 |
| 18 | GamificationDashboard | 오늘 운세 카드 |
| 19 | SettingsPage | 설정 |
| 20 | DiaryListPage | 일기 모아보기 |
| 21 | SajuCardPage | 사주 명함 카드 |
| 22 | TodayIntroPage | 오늘의 별숨 인트로 |
| 23 | TodayDetailPage | 오늘의 별숨 상세 |

---

## 주요 환경변수

| 변수 | 위치 | 용도 |
|------|------|------|
| `VITE_SUPABASE_URL` | 클라이언트 | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | 클라이언트 | Supabase anon key |
| `SUPABASE_URL` | 서버(Vercel) | API 함수용 Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버(Vercel) | 서버용 Supabase 서비스 키 |
| `ANTHROPIC_API_KEY` | 서버(Vercel)/로컬 | Claude API 키 |
| `JWT_SECRET` | 서버(Vercel) | JWT 서명/검증 시크릿 |
| `KAKAO_CLIENT_ID` | 서버(Vercel) | 카카오 OAuth 앱 키 |

---

## Supabase DB 구조

### 테이블

**users**
```
id, kakao_id (unique), nickname, birth_year, birth_month, birth_day,
consent_flags (jsonb), response_style (M/S/V), theme, onboarded,
quiz_state (jsonb), created_at, updated_at
```

**consultation_history**
```
id, user_id (→ users.id), questions (text[]), answers (text[]),
slot (시간대), created_at
```

**RLS 방식**: `x-kakao-id` 커스텀 헤더 기반 → `getAuthenticatedClient(kakaoId)` 로 주입

---

## 게이미피케이션 시스템 (BP + 레벨)

- **BP (별숨 포인트)**: 일일 로그인, 미션 완료, 배드타임 차단 시 획득/소모
- **가디언 레벨**: 1~5단계 (초급 액막이사 → 별숨의 수호자)
- **레벨 임계값**: missions(0/15/30/50/100), badtimes(0/5/10/20/50), streak(0/7/14/21/30)
- **배드타임**: 사주 기반 악운 시간대 감지 → BP 소모로 액막이 발동

---

## API 구조 (`/api/ask.js`)

```
POST /api/ask
Headers: Authorization: Bearer <JWT>
Body: { kakaoId, userMessage, system, ... }

인증 우선순위:
1. JWT 검증 (JWT_SECRET 있으면)
2. kakaoId body 값 + Supabase DB 조회 (하위 호환)
3. 로컬 개발: 환경변수 없으면 통과
```

로컬 개발 시 `vite.config.js`의 프록시가 `/api/ask` → `api.anthropic.com/v1/messages` 로 변환

---

## 트러블슈팅 히스토리

### Mixed Content 경고 (2026-04-07)
- **증상**: 카카오 프로필 이미지 URL이 `http://`로 내려와 HTTPS 사이트에서 Mixed Content 오류
- **원인**: Kakao API가 반환하는 `profile_image_url`이 http:// 스킴
- **해결**: `useUserProfile.js`에서 이미지 URL 저장/사용 시 `url.replace('http://', 'https://')` 강제 치환
- **파일**: `src/hooks/useUserProfile.js`

### Mobile Meta Tag 경고 (2026-04-07)
- **증상**: Chrome DevTools에서 `apple-mobile-web-app-capable` 단독 사용 시 deprecated 경고
- **해결**: `index.html`에 `<meta name="mobile-web-app-capable" content="yes" />` 추가 (apple 태그와 병행)
- **파일**: `index.html`

### GoTrueClient 중복 인스턴스 경고
- **증상**: `Multiple GoTrueClient instances detected` 콘솔 경고
- **원인**: `createClient()`를 컴포넌트 렌더링마다 호출
- **해결**: `src/lib/supabase.js`에서 `_authClientCache` Map으로 `kakaoId`별 싱글턴 관리
- **파일**: `src/lib/supabase.js`

### JWT 만료 자동 로그아웃 (2026-04-07)
- **증상**: JWT 만료 후 API 호출이 401 반환해도 UI 상태 미변경
- **해결**: API 호출 시 401 응답 감지 → 자동 로그아웃 처리 + 세션 초기화
- **관련 커밋**: `c6496e1`, `d174906`

### onBlockBadtime prop 미선언 오류
- **증상**: `TodayDetailPage` 렌더링 시 `onBlockBadtime is not defined` ReferenceError
- **원인**: prop 이름 불일치 (`onBlockBadtime` vs `handleBlockBadtime`)
- **해결**: App.jsx에서 prop 이름 통일 → `handleBlockBadtime`으로 표준화
- **파일**: `src/App.jsx`, `src/pages/TodayDetailPage.jsx`

---

## 개발 환경 세팅

```bash
npm install
# .env.local 에 ANTHROPIC_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 설정
npm run dev   # localhost:5173, /api/ask는 Anthropic으로 직접 프록시
npm run build # Vite 빌드
```

---

## 현재 브랜치 규칙

- 기능 개발: `claude/[feature-name]-[hash]` 브랜치 → PR → main 머지
- Vercel: main 브랜치 자동 배포
