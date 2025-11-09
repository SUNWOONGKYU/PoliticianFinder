/**
 * Project Grid Task ID: P1BI1
 * 작업명: Supabase 클라이언트
 * 생성시간: 2025-11-01
 * 생성자: Gemini
 * 의존성: P1D1, P1D4, P1D5
 * 설명: Supabase 클라이언트를 초기화하고, 인증 관련 헬퍼 함수들을 제공합니다. 이 클라이언트는 앱 전체에서 Supabase와 통신하는 데 사용됩니다.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Supabase 클라이언트 생성
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// =============================================
// Auth 헬퍼 함수
// =============================================

/**
 * 이메일과 비밀번호로 새로운 사용자를 등록합니다.
 */
export async function signUpWithEmail(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });
  return { data, error };
}

/**
 * 이메일과 비밀번호로 사용자를 로그인합니다.
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * 현재 사용자를 로그아웃합니다.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * 현재 인증된 사용자 정보를 가져옵니다.
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * 현재 세션 정보를 가져옵니다.
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export default supabase;
