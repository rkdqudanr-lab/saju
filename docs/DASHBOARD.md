# 별숨 대시보드 — 기능 Q&A 참조 문서
> Claude 세션 시작 시 이 문서를 먼저 읽어 전체 맥락을 파악할 것.
> 코드 수정 후 관련 Q&A를 이 문서에 업데이트할 것.

---

## 아키텍처 개요
- **Frontend**: React + Vite, PWA, Vercel 배포
- **라우팅**: React Router 없음. Zustand `step` 정수로 페이지 전환
- **상태**: Zustand (`src/store/useAppStore.js`) 단일 전역 스토어
- **AI**: Anthropic Claude API (`/api/ask` Vercel 서버리스)
- **DB**: Supabase (RLS는 `x-kakao-id` 헤더 기반, JWT 없음)
- **인증**: Kakao OAuth → 서버 발급 JWT → 클라이언트 저장

---

## Q&A (최대 30개)

### [1] 페이지 이동은 어떻게 하나요?
`useAppStore`의 `step` 값을 바꾸면 된다. `setStep(숫자)`로 이동.  
주요 스텝: 0=홈, 13=나의별숨, 28=통계, 31=샵, 38=아이템, 40=가챠, 60=오늘상세.  
`src/hooks/useNavigation.js`에 `goTo()` 헬퍼 있음.

### [2] AI 호출은 어디서 하나요?
`src/hooks/useConsultation.js` → `callApi()` → `POST /api/ask`.  
로컬 dev에서는 `vite.config.js`가 `/api/ask`를 Anthropic API로 직접 프록시.  
모드 플래그(`isDaily`, `isChat`, `isReport` 등)로 프롬프트 분기. **userMessage 내용으로 모드 추론 금지.**

### [3] 오늘의 운세(일일 운세) 흐름은?
`useConsultation.js`의 `askDailyHoroscope()` → `/api/ask` (isDaily=true) → AI 응답 → `dailyResult` 상태 저장.  
프롬프트: `lib/prompts/buildSystem/daily_horoscope_gamified.js`.  
파싱: `src/components/DailyStarCardV2.jsx`의 `parseDailyLines()`.

### [4] 카테고리 운세 점수 형식은?
AI가 `종합운: 68 — 설명` 형식으로 반환 (20~100 정수, 항목마다 다른 값).  
`parseCategoryLine()`이 파싱. `n>5`이면 직접 점수, `n≤5`이면 별점×20.  
`axisScores`(getDailyAxisScores로 계산)로 오버라이드 가능.

### [5] DailyStarCardV2가 파싱하는 섹션은?
`[점수]`, `[요약]`, `[동양의 기운]`(십신/기운/DO/DONT), `[서양의 하늘]`(행성/흐름),  
`[카테고리 운세]`(9개 영역), `[별숨픽]`(음식/장소/색/아이템/숫자/방향/소통/행동/요약).  
`FIELD_PREFIXES` 정규식으로 closingAdvice/items에서 이 필드들을 제외.

### [6] 아이템 키(aspectKey)와 운세 영역 키는 어떻게 매핑되나요?
`gachaItems.js`의 ASPECTS: `overall, wealth, love, career, study, health, social, travel, create`.  
`DailyStarCardV2`의 CATEGORY_META도 동일 키 사용. **money/work 키는 구버전 — 사용 금지.**  
`TodayDetailPage`의 AXES_9도 동일 키.

### [7] Supabase 인증 방식은?
`getAuthenticatedClient(kakaoId)` → `x-kakao-id` 헤더 주입 → RLS가 이 헤더로 행 필터링.  
JWT Bearer 토큰 없이 anon key + 커스텀 헤더 방식. `daily_scores`, `daily_cache`는 RLS가 달라 401 발생 가능(기존 이슈).  
kakaoId는 반드시 truthy 확인 후 전달: `const kakaoId = user?.kakaoId || user?.id`.

### [8] BP(별 포인트) 시스템은?
`src/hooks/useGamification.js` + `src/utils/gamificationLogic.js`.  
채팅 1회 = -3BP, 배드타임 액막이 = -20BP, 일기 = +5BP, 미션 완료 = +BP.  
`gamificationState.currentBp`가 현재 BP. Supabase `user_gamification` 테이블에 저장.

### [9] 가챠/아이템 시스템은?
`src/utils/gachaItems.js` — 모든 아이템 정의, `findItem(id)` 함수.  
`src/components/GachaPage.jsx` — 뽑기 UI.  
`src/components/ItemInventoryPage.jsx` — 보관함, 장착, 합성, 컬렉션 (1735줄, 분리 필요).  
아이템 장착: `useAppStore`의 `equippedItems`, `equippedTalisman`, `equippedSajuItem`.

### [10] 오늘 하루 나의 별숨(TodayDetailPage) 구조는?
step=60 진입. `getDailyAxisScores(baseScore, equippedItems)` → 9개 영역 점수 계산.  
`AxisInsightPanel` — 영역별 점수+아이템 버튼. `DailyRadarChart` — 레이더 차트.  
`handleUseItem()` — 아이템 사용 → `onRefresh()` → AI 재호출(skipBpCharge=true).  
`daily_cache` 테이블에 오늘의 아이템 활성화 이력 저장.

### [11] 사주 계산 로직은?
`src/utils/saju.js` — 4주(년/월/일/시) 계산, 음력 변환.  
`lib/jeolgi.js` — 절기(節氣) 계산.  
`src/utils/astrology.js` — 서양 태양/달/어센던트 계산.  
`src/hooks/useSajuContext.js` — 위 유틸 조합해 컨텍스트 빌드.

### [12] 프롬프트 빌더 구조는?
`lib/prompts/buildSystem/index.js` — 플래그 기반 라우터.  
각 모드별 파일: `daily_horoscope_gamified.js`, `main.js`, `slot.js`, `daeun.js` 등.  
`responseStyle`: T(분석)/M(균형)/F(공감). `precision_level`: low/mid/high.

### [13] 채팅 기능은?
`src/pages/ChatStep.jsx` — UI. `useConsultation.js`의 `handleChat()`.  
스트리밍 응답. `isChat=true` 플래그로 main.js 프롬프트 사용.  
채팅 이력은 `consultation.messages` 상태에만 저장(DB 없음).

### [14] 공유/카드 기능은?
`src/components/ShareCardTemplate.jsx` — 카드 이미지 템플릿.  
`src/utils/imageExport.js` (854줄) — html2canvas 기반 이미지 생성.  
`ShareModal` — 공유 모달. `setShareModal({ open, title, text })`로 열기.

### [15] 테마/다크모드는?
`src/styles/theme.js` — CSS 변수 정의.  
`equippedTheme` — 장착된 테마 아이템. `isDark` — 다크모드 여부.  
`useUserProfile.js`의 `theme` 상태에서 파생.

### [16] PWA/서비스워커는?
`src/sw.js` — 커스텀 서비스워커 (injectManifest 전략).  
`vercel.json` — `sw.js`, `index.html` 캐시 비활성화.  
오프라인에서 캐시된 리소스 제공.

### [17] 궁합(CompatPage) 기능은?
`src/components/CompatPage.jsx` — 두 사람 사주 입력 → AI 궁합 분석.  
`isComprehensive=true` 또는 전용 플래그. 익명 궁합: `AnonCompatPage.jsx`.

### [18] 그룹 별숨(GroupBulseumPage) 기능은?
`src/components/GroupBulseumPage.jsx` (1454줄, 분리 필요).  
여러 명의 사주를 한꺼번에 분석. `isGroupAnalysis=true`, `teamMode=true` 플래그.

### [19] 대운(DaeunPage) 기능은?
10년 단위 대운 분석. `lib/prompts/buildSystem/daeun.js` 프롬프트.  
`isDaeun=true` 플래그.

### [20] 다이어리 기능은?
`src/components/DiaryPage.jsx` — 오늘 일기 작성.  
`src/components/DiaryListPage.jsx` — 일기 목록.  
Supabase `diary_entries` 테이블. 작성 시 BP 지급 (`earnDiaryBP()`).

### [21] 미션 시스템은?
`useGamification.js`의 `loadTodayMissions()`, `completeMission()`.  
Supabase `missions` 테이블. 매일 리셋되는 일일 미션.

### [22] 스텝별 주요 페이지 맵은?
0=홈/메인, 1~3=온보딩, 4=결과, 5=채팅, 10=랜딩,  
13=나의별숨, 28=통계, 31=샵, 38=아이템보관함, 40=가챠,  
41=커뮤니티, 42=다이어리, 44=달력, 50=설정, 60=오늘하루상세.  
`src/hooks/useNavigation.js` 참조.

### [23] 로컬 개발 환경은?
`.env` 파일: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.  
`npm run dev` → localhost:5173. `/api/ask`는 vite.config.js가 Anthropic으로 프록시.

### [24] 컴포넌트 Context 구조는?
`src/context/AppContext.jsx` — Zustand 스토어의 shim. `useUserCtx`, `useSajuCtx`, `useGamCtx` 재익스포트.  
직접 `useAppStore((s) => s.field)` 사용이 권장됨 (AppContext는 하위 호환용).

### [25] 아이템 사용 시 운세 재점 흐름은?
`handleUseItem(row)` → `onRefresh({ transientItems, skipBpCharge:true, skipConfirm:true })` → AI 재호출.  
`daily_cache`에 활성화 이력 upsert. `mergedEquippedItems` 업데이트 → `axisScores` 재계산.  
아이템 사용 후 DailyStarCardV2에 `+X점 상승!` 표시.

### [26] 이름 운세(NameFortunePage)는?
`src/components/NameFortunePage.jsx`. 이름 한자 획수 기반 운세.  
`isNatal=true` 또는 전용 플래그.

### [27] WeeklyTrendChart는?
`TodayDetailPage.jsx` 내부 컴포넌트. Supabase `daily_cache`에서 7일치 점수 로드.  
`cache_type='horoscope_score'`로 필터. 에러 시 빈 배열 fallback.

### [28] 분리 필요한 최우선 파일은?
1. `ItemInventoryPage.jsx` (1735줄) — 카드/장착/합성/컬렉션 분리
2. `GroupBulseumPage.jsx` (1454줄) — 입력/결과/채팅 분리
3. `TodayDetailPage.jsx` (1337줄) — AxisPanel/RadarChart/ItemPicker 분리
4. `App.jsx` (1165줄) — 일일운세 로직, 핸들러 일부 훅으로 분리
5. `useConsultation.js` (906줄) — 모드별 핸들러 분리

### [29] 신규 기능 추가 체크리스트
- [ ] 프롬프트 플래그 추가 시 `lib/prompts/buildSystem/index.js` 라우팅 업데이트
- [ ] 새 Supabase 테이블 사용 시 `getAuthenticatedClient` + kakaoId guard 필수
- [ ] 아이템 새 영역 추가 시 `gachaItems.js` ASPECTS + CATEGORY_META + AXES_9 동시 업데이트
- [ ] 새 페이지 추가 시 step 번호 `useNavigation.js`에 추가

### [30] 자주 발생하는 버그 패턴
- **Supabase 400/401**: `kakaoId` truthy 체크 누락. `user?.kakaoId || user?.id` 패턴 사용.
- **점수 고정 20**: AI 응답 형식(`3 — text`)과 파서 불일치. `parseCategoryLine` 확인.
- **아이템 버튼 안 보임**: `aspectKey` 키 불일치(`money`→`wealth`, `work`→`career`).
- **섹션 사라짐**: 프롬프트에 새 태그 추가했지만 `parseDailyLines`와 렌더링 미업데이트.
- **무한 재렌더**: Zustand v5에서 객체 셀렉터 → `useShallow` 사용 필요.
- **constants.js 수정 시 주의**: `parseAccSummary` 함수 내 if 블록 수정 시 닫는 `}` 누락하면 **모듈 전체 로드 실패** (22개 파일이 의존). 수정 후 반드시 `npm run build` 또는 vite dev 서버로 파싱 오류 없음 확인.
- **DREAM_PROMPT 파라미터**: `dreamText`는 함수 내부에서 쓰지 않고 호출부에서 직접 `[꿈 내용]\n${dreamText}`로 붙임.
- **로그아웃 후 Supabase 클라이언트 stale**: `kakaoLogout()` / `handleSessionExpired()` 호출 시 `clearAuthClient(user.id)` 자동 실행됨 (`useUserProfile.js`).
- **Zustand 셀렉터**: leaf 컴포넌트에서 `const { user } = useAppStore()` 대신 `const user = useAppStore((s) => s.user)` 사용 (전체 스토어 구독 방지).

---

## 리팩토링 로드맵

| 단계 | 대상 파일 | 분리할 내용 | 결과 | 상태 |
|------|-----------|-------------|------|------|
| 1 | `TodayDetailPage.jsx` | AxisInsightPanel, DailyRadarChart, WeeklyTrendChart, ItemPicker → `src/features/today/` | 1337줄 → 229줄 | ✅ 완료 |
| 2 | `ItemInventoryPage.jsx` | OwnedItemCard, ItemDetailModal, UseItemModal, SynthesisModal → `src/features/inventory/` | 1735줄 → 347줄 | ✅ 완료 |
| 3 | `GroupBulseumPage.jsx` | MemberForm, RelationGraph, TeamChemiSummary, DetailPanel, GroupAnalysisPanel → `src/features/group/` | 1454줄 → 418줄 | ✅ 완료 |
| 4 | `App.jsx` | daily horoscope 훅, 핸들러들 → `src/hooks/useDailyHoroscope.js` | 1165줄 (대부분 이미 훅으로 위임됨) | ⏭ 스킵 |
| 5 | `DailyStarCardV2.jsx` | parseDailyLines, parseCategoryLine → `src/utils/parseDailyLines.js` | 파싱 로직 독립 테스트 가능 | ✅ 완료 |

### 생성된 feature 파일 목록

**`src/features/today/`**
- `getDailyAxisScores.js` — AXES_9, getDailyAxisScores(), getAxisInsight(), getRecommendedRow()
- `AxisInsightPanel.jsx` — 9축 인사이트 패널
- `AxisScoreMeter.jsx` — 단일 축 점수 미터
- `DailyRadarChart.jsx` — 방사형 차트
- `WeeklyTrendChart.jsx` — 주간 추세 차트
- `PurifyOverlay.jsx` — 정화 오버레이
- `BoostCTA.jsx` — 부스트 CTA
- `ItemDetailModal.jsx` — 아이템 상세 모달
- `OneShotItemPicker.jsx` — 일회성 아이템 선택

**`src/features/inventory/`**
- `inventoryUtils.js` — FORTUNE_LABELS, CAT_LABEL, isItemDailyActive()
- `OwnedItemCard.jsx` — 보유 아이템 카드 (compact/full)
- `ItemDetailModal.jsx` — 아이템 상세 모달
- `UseItemModal.jsx` — 아이템 사용 모달
- `SynthesisModal.jsx` — 아이템 합성 모달

**`src/features/group/`**
- `groupUtils.js` — SANGSAENG, SANGGEUK, pairScore(), getCompatTier() 등 모든 유틸
- `OhaengBar.jsx` — 오행 분포 바 차트
- `MemberForm.jsx` — 멤버 정보 입력 폼
- `TeamChemiSummary.jsx` — 팀 케미 요약 카드
- `RelationGraph.jsx` — SVG 관계도
- `DetailPanel.jsx` — 두 사람 상세 분석 패널
- `GroupAnalysisPanel.jsx` — 모임 전체 분석 패널

**`src/utils/parseDailyLines.js`**
- `parseCategoryLine(line)` — 카테고리 줄 파싱
- `parseDailyLines(text)` — 전체 일일운세 텍스트 파싱
