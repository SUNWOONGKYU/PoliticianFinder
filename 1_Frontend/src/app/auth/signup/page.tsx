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
    full_name: '',
    terms_service: false,
    terms_privacy: false,
    terms_marketing: false
  });

  const [error, setError] = useState('');
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
      terms_service: newState,
      terms_privacy: newState,
      terms_marketing: newState
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.terms_service || !formData.terms_privacy) {
      setError('필수 약관에 동의해주세요.');
      return;
    }

    setLoading(true);
    try {
      // API 호출 (P1BA1)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || '회원가입에 실패했습니다.');
        return;
      }

      window.location.href = '/login?message=회원가입이 완료되었습니다.';
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
                로그인
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 bg-white p-5 rounded-lg shadow-md">
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
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

            {/* Full Name */}
            <div className="space-y-2.5">
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                실명 <span className="text-gray-500">(선택)</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="실명을 입력하세요"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 placeholder-gray-400 text-sm"
              />
            </div>

            {/* Terms Agreement */}
            <div className="space-y-1.5 pt-2 border-t">
              {/* All Terms */}
              <div className="flex items-center">
                <input
                  id="terms-all"
                  type="checkbox"
                  checked={termsAll}
                  onChange={handleTermsAll}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="terms-all" className="ml-2 block text-sm font-medium text-gray-700">
                  전체 동의
                </label>
              </div>

              {/* Individual Terms */}
              <div className="border-t pt-1.5 space-y-1">
                <div className="flex items-center">
                  <input
                    id="terms-service"
                    name="terms_service"
                    type="checkbox"
                    checked={formData.terms_service}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="terms-service" className="ml-2 block text-sm text-gray-700">
                    (필수) 이용약관 동의
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="terms-privacy"
                    name="terms_privacy"
                    type="checkbox"
                    checked={formData.terms_privacy}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="terms-privacy" className="ml-2 block text-sm text-gray-700">
                    (필수) 개인정보 수집 및 이용 동의
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="terms-marketing"
                    name="terms_marketing"
                    type="checkbox"
                    checked={formData.terms_marketing}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms-marketing" className="ml-2 block text-sm text-gray-700">
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
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google로 가입
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
