# 일일 코드 리뷰 — 2026-04-09

## 오늘 병합된 커밋 (9개)

| 커밋 | 내용 |
|---|---|
| `b3080fe` | 최근 질문 말풍선에 x 삭제 버튼 추가 (merge) |
| `9cc5b79` | 후속질문 1인칭 형태 프롬프트 수정 (merge) |
| `029f6cc` | main 브랜치 병합 |
| `0c0b7cd` | 별숨 기운 확인 후 미션 목록 자동 갱신 |
| `28f1e63` | 메인 화면에서 특별기능 바로가기 섹션 제거 |
| `38be687` | DO/DONT 미션 + 일기 BP 보상 + 마일스톤 보너스 (merge) |
| `1c9187d` | 운세 프롬프트에서 시적 표현 제거 |
| `e298b02` | 일일 기운 UI 및 프롬프트 직관성 개선 |
| `60a09dc` | 별숨 중복 표시 제거 + 직관적 프롬프트 라우팅 |

---

## 버그 및 개선 필요 사항

### 1. [버그] `completeMission`의 stale closure — `useGamification.js:365`

**심각도: 높음**

```js
// useGamification.js:365
const completedMission = missions.find(m => m.id === missionId);
```

`completeMission`의 `useCallback` 의존성 배열에 `missions`가 누락되어 있습니다:

```js
// 현재 (잘못됨)
[user?.id, earnBP, loadTodayMissions, showToast]

// 수정 필요
[user?.id, earnBP, loadTodayMissions, showToast, missions]
```

미션이 업데이트된 후 `completeMission`이 이전 `missions` 배열을 참조하면, `completedMission`이 `undefined`가 되어 `getMissionBpReward(undefined)` → 항상 10 BP가 반환됩니다. DO/DONT 미션(5 BP)이 잘못된 보상을 지급합니다.

**수정:**
```js
}, [user?.id, earnBP, loadTodayMissions, showToast, missions]);
```

---

### 2. [버그] BP 비원자적 읽기-수정-쓰기 경쟁 조건 — `useGamification.js:153-163`

**심각도: 중간**

```js
// DB에서 현재 BP를 읽은 다음 +amount 해서 다시 씁니다
const { data: currentUser } = await client.from('users').select('current_bp')...
const newBp = (currentUser?.current_bp || 0) + amount;
await client.from('users').update({ current_bp: newBp })...
```

로그인 보상 + 일기 BP처럼 거의 동시에 `earnBP`가 두 번 호출되면 두 번 모두 같은 `current_bp`를 읽고 한 번만 증가시킵니다. Supabase의 원자적 증가 RPC 또는 SQL increment를 사용해야 합니다.

**권장 수정:**
```sql
-- Supabase에서 RPC 함수로 처리
UPDATE users SET current_bp = current_bp + bp_amount WHERE kakao_id = kid;
```

---

### 3. [버그] `handleDeleteRecent`의 State Updater 내 사이드 이펙트 — `QuestionStep.jsx:49-52`

**심각도: 낮음 (React StrictMode에서만 문제)**

```js
setRecentQs(prev => {
  const next = prev.filter(r => r !== q);
  saveAnalysisCache(user.id, 'recent_questions', JSON.stringify(next)); // 사이드 이펙트!
  return next;
});
```

React StrictMode에서 State Updater가 두 번 호출되어 `saveAnalysisCache`가 중복 호출될 수 있습니다. 사이드 이펙트는 updater 밖으로 분리해야 합니다.

**수정:**
```js
const handleDeleteRecent = useCallback((q, e) => {
  e.stopPropagation();
  if (!user?.id) return;
  setRecentQs(prev => {
    const next = prev.filter(r => r !== q);
    return next;
  });
  setRecentQs(next => {
    saveAnalysisCache(user.id, 'recent_questions', JSON.stringify(next));
    return next;
  });
}, [user?.id]);
```

또는 더 깔끔하게:
```js
const handleDeleteRecent = useCallback((q, e) => {
  e.stopPropagation();
  if (!user?.id) return;
  const next = recentQs.filter(r => r !== q);
  setRecentQs(next);
  saveAnalysisCache(user.id, 'recent_questions', JSON.stringify(next));
}, [user?.id, recentQs]);
```

---

### 4. [접근성] 삭제 버튼 터치 타겟 및 aria-label 누락 — `QuestionStep.jsx:122-125`

**심각도: 낮음**

```jsx
<button onClick={(e) => handleDeleteRecent(q, e)}
  style={{ width: 15, height: 15, ... }}>
  ✕
</button>
```

- 터치 타겟 15×15px는 모바일 접근성 기준(44×44px) 미달
- `aria-label`이 없어 스크린 리더가 버튼 의미를 알 수 없음

**수정:**
```jsx
<button
  onClick={(e) => handleDeleteRecent(q, e)}
  aria-label={`"${q}" 삭제`}
  style={{
    position: 'absolute', top: -5, right: -5,
    width: 15, height: 15, borderRadius: '50%',
    background: 'var(--t3)', color: 'var(--bg1)',
    border: 'none', fontSize: 9, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, lineHeight: 1,
    // 터치 타겟 확장 (시각적 크기는 유지)
    touchAction: 'manipulation',
  }}>
  ✕
</button>
```

---

### 5. [데이터 정합성] `total_bp_earned` 덮어쓰기 — `useGamification.js:168-175`

**심각도: 중간**

```js
await client.from('user_gamification').upsert({
  kakao_id: String(user.id),
  total_bp_earned: amount, // ← 누적이 아닌 덮어쓰기!
  ...
}, { onConflict: 'kakao_id' });
```

코드 주석에도 "증분 아님, 이후 트리거로 누적 처리 필요"라고 적혀 있지만 Supabase DB 트리거가 설정되어 있지 않다면 이 값은 항상 마지막 BP 획득량만 저장됩니다.

---

### 6. [코드 품질] `key={i}` 사용 — `QuestionStep.jsx:116`

**심각도: 낮음**

```jsx
{recentQs.map((q, i) => (
  <div key={i} ...>
```

배열 인덱스를 key로 사용하면 삭제 시 React가 잘못된 DOM 재사용을 할 수 있습니다. 질문 텍스트를 key로 사용하세요:

```jsx
{recentQs.map((q) => (
  <div key={q} ...>
```

---

## 잘된 점

- **후속질문 1인칭 수정** (`05a2fa3`): AI가 사용자에게 묻는 형식이 클릭 시 그대로 별숨에게 전달되던 UX 문제를 정확히 짚고 수정.
- **DO/DONT 미션 구조** (`missionGenerator.js`): 최대 5개 제한, 타입별 BP 차등 보상(10/5 BP)이 게임 밸런스를 고려한 설계.
- **일기 BP 중복 방지** (`earnDiaryBP`): `daily_bp_log`에서 `reason='diary'` 조건으로 당일 중복 수령을 서버 측에서 방어.
- **마일스톤 보너스 중복 방지**: `milestone` reason으로 `daily_bp_log` 조회 후 미지급 시에만 지급.

---

## 요약

| 분류 | 건수 |
|---|---|
| 높음 (버그) | 1 |
| 중간 (버그/정합성) | 2 |
| 낮음 (개선) | 3 |

가장 우선 수정이 필요한 것은 **#1 `completeMission` stale closure** — DO/DONT 미션이 잘못된 BP를 지급하고 있을 수 있습니다.
