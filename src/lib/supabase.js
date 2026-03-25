import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[별숨] Supabase 환경변수가 없어요')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
