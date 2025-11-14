// P3BA1-1: Email Verification Callback
/**
 * Project Grid Task ID: P3BA1-1
 * 작업명: 이메일 인증 콜백 API
 * 생성시간: 2025-11-12
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P3BA1
 * 설명: Supabase 이메일 인증 후 콜백 처리
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 이메일 인증 콜백 핸들러
 *
 * @description Supabase가 이메일 인증 링크 클릭 시 이 엔드포인트로 리다이렉트
 * @route GET /auth/callback
 * @access Public
 *
 * @param {string} code - Supabase 인증 코드 (URL 파라미터)
 * @param {string} next - 인증 후 이동할 경로 (선택)
 *
 * @returns {302} Redirect to login page with success message
 * @returns {302} Redirect to login page with error message
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/auth/login';

  console.log('[이메일 인증 콜백] 시작:', { token_hash: token_hash?.substring(0, 10) + '...', type, next });

  if (token_hash && type) {
    const cookieStore = cookies();

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
      console.error('[이메일 인증] 오류:', {
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

    console.log('[이메일 인증] 성공:', { userId: data?.user?.id, email: data?.user?.email });

    // Success: redirect to login WITHOUT code parameter
    // The login page will clean up any remaining URL parameters
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?verified=true&message=${encodeURIComponent('이메일 인증이 완료되었습니다! 로그인해주세요.')}`
    );
  }

  // No token_hash or type provided
  console.error('[이메일 인증] token_hash 또는 type 파라미터 없음');
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/login?error=${encodeURIComponent('잘못된 인증 링크입니다.')}`
  );
}
