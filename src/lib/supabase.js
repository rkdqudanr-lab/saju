import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[별숨] Supabase 환경변수가 없어요 — Supabase 기능이 비활성화됩니다')
}

// GoTrueClient 인스턴스가 여러 개 생기지 않도록 클라이언트를 단 하나만 생성.
// x-kakao-id 헤더는 커스텀 fetch 래퍼로 동적 주입.
let _kakaoId = null

function customFetch(input, init = {}) {
  const headers = new Headers(init?.headers)
  if (_kakaoId) headers.set('x-kakao-id', _kakaoId)
  return fetch(input, { ...init, headers })
}

export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) return null
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: customFetch },
    })
  } catch (e) {
    console.error('[별숨] Supabase 초기화 실패:', e)
    return null
  }
})()

/**
 * kakao_id를 x-kakao-id 헤더에 주입한 클라이언트 반환.
 * RLS 정책에서 request.header('x-kakao-id')로 본인 데이터만 접근.
 * 단일 클라이언트 인스턴스를 재사용하므로 GoTrueClient 중복 경고가 발생하지 않음.
 * @param {string} kakaoId
 */
export function getAuthenticatedClient(kakaoId) {
  _kakaoId = kakaoId ? String(kakaoId) : null
  return supabase
}
