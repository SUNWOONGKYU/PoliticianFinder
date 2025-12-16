/**
 * Project Grid Task ID: P1F4
 * 작업명: 비밀번호 찾기 페이지 (폼)
 * 설명: 비밀번호 재설정 폼 - 이메일 요청 또는 새 비밀번호 입력
 * 수정: 2025-12-15 - 서버 사이드 코드 처리 후 리다이렉트되는 폼
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// 로딩 컴포넌트
function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// 메인 폼 컴포넌트
function PasswordResetFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 파라미터 확인
  const modeParam = searchParams.get('mode');
  const errorParam = searchParams.get('error');

  // 페이지 모드
  const [mode, setMode] = useState<'request' | 'reset' | 'success'>('request');

  // Form data
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    letter: false,
    number: false,
    special: false
  });

  // Password visibility
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // 초기화 - URL 파라미터 및 hash fragment 처리
  useEffect(() => {
    console.log('[Password Reset Form] Init:', { modeParam, errorParam, hash: window.location.hash });

    // 1. 에러 파라미터 확인
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setMode('request');
      return;
    }

    // 2. mode=reset 파라미터 확인 (route.ts에서 처리된 경우)
    if (modeParam === 'reset') {
      setMode('reset');
      return;
    }

    // 3. Supabase 인증 상태 변화 감지
    const supabase = createClient();

    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Password Reset Form] Current session:', session?.user?.email);
      if (session) {
        setMode('reset');
        // URL에서 hash 제거
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    // 인증 상태 변화 리스너 (hash fragment 자동 처리)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Password Reset Form] Auth state change:', event, session?.user?.email);

      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session) {
          console.log('[Password Reset Form] Recovery session detected, switching to reset mode');
          setMode('reset');
          // URL에서 hash 제거
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [modeParam, errorParam]);

  // 이메일 발송 요청
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || '이메일 발송에 실패했습니다.');
        return;
      }

      // 발송 성공 - 안내 메시지 표시
      setMode('success');
    } catch (err) {
      console.error('[Password Reset Form] Email submit error:', err);
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 변경
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const isValid = passwordRequirements.length && passwordRequirements.letter &&
                    passwordRequirements.number;

    if (!isValid) {
      setError('비밀번호 요구사항을 충족해주세요.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('[Password Reset Form] Update error:', updateError);

        if (updateError.message.includes('session') || updateError.message.includes('auth')) {
          setError('세션이 만료되었습니다. 새 인증 링크를 요청해주세요.');
          setTimeout(() => setMode('request'), 2000);
          return;
        }

        setError(updateError.message || '비밀번호 변경에 실패했습니다.');
        return;
      }

      console.log('[Password Reset Form] Password updated successfully');
      setMode('success');
    } catch (err) {
      console.error('[Password Reset Form] Error:', err);
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 유효성 검사
  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8 && password.length <= 16,
      letter: /[a-z]/.test(password),  // 소문자만 필수
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)  // 선택사항 (강도 계산용)
    };

    setPasswordRequirements(requirements);

    // 강도 계산: 필수 2개 + 선택 2개 (대문자, 특수문자)
    let strength = 0;
    if (requirements.length) strength++;
    if (requirements.letter && requirements.number) strength++;  // 필수 조건 충족
    if (/[A-Z]/.test(password)) strength++;  // 대문자 포함시 보너스
    if (requirements.special) strength++;  // 특수문자 포함시 보너스

    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    validatePassword(password);
  };

  const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthTexts = ['약함', '보통', '강함', '매우 강함'];
  const strengthWidths = ['25%', '50%', '75%', '100%'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="min-h-screen flex items-center justify-center px-4 py-12 flex-1">
        <div className="max-w-md w-full">

          {/* 이메일 요청 모드 */}
          {mode === 'request' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호를 잊으셨나요?</h2>
                <p className="text-gray-600">가입하신 이메일 주소를 입력하시면<br />비밀번호 재설정 링크를 보내드립니다.</p>
              </div>

              {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 mb-4">{error}</div>}

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    이메일 주소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium disabled:bg-gray-400 transition"
                >
                  {loading ? '발송 중...' : '인증 메일 보내기'}
                </button>

                <div className="text-center">
                  <Link href="/auth/login" className="text-sm text-gray-600 hover:text-primary-600">
                    로그인 페이지로 돌아가기
                  </Link>
                </div>
              </form>
            </div>
          )}

          {/* 비밀번호 변경 모드 */}
          {mode === 'reset' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">새 비밀번호 설정</h2>
                <p className="text-gray-600">안전한 비밀번호로 변경해주세요.</p>
              </div>

              {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 mb-4">{error}</div>}

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    새 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword1 ? 'text' : 'password'}
                      value={newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="8자 이상, 영문/숫자/특수문자 포함"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button type="button" onClick={() => setShowPassword1(!showPassword1)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>

                  {newPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${strengthColors[passwordStrength - 1] || 'bg-red-500'}`} style={{ width: strengthWidths[passwordStrength - 1] || '25%' }}></div>
                      </div>
                      <span className="text-sm font-medium">{strengthTexts[passwordStrength - 1] || '약함'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword2 ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="비밀번호를 다시 입력하세요"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">비밀번호 요구사항</h4>
                  <ul className="text-sm space-y-1">
                    <li className={passwordRequirements.length ? 'text-green-600' : 'text-gray-600'}>
                      {passwordRequirements.length ? '✓' : '○'} 8자 이상 16자 이하
                    </li>
                    <li className={passwordRequirements.letter ? 'text-green-600' : 'text-gray-600'}>
                      {passwordRequirements.letter ? '✓' : '○'} 영문 소문자 포함
                    </li>
                    <li className={passwordRequirements.number ? 'text-green-600' : 'text-gray-600'}>
                      {passwordRequirements.number ? '✓' : '○'} 숫자 포함
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium disabled:bg-gray-400 transition"
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            </div>
          )}

          {/* 성공 모드 */}
          {mode === 'success' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {modeParam === 'reset' ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호가 변경되었습니다</h2>
                    <p className="text-gray-600 mb-8">새로운 비밀번호로 로그인하실 수 있습니다.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">인증 메일을 발송했습니다</h2>
                    <p className="text-gray-600 mb-4">
                      <span className="font-bold text-primary-600">{email}</span> 주소로<br />
                      비밀번호 재설정 링크를 보냈습니다.
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                      이메일을 확인하고 링크를 클릭해주세요.
                    </p>
                  </>
                )}
                <Link href="/auth/login" className="inline-block w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium text-center">
                  로그인 페이지로 이동
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// 메인 페이지 컴포넌트 - Suspense 경계 포함
export default function PasswordResetFormPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="페이지 로딩 중..." />}>
      <PasswordResetFormContent />
    </Suspense>
  );
}
