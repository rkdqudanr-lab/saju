# 별숨(Byeolsoom) UX/UI/AX 종합 증진계획

> 전문가 9인 보고 72건을 병합·검증한 최종 실행 계획. 모든 경로는 `C:\Users\rkdqu\Desktop\saju-main\` 기준 상대 경로입니다.
> 검증 방법: P0 전건 + 의심 발견 12건을 소스 직접 열람 및 grep 실측으로 확인. 작업량 표기 — **S**: 반나절 이하 / **M**: 1~2일 / **L**: 3일 이상.

---

## 총평

별숨은 **기반 설계는 좋은데 그 기반을 스스로 쓰지 않는 앱**이다. `src/styles/theme.css`에는 다크/라이트 테마, 큰글씨 모드, `--loading-overlay` 같은 용도별 토큰, skip-link, `:focus-visible` 아웃라인, reduced-motion 킬스위치까지 정석적인 디자인 시스템이 이미 깔려 있다. ProfileStep의 폼 시맨틱, ProfileModal의 포커스 트랩, DiaryListPage·ItemInventoryPage의 CTA 포함 빈 상태, `role="alert"` 토스트 등 잘 만든 부분도 분명하다. 문제는 80+ 컴포넌트가 이 시스템을 우회한다는 것 — 9~11px 하드코딩 폰트가 **실측 291곳(60+ 파일, 전문가 보고 214~241곳보다 많음)**, z-index 임의값 12종(200~11000), 이미 정의된 `--loading-overlay` 토큰을 안 쓰는 크림색 하드코딩, 그리고 import조차 안 되는 665줄짜리 `theme.js` 사본이 공존한다. 구조적으로는 STEP 상태머신이 URL에 아무것도 남기지 않아 **새로고침=홈 리셋+작성 데이터 전소**라는 PWA 치명상이 있고, 수익 동선(BP 차감→가챠/상점/업셀)일수록 피드백 유실(토스트 가림), 빈 아이콘, 접근성 0점이 집중돼 있다. 다행히 P0~P1의 대부분이 "이미 있는 토큰/패턴을 연결만 하면 되는" 1~10줄 수정이라, 4주 안에 체감 품질을 크게 올릴 수 있는 상태다.

---

## Phase 1 — 긴급 (P0, 1주 내)

| # | [분야] 제목 | 파일 | 무엇을 어떻게 | 작업량 |
|---|---|---|---|---|
| 1-1 | [UX] 게스트 체험 데드엔드 해소 | `src/pages/LandingPage.jsx:514`, `src/hooks/useAppHandlers.js:66-69` | **검증 완료**: `handleOnboardingFinish`가 무조건 `STEP.HOME`으로 보내고, LandingPage는 `if (!user)`(514행)가 form 입력과 무관하게 로그인 랜딩을 리턴 → 게스트 2~3분 입력이 로그인 벽으로 회귀. 최소 수정: `handleOnboardingFinish`에서 `!user`면 `setStep(STEP.QUESTION)` 분기 + LandingPage `!user` 분기에 `form?.by` 존재 시 체험 홈(1회 체험 + 로그인 유도 배너) 렌더. | M |
| 1-2 | [UX/구조] 새로고침 홈 리셋 + 작성 데이터 소실 | `src/hooks/useNavigation.js:52-66`, `src/components/DiaryPage.jsx` | **검증 완료**: pushState가 pathname만 유지(55행), step 미persist. ① step을 URL hash(`#/diary`)에 양방향 동기화하고 초기 로드 시 복원. ② DiaryPage 입력값을 sessionStorage 디바운스 자동저장+복원. iOS PWA 탭 메모리 회수 시 일기 전소를 막는 최우선 수정. | M |
| 1-3 | [공통] 토스트 z-index 999 → 최상위 | `src/styles/theme.css:54`, `src/App.jsx:402-417` | **검증 완료**(전문가 5인 중복 → 병합): `.toast` z 999 < 모달 9990~10000. `.toast` z-index를 10500으로 상향(1줄) + 토스트를 `createPortal(document.body)`로 이동. BP 부족/구매 실패 등 결제성 피드백 유실의 단일 원인. | S |
| 1-4 | [UX] 빈 이모지 span/div 복원 — 결제 UI가 깨져 보임 | `src/components/BPConfirmModal.jsx:58-66,144`, `src/components/UpgradeModal.jsx:8`, `src/components/BPInsufficientModal.jsx:70`, `src/components/FeatureLoadingScreen.jsx` 외 | **검증 완료**: BPConfirmModal 아이콘 박스(65행)와 CTA 첫 span(144행) 빈 채 렌더, UpgradeModal 8행 2rem 빈 div. 실측 빈 요소 약 55곳/35파일(일부는 의도적 spacer일 수 있어 전수 분류 필요). git 이력에서 유실 문자 복원, 불가 시 빈 컨테이너 제거. BP/결제 화면 우선. UTF-8 저장 인코딩 점검으로 재발 방지. | M |
| 1-5 | [수익/신뢰] UpgradeModal — 결제 검증 없는 유료 플랜 적용 | `src/components/UpgradeModal.jsx:13-22`, `src/hooks/consultation/useChatConsultationHandler.js:154-157` | **검증 완료(해석 보정)**: 22행 CTA가 결제 로직 0줄로 `setStep(STEP.CHAT)`. 단 `IS_BETA=true` 하드코딩 + 랜딩의 "베타 무료" 고지가 있어 현재 실수익 누수는 아님. 그러나 채팅 소진 시(`chatLeft<=0`) 이 모달이 IS_BETA 무관하게 뜨며 **'월 5,500원' 가격 표기 후 무료 통과**는 표시·신뢰 문제이자 결제 도입 시 지뢰. 베타 중엔 가격 대신 "베타 기간 무료" 표기로 교체, 결제 연동 시 결제 콜백에서만 `setPkg`. | S |
| 1-6 | [UI] 설치형 PWA 상단 버튼 노치 가림 | `src/styles/theme.css:67-82,567`, `index.html:8,31-32` | **검증 완료**: `viewport-fit=cover`+standalone 조합인데 `env(safe-area-inset-top)` 사용은 src 전체 1곳(PremiumConsultationResult)뿐. `.menu-btn/.back-btn/.home-btn/.theme-btn/.user-chip`에 `top:calc(env(safe-area-inset-top,0px) + 14px)` 적용. 라우팅 없는 앱이라 이 버튼들이 유일한 내비 — 아이폰 설치 사용자 내비 마비 해소. | S |
| 1-7 | [AX] BPConfirmModal 다이얼로그 시맨틱 + 공용 useModalA11y 훅 | `src/components/BPConfirmModal.jsx:25-152` (신규: `src/hooks/useModalA11y.js`) | (AX 2인 병합) `role="dialog" aria-modal aria-labelledby` + 열릴 때 취소 버튼 focus, Escape→`resolveBPConfirm(false)`, 닫힐 때 트리거 복원. ProfileModal의 기존 포커스 트랩을 훅으로 추출해 재사용 — Phase 2에서 MenuDrawer·가챠 오버레이·AppModals 7종에 순차 적용할 기반. | M |
| 1-8 | [UI] 로딩 오버레이 크림색 하드코딩 → `--loading-overlay` 토큰 | `src/components/FeatureLoadingScreen.jsx:566`, `src/components/AppRouter.jsx:612,618` | **검증 완료**(전문가 3인 병합): 두 곳 모두 `rgba(250,247,241,0.97)` 하드코딩, 토큰은 theme.css:15/33에 이미 존재. `var(--loading-overlay)`로 교체(2줄). 다크 모드 크림 플래시+문구 비가독 동시 해결. **부수 확인**: AppRouter 618행이 `text` prop을 넘기지만 컴포넌트는 `title/subtitle`만 받음 → `subtitle`로 수정. | S |

---

## Phase 2 — 중요 (P1, 2~4주)

### 2A. 내비게이션·플로우

| # | [분야] 제목 | 파일 | 무엇을 어떻게 | 작업량 |
|---|---|---|---|---|
| 2-1 | [UX] steps.js 그룹 누락 — 뒤로가기 없는 페이지 5개 | `src/utils/steps.js:57-64,66` | **검증 완료**: BACK_TO_HOME에 SHOP(31)·ANON_COMPAT(32)·YEARLY_REPORT(36)·GROWTH_DASHBOARD(37)·ITEM_INVENTORY(38) 누락, YEARLY_REPORT는 TAB_* 전부에서도 누락 확인. 배열 2곳에 추가. 수익 핵심인 상점의 '막힌 느낌' 즉시 해소. | S |
| 2-2 | [UX] 직전 step 기록 → 뒤로가기 3종 오동작 수정 | `src/store/useAppStore.js`, `src/App.jsx:481-482` | (UX② 3건 병합) Zustand에 `prevStep` 1개 기록. ① BACK_TO_RESULT 직행 진입 시 빈 ResultsStep 노출 방지(answers 비면 HOME 폴백), ② QUESTION 뒤로가기가 PROFILE로 가는 문제, ③ **검증 완료**: 481행 `p === STEP.RESULT ? STEP.QUESTION` 삼항은 `step < STEP.RESULT` 조건상 데드코드 — 정리. | M |
| 2-3 | [UX] 안드로이드 백버튼 모달 스택 | `src/hooks/useNavigation.js:58-66`, 스토어 | 모달 오픈 시 `history.pushState({modal:id})`, popstate에서 열린 모달이 있으면 setStep 대신 최상위 모달만 닫기. Zustand modalStack 배열로 AppModals·Sidebar·드로어 일괄 처리. | M |
| 2-4 | [UX] 첫 세션 인터럽션 직렬화 + 투어 영구스킵 방지 | `src/App.jsx:104-110`, `src/pages/LandingPage.jsx:339-348`, `src/components/FeatureTour.jsx:86-89,180-189` | (UX① 2건 병합) 투어 진행 중 스트릭 팝업 보류(투어 onFinish 후 발동), 가입 당일 출석 팝업 생략. 투어 오버레이 탭=다음 단계로 변경, 스킵은 명시 버튼만. SettingsPage에 '기능 안내 다시 보기'(localStorage `byeolsoom_tour_v1` 리셋) 추가. | S |
| 2-5 | [UX] 비로그인 무언 리다이렉트에 안내 추가 | `src/components/BottomNav.jsx:106-114` | requiresLogin/form 미완성 리다이렉트 시 `showToast('로그인 후 이용할 수 있어요')` 동반 + 드로어 항목 자물쇠 배지. (1-3 토스트 z 수정과 함께해야 효과 있음) | S |
| 2-6 | [UX] ProfileStep CTA 비활성 — 도달 불가 안내 토스트 | `src/pages/ProfileStep.jsx:235-241` | **검증 완료**: `disabled={!profileReady}`라 onClick 내부 누락 안내 토스트가 영원히 실행 불가. disabled 제거, 미완성 시 토스트+누락 필드 스크롤. 가입 퍼널 첫 관문. | S |

### 2B. 재화·피드백 신뢰성

| # | [분야] 제목 | 파일 | 무엇을 어떻게 | 작업량 |
|---|---|---|---|---|
| 2-7 | [UX] BP 트랜잭션 정합성 — spendBP reason + insert 에러 처리 | `src/utils/gamificationLogic.js:291-329`, `src/components/ShopPage.jsx:686-756`, `src/components/GachaPage.jsx:530-561`, `src/components/DreamPage.jsx:162-164` | (UX③ 2건 병합) ① spendBP 반환에 `reason:'insufficient'|'network'` 추가, update의 `.error` 검사(현재 차감 실패에도 ok:true). ② 호출부 5곳에서 네트워크/부족 메시지 분기. ③ 가챠/상점 insert 결과 error 검사 → 실패 시 BP 환급+안내, catch에서 서버 BP 재조회 syncBP. 장기: RPC 단일 트랜잭션. | M |
| 2-8 | [UX] FeatureLoadingScreen 실패/타임아웃/취소 상태 | `src/components/FeatureLoadingScreen.jsx`, BP 선차감 기능들 | `onCancel`·`error` props 추가: 15초 경과 시 안내+취소 버튼, 실패 시 오버레이 안에서 '다시 시도/돌아가기'(토스트 의존 제거). 'BP 차감 후 영원한 로딩' 경로 차단. `role="status" aria-live="polite"`도 함께(AX①-5 병합). | M |
| 2-9 | [UI] z-index 토큰 스케일 + 레이어 역전 3건 수정 | `src/styles/theme.css`, `src/components/UpgradeModal.jsx`(.upgrade-modal-bg z 200), `src/components/GachaPage.jsx:115`, `src/components/BoostItemSheet.jsx:91` | (UI 3건 병합) `--z-nav/--z-sheet/--z-modal/--z-tour/--z-toast` 토큰 정의 후 인라인 치환. 우선 수정: ① UpgradeModal(200) 위로 BottomNav(9999)가 뚫는 역전 — 업셀 전환 직격, ② 가챠 결과 오버레이(9000) 위 BottomNav — 결과 버튼 가림+`env(safe-area-inset-bottom)` 패딩, ③ BoostItemSheet(300). | M |

### 2C. 디자인 시스템·가독성

| # | [분야] 제목 | 파일 | 무엇을 어떻게 | 작업량 |
|---|---|---|---|---|
| 2-10 | [UI/AX] 9~11px 하드코딩 → 토큰 치환 (실측 291곳/60+ 파일) | 1차: `BPConfirmModal.jsx:98`, `GachaPage.jsx`(25곳), `ShopPage.jsx`(20곳), `MissionDashboard.jsx`, `BottomNav.jsx:172` / 2차: CommunityPage(28곳) 외 전체 | (전문가 4인 병합, **실측으로 규모 상향 확인**) 1단계: BP 가격·보상·확률 등 의사결정 정보부터 `var(--xs)/var(--2xs)` 치환 → 큰글씨 모드 즉시 복원. 2단계: codemod 일괄 치환 + grep 기반 CI 체크로 재유입 차단. 9px는 `--2xs` 미만 금지 원칙. | L |
| 2-11 | [AX] 대비 토큰 보정 | `src/styles/theme.css:8,26-29`, `src/components/BottomNav.jsx:327`, `src/components/GachaPage.jsx:326-360` | (AX 3건 병합) ① 다크 `--t4` #7A6E9B→#8E82B0(≥4.5:1), ② 라이트 골드 텍스트용 `--gold-text` 분리, ③ BottomNav 비활성 탭 opacity 0.45 제거(합성 2.35:1)→색만으로 구분, ④ 가챠 비활성 버튼 텍스트 .25→.65 이상+'90 BP 필요' 사유 표기. | M |
| 2-12 | [UI] 가챠/상점 다크 하드코딩 — 라이트 테마 깨짐 | `src/components/GachaPage.jsx:107-111,654,664`, `src/components/ShopPage.jsx:100` | 연출상 '항상 다크' 유지가 의도라면 해당 컨테이너에 `data-theme="dark"` 강제 지정(최소 수정)으로 내부 var()가 다크 값으로 풀리게. 아니면 `--overlay-deep` 토큰 신설. | M |
| 2-13 | [UI] reduced-motion을 framer-motion에 연결 | `src/App.jsx`, `src/components/StarCanvas.jsx:23-34` | (UI③+AX③ 병합) 루트를 `<MotionConfig reducedMotion="user">`로 감싸기(1줄급). StarCanvas는 AnimatedMascot의 기존 matchMedia 패턴 복사해 reduce 시 정적 1회 드로우. 공용 usePrefersReducedMotion 훅 추출. | S |
| 2-14 | [UI] 페이지 전환 스크롤 점프 + exit 단축 | `src/components/AppRouter.jsx:11-16`, `src/hooks/useNavigation.js:31` | **검증 완료**(31행 즉시 scrollTo): scrollTo를 AnimatePresence `onExitComplete`로 이동, exit는 opacity 0.12s로 단축(체감 0.56s→0.4s 이하). prevStep(2-2)으로 방향성 variants는 선택 적용. | S |

### 2D. 접근성·명칭

| # | [분야] 제목 | 파일 | 무엇을 어떻게 | 작업량 |
|---|---|---|---|---|
| 2-15 | [AX] 영어 aria-label 6곳 한국어화 | `src/App.jsx:437,481-486` | **검증 완료**('go back' 등): '뒤로 가기/결과로 돌아가기/홈으로 가기/메뉴 열기'로 교체. | S |
| 2-16 | [AX] BottomNav 탭·드로어 시맨틱 | `src/components/BottomNav.jsx:116-217,310-314` | `aria-expanded`/`aria-current` 추가, MenuDrawer에 `role="dialog"`+useModalA11y(1-7 훅) 적용. | S |
| 2-17 | [AX] 가챠 결과 카드 키보드/SR 조작 가능화 | `src/components/GachaPage.jsx:48-86,120-235`, `src/components/ShopPage.jsx:178-212` | (AX 2인 병합) SmallResultCard를 `<button>`으로(공개 후 aria-label에 등급+이름), '모두 공개' 버튼 처음부터 노출, Escape 탈출 경로, ResultOverlay dialog 시맨틱+live region. 유료 결과가 키보드로 영원히 안 열리는 문제. | M |
| 2-18 | [AX] heading 구조 도입 | 결과 페이지·온보딩·모달 타이틀 우선 (`ResultsStep`, `ComprehensivePage`, `OnboardingCards.jsx`, 모달 타이틀) | 페이지 최상위 제목 div→h1, 섹션→h2(인라인 style 유지로 시각 무변화). step 전환 시 `document.title` 갱신 병행. | L |
| 2-19 | [AX] 명칭 단일화 — '별숨' 신조어 13종 + 재화 명칭 3종 | `src/components/BottomNav.jsx:15-84`, `src/components/SettingsPage.jsx:828-833`, `src/components/OnboardingCards.jsx:10-35`, `src/hooks/useGamification.js:716` 외 | (AX③ 2건 병합) ① '나의 별숨' 동음이의 해소(NATAL→'나의 사주원국'), 온보딩 기능명=실제 메뉴 라벨 1:1. ② 재화 정식명 '별숨 포인트(BP)' 확정, `CURRENCY_NAME` 상수 추출, BPConfirmModal·온보딩에 1줄 개념 설명. 라벨을 단일 상수 파일로. | M |
| 2-20 | [UX] instantTyping 죽은 설정 — 토글 UI 추가 | `src/components/SettingsPage.jsx` | DB·스토어·prop 배선 완성 상태이므로 기존 toggle-row 패턴으로 '결과 바로 보기' 토글 1블록 추가. reduced-motion 감지 시 자동 on 고려. | S |
| 2-21 | [AX] viewport 확대 차단 해제 | `index.html:8`, `src/components/SajuCalendar.jsx:601,879` | **검증 완료**: `maximum-scale=1.0, user-scalable=no` 제거 + SajuCalendar 입력 2곳 fontSize 16px로(iOS 포커스 자동 줌 부작용 동시 방지). | S |
| 2-22 | [AX] ProfileStep 프로필 카드 키보드 선택 | `src/pages/ProfileStep.jsx:52,79-92` | div onClick→button(또는 role="radio"). 키보드 여정의 첫 차단 지점. | S |
| 2-23 | [UX] BottomNav 탭 1순위 목적지 즉시 이동 (구조 결정 필요) | `src/components/BottomNav.jsx:271-278,28-50` | 4개 탭 모두 드로어 토글인 현 구조를 첫 탭=즉시 이동, 재탭=드로어로 변경. 상담 13개는 상위 5~6개+더보기 티어링. **제품 결정이 필요한 항목이라 P1 말미 배치.** | L |

---

## Phase 3 — 개선 (P2, 이후)

| # | [분야] 제목 | 파일 | 무엇을 어떻게 | 작업량 |
|---|---|---|---|---|
| 3-1 | [UX/UI] 공용 ConfirmSheet — window.confirm 3곳 교체 + 모달 패턴 통일 | `src/components/CommunityPage.jsx:1009`, `src/components/DiaryPage.jsx:251`, `src/components/SajuCalendar.jsx:373` | (UX③+UI① 병합) BPConfirmModal 구조 재사용한 ConfirmSheet(딤 `--overlay-dim` 토큰 1개, radius var(--r2), 위험 동사 빨강 버튼). 딤 5종/radius 3종/z 2체계 혼재 정리. | M |
| 3-2 | [UX/AX] 온보딩 카드 개선 | `src/components/OnboardingCards.jsx:265-344` | (UX①+AX② 병합) 도트 히트영역 24~44px 확장(시각 6px 유지), '건너뛰기' padding 확대, framer-motion drag="x" 스와이프, 중복 '다시 보지 않기' 버튼 제거. | M |
| 3-3 | [UX] 랜딩 히어로 폴드 안에 제품 증거 | `src/pages/LandingPage.jsx:516-572` | 히어로 min-height 축소 또는 SamplePreview 축약판 폴드 안 배치, 게스트 체험 링크를 보조 버튼으로 승격(1-1과 연계). | M |
| 3-4 | [UX] 사이드바/BottomNav 분류 체계 통일 | `src/components/Sidebar.jsx`, `src/components/BottomNav.jsx`, `src/utils/steps.js` | STEP_GROUPS TAB_*을 단일 진실 공급원으로 양쪽 메뉴 생성(2-19 라벨 상수와 동일 PR 권장). | M |
| 3-5 | [UI] 드로어 품질 묶음 | `src/components/BottomNav.jsx:116-254,300-322` | (4건 병합) ① 오픈 중 body 스크롤 잠금+'스크롤 시 닫기' 제거, ② 50vh 잘림에 하단 페이드 힌트, ③ 닫힘에도 AnimatePresence 퇴장 애니메이션, ④ bottom 57px 매직넘버를 `--nav-h` 변수로, ⑤ show/hide 히스테리시스(|delta|>8px, scrollY<0 무시). | M |
| 3-6 | [UI] 렌더 성능 — StarCanvas 스로틀 + 가챠 Sparkles memo | `src/components/StarCanvas.jsx`, `src/components/GachaPage.jsx:24-45` | rAF ~24fps 스로틀+오버레이 표시 중 일시정지, Sparkles 랜덤값 useMemo 고정+SmallResultCard React.memo(탭마다 전체 재발화 버그), 파티클 14→8. | S |
| 3-7 | [UI] 토큰 위생 묶음 | `src/styles/theme.js`(삭제), `src/styles/theme.css:21`, `--on-gold` 신설 | **검증 완료**(theme.js import 0건): ① 미사용 theme.js 665줄 삭제, ② radius 14~22px를 r1/r2로 스냅(+필요 시 16px 토큰), ③ `--on-gold` 토큰으로 #0D0B14 하드코딩 20곳 치환, ④ SajuCalendar 토요일색 라이트 분기. | S |
| 3-8 | [AX] 마무리 묶음 | `src/components/AppRouter.jsx:167`, `index.html:37`, outline 인라인 11곳, `src/components/UpgradeModal.jsx:13-20` | ① `<main id="main-content" tabIndex={-1}>` 전환, ② 인라인 `outline:'none'` 11곳 제거(:focus-visible 자연 적용), ③ UpgradeModal 패키지를 radiogroup/radio button으로, ④ `.zs-card:focus`→`:focus-visible`. | M |
| 3-9 | [AX] 본문 텍스트 역할 기준 재배정 | OnboardingCards desc, BottomNav 드로어 desc, SettingsPage 설명 | 설명문 최소 `--sm`(13px), 메타정보만 `--xs`, `--2xs`는 배지/캡션 한정 — 가이드 문서화 후 첫 사용 동선 2곳부터. | M |
| 3-10 | [UI] 태블릿 폭 통일 | `src/components/BottomNav.jsx:292-298` | nav에 maxWidth+margin auto, 폭 기준을 `--shell-w` 변수 하나로(460 vs 480 통일). | S |
| 3-11 | [UX] ConsentModal 정리 | `src/components/ConsentModal.jsx:3-8`, `src/hooks/useUserProfile.js:91,645-648` | **검증 완료**(defaultOn 선언만 되고 미사용): 죽은 값 삭제, history OFF 시 '기기를 바꾸면 상담 기록이 사라져요' 경고, 개인정보처리방침 링크 1줄. | S |

---

## 시너지 묶음 (같은 파일 1회 수정으로 처리)

1. **theme.css PR** — 1-3(토스트 z) + 1-6(safe-area) + 2-9(z 토큰) + 2-11(대비 토큰) + 3-7(radius/--on-gold). 디자인 토큰 변경을 한 번에 리뷰.
2. **BottomNav.jsx PR** — 2-5(리다이렉트 토스트) + 2-16(aria) + 2-11③(탭 대비) + 3-5(드로어 5건) + 2-19(라벨 상수 참조). 624줄 파일을 두 번 열지 않게.
3. **GachaPage.jsx PR** — 2-9②(오버레이 z) + 2-12(다크 하드코딩) + 2-17(button화) + 2-10(11px 토큰) + 2-11④(대비) + 3-6(Sparkles).
4. **ShopPage.jsx PR** — 2-7(insert 에러/syncBP) + 2-10(20곳 토큰) + 모달 닫힘 처리(BuyModal 열린 채 토스트 발사 경로).
5. **useNavigation.js + App.jsx PR** — 1-2(hash 복원) + 2-2(prevStep/데드코드) + 2-3(모달 백 스택) + 2-14(scrollTo 타이밍) + 2-15(한국어 aria-label).
6. **FeatureLoadingScreen + AppRouter PR** — 1-8(토큰+prop 버그) + 2-8(에러/취소/role=status).
7. **모달 a11y 트랙** — 1-7에서 만든 useModalA11y 훅을 MenuDrawer(2-16)→가챠 오버레이(2-17)→ConfirmSheet(3-1)→AppModals 7종 순으로 확산.
8. **명칭 단일 소스 PR** — 2-19 + 3-4: 라벨 상수 파일 신설 후 BottomNav/Sidebar/SettingsPage/OnboardingCards가 같은 데이터를 소비.

---

## 제외/기각된 발견

직접 검증 결과 **완전 허위로 기각된 발견은 없음**. 핵심 P0 주장(게스트 데드엔드, 토스트 z 999, steps.js 누락 5종, ProfileStep 도달 불가 토스트, ConsentModal defaultOn 미사용, theme.js 미import, viewport 메타, App.jsx:481 데드코드, AppRouter `text` prop 무시, `--loading-overlay` 미사용)은 전부 소스에서 사실로 확인됐다. 다만 다음 4건은 **해석·수치 보정** 후 반영했다:

1. **UX③-3 (UpgradeModal '월 5,500원 수익 누수') — 해석 축소**: `useAppHandlers.js:45`와 `useReportConsultationHandler.js:3`에 `IS_BETA=true`가 하드코딩돼 있고 랜딩(LandingPage.jsx:526)에 "베타 테스트 중 무료" 고지가 있어, 현 시점 '수익 누수'는 성립하지 않음. 단 채팅 소진 경로(useChatConsultationHandler.js:156)는 IS_BETA 무관하게 모달을 띄우므로 '가격 표기 후 무료 통과'라는 신뢰/표시 문제와 결제 도입 시 지뢰는 유효 → P0 유지하되 '가격 표기 정합성'으로 재정의(1-5).
2. **하드코딩 fontSize 수치(214/241/206곳으로 전문가별 상이) — 과소 보고**: 직접 grep 실측 결과 9~11px 하드코딩은 **291곳/60+ 파일**로 보고보다 많음. 과장이 아니라 반대였으므로 P1 유지, codemod 필수(2-10).
3. **UX③-2 (빈 이모지 42곳/28파일) — 수치 보정**: 실측 빈 `<span>/<div>` 쌍은 약 55곳/35파일. 단 일부는 의도적 레이아웃 spacer일 수 있어 작업 시 전수 분류 필요 — '42곳 전부 유실 이모지'라는 단정은 과함(1-4에 반영).
4. **AX①의 "role='dialog'는 UpgradeModal·ConsentModal 단 2곳" 진술 — 부정확**: ConsentModal.jsx:16 외에도 InviteModal·OtherProfileModal·ShareModal·ProfileModal 등 7곳에 존재(AX② 보고가 정확). 다만 "포커스 트랩·Escape·복원 전무"라는 결론 자체는 유효해 항목은 유지(1-7).

추가로 전문가 9인 발견 중 **중복 22건을 8개 항목으로 병합**했다: 토스트 z-index(5건→1-3), 로딩 오버레이 크림색(3건→1-8), 9~11px 하드코딩(4건→2-10), BPConfirmModal a11y(2건→1-7), 가챠 카드 키보드(2건→2-17), reduced-motion(2건→2-13), window.confirm/모달 통일(2건→3-1), 비로그인 리다이렉트(2건→2-5).

---

# 부록: 전문가 9인 발견사항 전체 (72건)


## UX 전문가 ① — 온보딩·첫 사용 경험

1. **[P0/M] 게스트 체험 경로가 데드엔드 — 프로필+온보딩 완료 후 다시 로그인 벽으로 복귀**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\pages\LandingPage.jsx:514-575, C:\Users\rkdqu\Desktop\saju-main\src\pages\LandingPage.jsx:548-550, C:\Users\rkdqu\Desktop\saju-main\src\hooks\useAppHandlers.js:66-69, C:\Users\rkdqu\Desktop\saju-main\src\components\AppRouter.jsx:172-173
   - 문제: 랜딩의 '로그인 없이 먼저 체험하기' 버튼(LandingPage.jsx:548)은 setStep(STEP.PROFILE)로 보내고, 게스트가 생년월일·성별·출생시각을 모두 입력하면 ProfileStep.jsx:247에서 STEP.ONBOARDING으로, 온보딩 카드 3장을 끝내면 handleOnboardingFinish(useAppHandlers.js:68)가 setStep(STEP.HOME)으로 보낸다. 그런데 HOME은 LandingPage를 렌더하고(AppRouter.jsx:172), LandingPage는 form 완성 여부보다 먼저 `if (!user)` 분기(514행)로 카카오 로그인 랜딩을 리턴한다. 즉 게스트는 2~3분간 정보를 입력하고 온보딩까지 본 뒤 처음의 로그인 화면으로 되돌아온다. 입력이 사라진 것처럼 보이고 체험 콘텐츠는 어디에도 없다. BottomNav도 게스트를 대부분 PROFILE로 돌려보내므로(BottomNav.jsx:110) 체험 약속이 전혀 이행되지 않는다.
   - 제안: 게스트 온보딩 완료 시 HOME 대신 STEP.QUESTION(또는 오늘 운세 미리보기)으로 보내고, LandingPage의 !user 분기에서 form?.by가 있으면 '게스트 홈'(입력한 사주 기반 1회 체험 + 결과 저장을 위한 로그인 유도 배너)을 렌더한다. 최소 수정안: handleOnboardingFinish에서 user가 없으면 setStep(STEP.QUESTION)으로 분기.

2. **[P1/S] 첫 홈 진입 시 FeatureTour(700ms)와 스트릭 팝업(800ms)이 동시 발동 — 팝업이 투어 위를 덮음**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\App.jsx:104-110, C:\Users\rkdqu\Desktop\saju-main\src\pages\LandingPage.jsx:339-348, C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:1656, C:\Users\rkdqu\Desktop\saju-main\src\components\FeatureTour.jsx:116,163-189
   - 문제: 온보딩 카드 3장을 막 끝낸 사용자가 홈에 도착하면 App.jsx:107이 700ms 후 5단계 FeatureTour를 자동 발동하고, LandingPage.jsx:343이 800ms 후 연속 출석 팝업(streak popup)을 띄운다. 두 트리거에 상호 가드가 없고, 스트릭 팝업 backdrop은 z-index 12000(theme.css:1656)으로 투어 오버레이/툴팁(z 10000~10001, FeatureTour.jsx:116)보다 높다. 결과: 투어 1단계가 뜬 지 0.1초 만에 출석 팝업이 그 위를 덮어, 첫 사용자는 '온보딩 카드 → 투어 → 팝업' 3연속 인터럽션과 겹친 레이어를 동시에 마주한다. 팝업을 닫으면 어두운 투어 오버레이가 남아 혼란이 가중된다.
   - 제안: 첫 세션 인터럽션을 큐로 직렬화: showTour가 true인 동안 스트릭 팝업을 보류(LandingPage의 streak useEffect에 투어 완료 여부 가드 추가)하고, 투어 onFinish 후에 팝업을 띄운다. 가입 당일(streak 1일차)에는 출석 팝업 자체를 생략하는 것도 고려.

3. **[P1/S] FeatureTour는 화면 아무 곳이나 탭하면 영구 스킵되고 다시 볼 방법이 없음**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\FeatureTour.jsx:86-89,180-189
   - 문제: 투어 오버레이는 inset:0 전체 화면이 클릭 타깃이며(181-189행) onClick이 handleSkip으로 연결돼 localStorage 'byeolsoom_tour_v1'='done'을 즉시 기록한다(87행). 모바일에서 홈 도착 직후 화면을 무심코 한 번 탭하면 5단계 투어 전체가 0~1단계만 보고 영구 소멸한다. 코드베이스 전체에 이 키를 리셋하거나 투어를 재실행하는 경로가 없어(grep 결과 App.jsx 트리거와 FeatureTour 내부뿐) 설정에서도 다시 볼 수 없다. 위 #2의 팝업 충돌과 결합하면 팝업을 닫으려는 탭이 투어를 죽이는 시나리오도 발생한다.
   - 제안: 오버레이 탭은 '현재 단계 다음으로 진행'(또는 무시)으로 바꾸고 스킵은 명시적 '건너뛰기' 버튼만 허용. SettingsPage에 '기능 안내 다시 보기' 항목을 추가해 byeolsoom_tour_v1을 리셋.

4. **[P1/S] 비로그인 사용자가 메뉴를 누르면 설명 없이 프로필 입력 화면으로 조용히 이동**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:106-114, C:\Users\rkdqu\Desktop\saju-main\src\pages\ProfileStep.jsx:112
   - 문제: MenuDrawer의 handleNav(108-114행)는 requiresLogin 집합(20개 step)에 속한 항목을 비로그인 사용자가 누르면 토스트·안내 없이 targetStep을 STEP.PROFILE로 치환한다. '별숨 광장'을 눌렀는데 '반가워요 / 생년월일만 있으면…'(ProfileStep.jsx:112-113) 화면이 뜨므로, 사용자는 왜 이동했는지·로그인이 필요하다는 사실 자체를 알 수 없다. formOkApprox가 없을 때(111행)도 동일하게 무언 리다이렉트된다. 같은 항목을 반복해서 눌러도 매번 같은 화면으로 튕겨 '앱이 고장났다'는 인상을 준다.
   - 제안: 리다이렉트 시 showToast('로그인 후 이용할 수 있어요' / '생년월일을 먼저 입력해주세요')를 함께 호출하거나, 드로어 항목 자체에 자물쇠 배지를 표시하고 탭 시 로그인 시트를 띄운다. handleNav에 onNav 외 showToast prop 전달이면 충분.

5. **[P1/S] 프로필 입력 CTA가 비활성일 때 누락 필드 안내가 불가능 — 안내 토스트가 도달 불가 코드**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\pages\ProfileStep.jsx:235-241
   - 문제: '다음 단계 →' 버튼이 disabled={!profileReady}(236행)인데, onClick 내부의 누락 안내 토스트('태어난 시각(또는 모름 선택)과 성별을 모두 입력해주세요', 238-241행)는 버튼이 비활성이라 영원히 실행되지 않는다. 첫 사용자가 생년월일만 넣고 성별이나 출생시각 응답을 빠뜨리면 버튼이 회색으로 죽어 있을 뿐 무엇이 빠졌는지 아무 피드백이 없다. 가입 퍼널의 첫 필수 관문에서 막히는 지점이며, 특히 '태어난 시각'은 '정확히 알아요'를 누른 뒤 시각을 선택하지 않으면 미완성 상태라는 걸 알기 어렵다.
   - 제안: disabled를 제거하고 버튼은 항상 탭 가능하게 두되 !profileReady면 기존 토스트를 띄우고 누락 필드로 스크롤/포커스 이동. 또는 버튼 위에 '성별을 선택해주세요' 같은 인라인 헬퍼 텍스트를 조건부 렌더.

6. **[P2/M] 온보딩 카드: 스와이프 불가 + 진행 도트 탭 타깃 6×6px + 마지막 카드 중복 종료 버튼**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\OnboardingCards.jsx:265-268,281-299,324-344
   - 문제: 카드 전환 수단이 '다음 →' 버튼과 도트 탭뿐이고 스와이프 제스처가 없다(전환 로직은 setIdx 클릭 핸들러뿐, 265-268행) — framer-motion이 이미 의존성에 있는데도 모바일 캐러셀 관성과 어긋난다. 진행 도트는 width 6(활성 20)×height 6px, padding 0의 button(283-298행)으로 iOS HIG 44pt·WCAG 24px 최소 타깃에 크게 미달해 사실상 탭 불가하면서 aria-label로 탭 가능한 척한다. 마지막 카드에는 '별숨 시작하기'와 '다시 보지 않기'(327-344행)가 모두 동일한 onFinish를 호출해, '다시 보지 않기'를 누르지 않으면 온보딩이 또 나오는 것처럼 오인하게 만든다.
   - 제안: 도트 button에 padding 10px 이상을 줘 시각 크기는 유지하되 히트 영역을 44px급으로 확장. 카드 영역에 framer-motion drag="x" 스와이프를 추가. 마지막 카드의 '다시 보지 않기' 버튼은 제거(동작이 동일하므로).

7. **[P2/M] 비로그인 첫 화면(100svh 히어로)에 제품 증거가 없음 — 샘플·리뷰는 모두 폴드 아래**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\pages\LandingPage.jsx:516-572, C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:110-114,137
   - 문제: .land-hero가 min-height:100svh(theme.css:110)라 첫 화면은 워드마크·오브 애니메이션·추상 카피('당신의 별숨은 당신을 바라보고 있어요')·로그인 카드로 가득 차고, 실제 제품이 무엇을 주는지 보여주는 SamplePreview·오늘의 별 메시지·이용자 리뷰(LandingPage.jsx:556-571)는 전부 한 화면 이상 스크롤해야 나온다. 폴드 안의 구체적 가치 설명은 로그인 카드 안 var(--sm) 두 줄(530-532행)뿐이다. 가입 결정에 필요한 '결과물 미리보기'가 카카오 로그인 버튼보다 아래에 있어, 신뢰 형성 전에 로그인부터 요구하는 구조다. 게스트 체험 진입점도 밑줄 친 var(--xs) 고스트 링크(548행, theme.css:137)로 존재감이 없다.
   - 제안: 히어로의 min-height를 줄이거나 SamplePreview 축약판(오늘의 운세 카드 1장)을 폴드 안으로 끌어올리고, '로그인 없이 먼저 체험하기'를 보조 버튼 스타일로 승격해 카카오 버튼 바로 아래 동급 위계로 배치.

8. **[P2/S] ConsentModal: defaultOn 설계값이 미사용(전부 OFF로 시작)이고 상세 설명·정책 링크가 없음**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\ConsentModal.jsx:3-8,76-78, C:\Users\rkdqu\Desktop\saju-main\src\hooks\useUserProfile.js:91,645-648
   - 문제: ConsentModal.jsx:3-8의 ITEMS에 defaultOn(history:true, workplace:true)이 선언돼 있으나 컴포넌트 어디에서도 사용되지 않는 죽은 값이고, 실제 초기값은 useUserProfile.js:91의 null → 확인 시 전부 false(647행)다. 즉 설계 의도였던 '상담 기록 기본 ON'이 적용되지 않아, 동의를 그냥 지나친 신규 사용자는 기기 변경 시 상담 기록을 전부 잃는데 그 결과를 알 길이 없다. 또한 모달에는 '이대로 별숨 시작하기' 단일 버튼뿐, 각 항목이 서버에 어떻게 저장·이용되는지 보는 상세/개인정보처리방침 링크가 없어 첫 진입 30초 안에 4개 항목의 프라이버시 트레이드오프를 깜깜이로 결정해야 한다.
   - 제안: 의도가 opt-in 전체 OFF라면 ITEMS의 defaultOn을 삭제하고, 대신 history OFF 상태에 '기기를 바꾸면 상담 기록이 사라져요' 경고 문구를 토글 아래 표시. 모달 하단에 개인정보처리방침 링크 한 줄 추가. (참고: 같은 빈 상태 점검 대상이던 DiaryListPage.jsx:178-193, ItemInventoryPage.jsx:223-234는 CTA 포함 빈 상태가 이미 잘 구현돼 있어 문제 없음.)

## UX 전문가 ② — 정보구조·내비게이션

1. **[P0/M] 새로고침·재방문 시 무조건 홈으로 리셋 — 딥링크 불가 + 작성 중 데이터 전부 소실**
   - 파일: src/hooks/useNavigation.js:52-56, src/store/useAppStore.js:9, src/components/DiaryPage.jsx:71-85, src/utils/steps.js:1-48
   - 문제: useNavigation.js 55행은 pathname을 그대로 둔 채 history state에만 step을 기록하고, useAppStore.js 9행의 step은 0으로 초기화되며 어디에도 persist되지 않는다. 따라서 어느 페이지에서든 새로고침하면 무조건 홈(step 0)으로 떨어지고, 특정 페이지 공유/딥링크는 ?group= 단 하나만 가능하다. 결정적으로 DiaryPage의 일기 본문(gratitude/tomorrowGoal/directQuestion 등)은 전부 일반 useState이고 localStorage/sessionStorage 임시저장이 한 줄도 없으며(grep 확인), useConsultation의 chatHistory도 메모리 전용이다. 모바일 PWA는 백그라운드 전환 시 탭이 수시로 메모리 회수되므로, 아이폰 사용자가 일기 쓰다가 카톡 한 번 확인하고 돌아오면 앱이 홈에서 재시작되고 작성 내용이 통째로 사라진다. 핵심 BP 획득 루프(일기→BP)를 끊는 최악의 이탈 유발 지점.
   - 제안: 1) step을 URL hash(예: #/diary) 또는 ?step=에 인코딩하고 초기 로드 시 복원(useNavigation에 양방향 동기화 추가, 풀 라우터 도입 없이 가능). 2) DiaryPage·ChatStep 입력값을 sessionStorage에 디바운스 자동 저장하고 마운트 시 복원. 장기적으로는 react-router 전환을 권장하나, 위 두 가지만으로 데이터 소실은 즉시 막을 수 있다.

2. **[P1/M] 안드로이드 백버튼이 모달을 닫지 않고 밑의 페이지를 이동시킴 (모달 스택 부재)**
   - 파일: src/hooks/useNavigation.js:58-66, src/components/BottomNav.jsx:231-233, src/App.jsx:439-461,495-511
   - 문제: popstate 핸들러(useNavigation.js 58-66행)는 e.state?.step ?? HOME으로 setStep만 호출하며 모달/드로어/사이드바 상태를 전혀 모른다. 사이드바, AppModals의 프로필/타인프로필/동의/초대/공유 모달, BPConfirmModal이 열린 상태에서 안드로이드 시스템 백버튼을 누르면 모달은 그대로 떠 있는 채 뒤의 페이지만 이전 step으로 바뀐다. BottomNav 드로어는 step 변경 useEffect(231-233행)로 닫히긴 하지만, 사용자 의도는 '드로어 닫기'였는데 페이지까지 함께 이동해버린다. 모바일 사용자의 가장 빈번한 제스처(백버튼/스와이프백)가 매번 예상과 다르게 동작하는 구조.
   - 제안: 모달 오픈 시 history.pushState({modal: id})를 쌓고, popstate에서 열린 모달이 있으면 setStep 대신 최상위 모달만 닫는 가드를 useNavigation에 추가. Zustand에 간단한 modalStack 배열을 두면 AppModals·Sidebar·드로어를 일괄 처리할 수 있다.

3. **[P1/M] 상담 드로어로 진입한 궁합/예언/심층인터뷰의 뒤로가기가 본 적 없는 '결과' 페이지로 감**
   - 파일: src/App.jsx:482, src/utils/steps.js:56, src/components/BottomNav.jsx:35,39,41
   - 문제: App.jsx 482행은 BACK_TO_RESULT 그룹(CHAT/DEEP_INTERVIEW/COMPAT/FUTURE_PROPHECY/REPORT)의 뒤로가기를 무조건 setStep(STEP.RESULT)로 보낸다. 그러나 이 페이지들은 BottomNav 상담 드로어에서 홈→직행으로 진입 가능하다(BottomNav.jsx 35·39·41행). 상담을 한 번도 하지 않은 사용자가 드로어에서 '궁합'에 들어갔다가 뒤로가기를 누르면 selQs/answers가 비어 있거나 이전 세션의 낡은 데이터가 남은 ResultsStep에 떨어진다. 진입 경로를 기억하지 않는 정적 매핑이 원인이며, 사용자는 '내가 어디로 왔는지' 모델이 깨진다.
   - 제안: Zustand에 직전 step 1개(또는 소형 스택)를 기록하고 뒤로가기는 그 값을 우선 사용, 기록이 없을 때만 RESULT/HOME 폴백. 최소 수정으로는 BACK_TO_RESULT 분기에서 answers.length === 0이면 HOME으로 보내는 가드만 추가해도 빈 결과 페이지 노출은 막을 수 있다.

4. **[P1/S] 별숨샵·익명궁합·연간리포트·성장대시보드·오브제함 5개 페이지에 뒤로가기 버튼 자체가 없음**
   - 파일: src/utils/steps.js:57-64, src/App.jsx:481-486, src/components/ShopPage.jsx, src/components/GrowthDashboardPage.jsx, src/components/ItemInventoryPage.jsx
   - 문제: STEP_GROUPS.BACK_TO_HOME(steps.js 57-64행)에 SHOP(31), ANON_COMPAT(32), YEARLY_REPORT(36), GROWTH_DASHBOARD(37), ITEM_INVENTORY(38)이 빠져 있어 App.jsx의 어떤 back-btn 조건에도 걸리지 않는다. ShopPage/GrowthDashboardPage/ItemInventoryPage 자체에도 onBack·back-btn·arrow-left가 전혀 없음을 grep으로 확인했다. 남는 탈출구는 우상단 home-btn뿐인데, 다른 모든 페이지에는 back+home 두 버튼이 나란히 있어 일관성이 깨지고, 특히 수익 핵심인 상점에서 '뒤로 갈 수 없는' 막힌 느낌을 준다. 추가로 YEARLY_REPORT는 TAB_* 어느 그룹에도 없어 BottomNav가 '오늘' 탭을 잘못 활성화한다(BottomNav.jsx 264-269 폴백).
   - 제안: steps.js BACK_TO_HOME 배열에 누락된 5개 step을 추가하고, YEARLY_REPORT를 TAB_CONSULT에 추가. 한 줄 수정 두 곳으로 끝나는 일.

5. **[P1/L] 하단 탭 5개 중 4개가 드로어 토글 — 모든 핵심 이동이 2탭 강제, 상담 드로어는 13개 항목 과밀**
   - 파일: src/components/BottomNav.jsx:271-278, src/components/BottomNav.jsx:28-50,180, src/components/BottomNav.jsx:106-111
   - 문제: handleTabPress(271-278행)는 설정 탭만 즉시 이동하고 나머지 4개 탭은 드로어 토글이다. 홈/오늘운세/일기 같은 1차 목적지조차 항상 탭→드로어→항목 2단계를 거쳐야 한다. 상담 드로어는 13개 항목을 2열 그리드(180행: items>6이면 1fr 1fr)에 50vh 스크롤로 욱여넣어, 사용 빈도가 극단적으로 다른 '별숨에게 물어보기'와 '로또 번호 뽑기'가 같은 평면에 놓인다. 또한 드로어의 requiresLogin 처리(106-111행)는 비로그인 사용자가 '별숨 광장' 등을 누르면 아무 설명 없이 STEP.PROFILE(생년월일 입력 폼)로 떨어뜨려, 왜 여기에 왔는지 알 수 없는 미아 상태를 만든다.
   - 제안: 각 탭의 1순위 목적지(오늘=홈, 상담=QUESTION, 성장=성장대시보드, 광장=커뮤니티)로 첫 탭은 즉시 이동시키고, 드로어는 활성 탭 재탭 시에만 열거나 허브 페이지 내 그리드로 이전. 상담 13개는 상위 5~6개 + '더보기'로 티어링. 비로그인 리다이렉트 시에는 '로그인이 필요해요' 토스트를 먼저 띄울 것.

6. **[P2/S] 스크롤 시 내비 자동 숨김이 열려 있는 드로어까지 강제 폐쇄 + 드로어에 body 스크롤 잠금 없음**
   - 파일: src/components/BottomNav.jsx:235-254, src/components/BottomNav.jsx:118-126,177-185
   - 문제: 스크롤 핸들러(235-254행)는 60px 이상 아래로 스크롤되면 내비를 숨기면서 244행에서 열린 드로어도 함께 닫는다. 문제는 드로어 오버레이(118-126행)가 body 스크롤을 잠그지 않는다는 것: 드로어 내부 항목 리스트(maxHeight 50vh, overflowY auto)를 스와이프하다 끝에 닿으면 스크롤이 body로 전파되고, window scroll 이벤트가 발생해 항목을 고르던 도중 드로어가 저절로 닫힌다. 메뉴 선택 중 UI가 사라지는 경험은 사용자가 자기 실수로 오인하게 만든다.
   - 제안: 드로어 오픈 동안 document.body.style.overflow='hidden'(또는 overscroll-behavior: contain)으로 스크롤 잠금을 걸고, 244행의 '스크롤 시 드로어 닫기' 로직은 제거(오버레이 탭/항목 선택으로만 닫히게).

7. **[P2/M] 사이드바와 하단 내비의 분류 체계가 서로 충돌 — 같은 기능이 다른 그룹·다른 이름으로 존재**
   - 파일: src/components/Sidebar.jsx:315-318,347-352,258-262, src/components/BottomNav.jsx:28-83
   - 문제: 두 내비게이션이 같은 기능을 다르게 분류한다. 궁합·대운·기념일운세는 사이드바에서 '성장 · 나를 알아가기'(Sidebar.jsx 315-318행)인데 BottomNav에서는 '상담'(35-47행)이고, 별숨샵·통계는 사이드바 '광장'(351-352행) vs BottomNav '성장'(59-61행)이다. '연간 종합 리포트'(Sidebar 260행)와 사주카드·문의는 BottomNav 어디에도 없고, 반대로 일기·미션 계열은 사이드바 '오늘'에만 있다. 같은 기능의 라벨도 '1대1 별숨 (궁합)' vs '궁합', 'MyBlueprint — 나의 별숨' vs '나의 별숨'으로 불일치. 사용자가 '저번에 어디서 봤더라'를 반복하게 되는 멘탈모델 파괴 요인.
   - 제안: STEP_GROUPS의 TAB_* 분류를 단일 진실 공급원으로 삼아 MENU_GROUPS와 사이드바 메뉴를 같은 데이터에서 생성하도록 통합하고, 기능 라벨을 1기능 1명칭으로 통일. 사이드바는 '히스토리 + 프로필' 전용으로 역할을 좁히는 것도 대안.

8. **[P2/S] QUESTION에서 뒤로가기가 진입 경로와 무관하게 항상 PROFILE(생년월일 폼)로 이동**
   - 파일: src/App.jsx:481, src/components/BottomNav.jsx:34
   - 문제: App.jsx 481행의 back-btn은 step 1~3 구간에서 setStep(p-1)로 enum을 1 감산한다. 사용자는 대부분 홈의 상담 드로어에서 QUESTION(2)으로 직행하는데(BottomNav.jsx 34행), 뒤로가기를 누르면 홈이 아니라 PROFILE(1) — 이미 다 입력해둔 생년월일 폼 — 로 떨어진다. '내 정보가 왜 또 나오지? 다시 입력해야 하나?'라는 혼란 유발. 같은 줄의 'p === STEP.RESULT ? STEP.QUESTION' 분기는 step < STEP.RESULT 조건 때문에 절대 도달하지 않는 데드코드다.
   - 제안: QUESTION의 뒤로가기는 진입 기록(발견 3의 직전 step 기록 활용) 또는 최소한 STEP.HOME으로 보내고, PROFILE→QUESTION 온보딩 플로우 중일 때만 PROFILE로 복귀. 데드코드 삼항 분기는 정리.

## UX 전문가 ③ — 피드백·신뢰성·마이크로카피

1. **[P0/S] 토스트(z-index 999)가 모든 모달·바텀시트·로딩 오버레이(z 8500~10000) 뒤에 가려짐 — 성공/실패 피드백 유실**
   - 파일: src/styles/theme.css:54, src/App.jsx:401-417, src/components/BPInsufficientModal.jsx:47-56, src/components/ShopPage.jsx:577, src/components/BottomNav.jsx:123-298, src/components/AppRouter.jsx:608-620
   - 문제: .toast가 z-index 999(theme.css:54)이고 App.jsx 트리 내부에 렌더되는 반면, 모달들은 createPortal로 body에 z 9990~10000(BPConfirmModal 10000, BuyModal 9999, BPInsufficientModal 9990/9991, BottomNav 드로어 9990~9999), 기능 로딩 오버레이는 z 8500(AppRouter:611)에 뜸. 실측 showToast 호출은 17개 파일 85곳. 대표 시나리오: BPInsufficientModal의 '무료 충전하기' 클릭 → useGamification.rechargeFreeBP가 '내일 다시 충전할 수 있습니다 ⏰' 등 토스트를 띄우지만 바텀시트(z 9991)에 완전히 가려져 사용자는 버튼이 죽었다고 인식. 가챠/상점 구매 중 오류 토스트도 동일하게 유실됨.
   - 제안: 토스트를 createPortal(document.body)로 옮기고 z-index를 최상위(예: 10500)로 올리거나, .toast z-index를 10500으로 상향. 모달 z 범위(8500~10000)보다 항상 위에 있도록 주석으로 레이어 규칙을 theme.css에 명문화.

2. **[P0/M] 이모지 유실로 빈 박스/빈 span이 28개 파일 42곳 렌더 — BP 결제 확인 시트가 '깨진 화면'으로 보임**
   - 파일: src/components/BPConfirmModal.jsx:58-66, src/components/BPConfirmModal.jsx:144, src/components/BPInsufficientModal.jsx:70, src/components/UpgradeModal.jsx:8, src/components/FeatureLoadingScreen.jsx:103, src/components/FeatureLoadingScreen.jsx:201, src/components/FeatureLoadingScreen.jsx:335, src/components/TarotPage.jsx
   - 문제: 정규식 검색 결과 내용이 비어 있는 아이콘용 span/div가 28개 파일 42곳. 특히 돈(BP)을 쓰는 순간의 핵심 UI에 집중됨: BPConfirmModal 58-66행은 48x48px 금색 테두리 박스가 빈 채로 렌더되고, 144행 CTA 버튼 '별숨에게 물어보기' 앞의 <span></span>은 gap:6으로 빈 공백만 남김. BPInsufficientModal 70행은 fontSize 1.6rem의 빈 헤더 div, UpgradeModal 8행은 2rem 빈 div. FeatureLoadingScreen도 타로 카드 문양·궁합 중심 하트·종합분석 중심 별(SVG text)·편지 봉인 등이 모두 빈 요소(103/201/267/335/420/476/543행). 일부 이모지(🌙💚🎯🎰)는 살아 있어 특정 문자 범위만 일괄 유실된 것으로 보임 — 결제 직전 화면이 미완성으로 보여 신뢰를 직접 훼손.
   - 제안: 유실 이모지 복원(✦/⭐/💫/🔮 등 의도 글자를 git 이력에서 확인해 재삽입)하거나, 복원 불가 시 빈 컨테이너 자체를 제거. 42곳 전수는 grep '<(span|div)[^>]*>\s*</' 로 추적 가능. 재발 방지를 위해 파일 저장 인코딩(UTF-8) 점검.

3. **[P0/L] UpgradeModal '이 이용권으로 계속 대화하기' — 결제 검증 없이 유료 플랜(월 5,500원) 즉시 적용 후 CHAT 진입**
   - 파일: src/components/UpgradeModal.jsx:13-22, src/utils/constants.js:398-404, src/hooks/useConsultation.js:238-240, src/hooks/consultation/useChatConsultationHandler.js:156
   - 문제: UpgradeModal 22행: onClick={() => { onClose(); setStep(STEP.CHAT); }} — 결제·구독 확인 로직이 전혀 없음. 13행에서 setPkg(p.id)로 'premium' 선택 시 useConsultation.js 238-240행의 curPkg가 클라이언트 상태만으로 q:10, chat:999를 부여함(서버 검증 0건). 결과는 둘 중 하나: (a) '월 5,500원' 가격표를 보여주고 실제로는 무료로 무제한 채팅이 풀림(수익 누수 + 가격 표기 기만), 또는 (b) 추후 서버 차단 시 사용자는 '구매했다'고 믿었는데 막히는 신뢰 붕괴. 채팅 소진 시(useChatConsultationHandler:156) 이 모달이 다시 떠 같은 루프 반복.
   - 제안: 결제 미연동 상태라면 CTA를 '결제 준비 중' 비활성 처리하거나 가격 표기를 제거하고, 연동 시 결제 완료 콜백에서만 setPkg + 서버측 구독 플래그 기록. 최소한 setPkg('premium')가 결제 없이 호출되는 경로를 차단.

4. **[P1/S] 네트워크 오류에도 'BP가 부족해요' — spendBP가 부족/오류를 구분 못 해 잘못된 원인 안내**
   - 파일: src/utils/gamificationLogic.js:291-329, src/components/ShopPage.jsx:694, src/components/ShopPage.jsx:722, src/components/ShopPage.jsx:797, src/components/GachaPage.jsx:541, src/components/DreamPage.jsx:162-164
   - 문제: gamificationLogic.spendBP는 잔액 부족(305행)과 예외/네트워크 오류(326-328행 catch) 모두 ok:false만 반환. 호출부 5곳(ShopPage 694/722/797, GachaPage 541, DreamPage 163)이 일괄 'BP가 부족해요'를 띄움 — BP가 충분한 사용자가 일시적 네트워크 오류로 '부족' 안내를 받으면 잔액 표시 자체를 불신하게 됨. 또한 310-313행 update는 supabase 비-throw 패턴인데 .error를 확인하지 않아 차감 실패에도 ok:true를 반환(서버 미반영인데 화면 BP만 감소).
   - 제안: spendBP 반환에 reason 필드 추가({ok:false, reason:'insufficient'|'network'}) 후 호출부에서 '연결이 불안정해요. 다시 시도해주세요'와 'BP가 부족해요'를 분기. update 결과의 error를 검사해 실패 시 ok:false 처리.

5. **[P1/M] 가챠/상점: BP 선차감 후 인벤토리 insert 실패 시 화면 BP·아이템·서버 상태 3중 불일치, 보상 안내 없음**
   - 파일: src/components/ShopPage.jsx:686-706, src/components/ShopPage.jsx:709-756, src/components/ShopPage.jsx:630-638, src/components/GachaPage.jsx:530-561
   - 문제: doPullSpirit/doPullShop은 spendBP(서버 차감 성공) → user_shop_inventory.insert 순서인데, insert의 error를 확인하지 않고(supabase는 throw하지 않음) 결과 오버레이를 그대로 띄움 — 사용자는 '획득' 연출을 보지만 새로고침하면 아이템이 없고 BP만 사라짐. 진짜 throw가 나는 경우의 catch(704/754행)는 '뽑기 중 오류' 토스트만 띄우고 syncBP를 호출하지 않아 화면 BP는 차감 전 값으로 남음(서버는 이미 차감) — 다음 액션에서 갑자기 잔액이 줄어 보임. 중복 환급 경로(746-749행)는 read-modify-write여서 실패 시 환급 약속('중복 시 BP 환급')이 조용히 깨짐.
   - 제안: insert 결과 error 검사 → 실패 시 BP 환급 시도 + '오류가 발생해 BP를 돌려드렸어요' 토스트. catch 블록에서 서버 current_bp를 재조회해 syncBP로 화면 동기화. 장기적으로 차감+지급을 Supabase RPC 단일 트랜잭션으로.

6. **[P1/M] 기능 로딩 화면에 실패/타임아웃/취소 상태가 전무 — retryMsg는 상담 LOADING 한 곳에만 연결**
   - 파일: src/components/FeatureLoadingScreen.jsx:548-577, src/components/AppRouter.jsx:223-233, src/components/AppRouter.jsx:608-620, src/hooks/useConsultation.js:236
   - 문제: FeatureLoadingScreen은 13종 기능 애니메이션·카피는 충실하지만 에러/재시도/취소 UI가 0건. useConsultation의 retryMsg는 AppRouter 227-231행의 상담 LOADING step에만 렌더되고, 꿈해몽·궁합·이름풀이·예언·택일 등 BP를 선차감하는 기능들(DreamPage:279, CompatPage:231, NameFortunePage:184 등)은 풀스크린 오버레이(fixed inset 0, z 300/8500)가 API 응답까지 화면 전체를 막는데 응답이 안 오면 탈출 수단이 없음. 실패 토스트는 발견 1의 z-index 문제로 오버레이(z 8500)에 가려질 수 있어 'BP는 빠졌는데 화면은 영원히 로딩' 최악 경로가 성립. 부수: AppRouter 618행이 text prop을 넘기지만 컴포넌트 시그니처는 title/subtitle만 받아 커스텀 문구가 조용히 무시됨.
   - 제안: FeatureLoadingScreen에 onCancel·error props 추가: 15초 경과 시 '조금 더 걸리고 있어요' + 취소 버튼 노출, 실패 시 오버레이 안에서 직접 '다시 시도/돌아가기' 표시(토스트 의존 제거). AppRouter 618행 text→subtitle로 수정.

7. **[P1/S] 다크 모드에서 로딩 오버레이가 라이트 전용 크림색 하드코딩 — 로딩 문구가 흰 글자 위 크림 배경으로 거의 안 읽힘**
   - 파일: src/components/FeatureLoadingScreen.jsx:566, src/components/AppRouter.jsx:612, src/styles/theme.css:15, src/styles/theme.css:33
   - 문제: FeatureLoadingScreen fullPage 배경(566행)과 AppRouter featureLoading 오버레이(612행) 모두 'rgba(250, 247, 241, 0.97)' 하드코딩. theme.css에는 테마별 --loading-overlay 토큰(다크 rgba(13,11,20,.92) / 라이트 rgba(250,247,241,.94))이 이미 정의돼 있으나 미사용. 다크 테마 사용자(SettingsPage 공식 기능)는 어두운 화면 → 풀스크린 크림색 플래시를 겪고, Label의 제목/부제는 var(--t1)/var(--t2)(다크 값 #F8F6FF/#D4CCE6)라 크림 배경 위에서 대비가 무너져 '카드의 목소리를 듣고 있어요' 등 안내 문구가 사실상 보이지 않음. daily/tarot/dream/compat/name/prophecy/taegil/report 등 BP 소비 직후 핵심 대기 화면 전부 해당.
   - 제안: 두 곳의 하드코딩을 background: var(--loading-overlay)로 교체(토큰이 이미 존재하므로 2줄 수정).

8. **[P2/M] 삭제 확인이 window.confirm — 앱 바텀시트 패턴과 단절, PWA standalone에서 브라우저 OS 다이얼로그 노출**
   - 파일: src/components/CommunityPage.jsx:1009, src/components/DiaryPage.jsx:251, src/components/SajuCalendar.jsx:373
   - 문제: 게시글/일기 삭제 3곳이 window.confirm('이 게시글을 삭제할까요?') 사용. 앱은 BPConfirmModal·BPInsufficientModal 등 정성 들인 바텀시트 확인 패턴을 이미 갖췄는데, 파괴적 작업에서만 갑자기 시스템 다이얼로그(iOS PWA standalone에서는 도메인이 표시되는 무미건조한 네이티브 얼럿)가 떠 톤이 깨짐. 또한 confirm은 '확인/취소' 레이블을 제어할 수 없어 파괴적 작업에 권장되는 명시적 동사('삭제') 버튼을 못 씀.
   - 제안: BPConfirmModal 구조를 재사용한 공용 ConfirmSheet(제목/설명/위험 동사 버튼 빨강 처리) 컴포넌트를 만들어 3곳 교체. 삭제 버튼 레이블은 '삭제하기', 취소가 기본 포커스.

## UI 전문가 ① — 디자인 시스템·시각 일관성

1. **[P1/L] 큰글씨 모드(data-font=large)가 214곳의 하드코딩 9~11px 글자에 전혀 적용되지 않음**
   - 파일: src/styles/theme.css:40-42, src/components/BottomNav.jsx:172, src/components/MyPage.jsx:545, src/components/MyPage.jsx:554, src/components/GachaPage.jsx:285-296, src/components/CommunityPage.jsx (28곳), src/components/ShopPage.jsx (20곳)
   - 문제: theme.css:40-42의 [data-font="large"]는 --xl~--2xs 토큰만 키우는데, grep 결과 37개 컴포넌트에서 fontSize '9px'/'10px'/'11px' 하드코딩이 정확히 214건 확인됨(CommunityPage 28, GachaPage 25, ShopPage 20, GrowthDashboardPage 19, TarotPage 13...). 사주/운세 앱의 핵심 타깃인 중장년 사용자가 설정에서 큰글씨를 켜도 메뉴 설명(BottomNav.jsx:172), 구독 안내·푸터(MyPage.jsx:545,554), 뽑기 확률·아이템 설명(GachaPage) 등 가장 작은 글자들이 그대로 9~11px(≈0.56~0.69rem)로 남음. 게다가 토큰 최소값 --2xs(0.625rem=10px)보다 작은 9px은 토큰 체계 자체에 존재하지 않는 크기임.
   - 제안: (1) 하드코딩 px를 var(--2xs)/var(--xs)로 일괄 치환하는 codemod 수행(fontSize: '9px'|'10px' → 'var(--2xs)', '11px' → 'var(--xs)'). (2) 9px가 정말 필요한 곳은 --3xs 토큰을 추가하고 large 모드 값도 함께 정의. (3) ESLint 커스텀 룰 또는 grep 기반 CI 체크로 인라인 px fontSize 재유입 차단.

2. **[P1/S] 토스트(z 999)가 모달 오버레이(z 9990~10000) 아래에 깔려, BP 구매 실패 토스트가 보이지 않음**
   - 파일: src/styles/theme.css:54, src/App.jsx:402-417, src/components/ShopPage.jsx:577, src/components/ShopPage.jsx:797, src/components/ShopPage.jsx:808, src/components/BottomNav.jsx:123
   - 문제: 토스트는 App.jsx:402-417에서 .toast 클래스(theme.css:54, z-index:999)로 앱 트리 안에 렌더되는 반면, 모달들은 createPortal로 body에 z 9990~10000으로 뜸. 구체적 재현: ShopPage.jsx handleBuySpecial에서 spendBP 실패 시(797행 'BP가 부족해요', 808행 '구매에 실패했어요') setConfirmItem(null)을 호출하지 않아 BuyModal(577행, z 9999, rgba(0,0,0,0.7) 딤)이 열린 채로 토스트가 발사됨 → 토스트가 딤 뒤에 완전히 가려져 사용자는 '구매하기'를 눌렀는데 아무 반응이 없는 것으로 인식. 재화(BP) 결제 흐름에서 피드백이 사라지는 케이스라 연타·불신·문의로 이어질 수 있음. BottomNav 드로어(z 9990) 위에서도 동일.
   - 제안: 토스트를 createPortal(document.body)로 옮기고 z-index를 최상위(예: 12000, AnonSynergyModal 11000보다 위)로 상향. 추가로 ShopPage 에러 경로에서 모달을 닫거나 모달 내부에 인라인 에러를 표시.

3. **[P1/M] GachaPage/ShopPage 결과 오버레이·뽑기 배너의 다크 색상 하드코딩 — 라이트 테마 무시**
   - 파일: src/components/GachaPage.jsx:107-111, src/components/GachaPage.jsx:654, src/components/GachaPage.jsx:664, src/components/GachaPage.jsx:121-178, src/components/GachaPage.jsx:325-338, src/components/ShopPage.jsx:100
   - 문제: GachaPage 본문은 var(--bg2)/var(--t3) 등 토큰을 쓰지만(604-648행 확인), (1) 결과 오버레이 배경이 '#0d0b14' 하드코딩(107-111행)이고 ShopPage 오버레이도 'linear-gradient(...#0d0b14 100%)'(100행), (2) 뽑기 배너 bgStyle이 '#1a0c10/#0d0830' 다크 그라데이션 하드코딩(654,664행), (3) 그 위 텍스트가 전부 '#fff'/'rgba(255,255,255,.45~.72)' 고정(121,162,164,325-326,338행). 라이트 테마에서는 밝은 페이지 한가운데 다크 섬(배너)과 풀스크린 다크 오버레이가 떠서 테마 전환이 깨진 인상을 줌. 핵심 수익 기능(가챠)이 라이트 모드 사용자에게 '미완성'으로 보이는 문제.
   - 제안: 오버레이/배너용 서피스 토큰을 신설(예: --overlay-deep, --banner-cosmic — 라이트 모드에서는 채도 낮춘 밝은 변형 또는 의도적 다크 유지라면 텍스트·테두리만이라도 토큰화)하고 흰색 고정 텍스트를 토큰 기반으로 교체. '연출상 항상 다크'가 의도라면 해당 컨테이너에 data-theme=dark를 강제 지정해 내부 var()가 다크 값으로 풀리게 하는 방법이 가장 적은 수정.

4. **[P1/M] 모달/확인 UI 시각 언어 4종 혼재 + 딤·z-index 체계 부재**
   - 파일: src/components/BPConfirmModal.jsx:29-48, src/components/BottomNav.jsx:116-141, src/styles/theme.css:446-447, src/styles/theme.css:464-465, src/components/ShopPage.jsx:577, src/components/DiaryPage.jsx:251, src/components/CommunityPage.jsx:1009, src/components/SajuCalendar.jsx:373
   - 문제: 확인/선택 UI가 4가지 패턴으로 혼재함을 확인: (a) 포털 바텀시트 — BPConfirmModal(radius 20px, 딤 rgba(0,0,0,.72), z 10000), BottomNav 드로어(radius 18px, 딤 .45, z 9990), (b) CSS 클래스 바텀시트 — .profile-sheet(radius 24px, 딤 .55, z 200), (c) 중앙 모달 — .upgrade-modal-bg(딤 .6, z 200), ShopPage BuyModal(딤 .7, z 9999), (d) 네이티브 window.confirm 3곳(일기 삭제 2곳, 게시글 삭제). 같은 '확인' 행위인데 BP 차감은 브랜드화된 바텀시트, 일기 삭제는 OS 기본 다이얼로그라 일관성이 깨지고, 딤 농도 5종(.45/.55/.6/.7/.72)·시트 radius 3종(18/20/24)·z-index 두 체계(200대 vs 9000대)가 섞여 있어 신규 모달마다 임의 값이 추가되는 구조.
   - 제안: 기준 제안: '결정(확인/차감/삭제)'은 BPConfirmModal 스타일의 공용 ConfirmSheet 컴포넌트(radius 20px 상단, 딤 .6, 핸들바)로 통일하고 window.confirm 3곳을 이것으로 교체. '콘텐츠 진입(드로어/프로필)'은 바텀시트, '결제/업셀'만 중앙 모달로 한정. 딤은 --overlay-dim 토큰 1개, z-index는 --z-nav/--z-sheet/--z-modal/--z-toast 4단 스케일로 정의.

5. **[P2/M] borderRadius 토큰(--r1~r4) 우회 — 12/14/16/18/20/22px 임의 혼용**
   - 파일: src/styles/theme.css:21, src/components/OnboardingCards.jsx:73, src/components/OnboardingCards.jsx:121, src/components/OnboardingCards.jsx:183, src/components/OnboardingCards.jsx:232, src/components/BPConfirmModal.jsx:42, src/components/BPConfirmModal.jsx:59, src/components/ShopPage.jsx:126
   - 문제: 토큰은 --r1:12 --r2:20 --r3:28 --r4:36으로 정의돼 있으나(theme.css:21), 온보딩 첫 화면 안에서만 카드 radius가 20(73행)→18(121행)→16(183행)→14(232행)로 4종이 혼용됨. BPConfirmModal은 시트 20px(42행)·아이콘 14px(59행), ShopPage 결과 카드 22px(126행), GachaPage 결과 카드 20px·내부 박스 12px 등 토큰 사이 값(14/16/18/22)이 광범위하게 사용됨. 첫인상을 결정하는 온보딩에서부터 카드 곡률이 제각각이라 '느슨한 디자인'으로 보이고, 토큰 기반 리디자인 시 일괄 변경이 불가능.
   - 제안: 중간 단계 토큰 --r1-5(16px)를 추가하든지, 14~22px 값을 가장 가까운 r1(12)/r2(20)로 스냅하는 규칙을 정해 일괄 치환. 최소한 OnboardingCards 내부 3종(18/16/14)부터 var(--r2)/var(--r1)로 통일.

6. **[P2/S] src/styles/theme.js — 665줄짜리 미사용(stale) 디자인 토큰 사본이 살아있어 잘못 수정 위험**
   - 파일: src/styles/theme.js:1-30, src/main.jsx:4
   - 문제: 전역 스타일 import는 main.jsx:4의 theme.css 단 1건이고 theme.js는 어디서도 import되지 않음(grep으로 확인). 그런데 theme.js는 theme.css와 거의 동일한 CSS 문자열 665줄을 담고 있으며 값이 이미 갈라짐: 라이트 --t4가 theme.js는 #C0B8CC(저대비), theme.css는 #8A7D9E이고, theme.js에는 --2xs·큰글씨 모드·홈 서피스 토큰이 아예 없음. 디자인 토큰을 고치려는 사람이 theme.js를 수정하면 아무 효과가 없고, 두 파일의 차이가 '어느 쪽이 진짜인지' 혼란을 유발 — 토큰 단일 출처 원칙이 깨진 상태.
   - 제안: theme.js 삭제(또는 다른 용도로 쓰일 계획이면 CSS 문자열 제거 후 JS 토큰 객체만 남기고 theme.css에서 생성). 삭제 전 grep으로 참조 0건 재확인.

7. **[P2/S] 골드 버튼 텍스트 '#0D0B14' 하드코딩 20여곳 — 현재 대비는 통과하나 토큰 부재로 회귀 위험**
   - 파일: src/styles/theme.css:105, src/styles/theme.css:183, src/components/BPConfirmModal.jsx:138, src/components/SajuCalendar.jsx:443, src/components/SajuCalendar.jsx:527, src/components/SocialSynergyMission.jsx:78
   - 문제: PM 의심 지점 (5) 검증 결과: .cta-main/.btn-main(theme.css:105,183)과 컴포넌트 20여곳이 골드 배경 위 텍스트색을 '#0D0B14'로 하드코딩. 실측 대비는 다크(#FFC85C 위) 약 13:1, 라이트(#B07820 위) 약 5.2:1로 둘 다 WCAG AA 통과 — 즉 현재는 깨지지 않음. 다만 'on-gold' 색이 토큰화돼 있지 않아 라이트 골드 값을 조금만 밝게 조정해도(예: #C08A30) 20여 파일이 동시에 대비 미달로 회귀하는 구조. 부수 발견: SajuCalendar.jsx:527의 토요일 색 '#4A8EC4'는 라이트 배경(#FAF7F1)에서 약 3.2:1로 작은 글자 AA 미달.
   - 제안: --on-gold 토큰을 신설해 #0D0B14 하드코딩을 치환(라이트/다크 공통이면 :root에 1회 정의로 충분). SajuCalendar 토요일 색은 라이트 모드용 진한 파랑 토큰(예: #2F6EA0)으로 분기.

8. **[P2/M] z-index 임의값 14종 산재(200~11000) — 신규 레이어마다 충돌 재발 구조**
   - 파일: src/components/AnonSynergyModal.jsx:38, src/components/FeatureTour.jsx:116, src/components/BPConfirmModal.jsx:29, src/components/BottomNav.jsx:298, src/components/PremiumConsultationResult.jsx:69, src/components/BoostItemSheet.jsx:91, src/styles/theme.css:54
   - 문제: 전수 grep 결과 인라인 zIndex가 200, 300, 5000, 8500, 9000, 9200, 9990, 9991, 9999, 10000, 10001, 11000 등 최소 12개 값으로 산재. 예: BoostItemSheet(300)는 BottomNav(9999) 아래에 깔리고, UpgradeModal(.upgrade-modal-bg z 200)은 하단 내비(9999)·드로어(9990)보다 낮아 내비가 결제 업셀 모달 위로 뚫고 올라옴. AnonSynergyModal(11000) > FeatureTour(10001) > BPConfirmModal(10000) 같은 우열도 우연에 의존. 토스트 가림(별도 발견 #2)도 이 체계 부재의 증상.
   - 제안: theme.css에 z-스케일 토큰 정의(--z-nav:100, --z-sheet:200, --z-modal:300, --z-tour:400, --z-toast:500 등 동일 자릿수 체계)하고 인라인 zIndex를 var()로 치환. 특히 UpgradeModal(z 200)과 BottomNav(9999) 역전부터 수정 — 결제 모달 위에 내비가 떠 있으면 업셀 전환에 직접 악영향.

## UI 전문가 ② — 모바일 레이아웃·인체공학

1. **[P0/S] 설치형 PWA에서 상단 fixed 버튼 5종이 노치/다이내믹 아일랜드에 가려짐 (safe-area-inset-top 전무)**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:67-82 (theme-btn/back-btn/home-btn/user-chip top:14~16px 고정), C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:567 (menu-btn top:14px left:18px), C:\Users\rkdqu\Desktop\saju-main\index.html:8,31-32 (viewport-fit=cover + apple-mobile-web-app-capable + black-translucent), C:\Users\rkdqu\Desktop\saju-main\src\App.jsx:437,463-486 (버튼 렌더링)
   - 문제: index.html이 viewport-fit=cover + standalone + black-translucent 조합이라 설치형 PWA(아이폰)에서 레이아웃이 상태바 아래까지 확장되는데, env(safe-area-inset-top) 사용은 src 전체에서 PremiumConsultationResult.jsx:74 단 1곳. menu/back/home/theme/user-chip 5개 fixed 버튼은 모두 top:14~16px 고정이라 다이내믹 아일랜드(상태바 약 59px) 영역과 겹쳐 절반쯤 가려지고 탭이 어려움. 이 앱은 URL 라우팅이 없어 back-btn(left:66px)/home-btn(left:118px)이 사실상 유일한 뒤로가기 수단이므로 설치형 사용자는 내비게이션 자체가 마비됨. 가로 모드 노치(safe-area-inset-left)도 미처리.
   - 제안: theme.css의 .menu-btn/.back-btn/.home-btn/.theme-btn/.user-chip에 top:calc(env(safe-area-inset-top,0px) + 14px), 좌우에 calc(env(safe-area-inset-left/right,0px) + 기존값) 적용. PremiumConsultationResult가 이미 쓰는 패턴 그대로 5개 셀렉터에 확장하면 됨.

2. **[P1/S] 가챠 결과 오버레이(z 9000) 위에 BottomNav(z 9999)가 떠서 하단 액션 버튼 가림**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\GachaPage.jsx:113-119 (createPortal, zIndex 9000), C:\Users\rkdqu\Desktop\saju-main\src\components\GachaPage.jsx:214 (하단 버튼 padding '10px 16px 28px' 고정), C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:292-305 (nav zIndex 9999, scrollY<10이면 항상 표시)
   - 문제: 가챠 결과 풀스크린 오버레이는 zIndex 9000인데 BottomNav는 9999. BottomNav는 step 무관하게 항상 렌더되고 scrollY<10이면 visible이므로, 페이지가 짧거나 스크롤이 위에 있는 상태에서 뽑기를 하면 내비 바(~71px)가 결과 오버레이의 '전체 공개/닫기' 버튼 영역(bottom padding 28px) 위를 덮음. 유료 재화(BP)를 쓴 직후 결과 확인 버튼이 가려지는 것이라 수익 흐름 직격. 추가로 하단 28px 고정 패딩은 env(safe-area-inset-bottom) 미반영이라 홈 인디케이터 제스처 존과 겹침.
   - 제안: 오버레이 zIndex를 10000 이상으로 올리거나, 오버레이 열림 동안 BottomNav를 숨김. 하단 버튼 패딩을 calc(env(safe-area-inset-bottom,0px) + 28px)로 변경.

3. **[P1/S] 상담 드로어 13개 항목이 50vh 컷 + 스크롤바 전역 숨김으로 잘린 항목 인지 불가**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:177-185 (maxHeight '50vh', overflowY auto), C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:32-49 (consult 13개 항목), C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:44 (::-webkit-scrollbar width:0)
   - 문제: 상담 드로어는 13개 항목을 2열 그리드(7행, 행당 약 42px + gap 6)로 그려 약 330px가 필요한데 maxHeight 50vh라 iPhone SE(667px → 333px)에서는 마지막 행이 경계선에 걸리고, 더 작은 화면이나 큰글씨 모드에서는 1~2행이 잘림. 전역 ::-webkit-scrollbar width:0 때문에 스크롤바도 없고 잘림을 암시하는 페이드/그라데이션도 없어, 택일·기념일·로또 등 하단 상담 메뉴의 존재 자체를 모르고 지나감(기능 발견율 저하 → 매출 기회 손실).
   - 제안: 드로어 스크롤 영역에 하단 fade-out 그라데이션 또는 '더보기' 화살표 힌트 추가, 혹은 maxHeight를 콘텐츠가 반쯤 걸리도록(예: 45vh) 조정해 잘림이 시각적으로 드러나게. 드로어 내부만 scrollbar-width:thin 복원도 병행 권장.

4. **[P1/S] 토스트 z-index 999가 모든 모달·시트(9990~10000)보다 낮아 피드백 유실**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:54 (.toast z-index:999), C:\Users\rkdqu\Desktop\saju-main\src\components\BPConfirmModal.jsx:29 (zIndex 10000), C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:123,133 (드로어 9990/9991)
   - 문제: 토스트(z 999)는 BP 확인 시트(z 10000), 드로어 오버레이(z 9990/9991), 가챠 오버레이(z 9000)보다 낮아, 모달/시트가 열린 상태에서 발생하는 성공·에러 토스트가 오버레이 뒤에 깔려 보이지 않음. 특히 BP 차감/구매 흐름 중 에러 안내가 가려지면 사용자는 결제성 액션의 결과를 알 수 없어 중복 탭이나 이탈로 이어짐.
   - 제안: theme.css의 .toast z-index를 10010 이상으로 상향(토스트는 항상 최상위가 표준 패턴). 위치(bottom:84px+safe-area)는 유지해도 됨.

5. **[P2/S] 드로어 bottom 매직넘버 57px — 내비 실제 높이와 어긋나 틈/겹침 발생**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:130 (bottom: calc(57px + max(env(safe-area-inset-bottom),16px))), C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:300-322 (nav 실제 높이: padding 10+8 + icon 20 + gap 3 + 라벨 var(--xs) + border 1px), C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:40-42 ([data-font=large] --xs 13px)
   - 문제: 드로어는 내비 위에 bottom: calc(57px + safe-bottom)으로 띄우는데, 내비 콘텐츠 높이는 padding(10+8)+icon(20)+gap(3)+라벨(--xs, 기본 11px→약 13px)+border(1px) ≈ 55px로 57px와 불일치 → 기본 모드에서 드로어와 내비 사이 ~2px 틈으로 뒤 페이지가 노출. 큰글씨 모드에서는 --xs가 13px로 커져 내비가 ~58px가 되어 반대로 드로어 하단을 덮음. 라벨 줄바꿈·폰트 로딩 상태에 따라 어긋남이 더 커질 수 있는 취약한 구조.
   - 제안: nav 요소를 ref로 측정해 드로어 bottom에 반영하거나, 드로어와 nav를 같은 컨테이너로 묶어 flex로 쌓기. 최소한 nav 높이를 CSS 변수(--nav-h)로 한 곳에서 정의해 양쪽이 공유하도록 변경.

6. **[P2/S] viewport maximum-scale=1.0 + user-scalable=no — 확대 전면 차단 (WCAG 1.4.4)**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\index.html:8, C:\Users\rkdqu\Desktop\saju-main\src\index.css:3 (input 16px 규칙 자체는 양호), C:\Users\rkdqu\Desktop\saju-main\src\components\SajuCalendar.jsx:601,879 (inp를 인라인 fontSize var(--sm)=13px로 우회)
   - 문제: viewport 메타에 maximum-scale=1.0, user-scalable=no가 있어 Android Chrome 등에서 핀치 줌이 차단됨(iOS는 핀치는 무시하나 표준 위반은 동일). 운세 앱 특성상 고연령 사용자 비중이 높은데 확대 불가는 직접적 차별 요인. 또한 PM이 확인 요청한 input 16px 규칙은 SajuCalendar.jsx 2곳에서 인라인 fontSize 13px(var(--sm))로 우회되고 있어, maximum-scale을 제거하는 순간 이 입력 필드들이 iOS 포커스 자동 줌을 유발하게 됨(현재는 maximum-scale이 우연히 막아주는 상태).
   - 제안: viewport에서 maximum-scale/user-scalable 제거. 동시에 SajuCalendar 두 입력 필드의 인라인 fontSize를 16px(또는 제거해 전역 규칙 적용)로 수정해 자동 줌 부작용 방지.

7. **[P2/L] 9~11px 하드코딩 폰트 48개 파일 — 큰글씨 모드가 핵심 UI에서 무력화**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:40-42 ([data-font=large] 토큰), C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:172 (드로어 설명 11px), C:\Users\rkdqu\Desktop\saju-main\src\components\GachaPage.jsx:160,164,172,201 (등급 라벨·해설 11px), C:\Users\rkdqu\Desktop\saju-main\src\components\BPConfirmModal.jsx:98 (차감액 11px)
   - 문제: 큰글씨 모드는 theme.css의 --xs/--2xs 등 토큰 스케일업으로 동작하는데, grep 결과 fontSize 9~11px 하드코딩이 48개 파일에 산재(CommunityPage 28곳, AnonCompatPage 12곳 등). BP 차감액(BPConfirmModal:98), 가챠 등급·획득 사유(GachaPage), 드로어 메뉴 설명(BottomNav:172) 같은 의사결정·재화 관련 텍스트가 큰글씨 모드를 켜도 9~11px 그대로 남음. 설정에 큰글씨 옵션을 제공하면서 실제로는 동작하지 않는 셈이라 고연령 사용자 신뢰 훼손.
   - 제안: 전수 교체는 장기 과제로 두되, 우선순위로 재화/결제 흐름(BPConfirmModal, ShopPage, GachaPage)과 내비(BottomNav)의 하드코딩 px를 var(--xs)/var(--2xs)로 치환. 이후 ESLint 커스텀 룰이나 grep 기반 CI 체크로 신규 하드코딩 유입 차단.

8. **[P2/S] 태블릿/데스크톱에서 콘텐츠 460px vs 내비 풀폭 vs 드로어 480px 불일치**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:63 (.inner max-width 460px), C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:292-298 (nav left:0 right:0, maxWidth 없음), C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:134 (드로어 maxWidth 480), C:\Users\rkdqu\Desktop\saju-main\src\components\BPConfirmModal.jsx:40 (시트 maxWidth 460)
   - 문제: 콘텐츠는 .inner 460px 중앙 정렬인데 BottomNav는 maxWidth 없이 화면 전체 폭으로 늘어남 → 아이패드(768~1024px)에서 5개 탭이 화면 양 끝까지 퍼져 엄지 이동 거리가 과도하고, 탭을 누르면 그 위로 뜨는 드로어는 maxWidth 480px 중앙 고정이라 누른 탭과 드로어 위치가 시각적으로 분리됨. BP 시트(460px)와 드로어(480px)의 폭 기준도 제각각.
   - 제안: nav에 maxWidth: 480(드로어와 동일 기준), margin '0 auto' 적용해 콘텐츠 칼럼과 정렬. 폭 기준을 460 또는 480 하나로 통일(CSS 변수 --shell-w 권장).

## UI 전문가 ③ — 모션·인터랙션 품질

1. **[P1/M] 페이지 전환: exit 대기(mode="wait") 중 스크롤이 먼저 0으로 점프 + 뒤로가기에도 forward 애니메이션**
   - 파일: src/components/AppRouter.jsx:11-16, src/components/AppRouter.jsx:168-169, src/hooks/useNavigation.js:31
   - 문제: AnimatePresence mode="wait" + PAGE_ANIM(exit 0.28s, enter 0.28s)으로 모든 step 전환이 exit 완료를 기다려 체감 ~0.56s. 더 심각한 것은 useNavigation.js:31의 useEffect가 step 변경 '즉시' window.scrollTo({top:0, behavior:'instant'})를 실행하는데, 이 시점에 화면에는 아직 퇴장 애니메이션 중인 옛 페이지가 있어서 스크롤된 페이지에서 이동하면 옛 페이지가 맨 위로 휙 점프한 뒤 페이드아웃하는 깨진 전환이 매번 보임. 또한 popstate 뒤로가기(useNavigation.js:58-66)도 동일한 y:16→0 forward 애니메이션이라 진행/복귀 방향감이 전혀 없음.
   - 제안: (1) exit를 opacity 단독 0.12s로 줄이거나 mode를 popLayout으로 바꿔 enter를 즉시 시작. (2) scrollTo를 AnimatePresence onExitComplete 콜백으로 이동해 옛 페이지 점프 제거. (3) useAppStore에 직전 step을 기록해 custom prop으로 방향(앞/뒤)을 넘기고 variants에서 y 부호를 반전.

2. **[P1/S] prefers-reduced-motion이 framer-motion에 전혀 적용 안 됨 (useReducedMotion/MotionConfig 0건)**
   - 파일: src/styles/theme.css:51, src/components/AppRouter.jsx:168-169, src/components/BottomNav.jsx:344-359, src/components/PremiumConsultationResult.jsx:43-65
   - 문제: theme.css:51의 reduced-motion 킬스위치는 CSS animation/transition만 0.01ms로 줄임. src 전체 grep 결과 useReducedMotion·MotionConfig 사용이 0건이라 JS 구동 모션 — 매 페이지 전환 motion.div(y 이동), BottomNav nav-pill spring(stiffness 420), PremiumConsultationResult의 staggerChildren 0.1s 연쇄 등장, App.jsx 토스트 모션 — 이 모두 동작 민감(전정기관) 사용자 설정을 무시하고 그대로 재생됨. AnimatedMascot.jsx:11-14만 유일하게 matchMedia를 직접 체크하는 비일관 상태.
   - 제안: App.jsx 루트를 framer-motion <MotionConfig reducedMotion="user">로 감싸면 모든 motion 컴포넌트의 transform/레이아웃 애니메이션이 OS 설정에 따라 자동 비활성화됨(1줄 수준). StarCanvas도 마운트 시 matchMedia('(prefers-reduced-motion: reduce)') 체크해 rAF 루프 대신 정적 1회 드로우로 전환.

3. **[P1/S] 다크 모드(기본)에서 상담 로딩 시작마다 풀스크린 크림색 플래시 — --loading-overlay 토큰 미사용**
   - 파일: src/components/AppRouter.jsx:609-620, src/components/FeatureLoadingScreen.jsx:562-573, src/styles/theme.css:15
   - 문제: featureLoading 풀스크린 오버레이(AppRouter.jsx:612)와 FeatureLoadingScreen fullPage 래퍼(566행) 모두 background가 'rgba(250, 247, 241, 0.97)'로 하드코딩됨 — 라이트 테마 배경색(#FAF7F1)임. 기본 테마가 다크(--bg:#07050A)이므로 운세/타로/꿈해몽 등 AI 분석을 시작할 때마다 어두운 화면 전체가 밝은 크림색으로 번쩍이는 강한 휘도 반전이 발생(야간 사용 시 특히 불쾌). theme.css:15/33에 정확히 이 용도의 --loading-overlay 토큰(다크 rgba(13,11,20,.92) / 라이트 rgba(250,247,241,.94))이 정의돼 있으나 두 곳 모두 사용하지 않음.
   - 제안: 두 곳의 하드코딩 배경을 background: 'var(--loading-overlay)'로 교체. 내부 텍스트는 이미 var(--t1)/var(--t2)를 쓰고 있어 추가 수정 불필요.

4. **[P2/M] StarCanvas 전역 rAF 루프 상시 구동 — 모달/오버레이 아래에서도 매 프레임 풀스크린 리페인트**
   - 파일: src/components/StarCanvas.jsx:23-34, src/App.jsx:346,367,386, src/styles/theme.css:88-94
   - 문제: StarCanvas는 윈도우 전체 크기 캔버스에 90개 별을 requestAnimationFrame마다 clearRect 후 전부 다시 그리는 무한 루프(draw가 마운트~언마운트 내내 60fps 구동). App.jsx에서 3개 분기 모두 최상위에 항상 마운트되므로 가챠 결과 오버레이(z 9000)·BPConfirmModal(z 10000)·featureLoading(z 8500) 등 불투명 오버레이가 화면을 덮고 있을 때도 보이지 않는 배경을 계속 리페인트함. 여기에 landing orb의 orbSpin 14s/22s 무한 회전 2겹(theme.css:89,91)과 FeatureLoadingScreen OrbAnim(47,59행)의 동일 orb가 중첩되는 구간이 있어 저사양 아이폰에서 배터리/발열에 직결. devicePixelRatio 미적용이라 레티나에서 흐릿하기도 함.
   - 제안: (1) 별 깜빡임은 60fps가 필요 없으므로 rAF 내에서 ~24fps로 스로틀(누적 delta 체크). (2) document.visibilitychange는 rAF가 자동 처리하지만, 풀스크린 오버레이 표시 중(featureLoading, 가챠 결과 등 store 상태로 판별 가능)에는 루프 일시정지. (3) prefers-reduced-motion 시 정적 1회 드로우.

5. **[P2/S] 가챠 Sparkles가 렌더 중 Math.random() 호출 — 카드 탭마다 이미 끝난 스파클 전체 재발화 + 10연 시 최대 140개 파티클**
   - 파일: src/components/GachaPage.jsx:24-45, src/components/GachaPage.jsx:186-192, src/components/GachaPage.jsx:311-319
   - 문제: Sparkles(GachaPage.jsx:31,38)는 렌더 본문에서 dist=28+Math.random()*18, duration=0.55+Math.random()*0.45를 생성해 inline animation 문자열에 넣음. 10연 ResultOverlay에서 카드 하나를 탭해 revealed Set이 바뀔 때마다 모든 SmallResultCard가 리렌더되고(메모이제이션 없음), 랜덤값이 바뀐 animation 속성 문자열 때문에 이미 'forwards'로 끝난 다른 카드들의 스파클이 전부 처음부터 다시 재생됨 — 카드 10장을 차례로 깔 때마다 누적된 스파클이 계속 재발화하는 시각적 버그이자 성능 낭비. 등급별 5~14개 × 10장 = 최대 140개 파티클 div가 '모두 공개' 시 동시 생성. 추가로 GachaBanner 배경 파티클 10개(311-319행)와 헤더 이모지(585행)는 floatGently 무한 애니메이션으로 페이지 체류 내내 구동.
   - 제안: Sparkles 내부 랜덤값을 useMemo(() => [...], [grade])로 1회 고정하고 SmallResultCard를 React.memo로 감싸 revealed 변경 시 해당 카드만 리렌더. 파티클 수는 등급 최고치 14→8 수준으로 감축해도 연출 차이 미미.

6. **[P2/S] BottomNav show/hide 히스테리시스 부재 — iOS 모멘텀/러버밴드 스크롤에서 내비 바 떨림**
   - 파일: src/components/BottomNav.jsx:235-254, src/components/BottomNav.jsx:303-304
   - 문제: handleScroll(236-250행)은 방향 판정에 최소 이동량(delta threshold)이 전혀 없음: currentScrollY가 lastScrollY보다 1px만 작아도 setVisible(true), 1px만 커도(>60) setVisible(false). iOS 관성 스크롤 끝의 미세 반동·하단 러버밴드 구간에서 scrollY가 ±수 px씩 진동하면 visible이 연속 토글되어 transform: translateY(0↔100%) 0.3s 전환이 중간에 계속 뒤집히는 떨림(나타나다 말고 사라짐 반복)이 발생. 또한 scrollY < 0(상단 러버밴드 음수값) 처리도 없어 당겨서 새로고침 제스처 중에도 토글될 수 있음.
   - 제안: 직전 방향 전환 기준점 대비 |delta| > 8~12px일 때만 상태 변경하는 히스테리시스 추가, currentScrollY < 0이면 무시. setVisible 호출 자체는 동일값이면 React가 bail-out하므로 핸들러 스로틀보다 임계값 도입이 핵심.

7. **[P2/S] 탭 드로어 열림/닫힘 비대칭 — 열릴 땐 0.22s 슬라이드, 닫힐 땐 애니메이션 없이 즉시 소멸**
   - 파일: src/components/BottomNav.jsx:116-217, src/components/BottomNav.jsx:140, src/components/BottomNav.jsx:282-290
   - 문제: MenuDrawer는 CSS keyframe slideUpDrawer 0.22s(140행)로 올라오지만, 닫기는 setOpenDrawer(null)로 조건부 렌더를 즉시 제거(282행)하므로 퇴장 애니메이션이 0ms — 오버레이와 시트가 한 프레임에 뚝 사라짐. 모든 내비게이션의 시작점인 컴포넌트라 하루에도 수십 번 노출되는 비대칭이며, step 변경 시 자동 닫힘(231-233행)과 스크롤 숨김 시 닫힘(244행)에서도 동일하게 끊김. 메뉴 항목 선택 → 드로어 즉시 소멸 + 페이지 전환 0.56s가 겹쳐 전환 리듬이 어긋남.
   - 제안: framer-motion이 이미 의존성에 있으므로 드로어/오버레이를 <AnimatePresence> + motion.div(y: '100%'↔0, overlay opacity)로 교체해 닫힘에도 0.18~0.22s 퇴장을 부여. createPortal 내부에서도 AnimatePresence는 정상 동작.

8. **[P1/S] 토스트(z 999)가 BP 확인 모달(z 10000)·드로어 오버레이(z 9990)·가챠 결과(z 9000)에 가려져 피드백 유실**
   - 파일: src/styles/theme.css:54, src/components/BPConfirmModal.jsx:29, src/components/BottomNav.jsx:123, src/components/GachaPage.jsx:115
   - 문제: .toast가 z-index 999(theme.css:54)인데 BPConfirmModal 오버레이는 zIndex 10000(BPConfirmModal.jsx:29), BottomNav 드로어 오버레이 9990(BottomNav.jsx:123), 가챠 ResultOverlay 9000(GachaPage.jsx:115), BottomNav 자체도 9999. BP 차감 확인·뽑기 등 재화 흐름 도중 showToast로 띄우는 에러('BP가 부족해요')/성공 피드백이 이들 오버레이 '뒤'에 렌더되어 사용자에게 전혀 보이지 않음 — 버튼을 눌렀는데 아무 반응이 없는 것으로 인지되어 수익모델 핵심 동선에서 중복 탭/이탈을 유발. App.jsx의 토스트는 motion으로 잘 만들어져 있으나(402-417행) 레이어만 잘못됨.
   - 제안: .toast z-index를 10500 등 모든 모달(최대 10000)보다 높게 올리는 1줄 수정. 토스트는 pointer-events 없는 비차단 요소라 최상위에 둬도 부작용 없음.

## AX 전문가 ① — 시맨틱·스크린리더

1. **[P0/M] BP 차감 확인 바텀시트(BPConfirmModal)가 스크린리더에 보이지 않음 — 결제 확인 흐름 접근 불가**
   - 파일: src/components/BPConfirmModal.jsx:25-152, src/components/AppModals.jsx:97
   - 문제: BPConfirmModal은 createPortal로 body 끝에 붙는 단순 div로, role="dialog"/aria-modal 없음, 열릴 때 focus() 이동 없음, Escape 처리 없음, 닫힐 때 트리거 복원 없음(파일 내 focus 호출 0건, useModalState.js Escape 핸들러 36-48행에도 bpConfirmState 미포함). 배경 콘텐츠에 inert/aria-hidden 처리도 없어 VoiceOver 사용자는 BP 차감 다이얼로그가 열린 사실 자체를 인지하지 못하고 포커스는 뒤 페이지에 남는다. 추가로 65행 아이콘 div와 144행 확인 버튼 첫 span이 빈 콘텐츠라 '취소/확인' 맥락 정보도 부족. 핵심 수익 흐름(상담 시작 전 BP 차감 동의)이 스크린리더로 완료 불가능.
   - 제안: 오버레이 div에 role="dialog" aria-modal="true" aria-labelledby(68행 타이틀에 id 부여) 추가. open 시 useEffect로 취소 버튼에 focus() 이동, 닫힐 때 이전 activeElement 복원, Escape에서 resolveBPConfirm(false). 같은 패턴을 GuardianLevelUpModal(동일하게 role 없음, GuardianLevelUpModal.jsx:46-57)에도 적용. ProfileModal.jsx:89-102에 이미 포커스 트랩 구현이 있으므로 이를 훅으로 추출해 재사용.

2. **[P1/S] 뒤로가기/홈/메뉴 버튼 aria-label이 전부 영어 — 한국어 VoiceOver가 모든 페이지에서 영어로 읽음**
   - 파일: src/App.jsx:481-486, src/App.jsx:437
   - 문제: 전 페이지 공통 내비게이션 버튼 5종의 aria-label이 'go back'(481,485행), 'back to result'(482행), 'back home'(483,484행), 'go home'(486행), 'menu'(437행)로 영어 하드코딩. 한국어 콘텐츠 한복판에서 한국어 음성으로 'go back 버튼'을 읽어주거나 영어 발음 엔진으로 전환돼 어색하게 읽힌다. 앱에서 가장 자주 누르는 컨트롤이라 스크린리더 사용자가 매 화면 전환마다 겪는 문제.
   - 제안: '뒤로 가기', '결과로 돌아가기', '홈으로 가기', '메뉴 열기' 등 한국어로 교체. index.html lang 속성과 일치시키면 음성 엔진 전환도 사라짐. 6곳 문자열 교체로 끝나는 작업.

3. **[P1/M] BottomNav 탭·드로어에 상태 시맨틱 전무 — 주 내비게이션이 스크린리더에 무반응**
   - 파일: src/components/BottomNav.jsx:310-314, src/components/BottomNav.jsx:116-217
   - 문제: 하단 5탭 버튼(310-314행)은 aria-label={tab.label}만 있고 aria-expanded(드로어 열림)·aria-current(활성 탭) 없음 — 활성 상태가 opacity 0.45와 금색만으로 표현된다. 탭을 누르면 MenuDrawer가 createPortal로 body 끝에 열리지만(116-217행) role/aria-modal 없음, 포커스 이동 없음, Escape 없음, 오버레이 div(118-126행)는 클릭 전용이라 키보드로 닫을 수 없음. 스크린리더 사용자는 '상담' 탭을 눌러도 아무 일도 안 일어난 것으로 인지하고, 13개 상담 메뉴에 도달하려면 페이지 전체를 끝까지 스와이프해야 한다. App.jsx:437 메뉴 버튼은 aria-expanded가 이미 있어 같은 코드베이스 내 패턴 불일치.
   - 제안: 탭 버튼에 aria-expanded={openDrawer === tab.id}와 aria-current={activeId === tab.id ? 'page' : undefined} 추가. MenuDrawer 컨테이너에 role="dialog" aria-modal aria-label={group.label + ' 메뉴'}, 열릴 때 첫 메뉴 버튼으로 focus(), Escape로 onClose, 닫힐 때 트리거 탭으로 포커스 복원.

4. **[P1/L] heading 태그 부재 — 100+ 컴포넌트 중 h1~h3가 15개 파일뿐, 제목은 전부 fontWeight 700 div**
   - 파일: src/components/OnboardingCards.jsx:44-54, src/components/OnboardingCards.jsx:106-112, src/components/BPConfirmModal.jsx:68-70, src/components/FeatureLoadingScreen.jsx:23-25, src/components/UpgradeModal.jsx:9
   - 문제: grep 결과 h1~h3는 전체 src에서 16곳/15파일뿐(LandingPage, GachaPage 등 각 1개)이고, 핵심 페이지 대부분(OnboardingCards 44행 '당신의 별숨을 읽어드릴게요', BPConfirmModal 68행, FeatureLoadingScreen 23행, UpgradeModal 타이틀 등)이 스타일된 div로 제목을 표현한다. VoiceOver 로터/TalkBack 제목 탐색이 빈 목록을 반환해, 긴 운세 결과 페이지에서 섹션 간 빠른 이동이 불가능하고 매번 전체를 순차 청취해야 한다. step 상태머신 SPA라 페이지 전환 시 URL·문서 제목 변화도 없어 heading이 유일한 구조 단서인데 그것마저 없는 상태.
   - 제안: 각 페이지 최상위 제목 div를 h1으로, 섹션 제목을 h2로 교체(기존 인라인 style 유지하고 margin 리셋만 추가하면 시각 변화 없음). 우선순위: 결과 페이지(ResultsStep/ComprehensivePage), 온보딩, 모달 타이틀. 병행으로 step 전환 시 document.title 갱신 권장.

5. **[P1/M] AI 상담 결과·채팅 응답에 aria-live 부재 — 로딩 후 결과 도착을 스크린리더가 인지 못함**
   - 파일: src/pages/ChatStep.jsx, src/components/AccItem.jsx:90-102, src/components/FeatureLoadingScreen.jsx:9-33
   - 문제: aria-live 영역은 전체 코드베이스에 3곳뿐(App.jsx:406 토스트, AppRouter.jsx:225 질문 생성 로딩, Sidebar.jsx:402). ChatStep.jsx에는 aria-live/role="log"가 0건이라 별숨 AI 답변(ChatBubble, AccItem.jsx:90-102)이 스트리밍 도착해도 아무 알림이 없다. FeatureLoadingScreen(BP 차감 후 수 초간 보이는 풀스크린 로딩)도 role="status" 없음 — BP를 지불한 스크린리더 사용자는 로딩이 시작됐는지, 결과가 도착했는지 알 수 없어 무음 상태로 방치되고, 결제 후 무반응으로 오인해 이탈할 수 있다.
   - 제안: ChatStep 메시지 목록 컨테이너에 role="log" aria-live="polite" 적용(스트리밍 중간 단어가 아닌 완료된 버블 단위로 DOM 추가되도록 유지). FeatureLoadingScreen의 Wrap에 role="status" aria-live="polite" 추가, 결과 페이지 진입 시 결과 컨테이너로 focus 이동 또는 '결과가 도착했어요' 상태 메시지 출력.

6. **[P2/M] 가챠 결과 카드가 클릭 전용 div — 유료 뽑기 결과를 키보드·스크린리더로 공개 불가**
   - 파일: src/components/GachaPage.jsx:48-64, src/components/GachaPage.jsx:120-235
   - 문제: 10연 뽑기 결과의 SmallResultCard(48-64행)가 onClick만 있는 div라 tab 포커스 불가, Enter/Space 무반응 — BP를 지불하고 뽑은 카드를 스크린리더·키보드 사용자는 한 장도 공개할 수 없다('모두 공개' 버튼이 유일한 우회로지만 그 존재를 알 방법이 없음). ResultOverlay 자체도 createPortal div로 role="dialog" 없고, 카드 공개 결과(등급 cfg.label, 아이템명)가 aria-live 없이 시각으로만 갱신된다.
   - 제안: SmallResultCard를 button으로 변경(aria-label="카드 공개" / 공개 후 aria-label에 등급+이름 포함, disabled={revealed}). ResultOverlay에 role="dialog" aria-modal aria-label="뽑기 결과" 추가하고 열릴 때 focus 이동. 공개 결과를 알리는 polite live region 1개 추가.

7. **[P2/S] UpgradeModal 패키지 선택이 클릭 전용 div — 업셀 결제 선택을 키보드·SR로 조작 불가**
   - 파일: src/components/UpgradeModal.jsx:13-20, src/components/UpgradeModal.jsx:6-9
   - 문제: 이용권 패키지 카드(13행)가 onClick={() => setPkg(p.id)}만 있는 div — 포커스 불가, 선택 상태가 className 'chosen'(시각)으로만 표현되고 aria-checked/aria-pressed 없음. 스크린리더 사용자는 어떤 패키지가 선택됐는지 알 수 없고 변경도 불가능한 채 '이 이용권으로 계속 대화하기'를 누르게 된다. 모달에 role="dialog"는 있으나(6행) aria-labelledby가 없어 열릴 때 무엇인지 안내되지 않고, 8행에 빈 장식 div가 있다.
   - 제안: 패키지 컨테이너에 role="radiogroup" aria-label="이용권 선택", 각 카드를 role="radio" aria-checked={pkg === p.id} tabIndex 적용한 button으로 교체. 9행 타이틀에 id를 주고 dialog에 aria-labelledby 연결.

8. **[P2/S] skip-link 타깃이 포커스 불가 div + main 랜드마크 부재**
   - 파일: index.html:37, src/components/AppRouter.jsx:167
   - 문제: index.html:37의 skip-link(#main-content)는 살아있으나 타깃인 AppRouter.jsx:167의 <div className="app" id="main-content">가 tabindex="-1" 없는 일반 div라 iOS Safari/VoiceOver에서 링크 활성화 후 포커스가 본문으로 이동하지 않고 다음 Tab이 다시 문서 처음부터 시작한다. 또한 grep 결과 <main>/role="main" 랜드마크가 전체 src에 0건이라 스크린리더 랜드마크 탐색(본문 바로가기 제스처)이 동작하지 않는다.
   - 제안: AppRouter.jsx:167 div를 <main id="main-content" tabIndex={-1}>로 변경(className·style 유지). BottomNav의 <nav>에 aria-label="주요 메뉴"도 함께 부여하면 랜드마크 구분이 완성된다.

## AX 전문가 ② — 입력 접근성·WCAG 대비

1. **[P0/M] BP 차감 확인 모달(BPConfirmModal) — role/포커스 트랩/Escape 전무, 키보드·스크린리더로 핵심 결제 흐름 완료 불가**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\BPConfirmModal.jsx:25-36, C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:116-126
   - 문제: BPConfirmModal은 createPortal 바텀시트인데 role="dialog"/aria-modal 없음, 열릴 때 focus() 이동 없음, Escape 핸들러 없음, 배경 닫기가 div onClick(27행)이라 키보드로 도달 불가. 모달이 떠 있는 동안 배경 콘텐츠에 inert/aria-hidden 처리가 없어 Tab이 배경으로 새어나가고, 스크린리더는 모달 존재 자체를 인지하지 못함. BP 차감 확인은 모든 유료 상담의 관문이므로 보조기기 사용자는 수익 흐름 자체를 완주할 수 없음. BottomNav MenuDrawer 오버레이(118행)도 동일한 div onClick 패턴. 전체 코드베이스에서 role="dialog"는 UpgradeModal/ConsentModal/InviteModal/OtherProfileModal/ShareModal/ProfileModal/PWAInstallBanner 일부에만 있고 포커스 트랩은 0건으로 확인.
   - 제안: BPConfirmModal 시트 div에 role="dialog" aria-modal="true" aria-label="별가루 사용 확인" 추가, 열릴 때 취소 버튼에 ref.focus(), useEffect로 keydown Escape→resolveBPConfirm(false), 닫힐 때 트리거 버튼으로 포커스 복원. 공용 useModalA11y(focus trap+Escape+restore) 훅 하나 만들어 BPConfirmModal·MenuDrawer·AppModals 7종에 순차 적용.

2. **[P1/S] BottomNav 비활성 탭 대비 약 2.3:1 — 주 내비게이션 레이블이 WCAG AA(4.5:1) 절반 수준**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\BottomNav.jsx:327-338, C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:8
   - 문제: 비활성 탭은 color: var(--t3)(#A499C0, --bg1 대비 7.6:1로 양호)에 opacity: 0.45(327행)를 곱함. 합성 결과색은 약 #514B61 on #0D0B14로 실측 대비 2.35:1 — 11px(var(--xs)) 레이블 기준 AA 4.5:1에 한참 미달. 5탭 중 4개가 항상 이 상태라 저시력·야외 햇빛 환경 사용자는 내비게이션 레이블을 거의 읽을 수 없음.
   - 제안: opacity 곱셈을 제거하고 색만으로 상태 구분: 비활성을 color: var(--t3) (7.6:1) 그대로 두고 아이콘만 var(--t4)로, 또는 opacity를 0.8 이상으로 상향(0.8이면 약 5.6:1). framer-motion 인디케이터와 fontWeight 차이만으로도 활성 구분은 충분함.

3. **[P1/M] GachaPage 결과 카드 div onClick — 10연 카드 공개가 키보드로 불가능하고, 전체 공개 전까지 닫기 버튼도 없어 키보드 사용자가 풀스크린 오버레이에 갇힘**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\GachaPage.jsx:48-86, C:\Users\rkdqu\Desktop\saju-main\src\components\GachaPage.jsx:124-129, C:\Users\rkdqu\Desktop\saju-main\src\components\ShopPage.jsx:178-212
   - 문제: SmallResultCard(48-86행)는 div onClick으로 카드 공개를 처리 — tabIndex·role·onKeyDown 없어 Enter/Space 불가. 닫기 버튼은 allRevealed && 조건(124행)으로 전부 공개해야만 렌더되고 Escape 핸들러도 없으므로, 키보드 사용자는 zIndex 9000 풀스크린 오버레이(createPortal)에서 빠져나올 방법이 없음(BP는 이미 차감된 상태). 미공개 카드의 '탭' 유도 텍스트는 9px var(--t4)(81행)로 크기·대비 모두 미달. ShopPage 178-212행에도 동일한 div onClick 공개 카드 패턴 존재.
   - 제안: SmallResultCard를 <button>으로 교체(aria-label="카드 공개", revealed 시 disabled+aria-label에 결과명), ResultOverlay에 Escape→'전체 공개 후 닫기' 처리와 '모두 공개' 버튼을 처음부터 노출, '탭' 텍스트 최소 11px·var(--t3) 이상으로 상향.

4. **[P1/S] OnboardingCards 진행 점 6×6px 버튼 + '건너뛰기' 세로 히트영역 약 20px — 터치 타깃 최소 기준(24px, 모바일 권장 44px) 미달**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\OnboardingCards.jsx:282-299, C:\Users\rkdqu\Desktop\saju-main\src\components\OnboardingCards.jsx:301-314
   - 문제: 온보딩 진행 점이 width 6 / height 6, padding 0인 <button>(287-297행) — WCAG 2.5.8(24×24) 및 iOS HIG(44pt)에 크게 미달해 모바일 주 타깃 사용자가 사실상 누를 수 없음. 바로 옆 '건너뛰기'는 padding '4px 0'(310행)으로 세로 히트영역 약 20px에 가로 패딩 0 — 첫 사용 온보딩에서 오탭하면 의도치 않게 온보딩이 종료(onFinish)되어 기능 소개를 통째로 놓침. aria-label은 있으나(286행) 시각적 6px 점에 닿는 것 자체가 문제.
   - 제안: 점 버튼을 width/height 24~44 투명 히트영역으로 감싸고 내부에 6px 시각 점만 렌더(padding: 12 + 내부 span 6px). '건너뛰기'는 padding '12px 16px'로 확대. 같은 패턴인 theme.css .dot(74-75행, 4px)은 비인터랙티브라 무관하나 SajuCalendar 일정 dot 등 클릭형 소형 요소 전수 시 동일 규칙 적용.

5. **[P1/L] 색 토큰 자체가 AA 미달: 다크 --t4 4.38:1(bg2 위 3.97:1), 라이트 --gold 3.54:1·--t4 3.57:1 — 이 색을 9~11px 텍스트 206곳에 사용**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:8, C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:26-29, C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:193, C:\Users\rkdqu\Desktop\saju-main\src\components\GachaPage.jsx:71-81
   - 문제: 실측: 다크 --t4 #7A6E9B on --bg #07050A = 4.38:1(AA 4.5 미달), on --bg2 #151221 = 3.97:1. 라이트 --gold #B07820 on #FAF7F1 = 3.54:1, 라이트 --t4 #8A7D9E = 3.57:1 — 모두 일반 텍스트 AA 미달(큰 텍스트 3:1만 통과). 문제는 이 색들이 큰 텍스트가 아니라 가장 작은 텍스트에 쓰인다는 점: fontSize 9~11px 하드코딩이 40개+ 파일 206곳(grep 실측)이며 .ppc-sub(theme.css:193) 10px+--t4, .fg-desc(403행) 10px+--t4, GachaPage 등급 라벨 9px, OnboardingCards 0.65rem+--t4(250행) 등. 라이트 모드에서 가격·강조에 쓰는 --gold 텍스트(.daily-label, .a-chip, BP 표시)도 전부 미달. 큰글씨 모드([data-font="large"])도 하드코딩 px는 전혀 키우지 못함.
   - 제안: 토큰 보정: 다크 --t4를 #8E82B0 수준으로(≥4.5:1), 라이트 --gold 텍스트 용도는 --gold2 #8A5E14(≥6:1)로 분리(--gold-text 토큰 신설). 하드코딩 9~10px은 최소 11px(var(--2xs))로 일괄 치환해 큰글씨 모드 연동까지 회복 — 코드모드/정규식 일괄 치환 가능.

6. **[P1/S] ProfileStep 프로필 선택 카드 div onClick — 온보딩 첫 화면부터 키보드 선택 불가, 전체 플로우 키보드 완주 불가의 시작점**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\pages\ProfileStep.jsx:52, C:\Users\rkdqu\Desktop\saju-main\src\pages\ProfileStep.jsx:79-92
   - 문제: profile-pick-card(52행 본인, 79행 타인 프로필)가 div onClick으로 활성 프로필을 전환 — tabIndex/role/키 핸들러 없어 키보드로는 분석 대상을 선택할 수 없음. 내부 수정/삭제 <button>은 Tab으로 닿지만 정작 카드 선택은 불가하여 '누구의 별숨을 볼까요' 단계가 마우스/터치 전용. 키보드 플로우 전수 추적 결과: ProfileStep 입력 폼(label/fieldset/aria-pressed는 잘 되어 있음, 117-202행) → 카드 선택(불가) → QuestionStep → BPConfirmModal(포커스 이동 없음, 발견 1) → GachaPage(불가, 발견 3)로 이어져 핵심 여정 어디서든 한 번은 막힘.
   - 제안: profile-pick-card를 <button> 또는 role="radio"+radiogroup으로 전환(aria-checked=활성 여부), 내부 수정/삭제 버튼은 이미 stopPropagation 처리되어 있어 구조 변경 부담 적음. ByeolsoomLetterPage:79처럼 tabIndex+onKeyDown 최소 패치도 가능.

7. **[P2/S] 토스트 z-index 999 — 모달 오버레이(9990~10000) 아래에 깔려 모달 위에서 뜨는 오류/안내 메시지가 보이지 않음**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:54, C:\Users\rkdqu\Desktop\saju-main\src\components\BPConfirmModal.jsx:29, C:\Users\rkdqu\Desktop\saju-main\src\App.jsx:402-417
   - 문제: .toast가 z-index 999(theme.css:54)인데 BPConfirmModal 오버레이는 zIndex 10000(rgba(0,0,0,0.72)), BottomNav 드로어 9990, 하단 내비 9999. 모달/드로어가 열린 상태에서 showToast가 호출되면 토스트가 어두운 오버레이 뒤에 깔려 시각적으로 묻힘 — BP 부족·저장 실패 같은 상태 피드백이 정확히 모달 컨텍스트에서 발생하는데 사용자는 못 봄. role="alert"(App.jsx:406)라 스크린리더에는 읽히지만 시각 사용자에게는 무피드백.
   - 제안: theme.css .toast의 z-index를 10010으로 상향(모달 위 최상단 레이어로 고정). 토스트는 비차단 요소라 항상 최상위여도 부작용 없음.

8. **[P2/S] 인라인 outline:'none' 11곳이 theme.css :focus-visible 아웃라인을 무력화 — 입력 필드에서 키보드 포커스 표시 소실 (WCAG 2.4.7)**
   - 파일: C:\Users\rkdqu\Desktop\saju-main\src\components\CommunityPage.jsx:149, C:\Users\rkdqu\Desktop\saju-main\src\components\AnonCompatPage.jsx:100, C:\Users\rkdqu\Desktop\saju-main\src\components\SajuCalendar.jsx:596, C:\Users\rkdqu\Desktop\saju-main\src\components\DiaryPage.jsx:506, C:\Users\rkdqu\Desktop\saju-main\src\styles\theme.css:49-50
   - 문제: theme.css 50행이 input/textarea :focus-visible에 gold 아웃라인을 정의했지만, 인라인 style의 outline: 'none'은 specificity상 항상 이를 덮음. grep 실측으로 컴포넌트 인라인 11곳 확인: CommunityPage 4곳(149/512/744/1127), AnonCompatPage 2곳(100/361), DeepInterviewPage:104, DiaryPage:506, SajuCalendar:596, TaegillPage 2곳(201/214). 이들 대부분 border 색 변화 같은 대체 포커스 표시도 없어 커뮤니티 글쓰기·일기·달력 일정 입력에서 키보드 포커스 위치가 완전히 사라짐. theme.css 712행 .zs-card:focus{outline:none}도 동일(이건 :focus-visible로 한정하면 해소).
   - 제안: 인라인 outline:'none' 11곳 제거(theme.css의 :focus-visible 규칙이 자연 적용되도록). 포커스 시 border 색 변화를 의도한 곳은 onFocus/onBlur로 borderColor만 바꾸고 outline은 건드리지 않기. .zs-card는 :focus → :focus-visible로 셀렉터만 교체.

## AX 전문가 ③ — 인지 접근성·가독성

1. **[P1/M] '나의 별숨'이 앱 내 두 곳에서 서로 다른 기능을 가리킴 — 브랜드 신조어 13개로 기능 식별 불가**
   - 파일: src/components/BottomNav.jsx:15-84, src/components/SettingsPage.jsx:828-833, src/components/OnboardingCards.jsx:10-35
   - 문제: BottomNav 메뉴 라벨에 '별숨' 파생어가 13개('오늘 하루 나의 별숨'=TODAY_DETAIL, '나의 하루를 별숨에게'=DIARY, '별숨 달력', '별숨에게 물어보기', '별숨의 예언', '별숨 타로', '별숨성장 대시보드', '별숨 도감', '나의 별숨'=NATAL, '별숨 통계', '별숨샵', '별숨 광장', '우리 모임 별숨', '별숨 편지'). 치명적인 것은 동음이의: BottomNav.jsx:58에서 '나의 별숨'은 사주원국(NATAL) 페이지인데, SettingsPage.jsx:831 메뉴설정에서는 '나의 별숨'이 '대운 흐름, 별숨 통계, 별숨 광장' 그룹명으로 쓰임. 또 온보딩 카드(OnboardingCards.jsx)는 '매일 별숨'·'월간 별숨 리포트'·'사이 별점'·'별숨 일기'라는 제3의 명칭을 쓰는데, 실제 메뉴에는 '사이 별점'이라는 항목이 없어(메뉴명은 '궁합') 온보딩에서 배운 이름으로 기능을 찾을 수 없음.
   - 제안: 명명 규칙 1개로 통일: 기능명은 일반 명사(운세/일기/사주원국/도감/상점)를 주 라벨로, '별숨'은 브랜드 접두사로만 제한. 최소한 (1) '나의 별숨'(NATAL)을 '나의 사주원국'으로, '오늘 하루 나의 별숨'을 '오늘의 운세'로 변경해 동음이의 해소, (2) 온보딩 카드 기능명을 실제 메뉴 라벨과 1:1 일치시킬 것. BottomNav.jsx MENU_GROUPS, SettingsPage 메뉴설정, OnboardingCards FEATURES_* 세 곳의 라벨을 단일 상수로 추출하면 재발 방지 가능.

2. **[P1/S] 재화 명칭 3종 혼용(BP/별 포인트/별숨 포인트) + 온보딩·차감 모달 어디에도 BP 개념 설명 없음**
   - 파일: src/components/BPConfirmModal.jsx:73-105, src/hooks/useGamification.js:716, src/components/BPDisplay.jsx:49, src/components/ShieldBlockModal.jsx:193, src/components/YearlyReportPage.jsx:249, src/components/GrowthDashboardPage.jsx:501-516
   - 문제: 동일 재화가 화면마다 다르게 불림: BPConfirmModal은 'BP'만('질문 N개 · N BP 사용', '현재 BP/사용 후 BP'), useGamification.js:716 부족 토스트는 '별 포인트가 부족해요', BPDisplay.jsx:49는 '별숨 포인트', YearlyReportPage.jsx:249는 '별 포인트가 부족해요 (NBP 필요)'로 한 문장 안에 두 명칭 혼용, ShieldBlockModal.jsx:193만 유일하게 '별숨 포인트(BP)'로 병기. 온보딩 3장(OnboardingCards.jsx 전체 확인)에는 포인트 개념이 전혀 등장하지 않아, 신규 사용자가 첫 상담에서 BPConfirmModal을 만났을 때 'BP'가 무엇인지, '별 포인트 부족' 토스트와 같은 것인지 알 방법이 없음. 재화 이해 실패는 첫 결제 흐름(상담→BP차감→충전 유도) 이탈로 직결됨.
   - 제안: 정식 명칭을 '별숨 포인트(BP)'로 확정하고 첫 노출 화면(BPConfirmModal 상단, 온보딩 마지막 카드)에 1줄 설명 추가('상담에 쓰는 포인트예요. 미션·일기로 모을 수 있어요'). 토스트 문구('별 포인트')를 포함해 명칭을 상수(예: CURRENCY_NAME)로 추출해 통일. 이후 화면에서는 'BP' 약칭 일관 사용.

3. **[P1/L] 큰글씨 모드가 하드코딩 9~11px 241곳(44개 파일)에 전혀 적용되지 않음 — 가챠 가격·미션 보상 등 핵심 정보가 그대로 9~11px**
   - 파일: src/styles/theme.css:39-42, src/components/SettingsPage.jsx:736-765, src/components/GachaPage.jsx:349,379-380,326,440, src/components/MissionDashboard.jsx:84,107,200-203, src/components/ShopPage.jsx, src/components/CommunityPage.jsx
   - 문제: [data-font="large"](theme.css:39-42)는 --xl~--2xs 토큰 6개만 키우는데, grep 결과 fontSize 9~11px 하드코딩이 44개 파일 241곳에 존재(CommunityPage 28곳, GachaPage 23곳, ShopPage 20곳, GrowthDashboardPage 19곳). 큰글씨 모드를 켜도 가챠 가격 '10 BP'/'90 BP'(GachaPage.jsx:349,379 — 11px), 10연 보너스 라벨(:380 — 10px), 등급 확률 statsLine(:326 — 11px), 미션 BP 보상(MissionDashboard.jsx:84 — 11px), 보너스 안내(:200 — 11px)가 전혀 커지지 않음. 큰글씨 모드를 켜는 사용자(저시력·고령)에게 정작 돈이 오가는 정보가 가장 작은 글씨로 남는 구조이며, 설정 토글의 약속('글씨가 조금 더 크게 보이도록')과 실제 동작이 불일치함.
   - 제안: 1단계(S): BP 가격·보상·확률 등 의사결정 정보부터 토큰(--xs 이상)으로 교체 — GachaPage·ShopPage·MissionDashboard·BPConfirmModal 우선. 2단계(L): ESLint 커스텀 룰 또는 grep 기반 CI 체크로 인라인 px fontSize 신규 유입 차단 후 나머지 241곳을 토큰으로 점진 치환. 9px·10px은 큰글씨 모드와 무관하게 모바일 최소 가독 기준(12px) 미달이므로 치환 시 --2xs(10px→large 12px) 미만은 금지.

4. **[P1/S] 다크 테마에서 로딩 화면 문구가 보이지 않음 — FeatureLoadingScreen 배경이 라이트 크림색 하드코딩**
   - 파일: src/components/FeatureLoadingScreen.jsx:566,23-29, src/styles/theme.css:15,33,8
   - 문제: FeatureLoadingScreen 풀스크린 오버레이 배경이 rgba(250,247,241,0.97)(라이트 크림)로 하드코딩돼 있는데(:566), 제목/부제 텍스트는 var(--t1)/var(--t2)를 사용(:23-27). 다크 테마에서는 --t1=#F8F6FF(거의 흰색)이므로 크림색 배경 위 흰 글자가 되어 대비비 약 1.0:1 — '오늘의 기운을 읽고 있어요' 등 13종 로딩 문구가 사실상 보이지 않음. 모든 상담·운세 기능(흐름 3)이 이 로딩 화면을 거치므로 다크 테마 사용자는 매 상담마다 빈 화면처럼 보이는 수 초를 겪음. theme.css:15에 정확히 이 용도의 --loading-overlay 변수(다크 rgba(13,11,20,.92)/라이트 rgba(250,247,241,.94))가 이미 정의돼 있으나 미사용.
   - 제안: FeatureLoadingScreen.jsx:566의 background를 var(--loading-overlay)로 교체. 한 줄 수정으로 다크/라이트 모두 해결됨. 같은 패턴의 하드코딩 오버레이가 다른 풀스크린 컴포넌트에 있는지 rgba(250, 247 grep으로 일괄 점검 권장.

5. **[P1/S] instantTyping(연출 생략) 설정이 DB·스토어·prop까지 배선됐지만 설정 UI가 존재하지 않는 죽은 설정**
   - 파일: src/components/SettingsPage.jsx:105-106, src/components/AppRouter.jsx:396-397, src/hooks/useWordTyping.js:19, src/components/common/AnimatedText.jsx:45-52, src/hooks/useUserProfile.js:471-485
   - 문제: SettingsPage는 instantTyping/onInstantTypingChange를 prop으로 받지만(:105-106), 파일 전체를 확인한 결과 onInstantTypingChange를 호출하는 토글 UI가 어디에도 없음(환경설정 탭의 카드 5개: 스타일/화면모드/생애단계/큰글씨/푸시/광장공개 — 타이핑 관련 없음). 즉 useWordTyping의 450ms 지연(:19)과 AnimatedText의 문단별 페이드 연출(:52)을 끄는 경로가 DB 컬럼(instant_typing)·스토어·prop 체인까지 완성돼 있는데 사용자가 도달할 수 없음. 결과 텍스트를 빨리 읽고 싶은 사용자(스크린리더 병용자, 재방문 헤비유저)에게 연출 강제이며, 발견 가능성은 0%.
   - 제안: SettingsPage 환경설정 탭에 기존 큰글씨 모드 카드(:736-765)와 동일한 toggle-row 패턴으로 '결과 바로 보기(연출 생략)' 토글 추가하고 onInstantTypingChange 연결. 배선이 모두 돼 있어 UI 한 블록 추가로 완성됨. 아래 reduced-motion 대응과 묶어 prefers-reduced-motion 감지 시 자동 on도 고려.

6. **[P1/M] prefers-reduced-motion이 framer-motion 페이지 전환·StarCanvas에는 무효 — 전정장애 사용자 보호 누락**
   - 파일: src/styles/theme.css:51, src/components/StarCanvas.jsx:11-36, src/components/AppRouter.jsx, src/components/AnimatedMascot.jsx:13, src/components/landing/DailyMiniCard.jsx:113
   - 문제: theme.css:51의 reduced-motion 킬스위치는 CSS 애니메이션/트랜지션만 차단함. framer-motion은 JS로 인라인 스타일을 구동하므로 AnimatePresence mode="wait" 0.28s 페이지 전환(모든 step 변경마다 발생)과 컴포넌트별 motion 연출이 계속 동작하고, 전 화면 배경인 StarCanvas는 requestAnimationFrame 무한 루프(60fps 반짝임)를 reduced-motion 체크 없이 실행(:23-34). src 전체 grep 결과 framer-motion useReducedMotion 사용 0건. 반면 AnimatedMascot.jsx:13과 DailyMiniCard.jsx:113에는 이미 matchMedia('(prefers-reduced-motion: reduce)') 체크 패턴이 구현돼 있어 일관성도 깨져 있음 — 마스코트는 멈추는데 화면 전환과 별 배경은 계속 움직이는 상태.
   - 제안: (1) StarCanvas.jsx: 기존 AnimatedMascot 패턴을 복사해 reduce 시 draw()를 1회만 호출(정적 별 배경 유지, rAF 미시작) — 배터리 절감 부수효과도 있음. (2) AppRouter 페이지 전환 variants에 framer-motion useReducedMotion 훅 적용해 reduce 시 duration 0 처리. (3) 공용 훅 usePrefersReducedMotion 하나로 추출해 GoldenParticles 등 나머지 rAF 컴포넌트(grep 6개 파일)에 순차 적용.

7. **[P2/M] 본문 설명 텍스트가 시스템 전반에서 10~11px — 기본 가독성 기준 미달 (큰글씨 모드 이전의 문제)**
   - 파일: src/components/BottomNav.jsx:172, src/components/OnboardingCards.jsx:201,236,250, src/styles/theme.css:22, src/components/SettingsPage.jsx:553,814
   - 문제: 디자인 토큰 자체가 작음: --xs=0.6875rem(11px), --2xs=0.625rem(10px)인데 이것이 라벨이 아닌 본문 설명에 광범위 사용됨. 확인한 예: BottomNav 드로어 그룹 설명 11px 하드코딩(:172 — '운세, 기록, 달력을 한곳에서 봐요'), OnboardingCards 추가기능 설명·후기 닉네임 0.65rem=10.4px(:201,250 — 첫 사용 흐름의 핵심 안내문), SettingsPage 응답 스타일 옵션 설명 0.6rem=9.6px(:553), 광장 공개 설정 부연 10px(:814). 신규 사용자가 기능을 학습하는 온보딩·드로어 설명이 모바일 권장 최소치(본문 14px, 보조 12px)를 크게 밑돌아 기능 탐색 단계의 인지 부하를 키움.
   - 제안: 역할 기준 재배정: 설명문(desc) 용도는 최소 --sm(13px), 메타정보(닉네임·날짜)만 --xs 허용, --2xs와 인라인 9~10px은 배지/캡션 외 금지. 우선 적용 대상은 첫 사용 동선인 OnboardingCards desc와 BottomNav 드로어 desc 2곳(즉시 수정 가능).

8. **[P2/S] 가챠 구매 의사결정 정보(확률 구성·비활성 사유)가 저대비 + 11px로 식별 곤란**
   - 파일: src/components/GachaPage.jsx:326-328,338,360,164,440
   - 문제: 가챠 배너의 등급 구성 정보 statsLine('일반 N종 · 레어 N종 · 영웅 N종 · 전설 N종')이 11px + rgba(255,255,255,.45)로 하드코딩 다크 배경(#100a0a 계열) 위 대비비 약 4.5:1 경계선(:326). 더 심각한 것은 BP 부족으로 비활성화된 뽑기 버튼 텍스트가 rgba(255,255,255,.25)(:338,:360)로 대비비 약 1.9:1 — WCAG 최소치(4.5:1)의 절반 이하라서 저시력 사용자는 '왜 못 누르는지'(90 BP 필요)를 읽을 수 없음. 결과 카드의 효과 설명도 11px rgba(255,255,255,.72)(:164). 유료 재화를 소비하는 화면에서 비용·확률·차단 사유가 가장 읽기 어려운 상태.
   - 제안: 비활성 버튼은 텍스트 투명도를 낮추는 대신 배경/테두리만 흐리게 하고 텍스트는 rgba(255,255,255,.65) 이상 유지 + '90 BP 필요' 사유를 별도 표기. statsLine과 효과 설명은 .72 이상 + 12px 이상으로 상향. 색상값을 GachaPage 상단 상수로 모아 일괄 조정.
