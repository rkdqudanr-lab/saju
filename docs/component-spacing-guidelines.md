# Component Spacing Guidelines

## Goal

별숨 화면 전반에서 라벨, 입력창, 카드, 탭 간격이 제각각 붙어 보이지 않도록 기본 간격 규칙을 고정한다.

---

## 1. Page-Level Horizontal Padding

모든 풀페이지 컴포넌트의 좌우 기준선은 **24px**이다.

```jsx
// ✅ 올바른 패턴
<div style={{ padding: '28px 24px 16px' }}>   // 헤더
<div style={{ padding: '0 24px 14px' }}>       // 필터/탭
<div style={{ padding: '0 24px' }}>            // 콘텐츠 리스트
```

**예외**: 포털로 띄우는 모달 backdrop의 `padding: '0 20px'`은 viewport 가장자리 여유 공간이므로 그대로 유지.

---

## 2. Page Header Pattern

```
[eyebrow label]   — font-size: var(--xs), color: var(--gold), fontWeight 700
[Title]           — font-size: var(--lg)~var(--xl), fontWeight 800
[subtitle]        — font-size: var(--xs)~var(--sm), color: var(--t3)
```

- eyebrow ↔ 제목: `marginBottom: 6`
- 제목 ↔ 소제목: `marginTop: 4~6`
- 헤더 블록 ↔ 첫 번째 카드/버튼: `16px` 이상

---

## 3. Core Spacing Scale

| 역할 | 값 |
|------|----|
| 폼 라벨 ↔ 입력창 | 4px |
| 같은 그룹 내 요소 | 8px |
| 서로 다른 입력 그룹 | `var(--sp2)` |
| 카드 내 항목 간 (제목→설명→버튼) | 8 / 12 / 16px |
| 카드 외곽 패딩 | 12px 이상 (`14px` 권장) |
| 탭·필터 칩 하단 여백 | 14px |
| 상태 뱃지·pill ↔ 인접 텍스트 | 8px |

---

## 4. Grid Layout Rules

### 5-Column Compact (아이템 보관함)
```js
gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
gap: 8,
```
- 카드 너비 ~60px → 이모지(30px) + 이름(2줄, 9px) + 등급 뱃지(8px) 만 표시
- 터치 영역: 카드 전체 클릭 → 상세 모달

### 일반 카드 그리드 (리스트/뽑기 결과 등)
```js
gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
gap: 12,
```
PC에서도 찌그러짐 없이 자동 열 조정.

---

## 5. Modal Inner Padding

| 모달 유형 | 내부 패딩 |
|-----------|-----------|
| 일반 모달 (BottomSheet 제외) | `28px 24px` |
| BottomSheet | `28px 20px 40px` (하단 safe-area 포함) |
| 확인/결과 팝업 (작은 카드형) | `32px 24px` |
| 합성/가챠 결과 | `32px 24px` |

---

## 6. BP Badge Placement

- 숍 페이지: 헤더 타이틀 오른쪽에 inline으로 배치 (`justifyContent: 'space-between'`)
- 기타 페이지: 헤더 아래 별도 줄에 작은 pill로 표시 가능
- BP 뱃지 ↔ 인접 텍스트: `gap: 8` 이상

---

## 7. Filter Chip Strip

```jsx
<div style={{
  display: 'flex', gap: 6,
  padding: '0 24px 14px',
  overflowX: 'auto', scrollbarWidth: 'none',
}}>
```
- 칩 내부 패딩: `6~8px 12~14px`
- 선택 상태: `border: 1px solid var(--acc)`, `background: var(--goldf)`
- 미선택: `border: 1px solid var(--line)`, `background: none`

---

## 8. Synthesis Modal Animations

합성 진행 단계별 애니메이션 클래스 (theme.css 정의):

| 단계 | 애니메이션 |
|------|-----------|
| 진행 중 | 이중 ring `synth-spin` + orb `synth-orb-pulse` |
| 성공 | `synth-star-pop` (이모지) + `synth-particle` (파티클 8개) + `synth-success-glow` (카드) |
| 실패 | `synth-shake` 0.55s (카드 전체) |

---

## 9. Typing Effect Timing

`useWordTyping` 훅에 전달하는 속도 (`constants.js`):

| 용도 | 값 | 비고 |
|------|----|------|
| `typingWord` | 22ms | 일반 결과 페이지 |
| `typingChat` | 18ms | 채팅 버블 |
| `typingReport` | 18ms | 리포트 텍스트 |
| `sampleChar` | 22ms | 샘플 타이핑 |

훅 내부에서 `speed > 50`이면 25ms로 캡핑됨. 자연스러운 한글 자소 연출을 위해 18~25ms 범위 사용.

---

## 10. Review Checklist

새 화면이나 대규모 레이아웃 수정 후 확인:

- [ ] 좌우 padding이 24px 기준선에 맞는가 (모달 backdrop 제외)
- [ ] 헤더 eyebrow → 제목 → 소제목 계층이 명확한가
- [ ] 라벨이 바로 위 요소에 붙어 보이지 않는가
- [ ] 카드 안 텍스트와 버튼 사이에 12px 이상 여백이 있는가
- [ ] 필터 칩 하단에 14px 여백이 있는가
- [ ] 5열 그리드에서 카드가 찌그러지지 않는가 (minmax(0, 1fr))
- [ ] 모달 backdrop의 `padding: '0 20px'`은 유지되었는가
