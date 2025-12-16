/**
 * Project Grid Task ID: P1F3
 * 작업명: 회원가입 페이지 (2단계: React 컴포넌트로 변환)
 * 설명: 프로토타입 signup.html을 기반으로 React로 100% 동일하게 구현
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    nickname: '',
    terms_agreed: false,
    privacy_agreed: false,
    marketing_agreed: false
  });

  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [termsAll, setTermsAll] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTermsAll = () => {
    const newState = !termsAll;
    setTermsAll(newState);
    setFormData(prev => ({
      ...prev,
      terms_agreed: newState,
      privacy_agreed: newState,
      marketing_agreed: newState
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDetails([]);

    if (!formData.terms_agreed || !formData.privacy_agreed) {
      setError('필수 약관에 동의해주세요.');
      return;
    }

    setLoading(true);
    try {
      // API 호출 - 필드 이름을 API 스키마에 맞게 변환
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          password_confirm: formData.password_confirm,
          nickname: formData.nickname,
          terms_agreed: formData.terms_agreed,
          privacy_agreed: formData.privacy_agreed,
          marketing_agreed: formData.marketing_agreed,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Signup error:', data);

        // 오류 메시지 설정
        const errorMessage = data.error?.message || data.message || '회원가입에 실패했습니다.';
        setError(errorMessage);

        // 상세 오류 정보 수집
        const details: string[] = [];

        // 오류 코드별 추가 안내
        if (data.error?.code) {
          switch (data.error.code) {
            case 'VALIDATION_ERROR':
              if (data.error.details) {
                Object.entries(data.error.details).forEach(([field, msgs]) => {
                  if (Array.isArray(msgs)) {
                    msgs.forEach(msg => details.push(`• ${msg}`));
                  }
                });
              }
              break;
            case 'WEAK_PASSWORD':
              if (data.error.details?.suggestions) {
                details.push('비밀번호 요구사항:');
                data.error.details.suggestions.forEach((s: string) => details.push(`• ${s}`));
              }
              break;
            case 'EMAIL_ALREADY_EXISTS':
              details.push('• 다른 이메일 주소를 사용해 주세요.');
              details.push('• 이미 가입하셨다면 로그인해 주세요.');
              break;
            case 'RATE_LIMIT_EXCEEDED':
              details.push('• 너무 많은 시도가 있었습니다.');
              details.push('• 잠시 후 다시 시도해 주세요.');
              break;
            case 'PROFILE_CREATION_FAILED':
              if (data.error.hint) {
                details.push(`• 힌트: ${data.error.hint}`);
              }
              break;
          }
        }

        setErrorDetails(details);
        return;
      }

      window.location.href = '/auth/login?message=회원가입이 완료되었습니다. 이메일 인증을 완료해 주세요.';
    } catch (err) {
      setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Google OAuth API로 리다이렉트
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex items-center justify-center flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md w-full space-y-3">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
            <p className="mt-1 text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-1">
                로그인
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 bg-white p-5 rounded-lg shadow-md">
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                <p className="font-medium">{error}</p>
                {errorDetails.length > 0 && (
                  <ul className="mt-2 space-y-1 text-red-600">
                    {errorDetails.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 placeholder-gray-400 text-sm"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="8자 이상 영문 소문자, 숫자 조합"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 placeholder-gray-400 text-sm"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                비밀번호는 최소 8자 이상이어야 합니다.
              </p>
            </div>

            {/* Password Confirm */}
            <div className="space-y-2.5">
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={handleInputChange}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 placeholder-gray-400 text-sm"
                required
              />
            </div>

            {/* Nickname */}
            <div className="space-y-2.5">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임 <span className="text-red-500">*</span>
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                value={formData.nickname}
                onChange={handleInputChange}
                placeholder="2-10자 이내"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 placeholder-gray-400 text-sm"
                required
              />
            </div>


            {/* Terms Agreement */}
            <div className="space-y-1.5 pt-2">
              {/* All Terms */}
              <div className="flex items-start">
                <input
                  id="terms-all"
                  type="checkbox"
                  checked={termsAll}
                  onChange={handleTermsAll}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                />
                <label htmlFor="terms-all" className="ml-2 text-sm font-medium text-gray-900 cursor-pointer">
                  전체 동의
                </label>
              </div>

              {/* Individual Terms */}
              <div className="border-t pt-1.5 space-y-1">
                <div className="flex items-start min-h-[44px]">
                  <input
                    id="terms-agreed"
                    name="terms_agreed"
                    type="checkbox"
                    checked={formData.terms_agreed}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                    required
                  />
                  <label htmlFor="terms-agreed" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    (필수) 이용약관 동의
                  </label>
                </div>

                <div className="flex items-start min-h-[44px]">
                  <input
                    id="privacy-agreed"
                    name="privacy_agreed"
                    type="checkbox"
                    checked={formData.privacy_agreed}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                    required
                  />
                  <label htmlFor="privacy-agreed" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    (필수) 개인정보 수집 및 이용 동의
                  </label>
                </div>

                <div className="flex items-start min-h-[44px]">
                  <input
                    id="marketing-agreed"
                    name="marketing_agreed"
                    type="checkbox"
                    checked={formData.marketing_agreed}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                  />
                  <label htmlFor="marketing-agreed" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    (선택) 마케팅 정보 수신 동의
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 transition pt-2"
            >
              {loading ? '가입 중...' : '회원가입'}
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
              onClick={handleGoogleSignup}
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
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
