/**
 * Project Grid Task ID: P1F4-2
 * 작업명: 비밀번호 재설정 리다이렉트 페이지
 * 설명: Supabase 비밀번호 재설정 이메일 링크 처리 (클라이언트 사이드)
 * 생성: 2025-12-15
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// URL hash에서 파라미터 추출
function parseHashParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!hash || hash.length <= 1) return params;

  const hashContent = hash.substring(1); // # 제거
  const pairs = hashContent.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }

  return params;
}

export default function PasswordResetPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handlePasswordReset = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const urlParams = new URLSearchParams(search);
      const code = urlParams.get('code');

      console.log('[Password Reset] Starting...', { hash, search, code, href: window.location.href });

      const supabase = createClient();

      // 0-1. token_hash 파라미터 확인 (OTP 방식)
      const tokenHash = urlParams.get('token_hash');
      const type = urlParams.get('type');

      if (tokenHash && type === 'recovery') {
        console.log('[Password Reset] Found token_hash, verifying OTP...');

        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          });

          if (error) {
            console.error('[Password Reset] verifyOtp error:', error);
            router.replace(`/auth/password-reset/form?error=${encodeURIComponent('인증 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 요청해주세요.')}`);
            return;
          }

          if (data.session) {
            console.log('[Password Reset] OTP verified, session created');
            router.replace('/auth/password-reset/form?mode=reset');
            return;
          }
        } catch (err) {
          console.error('[Password Reset] verifyOtp exception:', err);
          router.replace(`/auth/password-reset/form?error=${encodeURIComponent('인증 처리 중 오류가 발생했습니다.')}`);
          return;
        }
      }

      // 0-2. PKCE code 파라미터 확인 (?code=xxx)
      if (code) {
        console.log('[Password Reset] Found PKCE code, exchanging for session...');

        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[Password Reset] exchangeCodeForSession error:', error);
            router.replace(`/auth/password-reset/form?error=${encodeURIComponent('인증 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 요청해주세요.')}`);
            return;
          }

          if (data.session) {
            console.log('[Password Reset] PKCE session created successfully');
            router.replace('/auth/password-reset/form?mode=reset');
            return;
          }
        } catch (err) {
          console.error('[Password Reset] exchangeCodeForSession exception:', err);
          router.replace(`/auth/password-reset/form?error=${encodeURIComponent('인증 처리 중 오류가 발생했습니다.')}`);
          return;
        }
      }

      // 1. URL hash fragment 확인 (#access_token=xxx&type=recovery)
      if (hash && hash.includes('access_token')) {
        console.log('[Password Reset] Found access_token in hash, parsing...');

        const hashParams = parseHashParams(hash);
        console.log('[Password Reset] Hash params:', Object.keys(hashParams));

        const accessToken = hashParams['access_token'];
        const refreshToken = hashParams['refresh_token'];
        const type = hashParams['type'];

        if (accessToken && refreshToken) {
          console.log('[Password Reset] Setting session manually...');

          try {
            // 수동으로 세션 설정
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (error) {
              console.error('[Password Reset] setSession error:', error);
              setErrorMessage('세션 설정에 실패했습니다. 새 링크를 요청해주세요.');
              setStatus('error');
              return;
            }

            if (data.session) {
              console.log('[Password Reset] Session set successfully, redirecting...');
              // URL에서 hash 제거 후 리다이렉트
              window.history.replaceState(null, '', window.location.pathname);
              router.replace('/auth/password-reset/form?mode=reset');
              return;
            }
          } catch (err) {
            console.error('[Password Reset] setSession exception:', err);
          }
        }

        // access_token만 있고 refresh_token이 없는 경우 - onAuthStateChange 사용
        console.log('[Password Reset] Waiting for auth state change...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[Password Reset] Auth event:', event, session?.user?.email);

          if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
            console.log('[Password Reset] Auth event received, redirecting...');
            subscription.unsubscribe();
            window.history.replaceState(null, '', window.location.pathname);
            router.replace('/auth/password-reset/form?mode=reset');
          }
        });

        // 타임아웃 (5초)
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('[Password Reset] Session found after timeout');
            subscription.unsubscribe();
            router.replace('/auth/password-reset/form?mode=reset');
          } else {
            console.log('[Password Reset] No session after timeout');
            subscription.unsubscribe();
            setErrorMessage('인증에 실패했습니다. 새 링크를 요청해주세요.');
            setStatus('error');
          }
        }, 5000);

        return;
      }

      // 2. 현재 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[Password Reset] Existing session found');
        router.replace('/auth/password-reset/form?mode=reset');
        return;
      }

      // 3. 파라미터 없음 - 이메일 입력 폼으로
      console.log('[Password Reset] No auth params, redirecting to form');
      router.replace('/auth/password-reset/form');
    };

    handlePasswordReset();
  }, [router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">인증 실패</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push('/auth/password-reset/form')}
            className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
          >
            새 인증 링크 요청하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-gray-600">인증 확인 중...</p>
      </div>
    </div>
  );
}
