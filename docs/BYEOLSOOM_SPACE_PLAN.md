# 별숨공간 전환 계획

## 목표

기존 가챠/아이템을 오늘 운세 점수 부스트에서 분리하고, 사용자가 가구와 오브제로 별숨을 꾸미는 수집형 방치 시스템으로 전환한다.

핵심 문장:
`운세를 볼수록 별숨이 채워지고, 가챠로 얻은 오브제와 십이지신 펫으로 나만의 별숨공간을 꾸민다.`

## 1단계 감사 결과

현재 아이템 기능은 다음 흐름에 연결되어 있다.

- `src/utils/gachaItems.js`: 우주/사주 기운 아이템 생성, 등급, boost, aspectKey 정의
- `src/components/GachaPage.jsx`: 가챠 결과를 `user_shop_inventory`에 저장하고 내 아이템으로 이동
- `src/components/ShopPage.jsx`: 숍 내 기운 뽑기와 테마/아바타/이펙트 뽑기
- `src/components/ItemInventoryPage.jsx`: 보유 아이템, 발동, 합성, 도감
- `src/features/inventory/*`: 카드, 상세, 사용, 합성 모달
- `src/pages/TodayDetailPage.jsx`: boostMap 로드, 점수 보정, 아이템 선택, 정화재점
- `src/pages/DailyHoroscopePage.jsx`: 아이템 적용 후 일일 운세 재생성
- `src/features/today/*`: 축별 점수, 추천 아이템, 부스트 UI
- `src/hooks/useConsultation.js`: daily AI 컨텍스트에 발동 아이템 부스트 주입
- `src/pages/LandingPage.jsx`: 오늘 점수와 boostMap 요약 표시
- `src/components/BottomNav.jsx`, `src/components/Sidebar.jsx`, `src/components/GrowthDashboardPage.jsx`: 내 아이템/샵 진입점

전환 원칙:

- 운세 점수는 아이템/오브제로 바꾸지 않는다.
- 가챠 결과는 별숨공간 오브제, 가구, 펫, 배경, 이펙트로 저장한다.
- 기존 인벤토리 테이블은 1차 MVP에서 재사용하되, 화면 용어와 행동을 `발동`에서 `배치`로 바꾼다.
- 기존 boost 필드는 호환용으로 남기되 신규 UI에서는 표시하지 않는다.

## 2단계 MVP 데이터 모델

### Space Object

별숨공간에 배치 가능한 가구/오브제/배경/이펙트.

```js
{
  id: 'gemini_star_desk',
  name: '쌍둥이 별책상',
  series: 'gemini',
  seriesName: '쌍둥이자리 시리즈',
  kind: 'furniture',
  slotType: 'large',
  rarity: 'rare',
  theme: 'zodiac',
  zodiac: 'gemini',
  emoji: '♊',
  description: '두 개의 생각이 나란히 앉는 별빛 책상이에요.',
  production: { stardustPerHour: 2 },
}
```

### Space Series

시리즈 단위 수집과 세트 보상.

```js
{
  id: 'gemini',
  name: '쌍둥이자리 시리즈',
  theme: 'zodiac',
  total: 6,
  bonuses: [
    { count: 2, label: '별말풍선 연출 해금' },
    { count: 4, label: '펫 대화 대사 추가' },
    { count: 6, label: '칭호: 말이 별이 되는 방' },
  ],
}
```

### Zodiac Pet

십이지신 펫. 1차는 보유/배치/설명까지만, 성장과 능력치는 2차로 확장한다.

```js
{
  id: 'rabbit_pet',
  animalKey: 'rabbit',
  name: '묘토끼',
  zodiac: '묘',
  rarity: 'rare',
  emoji: '🐇',
  description: '달빛 사이를 뛰어다니며 출석의 별가루를 모아요.',
  passive: { type: 'login_bonus', label: '출석 보상에 별가루 추가' },
}
```

### Space Layout

1차 MVP는 자유 배치가 아니라 슬롯 배치로 시작한다.

```js
{
  background: null,
  floor: null,
  core: null,
  large1: null,
  large2: null,
  small1: null,
  small2: null,
  small3: null,
  light1: null,
  deco1: null,
  pet: null,
}
```

### Slot Types

- `background`: 배경
- `floor`: 바닥
- `core`: 별숨 코어 주변 중심 오브제
- `large`: 큰 가구
- `small`: 작은 가구
- `light`: 조명
- `deco`: 장식
- `effect`: 공간 이펙트
- `pet`: 십이지신 펫

## 20단계 실행 순서

1. 현재 아이템, 가챠, 오늘운세 연결 지점 감사
2. 별숨공간 MVP 데이터 모델 정의
3. 기존 아이템 부스트 기능 비활성화 범위 확정
4. 오늘 하루 장문 사주/점성술 설명 블록 설계
5. 오늘 상세 화면에 장문 설명 블록 구현
6. 오늘 상세의 아이템 부스트 UI 제거
7. 인벤토리 발동/점수 부스트 동작 제거
8. 가챠 아이템을 오브제/가구 데이터로 전환할 매핑 설계
9. 별숨공간 페이지 라우트와 기본 화면 추가
10. 별숨 코어 UI 구현
11. 오브제 배치 슬롯 MVP 구현
12. 내 오브제 목록과 배치/해제 동작 구현
13. 시리즈/세트 도감 데이터와 UI 구현
14. 십이지신 펫 데이터 정의
15. 펫 보유/배치 UI 구현
16. 별가루 재화 MVP 설계와 로컬/DB 저장 경로 결정
17. 가챠 결과 저장을 오브제/펫 중심으로 조정
18. 기존 내 아이템 메뉴명을 별숨공간/내 오브제로 정리
19. 전체 빌드, 깨짐 문자, 주요 플로우 검증
20. 문서 업데이트와 최종 푸시 준비

## 현재 구현 상태

- 1~18단계 완료.
- `TodayDetailPage.jsx`는 오늘의 사주/점성술 흐름을 장문으로 설명하고, 아이템 점수 부스트/정화재점 UI를 제거했다.
- `CompatPage.jsx`는 AI가 `json` 코드블록이나 앞머리 요약을 붙여도 첫 JSON 객체만 추출해 궁합 결과가 깨지지 않게 처리한다.
- `ByeolsoomSpacePage.jsx`를 신규 추가해 별숨 코어, 별가루, 공간 슬롯, 오브제 배치, 시리즈 수집 현황, 십이지신 펫 선택을 제공한다.
- `zodiacPets.js`와 `ZodiacPetGraphic.jsx`는 12지 펫을 이모지가 아니라 SVG 기반 벡터 그래픽으로 렌더링한다.
- `spaceProgress.js`는 로컬 MVP 별가루 저장소를 제공한다. 기본 120 별가루, 시간당 6개, 최대 8시간 누적 기준이다.
- `GachaPage.jsx`는 뽑기 결과를 운세 발동 아이템이 아니라 별숨공간 오브제 소재로 안내하고, 결과 CTA를 별숨공간으로 연결한다.
- 메인/성장/하단 메뉴의 주요 문구는 별숨공간/오브제 중심으로 전환했다.

## 1차 MVP 시리즈

- 쌍둥이자리 시리즈: 대화, 편지, 거울, 별책상
- 물고기자리 시리즈: 꿈, 물결, 연못, 달빛
- 사자자리 시리즈: 태양, 무대, 왕좌, 스포트라이트
- 목기운 시리즈: 새싹, 대나무, 봄바람, 숲
- 묘토끼 시리즈: 달방석, 토끼굴, 당근 별램프

각 시리즈는 6개 구성으로 시작한다.

## 8단계 매핑 파일

`src/utils/byeolsoomSpaceItems.js`를 신규 추가한다.

- `SPACE_SERIES`: 별숨공간 시리즈 메타데이터
- `SPACE_OBJECTS`: 배치 가능한 가구/오브제 데이터
- `SPACE_SLOT_TYPES`: 배경, 바닥, 큰 가구, 작은 가구, 조명, 장식, 펫 등 슬롯 타입
- `mapLegacyGachaToSpaceObject(item)`: 기존 `gachaItems.js` 아이템을 임시 별숨공간 오브제로 해석하는 호환 헬퍼

1차 매핑은 기존 `aspectKey`를 시리즈로 연결한다.

- `social`, `travel` → 쌍둥이자리 시리즈
- `love`, `health` → 물고기자리 시리즈
- `career`, `overall` → 사자자리 시리즈
- `study`, `wealth` → 목기운 시리즈
- `create` → 묘토끼 시리즈

## 3단계 부스트 비활성화 범위

운세 점수 조작 기능은 다음 순서로 끊는다.

### 즉시 비활성화

- `TodayDetailPage.jsx`
  - `boostMap` 기반 점수 보정 제거
  - 축 카드의 `아이템 +N점`, `부스트 반영`, `아이템 고르기`, `정화재점` UI 제거
  - `AxisItemPickerModal`, `GoldenParticles`, 아이템 적용 핸들러 제거
- `DailyHoroscopePage.jsx`
  - 보유 아이템을 선택해 일일 운세를 재생성하는 흐름 제거
  - `BoostRegenModal`, `BoostItemSheet` 연결 제거
- `DailyStarCardV2.jsx`
  - 카테고리 운세 아래 `아이템 기운이 깃들었어요 (+N점)` 표시 제거
- `useConsultation.js`
  - `opts.boostMap`을 daily 프롬프트 컨텍스트에 넣는 블록 제거
- `LandingPage.jsx`, `DailyMiniCard.jsx`
  - 오늘 카드의 boostCount 배지 제거

### 용어 전환

- `내 아이템` → `별숨공간` 또는 `내 오브제`
- `발동하기` → `배치하기`
- `아이템 보관함` → `오브제 보관함`
- `기운 아이템` → `별숨 오브제`
- `부스트` → 신규 UI에서 사용 금지

### 유지

- `GachaPage.jsx`, `ShopPage.jsx`의 BP 결제/뽑기 구조
- `user_shop_inventory` 저장 구조
- `ItemCollectionPage.jsx`의 도감 기본 구조
- 테마/아바타/effect 장착은 기존 프로필 꾸미기 기능으로 유지

### 나중에 삭제

- `boost`, `aspectKey`, `effectLabel` 필드는 기존 저장 데이터 호환을 위해 바로 삭제하지 않는다.
- 1차 전환 후 `spaceObjects.js`로 신규 데이터가 안정화되면 `gachaItems.js`의 boost 중심 문구를 정리한다.
