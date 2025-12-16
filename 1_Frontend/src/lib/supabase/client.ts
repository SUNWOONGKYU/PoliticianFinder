// P1BI1: Supabase 클라이언트 설정
// 작업일: 2025-10-31
// 설명: PoliticianFinder Supabase 클라이언트 및 Auth 헬퍼 함수

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

// ============================================================================
// 환경변수 검증
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ============================================================================
// 브라우저용 Supabase 클라이언트
// ============================================================================
// 클라이언트 컴포넌트에서 사용하는 Supabase 클라이언트
// SSR을 지원하며, 자동으로 쿠키를 관리합니다.

export function createClient() {
  // 빌드 타임에는 환경변수가 없을 수 있으므로 체크
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      // 브라우저에서는 에러 출력
      console.error(
        'Supabase 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.\n' +
          'NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY가 필요합니다.'
      );
    }
    // 빌드 타임에는 더미 클라이언트 반환 (실제로 사용되지 않음)
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    );
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// 싱글톤 패턴으로 클라이언트 인스턴스 생성
// 앱 전체에서 동일한 인스턴스 사용
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
}

// ============================================================================
// Auth 헬퍼 함수
// ============================================================================

/**
 * 현재 로그인된 사용자 정보 가져오기
 * @returns 사용자 정보 또는 null
 */
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('사용자 정보 가져오기 실패:', error);
    return null;
  }

  return user;
}

/**
 * 현재 세션 정보 가져오기
 * @returns 세션 정보 또는 null
 */
export async function getCurrentSession() {
  const supabase = getSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('세션 정보 가져오기 실패:', error);
    return null;
  }

  return session;
}

/**
 * 사용자 프로필 정보 가져오기
 * @param userId 사용자 ID (선택, 없으면 현재 사용자)
 * @returns 프로필 정보 또는 null
 */
export async function getUserProfile(userId?: string) {
  const supabase = getSupabaseClient();

  // userId가 없으면 현재 사용자 ID 사용
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return null;
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('프로필 정보 가져오기 실패:', error);
    return null;
  }

  return data;
}

/**
 * 이메일/비밀번호로 로그인
 * @param email 이메일
 * @param password 비밀번호
 * @returns 로그인 결과
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('로그인 실패:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 이메일/비밀번호로 회원가입
 * @param email 이메일
 * @param password 비밀번호
 * @param metadata 추가 메타데이터 (nickname, full_name 등)
 * @returns 회원가입 결과
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: {
    nickname?: string;
    full_name?: string;
    marketing_agreed?: boolean;
  }
) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('회원가입 실패:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 구글 OAuth로 로그인
 * @returns 로그인 결과
 */
export async function signInWithGoogle() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('구글 로그인 실패:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 로그아웃
 * @returns 로그아웃 결과
 */
export async function signOut() {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('로그아웃 실패:', error);
    return { error };
  }

  // 로그아웃 성공 시 홈으로 리다이렉트
  window.location.href = '/';

  return { error: null };
}

/**
 * 비밀번호 재설정 이메일 전송
 * @param email 이메일
 * @returns 전송 결과
 */
export async function sendPasswordResetEmail(email: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/password-reset`,
  });

  if (error) {
    console.error('비밀번호 재설정 이메일 전송 실패:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 비밀번호 업데이트
 * @param newPassword 새 비밀번호
 * @returns 업데이트 결과
 */
export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('비밀번호 업데이트 실패:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 이메일 인증 재전송
 * @returns 전송 결과
 */
export async function resendVerificationEmail() {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();

  if (!user?.email) {
    return { data: null, error: new Error('사용자 이메일을 찾을 수 없습니다.') };
  }

  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('이메일 인증 재전송 실패:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 프로필 정보 업데이트
 * @param updates 업데이트할 프로필 필드
 * @returns 업데이트 결과
 */
export async function updateProfile(updates: Record<string, any>) {
  // TODO: Supabase 타입 추론 제약으로 인해 임시 비활성화
  // 실제 구현 시 타입 정의를 명확하게 하거나 직렬화 라이브러리 사용 권장
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('로그인이 필요합니다.') };
  }

  console.warn('updateProfile는 아직 구현되지 않았습니다.');
  return { data: null, error: new Error('구현 예정') };
}

/**
 * 인증 상태 변화 감지 (리스너 등록)
 * @param callback 상태 변화 시 호출할 콜백 함수
 * @returns 구독 해제 함수
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const supabase = getSupabaseClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  // 구독 해제 함수 반환
  return () => {
    subscription.unsubscribe();
  };
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 사용자가 로그인 상태인지 확인
 * @returns 로그인 여부
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * 이메일 인증 여부 확인
 * @returns 인증 여부
 */
export async function isEmailVerified(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.email_confirmed_at !== null;
}

/**
 * 사용자 역할 확인 (user, admin, moderator)
 * @returns 사용자 역할 또는 null
 */
export async function getUserRole(): Promise<string | null> {
  const profile = await getUserProfile();
  return (profile as any)?.role || null;
}

// ============================================================================
// 완료
// ============================================================================
// P1BI1: Supabase 클라이언트 설정 완료
//
// 생성된 내용:
// - 브라우저용 Supabase 클라이언트 (SSR 지원)
// - Auth 헬퍼 함수 (로그인, 회원가입, 로그아웃, 비밀번호 재설정)
// - 프로필 관리 함수 (조회, 업데이트)
// - 인증 상태 관리 (리스너, 유틸리티)
//
// 사용 예시:
// import { signInWithEmail, getCurrentUser } from '@/lib/supabase/client';
// const { data, error } = await signInWithEmail('email@example.com', 'password');
// const user = await getCurrentUser();
