import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[별숨] Supabase 환경변수가 없어요 — Supabase 기능이 비활성화됩니다')
}

function createSafeClient(extraHeaders = {}, storageKey = 'byeolsoom_anon') {
  if (!supabaseUrl || !supabaseAnonKey) return null
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: extraHeaders },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey },
    })
  } catch (e) {
    console.error('[별숨] Supabase 초기화 실패:', e)
    return null
  }
}

export const supabase = createSafeClient()

const _authClientCache = new Map()

/**
 * kakao_id를 x-kakao-id 헤더에 주입한 인증 클라이언트 반환.
 * RLS 정책에서 request.header('x-kakao-id')로 본인 데이터만 접근.
 * 동일 kakaoId에 대해 싱글턴 인스턴스를 재사용하여 GoTrueClient 중복 경고를 방지.
 * @param {string} kakaoId
 */
export function getAuthenticatedClient(kakaoId) {
  if (!kakaoId) return supabase
  const key = String(kakaoId)
  if (!_authClientCache.has(key)) {
    if (!supabaseUrl || !supabaseAnonKey) {
      _authClientCache.set(key, null)
    } else {
      try {
        _authClientCache.set(key, createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { 'x-kakao-id': key } },
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: `byeolsoom_auth_${key}` },
        }))
      } catch (e) {
        console.error('[별숨] 인증 클라이언트 초기화 실패:', e)
        _authClientCache.set(key, null)
      }
    }
  }
  return _authClientCache.get(key)
}

/** 로그아웃 시 호출 — stale 인증 클라이언트를 캐시에서 제거 */
export function clearAuthClient(kakaoId) {
  if (kakaoId) _authClientCache.delete(String(kakaoId))
}

export function clearAllAuthClients() {
  _authClientCache.clear()
}
