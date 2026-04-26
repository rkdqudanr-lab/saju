// ═══════════════════════════════════════════════════════════
//  📚 히스토리 유틸 — Supabase 전용
// ═══════════════════════════════════════════════════════════

/**
 * 전체 기록을 JSON 파일로 다운로드해요.
 * @param {{ id: number, date: string, questions: string[], answers: string[] }[]} items
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
