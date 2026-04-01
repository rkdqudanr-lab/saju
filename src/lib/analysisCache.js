import { supabase, getAuthenticatedClient } from "./supabase.js";

// ── Supabase analysis_cache 헬퍼 (공유 유틸) ──

export async function loadAnalysisCache(userId, cacheKey) {
  if (!supabase || !userId) return null;
  try {
    const authClient = getAuthenticatedClient(userId);
    const { data } = await (authClient || supabase)
      .from('analysis_cache').select('content')
      .eq('kakao_id', String(userId)).eq('cache_key', cacheKey).single();
    return data?.content || null;
  } catch { return null; }
}

export async function saveAnalysisCache(userId, cacheKey, content) {
  if (!supabase || !userId) return;
  try {
    const authClient = getAuthenticatedClient(userId);
    await (authClient || supabase).from('analysis_cache').upsert(
      { kakao_id: String(userId), cache_key: cacheKey, content },
      { onConflict: 'kakao_id,cache_key' }
    );
  } catch (e) { console.error('[별숨] analysis_cache 저장 오류:', e); }
}
