/**
 * 절기별 SVG 아이콘 컴포넌트
 * 12절기 (입춘~소한) 각각의 계절 이미지를 간결한 SVG로 표현
 */

const ICONS = {
  // ── 봄 ──────────────────────────────────────────────────
  입춘: (c) => (
    // 봄 시작 — 꽃봉오리
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 19V12" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M12 12C12 12 9 9.5 9 7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7C15 9.5 12 12 12 12Z" stroke={c} strokeWidth="1.3" fill="none"/>
      <path d="M12 12C12 12 9.5 11 8 9C6.82 7.38 7.38 5.18 9 4.5" stroke={c} strokeWidth="1.1" strokeLinecap="round" fill="none"/>
      <path d="M12 12C12 12 14.5 11 16 9C17.18 7.38 16.62 5.18 15 4.5" stroke={c} strokeWidth="1.1" strokeLinecap="round" fill="none"/>
      <path d="M9 19H15" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  경칩: (c) => (
    // 개구리/움틈 — 물결 위 새싹
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15V10" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M10 12L12 10L14 12" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 10C9.5 10 10.5 7 12 7C13.5 7 14.5 10 14.5 10" stroke={c} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M4 17C5.5 15.5 7 16.5 8.5 15.5C10 14.5 11 16 12 16C13 16 14 14.5 15.5 15.5C17 16.5 18.5 15.5 20 17" stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  청명: (c) => (
    // 맑고 밝음 — 해 + 구름
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="3" stroke={c} strokeWidth="1.3"/>
      <path d="M10 5V4M10 16V15M5 10H4M16 10H15M6.76 6.76L6.05 6.05M13.95 6.05L13.24 6.76" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M13 15H17C18.66 15 20 16.34 20 18C20 19.66 18.66 21 17 21H9C7.34 21 6 19.66 6 18C6 16.5 7.1 15.25 8.5 15.04" stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  // ── 여름 ────────────────────────────────────────────────
  입하: (c) => (
    // 여름 시작 — 강한 태양
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.4"/>
      <path d="M12 4V2M12 22V20M4 12H2M22 12H20M6.34 6.34L4.93 4.93M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  망종: (c) => (
    // 씨 뿌리기 — 이삭
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20V8" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M12 8C12 8 9 5 9 3.5C10 2.5 11.5 3 12 4C12.5 3 14 2.5 15 3.5C15 5 12 8 12 8Z" stroke={c} strokeWidth="1.2" fill="none"/>
      <path d="M12 13C12 13 9.5 11.5 8 12C8 13.5 10 14 12 13Z" stroke={c} strokeWidth="1.2" fill="none"/>
      <path d="M12 13C12 13 14.5 11.5 16 12C16 13.5 14 14 12 13Z" stroke={c} strokeWidth="1.2" fill="none"/>
      <path d="M12 10C12 10 9.5 8.5 8 9C8 10.5 10 11 12 10Z" stroke={c} strokeWidth="1.2" fill="none"/>
      <path d="M12 10C12 10 14.5 8.5 16 9C16 10.5 14 11 12 10Z" stroke={c} strokeWidth="1.2" fill="none"/>
      <path d="M9 20H15" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  소서: (c) => (
    // 작은 더위 — 반태양 + 열기
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V3M7.05 7.05L5.64 5.64M5 12H3M7.05 16.95L5.64 18.36M12 19V21M16.95 16.95L18.36 18.36M19 12H21M16.95 7.05L18.36 5.64" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8Z" stroke={c} strokeWidth="1.3" fill="none"/>
      <path d="M6 20C7.5 18.5 9 19.5 10.5 18.5C12 17.5 13 19 14 18.5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  // ── 가을 ────────────────────────────────────────────────
  입추: (c) => (
    // 가을 시작 — 단풍잎
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20L12 10" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M12 10C12 10 7 9 5 5C9 4 11 7 12 10Z" stroke={c} strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
      <path d="M12 10C12 10 17 9 19 5C15 4 13 7 12 10Z" stroke={c} strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
      <path d="M12 14C12 14 8 14 6 11C9.5 10 11.5 12 12 14Z" stroke={c} strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
      <path d="M12 14C12 14 16 14 18 11C14.5 10 12.5 12 12 14Z" stroke={c} strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
      <path d="M10 20H14" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  백로: (c) => (
    // 흰 이슬 — 이슬방울 + 풀잎
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20C8 17 12 13 12 13C12 13 16 17 16 20C16 22.21 14.21 24 12 24C9.79 24 8 22.21 8 20Z" stroke={c} strokeWidth="1.3" fill="none" transform="scale(0.75) translate(4 0)"/>
      <circle cx="15" cy="7" r="2" stroke={c} strokeWidth="1.2" fill="none"/>
      <circle cx="18" cy="11" r="1.3" stroke={c} strokeWidth="1.1" fill="none"/>
      <path d="M6 20V12C6 12 9 10 12 12C15 10 18 12 18 12V14" stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      <path d="M4 20H20" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  한로: (c) => (
    // 찬 이슬 — 이슬 + 서리
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L12 7M9 5L12 7L15 5" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 10C9 8.34 10.34 7 12 7C13.66 7 15 8.34 15 10C15 12.5 12 15 12 15C12 15 9 12.5 9 10Z" stroke={c} strokeWidth="1.3" fill="none"/>
      <circle cx="7" cy="17" r="1.2" stroke={c} strokeWidth="1.1" fill="none"/>
      <circle cx="12" cy="19" r="1.2" stroke={c} strokeWidth="1.1" fill="none"/>
      <circle cx="17" cy="17" r="1.2" stroke={c} strokeWidth="1.1" fill="none"/>
    </svg>
  ),
  // ── 겨울 ────────────────────────────────────────────────
  입동: (c) => (
    // 겨울 시작 — 눈송이 (작은)
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3V21M3 12H21" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M5.64 5.64L18.36 18.36M18.36 5.64L5.64 18.36" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2" stroke={c} strokeWidth="1.3" fill="none"/>
    </svg>
  ),
  대설: (c) => (
    // 큰 눈 — 눈송이 + 땅
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V14M3 8H21" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M5.64 4.64L18.36 13.36M18.36 4.64L5.64 13.36" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="12" cy="8" r="1.5" stroke={c} strokeWidth="1.2" fill="none"/>
      <path d="M6 17L8 19L6 21M18 17L16 19L18 21M12 17V21" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  소한: (c) => (
    // 작은 추위 — 얼음 결정
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4V20M4 8L20 16M4 16L20 8" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M9 4L12 7L15 4M9 20L12 17L15 20" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 11L7 8M4 13L7 16M20 11L17 8M20 13L17 16" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  ),
};

// 절기명에서 SVG 아이콘 반환. 없으면 기본 마름모.
export default function JeolgiIcon({ name, size = 22, color = 'currentColor' }) {
  const render = ICONS[name];
  if (!render) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 3L21 12L12 21L3 12Z" stroke={color} strokeWidth="1.4" fill="none"/>
      </svg>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color }}>
      {render(color)}
    </span>
  );
}

export { ICONS as JEOLGI_ICONS };
