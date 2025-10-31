/**
 * Project Grid Task ID: P1BI2
 * 작업명: 인증 헬퍼 함수
 * 생성시간: 2025-10-31 14:29
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1BI1
 * 설명: 인증 관련 유틸리티 함수
 */

import { supabase } from './P1BI1_supabase_client';

export async function signUp(email: string, password: string, name?: string) {
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

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  return { session, error };
}
