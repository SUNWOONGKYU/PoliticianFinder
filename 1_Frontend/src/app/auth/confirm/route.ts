// P3BA1-2: Email Verification Confirm Route
/**
 * Project Grid Task ID: P3BA1-2
 * 작업명: 이메일 인증 확인 라우트 (Supabase 호환)
 * 생성시간: 2025-12-13
 * 생성자: Claude-Opus-4.5
 * 의존성: P3BA1
 * 설명: Supabase 이메일 인증 링크 처리 (/auth/confirm)
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 이메일 인증 확인 핸들러
 *
 * @description Supabase가 이메일 인증 링크 클릭 시 이 엔드포인트로 리다이렉트
 * @route GET /auth/confirm
 * @access Public
 *
 * @param {string} token_hash - Supabase 토큰 해시 (URL 파라미터)
 * @param {string} type - 인증 타입 (signup, recovery, email 등)
 * @param {string} next - 인증 후 이동할 경로 (선택)
 *
 * @returns {302} Redirect to login page with success/error message
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/auth/login';

  console.log('[이메일 인증 확인] 시작:', {
    token_hash: token_hash?.substring(0, 10) + '...',
    type,
    next,
    url: request.url
  });

  if (token_hash && type) {
    const cookieStore = await cookies();

    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Verify email using token hash
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      console.error('[이메일 인증 확인] 오류:', {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      // Determine user-friendly error message based on error type
      let userMessage = '이메일 인증에 실패했습니다.';

      if (error.message.includes('expired') || error.message.includes('invalid')) {
        userMessage = '인증 링크가 만료되었거나 이미 사용되었습니다. 다시 회원가입을 시도해주세요.';
      } else if (error.message.includes('already confirmed')) {
        userMessage = '이미 인증이 완료된 계정입니다. 로그인해주세요.';
      }

      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(userMessage)}`
      );
    }

    console.log('[이메일 인증 확인] 성공:', { userId: data?.user?.id, email: data?.user?.email });

    // Success: redirect to login with success message
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?verified=true&message=${encodeURIComponent('이메일 인증이 완료되었습니다! 로그인해주세요.')}`
    );
  }

  // No token_hash or type provided
  console.error('[이메일 인증 확인] token_hash 또는 type 파라미터 없음:', {
    url: request.url,
    searchParams: Object.fromEntries(requestUrl.searchParams)
  });

  return NextResponse.redirect(
    `${requestUrl.origin}/auth/login?error=${encodeURIComponent('잘못된 인증 링크입니다.')}`
  );
}
