import { getTimeSlot } from './time.js';

// ═══════════════════════════════════════════════════════════
//  📚 히스토리 유틸
// ═══════════════════════════════════════════════════════════

const HIST_KEY = 'byeolsoom_history';
const MAX_HIST = 30;

/**
 * @typedef {{ id: number, date: string, ts: number, slot: string, questions: string[], answers: string[] }} HistoryItem
 */

/**
 * localStorage에서 상담 기록을 불러와요.
 * @returns {HistoryItem[]}
 */
export function loadHistory() {
  try { const h = localStorage.getItem(HIST_KEY); return h ? JSON.parse(h) : []; } catch { return []; }
}

/**
 * 상담 기록을 localStorage에 저장해요 (최대 30개).
 * @param {HistoryItem[]} items
 */
export function saveHistory(items) {
  try { localStorage.setItem(HIST_KEY, JSON.stringify(items.slice(0, MAX_HIST))); } catch {}
}

/**
 * 새로운 상담 기록을 추가해요.
 * @param {string[]} questions
 * @param {string[]} answers
 */
export function addHistory(questions, answers) {
  const items = loadHistory();
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  /** @type {HistoryItem} */
  const newItem = { id: Date.now(), date: dateStr, ts: now.getTime(), slot: getTimeSlot(), questions, answers };
  saveHistory([newItem, ...items]);
}

/**
 * 특정 ID의 상담 기록을 삭제해요.
 * @param {number} id
 */
export function deleteHistory(id) {
  const items = loadHistory().filter(i => i.id !== id);
  saveHistory(items);
}

/**
 * 총 기록 개수를 반환해요.
 * @returns {number}
 */
export function getHistoryCount() {
  return loadHistory().length;
}

/**
 * 전체 기록을 JSON 파일로 다운로드해요.
 */
export function exportHistory() {
  const items = loadHistory();
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
