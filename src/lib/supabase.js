import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[별숨] Supabase 환경변수가 없어요 — Supabase 기능이 비활성화됩니다')
}

function createSafeClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null
  try { return createClient(supabaseUrl, supabaseAnonKey) } catch (e) {
    console.error('[별숨] Supabase 초기화 실패:', e)
    return null
  }
}

export const supabase = createSafeClient()

// 연동 테스트 (브라우저 콘솔에서 확인용, 배포 전 삭제)
// import { supabase } from './supabase.js'
// const { data, error } = await supabase.from('users').select('count')
// console.log('[별숨] Supabase 연결 확인:', data, error)
