/**
 * Project Grid Task ID: P1F2, P7F1
 * 작업명: 로그인 페이지 + 리다이렉트 처리
 * 설명: 사용자 로그인 기능 구현, 인증 후 원래 페이지 리다이렉트
 * P7F1 수정: Open Redirect 취약점 수정 (2025-12-18)
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // URL 파라미터에서 메시지와 에러 읽기
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlMessage = searchParams.get('message');
    const urlError = searchParams.get('error');
    const urlCode = searchParams.get('code');

    // message나 error가 있으면 표시
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
    }
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }

    // CRITICAL: URL을 즉시 정리하여 PKCE 에러 방지
    // code 파라미터가 있으면 반드시 제거
    if (urlCode || urlMessage || urlError) {
      const cleanUrl = window.location.pathname;
      // 즉시 URL 정리 - 이렇게 하지 않으면 Supabase가 code를 처리하려고 시도함
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    setLoading(true);
    try {
      // API 호출 (P1BA2)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || data.message || '로그인에 실패했습니다.');
        return;
      }

      // P7F1: 로그인 성공 후 원래 페이지로 리다이렉트 또는 홈으로 이동
      // P7F1 보안 수정: Open Redirect 취약점 방지 - 내부 경로만 허용
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');
      let safeRedirect = '/';

      if (redirectUrl) {
        const decoded = decodeURIComponent(redirectUrl);
        // 상대 경로('/'로 시작)이면서 '//'로 시작하지 않는 경우만 허용
        // 외부 URL(https://evil.com)이나 프로토콜 상대 URL(//evil.com)은 차단
        if (decoded.startsWith('/') && !decoded.startsWith('//')) {
          safeRedirect = decoded;
        }
      }

      window.location.href = safeRedirect;
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Google OAuth API로 리다이렉트
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex items-center justify-center flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md w-full space-y-4">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
            {!error && !message && (
              <p className="mt-1 text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-1">
                  회원가입
                </Link>
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
            {/* Message Display */}
            {message && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm text-green-700">{message}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                    {error.includes('만료') && (
                      <p className="mt-2 text-xs text-red-600">
                        <Link href="/auth/signup" className="underline font-medium">
                          새로 회원가입하기 →
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email - 모바일 최적화 */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 placeholder-gray-400 text-base touch-manipulation"
                required
              />
            </div>

            {/* Password - 모바일 최적화 */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 placeholder-gray-400 text-base touch-manipulation"
                required
              />
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between min-h-[44px]">
              <label htmlFor="remember" className="flex items-center min-h-[44px] cursor-pointer">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  로그인 상태 유지
                </span>
              </label>
              <Link
                href="/auth/password-reset"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-1 min-h-[44px] flex items-center"
              >
                비밀번호 찾기
              </Link>
            </div>

            {/* Login Button - 모바일 최적화 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center min-h-[44px] py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-primary-500 hover:bg-primary-600 active:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 transition touch-manipulation"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            {/* Social Login */}
            <div className="pt-2 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full inline-flex justify-center items-center gap-2 min-h-[44px] py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-base font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-300 transition touch-manipulation"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              구글로 계속하기
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
