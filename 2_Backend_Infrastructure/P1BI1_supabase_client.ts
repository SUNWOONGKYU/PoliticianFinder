/**
 * Project Grid Task ID: P1BI1
 * 작업명: Supabase 클라이언트
 * 생성시간: 2025-10-31 14:28
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1D1
 * 설명: Supabase 클라이언트 초기화
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
