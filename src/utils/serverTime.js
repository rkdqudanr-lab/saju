// ═══════════════════════════════════════════════════════════
//  🌐 인터넷 시간 동기화 유틸
//  worldtimeapi.org 에서 받은 서버 시각 기준으로 오프셋 보정
// ═══════════════════════════════════════════════════════════
const OFFSET_KEY = 'byeolsoom_time_offset';

// 이전 세션에서 저장된 오프셋 복원 (API 실패 시 재사용)
let _offset = (() => {
  try { return parseInt(localStorage.getItem(OFFSET_KEY) || '0', 10); }
  catch { return 0; }
})();

export function setTimeOffset(offset) {
  _offset = offset;
  try { localStorage.setItem(OFFSET_KEY, String(offset)); } catch {}
}

// 인터넷 시간 기준으로 보정된 현재 시각(시) 반환
export function getServerHour() {
  return (new Date().getHours() + _offset + 24) % 24;
}
