import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[별숨] Supabase 환경변수가 없어요')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 연동 테스트 (브라우저 콘솔에서 확인용, 배포 전 삭제)
// import { supabase } from './supabase.js'
// const { data, error } = await supabase.from('users').select('count')
// console.log('[별숨] Supabase 연결 확인:', data, error)
