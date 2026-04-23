const DAILY_TABLES_ENABLED = import.meta.env.VITE_ENABLE_DAILY_RLS_TABLES === 'true';

export function canUseDailySupabaseTables() {
  return DAILY_TABLES_ENABLED;
}

export function getDailyDateKey(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  // toISOString()은 UTC 기준이므로 한국 시간대에서 날짜가 어제로 표시되는 문제가 있음.
  // 로컬 시간 기준 YYYY-MM-DD 반환
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDailyStorageKey(userId, type, date = getDailyDateKey()) {
  if (!userId || !type || !date) return null;
  return `byeolsoom:daily:${String(userId)}:${type}:${date}`;
}

export function readDailyLocalCache(userId, type, date = getDailyDateKey()) {
  if (typeof window === 'undefined') return null;
  const key = buildDailyStorageKey(userId, type, date);
  if (!key) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeDailyLocalCache(userId, type, content, date = getDailyDateKey()) {
  if (typeof window === 'undefined') return;
  const key = buildDailyStorageKey(userId, type, date);
  if (!key) return;

  try {
    window.localStorage.setItem(key, String(content));
  } catch {
    // Ignore storage quota or privacy mode failures.
  }
}

export function removeDailyLocalCache(userId, type, date = getDailyDateKey()) {
  if (typeof window === 'undefined') return;
  const key = buildDailyStorageKey(userId, type, date);
  if (!key) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

export function readDailyLocalCacheMap(userId, type, dates = []) {
  return Object.fromEntries(
    dates.map((date) => [date, readDailyLocalCache(userId, type, date)])
  );
}
