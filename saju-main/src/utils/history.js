import { getTimeSlot } from './time.js';

// ═══════════════════════════════════════════════════════════
//  📚 히스토리 유틸 — localStorage 미사용, Supabase 전용
// ═══════════════════════════════════════════════════════════

/**
 * @typedef {{ id: number, date: string, ts: number, slot: string, questions: string[], answers: string[] }} HistoryItem
 */

export function loadHistory() { return []; }
export function saveHistory(_items) {}
export function addHistory(_questions, _answers) {}
export function deleteHistory(_id) {}
export function getHistoryCount() { return 0; }

/**
 * 전체 기록을 JSON 파일로 다운로드해요.
 * @param {HistoryItem[]} items - Supabase에서 불러온 기록
 */
export function exportHistory(items = []) {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `byeolsoom_history_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
